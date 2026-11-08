/*
 * GET /api/v1/reporting/:section — ONE endpoint for every report. The :section picks the report,
 * the query string carries the filters. The POS shows the ten sections below; the dashboard has
 * more (profit, comparison, offers, dead stock, forecast, peak hours, customers, suppliers…).
 *
 * The docs page reads this file for: View Section Names, View Section Filters, View Enums and the
 * View Query Parameters list (which follows the section typed / picked in :section).
 *
 * live: true  = the API applies the filter today.
 * live: false = agreed with the shop owner, not applied by the API yet (it is ignored, not an
 *               error). Flip it to true when the backend ships it.
 */

export const PAYMENT_METHODS = [
  "cash", "card", "jazzcash", "easypaisa", "cod", "bank_transfer", "raast", "sadapay", "nayapay", "upaisa", "digital_wallet", "cheque", "online", "other",
]

const f = (name, type, description, { values = null, def = "", live = false } = {}) => ({ name, type, values, default: def, description, live })

/** Sent with every section. */
export const REPORT_COMMON = [
  f("location", "string", "A location number (1, 2…) or UUID, or all. A store admin may pick any; a manager always gets their own location (another one is refused, 403).", { def: "all", live: true }),
  f("from", "date", "First day, YYYY-MM-DD. Left out = 7 days before `to`. (Inventory is the stock right now: it shows the stock in / out of these dates next to it.)", { def: "7 days ago", live: true }),
  f("to", "date", "Last day, YYYY-MM-DD (the whole day). Left out = today.", { def: "today", live: true }),
  f("table", "string", "Which list page / limit / search are for, when the section has more than one list (see the section's lists). Left out = page 1 of every list.", { live: true }),
  f("page", "number", "Page of that list, from 1.", { def: "1", live: true }),
  f("limit", "number", "Rows per page, 1–200, or all (for an export).", { def: "20", live: true }),
  f("search", "string", "Text to find in the rows of the list.", { live: true }),
]

const STAFF = "A cashier / staff member: the staff number (the id in GET /staff) or UUID."

/**
 * id: the :section value. label: the name on screen. level: the store plan that unlocks it
 * (basic < standard < advanced; a lower plan gets 403 plan_locked). ready: false = the section id
 * is agreed but not in the API yet (see `today`). tables: the lists the reply carries (the
 * `table` parameter takes these names).
 */
export const REPORT_SECTIONS = [
  {
    id: "sales",
    label: "Sales",
    level: "basic",
    ready: true,
    about: "Orders, gross and net sales, discounts, taxes, refunds and the sales trend of the dates.",
    tables: ["trend", "payments"],
    filters: [
      f("payment_method", "enum", "Only orders paid (fully or in part) with this method.", { values: PAYMENT_METHODS }),
      f("order_status", "enum", "Only orders in this state.", { values: ["completed", "partial_refunded"] }),
      f("discounted", "boolean", "true = only orders that had a discount (line, order or coupon).", { values: ["true", "false"] }),
      f("custom", "boolean", "true = only custom sales (lines that are not in the catalog).", { values: ["true", "false"] }),
    ],
  },
  {
    id: "top_products",
    label: "By Products",
    level: "basic",
    ready: true,
    about: "Units, gross, discounts, net, taxes and total per product (a variant is its own row), best seller first.",
    tables: ["rows"],
    filters: [
      f("type", "enum", "Only this kind of product: sold in packs, sold loose, or sold by weight.", { values: ["pack", "loose", "weight"] }),
      f("zero_sales", "boolean", "true = the products that did not sell at all in these dates (units_sold 0) instead of the ones that did.", { values: ["true", "false"] }),
    ],
  },
  {
    id: "top_categories",
    label: "By Categories",
    level: "basic",
    ready: true,
    about: "The same figures per category, best seller first.",
    tables: ["rows"],
    filters: [
      f("category_id", "string", "Only this category: its number or UUID."),
      f("sort", "enum", "Order of the rows.", { values: ["revenue", "profit"], def: "revenue" }),
      f("net_of_refunds", "boolean", "true = refunds are taken off the figures; false = the sales as first made.", { values: ["true", "false"], def: "true" }),
    ],
  },
  {
    id: "payments",
    label: "Payments",
    level: "basic",
    ready: true,
    about: "Takings per payment method: transactions, gross, payment surcharge, refunds paid back and net.",
    tables: ["rows"],
    filters: [
      f("method", "enum", "Only this payment method.", { values: PAYMENT_METHODS }),
      f("payment_type", "enum", "single = the bill paid with one method; split = paid with several methods.", { values: ["single", "split"] }),
    ],
  },
  {
    id: "batches",
    label: "Z-Reports",
    level: "basic",
    ready: true,
    today: "The by_cashier list (each cashier's overall sales) is to be built; the batch rows are live.",
    about: "Each batch (cash drawer): takings per method, expected vs counted cash and the variance — plus each cashier's overall sales (by_cashier).",
    tables: ["rows", "by_cashier"],
    filters: [
      f("status", "enum", "Open batches, closed batches, or every batch.", { values: ["open", "closed", "all"], def: "all" }),
      f("variance_only", "boolean", "true = only batches whose counted cash is short or over (variance is not 0).", { values: ["true", "false"] }),
      f("staff_id", "string", `Only this cashier's batches. ${STAFF}`),
    ],
  },
  {
    id: "inventory",
    label: "Inventory",
    level: "standard",
    ready: true,
    about: "The stock on hand per product and location, with what came in and went out in the dates.",
    tables: ["rows"],
    filters: [
      f("stock_status", "enum", "Only stock in this state (low = at or under its low-stock alert).", { values: ["low", "out", "ok"] }),
      f("expiry_status", "enum", "Only stock with a lot in this expiry state.", { values: ["expired", "critical", "warning"] }),
      f("type", "enum", "Only this kind of product.", { values: ["pack", "loose", "weight"] }),
      f("supplier_id", "string", "Only products bought from this supplier: its number or UUID."),
    ],
  },
  {
    id: "movements",
    label: "Stock Movements",
    level: "standard",
    ready: true,
    about: "Every stock in / out with its date, location, type, reason and who did it.",
    tables: ["rows"],
    filters: [
      f("movement_type", "enum", "Only this kind of movement.", { values: ["stock_in", "stock_out", "adjustment", "sale", "refund", "transfer_in", "transfer_out", "custom_sale"] }),
      f("reason", "enum", "Only this reason.", { values: ["purchase", "opening_balance", "return_to_supplier", "customer_return", "waste", "damage", "expiry", "theft", "count", "other"] }),
      f("product_id", "string", "Only this product: its number or UUID (add variant_id for one variant)."),
      f("supplier_id", "string", "Only movements of this supplier: its number or UUID."),
      f("staff_id", "string", `Only what this person did. ${STAFF}`),
    ],
  },
  {
    id: "refunds_cancelled",
    label: "Refunds / Cancelled",
    level: "basic",
    ready: false,
    today: "Today the API has two sections, refunds and cancelled; refunds_cancelled puts them in one list.",
    about: "Refunds (partial and complete), cancelled orders and voided orders in one list, with the amount, reason and cashier.",
    tables: ["rows"],
    filters: [
      f("type", "enum", "Only this kind of row.", { values: ["partial_refund", "complete_refund", "cancelled", "voided"] }),
      f("reason", "string", "Only rows whose reason contains this text."),
      f("staff_id", "string", `Only this cashier's orders. ${STAFF}`),
      f("refund_method", "enum", "Only refunds paid back this way (credit = taken off the customer's udhaar).", { values: [...PAYMENT_METHODS, "credit"] }),
    ],
  },
  {
    id: "cashiers",
    label: "By Cashier",
    level: "standard",
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
    ready: true,
    today: "Today the payment surcharge is inside the rows as 'Payment Method Tax'; the separate surcharges list (and the level / tax_type fields on the rows) is to be built.",
    about: "The tax collected per tax rule. The payment surcharge is not a tax: it is listed on its own (surcharges).",
    tables: ["rows", "surcharges"],
    filters: [
      f("tax_name", "string", "Only this tax: its name (GST, Import Duty…)."),
      f("level", "enum", "Where the tax is set.", { values: ["product", "store", "category"] }),
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
  return Object.fromEntries(section.filters.filter((filter) => filter.values).map((filter) => [filter.name, filter.values]))
}
