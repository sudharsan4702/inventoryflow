const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

mongoose.connect("mongodb://localhost:27017/inventoryDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const { Admin } = require("./server");


async function createAdmin() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = new Admin({ email: "admin@nutrifresh.com", password: hashedPassword });

  await admin.save();
  console.log("Admin created successfully");
  mongoose.connection.close();
}

createAdmin();
