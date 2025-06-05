const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
// const adminRoutes = require("./routes/adminRoutes");
const app = express();

app.use(express.json());
app.use(cors());

// app.use(adminRoutes);

// Serve uploaded images as static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose.connect("mongodb://localhost:27017/inventoryDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

const authMiddleware = (req, res, next) => {
  const tokenHeader = req.header("Authorization");
  if (!tokenHeader) {
    return res.status(403).json({ message: "Access denied" });
  }

  const token = tokenHeader.startsWith("Bearer ") ? tokenHeader.split(" ")[1] : tokenHeader;

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("JWT Payload:", verified);
    req.admin = verified;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid token" });
  }
};


const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model("Admin", adminSchema);
module.exports = { Admin };

const otpGenerator = require("otp-generator");
const sendOtp = require("./utils/sendOtp"); // Import email sender

const otpStorage = {}; // Temporary storage for OTPs

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Generate OTP
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, specialChars: false });
    
    // ✅ Store OTP with expiry (5 minutes)
    otpStorage[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // ✅ Send OTP to email
    await sendOtp(email, otp);

    res.status(200).json({ message: "OTP sent to email", email });

  } catch (error) {
    res.status(500).json({ message: "Error", error });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  if (!otpStorage[email] || otpStorage[email].expiresAt < Date.now()) {
    return res.status(400).json({ message: "OTP expired. Please login again." });
  }

  if (otpStorage[email].otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP. Try again." });
  }

  // ✅ OTP is correct, issue JWT
  const token = jwt.sign({ adminId: email }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Clear OTP from storage
  delete otpStorage[email];

  // ✅ Send token in response
  res.json({ message: "Login successful", token });
});





// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  image: { type: String }, // URL of uploaded image
});

const Product = mongoose.model("Product", productSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true },
    },
  ],
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

// Multer setup for image upload
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Product Routes
app.get("/products",authMiddleware, async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products", error });
  }
});

app.post("/add-product",authMiddleware, upload.single("image"), async (req, res) => {
  const { name, category, quantity, price } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : "";

  const newProduct = new Product({ name, category, quantity, price, image });

  try {
    await newProduct.save();
    await addActivityLog(`Product Added: ${name}`);
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error adding product", error });
  }
});


app.put("/update-product/:id",authMiddleware, upload.single("image"), async (req, res) => {
  const { name, category, quantity, price } = req.body;
  let updateData = { name, category, quantity, price };

  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    await addActivityLog(`Product updated: ${name}`);
    res.json({ message: "Product updated", product: updatedProduct });
    
  } catch (error) {
    res.status(500).json({ message: "Error updating product", error });
  }
});

app.delete("/delete-product/:id",authMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    await addActivityLog(`Product deleted: ${name}`);
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting product", error });
  }
});

// Add Order Route
app.post("/add-order",authMiddleware, async (req, res) => {
  try {
    const { items } = req.body; // items = [{ productId, quantity }]
    
    // Check if stock is available for each product
    for (let item of items) {
      const product = await Product.findById(item.productId);
      if (!product || product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((total, item) => total + item.price * item.quantity, 0);

    // Create new order
    const newOrder = new Order({
      items,
      totalAmount,
      status: "Pending",
      createdAt: new Date(),
    });

    await newOrder.save();
    await addActivityLog(`Order placed`);
    res.status(201).json({ message: "Order placed successfully", newOrder });

  } catch (error) {
    console.error("Error placing order:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/update-order/:id", authMiddleware, async (req, res) => {
  const { status } = req.body;

  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // If changing status to "Completed", deduct stock
    if (status === "Completed" && order.status !== "Completed") {
      for (let item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product || product.quantity < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${product ? product.name : "Product"}` });
        }
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: -item.quantity },
        });
      }
    }

    // If changing status from "Completed" to anything else, prevent the change
    if (order.status === "Completed" && status !== "Completed") {
      return res.status(400).json({ message: "Completed orders cannot be modified" });
    }

    // If the order is being canceled, restore stock
    if (status === "Canceled" && order.status !== "Canceled") {
      for (let item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantity: item.quantity },
        });
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    res.json({ message: "Order status updated", order });

  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({ message: "Error updating order", error });
  }
});


// Fetch Orders
app.get("/orders",authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().populate("items.productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error });
  }
});

app.get("/dashboard-data",authMiddleware, async (req, res) => {
  try {
    // Fetch orders and products
    const orders = await Order.find();
    const products = await Product.find();

    // 1️⃣ Calculate Total Sales
    const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    // 2️⃣ Total Orders
    const totalOrders = orders.length;

    // 3️⃣ Count Orders by Status
    const pendingOrders = orders.filter(order => order.status === "Pending").length;
    const completedOrders = orders.filter(order => order.status === "Completed").length;
    const canceledOrders = orders.filter(order => order.status === "Canceled").length;

    // 4️⃣ Total Inventory Count
    const inventoryCount = products.length;

    // 5️⃣ Low Stock Products (Quantity < 10)
    const lowStock = await Product.find({ quantity: { $lt: 10 } }) // Adjust threshold as needed
  .select("name quantity"); // Ensure it returns name & quantity

    // console.log("Low Stock Data:", lowStock);

    // 6️⃣ Top Selling Products (Based on Order Quantity)
const productSales = {};
const productOrderCount = {}; // Track how many orders contain each product

orders.forEach(order => {
  order.items.forEach(item => {
    const productId = item.productId.toString();
    productSales[productId] = (productSales[productId] || 0) + item.quantity;
    productOrderCount[productId] = (productOrderCount[productId] || 0) + 1; // Count orders that contain this product
  });
});

// Sort by highest quantity sold
const topSellingProducts = Object.entries(productSales)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([id, qty]) => {
    const product = products.find(p => p._id.toString() === id);
    return product
      ? {
          name: product.name,
          quantitySold: qty,
          totalOrders: productOrderCount[id] || 0, // Number of orders containing this product
        }
      : null;
  })
  .filter(Boolean);


    // 7️⃣ Monthly Sales Data
    const monthlySales = {};
    orders.forEach(order => {
      const month = new Date(order.createdAt).toLocaleString("default", { month: "short" });
      monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
    });

    const monthlySalesArray = Object.keys(monthlySales).map(month => ({
      month,
      sales: monthlySales[month],
    }));

    // 8️⃣ Sales Change (Last 2 Months)
    const salesValues = Object.values(monthlySales);
    const salesChange = salesValues.length > 1
      ? ((salesValues[salesValues.length - 1] - salesValues[salesValues.length - 2]) / salesValues[salesValues.length - 2]) * 100
      : 0;

    // Return the data
    res.json({
      totalSales,
      totalOrders,
      pendingOrders,
      completedOrders,
      canceledOrders,
      inventoryCount,
      lowStock,
      topSellingProducts,
      salesChange,
      monthlySales: monthlySalesArray,
    });
    
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Error fetching dashboard data" });
  }
});

app.get("/recent-orders",authMiddleware, async (req, res) => {
  try {
    const recentOrders = await Order.find().sort({ createdAt: -1 }).limit(5);
    res.json(recentOrders);
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    res.status(500).json({ error: "Failed to fetch recent orders" });
  }
});

app.get("/weekly-sales",authMiddleware, async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const salesData = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          totalSales: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(salesData);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch weekly sales data" });
  }
});


const getMonthlySales = async () => {
  const orders = await Order.find({ status: "Completed" });
  const monthlySales = {};

  orders.forEach((order) => {
    const month = new Date(order.createdAt).toLocaleString("default", { month: "short" });
    monthlySales[month] = (monthlySales[month] || 0) + order.totalAmount;
  });

  return Object.entries(monthlySales).map(([month, totalSales]) => ({ month, totalSales }));
};

// 📌 Get Detailed Sales Report
app.get("/sales", authMiddleware, async (req, res) => {
  try {
    const orders = await Order.find({ status: "Completed" }).populate("items.productId");
    if (!orders.length) {
      return res.json({
        totalRevenue: 0,
        totalProductsSold: 0,
        salesByMonth: [],
        peakOrderTimes: [],
        bestSellingProduct: "N/A",
        leastSellingProduct: "N/A"
      });
    }
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalProductsSold = orders.reduce((sum, order) => sum + order.items.reduce((acc, item) => acc + item.quantity, 0), 0);
    const peakOrderTimes = orders.map(order => new Date(order.createdAt).getHours());
    const peakOrderHours = [...new Set(peakOrderTimes)].sort((a, b) => peakOrderTimes.filter(h => h === b).length - peakOrderTimes.filter(h => h === a).length).slice(0, 3);
    const salesByMonth = await getMonthlySales();
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId._id.toString();
        productSales[productId] = (productSales[productId] || 0) + item.quantity;
      });
    });
    const bestSellingId = Object.keys(productSales).reduce((a, b) => (productSales[a] > productSales[b] ? a : b), null);
    const leastSellingId = Object.keys(productSales).reduce((a, b) => (productSales[a] < productSales[b] ? a : b), null);
    const products = await Product.find({ _id: { $in: [bestSellingId, leastSellingId] } });
    const bestSellingProduct = products.find(p => p._id.toString() === bestSellingId)?.name || "N/A";
    const leastSellingProduct = products.find(p => p._id.toString() === leastSellingId)?.name || "N/A";
    res.json({
      totalRevenue,
      totalProductsSold,
      salesByMonth,
      peakOrderTimes: peakOrderHours.map(h => `${h}:00 - ${h + 1}:00`),
      bestSellingProduct,
      leastSellingProduct
    });
  } catch (error) {
    console.error("Sales endpoint error:", error);
    res.status(500).json({ error: "Error fetching sales data" });
  }
});

// 📌 Get Category-wise Sales Report
app.get("/category-sales", authMiddleware, async (req, res) => {
  try {
    const categorySales = await Order.aggregate([
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.productId", foreignField: "_id", as: "productDetails" } },
      { $unwind: "$productDetails" },
      { $group: { _id: "$productDetails.category", totalSales: { $sum: "$items.quantity" } } },
    ]);
    const formattedData = {};
    categorySales.forEach((entry) => {
      formattedData[entry._id] = entry.totalSales;
    });
    res.json(formattedData || {});
  } catch (error) {
    console.error("Error fetching category sales:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 📌 Get Returns & Cancellations Report
app.get("/returns", authMiddleware, async (req, res) => {
  try {
    const returnedOrders = await Order.find({ status: "Returned" }).populate("items.productId");
    if (!returnedOrders.length) {
      return res.json([{ productName: "N/A", count: 0 }]);
    }
    const returnCounts = {};
    returnedOrders.forEach(order => {
      order.items.forEach(item => {
        const productId = item.productId._id.toString();
        returnCounts[productId] = (returnCounts[productId] || 0) + item.quantity;
      });
    });
    const mostReturnedId = Object.keys(returnCounts).reduce((a, b) => (returnCounts[a] > returnCounts[b] ? a : b), null);
    const mostReturnedProduct = await Product.findById(mostReturnedId)?.name || "N/A";
    res.json([{ productName: mostReturnedProduct, count: returnCounts[mostReturnedId] || 0 }]);
  } catch (error) {
    console.error("Error fetching return data:", error);
    res.status(500).json({ error: "Error fetching return data" });
  }
});
// ✅ Define the Mongoose Schema & Model (Fix the error)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "Staff" },
});

const User = mongoose.model("User", userSchema);

const checkAdmin = (req, res, next) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

const activityLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g., "Added Product: Apple"
  timestamp: { type: Date, default: Date.now }
});
const ActivityLog=mongoose.model("ActivityLog", activityLogSchema);
// Get all activity logs
app.get("/activity-log",authMiddleware, async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }); // Show latest first
    res.json(logs);
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Error fetching logs" });
  }
});
const addActivityLog = async (action) => {
  try {
    await ActivityLog.create({ action });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

// Request Password Change (Send OTP)
app.post("/request-password-change", authMiddleware, async (req, res) => {
  const { adminId } = req.admin;
  console.log("Admin ID before cleaning:", adminId);
  const cleanEmail = String(adminId).trim().replace(/['"]/g, ""); // Force to string and clean
  console.log("Cleaned email:", cleanEmail);
  try {
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, specialChars: false });
    console.log("Generated OTP:", otp);
    otpStorage[cleanEmail] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    console.log("Sending OTP to:", cleanEmail);
    await sendOtp(cleanEmail, otp);
    console.log("OTP sent successfully");
    res.status(200).json({ message: "OTP sent to email", email: cleanEmail });
  } catch (error) {
    console.error("Error requesting password change:", error.message);
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
});

// Change Password (Verify OTP and Update)
app.post("/change-password", authMiddleware, async (req, res) => {
  const { adminId } = req.admin;
  const cleanEmail = String(adminId).trim().replace(/['"]/g, "");
  console.log("Verifying OTP for:", cleanEmail);
  console.log("Current otpStorage:", otpStorage[cleanEmail]);
  console.log("Current time:", Date.now());
  if (!otpStorage[cleanEmail] || otpStorage[cleanEmail].expiresAt < Date.now()) {
    console.log("OTP not found or expired");
    return res.status(400).json({ message: "OTP expired. Please request a new one." });
  }
  const { otp, newPassword } = req.body;
  if (otpStorage[cleanEmail].otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP. Try again." });
  }
  try {
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();
    delete otpStorage[cleanEmail];
    await addActivityLog(`Password changed for admin: ${cleanEmail}`);
    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error updating password", error });
  }
});

app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const cleanEmail = String(email).trim().replace(/['"]/g, "");
  console.log("Forgot password request for:", cleanEmail);
  try {
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(404).json({ message: "Email not found" });
    }
    const otp = otpGenerator.generate(6, { digits: true, alphabets: false, specialChars: false });
    console.log("Generated OTP:", otp);
    otpStorage[cleanEmail] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };
    console.log("Sending OTP to:", cleanEmail);
    await sendOtp(cleanEmail, otp);
    console.log("OTP sent successfully");
    res.status(200).json({ message: "OTP sent to email", email: cleanEmail });
  } catch (error) {
    console.error("Error in forgot password:", error.message);
    res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
});

// Reset Password - Verify OTP and Update
app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const cleanEmail = String(email).trim().replace(/['"]/g, "");
  console.log("Resetting password for:", cleanEmail);
  console.log("Current otpStorage:", otpStorage[cleanEmail]);
  console.log("Current time:", Date.now());
  if (!otpStorage[cleanEmail] || otpStorage[cleanEmail].expiresAt < Date.now()) {
    console.log("OTP not found or expired");
    return res.status(400).json({ message: "OTP expired. Please request a new one." });
  }
  if (otpStorage[cleanEmail].otp !== otp) {
    return res.status(400).json({ message: "Invalid OTP. Try again." });
  }
  try {
    const admin = await Admin.findOne({ email: cleanEmail });
    if (!admin) {
      return res.status(404).json({ message: "Email not found" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedPassword;
    await admin.save();
    delete otpStorage[cleanEmail];
    await addActivityLog(`Password reset for admin: ${cleanEmail}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password", error });
  }
});
// Start Server
app.listen(5000, () => console.log("Server running on port 5000"));
