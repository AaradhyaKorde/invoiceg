import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    variants: [{ type: String }],
    basePrice: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export const Item = mongoose.models.Item || mongoose.model("Item", itemSchema);
