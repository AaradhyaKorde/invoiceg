import mongoose from "mongoose";

const lineItemSchema = new mongoose.Schema(
  {
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    itemName: { type: String, required: true },
    variant: { type: String, default: "" },
    quantity: { type: Number, required: true, min: 1 },
    basePrice: { type: Number, required: true, min: 0 },
    gstPercent: { type: Number, required: true, min: 0 },
    discountType: { type: String, enum: ["PERCENT", "ABSOLUTE"], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    subtotalBeforeDiscount: { type: Number, required: true },
    discountAmount: { type: Number, required: true },
    taxableAmount: { type: Number, required: true },
    gstAmount: { type: Number, required: true },
    rowTotal: { type: Number, required: true },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    customer: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      email: { type: String, required: true },
      billingAddress: { type: String, required: true },
    },
    lineItems: [lineItemSchema],
    totals: {
      subtotal: { type: Number, required: true },
      totalDiscount: { type: Number, required: true },
      totalGst: { type: Number, required: true },
      grandTotal: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
