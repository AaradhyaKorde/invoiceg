import mongoose from "mongoose";

const invoiceCounterSchema = new mongoose.Schema({
  _id: { type: String, default: "invoice" },
  seq: { type: Number, default: 0 },
});

export const InvoiceCounter =
  mongoose.models.InvoiceCounter ||
  mongoose.model("InvoiceCounter", invoiceCounterSchema);
