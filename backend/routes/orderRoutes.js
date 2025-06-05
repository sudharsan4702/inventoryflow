import express from "express";
import Order from "../models/order.js";

const router = express.Router();

// Get all orders
router.get("/", async (req, res) => {
  const orders = await Order.find().populate("products.product");
  res.json(orders);
});

// Create an order
router.post("/", async (req, res) => {
  const { products, totalPrice } = req.body;
  const order = new Order({ products, totalPrice });
  await order.save();
  res.json(order);
});

export default router;
