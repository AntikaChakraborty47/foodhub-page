const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let users = [];
let orders = [];
let products = [];
let orderIdCounter = 1;
let productIdCounter = 1;

// ================= DEMO ADMIN =================
users.push({
    id: 1,
    username: "admin",
    email: "admin@foodhub.com",
    password: "admin12345",
    role: "admin"
});

// ================= HOME =================
app.get("/api", (req, res) => {
    res.json({ message: "FoodHub Backend is running successfully!" });
});

// ================= REGISTER =================
app.post("/api/register", (req, res) => {
    const { username, email, password } = req.body;

    if (!username) return res.status(400).json({ message: "Username is required" });
    if (!email) return res.status(400).json({ message: "Email is required" });
    if (!password) return res.status(400).json({ message: "Password is required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) return res.status(400).json({ message: "Username or Email already exists" });

    const userRole = users.length === 0 ? "admin" : "customer";
    const newUser = { id: users.length + 1, username, email, password, role: userRole };
    users.push(newUser);

    res.status(201).json({ message: "Registration successful! Role: " + userRole });
});

// ================= LOGIN =================
app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    if (!username) return res.status(400).json({ message: "Username is required" });
    if (!password) return res.status(400).json({ message: "Password is required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.password !== password) return res.status(401).json({ message: "Incorrect password" });

    res.json({
        message: "Login successful!",
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
});

// ================= PRODUCT CRUD =================

// ① CREATE PRODUCT
app.post("/api/products", (req, res) => {
    const { userId, name, price, originalPrice, category, available } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can add products" });
    }

    if (!name) return res.status(400).json({ message: "Product name is required" });
    if (!price || price <= 0) return res.status(400).json({ message: "Price must be greater than 0" });
    if (!category) return res.status(400).json({ message: "Category is required" });

    const newProduct = {
        id: productIdCounter++,
        name, price,
        originalPrice: originalPrice || null,
        category,
        available: available !== false
    };

    products.push(newProduct);
    res.status(201).json({ message: "Product added successfully!", product: newProduct });
});

// ② READ ALL PRODUCTS
app.get("/api/products", (req, res) => {
    res.json({ products });
});

// ③ UPDATE PRODUCT
app.put("/api/products/:id", (req, res) => {
    const productId = parseInt(req.params.id);
    const { userId, name, price, originalPrice, category, available } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can update products" });
    }

    const product = products.find(p => p.id === productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (name) product.name = name;
    if (price) product.price = price;
    if (originalPrice !== undefined) product.originalPrice = originalPrice;
    if (category) product.category = category;
    if (available !== undefined) product.available = available;

    res.json({ message: "Product updated successfully!", product });
});

// ④ DELETE PRODUCT
app.delete("/api/products/:id", (req, res) => {
    const productId = parseInt(req.params.id);
    const { userId } = req.body;

    const user = users.find(u => u.id === userId);
    if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Only admin can delete products" });
    }

    const index = products.findIndex(p => p.id === productId);
    if (index === -1) return res.status(404).json({ message: "Product not found" });

    products.splice(index, 1);
    res.json({ message: "Product deleted successfully!" });
});

// ================= CREATE ORDER =================
app.post("/api/order", (req, res) => {
    const { userId, items, subtotal, delivery, total, phone, address } = req.body;

    if (!userId) return res.status(401).json({ message: "Please login first" });
    const user = users.find(u => u.id === userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!phone) return res.status(400).json({ message: "Mobile number is required" });
    if (phone.length < 11) return res.status(400).json({ message: "Please enter a valid mobile number" });
    if (!address) return res.status(400).json({ message: "Delivery address is required" });
    if (!items || items.length === 0) return res.status(400).json({ message: "Cart is empty" });

    const newOrder = {
        id: orderIdCounter++, userId, items, subtotal, delivery, total, phone, address,
        status: "Pending",
        createdAt: new Date().toISOString()
    };

    orders.push(newOrder);
    res.status(201).json({ message: "Order placed successfully!", order: newOrder });
});

// ================= READ ORDERS =================
app.get("/api/orders/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = orders.filter(o => o.userId === userId);
    res.json({ orders: userOrders });
});

// ================= UPDATE ORDER =================
app.put("/api/order/:id", (req, res) => {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (order.status === "Confirmed") return res.status(400).json({ message: "Order already confirmed" });

    order.status = "Confirmed";
    res.json({ message: "Order confirmed!", order });
});

// ================= DELETE ORDER =================
app.delete("/api/order/:id", (req, res) => {
    const orderId = parseInt(req.params.id);
    const index = orders.findIndex(o => o.id === orderId);

    if (index === -1) return res.status(404).json({ message: "Order not found" });
    if (orders[index].status === "Confirmed") return res.status(400).json({ message: "Confirmed order cannot be cancelled" });

    orders.splice(index, 1);
    res.json({ message: "Order cancelled successfully" });
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log("FoodHub Backend is running on port " + PORT);
});