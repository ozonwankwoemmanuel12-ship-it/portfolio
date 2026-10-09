# Form & Field — E-Commerce Demo

A responsive, full-stack storefront built with semantic HTML, CSS, vanilla JavaScript, Python's standard library, and SQLite. No JavaScript packages or external database are required.

## Run locally

Requires Python 3.9 or newer.

```powershell
cd portfolio\ecommerce
python server.py
```

Open [http://127.0.0.1:8000](http://127.0.0.1:8000). SQLite creates `store.db` beside `server.py` the first time it runs and seeds a sample catalog.

The seeded local-only admin account is **admin@formandfield.test** / **Admin123!**. Sign in with this account to use the admin dashboard. Do not expose this demo account or the local server to the public internet; change or remove the seeded credentials before deploying.

Orders are stored with a simulated payment record. This demo does not collect payment details or contact a payment processor.

## Store features

- Responsive home, category navigation, product catalog, product details, search, filters, sorting, and saved-item wishlist
- Guest shopping bag persisted by the API and merged into the account cart after sign-in
- Account registration and sign-in, profile details, and order history
- Checkout creates an order and simulated payment record; stock is checked and decremented in a database transaction
- Admin dashboard for catalog creation, editing, soft-deletion, order counts, and sales totals
- Accessible dialogs, labels, keyboard dismissal, and reduced-motion support

## API

The app serves the API and frontend from the same origin:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Revoke the current session |
| GET | `/api/auth/me` | Get the signed-in account |
| PUT | `/api/auth/profile` | Update account name |
| GET | `/api/categories` | List product categories |
| GET | `/api/products` | List and filter products (`q`, `category`, `min_price`, `max_price`) |
| GET | `/api/products/:id` | Get a product |
| POST | `/api/products` | Add a product (admin) |
| PUT | `/api/products/:id` | Update a product (admin) |
| DELETE | `/api/products/:id` | Soft-delete a product (admin) |
| GET | `/api/cart` | Get the current account or guest cart |
| POST | `/api/cart` | Add a product (`product_id`, `quantity`) |
| PUT | `/api/cart/:id` | Set an item quantity |
| DELETE | `/api/cart/:id` | Remove a cart item |
| POST | `/api/orders` | Place an order (signed in) |
| GET | `/api/orders` | List own orders (admin can list all) |
| GET | `/api/orders/:id` | Get an authorized order and its items |

Authenticated requests use `Authorization: Bearer <token>`. Guest cart requests include a stable `X-Guest-Id` header; the storefront creates one automatically. Passwords are stored as salted scrypt hashes, and session tokens are stored as SHA-256 hashes.

## Database

SQLite tables: `users`, `products`, `categories`, `cart`, `cart_items`, `orders`, `order_items`, `payments`, `reviews`, and `sessions`. Product and order writes are validated by the API; an order checks stock and records its items, payment status, and inventory changes atomically.
