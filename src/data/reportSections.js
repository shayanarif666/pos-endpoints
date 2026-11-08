/*
 * GET /api/v1/reporting/:section — ONE endpoint for every report. The :section picks the report,
 * the query string carries the filters. The POS shows the ten sections marked "POS" below; the
 * dashboard shows all of them (the same endpoint, so the same filters). GET /api/v1/reporting
 * (the dashboard's card list) carries every section's filters as `cards[].filters`, so the
 * dashboard builds its filter bar from the API.
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
  f("location", "string", "A location number (1, 2…) or UUID, or all. A store admin may pick any; a manager always gets their own location (another one is refused, 403).", { def: "all" }),
  f("from", "date", "First day, YYYY-MM-DD. Left out = 7 days before `to`. (Inventory is the stock right now: it shows the stock in / out of these dates next to it.)", { def: "7 days ago" }),
  f("to", "date", "Last day, YYYY-MM-DD (the whole day). Left out = today.", { def: "today" }),
  f("channel", "enum", "Only sales / stock of one channel. Left out = every channel.", { values: ["pos", "web"] }),
  f("table", "string", "Which list page / limit / search are for, when the section has more than one list (see the section's lists). Left out = page 1 of every list."),
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
  // ---- the POS sections
  {
    id: "sales",
    label: "Sales",
    level: "basic",
    pos: true,
    ready: true,
    about: "Orders, gross and net sales, discounts, taxes, refunds and the sales trend of the dates.",
    tables: ["trend", "payments"],
    filters: [
      f("payment_method", "enum", "Only orders paid (fully or in part) with this method.", { values: PAYMENT_METHODS }),
      f("order_status", "enum", "Only orders in this state.", { values: ["completed", "partial_refunded"] }),
      f("discounted", "boolean", "true = only orders that had a discount (line, order or coupon); false = only those without.", { values: ["true", "false"] }),
      f("custom", "boolean", "true = only custom sales (an order with a line that is not in the catalog).", { values: ["true", "false"] }),
    ],
  },
  {
    id: "top_products",
    label: "By Products",
    level: "basic",
    pos: true,
    ready: true,
    about: "Units, gross, discounts, net, taxes and total per product (a variant is its own row), best seller first.",
    tables: ["rows"],
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
    about: "The same figures per category, best seller first.",
    tables: ["rows"],
    filters: [
      f("category_id", "string", "Only this category: its number or UUID."),
      f("sort", "enum", "Order of the rows, highest first. profit adds cost and gross_profit columns on the advanced plan.", { values: ["revenue", "profit"], def: "revenue" }),
      f("net_of_refunds", "boolean", "true = refunds are taken off the figures; false = the sales as first made (a fully refunded sale counts again).", { values: ["true", "false"], def: "true" }),
    ],
  },
  {
    id: "payments",
    label: "Payments",
    level: "basic",
    pos: true,
    ready: true,
    about: "Takings per payment method: transactions, gross, payment surcharge, refunds paid back and net.",
    tables: ["rows"],
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
    about: "Each batch (cash drawer): takings per method, expected vs counted cash and the variance — plus each cashier's overall sales (by_cashier).",
    tables: ["rows", "by_cashier"],
    filters: [
      f("status", "enum", "Open batches, closed batches, or every batch.", { values: ["open", "closed", "all"], def: "all" }),
      f("variance_only", "boolean", "true = only closed batches whose counted cash is short or over (variance is not 0).", { values: ["true", "false"] }),
      f("staff_id", "string", `Only this cashier's batches. ${STAFF}`),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    level: "standard",
    pos: true,
    ready: true,
    about: "The stock on hand per product and location, with what came in and went out in the dates, its stock state and its soonest expiry.",
    tables: ["rows"],
    filters: [
      f("stock_status", "enum", "Only stock in this state: out = nothing left; low = at or under its low-stock alert; ok = above it.", { values: ["low", "out", "ok"] }),
      f("expiry_status", "enum", "Only stock whose soonest expiry is in this state (the days come from the store's expiry settings).", { values: ["expired", "critical", "warning"] }),
      f("type", "enum", `Only this kind of product. ${KINDS}`, { values: ["pack", "loose", "weight"] }),
      f("supplier_id", "string", "Only products that came in from this supplier (their stock movements): its number or UUID."),
    ],
  },
  {
    id: "movements",
    label: "Stock Movements",
    level: "standard",
    pos: true,
    ready: true,
    about: "Every stock in / out with its date, location, type, reason and who did it (the latest 300).",
    tables: ["rows"],
    filters: [
      f("movement_type", "enum", "Only this kind of movement.", { values: ["stock_in", "stock_out", "adjustment", "sale", "refund", "transfer_in", "transfer_out", "custom_sale"] }),
      f("reason", "enum", "Only this reason.", { values: ["purchase", "opening_balance", "return_to_supplier", "customer_return", "waste", "damage", "expiry", "theft", "count", "sale", "refund", "sync", "transfer", "custom_sale", "other"] }),
      f("product_id", "string", "Only this product: its number or UUID. A product with variants gives all of them."),
      f("variant_id", "string", "With product_id: only this variant (its number inside the product, or UUID)."),
      f("supplier_id", "string", "Only movements of this supplier: its number or UUID."),
      f("staff_id", "string", `Only what this person did. ${STAFF}`),
    ],
  },
  {
    id: "refunds_cancelled",
    label: "Refunds / Cancelled",
    level: "basic",
    pos: true,
    ready: true,
    about: "Partial and complete refunds, cancelled orders and voided orders in one list, newest first, with the amount, reason, cashier and how a refund was paid back.",
    tables: ["rows"],
    filters: [
      f("type", "enum", "Only this kind of row.", { values: ["partial_refund", "complete_refund", "cancelled", "voided"] }),
      f("reason", "string", "Only rows whose reason contains this text (any case)."),
      f("staff_id", "string", `Only the orders of this cashier. ${STAFF}`),
      f("refund_method", "enum", "Only refunds paid back this way (credit = taken off the customer's udhaar).", { values: [...PAYMENT_METHODS, "credit"] }),
    ],
  },
  {
    id: "cashiers",
    label: "By Cashier",
    level: "standard",
    pos: true,
    ready: true,
    about: "Orders, total sales, discounts, tax, refunds and net sales per cashier.",
    tables: ["rows"],
    filters: [
      f("staff_id", "string", `Only this cashier. ${STAFF}`),
      f("batch_id", "string", "Only the sales of this batch: its batch number or UUID."),
      f("sort", "enum", "Order of the rows, highest first.", { values: ["sales", "refunds", "discount"], def: "sales" }),
    ],
  },
  {
    id: "tax",
    label: "Tax Report",
    level: "advanced",
    pos: true,
    ready: true,
    today: "rows is the older summary (sales / product / category tax and the payment-method tax); rules is the tax per tax rule and is what the filters narrow; the payment surcharge is no tax and is listed on its own in surcharges.",
    about: "The tax collected per tax rule (rules), after refunds, and the payment surcharge on its own (surcharges).",
    tables: ["rows", "rules", "surcharges"],
    filters: [
      f("tax_name", "string", "Only this tax: its name (GST, Import Duty…), any case."),
      f("level", "enum", "Where the tax is set.", { values: ["product", "store", "category"] }),
      f("tax_type", "enum", "How the tax is worked out.", { values: ["percentage", "fixed"] }),
    ],
  },

  // ---- dashboard-only sections
  {
    id: "locations",
    label: "By Location",
    level: "standard",
    pos: false,
    ready: true,
    about: "How much each location sold, its taxes, refunds and share (needs location=all).",
    tables: ["rows"],
    filters: [f("sort", "enum", "Order of the rows, highest first.", { values: ["sales", "orders", "refunds"], def: "sales" })],
  },
  {
    id: "transfers",
    label: "Stock Transfers",
    level: "standard",
    pos: false,
    ready: true,
    about: "Stock sent between locations: what left, what arrived and what is on the way.",
    tables: ["rows"],
    filters: [
      f("status", "enum", "Only lines in this state (a pending line counts as on the way).", { values: ["on_the_way", "completed", "cancelled"] }),
      f("product_id", "string", "Only this product: its number or UUID."),
    ],
  },
  {
    id: "discounts",
    label: "Discounts",
    level: "standard",
    pos: false,
    ready: true,
    about: "Every discount entered and each discounted sale with its calculation.",
    tables: ["by_source", "catalog", "sales", "lines"],
    filters: [f("staff_id", "string", `Only this cashier's sales. ${STAFF}`)],
  },
  {
    id: "sessions",
    label: "Sessions History",
    level: "standard",
    pos: false,
    ready: true,
    about: "Staff clock in / clock out and hours worked.",
    tables: ["by_staff", "sessions"],
    filters: [
      f("staff_id", "string", `Only this person. ${STAFF}`),
      f("status", "enum", "on_duty = clocked in now; clocked_out = finished.", { values: ["on_duty", "clocked_out"] }),
    ],
  },
  {
    id: "profit",
    label: "Profit & Margin",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Cost, gross profit and margin % by product, category and location.",
    tables: ["by_product", "by_category", "by_location"],
    filters: [
      f("category_id", "string", "Only this category: its number or UUID."),
      f("sort", "enum", "Order of the rows, highest first.", { values: ["profit", "margin", "sales"], def: "profit" }),
    ],
  },
  {
    id: "comparison",
    label: "Period Comparison",
    level: "advanced",
    pos: false,
    ready: true,
    about: "These dates against the same number of days just before, with the change.",
    tables: ["rows"],
    filters: [],
  },
  {
    id: "offers",
    label: "Offer Performance",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Sales, units, free units and discount given per offer.",
    tables: ["rows"],
    filters: [f("staff_id", "string", `Only this cashier's sales. ${STAFF}`)],
  },
  {
    id: "dead_stock",
    label: "Dead Stock",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Products in stock that did not sell in these dates, with when they last sold.",
    tables: ["rows"],
    filters: [
      f("category_id", "string", "Only this category: its number or UUID."),
      f("min_days", "number", "Only products not sold for at least this many days (a product never sold always counts)."),
    ],
  },
  {
    id: "forecast",
    label: "Stock Forecast",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Days until each product runs out, from its average daily sales.",
    tables: ["rows"],
    filters: [
      f("status", "enum", "Only products in this state: out, critical (7 days or less), low (14 days or less), ok, no_sales.", { values: ["out", "critical", "low", "ok", "no_sales"] }),
      f("category_id", "string", "Only this category: its number or UUID."),
    ],
  },
  {
    id: "peak_hours",
    label: "Peak Hours",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Orders and sales by hour and weekday, for staffing.",
    tables: ["by_hour", "by_weekday"],
    filters: [
      f("staff_id", "string", `Only this cashier's sales. ${STAFF}`),
      f("payment_method", "enum", "Only orders paid with this method.", { values: PAYMENT_METHODS }),
    ],
  },
  {
    id: "customers",
    label: "Customers",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Top customers, repeat buyers and udhaar still owed.",
    tables: ["top_customers", "udhaar"],
    filters: [
      f("has_udhaar", "boolean", "true = only customers who owe udhaar; false = only those who do not (and no udhaar list).", { values: ["true", "false"] }),
      f("sort", "enum", "Order of the customers, highest first.", { values: ["spent", "udhaar", "orders"], def: "spent" }),
    ],
  },
  {
    id: "suppliers",
    label: "Suppliers",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Purchases and returns per supplier and the ledger balance.",
    tables: ["rows"],
    filters: [f("supplier_id", "string", "Only this supplier: its number or UUID.")],
  },
  {
    id: "variance",
    label: "Variance & Losses",
    level: "advanced",
    pos: false,
    ready: true,
    about: "Batches with a cash shortage or excess, and damage / theft / expiry / waste.",
    tables: ["batches", "losses"],
    filters: [
      f("staff_id", "string", `Only this person's batches and losses. ${STAFF}`),
      f("reason", "enum", "Only this kind of loss.", { values: ["damage", "theft", "expiry", "waste"] }),
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
  if (filter.name === "location") return "all"
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
