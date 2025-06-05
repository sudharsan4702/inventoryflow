import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
      quantity: { type: Number, required: true }
    }
  ],
  totalPrice: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
