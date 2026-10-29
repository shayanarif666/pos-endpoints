/*
 * "How the backend calculates this" notes, shown (collapsed) above the request body.
 * Written for a person and for an AI assistant integrating the API: every step in the order the
 * backend runs it. Keep in step with backend/src/modules/commerce/pricing.service.js,
 * createOrder.service.js and orders/order.service.js (refundOrderItem).
 */

const ORDER_CALCULATION = {
  title: "How the backend calculates an order (read before building the POS cart)",
  intro:
    "The server prices every order itself from the catalog — the app sends only products, qty and payments. Money is rounded to 2 decimals at every step: round(x) = Number(x.toFixed(2)). Do the same steps in this order to show the same total the server saves.",
  sections: [
    {
      heading: "1. Unit price of each line",
      lines: [
        "Catalog line: unit price = the product's selling_price (a pack product's unit price = pack_price ÷ pack_size). Weight-based: qty = weight in kg.",
        "Custom line (is_custom): unit price = the price sent; discount_amount if sent.",
      ],
    },
    {
      heading: "2. Discount of each line — product, then category (both apply)",
      lines: [
        "productDisc = product discount on the price (only when the product has one)",
        "categoryDisc = category discount on (price − productDisc)",
        "percentage → round(base × value ÷ 100) · fixed → value · never more than the base",
        "unitDisc = productDisc + categoryDisc   →   discount = round(unitDisc × qty)",
        "e.g. 100 Rs, product 5% + category 5% → 5 + 4.75 = 9.75 off → 90.25",
      ],
    },
    {
      heading: "3. Offers — the biggest saving wins (offers never stack)",
      lines: [
        "Offers apply automatically — the order body does not name them. The server takes every offer of the store that is live right now:",
        "  ✔ active (is_active true / status \"active\") — an INACTIVE offer is skipped completely, as if it did not exist; switch it on again and it applies to the next order",
        "  ✔ inside its start_at – end_at dates (before the start or after the end = skipped)",
        "  ✔ at this location (location_scope all, or this location in location_ids)",
        "  ✔ on this product (apply_to product) or on this product's category (apply_to category)",
        "  ✔ the order / line is not offer_exempt",
        "flash_sale: unit = min(price, promo_price) · promotional: unit = price − discount · bulk_discount: same, only when qty ≥ min_qty (also the product's bulk tiers) · bogo: free = floor(qty ÷ (buy_qty + get_qty)) × get_qty.",
        "Each offer's saving = (price − unit) × qty (bogo: price × free). The line takes whichever is biggest: step 2's discount OR one offer — never both.",
        "offer_exempt: true on the order (or on one line) = no offer is considered there; the product / category discount still applies. tax_exempt: true = no tax of any kind (steps 6 and 10 are 0).",
        "GET orders shows what priced each line, as it was at the sale: category { id, name }, discount_source (none | product | category | product+category | bulk_tier | offer | custom), offers [{ id, name, type, discount_type, discount_value, amount }] and free_qty (BOGO).",
      ],
    },
    {
      heading: "4. Line subtotal (before tax)",
      lines: ["subtotal = round(price × qty − discount)", "S = Σ line subtotals"],
    },
    {
      heading: "5. Order discount (optional — order_discount_type + order_discount_value)",
      lines: [
        "orderDiscount = percentage → round(S × value ÷ 100) · fixed → value (max S). A cashier needs an approval_request_id.",
        "It lowers tax too: share = round((S − orderDiscount) ÷ S) (2 decimals, e.g. 0.95) and each line's taxable amount = round(subtotal × share).",
      ],
    },
    {
      heading: "6. Line taxes — all on the same taxable amount (no tax on tax)",
      lines: [
        "Product taxes: every tax in the product's list (GST, excise…) — percentage → round(taxable × value ÷ 100), fixed → round(value × qty)",
        "Category tax: the category's tax, same rule",
        "Sales tax: round(taxable × sales_tax_rate ÷ 100) — only when the store's sales_tax_enabled is on",
        "line tax = product taxes + category tax + sales tax · line total = subtotal + line tax",
        "No tax at all when the store's charge_tax_on_sales is off, or the order is tax_exempt.",
      ],
    },
    {
      heading: "7. Coupon (optional — coupon_code)",
      lines: [
        "coupon = percentage → round((S − orderDiscount) × value ÷ 100) · fixed → value (max S − orderDiscount)",
        "A coupon does NOT lower tax (tax stays as in step 6).",
      ],
    },
    {
      heading: "8. Shipping fee",
      lines: ["Web orders only (store's flat fee; free over its free_over_amount). POS orders: 0."],
    },
    {
      heading: "9. Bill before payment tax",
      lines: ["preGst = round((S − orderDiscount − coupon) + Σ line tax + shipping)"],
    },
    {
      heading: "10. Payment GST — each method on its own share (split payment)",
      lines: [
        "Rates from GET /tax-rates (defaults: cash 16%, card / jazzcash / easypaisa 5%). Only when charge_tax_on_sales and payment_tax_enabled are on.",
        "Card / wallet row with amount: bill_share = round(amount ÷ (1 + rate)), its tax = amount − bill_share",
        "Row with bill_share: tax = round(bill_share × rate)",
        "Rest row (first cash row without bill_share, or the only row): bill_share = preGst − the other shares, tax = round(bill_share × rate), amount = bill_share + tax",
        "paid = what was handed over. Only cash may be more than its amount → change = paid − amount. Cash handed over below its amount → the rest is udhaar (credit) and needs customer_id.",
      ],
    },
    {
      heading: "11. Totals saved on the order",
      lines: [
        "payment GST = Σ row taxes",
        "tax_amount = Σ line tax + payment GST",
        "total_amount = preGst + payment GST",
        "change_due = Σ paid − total_amount (0 if less) · fbr_tax_amount = tax_amount when the FBR invoice is on",
      ],
    },
    {
      heading: "Offer example",
      lines: [
        "\"Weekend 10% off\" (promotional, category Beverages, active): Pepsi 100 × 2 → offer saving 20 vs product 5% + category 5% = 19.50 → offer wins: discount 20, discount_source offer, offers [Weekend 10% off, 20].",
        "Same offer set to inactive (PATCH /offers/bulk/status { id, status: \"inactive\" }): it is skipped → discount 19.50, discount_source product+category, offers [].",
        "\"Buy 2 get 1 free\" (bogo) on Lux, qty 3: free = floor(3 ÷ 3) × 1 = 1 → saving 100 → free_qty 1.",
      ],
    },
    {
      heading: "Example — the first order of this body (default docs store: sales tax 18% on, offer \"Weekend 10% off\" on Beverages)",
      lines: [
        "1 Litre Pepsi × 2: discount 5% + 5% = 19.50 vs the offer 10% = 20 → offer wins → subtotal 180 · tax 180 × (18% GST + 5% category + 18% sales) = 73.80 · line 253.80",
        "Lux Soap × 1: no discount → 100 · tax 100 × (18% + 10% + 18%) = 46 · line 146",
        "preGst = 253.80 + 146 = 399.80 · cash GST 16% = 63.97 · total 463.77 · paid 1000 → change 536.23",
      ],
    },
  ],
}

const REFUND_CALCULATION = {
  title: "How the backend calculates a partial (item) refund",
  intro:
    "A refund is never priced again from today's price, discount or tax: it is a share of what the customer actually paid for that line, paid back the way the sale was paid (each method with the payment tax it was charged). Rounded to 2 decimals at every step. A complete refund (refunds/complete) runs the same steps for every line's remaining qty.",
  sections: [
    {
      heading: "1. Qty check",
      lines: ["qty ≤ the line's sold qty − qty already refunded on it (else 'Only X remaining to refund')"],
    },
    {
      heading: "2. Line value before payment tax",
      lines: [
        "kept = (S − orderDiscount − coupon) ÷ S   (1 when the order had neither; not rounded)",
        "lineValue = line subtotal × kept + line tax",
      ],
    },
    {
      heading: "3. Refunded fraction F — cumulative (earlier refunds + this one)",
      lines: [
        "F = Σ over all lines [ lineValue × refundedQtyAfterThis ÷ soldQty ]  ÷  Σ lineValue",
        "Cumulative on purpose: the paisa lost to rounding on one unit comes back on the next, so a fully refunded order returns exactly what each method paid.",
      ],
    },
    {
      heading: "4. Paid back per method",
      lines: [
        "Each payment method of the sale is a bucket = what it paid (its amount, payment tax included). The udhaar left on the sale is a 'credit' bucket (no payment tax).",
        "method refund = max(0, round(bucket × F) − already refunded to that method)   (shipping is left out: × (preGst − shipping) ÷ preGst)",
        "its payment tax = round(refund × p ÷ (100 + p))   ·   its bill_share = refund − payment tax   (p = that method's rate on the sale, e.g. card 5%, cash 16%)",
      ],
    },
    {
      heading: "5. Refund totals",
      lines: [
        "amount (before tax) = round(line subtotal × kept × qty ÷ soldQty)",
        "total = Σ method refunds · tax = total − amount (line taxes + payment tax)",
        "Cash part leaves the drawer · card / wallet part goes back to the card / wallet · credit part comes off the customer's udhaar · the qty goes back to stock · the order turns refunded when every line is fully refunded.",
      ],
    },
    {
      heading: "Example — this body on order 1 (total 463.77, cash; preGst 399.80)",
      lines: [
        "Pepsi, 1 of 2: lineValue 253.80 → F = 126.90 ÷ 399.80 → cash = round(463.77 × F) = 147.20 · amount 90 · tax 57.20",
        "Lux Soap, 1 of 1: F = (126.90 + 146) ÷ 399.80 → round(463.77 × F) = 316.57 − 147.20 already = 169.37 · amount 100 · tax 69.37",
      ],
    },
  ],
}

export const CALC_NOTES = {
  "order-bulk": ORDER_CALCULATION,
  "order-refund-bulk": REFUND_CALCULATION,
}
