const express = require("express");
const router = express.Router();
const ActivityLog = require("../models/ActivityLog");
const authMiddleware = require("../server");

// Get all activity logs
router.get("/activity-log", async (req, res) => {
  try {
    const logs = await ActivityLog.find().sort({ timestamp: -1 }); // Show latest first
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Error fetching logs" });
  }
});

// Function to log activity (used in product & order routes)
const addActivityLog = async (action) => {
  try {
    await ActivityLog.create({ action });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};

module.exports = { router, addActivityLog };
