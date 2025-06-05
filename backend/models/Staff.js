const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String, // Will be hashed
  role: { type: String, default: "Staff" }
});

module.exports = mongoose.model("Staff", staffSchema);
