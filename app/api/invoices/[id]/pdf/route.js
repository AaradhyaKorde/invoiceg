import { NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { connectDB } from "@/lib/db";
import { Invoice } from "@/models/Invoice";

function currency(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

export async function GET(_request, { params }) {
  await connectDB();
  const { id } = await params;
  const invoice = await Invoice.findById(id);

  if (!invoice) {
    return NextResponse.json({ message: "Invoice not found" }, { status: 404 });
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
      line.discountType === "PERCENT"
        ? `${line.discountValue}%`
        : currency(line.discountValue),
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

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${invoice.invoiceNumber}.pdf`,
    },
  });
}
