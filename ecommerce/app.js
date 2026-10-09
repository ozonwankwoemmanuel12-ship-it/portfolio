const API = "/api";
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const $ = (selector, root = document) => root.querySelector(selector);
const state = {
  products: [],
  categories: [],
  cart: [],
  user: null,
  token: localStorage.getItem("ff-token"),
  wishlist: new Set(JSON.parse(localStorage.getItem("ff-wishlist") || "[]")),
  category: "",
  query: "",
  minPrice: null,
  maxPrice: null,
  sort: "featured",
  authMode: "login",
  checkoutAfterLogin: false,
  adminProducts: [],
};

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", "X-Guest-Id": guestId(), ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(`${API}${path}`, { ...options, headers });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
  return result;
}

function guestId() {
  let id = localStorage.getItem("ff-guest");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ff-guest", id);
  }
  return id;
}

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove("show"), 2600);
}

function getProduct(id) {
  return state.products.find((product) => Number(product.id) === Number(id));
}

function imageFor(product) {
  return product.image_url || "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=800&q=80";
}

function renderCategories() {
  $("#category-list").innerHTML = state.categories.map((category, index) => {
    const images = [
      "photo-1616486338812-3dadae4b4ace",
      "photo-1543163521-1bf539c55dd2",
      "photo-1490481651871-ab68de25d43d",
      "photo-1513519245088-0e12902e5a38",
    ];
    return `<a class="category-card" href="#shop" data-category="${escapeHTML(category.name)}"><img src="https://images.unsplash.com/${images[index % images.length]}?auto=format&fit=crop&w=550&q=75" alt="" loading="lazy"><span>${escapeHTML(category.name)} ↗</span></a>`;
  }).join("");
  $("#category-filter").innerHTML = `<option value="">All categories</option>${state.categories.map((category) => `<option value="${escapeHTML(category.name)}">${escapeHTML(category.name)}</option>`).join("")}`;
}

function renderProducts() {
  const grid = $("#product-grid");
  const filtered = [...state.products].sort((a, b) => {
    if (state.sort === "price-asc") return Number(a.price) - Number(b.price);
    if (state.sort === "price-desc") return Number(b.price) - Number(a.price);
    if (state.sort === "newest") return Number(b.id) - Number(a.id);
    return Number(b.featured) - Number(a.featured) || Number(a.id) - Number(b.id);
  });
  $("#result-count").textContent = `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`;
  grid.innerHTML = filtered.map((product) => {
    const isWished = state.wishlist.has(Number(product.id));
    return `<article class="product-card" data-product="${product.id}" tabindex="0" role="group" aria-label="View ${escapeHTML(product.name)}">
      <div class="product-image"><img src="${escapeHTML(imageFor(product))}" alt="${escapeHTML(product.name)}" loading="lazy"><span class="product-tag">${escapeHTML(product.badge || product.category_name || "Considered")}</span><button class="wish-button" data-wish="${product.id}" aria-label="${isWished ? "Remove from" : "Add to"} wishlist" aria-pressed="${isWished}">${isWished ? "♥" : "♡"}</button></div>
      <div class="product-info"><div><p class="product-name">${escapeHTML(product.name)}</p><p class="product-category">${escapeHTML(product.category_name || "Everyday goods")}</p></div><span class="product-price">${money.format(Number(product.price))}</span></div>
    </article>`;
  }).join("");
  $("#empty-products").hidden = filtered.length > 0;
  grid.hidden = filtered.length === 0;
}

async function loadProducts() {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.minPrice !== null) params.set("min_price", state.minPrice);
  if (state.maxPrice !== null) params.set("max_price", state.maxPrice);
  state.products = await request(`/products${params.size ? `?${params}` : ""}`);
  renderProducts();
}

function setCategory(category) {
  showView("shop");
  state.category = category;
  $("#category-filter").value = category;
  $("#collection-title").innerHTML = category ? `${escapeHTML(category)} collection<span class="heading-period">.</span>` : `The collection<span class="heading-period">.</span>`;
  $("#shop").scrollIntoView({ behavior: "smooth" });
  loadProducts().catch(showError);
}

function showError(error) {
  toast(error.message || "Something went wrong. Please try again.");
}

function updateCounts() {
  $("#cart-count").textContent = state.cart.reduce((total, item) => total + Number(item.quantity), 0);
  $("#wishlist-count").textContent = state.wishlist.size;
}

async function loadCart() {
  state.cart = await request("/cart");
  updateCounts();
  renderCart();
}

function renderCart(errorMessage = "") {
  const content = $("#cart-content");
  const bottom = $("#cart-bottom");
  if (!state.cart.length) {
    content.innerHTML = '<p class="drawer-empty">Your bag is taking a little breather.</p>';
    bottom.innerHTML = '<a class="button button-dark checkout-button" href="#shop" data-close-drawer>Find something lovely <span>↗</span></a>';
    return;
  }
  content.innerHTML = state.cart.map((item) => `<article class="cart-line">
    <img src="${escapeHTML(item.image_url)}" alt="">
    <div><p class="cart-line-name">${escapeHTML(item.name)}</p><p class="cart-line-meta">${money.format(Number(item.price))}</p>
    <div class="quantity-control"><button data-quantity="${item.id}" data-delta="-1" aria-label="Decrease quantity">−</button><span>${item.quantity}</span><button data-quantity="${item.id}" data-delta="1" aria-label="Increase quantity">+</button></div>
    <button class="remove-line" data-remove="${item.id}">Remove</button></div><span class="cart-line-price">${money.format(Number(item.price) * Number(item.quantity))}</span>
  </article>`).join("");
  const total = state.cart.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
  bottom.innerHTML = `<p class="subtotal"><span>Subtotal</span><strong>${money.format(total)}</strong></p><p class="shipping-note">Demo checkout only. No payment details are collected.</p>${errorMessage ? `<p class="cart-error">${escapeHTML(errorMessage)}</p>` : ""}<button class="button button-dark checkout-button" id="checkout-button">Continue to checkout <span>↗</span></button>`;
}

async function addToCart(productId, quantity = 1) {
  await request("/cart", { method: "POST", body: JSON.stringify({ product_id: Number(productId), quantity: Number(quantity) }) });
  await loadCart();
  toast("Added to your bag.");
}

function openDrawer() {
  $("#overlay").hidden = false;
  $("#cart-drawer").classList.add("open");
  $("#cart-drawer").setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  $("#overlay").hidden = true;
  $("#cart-drawer").classList.remove("open");
  $("#cart-drawer").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function openProduct(product) {
  if (!product) return;
  $("#product-detail").innerHTML = `<div class="detail-layout">
    <div class="detail-image"><img src="${escapeHTML(imageFor(product))}" alt="${escapeHTML(product.name)}"></div>
    <div class="detail-copy"><p class="eyebrow">${escapeHTML(product.category_name || "FORM & FIELD")}</p><h2>${escapeHTML(product.name)}</h2><p class="detail-price">${money.format(Number(product.price))}</p><p class="detail-description">${escapeHTML(product.description || "A considered piece for everyday living. Made with thoughtful materials and designed to be reached for often.")}</p><p class="detail-stock">${Number(product.stock) > 0 ? `${product.stock} in stock · Ready to ship` : "Currently out of stock"}</p><label class="detail-quantity">Quantity <input id="detail-quantity" type="number" min="1" max="${Math.max(1, Math.min(99, Number(product.stock)))}" value="1"></label><button class="button button-dark" data-detail-add="${product.id}" ${Number(product.stock) < 1 ? "disabled" : ""}>Add to bag <span>↗</span></button></div>
  </div>`;
  $("#product-dialog").showModal();
}

function setAuthMode(mode) {
  state.authMode = mode;
  $$(".auth-tab").forEach((button) => button.classList.toggle("active", button.dataset.auth === mode));
  $("#name-field").hidden = mode !== "register";
  $("#name-field input").required = mode === "register";
  $("#auth-heading").textContent = mode === "register" ? "Join us." : "Your space.";
  $(".auth-submit").innerHTML = `${mode === "register" ? "Create account" : "Sign in"} <span>↗</span>`;
  $("#auth-error").textContent = "";
}

function $$(selector, root = document) {
  return [...root.querySelectorAll(selector)];
}

function openAuth() {
  setAuthMode("login");
  $("#auth-dialog").showModal();
}

function showView(view) {
  closeDrawer();
  $("#account-page").hidden = view !== "account";
  $("#orders-page").hidden = view !== "orders";
  $("#admin-page").hidden = view !== "admin";
  $("#shop").hidden = view === "account" || view === "orders" || view === "admin";
  $("#home").hidden = view === "account" || view === "orders" || view === "admin";
  $("#category-list").parentElement.hidden = $("#shop").hidden;
  $("#story").hidden = $("#shop").hidden;
  $(".newsletter").hidden = $("#shop").hidden;
  if (view === "shop") $("#collection-title").innerHTML = 'The collection<span class="heading-period">.</span>';
  if (view === "account") renderAccount();
  if (view === "orders") renderOrders();
  if (view === "admin") renderAdmin();
  if (view === "story") $("#story").scrollIntoView({ behavior: "smooth" });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

async function showWishlist() {
  showView("shop");
  state.query = "";
  state.category = "";
  state.minPrice = null;
  state.maxPrice = null;
  $("#search-input").value = "";
  $("#category-filter").value = "";
  $("#price-filter").value = "";
  await loadProducts();
  state.products = state.products.filter((product) => state.wishlist.has(Number(product.id)));
  renderProducts();
  $("#collection-title").innerHTML = 'Saved pieces<span class="heading-period">.</span>';
  $("#home").hidden = true;
  $("#category-list").parentElement.hidden = true;
  $("#story").hidden = true;
  $(".newsletter").hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAccount() {
  if (!state.user) {
    $("#account-title").textContent = "Your account.";
    $("#account-content").innerHTML = `<div class="account-summary"><p>Sign in to see your details, orders, and saved pieces.</p><button class="button button-dark" id="account-signin">Sign in <span>↗</span></button></div>`;
    return;
  }
  $("#account-title").textContent = `Hello, ${state.user.name.split(" ")[0]}.`;
  $("#account-content").innerHTML = `<div class="account-grid"><nav class="account-nav" aria-label="Account"><button class="selected" data-account-tab="details">Account details</button><button data-view="orders">Order history</button><button data-view="wishlist">Saved pieces (${state.wishlist.size})</button><button id="signout-button">Sign out</button>${state.user.is_admin ? '<button data-view="admin">Admin dashboard</button>' : ""}</nav><div class="account-summary"><h3>Account details</h3><form class="inline-form" id="profile-form"><label>Full name<input name="name" value="${escapeHTML(state.user.name)}" required></label><label>Email address<input name="email" type="email" value="${escapeHTML(state.user.email)}" disabled></label><button class="button button-outline">Save changes</button></form></div></div>`;
}

async function renderOrders() {
  if (!state.user) {
    $("#orders-content").innerHTML = '<p>Sign in to view your order history.</p><button class="button button-dark" id="orders-signin">Sign in <span>↗</span></button>';
    return;
  }
  try {
    const orders = await request("/orders");
    $("#orders-content").innerHTML = orders.length ? orders.map((order) => `<article class="order-card"><div><strong>Order #${order.id}</strong><br><span>${new Date(order.created_at).toLocaleDateString()}</span></div><span>${order.item_count} ${order.item_count === 1 ? "item" : "items"} · ${money.format(Number(order.total))}</span><span class="order-status">${escapeHTML(order.status)}</span></article>`).join("") : '<p>You haven’t placed an order yet. The good things are waiting.</p><a class="button button-outline" href="#shop" data-view="shop">Explore the collection</a>';
  } catch (error) { $("#orders-content").innerHTML = `<p>${escapeHTML(error.message)}</p>`; }
}

async function renderAdmin() {
  if (!state.user?.is_admin) {
    $("#admin-content").innerHTML = '<p>Admin access is required.</p>';
    return;
  }
  try {
    const [products, orders] = await Promise.all([request("/products"), request("/orders")]);
    state.adminProducts = products;
    const totalSales = orders.reduce((sum, order) => sum + Number(order.total), 0);
    $("#admin-content").innerHTML = `<div class="admin-stats"><div class="stat-card"><strong>${products.length}</strong><span>Active products</span></div><div class="stat-card"><strong>${orders.length}</strong><span>Orders</span></div><div class="stat-card"><strong>${money.format(totalSales)}</strong><span>Order value</span></div></div>
      <div class="admin-layout"><section class="admin-panel"><h3 id="admin-form-title">Add a product</h3><form id="admin-form" class="admin-form">
        <input type="hidden" name="id"><label>Product name<input name="name" required maxlength="120"></label>
        <label>Category<select name="category_id" required>${state.categories.map((category) => `<option value="${category.id}">${escapeHTML(category.name)}</option>`).join("")}</select></label>
        <label>Price (USD)<input name="price" type="number" min="0.01" step="0.01" required></label>
        <label>Stock<input name="stock" type="number" min="0" step="1" value="1" required></label>
        <label>Image URL<input name="image_url" type="url" required></label>
        <label>Description<textarea name="description" rows="3"></textarea></label>
        <button class="button button-dark">Save product <span>↗</span></button><button type="button" class="text-button" id="admin-cancel" hidden>Cancel edit</button>
      </form></section><section class="admin-panel"><h3>Products</h3><div>${products.map((product) => `<article class="admin-product"><img src="${escapeHTML(imageFor(product))}" alt=""><span>${escapeHTML(product.name)}<br>${money.format(Number(product.price))} · ${product.stock} in stock</span><span class="admin-product-actions"><button data-edit="${product.id}">Edit</button><button data-delete="${product.id}">Delete</button></span></article>`).join("")}</div></section></div>`;
  } catch (error) { $("#admin-content").innerHTML = `<p>${escapeHTML(error.message)}</p>`; }
}

function saveWishlist() {
  localStorage.setItem("ff-wishlist", JSON.stringify([...state.wishlist]));
  updateCounts();
  renderProducts();
}

async function checkout() {
  if (!state.user) {
    state.checkoutAfterLogin = true;
    closeDrawer();
    openAuth();
    toast("Sign in or create an account to place your order.");
    return;
  }
  try {
    const result = await request("/orders", { method: "POST", body: JSON.stringify({ payment_method: "demo" }) });
    await loadCart();
    closeDrawer();
    toast(`Order #${result.id} placed — thank you.`);
    showView("orders");
  } catch (error) {
    renderCart(error.message);
  }
}

async function init() {
  try {
    const [categories] = await Promise.all([request("/categories")]);
    state.categories = categories;
    renderCategories();
    await loadProducts();
    await loadCart();
    if (state.token) {
      try { state.user = await request("/auth/me"); }
      catch { state.token = null; localStorage.removeItem("ff-token"); }
    }
  } catch (error) {
    $("#result-count").textContent = "Store unavailable";
    $("#product-grid").innerHTML = `<p class="form-error">${escapeHTML(error.message)}. Start the local server with <code>python server.py</code>.</p>`;
  }
}

document.addEventListener("click", async (event) => {
  const target = event.target.closest("button, a, article");
  if (!target) return;
  try {
    if (target.matches("[data-category]")) {
      event.preventDefault();
      setCategory(target.dataset.category);
    } else if (target.matches("[data-view]")) {
      event.preventDefault();
      const view = target.dataset.view;
      if (view === "wishlist") await showWishlist();
      else if (view === "shop") {
        showView("shop");
        state.query = "";
        state.category = "";
        state.minPrice = null;
        state.maxPrice = null;
        $("#search-input").value = "";
        $("#category-filter").value = "";
        $("#price-filter").value = "";
        $("#filter-count").textContent = "";
        await loadProducts();
      } else showView(view);
    } else if (target.matches(".wordmark")) {
      event.preventDefault();
      showView("shop");
      state.query = "";
      state.category = "";
      state.minPrice = null;
      state.maxPrice = null;
      $("#search-input").value = "";
      $("#category-filter").value = "";
      $("#price-filter").value = "";
      await loadProducts();
    } else if (target.id === "mobile-menu") {
      const open = target.getAttribute("aria-expanded") !== "true";
      target.setAttribute("aria-expanded", String(open));
      $("#nav").classList.toggle("open", open);
    } else if (target.id === "search-toggle") {
      $("#search-bar").hidden = !$("#search-bar").hidden;
      if (!$("#search-bar").hidden) $("#search-input").focus();
    } else if (target.id === "search-close") {
      $("#search-bar").hidden = true;
    } else if (target.id === "filter-toggle") {
      $("#filter-panel").hidden = !$("#filter-panel").hidden;
    } else if (target.id === "clear-filters" || target.id === "empty-clear") {
      state.query = "";
      state.category = "";
      state.minPrice = null;
      state.maxPrice = null;
      $("#search-input").value = "";
      $("#category-filter").value = "";
      $("#price-filter").value = "";
      $("#collection-title").innerHTML = 'The collection<span class="heading-period">.</span>';
      $("#filter-count").textContent = "";
      await loadProducts();
    } else if (target.id === "cart-toggle") {
      await loadCart();
      openDrawer();
    } else if (target.id === "account-toggle") {
      showView("account");
    } else if (target.id === "wishlist-toggle") {
      await showWishlist();
    } else if (target.matches("[data-wish]")) {
      event.stopPropagation();
      const id = Number(target.dataset.wish);
      state.wishlist.has(id) ? state.wishlist.delete(id) : state.wishlist.add(id);
      saveWishlist();
    } else if (target.matches(".product-card")) {
      openProduct(getProduct(target.dataset.product));
    } else if (target.matches("[data-detail-add]")) {
      await addToCart(target.dataset.detailAdd, $("#detail-quantity").value);
      $("#product-dialog").close();
      openDrawer();
    } else if (target.matches(".dialog-close")) {
      target.closest("dialog").close();
    } else if (target.matches(".close-drawer") || target.matches("[data-close-drawer]")) {
      closeDrawer();
    } else if (target.matches("[data-quantity]")) {
      const item = state.cart.find((line) => Number(line.id) === Number(target.dataset.quantity));
      const quantity = Number(item.quantity) + Number(target.dataset.delta);
      if (quantity < 1) await request(`/cart/${item.id}`, { method: "DELETE" });
      else await request(`/cart/${item.id}`, { method: "PUT", body: JSON.stringify({ quantity }) });
      await loadCart();
    } else if (target.matches("[data-remove]")) {
      await request(`/cart/${target.dataset.remove}`, { method: "DELETE" });
      await loadCart();
    } else if (target.id === "checkout-button") {
      await checkout();
    } else if (target.id === "account-signin" || target.id === "orders-signin") {
      openAuth();
    } else if (target.matches(".auth-tab")) {
      setAuthMode(target.dataset.auth);
    } else if (target.id === "signout-button") {
      await request("/auth/logout", { method: "POST", body: "{}" });
      state.token = null;
      state.user = null;
      localStorage.removeItem("ff-token");
      toast("You’ve signed out.");
      showView("account");
    } else if (target.matches("[data-account-tab]")) {
      renderAccount();
    } else if (target.matches("[data-edit]")) {
      const product = state.adminProducts.find((item) => Number(item.id) === Number(target.dataset.edit));
      if (!product) return;
      const form = $("#admin-form");
      form.elements.id.value = product.id;
      form.elements.name.value = product.name;
      form.elements.category_id.value = product.category_id;
      form.elements.price.value = product.price;
      form.elements.stock.value = product.stock;
      form.elements.image_url.value = product.image_url;
      form.elements.description.value = product.description || "";
      $("#admin-form-title").textContent = "Edit product";
      $("#admin-cancel").hidden = false;
      form.scrollIntoView({ behavior: "smooth" });
    } else if (target.matches("[data-delete]")) {
      if (!confirm("Delete this product? It will be removed from the active collection.")) return;
      await request(`/products/${target.dataset.delete}`, { method: "DELETE" });
      await loadProducts();
      await renderAdmin();
      toast("Product deleted.");
    } else if (target.id === "admin-cancel") {
      $("#admin-form").reset();
      $("#admin-form").elements.id.value = "";
      $("#admin-form-title").textContent = "Add a product";
      target.hidden = true;
    }
  } catch (error) { showError(error); }
});

document.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  try {
    if (form.id === "auth-form") {
      const values = Object.fromEntries(new FormData(form));
      const path = state.authMode === "register" ? "/auth/register" : "/auth/login";
      const result = await request(path, { method: "POST", body: JSON.stringify(values) });
      state.token = result.token;
      state.user = result.user;
      localStorage.setItem("ff-token", state.token);
      $("#auth-dialog").close();
      await loadCart();
      toast(`Welcome${state.user.name ? `, ${state.user.name.split(" ")[0]}` : ""}.`);
      if (state.checkoutAfterLogin) {
        state.checkoutAfterLogin = false;
        openDrawer();
        await checkout();
      } else showView("account");
    } else if (form.id === "profile-form") {
      const result = await request("/auth/profile", { method: "PUT", body: JSON.stringify({ name: form.elements.name.value }) });
      state.user = result;
      renderAccount();
      toast("Your details have been updated.");
    } else if (form.id === "admin-form") {
      const values = Object.fromEntries(new FormData(form));
      const id = values.id;
      delete values.id;
      values.category_id = Number(values.category_id);
      values.price = Number(values.price);
      values.stock = Number(values.stock);
      await request(id ? `/products/${id}` : "/products", { method: id ? "PUT" : "POST", body: JSON.stringify(values) });
      form.reset();
      form.elements.id.value = "";
      $("#admin-form-title").textContent = "Add a product";
      $("#admin-cancel").hidden = true;
      await loadProducts();
      await renderAdmin();
      toast(id ? "Product updated." : "Product added.");
    } else if (form.id === "newsletter-form") {
      toast("Newsletter sign-up isn’t enabled in this demo.");
      form.reset();
    }
  } catch (error) {
    if (form.id === "auth-form") $("#auth-error").textContent = error.message;
    else showError(error);
  }
});

$("#search-input").addEventListener("input", (event) => {
  state.query = event.target.value.trim();
  loadProducts().catch(showError);
});
$("#sort-select").addEventListener("change", (event) => { state.sort = event.target.value; renderProducts(); });
$("#category-filter").addEventListener("change", (event) => {
  state.category = event.target.value;
  $("#collection-title").innerHTML = state.category ? `${escapeHTML(state.category)} collection<span class="heading-period">.</span>` : 'The collection<span class="heading-period">.</span>';
  $("#filter-count").textContent = state.category || $("#price-filter").value ? "•" : "";
  loadProducts().catch(showError);
});
$("#price-filter").addEventListener("change", (event) => {
  const [min, max] = event.target.value ? event.target.value.split("-").map(Number) : [null, null];
  state.minPrice = min;
  state.maxPrice = max;
  $("#filter-count").textContent = state.category || event.target.value ? "•" : "";
  loadProducts().catch(showError);
});
$("#overlay").addEventListener("click", closeDrawer);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
    $("#nav").classList.remove("open");
    $("#mobile-menu").setAttribute("aria-expanded", "false");
  }
  if ((event.key === "Enter" || event.key === " ") && event.target.matches(".product-card")) {
    event.preventDefault();
    openProduct(getProduct(event.target.dataset.product));
  }
});
init();
