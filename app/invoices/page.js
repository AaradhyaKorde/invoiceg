"use client";

import { useEffect, useState } from "react";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then(setInvoices);
  }, []);

  return (
    <main className="card">
      <h2>Invoice History</h2>
      <table>
        <thead>
          <tr>
            <th>Invoice Number</th>
            <th>Customer Name</th>
            <th>Date</th>
            <th>Grand Total</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.customer?.fullName}</td>
              <td>{new Date(invoice.invoiceDate).toLocaleDateString()}</td>
              <td>INR {Number(invoice.totals?.grandTotal || 0).toFixed(2)}</td>
              <td>
                <a href={`/invoices/${invoice._id}`}>View</a>{" "}
                <a href={`/api/invoices/${invoice._id}/pdf`} download>
                  Download
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
