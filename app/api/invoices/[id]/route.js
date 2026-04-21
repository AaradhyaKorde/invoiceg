import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";

export async function GET(_request, { params }) {
  await connectDB();
  const { id } = await params;

  const invoice = await Invoice.findById(id);
  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}
