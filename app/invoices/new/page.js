"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateInvoiceTotals, calculateLineItem } from "@/lib/invoiceMath";

const emptyLine = {
  itemId: "",
  variant: "",
  quantity: 1,
  gstPercent: 5,
  discountType: "PERCENT",
  discountValue: 0,
};

export default function NewInvoicePage() {
  const [items, setItems] = useState([]);
  const [lineItems, setLineItems] = useState([emptyLine]);
  const [createdInvoice, setCreatedInvoice] = useState(null);
  const [customer, setCustomer] = useState({
    fullName: "",
    phone: "",
    email: "",
    billingAddress: "",
  });
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    fetch("/api/items")
      .then((res) => res.json())
      .then(setItems);
  }, []);

  // Get available variants for current line, given its itemId
  function getVariantsForLine(itemId) {
    const item = items.find((i) => i._id === itemId);
    // If no item or no variants field, return empty array
    return item && Array.isArray(item.variants) ? item.variants : [];
  }

  const computedLines = useMemo(() => {
    return lineItems.map((line) => {
      const selectedItem = items.find((i) => i._id === line.itemId);
      if (!selectedItem) return { ...line, rowTotal: 0, gstAmount: 0, discountAmount: 0, subtotalBeforeDiscount: 0 };
      return {
        ...line,
        itemName: selectedItem.name,
        ...calculateLineItem({
          ...line,
          basePrice: selectedItem.basePrice,
        }),
      };
    });
  }, [lineItems, items]);

  const totals = useMemo(() => calculateInvoiceTotals(computedLines), [computedLines]);

  function updateLine(index, key, value) {
    const next = [...lineItems];
    // If user changes item, clear previous variant (since variants differ by item)
    if (key === "itemId") {
      next[index] = { ...next[index], itemId: value, variant: "" };
    } else {
      next[index] = { ...next[index], [key]: value };
    }
    setLineItems(next);
  }

  // Workaround: Keep a string for editing discountValue, but convert to number as soon as onBlur
  function handleDiscountChange(index, value) {
    // Allow empty string for user editing, but only numbers otherwise
    const _value = value === "" ? "" : Number(value);
    const next = [...lineItems];
    next[index] = { ...next[index], discountValue: _value };
    setLineItems(next);
  }

  function handleDiscountBlur(index, value) {
    // When blurred, convert to 0 if left blank
    const next = [...lineItems];
    let sanitized = Number(value);
    if (isNaN(sanitized)) sanitized = 0;
    next[index] = { ...next[index], discountValue: sanitized };
    setLineItems(next);
  }

  async function saveInvoice() {
    const payload = {
      customer,
      invoiceDate,
      dueDate,
      // For the payload, make sure discountValue is always a number
      lineItems: lineItems.filter((line) => line.itemId).map((line) => ({
        ...line,
        discountValue: Number(line.discountValue) || 0,
      })),
    };
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setCreatedInvoice(data);
  }

  return (
    <main className="card">
      <h2>New Invoice</h2>
      <div className="form twoCol">
        <input placeholder="Customer Full Name" value={customer.fullName} onChange={(e) => setCustomer({ ...customer, fullName: e.target.value })} />
        <input placeholder="Phone Number" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        <input placeholder="Email ID" value={customer.email} onChange={(e) => setCustomer({ ...customer, email: e.target.value })} />
        <input placeholder="Billing Address" value={customer.billingAddress} onChange={(e) => setCustomer({ ...customer, billingAddress: e.target.value })} />
        <label>Invoice Date <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} /></label>
        <label>Due Date <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
      </div>

      <h3>Line Items</h3>
      {lineItems.map((line, index) => {
        const variants = getVariantsForLine(line.itemId);
        return (
          <div className="lineRow" key={index}>
            <select value={line.itemId} onChange={(e) => updateLine(index, "itemId", e.target.value)}>
              <option value="">Select Item</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>{item.name}</option>
              ))}
            </select>
            {/* Only show and enable the variant dropdown if an item is selected */}
            <select
              value={line.variant}
              onChange={(e) => updateLine(index, "variant", e.target.value)}
              disabled={!line.itemId || variants.length === 0}
            >
              <option value="">{line.itemId ? (variants.length > 0 ? "Select Variant" : "No Variants") : "Select Item First"}</option>
              {variants.map((variant) => (
                <option key={variant} value={variant}>{variant}</option>
              ))}
            </select>
            <input type="number" min="1" value={line.quantity} onChange={(e) => updateLine(index, "quantity", Number(e.target.value))} />
            <select value={line.gstPercent} onChange={(e) => updateLine(index, "gstPercent", Number(e.target.value))}>
              {[5, 12, 18].map((gst) => <option key={gst} value={gst}>{gst}% GST</option>)}
            </select>
            <select value={line.discountType} onChange={(e) => updateLine(index, "discountType", e.target.value)}>
              <option value="PERCENT">Discount %</option>
              <option value="ABSOLUTE">Discount Amount</option>
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              value={line.discountValue === "" ? "" : Number(line.discountValue)}
              onChange={e => handleDiscountChange(index, e.target.value)}
              onBlur={e => handleDiscountBlur(index, e.target.value)}
              inputMode="decimal"
            />
            <strong>INR {Number(computedLines[index]?.rowTotal || 0).toFixed(2)}</strong>
          </div>
        );
      })}
      <button onClick={() => setLineItems([...lineItems, { ...emptyLine }])}>+ Add Line</button>

      <div className="summary">
        <p>Subtotal: INR {totals.subtotal.toFixed(2)}</p>
        <p>Total GST: INR {totals.totalGst.toFixed(2)}</p>
        <p>Total Discount: INR {totals.totalDiscount.toFixed(2)}</p>
        <p><strong>Grand Total: INR {totals.grandTotal.toFixed(2)}</strong></p>
      </div>

      <div className="actions">
        <button onClick={saveInvoice}>Save Invoice</button>
        {createdInvoice?._id && (
          <>
            <a href={`/invoices/${createdInvoice._id}`}>View</a>
            <a href={`/api/invoices/${createdInvoice._id}/pdf`} download>
              Download
            </a>
          </>
        )}
      </div>

      {createdInvoice?.invoiceNumber && <p>Saved as {createdInvoice.invoiceNumber}</p>}
    </main>
  );
}
