/*
 * Request-body attribute rules, per endpoint id, taken from the backend validators.
 *   "required"            -> must be sent
 *   "optional"            -> may be left out (shown as "(optional)")
 *   ["optional", "note"]  -> optional, with a short rule shown next to it
 *   ["required", "note"]  -> required, with a short rule shown next to it
 * Nested keys use dotted paths; array rows use "[]" (e.g. "items[].product_id").
 * Every key present in an endpoint's example body must be listed here (see missingBodyFields).
 */

const R = "required"
const O = "optional"
const note = (text) => [O, text]
const must = (text) => [R, text]

const VISIBILITY = {
  is_pos_visible: O,
  is_web_visible: O,
  channel: note("web | pos | both. Default both"),
}

function prefixed(prefix, spec) {
  return Object.fromEntries(Object.entries(spec).map(([key, rule]) => [`${prefix}${key}`, rule]))
}

/** Bulk endpoints: `items` is required and every row follows the single-create rules. */
function bulkOf(spec) {
  return { items: R, ...prefixed("items[].", spec) }
}

// Store admin only: their token has no location, so they name it (a manager's or cashier's
// location comes from their token). On a bulk request it is sent once, next to items[].
const ADMIN_LOCATION = {
  location_id: note("Store admin only: the location number (e.g. 1) or UUID this applies to. Manager / cashier: leave it out — the token's location is used"),
}

/** Bulk body with the store admin's location_id at the top level instead of in every row. */
function bulkAtLocation(spec) {
  return { ...ADMIN_LOCATION, ...bulkOf(spec) }
}

// The store's tax settings: PUT /tax-rates, and the same fields at store registration.
const TAX_SETTINGS = {
  ntn: O,
  strn: O,
  charge_tax_on_sales: note("Master switch for all tax on sales. Default true at registration"),
  fbr_invoice_enabled: note("Default false"),
  sales_tax_enabled: note("Sales tax on / off. Default on — switch off when each product carries its own sales tax"),
  sales_tax_rate: note("Store-wide sales tax %, 0–100, on every taxable line. Default 18"),
  payment_tax_enabled: note("Payment-method GST on / off. Default on — when off, rates are kept but not charged"),
  rates: note("Payment-method GST rows to change. Defaults: cash 16, card 5, jazzcash 5, easypaisa 5"),
  "rates[].payment_method": must("cash | card | jazzcash | easypaisa | cod"),
  "rates[].gst_percent": must("0–100"),
}

const PLAN_CREATE = {
  code: R,
  type: must("monthly | yearly"),
  name: R,
  price_pkr: R,
  max_devices: R,
  max_locations: R,
  max_users: note("Max staff accounts. Leave out / null = no limit"),
  reporting_level: note("basic | standard | advanced | custom. Default basic"),
  import_export: note("Import & export data. Default false"),
  staff_attendance: note("Staff attendance (clock in / clock out). Default false"),
  email_integration: note("Default false"),
  whatsapp_integration: note("Default false"),
  receipt_customization: note("Default false"),
  barcode_scanning: note("Default false"),
  batch_management: note("Batch opening / closing. Default false"),
  remote_access: note("AnyDesk-type remote connection. Default false"),
  features: note("Free-text selling points for the plan card"),
  is_active: note("Default true"),
}

const STAFF_ID = note("The staff member doing it — the cashier picked by PIN (their user number, e.g. 3). Leave out = the signed-in admin / manager")


const CATEGORY_CREATE = {
  name: must("A name that already exists is accepted — the slug gets a -2, -3... suffix"),
  tax_name: note("Label for the tax, e.g. GST"),
  tax_type: note("percentage | fixed. Category tax applies when type + value are sent"),
  tax_value: O,
  discount_name: note("Label for the discount, e.g. Eid Shopping"),
  discount_type: note("percentage | fixed. Category discount applies when type + value are sent"),
  discount_value: O,
  description: O,
  parent_category_id: O,
  is_active: note("Default true"),
  ...VISIBILITY,
}

const PRODUCT_CREATE = {
  title: R,
  barcode: must("Unique per store — a barcode already in use returns 409"),
  category_id: must("The category's number (e.g. 1) or its UUID"),
  unit: note("Default piece"),
  cost: must("Loose Item: cost of one unit. Stored as cost_price"),
  price: must("Loose Item: selling price of one unit. Stored as selling_price. Its total_price = price after discount, then tax"),
  is_pack_product: note("true for a Pack Product. Default false (Loose Item)"),
  pack_size: must("Pack Product only: units per pack, >= 2"),
  pack_cost: must("Pack Product only: whole-pack cost. Stored as pack_cost_price; cost per unit = pack_cost ÷ pack_size (calculated)"),
  pack_price: must("Pack Product only: whole-pack selling price. Stored as pack_selling_price; price per unit = pack_price ÷ pack_size (calculated)"),
  taxes: note("Product-level taxes — as many as apply (e.g. GST + excise / import duty). Empty or left out = no product tax. Category tax and the store's sales tax are added at checkout"),
  "taxes[].name": note("Label shown on the receipt, e.g. GST"),
  "taxes[].type": must("percentage | fixed (fixed = per unit)"),
  "taxes[].value": must("The % or the amount per unit"),
  discount_name: note("Label for the discount, e.g. Eid Shopping"),
  discount_type: note("percentage | fixed. Product discount applies when type + value are sent"),
  discount_value: O,
  sell_loose: note("True if units can also be sold individually"),
  low_stock_threshold: note("Default 10"),
  image: note("Image URL, saved as featured_image and images[0]. Empty string = no image"),
  is_weight_based: note("Sold by weight (kg). Can be combined with is_pack_product"),
  is_published: note("Default false"),
  is_active: note("Default true"),
  ...VISIBILITY,
}

const MOVEMENT_CREATE = {
  staffId: must("The staff member who did this movement: their user number (e.g. 1) or UUID — the cashier picked by PIN, or the admin / manager. Sent on every item (staff_id also works)"),
  product_id: must("The product's number (e.g. 1) or its UUID"),
  movement_type: must("stock_in | stock_out | adjustment"),
  reason: must("Any reason except refund, transfer, custom_sale"),
  qty: must("Non-zero change. stock_in positive, stock_out negative"),
  expiry_date: note("YYYY-MM-DD. Leave out to keep the location's current expiry date"),
  supplier_id: note("Purchases: the supplier number (e.g. 1)"),
  ...VISIBILITY,
}

const CUSTOMER_CREATE = {
  name: R,
  phone: O,
  email: O,
  location_id: O,
  remaining_debt: O,
  total_debt: O,
  debt_notes: O,
  ...VISIBILITY,
}

const STAFF_CREATE = {
  name: R,
  email: R,
  password: must("Min 6 characters"),
  pin: must("4–6 digits. Must differ from every other user's PIN at this location (and from the store admin's); another location or store may reuse it"),
  role: must("manager | cashier"),
  location_id: note("Store admin only: the location number (e.g. 2) the manager / cashier works at. A manager's new staff get the manager's location"),
  phone: O,
}

const OFFER_CREATE = {
  staff_id: STAFF_ID,
  name: R,
  type: must("promotional | flash_sale | bulk_discount | bogo"),
  apply_to: must("category | product"),
  discount_type: note("Required for promotional / bulk_discount; not used by bogo"),
  discount_value: note("Required for promotional / bulk_discount; not used by bogo"),
  category_id: note("Required when apply_to is category: the category's number (e.g. 1) or UUID. Saved on the offer target"),
  product_id: note("Required when apply_to is product: the product's number (e.g. 1) or UUID. Saved on the offer target"),
  min_qty: note("Required for bulk_discount: the discount starts at this quantity"),
  buy_qty: note("Required for bogo: items paid for in each group"),
  get_qty: note("Required for bogo: items free in each group"),
  start_at: O,
  end_at: O,
  is_active: note("Default true"),
  promo_price: note("flash_sale: fixed sale price (used when below the selling price). Saved on the offer target"),
  free_product_id: note("bogo: the free item, if not the same product. Number or UUID. Saved on the offer target"),
  location_scope: note("Store admin only: all (every location, default) | selected (only location_ids). Ignored for manager / cashier"),
  location_ids: note("Store admin only, required when selected: location numbers, e.g. [1] or [1, 2, 3, 4] (UUIDs also work). Manager / cashier: token location is used"),
}

const ORDER_ITEM = {
  "items[].productId": note("Catalog line: the product number (e.g. 1) or UUID. Leave out on custom sale lines"),
  "items[].qty": R,
  "items[].weight": note("Weight-based products (kg)"),
  "items[].category": note("Custom sale lines only: the category typed at the till"),
  "items[].title": note("Custom sale lines only"),
  "items[].price": note("Custom sale lines only; catalog lines use the product's selling price"),
}

const ORDER_CREATE = {
  channel: must("pos for the desktop till"),
  is_pos_visible: note("Ignored: the server sets it from channel"),
  is_web_visible: note("Ignored: the server sets it from channel"),
  staff_id: STAFF_ID,
  batch_id: note("The open batch (its number). Defaults to the staff member's open batch"),
  device_id: note("Defaults to the device in your POS token"),
  customer_id: note("Customer number. Required when part of the bill is credit / udhaar"),
  tax_exempt: O,
  placed_at: note("Offline sales: when the sale happened on the device (ISO date-time)"),
  coupon_code: O,
  order_discount_type: note("percentage | fixed. Cashiers need an approval"),
  order_discount_value: O,
  approval_request_id: note("Approved discount_override request (cashier discounts)"),
  is_custom: note("true for a custom sale (lines without a catalog product)"),
  items: R,
  ...ORDER_ITEM,
  payments: note("One row per payment method; several rows = split payment. Each method pays its own share of the bill plus its own payment tax. Leave out to pay the full total by payment_method"),
  "payments[].method": must("cash | card | jazzcash | easypaisa"),
  "payments[].bill_share": note("This method's share of the bill before payment tax. Leave out on cash to cover the rest of the bill"),
  "payments[].amount": note("What this method pays toward the bill = bill_share + its payment tax (e.g. cash 16%: 500 → 580). Required on a card / wallet row without bill_share"),
  "payments[].paid": note("What the customer handed over. Only cash may be more than amount — the rest is change"),
  "payments[].transaction_id": note("Card / wallet reference of this payment, kept as the transaction's reference. The transaction itself is numbered 1, 2, 3... by the server"),
  summary: note("The till's own totals; the server checks each one sent (± 0.01) and refuses the order on a mismatch"),
  client_local_id: note("The till's own id for this sale. A resend with the same id returns the saved order instead of a second one"),
  amount_paid: note("Older form: total handed over, or per method [{ method, paid }]"),
  payment_method: note("Required when payments is not sent"),
}

const SUPPLIER_CREATE = {
  name: R,
  phone: O,
  email: O,
  address: O,
  payment_terms: O,
  location_scope: note("Store admin only: all (every branch, default) | selected (only location_ids). Ignored for manager / cashier"),
  location_ids: note("Store admin only, required when selected: location numbers, e.g. [1] or [1, 2, 3] (UUIDs also work). Manager / cashier: token location is used"),
}

const LOCATION_CREATE = {
  name: R,
  address_line: R,
  city: R,
  postal_code: O,
  phone: O,
  is_active: note("Default true"),
  is_default: note("Default false"),
  manager_name: note("Optional: send all four manager_* fields to add a manager with the location, or add one later with POST /staff"),
  manager_email: note("With manager_name"),
  manager_password: note("With manager_name. Min 6 characters"),
  manager_pin: note("With manager_name. 4–6 digits, unique within the location"),
  manager_phone: O,
}

function allOptional(spec, extra = {}) {
  return {
    ...Object.fromEntries(
      Object.entries(spec).map(([key, rule]) => [key, Array.isArray(rule) ? [O, rule[1]] : O])
    ),
    ...extra,
  }
}

export const BODY_FIELDS = {
  // Plans
  "plans-create": PLAN_CREATE,
  "plans-patch": allOptional(PLAN_CREATE),

  // Auth
  "admin-register-superadmin": {
    name: R,
    email: R,
    password: must("Min 6 characters"),
  },
  "admin-create-store": {
    ...TAX_SETTINGS,
    status: note("trial = 3-day free trial (license trial, no billing) | active = purchased plan. Default active"),
    plan_id: R,
    name: R,
    legal_name: O,
    owner_name: O,
    business_type: R,
    address: R,
    city: O,
    contact_email: R,
    contact_phone: R,
    custom_domain: note("Storefront domain, e.g. www.fatimastationers.com"),
    logo_url: O,
    favicon_url: O,
    location_name: R,
    location_address: O,
    location_city: O,
    location_phone: note("Defaults to contact_phone"),
    admin_name: R,
    admin_email: R,
    admin_phone: O,
    admin_password: must("Min 6 characters"),
    admin_pin: must("4–6 digits, unique within the location"),
    pos_enabled: note("Default true"),
    web_enabled: note("Default true"),
    billing_status: note("pending | paid | failed | refunded. Default pending"),
    amount: O,
    method_note: O,
    billing_note: O,
  },
  "auth-login": {
    email: must("Store admin or manager (a cashier is verified by PIN instead)"),
    password: R,
  },
  "auth-pin-verify": {
    pin: must("The staff member's PIN (cashier, manager or store admin) at this location"),
  },
  "auth-patch-me": {
    name: O,
    phone: O,
    current_password: note("Required when password is sent"),
    password: note("New password, min 6 characters"),
    pin: note("New POS PIN, 4–6 digits, unique across all stores"),
  },

  // License
  "license-validate": {
    license_key: R,
    device_uid: must("This till's id, an integer (e.g. 1). Leave it out only to just inspect the key"),
  },

  // Devices
  "license-renew": {
    plan_id: note("Plan number (e.g. 1) or UUID. Leave out to renew on the current plan; another plan switches it"),
    amount: note("Billing amount. Default: the plan's price_pkr"),
    billing_status: note("pending | paid | failed | refunded. Default paid"),
    method_note: note("How it was paid, e.g. cash. Default manual"),
    note: O,
  },
  "device-heartbeat": {},

  // Store & tax
  "store-patch-me": {
    name: O,
    legal_name: O,
    owner_name: O,
    business_type: O,
    address: O,
    city: O,
    contact_email: O,
    contact_phone: O,
    logo_url: O,
    favicon_url: O,
    timezone: O,
    ntn: O,
    strn: O,
    fbr_invoice_enabled: O,
    charge_tax_on_sales: note("Master switch for all tax on sales"),
    sales_tax_enabled: note("Sales tax on / off. Default on"),
    sales_tax_rate: note("Sales tax %, 0–100. Default 18"),
    payment_tax_enabled: note("Payment-method GST on / off. Default on"),
    expiry_warning_days: O,
    expiry_critical_days: O,
    receipt_footer: O,
    pos_enabled: O,
    web_enabled: O,
    default_location_id: O,
  },
  "currency-put": {
    code: note("3-letter ISO code, e.g. PKR, USD. Default PKR"),
    name: note("e.g. Pakistani Rupee"),
    symbol: note("e.g. Rs"),
    decimal_places: note("0–4. Default 2"),
    symbol_position: note("before | after the amount. Default before"),
  },
  "tax-put": TAX_SETTINGS,

  // Staff sessions (attendance) and batches (cash drawer)
  "staff-clock-in": {
    ...ADMIN_LOCATION,
    staffId: must("The staff member clocking in (user number, e.g. 3)"),
    clocked_at: note("Offline sync: when it actually happened. Defaults to now"),
  },
  "staff-clock-out": {
    ...ADMIN_LOCATION,
    staffId: must("The staff member clocking out (user number)"),
    clocked_at: note("Offline sync: when it actually happened. Defaults to now"),
  },
  "batch-open": {
    ...ADMIN_LOCATION,
    staffId: must("The staff member the batch belongs to (user number). staff_id also works"),
    opening_amount: must("Cash put in the drawer"),
    device_id: note("This PC's hardware id or pos_devices id. Defaults to the device in your POS token"),
    note: O,
    opening_at: note("When the batch opened (ISO date-time). Defaults to now"),
  },
  "batch-close": {
    ...ADMIN_LOCATION,
    staffId: must("The staff member whose open batch is closed (user number). staff_id also works"),
    total_cash: must("Cash counted in the drawer (or send the note counts below instead)"),
    note_5000_count: O,
    note_1000_count: O,
    note_500_count: O,
    note_100_count: O,
    note_50_count: O,
    note_20_count: O,
    coins_total: O,
    note: O,
    closing_at: note("When the batch closed (ISO date-time). Defaults to now"),
  },

  // Categories
  "cat-create": CATEGORY_CREATE,
  "cat-bulk": bulkOf(CATEGORY_CREATE),
  "cat-patch": allOptional(CATEGORY_CREATE),

  // Products
  "prod-create": PRODUCT_CREATE,
  "prod-bulk": bulkOf(PRODUCT_CREATE),
  // category_id here is UUID-only, unlike create/bulk's flexible id-or-category_number.
  "prod-patch": allOptional({ ...PRODUCT_CREATE, category_id: note("UUID only on PATCH") }),
  "prod-weight-patch": { is_weight_based: R },

  // Inventory
  "stock-put": {
    qty: note("Send at least one of qty, low_stock_threshold or expiry_date"),
    location_id: note("Store admin only"),
    low_stock_threshold: O,
    expiry_date: note("YYYY-MM-DD for this location"),
    reason: O,
    reason_note: O,
    ...VISIBILITY,
  },
  "movement-create": { ...ADMIN_LOCATION, ...MOVEMENT_CREATE },
  "movement-bulk": { locationId: must("Once, before items[]: the location number (e.g. 1) or UUID whose stock changes. Any role — a manager / cashier only their own location"), ...bulkOf(MOVEMENT_CREATE) },

  // Customers
  "cust-create": CUSTOMER_CREATE,
  "cust-bulk": bulkOf(CUSTOMER_CREATE),
  "cust-patch": allOptional(CUSTOMER_CREATE, { is_active: O }),

  // Staff
  "staff-create": STAFF_CREATE,
  "staff-bulk": bulkOf({
    locationId: must("On every staff item: the location number (e.g. 1) or UUID they work at. A manager can only use their own location"),
    ...Object.fromEntries(Object.entries(STAFF_CREATE).filter(([key]) => key !== "location_id")),
  }),

  // Stock transfers
  "transfer-create": {
    from_location_id: must("Location number (e.g. 1) or UUID the stock leaves from"),
    to_location_id: must("Location number or UUID it goes to"),
    product_id: must("Product number (e.g. 1) or UUID"),
    qty: R,
    note: O,
    staff_id: STAFF_ID,
  },

  "transfer-bulk": {
    items: R,
    "items[].from_location_id": must("Location number (e.g. 1) or UUID the stock leaves from"),
    "items[].to_location_id": must("Location number or UUID it goes to"),
    "items[].product_id": must("Product number (e.g. 1) or UUID"),
    "items[].qty": R,
    "items[].note": O,
    "items[].staff_id": STAFF_ID,
    staff_id: note("Once for every transfer instead of on each item"),
  },

  // Offers
  "offer-create": OFFER_CREATE,
  "offer-bulk": bulkOf(OFFER_CREATE),
  "offer-targets-put": {
    targets: R,
    "targets[].product_id": note("Send product_id or category_id (not both). Number or UUID"),
    "targets[].category_id": note("Send product_id or category_id (not both). Number or UUID"),
    "targets[].free_product_id": note("BOGO free item. Number or UUID"),
    "targets[].promo_price": note("Flash sale fixed price"),
  },
  // Targets change through PUT /offers/:id/targets, not PATCH.
  "offer-patch": allOptional(
    Object.fromEntries(
      Object.entries(OFFER_CREATE).filter(
        ([key]) => !["category_id", "product_id", "promo_price", "free_product_id"].includes(key)
      )
    )
  ),

  // Orders
  "order-create": { ...ADMIN_LOCATION, ...ORDER_CREATE },
  "order-bulk": { locationId: must("Once, before items[]: the location number (e.g. 1) or UUID where the sales happened. Any role — a manager / cashier only their own location"), ...bulkOf(ORDER_CREATE) },
  "order-refund": {
    order_item_id: must("The line's item number in the order (1, 2, 3...) or its UUID"),
    qty: R,
    reason: R,
    staff_id: STAFF_ID,
  },
  "order-refund-complete": { reason: R, staff_id: STAFF_ID },
  "order-refund-bulk": {
    locationId: must("Once, before items[]: the location number (e.g. 1) or UUID of the orders refunded. Any role — a manager / cashier only their own location"),
    items: R,
    "items[].order_id": must("Order number (e.g. 1) or UUID"),
    "items[].order_item_id": must("The line's item number in that order, or its UUID"),
    "items[].qty": R,
    "items[].reason": R,
    "items[].staff_id": STAFF_ID,
  },
  "order-refund-complete-bulk": {
    locationId: must("Once, before items[]: the location number (e.g. 1) or UUID of the orders refunded. Any role — a manager / cashier only their own location"),
    items: R,
    "items[].order_id": must("Order number (e.g. 1) or UUID"),
    "items[].reason": R,
    "items[].staff_id": STAFF_ID,
  },
  "receipt-generate": { order_id: must("Order number (e.g. 1) or UUID") },
  "order-void": {
    reason: O,
    approval_request_id: note("Cashiers on Package 2/3: approved void_order request"),
  },

  // Suppliers
  "sup-create": SUPPLIER_CREATE,
  "sup-bulk": bulkOf(SUPPLIER_CREATE),
  "sup-patch": allOptional(SUPPLIER_CREATE, { is_active: note("false = deactivate") }),

  // Locations
  "location-create": LOCATION_CREATE,
  "location-patch": allOptional(LOCATION_CREATE, {
    manager_password: note("Leave blank to keep the current password"),
    manager_is_active: O,
  }),
}

/** Rules for a body: explicit entry, or the generic `ids` rule of the data bulk-delete routes. */
export function bodyFieldsFor(endpoint) {
  if (BODY_FIELDS[endpoint.id]) return BODY_FIELDS[endpoint.id]
  if (endpoint.tag === "data" && endpoint.id.endsWith("-bulk")) return { ids: R }
  return null
}

/** Every attribute path in an example body ("items[].product_id" for array rows). */
export function bodyPaths(value, prefix = "") {
  if (Array.isArray(value)) {
    const first = value.find((row) => row && typeof row === "object" && !Array.isArray(row))
    return first ? bodyPaths(first, `${prefix}[].`) : []
  }
  if (!value || typeof value !== "object") return []
  return Object.entries(value).flatMap(([key, child]) => {
    const path = `${prefix}${key}`
    const isRows = Array.isArray(child) && child.some((row) => row && typeof row === "object")
    return [path, ...(isRows ? bodyPaths(child, path) : [])]
  })
}

/** Body attributes with no required/optional rule (should always be empty). */
export function missingBodyFields(endpoint) {
  if (endpoint.body == null) return []
  const rules = bodyFieldsFor(endpoint) || {}
  return bodyPaths(endpoint.body).filter((path) => !(path in rules))
}

export function ruleOf(rule) {
  if (Array.isArray(rule)) return { required: rule[0] === R, note: rule[1] }
  return { required: rule === R, note: "" }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NUMBER_SUFFIX_RE =
  /_(number|int|count|qty|quantity|price|cash|amount|percent|value|values|days|threshold|size|total|pkr|rate)$/
// Known booleans that don't follow the is_/has_ naming convention.
const KNOWN_BOOLEAN_KEYS = new Set([
  "sell_loose",
  "pos_enabled",
  "web_enabled",
  "fbr_invoice_enabled",
  "charge_tax_on_sales",
  "payment_tax_enabled",
  "sales_tax_enabled",
  "tax_exempt",
])

/**
 * Data type shown in the attributes table. Prefers the live example body's own value (most
 * accurate, whatever a developer actually wired up); falls back to a heuristic over the
 * attribute's name and note when that path isn't present in the body — this project's own
 * naming convention is consistent enough (_id, _at, is_/has_, _number/_count/...) that the
 * fallback is reliable without hand-annotating every field.
 */
export function typeOf(path, rule, bodyValue) {
  const { note: noteText } = ruleOf(rule)
  // References that take the short number or the UUID (location_id, product_id...).
  if (/(^|_)id$|[a-z]Id$/.test(path.split(".").pop()) && /number/i.test(noteText) && /UUID/.test(noteText)) {
    return "number | UUID"
  }
  if (bodyValue !== undefined) {
    if (typeof bodyValue === "boolean") return "boolean"
    if (typeof bodyValue === "number") return "number"
    if (Array.isArray(bodyValue)) return "array"
    if (bodyValue && typeof bodyValue === "object") return "object"
    if (typeof bodyValue === "string") {
      if (UUID_RE.test(bodyValue)) return "UUID"
      if (noteText && /\s\|\s/.test(noteText)) return "enum"
      return "string"
    }
  }
  const key = path.split(".").pop().replace(/\[\]$/, "")
  if (noteText && /\s\|\s/.test(noteText)) return "enum"
  if (/(^|_)id$/.test(key)) return "UUID"
  if (/_at$/.test(key)) return "date-time"
  if (/^(is_|has_)/.test(key) || KNOWN_BOOLEAN_KEYS.has(key)) return "boolean"
  if (NUMBER_SUFFIX_RE.test(key)) return "number"
  if (key === "items" || key === "features" || key === "targets" || key === "rates") return "array"
  return "string"
}

// "Default X" / "Defaults to X" / "Default: X" inside a note, up to " — ", ". ", ";" or the end.
const DEFAULT_RE = /\s*\bDefaults?(?::|\s+to|\s+is)?\s+(.+?)(?=\s+—|[.;]\s|[.;]?$)[.;]?/i

/** The default value a note names (e.g. "web | pos | both. Default both" → "both"), or null. */
export function defaultOf(rule) {
  const { note } = ruleOf(rule)
  const match = note && note.match(DEFAULT_RE)
  return match ? match[1].trim() : null
}

/** The note without its "Default …" part (that one has its own column). */
export function noteWithoutDefault(rule) {
  const { note } = ruleOf(rule)
  if (!note) return ""
  return note
    .replace(DEFAULT_RE, "")
    .replace(/\s*\.\s*—\s*/, ". ")
    .replace(/^[\s—.;]+|[\s—;]+$/g, "")
    .trim()
}

/**
 * Enums written in the attribute notes ("manager | cashier", "percentage | fixed (per unit)"):
 * { attribute: [values] }. A bulk row's attributes read without "items[].".
 */
export function enumsFromFields(fields) {
  const out = {}
  for (const [path, rule] of Object.entries(fields || {})) {
    const { note } = ruleOf(rule)
    const part = note && note.split(/\.\s/).find((piece) => piece.includes(" | "))
    if (!part) continue
    const values = part
      .split("|")
      .map((piece) => piece.trim().match(/^[A-Za-z0-9_-]+/)?.[0])
      .filter(Boolean)
    if (values.length >= 2) out[path.replace(/^items\[\]\./, "")] = [...new Set(values)]
  }
  return out
}
