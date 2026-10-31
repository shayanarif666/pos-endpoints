/*
 * "How the backend calculates this" notes, shown (collapsed) above the request body.
 * Written for a person and for an AI assistant integrating the API: every step in the order the
 * backend runs it. Keep in step with backend/src/modules/commerce/pricing.service.js,
 * createOrder.service.js and orders/order.service.js (refundOrderItem).
 */

const ORDER_CALCULATION = {
  title: "How the backend calculates an order",
  intro: "The server prices the order itself; the app sends only products, qty and payments. Every amount is rounded to 2 decimals.",
  sections: [
    {
      heading: "What the backend checks",
      lines: [
        "Price — the product's selling_price (pack product: pack_price ÷ pack_size; custom line: the price sent)",
        "Discount — product discount, then category discount on what is left",
        "Offers — active, inside start_at–end_at, at this location, on the product or its category. If an offer saves more than the discount, the offer is used instead (never both)",
        "Taxes — product taxes + category tax + sales tax (only when the store's sales tax is on)",
        "Order discount / coupon — only when sent",
        "Payment GST — each payment method's rate (default cash 16%, card / wallets 5%)",
      ],
    },
    {
      heading: "Formula",
      lines: [
        "line subtotal = price × qty − line discount",
        "S = Σ line subtotals",
        "line tax = taxable × (product tax % + category tax % + sales tax %)   where taxable = line subtotal × (S − order discount) ÷ S",
        "bill = S − order discount − coupon + Σ line tax",
        "payment GST = bill × method rate   (split payment: each method on its own share of the bill)",
        "total_amount = bill + payment GST   ·   change_due = cash paid − total_amount",
      ],
    },
    {
      heading: "Example — 2 × Pepsi (100) + 1 × Lux Soap (100), paid 1000 cash",
      lines: [
        "Pepsi: offer 10% (saves 20) beats product 5% + category 5% (saves 19.50) → subtotal 200 − 20 = 180 · tax 180 × (18% + 5% + 18%) = 73.80",
        "Lux Soap: no discount → subtotal 100 · tax 100 × (18% + 10% + 18%) = 46",
        "bill = 180 + 100 + 73.80 + 46 = 399.80",
        "payment GST = 399.80 × 16% (cash) = 63.97",
        "total_amount = 399.80 + 63.97 = 463.77 · change_due = 1000 − 463.77 = 536.23",
      ],
    },
  ],
}

const REFUND_CALCULATION = {
  title: "How the backend calculates a partial (item) refund",
  intro: "Never priced from today's price: the customer gets back a share of what they paid for that line, the same way they paid. Every amount is rounded to 2 decimals.",
  sections: [
    {
      heading: "What the backend checks",
      lines: [
        "qty ≤ sold qty − qty already refunded on that line",
        "What each payment method paid on the sale (udhaar counts as a credit method)",
        "Each method's payment tax rate on the sale (e.g. cash 16%)",
        "What was already refunded on the order and to each method",
      ],
    },
    {
      heading: "Formula",
      lines: [
        "line value = line subtotal × (S − order discount − coupon) ÷ S + line tax",
        "refunded share = Σ value of everything refunded so far (this one included) ÷ Σ line values",
        "method refund = method paid × refunded share − already refunded to that method",
        "payment tax = method refund × rate ÷ (100 + rate)",
        "total = Σ method refunds · amount = line subtotal × qty ÷ sold qty · tax = total − amount",
      ],
    },
    {
      heading: "Example — 1 Pepsi of the order above (total 463.77 cash, bill 399.80)",
      lines: [
        "line value of Pepsi = 180 + 73.80 = 253.80 → 1 of 2 = 126.90",
        "refunded share = 126.90 ÷ 399.80",
        "cash refund = 463.77 × 126.90 ÷ 399.80 = 147.20",
        "amount = 180 × 1 ÷ 2 = 90 · tax = 147.20 − 90 = 57.20",
      ],
    },
  ],
}

export const CALC_NOTES = {
  "order-bulk": ORDER_CALCULATION,
  "order-refund-bulk": REFUND_CALCULATION,
}
