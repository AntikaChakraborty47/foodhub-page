const API_URL =
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
        ? "http://127.0.0.1:5000"
        : "https://foodhub-page.onrender.com";
// ================= FOOD ICON BY NAME =================
function getFoodIcon(name, category) {
    const n = (name || "").toLowerCase();

    if (n.includes("biryani")) return "🍛";
    if (n.includes("polao") || n.includes("tehari") || n.includes("khichuri")) return "🍚";
    if (n.includes("rice")) return "🍚";
    if (n.includes("burger")) return "🍔";
    if (n.includes("pizza")) return "🍕";
    if (n.includes("tacos")) return "🌮";
    if (n.includes("wings") || n.includes("nuggets")) return "🍗";
    if (n.includes("fries")) return "🍟";
    if (n.includes("onion rings")) return "🧅";
    if (n.includes("shawarma")) return "🌯";
    if (n.includes("cake") || n.includes("brownie")) return "🍰";
    if (n.includes("cheesecake")) return "🍰";
    if (n.includes("ice cream")) return "🍦";
    if (n.includes("firni") || n.includes("roshogolla") || n.includes("mishti")) return "🍮";
    if (n.includes("tea")) return "☕";
    if (n.includes("coffee")) return "☕";
    if (n.includes("shake") || n.includes("lassi") || n.includes("lemonade")) return "🥤";
    if (n.includes("borhani")) return "🥛";
    if (n.includes("water")) return "💧";
    if (n.includes("drink")) return "🥤";

    if (category === "Meal") return "🍽️";
    if (category === "Snacks & Fast Food") return "🍔";
    if (category === "Cold Drinks") return "🥤";
    if (category === "Desserts") return "🍮";

    return "🍽️";
}
let cart = [];
let currentUser = null;
let orders = [];
let products = [];

// ================= HOME =================
function goToMenu() {
    document.getElementById("menu").scrollIntoView({ behavior: "smooth" });
}

// ================= MENU CATEGORY =================
function showCategory(category, event) {
    document.querySelectorAll(".menu-category").forEach(cat => cat.classList.add("hidden"));

    const selectedCategory = document.getElementById("category-" + category);
    if (selectedCategory) selectedCategory.classList.remove("hidden");

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    if (event) event.currentTarget.classList.add("active");

    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    const noResult = document.getElementById("noResult");
    if (noResult) noResult.classList.add("hidden");
}

// ================= SEARCH FOOD =================
function searchFood() {
    const input = document.getElementById("searchInput");
    const query = input.value.toLowerCase().trim();
    const categories = document.querySelectorAll(".menu-category");
    const noResult = document.getElementById("noResult");

    if (query === "") {
        document.querySelectorAll(".tab-btn").forEach(btn => btn.style.display = "inline-block");
        categories.forEach(cat => cat.classList.add("hidden"));

        const activeTab = document.querySelector(".tab-btn.active");
        if (activeTab) {
            const onclickStr = activeTab.getAttribute("onclick");
            if (onclickStr) {
                const match = onclickStr.match(/'([^']+)'/);
                if (match) {
                    const category = document.getElementById("category-" + match[1]);
                    if (category) category.classList.remove("hidden");
                }
            }
        }

        document.querySelectorAll(".food-card").forEach(card => card.style.display = "block");
        noResult.classList.add("hidden");
        return;
    }

    document.querySelectorAll(".tab-btn").forEach(btn => btn.style.display = "none");
    categories.forEach(cat => cat.classList.remove("hidden"));

    let foundCount = 0;

    document.querySelectorAll(".food-card").forEach(card => {
        const foodName = (card.getAttribute("data-name") || "").toLowerCase();
        const cardText = card.textContent.toLowerCase();

        if (foodName.includes(query) || cardText.includes(query)) {
            card.style.display = "block";
            foundCount++;
        } else {
            card.style.display = "none";
        }
    });

    if (foundCount === 0) noResult.classList.remove("hidden");
    else noResult.classList.add("hidden");
}

// ================= USER INFO =================
function updateUserInfo() {
    const userInfo = document.getElementById("userInfo");
    const adminPanel = document.getElementById("adminPanel");

    if (currentUser) {
        userInfo.innerHTML = `
            <span>Hi, ${currentUser.username} (${currentUser.role})</span>
            <button onclick="logout()">Logout</button>
        `;
    } else {
        userInfo.innerHTML = "";
    }

    if (adminPanel) {
        if (currentUser && currentUser.role === "admin") {
            adminPanel.classList.remove("hidden");
            loadAdminProducts();
        } else {
            adminPanel.classList.add("hidden");
        }
    }
}

// ================= LOGOUT =================
function logout() {
    currentUser = null;
    cart = [];
    orders = [];
    updateUserInfo();
    updateCartUI();
    renderOrders();
    alert("Logged out successfully!");
}

// ================= REGISTER =================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("username").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirmPassword").value;
        const message = document.getElementById("registerMessage");

        if (!username) { message.style.color = "#EF4444"; message.innerText = "Username is required."; return; }
        if (!email) { message.style.color = "#EF4444"; message.innerText = "Email is required."; return; }
        if (!password) { message.style.color = "#EF4444"; message.innerText = "Password is required."; return; }
        if (password.length < 8) { message.style.color = "#EF4444"; message.innerText = "Password must be at least 8 characters."; return; }
        if (password !== confirmPassword) { message.style.color = "#EF4444"; message.innerText = "Passwords do not match."; return; }

        try {
            const response = await fetch(API_URL + "/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                message.style.color = "#10B981";
                registerForm.reset();
            } else {
                message.style.color = "#EF4444";
            }
            message.innerText = data.message;
        } catch (error) {
            message.style.color = "#EF4444";
            message.innerText = "Cannot connect to server.";
        }
    });
}

// ================= LOGIN =================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = document.getElementById("loginUsername").value.trim();
        const password = document.getElementById("loginPassword").value;
        const message = document.getElementById("loginMessage");

        if (!username) { message.style.color = "#EF4444"; message.innerText = "Username is required."; return; }
        if (!password) { message.style.color = "#EF4444"; message.innerText = "Password is required."; return; }
        if (password.length < 8) { message.style.color = "#EF4444"; message.innerText = "Password must be at least 8 characters."; return; }

        try {
            const response = await fetch(API_URL + "/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                currentUser = data.user;
                message.style.color = "#10B981";
                message.innerText = data.message;
                loginForm.reset();
                updateUserInfo();
                loadOrders();
                loadProducts();
            } else {
                message.style.color = "#EF4444";
                message.innerText = data.message;
            }
        } catch (error) {
            message.style.color = "#EF4444";
            message.innerText = "Cannot connect to server.";
        }
    });
}

// ================= LOAD PRODUCTS =================
async function loadProducts() {
    try {
        const response = await fetch(API_URL + "/api/products");
        const data = await response.json();

        if (!response.ok) {
            console.log("Cannot load products");
            return;
        }

        products = data.products || [];
        renderProducts(products);
    } catch (error) {
        console.log("Cannot connect to product server.");
    }
}

// ================= RENDER PRODUCTS =================
function renderProducts(productList) {
    const categories = {
        "Meal": document.getElementById("category-meal")?.querySelector(".food-container"),
        "Snacks & Fast Food": document.getElementById("category-snacks")?.querySelector(".food-container"),
        "Cold Drinks": document.getElementById("category-drinks")?.querySelector(".food-container"),
        "Desserts": document.getElementById("category-desserts")?.querySelector(".food-container")
    };

    Object.values(categories).forEach(category => {
        if (category) category.innerHTML = "";
    });

    productList.forEach(product => {
        const categoryDiv = categories[product.category];
        if (!categoryDiv) return;

        const card = document.createElement("div");
        card.className = "food-card";
        card.setAttribute("data-name", product.name.toLowerCase());

        let priceHTML = "";

        if (product.originalPrice && product.originalPrice > product.price) {
            const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
            priceHTML = `
                <span class="old-price">৳${product.originalPrice}</span>
                <span class="new-price">৳${product.price}</span>
                <span class="discount-badge">${discount}% OFF</span>
            `;
        } else {
            priceHTML = `<span class="new-price">৳${product.price}</span>`;
        }

        card.innerHTML = `
            <div class="food-icon">${getFoodIcon(product.name, product.category)}</div>
            <h3>${product.name}</h3>
            <div class="price-row">${priceHTML}</div>
            <p class="${product.available ? "available" : "not-available"}">
                ${product.available ? "Available" : "Not Available"}
            </p>
            <button class="add-cart-btn" ${product.available ? "" : "disabled"}
                onclick="addToCart('${product.name.replace(/'/g, "\\'")}', ${product.price})">
                ${product.available ? "Add to Cart" : "Not Available"}
            </button>
        `;

        categoryDiv.appendChild(card);
    });
}

// ================= CART =================
function addToCart(name, price) {
    if (!currentUser) {
        alert("Please login first to add items to cart!");
        document.getElementById("login").scrollIntoView({ behavior: "smooth" });
        return;
    }
    cart.push({ name, price });
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItems = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const deliveryEl = document.getElementById("deliveryCharge");
    const totalEl = document.getElementById("cartTotal");
    const freeMsg = document.getElementById("freeDeliveryMsg");
    const deliveryInfoText = document.getElementById("deliveryInfoText");
    const bkashBox = document.getElementById("bkashBox");
    const bkashAmount = document.getElementById("bkashAmount");

    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-text">Your cart is empty.</p>';
        subtotalEl.innerText = "৳0";
        deliveryEl.innerText = "৳0";
        totalEl.innerText = "৳0";
        freeMsg.innerText = "";
        deliveryInfoText.innerText = "Add items to see delivery charge";
        deliveryInfoText.className = "delivery-info-text";
        bkashBox.style.display = "none";
        return;
    }

    let subtotal = 0;
    let html = "";

    cart.forEach((item, index) => {
        html += `
            <div class="cart-item">
                <span class="cart-item-name">${item.name}</span>
                <span class="cart-item-price">৳${item.price}</span>
                <button class="remove-btn" onclick="removeFromCart(${index})">✕</button>
            </div>
        `;
        subtotal += item.price;
    });

    const delivery = subtotal >= 1000 ? 0 : 60;

    cartItems.innerHTML = html;
    subtotalEl.innerText = "৳" + subtotal;
    deliveryEl.innerText = delivery === 0 ? "Free" : "৳" + delivery;
    totalEl.innerText = "৳" + (subtotal + delivery);

    if (subtotal >= 1000) {
        freeMsg.style.color = "#10B981";
        freeMsg.innerText = "🎉 You got Free Delivery!";
        deliveryInfoText.innerText = "Delivery is FREE for orders ৳1000 and above!";
        deliveryInfoText.className = "delivery-info-text free";
        bkashBox.style.display = "none";
    } else {
        const remaining = 1000 - subtotal;
        freeMsg.style.color = "#F59E0B";
        freeMsg.innerText = `Add ৳${remaining} more for Free Delivery`;
        deliveryInfoText.innerText = "Delivery charge: ৳60 (Must be paid via bKash in advance)";
        deliveryInfoText.className = "delivery-info-text charge";
        bkashBox.style.display = "block";
        bkashAmount.innerText = "৳60";
    }
}

// ================= PLACE ORDER =================
async function placeOrder() {
    const address = document.getElementById("orderAddress").value.trim();
    const phone = document.getElementById("orderPhone").value.trim();
    const message = document.getElementById("orderMessage");

    if (!currentUser) {
        message.style.color = "#EF4444";
        message.innerText = "Please login first to place an order.";
        document.getElementById("login").scrollIntoView({ behavior: "smooth" });
        return;
    }
    if (cart.length === 0) { message.style.color = "#EF4444"; message.innerText = "Your cart is empty!"; return; }
    if (!phone) { message.style.color = "#EF4444"; message.innerText = "Please enter your mobile number."; return; }
    if (phone.length < 11) { message.style.color = "#EF4444"; message.innerText = "Please enter a valid 11-digit mobile number."; return; }
    if (!address) { message.style.color = "#EF4444"; message.innerText = "Please enter delivery address."; return; }

    const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
    const delivery = subtotal >= 1000 ? 0 : 60;
    const total = subtotal + delivery;

    try {
        const response = await fetch(API_URL + "/api/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, items: cart, subtotal, delivery, total, phone, address })
        });

        const data = await response.json();

        if (response.ok) {
            message.style.color = "#10B981";
            if (delivery > 0) {
                message.innerText = "Order placed! Please send ৳60 via bKash to 01700-000000.";
            } else {
                message.innerText = "Order placed successfully! Pay ৳" + total + " when food arrives.";
            }
            cart = [];
            updateCartUI();
            document.getElementById("orderAddress").value = "";
            document.getElementById("orderPhone").value = "";
            loadOrders();
        } else {
            message.style.color = "#EF4444";
            message.innerText = data.message;
        }
    } catch (error) {
        message.style.color = "#EF4444";
        message.innerText = "Cannot connect to server.";
    }
}

// ================= LOAD ORDERS =================
async function loadOrders() {
    if (!currentUser) return;
    try {
        const response = await fetch(API_URL + "/api/orders/" + currentUser.id);
        const data = await response.json();
        orders = data.orders || [];
        renderOrders();
    } catch (error) {
        console.log("Cannot load orders");
    }
}

// ================= RENDER ORDERS =================
function renderOrders() {
    const list = document.getElementById("ordersList");

    if (!currentUser) {
        list.innerHTML = '<p class="empty-text">Please login to see your orders.</p>';
        return;
    }
    if (orders.length === 0) {
        list.innerHTML = '<p class="empty-text">No orders yet.</p>';
        return;
    }

    let html = "";

    orders.forEach(order => {
        const itemsText = order.items.map(i => i.name).join(", ");
        const statusClass = order.status === "Confirmed" ? "status-confirmed" : "status-pending";

        html += `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-status ${statusClass}">${order.status}</span>
                </div>
                <p class="order-items">${itemsText}</p>
                <p class="order-items">📞 ${order.phone || "N/A"} | 📍 ${order.address || "N/A"}</p>
                <p class="order-total">Total: ৳${order.total}</p>
                ${order.status === "Pending" ? `
                    <div class="order-actions">
                        <button class="btn-small btn-confirm" onclick="confirmOrder(${order.id})">Confirm</button>
                        <button class="btn-small btn-cancel" onclick="cancelOrder(${order.id})">Delete</button>
                    </div>
                ` : `<p class="confirmed-msg">✅ Your order is confirmed!</p>`}
            </div>
        `;
    });

    list.innerHTML = html;
}

// ================= CONFIRM ORDER =================
async function confirmOrder(orderId) {
    try {
        const response = await fetch(API_URL + "/api/order/" + orderId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "Confirmed" })
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) loadOrders();
    } catch (error) {
        console.log("Error confirming order");
    }
}

// ================= CANCEL ORDER =================
async function cancelOrder(orderId) {
    try {
        const response = await fetch(API_URL + "/api/order/" + orderId, {
            method: "DELETE"
        });
        const data = await response.json();
        alert(data.message);
        if (response.ok) loadOrders();
    } catch (error) {
        console.log("Error cancelling order");
    }
}

// =====================================================
// PRODUCT CRUD FUNCTIONS
// =====================================================

// ① CREATE PRODUCT
const productForm = document.getElementById("productForm");
if (productForm) {
    productForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        if (!currentUser || currentUser.role !== "admin") {
            alert("Only admin can add products.");
            return;
        }

        const name = document.getElementById("productName").value.trim();
        const price = Number(document.getElementById("productPrice").value);
        const originalPriceValue = document.getElementById("productOriginalPrice").value;
        const originalPrice = originalPriceValue ? Number(originalPriceValue) : null;
        const category = document.getElementById("productCategory").value;
        const available = document.getElementById("productAvailable").value === "true";
        const message = document.getElementById("productMessage");

        if (!name) { message.style.color = "#EF4444"; message.innerText = "Product name is required."; return; }
        if (!price || price <= 0) { message.style.color = "#EF4444"; message.innerText = "Price must be greater than 0."; return; }
        if (!category) { message.style.color = "#EF4444"; message.innerText = "Please select a category."; return; }

        try {
            const response = await fetch(API_URL + "/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: currentUser.id, name, price, originalPrice, category, available })
            });

            const data = await response.json();

            if (response.ok) {
                message.style.color = "#10B981";
                message.innerText = data.message;
                productForm.reset();
                loadProducts();
                loadAdminProducts();
            } else {
                message.style.color = "#EF4444";
                message.innerText = data.message;
            }
        } catch (error) {
            message.style.color = "#EF4444";
            message.innerText = "Cannot connect to server.";
        }
    });
}

// ② READ ALL PRODUCTS - ADMIN
async function loadAdminProducts() {
    if (!currentUser || currentUser.role !== "admin") return;

    const productList = document.getElementById("adminProductList");
    if (!productList) return;

    try {
        const response = await fetch(API_URL + "/api/products");
        const data = await response.json();

        if (!response.ok) {
            productList.innerHTML = `<tr><td colspan="6">${data.message}</td></tr>`;
            return;
        }

        const adminProducts = data.products || [];

        if (adminProducts.length === 0) {
            productList.innerHTML = `<tr><td colspan="6">No products available.</td></tr>`;
            return;
        }

        let html = "";

        adminProducts.forEach(product => {
            html += `
                <tr>
                    <td>${product.id}</td>
                    <td>${product.name}</td>
                    <td>৳${product.price}</td>
                    <td>${product.category}</td>
                    <td>${product.available ? "Available" : "Not Available"}</td>
                    <td>
                        <button type="button" onclick="updateProductPrice(${product.id})">Update Price</button>
                        <button type="button" class="delete-button" onclick="deleteProduct(${product.id})">Delete</button>
                    </td>
                </tr>
            `;
        });

        productList.innerHTML = html;
    } catch (error) {
        productList.innerHTML = `<tr><td colspan="6">Cannot connect to server.</td></tr>`;
    }
}

// ③ UPDATE PRODUCT PRICE
async function updateProductPrice(productId) {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Only admin can update products.");
        return;
    }

    const newPrice = prompt("Enter the new price:");
    if (newPrice === null) return;

    const price = Number(newPrice);
    if (!price || price <= 0) {
        alert("Price must be greater than 0.");
        return;
    }

    try {
        const response = await fetch(API_URL + "/api/products/" + productId, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id, price: price })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadProducts();
            loadAdminProducts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Cannot connect to server.");
    }
}

// ④ DELETE PRODUCT
async function deleteProduct(productId) {
    if (!currentUser || currentUser.role !== "admin") {
        alert("Only admin can delete products.");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete this product?");
    if (!confirmDelete) return;

    try {
        const response = await fetch(API_URL + "/api/products/" + productId, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: currentUser.id })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadProducts();
            loadAdminProducts();
        } else {
            alert(data.message);
        }
    } catch (error) {
        alert("Cannot connect to server.");
    }
}

// ================= INITIAL PAGE LOAD =================
loadProducts();
updateCartUI();
updateUserInfo();
