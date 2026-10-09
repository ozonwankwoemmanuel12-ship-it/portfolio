#!/usr/bin/env python3
"""Local Form & Field storefront and SQLite-backed JSON API."""
import hashlib
import hmac
import json
import logging
import math
import mimetypes
import os
import re
import secrets
import sqlite3
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / "store.db"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "8000"))
PASSWORD_ROUNDS = 16_384
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL, password_salt TEXT NOT NULL, is_admin INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
  price REAL NOT NULL CHECK(price >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
  image_url TEXT NOT NULL, category_id INTEGER NOT NULL REFERENCES categories(id),
  badge TEXT NOT NULL DEFAULT 'Considered', featured INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS cart (
  id INTEGER PRIMARY KEY, user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  guest_id TEXT UNIQUE, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK(user_id IS NOT NULL OR guest_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY, cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id), quantity INTEGER NOT NULL CHECK(quantity > 0),
  UNIQUE(cart_id, product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  total REAL NOT NULL, status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id), product_name TEXT NOT NULL,
  unit_price REAL NOT NULL, quantity INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount REAL NOT NULL, method TEXT NOT NULL, status TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
  product_id INTEGER NOT NULL REFERENCES products(id), rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
  body TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, product_id)
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""

SEED_PRODUCTS = [
    ("The Everyday Tote", "A roomy, beautifully simple carryall in sturdy natural canvas, finished with comfortable cotton handles.", 48, 18, "photo-1553062407-98eeb64c6a62", "Accessories", "BESTSELLER", 1),
    ("Sunday Ceramic Set", "Hand-finished stoneware with a soft, tactile glaze. A set of two cups for slow mornings.", 64, 12, "photo-1514228742587-6b1558fcca3d", "Home", "SMALL BATCH", 1),
    ("The Weekender", "An easy, durable weekend companion with thoughtful pockets and room for one more thing.", 118, 9, "photo-1553062407-98eeb64c6a62", "Accessories", "NEW ARRIVAL", 1),
    ("Olive Glass Carafe", "A sculptural recycled-glass carafe with a gentle olive tint. Lovely on the table, useful every day.", 42, 20, "photo-1513558161293-cdaf765edfd7", "Home", "JUST IN", 0),
    ("Soft Form Throw", "A generous woven cotton throw with a relaxed, lived-in texture for cooler evenings.", 96, 8, "photo-1600210492486-724fe5c67fb0", "Lifestyle", "MADE TO KEEP", 1),
    ("Field Notes Journal", "A tactile, lay-flat journal made with recycled paper for lists, sketches, and the in-between thoughts.", 24, 35, "photo-1544947950-fa07a98d237f", "Lifestyle", "EVERYDAY FAVOURITE", 0),
    ("Linen Market Bag", "A lightweight, naturally textured bag that folds away neatly and comes along everywhere.", 36, 22, "photo-1590874103328-eac38a683ce7", "Accessories", "LOW IMPACT", 0),
    ("Quiet Hour Candle", "A clean-burning soy candle with notes of cedar, bergamot, and a little fresh air.", 38, 16, "photo-1603006905003-be475563bc59", "Home", "SMALL BATCH", 0),
]


def connect():
    connection = sqlite3.connect(DATABASE, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def hash_password(password, salt=None):
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=PASSWORD_ROUNDS, r=8, p=1)
    return digest.hex(), salt.hex()


def seed_database():
    with connect() as db:
        db.executescript(SCHEMA)
        for name in ("Home", "Accessories", "Lifestyle"):
            db.execute("INSERT OR IGNORE INTO categories(name) VALUES (?)", (name,))
        if db.execute("SELECT COUNT(*) FROM products").fetchone()[0] == 0:
            for name, description, price, stock, image, category, badge, featured in SEED_PRODUCTS:
                category_id = db.execute("SELECT id FROM categories WHERE name = ?", (category,)).fetchone()[0]
                image_url = f"https://images.unsplash.com/{image}?auto=format&fit=crop&w=900&q=82"
                db.execute(
                    "INSERT INTO products(name,description,price,stock,image_url,category_id,badge,featured) VALUES (?,?,?,?,?,?,?,?)",
                    (name, description, price, stock, image_url, category_id, badge, featured),
                )
        admin_email = "admin@formandfield.test"
        if not db.execute("SELECT 1 FROM users WHERE email = ?", (admin_email,)).fetchone():
            password_hash, salt = hash_password("Admin123!")
            db.execute(
                "INSERT INTO users(name,email,password_hash,password_salt,is_admin) VALUES (?,?,?,?,1)",
                ("Form & Field Admin", admin_email, password_hash, salt),
            )


class APIError(Exception):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def user_json(row):
    return {"id": row["id"], "name": row["name"], "email": row["email"], "is_admin": bool(row["is_admin"])}


class StoreHandler(BaseHTTPRequestHandler):
    server_version = "FormField/1.0"

    def send_json(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def read_json(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            raise APIError("Invalid Content-Length.")
        if length > 1_000_000:
            raise APIError("Request body is too large.", 413)
        try:
            value = json.loads(self.rfile.read(length) or b"{}")
        except (json.JSONDecodeError, UnicodeDecodeError):
            raise APIError("Request body must be valid JSON.")
        if not isinstance(value, dict):
            raise APIError("Request body must be a JSON object.")
        return value

    def current_user(self, db, required=False):
        header = self.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            if required:
                raise APIError("Please sign in to continue.", 401)
            return None
        token_hash = hashlib.sha256(header[7:].encode("utf-8")).hexdigest()
        row = db.execute(
            "SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=?",
            (token_hash,),
        ).fetchone()
        if not row and required:
            raise APIError("Your session has expired. Please sign in again.", 401)
        return row

    def require_admin(self, db):
        user = self.current_user(db, required=True)
        if not user["is_admin"]:
            raise APIError("Administrator access is required.", 403)
        return user

    def cart_for(self, db, user=None, create=True):
        if user:
            cart = db.execute("SELECT * FROM cart WHERE user_id=?", (user["id"],)).fetchone()
            if not cart and create:
                cursor = db.execute("INSERT INTO cart(user_id) VALUES (?)", (user["id"],))
                cart = db.execute("SELECT * FROM cart WHERE id=?", (cursor.lastrowid,)).fetchone()
        else:
            guest_id = self.headers.get("X-Guest-Id", "")
            if not re.fullmatch(r"[A-Za-z0-9-]{12,80}", guest_id):
                raise APIError("A valid guest cart ID is required.")
            cart = db.execute("SELECT * FROM cart WHERE guest_id=?", (guest_id,)).fetchone()
            if not cart and create:
                cursor = db.execute("INSERT INTO cart(guest_id) VALUES (?)", (guest_id,))
                cart = db.execute("SELECT * FROM cart WHERE id=?", (cursor.lastrowid,)).fetchone()
        return cart

    def merge_guest_cart(self, db, user):
        guest_id = self.headers.get("X-Guest-Id", "")
        if not re.fullmatch(r"[A-Za-z0-9-]{12,80}", guest_id):
            return
        guest = db.execute("SELECT * FROM cart WHERE guest_id=?", (guest_id,)).fetchone()
        if not guest:
            return
        user_cart = self.cart_for(db, user)
        lines = db.execute(
            "SELECT cart_items.product_id,cart_items.quantity,products.stock,products.active "
            "FROM cart_items JOIN products ON products.id=cart_items.product_id WHERE cart_items.cart_id=?",
            (guest["id"],),
        ).fetchall()
        for line in lines:
            if not line["active"] or line["stock"] < 1:
                continue
            existing = db.execute(
                "SELECT quantity FROM cart_items WHERE cart_id=? AND product_id=?",
                (user_cart["id"], line["product_id"]),
            ).fetchone()
            quantity = min(99, line["stock"], line["quantity"] + (existing["quantity"] if existing else 0))
            db.execute(
                "INSERT INTO cart_items(cart_id,product_id,quantity) VALUES (?,?,?) "
                "ON CONFLICT(cart_id,product_id) DO UPDATE SET quantity=excluded.quantity",
                (user_cart["id"], line["product_id"], quantity),
            )
        db.execute("DELETE FROM cart WHERE id=?", (guest["id"],))

    def do_GET(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/"):
            return self.serve_static(parsed.path)
        try:
            with connect() as db:
                path = unquote(parsed.path)
                if path == "/api/categories":
                    rows = db.execute("SELECT id,name FROM categories ORDER BY id").fetchall()
                    return self.send_json([dict(row) for row in rows])
                if path == "/api/products":
                    params = parse_qs(parsed.query)
                    sql = "SELECT products.*,categories.name AS category_name FROM products JOIN categories ON categories.id=products.category_id WHERE products.active=1"
                    values = []
                    if params.get("q", [""])[0].strip():
                        term = f"%{params['q'][0].strip()}%"
                        sql += " AND (products.name LIKE ? OR products.description LIKE ? OR categories.name LIKE ?)"
                        values.extend((term, term, term))
                    if params.get("category", [""])[0]:
                        sql += " AND categories.name=?"
                        values.append(params["category"][0])
                    for key, operator in (("min_price", ">="), ("max_price", "<=")):
                        if params.get(key):
                            try:
                                price = float(params[key][0])
                            except ValueError:
                                raise APIError(f"{key} must be a number.")
                            if not math.isfinite(price) or price < 0:
                                raise APIError(f"{key} must be a finite, nonnegative number.")
                            sql += f" AND products.price {operator} ?"
                            values.append(price)
                    sql += " ORDER BY products.featured DESC, products.id"
                    return self.send_json([dict(row) for row in db.execute(sql, values).fetchall()])
                match = re.fullmatch(r"/api/products/(\d+)", path)
                if match:
                    product = db.execute(
                        "SELECT products.*,categories.name AS category_name FROM products JOIN categories ON categories.id=products.category_id WHERE products.id=? AND products.active=1",
                        (match.group(1),),
                    ).fetchone()
                    if not product:
                        raise APIError("Product not found.", 404)
                    return self.send_json(dict(product))
                if path == "/api/cart":
                    cart = self.cart_for(db, self.current_user(db))
                    rows = db.execute(
                        "SELECT cart_items.id,cart_items.product_id,cart_items.quantity,products.name,products.price,products.image_url,products.stock "
                        "FROM cart_items JOIN products ON products.id=cart_items.product_id WHERE cart_items.cart_id=? AND products.active=1 ORDER BY cart_items.id",
                        (cart["id"],),
                    ).fetchall()
                    return self.send_json([dict(row) for row in rows])
                if path == "/api/auth/me":
                    user = self.current_user(db, required=True)
                    return self.send_json(user_json(user))
                if path == "/api/orders":
                    user = self.current_user(db, required=True)
                    if user["is_admin"]:
                        rows = db.execute("SELECT orders.*,users.name AS customer_name,COUNT(order_items.id) AS item_count FROM orders JOIN users ON users.id=orders.user_id LEFT JOIN order_items ON order_items.order_id=orders.id GROUP BY orders.id ORDER BY orders.created_at DESC").fetchall()
                    else:
                        rows = db.execute("SELECT orders.*,COUNT(order_items.id) AS item_count FROM orders LEFT JOIN order_items ON order_items.order_id=orders.id WHERE orders.user_id=? GROUP BY orders.id ORDER BY orders.created_at DESC", (user["id"],)).fetchall()
                    return self.send_json([dict(row) for row in rows])
                match = re.fullmatch(r"/api/orders/(\d+)", path)
                if match:
                    user = self.current_user(db, required=True)
                    order = db.execute("SELECT * FROM orders WHERE id=?", (match.group(1),)).fetchone()
                    if not order or (not user["is_admin"] and order["user_id"] != user["id"]):
                        raise APIError("Order not found.", 404)
                    items = db.execute("SELECT product_name,unit_price,quantity FROM order_items WHERE order_id=?", (order["id"],)).fetchall()
                    return self.send_json({"order": dict(order), "items": [dict(row) for row in items]})
                raise APIError("API endpoint not found.", 404)
        except APIError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            logging.exception("Database error handling %s", self.path)
            self.send_json({"error": "A database error occurred."}, 500)

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
            with connect() as db:
                if path in ("/api/auth/register", "/api/auth/login"):
                    email = str(data.get("email", "")).strip().lower()
                    password = str(data.get("password", ""))
                    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email) or len(email) > 254:
                        raise APIError("Enter a valid email address.")
                    if path.endswith("register"):
                        name = str(data.get("name", "")).strip()
                        if len(name) < 2 or len(name) > 100:
                            raise APIError("Name must be between 2 and 100 characters.")
                        if len(password) < 8 or len(password) > 128:
                            raise APIError("Password must be between 8 and 128 characters.")
                        password_hash, salt = hash_password(password)
                        try:
                            cursor = db.execute("INSERT INTO users(name,email,password_hash,password_salt) VALUES (?,?,?,?)", (name, email, password_hash, salt))
                        except sqlite3.IntegrityError:
                            raise APIError("An account with this email already exists.", 409)
                        user = db.execute("SELECT * FROM users WHERE id=?", (cursor.lastrowid,)).fetchone()
                    else:
                        user = db.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
                        if not user or not hmac.compare_digest(hash_password(password, bytes.fromhex(user["password_salt"]))[0], user["password_hash"]):
                            raise APIError("Email or password is incorrect.", 401)
                    token = secrets.token_urlsafe(36)
                    db.execute("INSERT INTO sessions(token_hash,user_id) VALUES (?,?)", (hashlib.sha256(token.encode()).hexdigest(), user["id"]))
                    self.merge_guest_cart(db, user)
                    return self.send_json({"token": token, "user": user_json(user)}, 201 if path.endswith("register") else 200)
                if path == "/api/auth/logout":
                    user = self.current_user(db, required=True)
                    token_hash = hashlib.sha256(self.headers["Authorization"][7:].encode("utf-8")).hexdigest()
                    db.execute("DELETE FROM sessions WHERE token_hash=? AND user_id=?", (token_hash, user["id"]))
                    return self.send_json({"ok": True})
                if path == "/api/cart":
                    user = self.current_user(db)
                    cart = self.cart_for(db, user)
                    product_id = data.get("product_id")
                    quantity = data.get("quantity", 1)
                    if not isinstance(product_id, int) or isinstance(product_id, bool) or product_id < 1:
                        raise APIError("Product ID must be a positive whole number.")
                    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 1 or quantity > 99:
                        raise APIError("Quantity must be a whole number between 1 and 99.")
                    product = db.execute("SELECT id,stock,active FROM products WHERE id=?", (product_id,)).fetchone()
                    if not product or not product["active"]:
                        raise APIError("Product not found.", 404)
                    existing = db.execute("SELECT quantity FROM cart_items WHERE cart_id=? AND product_id=?", (cart["id"], product_id)).fetchone()
                    total_quantity = quantity + (existing["quantity"] if existing else 0)
                    if total_quantity > min(99, product["stock"]):
                        raise APIError("The requested quantity is not available in stock.", 409)
                    db.execute(
                        "INSERT INTO cart_items(cart_id,product_id,quantity) VALUES (?,?,?) "
                        "ON CONFLICT(cart_id,product_id) DO UPDATE SET quantity=excluded.quantity",
                        (cart["id"], product_id, total_quantity),
                    )
                    return self.send_json({"ok": True}, 201)
                if path == "/api/orders":
                    user = self.current_user(db, required=True)
                    cart = self.cart_for(db, user, create=False)
                    if not cart:
                        raise APIError("Your bag is empty.", 400)
                    db.execute("BEGIN IMMEDIATE")
                    lines = db.execute(
                        "SELECT cart_items.product_id,cart_items.quantity,products.name,products.price,products.stock,products.active "
                        "FROM cart_items JOIN products ON products.id=cart_items.product_id WHERE cart_items.cart_id=?",
                        (cart["id"],),
                    ).fetchall()
                    if not lines:
                        raise APIError("Your bag is empty.", 400)
                    if any(not line["active"] or line["quantity"] > line["stock"] for line in lines):
                        raise APIError("A product in your bag is no longer available in that quantity.", 409)
                    total = sum(float(line["price"]) * line["quantity"] for line in lines)
                    cursor = db.execute("INSERT INTO orders(user_id,total,status) VALUES (?,?,?)", (user["id"], total, "confirmed"))
                    order_id = cursor.lastrowid
                    for line in lines:
                        db.execute("INSERT INTO order_items(order_id,product_id,product_name,unit_price,quantity) VALUES (?,?,?,?,?)", (order_id, line["product_id"], line["name"], line["price"], line["quantity"]))
                        db.execute("UPDATE products SET stock=stock-? WHERE id=?", (line["quantity"], line["product_id"]))
                    db.execute("INSERT INTO payments(order_id,amount,method,status) VALUES (?,?,?,?)", (order_id, total, "demo", "simulated"))
                    db.execute("DELETE FROM cart_items WHERE cart_id=?", (cart["id"],))
                    return self.send_json({"id": order_id, "total": total, "status": "confirmed", "payment_status": "simulated"}, 201)
                if path == "/api/products":
                    self.require_admin(db)
                    product = self.validate_product(db, data)
                    cursor = db.execute(
                        "INSERT INTO products(name,description,price,stock,image_url,category_id,badge,featured) VALUES (?,?,?,?,?,?,?,?)",
                        product,
                    )
                    row = db.execute("SELECT products.*,categories.name AS category_name FROM products JOIN categories ON categories.id=products.category_id WHERE products.id=?", (cursor.lastrowid,)).fetchone()
                    return self.send_json(dict(row), 201)
                raise APIError("API endpoint not found.", 404)
        except APIError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            logging.exception("Database error handling %s", self.path)
            self.send_json({"error": "A database error occurred."}, 500)

    def do_PUT(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
            with connect() as db:
                match = re.fullmatch(r"/api/cart/(\d+)", path)
                if match:
                    cart = self.cart_for(db, self.current_user(db))
                    item = db.execute("SELECT cart_items.*,products.stock FROM cart_items JOIN products ON products.id=cart_items.product_id WHERE cart_items.id=? AND cart_items.cart_id=?", (match.group(1), cart["id"])).fetchone()
                    if not item:
                        raise APIError("Cart item not found.", 404)
                    quantity = data.get("quantity")
                    if not isinstance(quantity, int) or isinstance(quantity, bool) or quantity < 1 or quantity > 99:
                        raise APIError("Quantity must be a whole number between 1 and 99.")
                    if quantity > min(99, item["stock"]):
                        raise APIError("The requested quantity is not available in stock.", 409)
                    db.execute("UPDATE cart_items SET quantity=? WHERE id=?", (quantity, item["id"]))
                    return self.send_json({"ok": True})
                if path == "/api/auth/profile":
                    user = self.current_user(db, required=True)
                    name = str(data.get("name", "")).strip()
                    if len(name) < 2 or len(name) > 100:
                        raise APIError("Name must be between 2 and 100 characters.")
                    db.execute("UPDATE users SET name=? WHERE id=?", (name, user["id"]))
                    return self.send_json(user_json(db.execute("SELECT * FROM users WHERE id=?", (user["id"],)).fetchone()))
                match = re.fullmatch(r"/api/products/(\d+)", path)
                if match:
                    self.require_admin(db)
                    product = self.validate_product(db, data)
                    cursor = db.execute("UPDATE products SET name=?,description=?,price=?,stock=?,image_url=?,category_id=?,badge=?,featured=? WHERE id=? AND active=1", (*product, match.group(1)))
                    if cursor.rowcount == 0:
                        raise APIError("Product not found.", 404)
                    row = db.execute("SELECT products.*,categories.name AS category_name FROM products JOIN categories ON categories.id=products.category_id WHERE products.id=?", (match.group(1),)).fetchone()
                    return self.send_json(dict(row))
                raise APIError("API endpoint not found.", 404)
        except APIError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            logging.exception("Database error handling %s", self.path)
            self.send_json({"error": "A database error occurred."}, 500)

    def do_DELETE(self):
        path = urlparse(self.path).path
        try:
            with connect() as db:
                match = re.fullmatch(r"/api/cart/(\d+)", path)
                if match:
                    cart = self.cart_for(db, self.current_user(db))
                    db.execute("DELETE FROM cart_items WHERE id=? AND cart_id=?", (match.group(1), cart["id"]))
                    return self.send_json({"ok": True})
                match = re.fullmatch(r"/api/products/(\d+)", path)
                if match:
                    self.require_admin(db)
                    cursor = db.execute("UPDATE products SET active=0 WHERE id=? AND active=1", (match.group(1),))
                    if cursor.rowcount == 0:
                        raise APIError("Product not found.", 404)
                    return self.send_json({"ok": True})
                raise APIError("API endpoint not found.", 404)
        except APIError as error:
            self.send_json({"error": str(error)}, error.status)
        except sqlite3.Error:
            logging.exception("Database error handling %s", self.path)
            self.send_json({"error": "A database error occurred."}, 500)

    @staticmethod
    def validate_product(db, data):
        name = str(data.get("name", "")).strip()
        description = str(data.get("description", "")).strip()
        image_url = str(data.get("image_url", "")).strip()
        badge = str(data.get("badge", "Considered")).strip()[:40] or "Considered"
        try:
            price = float(data.get("price"))
        except (TypeError, ValueError):
            raise APIError("Price, stock, and category are required and must be valid numbers.")
        stock = data.get("stock")
        category_id = data.get("category_id")
        if (not isinstance(stock, int) or isinstance(stock, bool)
                or not isinstance(category_id, int) or isinstance(category_id, bool)):
            raise APIError("Stock and category must be whole numbers.")
        if not 2 <= len(name) <= 120:
            raise APIError("Product name must be between 2 and 120 characters.")
        if len(description) > 2000:
            raise APIError("Description must be 2,000 characters or fewer.")
        if not math.isfinite(price) or price <= 0 or price > 1_000_000:
            raise APIError("Price must be greater than zero.")
        if stock < 0 or stock > 1_000_000:
            raise APIError("Stock must be a whole number from 0 to 1,000,000.")
        if not image_url.startswith("https://") or len(image_url) > 1000:
            raise APIError("Product image must use a secure https URL.")
        if not db.execute("SELECT 1 FROM categories WHERE id=?", (category_id,)).fetchone():
            raise APIError("Choose a valid category.")
        return (name, description, price, stock, image_url, category_id, badge, int(bool(data.get("featured"))))

    def serve_static(self, request_path):
        relative = unquote(request_path).lstrip("/") or "index.html"
        target = (ROOT / relative).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            self.send_error(404)
            return
        content = target.read_bytes()
        content_type = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
        self.send_response(200)
        self.send_header("Content-Type", f"{content_type}; charset=utf-8" if content_type.startswith("text/") or content_type in ("application/javascript",) else content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, fmt, *args):
        logging.info("%s - %s", self.address_string(), fmt % args)


if __name__ == "__main__":
    seed_database()
    logging.info("Form & Field running at http://%s:%s", HOST, PORT)
    ThreadingHTTPServer((HOST, PORT), StoreHandler).serve_forever()
