const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ✅ Define the User Schema & Model
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "Staff" },
});

const User = mongoose.model("User", userSchema);

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/inventorydb", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log("Connected to MongoDB");

    // ✅ Hash the admin password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // ✅ Admin User Object
    const adminUser = new User({
      name: "Admin",
      email: "admin@example.com",
      password: hashedPassword,
      role: "Admin",
    });

    // ✅ Check if Admin already exists
    const existingAdmin = await User.findOne({ email: "admin@example.com" });
    if (existingAdmin) {
      console.log("Admin user already exists.");
    } else {
      await adminUser.save();
      console.log("Admin user created successfully.");
    }

    mongoose.connection.close();
  })
  .catch((err) => console.error("MongoDB connection error:", err));
