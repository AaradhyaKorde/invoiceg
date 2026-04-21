"use client";

import { useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";

function money(value) {
  return `INR ${Number(value || 0).toFixed(2)}`;
}

export default function InvoiceViewPage({ params }) {
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      setLoading(true);
      setError("");

      const { id } = await params;
      const res = await fetch(apiUrl(`/api/invoices/${id}`));
      const data = await res.json();

      if (!isMounted) return;

      if (!res.ok) {
        setError(data.message || "Failed to load invoice");
        setInvoice(null);
      } else {
        setInvoice(data);
      }

      setLoading(false);
    }

    loadInvoice();
    return () => {
      isMounted = false;
    };
  }, [params]);

  return (
    <main className="card">
      <h2>Invoice Viewer</h2>

      {loading && <p>Loading invoice...</p>}
      {!loading && error && <p>{error}</p>}

      {!loading && invoice && (
        <>
          <div className="invoiceMeta">
            <p>
              <strong>Invoice Number:</strong> {invoice.invoiceNumber}
            </p>
            <p>
              <strong>Invoice Date:</strong> {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            <p>
              <strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}
            </p>
          </div>

          <h3>Customer</h3>
          <div className="invoiceMeta">
            <p>
              <strong>Name:</strong> {invoice.customer?.fullName}
            </p>
            <p>
              <strong>Phone:</strong> {invoice.customer?.phone}
            </p>
            <p>
              <strong>Email:</strong> {invoice.customer?.email}
            </p>
            <p>
              <strong>Address:</strong> {invoice.customer?.billingAddress}
            </p>
          </div>

          <h3>Line Items</h3>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Variant</th>
                <th>Qty</th>
                <th>Base Price</th>
                <th>GST %</th>
                <th>Discount</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems?.map((line, index) => (
                <tr key={`${line.itemId}-${index}`}>
                  <td>{line.itemName}</td>
                  <td>{line.variant || "Standard"}</td>
                  <td>{line.quantity}</td>
                  <td>{money(line.basePrice)}</td>
                  <td>{line.gstPercent}%</td>
                  <td>{line.discountType === "PERCENT" ? `${line.discountValue}%` : money(line.discountValue)}</td>
                  <td>{money(line.rowTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="summary">
            <p>Subtotal: {money(invoice.totals?.subtotal)}</p>
            <p>Total Discount: {money(invoice.totals?.totalDiscount)}</p>
            <p>Total GST: {money(invoice.totals?.totalGst)}</p>
            <p>
              <strong>Grand Total: {money(invoice.totals?.grandTotal)}</strong>
            </p>
          </div>

          <div className="actions">
            <a href={apiUrl(`/api/invoices/${invoice._id}/pdf`)} download>
              Download PDF
            </a>
          </div>
        </>
      )}
    </main>
  );
}
