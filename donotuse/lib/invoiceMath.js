const round2 = (num) => Number((num || 0).toFixed(2));

export function calculateLineItem(item) {
  const quantity = Number(item.quantity || 0);
  const basePrice = Number(item.basePrice || 0);
  const gstPercent = Number(item.gstPercent || 0);
  const discountValue = Number(item.discountValue || 0);
  const discountType = item.discountType || "PERCENT";

  const rawSubtotal = quantity * basePrice;
  const discount =
    discountType === "PERCENT"
      ? (rawSubtotal * discountValue) / 100
      : discountValue;
  const cappedDiscount = Math.min(discount, rawSubtotal);
  const taxableAmount = Math.max(rawSubtotal - cappedDiscount, 0);
  const gstAmount = (taxableAmount * gstPercent) / 100;
  const rowTotal = taxableAmount + gstAmount;

  return {
    quantity,
    basePrice: round2(basePrice),
    gstPercent: round2(gstPercent),
    discountType,
    discountValue: round2(discountValue),
    subtotalBeforeDiscount: round2(rawSubtotal),
    discountAmount: round2(cappedDiscount),
    taxableAmount: round2(taxableAmount),
    gstAmount: round2(gstAmount),
    rowTotal: round2(rowTotal),
  };
}

export function calculateInvoiceTotals(lineItems) {
  const totals = lineItems.reduce(
    (acc, line) => {
      acc.subtotal += Number(line.subtotalBeforeDiscount || 0);
      acc.totalDiscount += Number(line.discountAmount || 0);
      acc.totalGst += Number(line.gstAmount || 0);
      acc.grandTotal += Number(line.rowTotal || 0);
      return acc;
    },
    { subtotal: 0, totalDiscount: 0, totalGst: 0, grandTotal: 0 }
  );

  return {
    subtotal: round2(totals.subtotal),
    totalDiscount: round2(totals.totalDiscount),
    totalGst: round2(totals.totalGst),
    grandTotal: round2(totals.grandTotal),
  };
}
