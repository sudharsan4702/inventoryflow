import express from "express";
import Product from "../models/product.js";

const router = express.Router();

// Get all products
router.get("/", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Create a new product
router.post("/", async (req, res) => {
  const { name, price, stock, category } = req.body;
  const product = new Product({ name, price, stock, category });
  await product.save();
  res.json(product);
});

// Update a product
router.put("/:id", async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(product);
});

// Delete a product
router.delete("/:id", async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

export default router;
