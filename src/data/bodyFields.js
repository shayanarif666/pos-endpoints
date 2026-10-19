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

const PLAN_CREATE = {
  code: R,
  type: must("monthly | yearly"),
  name: R,
  price_pkr: R,
  max_devices: R,
  max_locations: R,
  features: O,
  is_active: note("Default true"),
}

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
  tax_name: note("Label for the tax, e.g. GST"),
  tax_type: note("percentage | fixed. Product tax applies when type + value are sent"),
  tax_value: O,
  discount_name: note("Label for the discount, e.g. Eid Shopping"),
  discount_type: note("percentage | fixed. Product discount applies when type + value are sent"),
  discount_value: O,
  sell_loose: note("True if units can also be sold individually"),
  low_stock_threshold: note("Default 10"),
  image: note("Image URL, saved as featured_image and images[0]. Empty string = no image"),
  is_weight_based: note("Sold by weight (kg). Can't be true together with is_pack_product"),
  is_published: note("Default false"),
  is_active: note("Default true"),
  ...VISIBILITY,
}

const MOVEMENT_CREATE = {
  product_id: must("The product's number (e.g. 1) or its UUID"),
  movement_type: must("stock_in | stock_out | adjustment"),
  reason: must("Any reason except refund, transfer, custom_sale"),
  qty: must("Non-zero change. stock_in positive, stock_out negative"),
  expiry_date: must("YYYY-MM-DD"),
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
  phone: O,
}

const OFFER_CREATE = {
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
  location_id: note("Null = all branches"),
}

const ORDER_ITEM = {
  "items[].product_id": note("Catalog line. Leave out only for custom sale lines (send title + unit_price)"),
  "items[].quantity": R,
  "items[].weight": note("Weight-based products (kg)"),
  "items[].title": note("Custom sale lines only"),
  "items[].unit_price": note("Custom sale lines only; catalog lines use selling_price"),
}

const ORDER_CREATE = {
  channel: must("pos for the desktop till"),
  is_pos_visible: note("Ignored: the server sets it from channel"),
  is_web_visible: note("Ignored: the server sets it from channel"),
  register_session_id: note("Defaults to your own open shift"),
  device_id: note("Defaults to the device in your POS token"),
  customer_id: note("Required when part of the bill is credit / udhaar"),
  tax_exempt: O,
  client_local_id: note("Offline idempotency key: a retry returns the same order"),
  placed_at: note("Offline sales: when the sale happened on the device (ISO date-time)"),
  coupon_code: O,
  order_discount_type: note("percentage | fixed. Cashiers need an approval"),
  order_discount_value: O,
  approval_request_id: note("Approved discount_override request (cashier discounts)"),
  is_custom: note("true for Custom sales"),
  items: R,
  ...ORDER_ITEM,
  payments: note("Split / tendered payments. Leave out to pay the full total by payment_method"),
  "payments[].method": must("cash | card | jazzcash | easypaisa"),
  "payments[].amount": R,
  amount_paid: note("Cash tendered, for change_due"),
  payment_method: note("Required when payments is not sent"),
}

const SUPPLIER_CREATE = {
  name: R,
  phone: O,
  email: O,
  address: O,
  payment_terms: O,
  location_scope: note("all (every branch, default) | selected (only location_ids)"),
  location_ids: note("Required when selected: one branch or several. Managers: own branch only"),
  is_active: note("Default true"),
  ...VISIBILITY,
}

const LOCATION_CREATE = {
  name: R,
  address_line: R,
  city: R,
  postal_code: O,
  phone: O,
  is_active: note("Default true"),
  is_default: note("Default false"),
  manager_name: R,
  manager_email: R,
  manager_password: must("Min 6 characters"),
  manager_pin: must("4–6 digits, unique across all stores"),
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
    location_name: R,
    location_address: O,
    location_city: O,
    location_phone: note("Defaults to contact_phone"),
    admin_name: R,
    admin_email: R,
    admin_phone: O,
    admin_password: must("Min 6 characters"),
    admin_pin: must("4–6 digits, unique across all stores"),
    manager_name: R,
    manager_email: must("Must differ from admin_email"),
    manager_phone: O,
    manager_password: must("Min 6 characters"),
    manager_pin: must("4–6 digits, unique across all stores"),
    pos_enabled: note("Default true"),
    web_enabled: note("Default true"),
    billing_status: note("pending | paid | failed | refunded. Default pending"),
    amount: O,
    method_note: O,
  },
  "auth-login": {
    email: R,
    password: R,
    channel: note("pos (POS app, default) | web (dashboard)"),
  },
  "auth-login-pin": {
    pin: must("4–6 digits, unique within one location"),
    channel: note("Always pos (default pos)"),
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
    device_uid: must("This PC's stable id. Leave it out only to just inspect the key"),
    name: O,
    platform: O,
    app_version: O,
  },

  // Devices
  "device-create": {
    device_uid: R,
    name: R,
    location_id: note("Store admin only"),
    platform: O,
    app_version: O,
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
    currency: O,
    timezone: O,
    ntn: O,
    strn: O,
    fbr_invoice_enabled: O,
    charge_tax_on_sales: O,
    default_tax_rate: note("0–100"),
    expiry_warning_days: O,
    expiry_critical_days: O,
    receipt_footer: O,
    pos_enabled: O,
    web_enabled: O,
    default_location_id: O,
  },
  "tax-put": {
    ntn: O,
    strn: O,
    charge_tax_on_sales: O,
    fbr_invoice_enabled: O,
    default_tax_rate: note("0–100"),
    rates: R,
    "rates[].payment_method": must("cash | card | jazzcash | easypaisa | cod"),
    "rates[].gst_percent": must("0–100"),
  },

  // Shifts
  "shift-clock-in": {
    opening_cash: R,
    device_id: note("pos_devices row id OR this PC's stable hardware id — either works here. Defaults to the device in your POS token"),
    device_uid: note("Alternative to device_id if you'd rather be explicit — this PC's stable hardware id"),
    note: O,
    opened_at: note("Offline sync: when the shift actually opened, if earlier than now. Defaults to now"),
  },
  "shift-clock-out": {
    counted_cash: note("Leave out to total the note counts below"),
    closing_cash: note("Defaults to counted cash"),
    coins_total: O,
    note_5000_count: O,
    note_1000_count: O,
    note_500_count: O,
    note_100_count: O,
    note_50_count: O,
    note_20_count: O,
    note: O,
    closed_at: note("Offline sync: when the shift actually closed (e.g. at day-end), if earlier than now. Defaults to now"),
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
  "movement-create": MOVEMENT_CREATE,
  "movement-bulk": bulkOf(MOVEMENT_CREATE),

  // Customers
  "cust-create": CUSTOMER_CREATE,
  "cust-bulk": bulkOf(CUSTOMER_CREATE),
  "cust-patch": allOptional(CUSTOMER_CREATE, { is_active: O }),

  // Staff
  "staff-create": STAFF_CREATE,
  "staff-bulk": bulkOf(STAFF_CREATE),

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
  "order-create": ORDER_CREATE,
  "order-bulk": bulkOf(ORDER_CREATE),
  "order-refund": { order_item_id: R, quantity: R, reason: R },
  "order-refund-complete": { reason: R },
  "order-refund-bulk": {
    items: R,
    "items[].order_id": R,
    "items[].order_item_id": R,
    "items[].quantity": R,
    "items[].reason": R,
  },
  "order-refund-complete-bulk": {
    items: R,
    "items[].order_id": R,
    "items[].reason": R,
  },
  "order-void": {
    reason: O,
    approval_request_id: note("Cashiers on Package 2/3: approved void_order request"),
  },

  // Suppliers
  "sup-create": SUPPLIER_CREATE,
  "sup-bulk": bulkOf(SUPPLIER_CREATE),
  "sup-patch": allOptional(SUPPLIER_CREATE),

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
const UUID_PLACEHOLDER = "00000000-0000-4000-8000-000000000001"
const NUMBER_SUFFIX_RE =
  /_(number|int|count|qty|quantity|price|cash|amount|percent|value|values|days|threshold|size|total|pkr|rate)$/
// Known booleans that don't follow the is_/has_ naming convention.
const KNOWN_BOOLEAN_KEYS = new Set([
  "sell_loose",
  "pos_enabled",
  "web_enabled",
  "fbr_invoice_enabled",
  "charge_tax_on_sales",
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

/** A representative value for the Example column when the live body doesn't have one. */
export function synthesizeExample(type, rule) {
  const { note: noteText } = ruleOf(rule)
  switch (type) {
    case "UUID":
      return UUID_PLACEHOLDER
    case "boolean":
      return true
    case "number":
      return 1
    case "date-time":
      return new Date().toISOString()
    case "enum": {
      const match = noteText && noteText.match(/([a-zA-Z0-9_]+)\s*\|/)
      return match ? match[1] : undefined
    }
    default:
      return undefined
  }
}
