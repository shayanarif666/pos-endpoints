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
  name: R,
  description: O,
  parent_category_id: O,
  tax_type: note("percentage | fixed"),
  tax_value: O,
  discount_type: note("percentage | fixed"),
  discount_value: O,
  is_active: note("Default true"),
  ...VISIBILITY,
}

const PRODUCT_CREATE = {
  title: R,
  barcode: O,
  category_id: R,
  unit: note("Default piece"),
  cost_price: R,
  selling_price: R,
  tax_type: note("percentage | fixed"),
  tax_value: O,
  has_product_discount: O,
  discount_type: note("percentage | fixed"),
  discount_value: O,
  is_pack_product: O,
  pack_size: note("Required (>= 2) when is_pack_product is true"),
  sell_loose: O,
  is_weight_based: O,
  has_bulk_discount: O,
  low_stock_threshold: note("Default 10"),
  is_published: note("Default false"),
  is_active: note("Default true"),
  ...VISIBILITY,
}

const MOVEMENT_CREATE = {
  product_id: R,
  location_id: note("Store admin only; others use their JWT location"),
  movement_type: must("stock_in | stock_out | adjustment"),
  reason: R,
  qty: must("Non-zero. stock_in positive, stock_out negative"),
  reason_note: O,
  expiry_date: note("YYYY-MM-DD"),
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
  pin: must("4–6 digits, unique in the store"),
  role: must("manager | cashier"),
  phone: O,
  location_id: note("Store admin only; manager's staff get the manager's location"),
}

const OFFER_CREATE = {
  name: R,
  type: R,
  apply_to: R,
  location_id: note("Null = all branches"),
  discount_type: note("Required for promotional / flash_sale"),
  discount_value: note("Required for promotional / flash_sale"),
  min_qty: note("Required for bulk_discount"),
  buy_qty: note("Required for bogo"),
  get_qty: note("Required for bogo"),
  start_at: O,
  end_at: O,
  is_active: note("Default true"),
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
  manager_pin: must("4–6 digits, unique in the store"),
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
    admin_pin: must("4–6 digits"),
    manager_name: R,
    manager_email: must("Must differ from admin_email"),
    manager_phone: O,
    manager_password: must("Min 6 characters"),
    manager_pin: must("4–6 digits, different from admin_pin"),
    pos_enabled: note("Default true"),
    web_enabled: note("Default true"),
    billing_status: note("pending | paid | failed | refunded. Default pending"),
    amount: O,
    method_note: O,
  },
  "auth-login": {
    email: R,
    password: R,
    channel: must("pos"),
    license_key: R,
    device_uid: must("Same device_uid used on license activation"),
  },
  "auth-login-pin": {
    pin: must("4–6 digits"),
    channel: must("pos"),
    license_key: R,
    device_uid: must("Same device_uid used on license activation"),
  },
  "auth-patch-me": {
    name: O,
    phone: O,
    current_password: note("Required when password is sent"),
    password: note("New password, min 6 characters"),
    pin: note("New POS PIN, 4–6 digits"),
  },

  // License
  "license-validate": {
    license_key: R,
    device_uid: must("This PC's stable id. Leave it out only to just inspect the key"),
    name: O,
    location_id: note("Defaults to the store's default location"),
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
    device_id: note("Defaults to the device in your POS token"),
    note: O,
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
  },

  // Categories
  "cat-create": CATEGORY_CREATE,
  "cat-bulk": bulkOf(CATEGORY_CREATE),
  "cat-patch": allOptional(CATEGORY_CREATE),

  // Products
  "prod-create": PRODUCT_CREATE,
  "prod-bulk": bulkOf(PRODUCT_CREATE),
  "prod-patch": allOptional(PRODUCT_CREATE),
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
    "targets[].product_id": note("Send product_id or category_id (not both)"),
    "targets[].category_id": note("Send product_id or category_id (not both)"),
    "targets[].free_product_id": note("BOGO free item"),
    "targets[].promo_price": note("Flash sale fixed price"),
  },
  "offer-patch": allOptional(OFFER_CREATE),

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
