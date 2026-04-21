import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Item } from "@/models/Item";
import { Invoice } from "@/models/Invoice";
import { InvoiceCounter } from "@/models/InvoiceCounter";
import { calculateInvoiceTotals, calculateLineItem } from "@/lib/invoiceMath";

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

export async function GET() {
  await connectDB();
  const invoices = await Invoice.find({})
    .select("invoiceNumber invoiceDate customer.fullName totals.grandTotal")
    .sort({ createdAt: -1 });
  return NextResponse.json(invoices);
}

export async function POST(request) {
  await connectDB();
  const body = await request.json();
  const sourceLines = body.lineItems || [];

  if (!sourceLines.length) {
    return NextResponse.json(
      { message: "At least one line item is required" },
      { status: 400 }
    );
  }

  const normalizedLineItems = [];
  for (const line of sourceLines) {
    const item = await Item.findById(line.itemId);
    if (!item) {
      return NextResponse.json(
        { message: `Item not found for id ${line.itemId}` },
        { status: 400 }
      );
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
  const dueDate = body.dueDate
    ? new Date(body.dueDate)
    : new Date(invoiceDate.getTime() + 15 * 24 * 60 * 60 * 1000);

  const invoice = await Invoice.create({
    invoiceNumber,
    invoiceDate,
    dueDate,
    customer: body.customer,
    lineItems: normalizedLineItems,
    totals,
  });

  return NextResponse.json(invoice, { status: 201 });
}
