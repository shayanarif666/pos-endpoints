/*
 * GET /api/v1/reporting/:section — ONE endpoint for every report. The :section picks the report,
 * the query string carries the filters. These are the twelve reports of the dashboard (and the
 * POS): Sales Summary and Profit & Margin are single values only; every other report is ONE list
 * (tables has one key) with its totals as single values (the KPIs). Every id is a number.
 * GET /api/v1/reporting carries every section's filters as `cards[].filters`.
 *
 * The docs page reads this file for: View Section Names, View Section Filters, View Enums and the
 * View Query Parameters list (which follows the section typed / picked in :section).
 *
 * live: true  = the API applies the filter.
 * live: false = agreed, not applied by the API yet (it is ignored, not an error).
 */

export const PAYMENT_METHODS = [
  "cash", "card", "jazzcash", "easypaisa", "cod", "bank_transfer", "raast", "sadapay", "nayapay", "upaisa", "digital_wallet", "cheque", "online", "other",
]

const f = (name, type, description, { values = null, def = "", live = true } = {}) => ({ name, type, values, default: def, description, live })

/** Sent with every section. */
export const REPORT_COMMON = [
  f("locations", "string", "One or several location numbers, comma separated (1 or 1,2), or all. A store admin may pick any; a manager always gets their own location (another one is refused, 403). location= with one number also works.", { def: "all" }),
  f("from", "date", "First day, YYYY-MM-DD. Left out = 7 days before `to`. (Inventory is the stock right now: it shows the stock in / out of these dates next to it.)", { def: "7 days ago" }),
  f("to", "date", "Last day, YYYY-MM-DD (the whole day). Left out = today.", { def: "today" }),
  f("channel", "enum", "Only sales / stock of one channel. Left out = every channel.", { values: ["pos", "web"] }),
  f("table", "string", "Which list page / limit / search are for (the section's list name). Every section has one list, so it can be left out."),
  f("page", "number", "Page of that list, from 1.", { def: "1" }),
  f("limit", "number", "Rows per page, 1–200, or all (for an export).", { def: "20" }),
  f("search", "string", "Text to find in the rows of the list."),
]

const STAFF = "A cashier / staff member: the staff number (the id in GET /staff) or UUID."
const KINDS = "weight = sold by weight; pack = a pack product; loose = the rest."

/**
 * id: the :section value. label: the name on screen. level: the store plan that unlocks it
 * (basic < standard < advanced; a lower plan gets 403 plan_locked). pos: true = one of the ten
 * the POS shows. ready: false = not in the API yet (see `today`). tables: the lists the reply
 * carries (the `table` parameter takes these names).
 */
export const REPORT_SECTIONS = [
  {
    id: "sales",
    label: "Sales Summary",
    level: "basic",
    pos: true,
    ready: true,
    about: "Single values only (no lists). Location sale: locations (one, several or all); product, category, device, payment method and custom sale: the filters below, which can be combined. Values: orders, units_sold, gross_sales, items_discounts, order_discounts, discounts, net_sales, tax (the goods' taxes), payments_tax (the payment surcharges, never counted as tax), shipping, total_sales, total_collected, on_credit, refunds, refunded_tax, refunded_orders, refunded_items, cancelled_orders (cancelled and voided), cost and gross_profit (advanced plan).",
    tables: [],
    filters: [
      f("product_id", "string", "Product wise sale: one or several product numbers, comma separated (1 or 1,5); a product counts with all its variants. Only those products' lines are added up — the rest of each bill is left out (the bill's surcharge, refunds and what was collected are shared by those lines' part). Left out = every product."),
      f("variant_id", "string", "With ONE product_id: only this variant (its number inside the product, e.g. 3)."),
      f("category_id", "string", "Category wise sale: one or several category numbers, comma separated (1 or 1,2). Only the lines of those categories are added up, as for product_id. Left out = every category."),
      f("devices", "string", "Device sale: one or several device numbers, comma separated (1 or 1,2) — the sales of the batches opened on those tills — or all. Left out = every device."),
      f("payment_method", "string", "Payment method sale: one or several methods, comma separated (cash or cash,jazzcash) — the orders paid (fully or in part) with any of them. Left out = every method. Methods: " + PAYMENT_METHODS.join(", ") + "."),
      f("custom", "boolean", "true = only custom sales (an order with a line that is not in the catalog); false = only the others.", { values: ["true", "false"] }),
      f("order_status", "enum", "Only orders in this state.", { values: ["completed", "partial_refunded"] }),
      f("discounted", "boolean", "true = only orders that had a discount; false = only those without.", { values: ["true", "false"] }),
    ],
  },
  {
    id: "profit",
    label: "Profit & Margin",
    level: "advanced",
    pos: true,
    ready: true,
    about: "Single values only (no lists): net_sales, cost, tax (the goods' taxes) and gross_profit (net sales − cost), after refunds.",
    tables: [],
    filters: [f("category_id", "string", "Only this category: its number or UUID.")],
  },
  {
    id: "payments",
    label: "Payments",
    level: "basic",
    pos: true,
    ready: true,
    about: "One list, payments: every payment method the store created (Payment Surcharges, even one nothing was paid with) and any other method used — id (surcharge number), method, surcharge_type, surcharge_value, is_active, transactions, bill_amount (the bill part paid with it), tax (the goods' tax inside that part), surcharge (the method's charge on top), amount (bill_amount + surcharge), refunds, surcharge_refunded, net_amount, percent. The totals are single values (KPIs).",
    tables: ["payments"],
    filters: [
      f("method", "enum", "Only this payment method (its row and totals).", { values: PAYMENT_METHODS }),
      f("payment_type", "enum", "single = bills paid with one method; split = bills paid with several methods.", { values: ["single", "split"] }),
    ],
  },
  {
    id: "batches",
    label: "Z-Reports",
    level: "basic",
    pos: true,
    ready: true,
    about: "One list, batches (Batches History): every batch of the locations picked — id (batch number), location, location_id, cashier, cashier_id, status, opened_at, closed_at, opening_amount, orders, gross_sales, discounts, net_sales, tax, surcharge, refunds, total_sales, takings per method, cash_in, cash_out, expected_cash, counted_cash, variance.",
    tables: ["batches"],
    filters: [
      f("status", "enum", "Open batches, closed batches, or every batch.", { values: ["open", "closed", "all"], def: "all" }),
      f("variance_only", "boolean", "true = only closed batches whose counted cash is short or over (variance is not 0).", { values: ["true", "false"] }),
      f("staff_id", "string", `Only this cashier's batches. ${STAFF}`),
    ],
  },
  {
    id: "sessions",
    label: "Sessions History",
    level: "standard",
    pos: true,
    ready: true,
    about: "One list, sessions (Sessions History): every staff session of the locations picked — id (session number), staff, staff_id, role, location, location_id, clock_in_at, clock_out_at, hours_worked, status. Totals as single values: sessions, on_duty_now, hours_worked.",
    tables: ["sessions"],
    filters: [
      f("staff_id", "string", `Only this person. ${STAFF}`),
      f("status", "enum", "on_duty = clocked in now; clocked_out = finished.", { values: ["on_duty", "clocked_out"] }),
    ],
  },
  {
    id: "top_products",
    label: "By Products",
    level: "basic",
    pos: true,
    ready: true,
    about: "One list, products: every product sold (a variant is its own row) with all its figures — id (product number), variant_id (variant number), product, variant, sku, category, unit, units_sold, gross_sales, discounts, net_sales, tax, total_sales, orders, cost, gross_profit, percent — best seller first.",
    tables: ["products"],
    filters: [
      f("type", "enum", `Only this kind of product. ${KINDS}`, { values: ["pack", "loose", "weight"] }),
      f("zero_sales", "boolean", "true = the active products that did not sell at all in these dates (every figure 0) instead of the ones that did.", { values: ["true", "false"] }),
    ],
  },
  {
    id: "top_categories",
    label: "By Categories",
    level: "basic",
    pos: true,
    ready: true,
    about: "One list, categories: every category sold with all its figures — id (category number), category, products, orders, units_sold, gross_sales, discounts, net_sales, tax, total_sales, cost, gross_profit, percent — best seller first.",
    tables: ["categories"],
    filters: [
      f("category_id", "string", "Only this category: its number or UUID."),
      f("sort", "enum", "Order of the rows, highest first.", { values: ["revenue", "profit"], def: "revenue" }),
      f("net_of_refunds", "boolean", "true = refunds are taken off the figures; false = the sales as first made.", { values: ["true", "false"], def: "true" }),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    level: "standard",
    pos: true,
    ready: true,
    about: "One list, inventory: the stock on hand per product and location — id (product number), variant_id, product, variant, sku, category, location, location_id, unit, type, stock_in / stock_out (in the dates), current_stock, stock_status, expiry_date, expiry_status.",
    tables: ["inventory"],
    filters: [
      f("stock_status", "enum", "Only stock in this state: out = nothing left; low = at or under its low-stock alert; ok = above it.", { values: ["low", "out", "ok"] }),
      f("expiry_status", "enum", "Only stock whose soonest expiry is in this state (the days come from the store's expiry settings).", { values: ["expired", "critical", "warning"] }),
      f("type", "enum", `Only this kind of product. ${KINDS}`, { values: ["pack", "loose", "weight"] }),
      f("supplier_id", "string", "Only products that came in from this supplier (their stock movements): its number or UUID."),
    ],
  },
  {
    id: "refunds_cancelled",
    label: "Refunds / Cancelled",
    level: "basic",
    pos: true,
    ready: true,
    about: "One list, orders: every refund (partial and complete), cancelled order and voided order, newest first — id, type, date, order_number, channel, amount, reason, cashier, refund_methods. Totals as single values (KPIs): refunds, complete_refunds, partial_refunds, voided_orders, cancelled_orders, refunded_amount, cancelled_amount.",
    tables: ["orders"],
    filters: [
      f("type", "enum", "Only this kind of row.", { values: ["partial_refund", "complete_refund", "cancelled", "voided"] }),
      f("reason", "string", "Only rows whose reason contains this text (any case)."),
      f("staff_id", "string", `Only the orders of this cashier. ${STAFF}`),
      f("refund_method", "enum", "Only refunds paid back this way (credit = taken off the customer's udhaar).", { values: [...PAYMENT_METHODS, "credit"] }),
    ],
  },
  {
    id: "cashiers",
    label: "By Cashiers",
    level: "standard",
    pos: true,
    ready: true,
    about: "One list, cashiers: every cashier, highest total_sales first — id (staff number), cashier, role, orders, units_sold, gross_sales, discounts, net_sales, tax, total_sales, refunds.",
    tables: ["cashiers"],
    filters: [
      f("staff_id", "string", `Only this cashier. ${STAFF}`),
      f("batch_id", "string", "Only the sales of this batch: its batch number or UUID."),
      f("sort", "enum", "Order of the rows, highest first.", { values: ["sales", "refunds", "discount"], def: "sales" }),
    ],
  },
  {
    id: "offers",
    label: "Discount Performance",
    level: "advanced",
    pos: true,
    ready: true,
    about: "One list, discounts: every discount given — line discounts (category, product, variant, store, bulk, bundle, manual) and the order discount — id (its number, null for a manual one), discount, level, type, value, orders, units, sales, discount_given. Totals as single values (KPIs): discounts, orders_discounted, discount_given, sales.",
    tables: ["discounts"],
    filters: [
      f("staff_id", "string", `Only this cashier's sales. ${STAFF}`),
      f("level", "enum", "Only discounts of this level.", { values: ["category", "product", "variant", "store", "bulk", "bundle", "manual", "order"] }),
    ],
  },
  {
    id: "tax",
    label: "Tax Breakdown",
    level: "advanced",
    pos: true,
    ready: true,
    about: "One list, taxes: every tax collected after refunds — id (the tax number of a Taxes page tax, else null), tax, level, type, rate, taxable_amount, tax_collected. Totals as single values (KPIs): orders, net_sales, tax_collected, store_tax, product_tax, variant_tax, category_tax, sales_with_tax. Payment surcharges are no tax: they are in Payments.",
    tables: ["taxes"],
    filters: [
      f("tax_name", "string", "Only this tax: its name (GST, Import Duty…), any case."),
      f("level", "enum", "Where the tax is set.", { values: ["store", "product", "variant", "category"] }),
      f("tax_type", "enum", "How the tax is worked out.", { values: ["percentage", "fixed"] }),
    ],
  },
]

export const REPORT_SECTION = Object.fromEntries(REPORT_SECTIONS.map((section) => [section.id, section]))

const DEFAULT_FROM = "2026-11-01"
const DEFAULT_TO = "2026-11-07"

/** The default value of a query parameter row (what the box starts with). */
function startValue(filter) {
  if (filter.name === "from") return DEFAULT_FROM
  if (filter.name === "to") return DEFAULT_TO
  if (filter.name === "locations") return "all"
  if (filter.name === "page") return "1"
  if (filter.name === "limit") return "20"
  // A filter starts empty (not sent); its default is explained in View Section Filters.
  return ""
}

/** The query parameter rows of one section: the common ones, then its own filters. */
export function queryRowsFor(sectionId) {
  const section = REPORT_SECTION[sectionId]
  return [...REPORT_COMMON, ...(section ? section.filters : [])].map((filter) => ({
    name: filter.name,
    default: startValue(filter),
    required: false,
    // A choice: the Query Parameters dialog shows a drop-down instead of a text box.
    values: filter.values || null,
    type: filter.type,
    description: filter.description,
  }))
}

/** The enums of one section (its filters that take a fixed list of values). */
export function enumsFor(sectionId) {
  const section = REPORT_SECTION[sectionId]
  if (!section) return {}
  return Object.fromEntries([...REPORT_COMMON, ...section.filters].filter((filter) => filter.values).map((filter) => [filter.name, filter.values]))
}
