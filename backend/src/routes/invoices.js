import { Router } from "express";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Item } from "../models/Item.js";
import { Invoice } from "../models/Invoice.js";
import { InvoiceCounter } from "../models/InvoiceCounter.js";
import { calculateInvoiceTotals, calculateLineItem } from "../lib/invoiceMath.js";

const router = Router();

function buildInvoiceNumber(seq) {
  return `INV-${new Date().getFullYear()}-${String(seq).padStart(4, "0")}`;
}

async function getNextInvoiceNumber() {
  const counter = await InvoiceCounter.findOneAndUpdate(
    { _id: "invoice" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return buildInvoiceNumber(counter.seq);
}

function currency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

router.get("/", async (_req, res) => {
  const invoices = await Invoice.find({})
    .select("invoiceNumber invoiceDate customer.fullName totals.grandTotal")
    .sort({ createdAt: -1 });
  res.json(invoices);
});

router.post("/", async (req, res) => {
  const body = req.body;
  const sourceLines = body.lineItems || [];

  if (!sourceLines.length) {
    return res.status(400).json({ message: "At least one line item is required" });
  }

  const normalizedLineItems = [];
  for (const line of sourceLines) {
    const item = await Item.findById(line.itemId);
    if (!item) {
      return res.status(400).json({ message: `Item not found for id ${line.itemId}` });
    }

    const calculated = calculateLineItem({
      quantity: line.quantity,
      basePrice: item.basePrice,
      gstPercent: line.gstPercent,
      discountType: line.discountType,
      discountValue: line.discountValue,
    });

    normalizedLineItems.push({
      itemId: item._id,
      itemName: item.name,
      variant: line.variant || "",
      ...calculated,
    });
  }

  const totals = calculateInvoiceTotals(normalizedLineItems);
  const invoiceNumber = await getNextInvoiceNumber();
  const invoiceDate = body.invoiceDate ? new Date(body.invoiceDate) : new Date();
  const dueDate = body.dueDate ? new Date(body.dueDate) : new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000);

  const invoice = await Invoice.create({
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer: body.customer,
    lineItems: normalizedLineItems,
    totals,
  });

  return res.status(201).json(invoice);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }
  return res.json(invoice);
});

router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let y = margin;

  const addHeading = (text, size = 11) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.text(text, margin, y);
    y += size + 8;
  };

  const addBody = (text, size = 10, indent = 0) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    const blockHeight = lines.length * (size + 2);
    if (y + blockHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(lines, margin + indent, y);
    y += blockHeight;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Invoice", doc.internal.pageSize.getWidth() / 2, y, { align: "center" });
  y += 28;

  addBody(`Invoice Number: ${invoice.invoiceNumber}`);
  addBody(`Invoice Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`);
  addBody(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
  y += 6;

  addHeading("Billed To:");
  addBody(`Name: ${invoice.customer.fullName}`);
  addBody(`Phone: ${invoice.customer.phone}`);
  addBody(`Email: ${invoice.customer.email}`);
  addBody(`Address: ${invoice.customer.billingAddress}`);
  y += 8;

  addHeading("Line Items");
  autoTable(doc, {
    startY: y,
    head: [["#", "Item", "Variant", "Qty", "Base", "GST %", "Discount", "Total"]],
    body: invoice.lineItems.map((line, idx) => [
      String(idx + 1),
      line.itemName,
      line.variant || "Standard",
      String(line.quantity),
      currency(line.basePrice),
      `${line.gstPercent}%`,
      line.discountType === "PERCENT" ? `${line.discountValue}%` : currency(line.discountValue),
      currency(line.rowTotal),
    ]),
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [29, 78, 216],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
  });
  y = (doc.lastAutoTable?.finalY || y) + 14;

  addHeading("Calculation Summary");
  addBody(`Subtotal: ${currency(invoice.totals.subtotal)}`);
  addBody(`Total Discount: - ${currency(invoice.totals.totalDiscount)}`);
  addBody(`Total GST: + ${currency(invoice.totals.totalGst)}`);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`Grand Total: ${currency(invoice.totals.grandTotal)}`, margin, y);
  y += 18;

  addHeading("Terms & Conditions");
  addBody("1. Payment is due within 15 days of invoice date.");
  addBody("2. Late fee of 2% per month applies to overdue balances.");
  addBody("3. Subject to local jurisdiction.");

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${invoice.invoiceNumber}.pdf`);
  return res.status(200).send(pdfBuffer);
});

export default router;
