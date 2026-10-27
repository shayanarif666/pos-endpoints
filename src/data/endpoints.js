import { bodyFieldsFor, enumsFromFields } from "./bodyFields.js"
import { buildBody, defaultToggles } from "./bodyBuilder.js"
import { SAMPLE_RESPONSES } from "./sampleResponses.js"

const UUID = "00000000-0000-4000-8000-000000000001"

// Shared row pieces for the Category / Product builders (PDF spec, Oct 2026).
const TAX = (name, type, value) => [
  ["tax_name", name, "tax"],
  ["tax_type", type, "tax"],
  ["tax_value", value, "tax"],
]
const DISCOUNT = (name, type, value) => [
  ["discount_name", name, "discount"],
  ["discount_type", type, "discount"],
  ["discount_value", value, "discount"],
]
const VISIBILITY_OPTIONAL = [
  ["is_active", true, "optional"],
  ["is_pos_visible", true, "optional"],
  ["is_web_visible", true, "optional"],
  ["channel", "both", "optional"],
]

function categoryRow(name, taxValue, discountValue) {
  return [
    ["name", name],
    ...TAX("GST", "percentage", taxValue),
    ...DISCOUNT("Eid Shopping", "percentage", discountValue),
    ["description", "", "optional"],
    ["parent_category_id", null, "optional"],
    ...VISIBILITY_OPTIONAL,
  ]
}

const CATEGORY_TOGGLES = [
  { id: "discount", label: "Has Category Discount", default: true },
  { id: "tax", label: "Has Category Tax", default: true },
  { id: "optional", label: "Show Optional Fields", default: false },
]

// Shared tail of a product row; tax / discount differ per example item.
const productTail = ({ taxes, discount, weight }) => [
  ["taxes", taxes, "tax"],
  ...DISCOUNT("Eid Shopping", "percentage", discount),
  ["low_stock_threshold", 10],
  ["sell_loose", true],
  ["is_weight_based", weight],
  ["image", ""],
  ["is_published", false, "optional"],
  ...VISIBILITY_OPTIONAL,
]

// Loose item: sold one by one.
const PRODUCT_LOOSE_ROW = [
  ["title", "1 Litre Pepsi"],
  ["barcode", "78263672323325"],
  ["category_id", 1],
  ["unit", "bottle"],
  ["cost", 50],
  ["price", 100],
  ...productTail({ taxes: [{ name: "GST", type: "percentage", value: 18 }], discount: 5, weight: false }),
]

// Loose + pack: a box of 12 that also sells single pieces.
const PRODUCT_PACK_ROW = [
  ["title", "Lux Soap"],
  ["barcode", "8961014001234"],
  ["category_id", 2],
  ["unit", "piece"],
  ["is_pack_product", true],
  ["pack_size", 12],
  ["pack_cost", 900],
  ["pack_price", 1200],
  ...productTail({ taxes: [{ name: "GST", type: "percentage", value: 18 }], discount: 0, weight: false }),
]

// Loose + pack + weight: a 25 kg bag, also sold loose by the kg on the scale.
const PRODUCT_PACK_WEIGHT_ROW = [
  ["title", "Basmati Rice"],
  ["barcode", "8964000123456"],
  ["category_id", 3],
  ["unit", "kg"],
  ["is_pack_product", true],
  ["pack_size", 25],
  ["pack_cost", 7500],
  ["pack_price", 9000],
  ...productTail({
    taxes: [
      { name: "GST", type: "percentage", value: 18 },
      { name: "Excise", type: "fixed", value: 2 },
    ],
    discount: 10,
    weight: true,
  }),
]

const round2 = (n) => Math.round(n * 100) / 100

// Mirrors how the server keeps total_price_each_unit / total_pack_price: the product's own
// discount first, then each of its taxes on the discounted price. Fixed amounts are per unit.
function priceAfterDiscountAndTax(item, base, units) {
  const discountValue = Number(item.discount_value)
  let net = base
  if (item.discount_type && item.discount_value != null && discountValue > 0) {
    net -= Math.min(
      base,
      item.discount_type === "percentage" ? (base * discountValue) / 100 : discountValue * units
    )
  }
  const taxes = Array.isArray(item.taxes) ? item.taxes : []
  const tax = taxes.reduce((sum, row) => {
    const value = Number(row?.value)
    if (!row || Number.isNaN(value)) return sum
    return sum + (row.type === "percentage" ? (net * value) / 100 : row.type === "fixed" ? value * units : 0)
  }, 0)
  return round2(net + tax)
}

/** Totals the server computes for one product body, labelled per Loose Item / Pack Product. */
function productTotals(item) {
  const isPack = Boolean(item.is_pack_product)
  const packSize = Number(item.pack_size)
  // A pack product's unit price is always derived from the pack, like the server does.
  const unitPrice = isPack
    ? packSize
      ? round2(Number(item.pack_price ?? item.pack_selling_price) / packSize)
      : null
    : item.price ?? item.selling_price
  const rows = []
  if (unitPrice != null && !Number.isNaN(Number(unitPrice))) {
    rows.push([
      isPack ? "total_price_each_unit" : "total_price",
      priceAfterDiscountAndTax(item, Number(unitPrice), 1),
    ])
  }
  const packPrice = item.pack_price ?? item.pack_selling_price
  if (isPack && packPrice != null && packSize) {
    rows.push(["total_pack_price", priceAfterDiscountAndTax(item, Number(packPrice), packSize)])
  }
  return rows
}

const PRODUCT_TOGGLES = [
  { id: "discount", label: "Has Product Discount", default: true },
  { id: "tax", label: "Has Product Tax", default: true },
  { id: "optional", label: "Show Optional Fields", default: false },
]

function productBuilder() {
  return {
    bulk: true,
    variants: [
      { id: "default", label: null, rows: [PRODUCT_LOOSE_ROW, PRODUCT_PACK_ROW, PRODUCT_PACK_WEIGHT_ROW] },
    ],
    toggles: PRODUCT_TOGGLES,
  }
}

const movementRow = (productId, type, reason, qty, expiry) => [
  ["staffId", 1],
  ["product_id", productId],
  ["movement_type", type],
  ["reason", reason],
  ["qty", qty],
  ["expiry_date", expiry],
  ["supplier_id", null, "optional"],
  ["is_pos_visible", true, "optional"],
  ["is_web_visible", true, "optional"],
  ["channel", "both", "optional"],
]

function movementBuilder() {
  return {
    bulk: true,
    variants: [
      {
        id: "default",
        label: "Movement",
        rows: [
          movementRow(1, "stock_in", "purchase", 50, "2026-12-31"),
          movementRow(2, "stock_in", "opening_balance", 24, "2027-06-30"),
          movementRow(1, "stock_out", "damage", -2, "2026-12-31"),
        ],
      },
    ],
    bulkTop: [["locationId", 1]],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

const OFFER_DATES = [
  ["start_at", "2026-09-01T00:00:00.000Z"],
  ["end_at", "2026-12-31T23:59:59.000Z"],
  ["is_active", true],
]

const OFFER_ROWS = [
  [
    ["name", "Weekend 10% off"],
    ["type", "promotional"],
    ["apply_to", "category"],
    ["discount_type", "percentage"],
    ["discount_value", 10],
    ["category_id", 1],
    ...OFFER_DATES,
    ["staff_id", 3, "optional"],
  ],
  [
    ["name", "Buy 3 save 5%"],
    ["type", "bulk_discount"],
    ["apply_to", "product"],
    ["discount_type", "percentage"],
    ["discount_value", 5],
    ["product_id", 2],
    ["min_qty", 3],
    ...OFFER_DATES,
    ["staff_id", 3, "optional"],
  ],
  [
    ["name", "Buy 2 get 1 free"],
    ["type", "bogo"],
    ["apply_to", "product"],
    ["product_id", 1],
    ["buy_qty", 2],
    ["get_qty", 1],
    ...OFFER_DATES,
    ["free_product_id", 1, "optional"],
    ["staff_id", 3, "optional"],
  ],
]

// Each offer picks where it runs (store admin only; stripped for a manager / cashier, whose
// offers are for their own location): every location, one location, several locations.
const OFFER_LOCATIONS = [
  [["location_scope", "all"]],
  [
    ["location_scope", "selected"],
    ["location_ids", [1]],
  ],
  [
    ["location_scope", "selected"],
    ["location_ids", [1, 2]],
  ],
]

function offerBuilder() {
  return {
    bulk: true,
    variants: [
      {
        id: "default",
        label: null,
        rows: OFFER_ROWS.map((row, index) => [...row, ...OFFER_LOCATIONS[index % OFFER_LOCATIONS.length]]),
      },
    ],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

const ORDER_OPTIONAL = [
  ["customer_id", null, "optional"],
  ["placed_at", "2026-10-26T10:05:00.000Z", "optional"],
]

// One order row: till staff and batch, the lines and the payments (channel defaults to pos).
const orderRow = ({ custom = false, items, payments, extra = [] }) => [
  ...(custom ? [["is_custom", true]] : []),
  ["staff_id", 3],
  ["batch_id", 1],
  ["items", items],
  ["payments", payments],
  ...ORDER_OPTIONAL,
  ...extra,
]

// Five sales: catalog and custom, cash and split (card / JazzCash / EasyPaisa + cash). Each
// payment: amount = its share of the bill + its payment tax; paid = what the customer handed
// over (only cash may be more — the rest is change). Cash with only paid covers the rest of the bill.
const ORDER_ROWS = [
  orderRow({
    items: [{ productId: 1, qty: 2 }, { productId: 2, qty: 1 }],
    payments: [{ method: "cash", paid: 1000 }],
    extra: [
      ["order_discount_type", null, "optional"],
      ["order_discount_value", null, "optional"],
      ["tax_exempt", false, "optional"],
    ],
  }),
  orderRow({
    custom: true,
    items: [
      { category: "Stationary", title: "SP10 Blue Pen", price: 50, qty: 2 },
      { category: "Stationary", title: "A4 Notebook", price: 120, qty: 1 },
    ],
    payments: [{ method: "cash", paid: 500 }],
  }),
  orderRow({
    items: [{ productId: 2, qty: 12 }, { productId: 1, qty: 1 }],
    payments: [{ method: "card", amount: 100 }, { method: "cash", paid: 3000 }],
  }),
  orderRow({
    custom: true,
    items: [
      { category: "Household", title: "Tissue Box", price: 150, qty: 1 },
      { category: "Electronics", title: "AA Batteries (pair)", price: 80, qty: 2 },
    ],
    payments: [{ method: "jazzcash", amount: 50 }, { method: "cash", paid: 500 }],
  }),
  // The full form: every figure worked out by the till (Pepsi × 3, Lux × 2, sales tax off).
  orderRow({
    items: [{ productId: 1, qty: 3 }, { productId: 2, qty: 2 }],
    payments: [
      { method: "cash", bill_share: 500, amount: 580, paid: 1000 },
      { method: "easypaisa", bill_share: 106.55, amount: 111.88, paid: 111.88 },
    ],
  }),
]

function orderBuilder() {
  return {
    bulk: true,
    variants: [{ id: "default", label: null, rows: ORDER_ROWS }],
    bulkTop: [["locationId", 1]],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

export const RESOURCE_ENUMS = {
  plans: {
    type: ["monthly", "yearly"],
  },
  auth: {
    role: ["superadmin", "store_admin", "manager", "cashier", "customer"],
    channel: ["web", "pos"],
  },
  license: {
    status: ["pending", "active", "expired", "revoked"],
  },
  devices: {},
  locations: {},
  store: {
    business_type: [
      "grocery",
      "boutique",
      "retail",
      "pharmacy",
      "restaurant",
      "cafe",
      "bakery",
      "electronics",
      "fashion",
      "clothing",
      "beauty",
      "furniture",
      "hardware",
      "sports",
      "books",
      "jewelry",
      "supermarket",
      "convenience",
      "wholesale",
      "other",
    ],
    symbol_position: ["before", "after"],
  },
  shifts: {
    status: ["clock_in", "clock_out"],
  },
  categories: {
    tax_type: ["percentage", "fixed"],
    discount_type: ["percentage", "fixed"],
    channel: ["web", "pos", "both"],
  },
  products: {
    unit: [
      "piece",
      "kg",
      "gram",
      "liter",
      "ml",
      "packet",
      "box",
      "dozen",
      "pair",
      "meter",
      "yard",
      "roll",
      "set",
      "carton",
      "bag",
      "bottle",
      "can",
    ],
    tax_type: ["percentage", "fixed"],
    discount_type: ["percentage", "fixed"],
    channel: ["web", "pos", "both"],
  },
  inventory: {
    "movement_type": [
      "stock_in",
      "stock_out",
      "adjustment",
      "sale",
      "refund",
      "transfer_out",
      "transfer_in",
      "custom_sale",
    ],
    reason: [
      "purchase",
      "opening_balance",
      "return_to_supplier",
      "customer_return",
      "waste",
      "damage",
      "expiry",
      "theft",
      "count",
      "sale",
      "refund",
      "sync",
      "transfer",
      "custom_sale",
      "other",
    ],
    channel: ["web", "pos", "both"],
  },
  customers: {
    entry_type: ["debit", "credit"],
    channel: ["web", "pos", "both"],
  },
  staff: {
    role: ["manager", "cashier"],
  },
  offers: {
    type: ["flash_sale", "bulk_discount", "bogo", "promotional"],
    apply_to: ["product", "category"],
    discount_type: ["percentage", "fixed"],
  },
  orders: {
    channel: ["web", "pos"],
    is_pos_visible: ["true", "false"],
    is_web_visible: ["true", "false"],
    order_status: ["pending", "completed", "voided", "cancelled", "refunded"],
    payment_status: ["pending", "paid", "failed", "refunded"],
    payment_method: ["cash", "card", "jazzcash", "easypaisa", "cod", "mixed"],
  },
  reports: {
    period: ["daily", "weekly", "monthly", "yearly"],
    channel: ["web", "pos"],
  },
  suppliers: {
    location_scope: ["all", "selected"],
    entry_type: ["debit", "credit"],
    channel: ["web", "pos", "both"],
  },
  audit: {
    actor_type: ["user", "system"],
    action: [
      "create",
      "update",
      "delete",
      "login",
      "logout",
      "clock_in",
      "clock_out",
      "sale",
      "void",
      "cancel",
      "refund",
      "pin_override",
      "approve",
      "reject",
      "license_activate",
      "backup",
      "restore",
    ],
  },
  data: {},
}

/** The body attributes' own enums (from their notes) first, then the resource's. */
function endpointEnums(resourceEnums, fields) {
  const merged = { ...enumsFromFields(fields), ...(resourceEnums || {}) }
  const rows = Object.entries(merged).filter(([, values]) => Array.isArray(values) && values.length)
  return rows.length ? Object.fromEntries(rows) : null
}

function ep({
  id,
  tag,
  method,
  path,
  summary,
  description,
  auth = "bearer",
  pathParams = [],
  query = [],
  body = null,
  // Alternative to `body`: a template with radio variants and checkbox toggles — see
  // bodyBuilder.js. `body` becomes the template's default output.
  bodyBuilder = null,
  files = [],
  capture = null,
  enums = null,
  // (item) => [[label, value], ...]: values the server computes from a body row, shown under it.
  computed = null,
  // Body keys only a store admin may send (shown only when the signed-in role is store_admin).
  adminOnly = [],
  // Sample replies: [{ label, body }], shown under View Response.
  responses = [],
}) {
  const effectiveBody = bodyBuilder
    ? buildBody(bodyBuilder, bodyBuilder.variants[0].id, defaultToggles(bodyBuilder))
    : body
  return {
    id,
    tag,
    method,
    path,
    summary,
    description,
    auth,
    pathParams,
    query,
    body: effectiveBody,
    bodyBuilder,
    computed,
    adminOnly,
    // Captured replies first (shown under the request), then the hand-written edge cases.
    responses: [...(SAMPLE_RESPONSES[id] || []), ...responses],
    files,
    capture,
    enums: endpointEnums(enums || RESOURCE_ENUMS[tag], effectiveBody == null ? null : bodyFieldsFor({ id, tag })),
    fields: effectiveBody == null ? null : bodyFieldsFor({ id, tag }),
  }
}

export const tags = [
  {
    id: "plans",
    name: "Plans",
    description: "Super Admin only. Create, list, update, and delete packages. code is a free-form unique key (not limited to package_1–3).",
    enums: RESOURCE_ENUMS.plans,
  },
  {
    id: "auth",
    name: "Authentication",
    description:
      "Register store (Super Admin), then POS login. get/update me as used on Settings.",
    enums: RESOURCE_ENUMS.auth,
  },
  {
    id: "license",
    name: "License",
    description: "POS Activate page. license_key + device_uid binds this browser.",
    enums: RESOURCE_ENUMS.license,
  },
  {
    id: "devices",
    name: "POS devices",
    description: "POS shell sends heartbeat after login.",
    enums: RESOURCE_ENUMS.devices,
  },
  {
    id: "locations",
    name: "Locations",
    description:
      "Branches of the store. Store admin sees and creates all locations (create needs the plan to allow another location). Manager sees and edits only their own location. Each location has its own manager account.",
    enums: RESOURCE_ENUMS.locations,
  },
  {
    id: "store",
    name: "Store, tax & currency",
    description: "Settings, Tax manager, and cart default tax. GET/PATCH stores/me, tax-rates.",
    enums: RESOURCE_ENUMS.store,
  },
  {
    id: "shifts",
    name: "Staff sessions & batches",
    description: "Register page + POS shell current session.",
    enums: RESOURCE_ENUMS.shifts,
  },
  {
    id: "categories",
    name: "Categories",
    description: "POS catalog tabs and Categories page.",
    enums: RESOURCE_ENUMS.categories,
  },
  {
    id: "products",
    name: "Products",
    description: "Products page, POS grid, expiry and weight managers. SKU is generated from title.",
    enums: RESOURCE_ENUMS.products,
  },
  {
    id: "inventory",
    name: "Inventory",
    description:
      "Inventory page and product opening/adjust qty via stock-movements. POST accepts movement_type stock_in, stock_out or adjustment; the other types are written by sales, refunds and transfers.",
    enums: RESOURCE_ENUMS.inventory,
  },
  {
    id: "staff",
    name: "Staff",
    description: "Staff page. List and create cashier/manager.",
    enums: RESOURCE_ENUMS.staff,
  },
  {
    id: "offers",
    name: "Offers",
    description: "Offers page plus live cards on the Point of Sale tab.",
    enums: RESOURCE_ENUMS.offers,
  },
  {
    id: "orders",
    name: "Orders",
    description: "POS checkout, history, void, refund, receipts.",
    enums: RESOURCE_ENUMS.orders,
  },
  {
    id: "reports",
    name: "Reports",
    description: "Reports breakdown and profit & loss pages.",
    enums: RESOURCE_ENUMS.reports,
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Suppliers page add / edit / deactivate.",
    enums: RESOURCE_ENUMS.suppliers,
  },
  {
    id: "audit",
    name: "Audit logs",
    description: "Audit page. Read-only.",
    enums: RESOURCE_ENUMS.audit,
  },
  {
    id: "data",
    name: "Delete data",
    description:
      "Super Admin. Wipe the whole database (except SequelizeMeta), wipe one module, delete one row, or bulk-delete by ids.",
    enums: RESOURCE_ENUMS.data,
  },
]

// Sample POS replies (shown under View Response).
const ORDER_TAIL = {
  is_order_discounted: false,
  order_discount_type: null,
  discount_amount: 0,
  payment_method: "cash",
  payment_status: "paid",
  payment_gst_amount: 0,
  fbr_invoice_enabled: false,
  fbr_tax_amount: 0,
  order_status: "completed",
}
const SAMPLE_CATALOG_ORDER = {
  id: 1,
  location: { id: 1, name: "Gulshan e Iqbal Block 13 D" },
  is_custom: false,
  staff: { id: 3, name: "Ameer Hamza", role: "cashier" },
  customer: null,
  batch: { id: 1, status: "open" },
  currency: "PKR",
  order_items: [
    {
      id: 1,
      product: { id: 1, title: "1 Litre Pepsi", sku: "1-LITRE-PEPSI", unit: "bottle" },
      qty: 1,
      unit_price: 100,
      discount_amount: 5,
      subtotal: 95,
      tax_amount: 10,
      total: 105,
    },
  ],
  subtotal: 105,
  ...ORDER_TAIL,
  total_amount: 105,
  amount_paid: 150,
  change_due: 45,
  cancel_reason: null,
  cancelled_by: null,
  placed_at: "2026-10-24T10:15:00.000Z",
  channel: "pos",
  is_pos_visible: true,
  is_web_visible: false,
}
// The POST group is laid out by these sections (in this order) instead of by tag.
export const postSections = [
  { id: "super-admin", name: "Super Admin Actions", tag: "plans", ids: ["plans-create", "admin-create-store", "admin-register-superadmin"] },
  { id: "authentication", name: "Authentication", tag: "auth", ids: ["auth-login", "auth-pin-verify"] },
  { id: "license", name: "License", tag: "license", ids: ["license-validate", "license-renew"] },
  { id: "locations", name: "Locations", tag: "locations", ids: ["location-create"] },
  { id: "user-sessions", name: "User Sessions", tag: "shifts", ids: ["staff-clock-in", "staff-clock-out"] },
  { id: "staff", name: "Staff", tag: "staff", ids: ["staff-bulk"] },
  { id: "batch-report", name: "Batch Report", tag: "shifts", ids: ["batch-open", "batch-close"] },
  { id: "categories", name: "Categories", tag: "categories", ids: ["cat-bulk"] },
  { id: "products", name: "Products", tag: "products", ids: ["prod-bulk"] },
  { id: "stock-inventory", name: "Stock Inventory", tag: "inventory", ids: ["movement-bulk", "transfer-bulk"] },
  { id: "offers", name: "Offers", tag: "offers", ids: ["offer-bulk"] },
  { id: "suppliers", name: "Suppliers", tag: "suppliers", ids: ["sup-bulk"] },
  { id: "orders", name: "Orders", tag: "orders", ids: ["order-bulk", "order-refund-complete-bulk", "order-refund-bulk"] },
]

// The GET group: these sections in this order, then every other GET under "Other".
export const getSections = [
  { id: "get-super-admin", name: "Super Admin Actions", tag: "plans", ids: ["plans-list"] },
  { id: "get-store", name: "Store & Locations", tag: "store", ids: ["store-me", "location-list", "currency-get"] },
  { id: "get-user-sessions", name: "User Session History", tag: "shifts", ids: ["staff-session-list"] },
  { id: "get-categories", name: "Categories", tag: "categories", ids: ["cat-list"] },
  { id: "get-products", name: "Products", tag: "products", ids: ["prod-list", "prod-expiry", "prod-weight-list"] },
  { id: "get-orders", name: "Orders", tag: "orders", ids: ["order-list-completed", "order-list-pending", "order-list-cancelled", "order-get"] },
  { id: "get-refunds", name: "Refunds", tag: "orders", ids: ["refund-list-complete", "refund-list-partial"] },
  { id: "get-stock", name: "Stock Inventory", tag: "inventory", ids: ["movement-list", "transfer-list"] },
  { id: "get-offers", name: "Offers", tag: "offers", ids: ["offer-list"] },
  { id: "get-suppliers", name: "Suppliers", tag: "suppliers", ids: ["sup-list"] },
  { id: "get-reporting", name: "Detailed Reporting", tag: "reports", ids: ["rep-all-locations", "rep-location", "rep-profit"] },
  { id: "get-batches", name: "Batch History", tag: "shifts", ids: ["batch-list", "batch-current"] },
  { id: "get-order-history", name: "Complete Order History", tag: "orders", ids: ["order-history"] },
  { id: "get-staff", name: "Staff", tag: "staff", ids: ["staff-list"] },
  { id: "get-tax", name: "Tax-rate", tag: "store", ids: ["tax-get"] },
  { id: "get-transactions", name: "Transactions", tag: "orders", ids: ["transaction-list"] },
  { id: "get-receipts", name: "Receipts", tag: "orders", ids: ["order-receipt", "refund-receipt"] },
]

const LOCATION_ROW = [
  ["name", "Gulshan e Iqbal Block 2"],
  ["address_line", "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi"],
  ["city", "Karachi"],
  ["phone", "03001234567"],
  ["postal_code", "75300", "optional"],
  ["is_active", true, "optional"],
  ["is_default", false, "optional"],
]

export const endpoints = [
  ep({
    id: "plans-create",
    tag: "plans",
    method: "POST",
    path: "/api/v1/plans",
    summary: "Plans",
    description:
      "Super Admin only. Upserts by code. code is any unique slug (not limited to package_1–3). type is monthly or yearly. features is a free-form string array.",
    auth: "superadmin",
    body: {
      code: "solo-pos",
      type: "monthly",
      name: "Solo",
      price_pkr: 2500,
      max_devices: 1,
      max_locations: 1,
      max_users: 5,
      reporting_level: "basic",
      import_export: false,
      staff_attendance: true,
      email_integration: false,
      whatsapp_integration: false,
      receipt_customization: false,
      barcode_scanning: true,
      batch_management: true,
      remote_access: false,
      features: [],
      is_active: true,
    },
  }),
  ep({
    id: "plans-list",
    tag: "plans",
    method: "GET",
    path: "/api/v1/plans",
    summary: "Plans",
    description:
      "Super Admin. Every active plan — its id is the plan_id for Store Register and Renew License.",
    auth: "superadmin",
  }),
  ep({
    id: "plans-patch",
    tag: "plans",
    method: "PATCH",
    path: "/api/v1/plans/:id",
    summary: "Update plan",
    description: "Super Admin only.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Solo",
      type: "yearly",
      price_pkr: 2500,
      max_devices: 1,
      max_locations: 1,
      features: [],
      is_active: true,
    },
  }),
  ep({
    id: "plans-delete",
    tag: "plans",
    method: "DELETE",
    path: "/api/v1/plans/:id",
    summary: "Delete plan",
    description: "Super Admin only. 409 if any store still uses this plan.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "admin-register-superadmin",
    tag: "auth",
    method: "POST",
    path: "/api/v1/admin/superadmins",
    summary: "Super admin",
    description:
      "Public only for the very first Super Admin (empty platform). After that it needs a Super Admin token, otherwise 403. Super Admin has no PIN and never signs in with one. Returns access_token + refresh_token.",
    auth: "public",
    body: {
      name: "Platform Super Admin",
      email: "superadmin@platform.local",
      password: "ChangeMeSuperAdmin1",
    },
    capture: {
      accessToken: "data.access_token",
      refreshToken: "data.refresh_token",
    },
  }),
  ep({
    id: "admin-create-store",
    tag: "auth",
    method: "POST",
    path: "/api/v1/admin/stores",
    summary: "Store Register",
    description:
      "Super Admin. Creates the store (slug from name) with its first location, the store admin, billing and the license — status trial (3-day trial license, no billing) or active (purchased, license pending until a till activates it). The store's currency is created as PKR (change it with PUT /currency). Tax settings (same fields as PUT /tax-rates) are saved with the store, so orders are taxed from the first sale: charge_tax_on_sales defaults to on, sales tax 18%, payment-method GST cash 16 / card 5 / jazzcash 5 / easypaisa 5 — send only what differs; with logo / favicon files (multipart) send rates as a JSON string. No manager here: the store admin adds managers later with POST /staff (role manager, location_id). Response { store, location, admin, license, billing, plan }.",
    auth: "superadmin",
    body: {
      status: "trial",
      plan_id: "8637587a-1656-451d-a82f-c796bd4e2ac2",
      name: "Acadex",
      legal_name: "Acadex Pvt Ltd",
      owner_name: "Zayan Ahmed",
      business_type: "grocery",
      address: "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi",
      city: "Karachi",
      contact_email: "info@acadex.co",
      contact_phone: "021635645614",
      custom_domain: "www.acadex.com",
      location_name: "Gulshan e Iqbal Block 13 D",
      location_address: "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi",
      location_city: "Karachi",
      location_phone: "03162196345",
      admin_name: "Zayan Ahmed",
      admin_email: "zayan@acadex.co",
      admin_phone: "03162196345",
      admin_password: "zayanahmed",
      admin_pin: "1111",
      pos_enabled: true,
      web_enabled: true,
      billing_status: "paid",
      amount: 0,
      method_note: "Trial Version",
      ntn: "1234567-8",
      strn: "3277876123456",
      charge_tax_on_sales: true,
      fbr_invoice_enabled: false,
      sales_tax_enabled: true,
      sales_tax_rate: 18,
      payment_tax_enabled: true,
      rates: [
        { payment_method: "cash", gst_percent: 16 },
        { payment_method: "card", gst_percent: 5 },
        { payment_method: "jazzcash", gst_percent: 5 },
        { payment_method: "easypaisa", gst_percent: 5 },
      ],
    },
    files: [
      { name: "logo", label: "Logo" },
      { name: "favicon", label: "Favicon" },
    ],
    capture: { licenseKey: "data.license.license_key" },
  }),
  ep({
    id: "auth-login",
    tag: "auth",
    method: "POST",
    path: "/api/v1/auth/login",
    summary: "Login",
    description:
      "Store admin or manager only — a cashier never signs in, the till verifies them with POST /auth/pin/verify (cashier email login returns 403). channel=pos returns { token, user, store, locations | location, users }: user { id (user number), name, email, pin, role, phone, status (store trial | active), is_active }; store { id, name, status (trial | active), trial_ended_at }; a store admin gets locations[] ({ id, name, address }) and users[] (every manager and cashier, with locationId); a manager gets location{} and users[] (the cashiers of that location). The token gives the store and location (and the store admin picks a location with location_id in the body). channel=web returns the dashboard's access_token + refresh_token.",
    auth: "public",
    body: {
      email: "zayan@acadex.co",
      password: "ChangeMe123",
    },
    capture: {
      accessToken: ["data.token", "data.access_token"],
      refreshToken: "data.refresh_token",
      role: "data.user.role",
    },
  }),
  ep({
    id: "auth-pin-verify",
    tag: "auth",
    method: "POST",
    path: "/api/v1/auth/pin/verify",
    summary: "PIN Verification",
    description:
      "On a signed-in till (store admin / manager token). Checks the PIN of a cashier, manager or the store admin at this location and returns { id, name, email, role, pin, phone, status, is_active } — no token. The POS then sends that id as staff_id (or id) on the cashier's clock in, batch, orders, refunds and stock.",
    body: { pin: "3333" },
  }),
  ep({
    id: "auth-patch-me",
    tag: "auth",
    method: "PATCH",
    path: "/api/v1/auth/me",
    summary: "Update auth me",
    description: "POS Settings → My account. Name and phone; change password (with current_password) or POS PIN.",
    body: { name: "Ahmed Malik", phone: "03000000000" },
  }),

  ep({
    id: "license-renew",
    tag: "license",
    method: "POST",
    path: "/api/v1/admin/licenses/:id/renew",
    summary: "Renew License",
    description:
      "Super Admin. Renews the license for 1 month on the given plan; a trial store's renewal is the purchase — license and store go from trial to active and keep all their data. :id is the license UUID. Response { storeId, license_key, status, starts_at, expires_at, planId, renew_at }.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      plan_id: 1,
      amount: 2500,
      billing_status: "paid",
      method_note: "cash",
      note: "",
    },
  }),
  ep({
    id: "license-validate",
    tag: "license",
    method: "POST",
    path: "/api/v1/licenses/validate",
    summary: "License Key Validation",
    description:
      "POS Activate page. Rules: invalid / expired / revoked key -> success false, data.valid false. Device already registered on a valid key -> valid true. New device -> registered only if the store plan still has a free device slot (active devices across the store), otherwise 409 + valid false. A device the store deactivated gets 403. A new device is registered with location_id = null; the store admin assigns its branch later with PATCH /pos-devices/:id (an already registered device keeps its location). Response data — license_key, device_id (echoes back the device_uid you sent, or null if none was sent), status, starts_at, expires_at, already_registered, suspended_at, suspended_reason, valid, plan{} (id, code, name, max_devices, max_locations, features — id is the plan number, no separate top-level plan_number) — is the only POS-facing response carrying the license_key and the plan; POST /auth/login dropped both to keep the login payload small.",
    auth: "public",
    body: {
      license_key: "LIC-0931-3965-76DF-21E2",
      device_uid: 1,
    },
    capture: { licenseKey: "data.license_key" },
  }),

  ep({
    id: "device-heartbeat",
    tag: "devices",
    method: "PATCH",
    path: "/api/v1/pos-devices/:id/heartbeat",
    summary: "Device heartbeat",
    description: "POS shell every 60s after login.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {},
  }),

  ep({
    id: "location-create",
    tag: "locations",
    method: "POST",
    path: "/api/v1/locations",
    summary: "Create Location",
    description:
      "Store admin only. Adds a branch to the store (the plan's max_locations is checked — a full plan returns 409). Required: name, address_line, city. With Manager also creates the branch's manager (manager_name, manager_email, manager_password, manager_pin — all four together); otherwise add managers later with Bulk Create Staff (locationId). The new location gets the next location number (2, 3...). On channel=pos the response is { success, message (\"Location Successfully Created\"), data: { id (location number), name, address_line, city, phone, ... } } — no UUIDs.",
    bodyBuilder: {
      bulk: false,
      variantsLabel: "Location",
      variants: [
        { id: "plain", label: "Location Only", rows: [LOCATION_ROW] },
        {
          id: "manager",
          label: "With Manager",
          rows: [
            [
              ...LOCATION_ROW,
              ["manager_name", "Bilal Raza"],
              ["manager_email", "bilal@acadex.co"],
              ["manager_password", "bilalraza"],
              ["manager_pin", "5555"],
              ["manager_phone", "03111234567", "optional"],
            ],
          ],
        },
      ],
      toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
    },
  }),
  ep({
    id: "location-list",
    tag: "locations",
    method: "GET",
    path: "/api/v1/locations",
    summary: "Locations",
    description:
      "Store admin: every branch of the store. Manager: only their own location. Each row includes location_number, is_default, is_active and its manager.",
  }),
  ep({
    id: "location-patch",
    tag: "locations",
    method: "PATCH",
    path: "/api/v1/locations/:id",
    summary: "Update location",
    description:
      "Rename, change address / phone, set default or active, and update the branch manager (manager_* fields). Send at least one field.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Gulberg Branch",
      address_line: "45 Main Boulevard, Gulberg",
      city: "Lahore",
      postal_code: "54660",
      phone: "03005555555",
      is_active: true,
      is_default: false,
      manager_name: "Branch Manager",
      manager_email: "gulberg@demo-grocery.local",
      manager_password: "",
      manager_pin: "4444",
      manager_phone: "03005555556",
      manager_is_active: true,
    },
  }),

  ep({
    id: "store-me",
    tag: "store",
    method: "GET",
    path: "/api/v1/stores/me",
    summary: "Store Profile",
    description: "Settings, Tax manager, POS cart (sales_tax_rate, payment_tax_enabled), history.",
  }),
  ep({
    id: "store-patch-me",
    tag: "store",
    method: "PATCH",
    path: "/api/v1/stores/me",
    summary: "Update store",
    description:
      "Settings and Tax manager. Optional logo and favicon files. Suspension, go-live, slug, custom domain and account manager are Super Admin only (PATCH /admin/stores/:id) and are ignored here.",
    files: [
      { name: "logo", label: "Logo" },
      { name: "favicon", label: "Favicon" },
    ],
    body: {
      name: "Fatima Stationers",
      legal_name: "Fatima Stationers Pvt Ltd",
      owner_name: "Fatima Khan",
      business_type: "retail",
      address: "Main Market, Lahore",
      city: "Lahore",
      contact_email: "hello@fatima.local",
      contact_phone: "03001234567",
      logo_url: "",
      favicon_url: "",
      timezone: "Asia/Karachi",
      ntn: "1234567-8",
      strn: "3277876123456",
      fbr_invoice_enabled: false,
      charge_tax_on_sales: true,
      sales_tax_enabled: true,
      sales_tax_rate: 18,
      payment_tax_enabled: true,
      expiry_warning_days: 30,
      expiry_critical_days: 7,
      receipt_footer: "Thank you for shopping",
      pos_enabled: true,
      web_enabled: true,
      default_location_id: UUID,
    },
  }),
  ep({
    id: "tax-get",
    tag: "store",
    method: "GET",
    path: "/api/v1/tax-rates",
    summary: "Tax-rate",
    description:
      "Tax manager load: charge_tax_on_sales, sales_tax_enabled + sales_tax_rate, payment_tax_enabled + rates (payment-method GST), ntn, strn, fbr_invoice_enabled.",
  }),
  ep({
    id: "tax-put",
    tag: "store",
    method: "PUT",
    path: "/api/v1/tax-rates",
    summary: "Save GST rates",
    description:
      "POS Tax manager. Three taxes, each on the line amount after discounts (not on top of each other): sales tax — one store-wide % (sales_tax_rate, default 18%) that the owner switches on / off with sales_tax_enabled (off when each product carries its own sales tax); product taxes — a list on each product (taxes[]); category tax — one per category. Payment-method GST (rates) applies on top of the bill only while payment_tax_enabled is on (defaults: cash 16%, card 5%, JazzCash 5%, EasyPaisa 5%). charge_tax_on_sales is the master switch for all tax. Send only what changes; rates is optional.",
    body: {
      ntn: "1234567-8",
      strn: "3277876123456",
      charge_tax_on_sales: true,
      fbr_invoice_enabled: false,
      sales_tax_enabled: true,
      sales_tax_rate: 18,
      payment_tax_enabled: true,
      rates: [
        { payment_method: "cash", gst_percent: 16 },
        { payment_method: "card", gst_percent: 5 },
        { payment_method: "jazzcash", gst_percent: 5 },
        { payment_method: "easypaisa", gst_percent: 5 },
      ],
    },
  }),
  ep({
    id: "currency-get",
    tag: "store",
    method: "GET",
    path: "/api/v1/currency",
    summary: "Currency",
    description: "The store's currency { code, name, symbol, decimal_places, symbol_position }. Every store gets PKR (Pakistani Rupee, Rs, 2 decimals, symbol before) at registration; a store registered before the currency table shows these defaults until PUT /currency saves its row.",
  }),
  ep({
    id: "currency-put",
    tag: "store",
    method: "PUT",
    path: "/api/v1/currency",
    summary: "Update currency",
    description: "Store admin or manager. Send only what changes (at least one field). code is the 3-letter ISO code (e.g. PKR, USD) and becomes the currency on new orders and receipts. A store without a currency row yet gets it created here. Response: the saved { code, name, symbol, decimal_places, symbol_position }.",
    body: {
      code: "PKR",
      name: "Pakistani Rupee",
      symbol: "Rs",
      decimal_places: 2,
      symbol_position: "before",
    },
  }),

  ep({
    id: "staff-session-list",
    tag: "shifts",
    method: "GET",
    path: "/api/v1/staff-sessions",
    summary: "User Session History",
    description:
      "Staff attendance (clock in / clock out), newest first. Filters: staffId (user number), status clock_in | clock_out, from / to (clock-in time). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Each row { id, staff, location, status, opening_at, closing_at }. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (clock-in time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "staffId", default: "", required: false },
      { name: "status", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "batch-current",
    tag: "shifts",
    method: "GET",
    path: "/api/v1/batches/current",
    summary: "Current Open Batch",
    description:
      "The open batch of a staff member at the location — staffId (user number) or, left out, the signed-in user; a store admin may name location_id. Same shape as a Batch History row { id, staff, location, status, opening_amount, opening_at, cash_sales, …, closing_at }; data is null when no batch is open. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "staffId", default: "3", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "batch-list",
    tag: "shifts",
    method: "GET",
    path: "/api/v1/batches",
    summary: "Batch History",
    description:
      "Cash drawer batches, newest first. Filters: staffId, status open | closed, from / to (opening time). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Each row { id, staff, location, status, opening_amount, opening_at, cash_sales, card_sales, jazzcash_sales, easypaisa_sales, total_sales, expected_cash, total_cash (counted at closing), cash_variance, closing_at }. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (opening time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "staffId", default: "", required: false },
      { name: "status", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "staff-clock-in",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/staff-sessions/clock-in",
    summary: "User Session Clock In",
    description: "Attendance. staffId = the staff member (user number, from PIN verification). Response { id, staff, status: clock_in, opening_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: { location_id: 1, staffId: 3, clocked_at: "2026-10-24T09:00:00.000Z" },
    adminOnly: ["location_id"],
  }),
  ep({
    id: "staff-clock-out",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/staff-sessions/clock-out",
    summary: "User Session Clock Out",
    description: "Ends the staff member's open attendance session. Response { id, staff, status: clock_out, closing_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: { location_id: 1, staffId: 3, clocked_at: "2026-10-24T17:00:00.000Z" },
    adminOnly: ["location_id"],
  }),
  ep({
    id: "batch-open",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/batches/open",
    summary: "Batch Opening",
    description: "Opens the cash drawer for a staff member; sales are booked into their open batch. Response { id, staff, opening_amount, opening_at } (id = batch number, used as batch_id / batchId on orders). Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: { location_id: 1, staffId: 3, opening_amount: 5000, opening_at: "2026-10-24T09:00:00.000Z" },
    adminOnly: ["location_id"],
  }),
  ep({
    id: "batch-close",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/batches/close",
    summary: "Batch Closing",
    description: "Closes the staff member's open batch with the counted cash. Response { id, staff, total_cash, closing_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: { location_id: 1, staffId: 3, total_cash: 10000, closing_at: "2026-10-24T17:00:00.000Z" },
    adminOnly: ["location_id"],
  }),

  ep({
    id: "cat-list",
    tag: "categories",
    method: "GET",
    path: "/api/v1/categories",
    summary: "Categories",
    description:
      "Every category of the store, in the same shape as Bulk Categories: { id, name, slug, parent, image_url, description, tax_type, tax_value, tax_name, discount_type, discount_value, discount_name, is_active }. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
    ],
  }),
  ep({
    id: "cat-bulk",
    tag: "categories",
    method: "POST",
    path: "/api/v1/categories/bulk",
    summary: "Bulk Categories",
    description: "POS sync: { items: [ ...categories ] } (or a raw array). Only name is required. Category tax (tax_name, tax_type, tax_value) and discount apply whenever their type + value are sent — the Has Category Tax / Has Category Discount checkboxes only add or remove them in this example. Show Optional Fields adds the rarely-needed fields. A repeated name gets a -2, -3... slug instead of an error. On channel=pos the response is { success, message (\"Categories Successfully Created\"), data: [ { id, name }, ... ] } — one per created category, in order; id is the short category_number. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: {
      bulk: true,
      variants: [
        {
          id: "default",
          label: null,
          rows: [categoryRow("Beverages", 5, 5), categoryRow("Soap", 10, 0), categoryRow("Rice & Daal", 0, 10)],
        },
      ],
      toggles: CATEGORY_TOGGLES,
    },
  }),
  ep({
    id: "cat-patch",
    tag: "categories",
    method: "PATCH",
    path: "/api/v1/categories/:id",
    summary: "Update category",
    pathParams: [{ name: "id", default: UUID, required: true }],
    files: [{ name: "icon", label: "Category icon" }],
    body: {
      name: "Drinks",
      tax_type: "percentage",
      tax_value: 17,
      discount_type: null,
      discount_value: null,
      is_active: true,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "cat-delete",
    tag: "categories",
    method: "DELETE",
    path: "/api/v1/categories/:id",
    summary: "Delete category",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "prod-list",
    tag: "products",
    method: "GET",
    path: "/api/v1/products",
    summary: "Products",
    description:
      "Products in the same shape as Bulk Products, plus qty (stock at the location read, or every location for a store admin) and stocks [{ locationId, qty, expiry_date }]. Filters: q (title, SKU or barcode), categoryId (category number). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "q", default: "", required: false },
      { name: "categoryId", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "prod-bulk",
    tag: "products",
    method: "POST",
    path: "/api/v1/products/bulk",
    summary: "Bulk Products",
    description:
      "POS sync: { items: [ ...products ] }. The example sends the three kinds: a Loose Item (cost + price), a Loose + Pack product (is_pack_product, pack_size, pack_cost, pack_price, sell_loose — per-unit cost / price = pack price ÷ pack_size) and a Loose + Pack + Weight product (the same plus is_weight_based, sold by the kg). Required: title, barcode (unique per store), category_id (number or UUID) and the prices. taxes [{ name, type: percentage | fixed (per unit), value }] — as many as apply; at checkout the category tax and the store's sales tax (if on) are added, each on the discounted line amount. total_price / total_price_each_unit / total_pack_price are calculated by the server. On channel=pos the response returns every product field with short numbers. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: productBuilder(),
    computed: productTotals,
  }),
  ep({
    id: "prod-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/:id",
    summary: "Update product",
    description: "Products page edit. Optional product image file. Expiry is set on product-stocks (per location), not on the product — there is no expiry_date field here at all. Prices use the same names as create (cost / price for a Loose Item; pack_cost, pack_price for a Pack Product — its per-unit prices are recalculated from the pack whenever it changes); clearing is_pack_product (setting it false) also clears pack_size and the pack prices. total_price / total_price_each_unit / total_pack_price are recomputed by the server.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    files: [{ name: "image", label: "Product image" }],
    body: {
      title: "1 Litre Pepsi",
      category_id: UUID,
      price: 90,
      taxes: [{ name: "GST", type: "percentage", value: 18 }],
      is_pack_product: false,
      pack_size: null,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "prod-expiry",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/expiry",
    summary: "Expiry Manager",
    description:
      "Store admin / manager. Stock with an expiry date, soonest first: { productId, title, sku, barcode, unit, locationId, qty, expiry_date, expiry_status (expired | critical | warning | ok, from the store's expiry_critical_days / expiry_warning_days) }. A store admin sees every location (or one with location_id); a manager only their own. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (expiry date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "prod-weight-list",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/weight",
    summary: "Weight Manager",
    description:
      "Store admin / manager. Products sold by weight (is_weight_based), in the Products shape. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
    ],
  }),
  ep({
    id: "stock-put",
    tag: "inventory",
    method: "PUT",
    path: "/api/v1/product-stocks/:productId",
    summary: "Set stock / expiry",
    description:
      "Set qty and per-location expiry_date. Location comes from JWT (or store default). Store admin may send location_id.",
    pathParams: [{ name: "productId", default: UUID, required: true }],
    body: {
      qty: 50,
      expiry_date: "2026-12-31",
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "prod-weight-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/:id/weight",
    summary: "Toggle weight flag",
    description: "Weight page.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { is_weight_based: true },
  }),

  ep({
    id: "movement-list",
    tag: "inventory",
    method: "GET",
    path: "/api/v1/stock-movements",
    summary: "Stock Movements",
    description:
      "Stock movements, newest first, in the Bulk Stock Movements shape { id, location, product, supplier, staff, order, movement_type, reason, reason_note, qty, unit_sold }. Filters: productId, movement_type, reason, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (movement time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "productId", default: "", required: false },
      { name: "movement_type", default: "", required: false },
      { name: "reason", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "transfer-list",
    tag: "inventory",
    method: "GET",
    path: "/api/v1/stock-transfers",
    summary: "Stock Transfer",
    description:
      "Stock transfers sent from or arriving at the location, newest first: { id, from_location, to_location, product, qty, status (on_the_way | completed | cancelled), note, staff }. Filters: status, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (transfer time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "status", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "movement-bulk",
    tag: "inventory",
    method: "POST",
    path: "/api/v1/stock-movements/bulk",
    summary: "Bulk Stock Movements",
    description: "POS sync: { locationId, items: [ ...movements ] }. locationId is sent once, before items[] (location number, e.g. 1, or UUID) — any role: a store admin may name any location, a manager / cashier only their own (another location is refused with 403). product_id is the product number (UUID also works). qty is the change: positive for stock_in, negative for stock_out, either sign for adjustment. On channel=pos the response is { success, message (\"Stock Successfully Created\"), data: [ ... ] } one per created movement, in order: { id, location, product, supplier, staff, order, movement_type, reason, reason_note, qty, qty_after, unit_sold, created_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: movementBuilder(),
  }),
  ep({
    id: "transfer-bulk",
    tag: "inventory",
    method: "POST",
    path: "/api/v1/stock-transfers/bulk",
    summary: "Bulk Stock Transfer",
    description: "Store admin. { items: [ ...transfers ] } — each sends stock of one product from one location to another (location / product numbers or UUIDs) and stays on_the_way until the destination completes it (POST /stock-transfers/:id/complete). staff_id may be sent once next to items[] or on each transfer. On channel=pos the response data is [ { id, from_location, to_location, product, qty, status, note, staff }, ... ], in order. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      items: [
        { from_location_id: 1, to_location_id: 2, product_id: 1, qty: 20, note: "Weekly refill", staff_id: 3 },
        { from_location_id: 1, to_location_id: 2, product_id: 2, qty: 12, note: "", staff_id: 3 },
        { from_location_id: 1, to_location_id: 2, product_id: 1, qty: 10, note: "Weekend stock", staff_id: 3 },
      ],
    },
  }),


  ep({
    id: "staff-list",
    tag: "staff",
    method: "GET",
    path: "/api/v1/staff",
    summary: "Staff",
    description:
      "Managers and cashiers: { id, location, name, email, pin, role, phone, status (clock_in | clock_out right now), is_active }. Filter: role manager | cashier. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "role", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "staff-bulk",
    tag: "staff",
    method: "POST",
    path: "/api/v1/staff/bulk",
    summary: "Bulk Create Staff",
    description: "{ items: [ ...staff ] }. Every staff item carries its own locationId (location number, e.g. 1, or UUID) — whether a store admin or a manager is signed in. A store admin may put each one at any location; a manager can only use their own location (another one is refused). The PIN must be unique among the users of that location (another location or store may reuse it). On channel=pos the response is { success, message, data: [ { id, location, name, email, pin, role, phone, is_active }, ... ] } — the whole staff member (same shape as login users[] and GET Staff), one per created user, in order; id is the short user_number. The message is \"Cashiers Successfully Created\" / \"Managers Successfully Created\", or \"Staff Successfully Created\" when the roles are mixed. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      items: [
        { locationId: 1, name: "Ahmed Malik", email: "ahmed@acadex.co", password: "ahmedmalik", pin: "2222", role: "manager" },
        { locationId: 1, name: "Ameer Hamza", email: "ameer@acadex.co", password: "ameerhamza", pin: "3333", role: "cashier" },
        { locationId: 1, name: "Yasir Ali Khan", email: "yasir@acadex.co", password: "yasiralikhan", pin: "4444", role: "cashier" },
      ],
    },
  }),

  ep({
    id: "offer-list",
    tag: "offers",
    method: "GET",
    path: "/api/v1/offers",
    summary: "Offers",
    description:
      "Offers running at the location (store admin: every offer, or one location with location_id): { id, type, apply_to, product | category, discount_type, discount_value, start_at, end_at, min_qty, buy_qty, get_qty, staff, name, is_active }. Filters: type, pos=1 (only offers live right now). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "type", default: "", required: false },
      { name: "pos", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "offer-bulk",
    tag: "offers",
    method: "POST",
    path: "/api/v1/offers/bulk",
    summary: "Bulk Offer Creation",
    description: "{ items: [ ...offers ] }. Each flat item creates the offer and its target: apply_to category needs category_id, apply_to product needs product_id (number or UUID). type: promotional | flash_sale | bulk_discount | bogo — the example sends a category promotion, a product bulk discount (min_qty) and a BOGO (buy_qty + get_qty, free_product_id). Where it runs is set on each offer, and only a store admin sends it: location_scope all (every location) or selected + location_ids (one or several location numbers) — the example mixes all, [1] and [1, 2]. A manager or cashier sends no location; their offers are for their token's location. On channel=pos the response is { success, message (\"Offers Successfully Created\"), data: [ { id, type, name, category | product }, ... ] }, in order. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: offerBuilder(),
    adminOnly: ["location_scope", "location_ids"],
  }),
  ep({
    id: "offer-targets-put",
    tag: "offers",
    method: "PUT",
    path: "/api/v1/offers/:id/targets",
    summary: "Set offer targets",
    description: "Replaces all targets of an offer (create already adds the first one). product_id / category_id / free_product_id take the short number (e.g. 1) or the UUID.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      targets: [{ category_id: 1, product_id: null, free_product_id: null, promo_price: null }],
    },
  }),
  ep({
    id: "offer-patch",
    tag: "offers",
    method: "PATCH",
    path: "/api/v1/offers/:id",
    summary: "Pause / activate offer",
    description: "Offers page toggle is_active.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { is_active: false },
  }),
  ep({
    id: "offer-delete",
    tag: "offers",
    method: "DELETE",
    path: "/api/v1/offers/:id",
    summary: "Deactivate offer",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "order-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/bulk",
    summary: "Bulk Order Creation",
    description:
      "POS sales: { locationId, items: [ ...orders ] } — works on every plan. locationId is sent once, before items[] (location number, e.g. 1, or UUID) — any role: a store admin may name any location, a manager / cashier only their own (another location is refused with 403). The example sends five sales: three Catalog Sales (items [{ productId, qty }]) and two Custom Sales (is_custom true, items [{ category, title, price, qty }]), paid in cash or split (card / JazzCash / EasyPaisa + cash). Payments: each method pays its own share of the bill (bill_share) plus its own payment tax on that share — amount = bill_share × (1 + rate%) (e.g. cash 16%: 500 → 580; EasyPaisa 5%: 106.55 → 111.88); paid = what the customer handed over, and only cash may be more than its amount (the rest is change_due). A card / wallet row may send just amount (its share is amount ÷ (1 + rate)); the first cash row without bill_share covers the rest of the bill. amount_paid may also be sent per method: [{ method, paid }]. channel defaults to pos (a web order sends channel web). Offline: the till keeps its sales while there is no network and sends them all here once it is back; placed_at (optional) keeps each sale's real time. staff_id = the cashier (PIN), batch_id = their open batch. Flow: Order Creation → Receipt → Transaction — the POS sends only the order; the server creates its receipt and its transaction (one per payment in payments[], numbered 1, 2, 3... per store; a payment's transaction_id is kept as its reference) together with it, so there is no receipt or transaction request. Response data: one order per created sale, in order (see View Response): subtotal includes the product & category tax; total_amount = subtotal + payment GST + FBR fee − order discount. An order that fails is listed in failed [{ index, message, status }]; when every order fails the reply is success false with the first error. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: orderBuilder(),
    responses: [
      {
        label: "One order failed (200)",
        body: { success: true, message: "Order Created", data: [SAMPLE_CATALOG_ORDER], failed: [{ index: 1, message: "Product 99 not found", status: 404 }] },
      },
      {
        label: "Every order failed",
        body: { success: false, message: "Product 99 not found", data: [], failed: [{ index: 0, message: "Product 99 not found", status: 404 }] },
      },
    ],
  }),
  ep({
    id: "order-list-completed",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders",
    summary: "Orders Completed",
    description:
      "Completed sales (status=completed), newest first. Each order in the Bulk Order Creation shape { id, location, is_custom, staff, customer, batch, currency, order_items, subtotal, …, order_status, total_amount, amount_paid, change_due, placed_at, channel }. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "status", default: "completed", required: false },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "is_custom", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "order-list-pending",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders",
    summary: "Orders Pending",
    description:
      "Pending sales — not paid yet (status=pending). Each order in the Bulk Order Creation shape { id, location, is_custom, staff, customer, batch, currency, order_items, subtotal, …, order_status, total_amount, amount_paid, change_due, placed_at, channel }. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "status", default: "pending", required: false },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "is_custom", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "order-list-cancelled",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders",
    summary: "Orders Cancelled",
    description:
      "Cancelled and voided sales (status=cancelled). Each order in the Bulk Order Creation shape { id, location, is_custom, staff, customer, batch, currency, order_items, subtotal, …, order_status, total_amount, amount_paid, change_due, placed_at, channel }. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "status", default: "cancelled", required: false },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "is_custom", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "order-history",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders",
    summary: "Complete Order History",
    description:
      "Every order whatever its status (status=all; also completed | pending | cancelled | refunded). Each order in the Bulk Order Creation shape { id, location, is_custom, staff, customer, batch, currency, order_items, subtotal, …, order_status, total_amount, amount_paid, change_due, placed_at, channel }. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "status", default: "all", required: false },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "is_custom", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "order-get",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id",
    summary: "Order Detail",
    description:
      "One order — :id is the order number (e.g. 1) or UUID — in the Bulk Order Creation shape { id, location, is_custom, staff, customer, batch, currency, order_items, subtotal, …, total_amount, amount_paid, change_due, placed_at }. A manager / cashier only sees orders of their own location. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "order-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id/receipt",
    summary: "Receipt by Order Id",
    description:
      "The sale receipt of an order — :id is the order number (e.g. 1) or UUID. Created automatically with the order. { id, location, staff, order, transaction { id, method }, subTotal, discount_amount, tax_breakdown { payment_gst, fbr_fee }, tax_amount, total, issued_at, currency }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "refund-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds/:refundId/receipt",
    summary: "Receipt by Refund Id",
    description:
      "The receipt of a refund — :refundId is the refund number (the id in the refund replies) or UUID. Created automatically with the refund. { id, location, staff, order, refundId, refund_type, currency, reason, subTotal, tax_amount, total, issued_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    pathParams: [{ name: "refundId", default: "1", required: true }],
  }),
  ep({
    id: "transaction-list",
    tag: "orders",
    method: "GET",
    path: "/api/v1/transactions",
    summary: "Transactions",
    description:
      "The orders' transactions — one per payment, created with the order (id = the transaction number 1, 2, 3...; reference = the card / wallet reference the till sent, if any): { id, reference, order, location, method, amount, tax_amount, currency, status, paid_at }. Filters: orderId, method, status, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (payment time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "orderId", default: "", required: false },
      { name: "method", default: "", required: false },
      { name: "status", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "order-refund-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/refunds/bulk",
    summary: "Bulk Order Items Refund",
    description:
      "POS sync: { locationId, items: [...] }. locationId is sent once, before items[] (location number, e.g. 1, or UUID) — any role: a store admin may name any location, a manager / cashier only their own (another location is refused with 403). Every order refunded must be at that location (else 'Order not found at this location'). Refunds some items of an order: each entry needs order_id, order_item_id (the line's number in that order), qty and reason. Response data: one refund per entry, in order, in the same shape as a complete refund — { id, location, staff, order, receiptId, currency, reason, amount, tax, total, payments }. payments[] says how the refund is paid back: the same way the sale was paid, each method getting its own part back with the payment tax it was charged — { method, bill_share, payment_tax_percent, payment_tax_amount, amount }. E.g. a sale paid card 600 + cash 937.25 for 12 units gives back card 50 + cash 78.10 per unit; method credit means it was taken off the customer's udhaar. Only the cash part leaves the cash drawer. Refunding unit by unit returns exactly what each method paid (any paisa from rounding comes back on a later unit). Failed entries are listed in failed[]; when all fail the reply is success false with the first error. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      locationId: 1,
      items: [
        { order_id: 1, order_item_id: 1, qty: 1, reason: "Customer return", staff_id: 3 },
        { order_id: 1, order_item_id: 2, qty: 1, reason: "Damaged item", staff_id: 3 },
      ],
    },
  }),
  ep({
    id: "order-refund-complete-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/refunds/complete/bulk",
    summary: "Bulk Order Refund",
    description:
      "POS sync: { locationId, items: [...] }. locationId is sent once, before items[] (location number, e.g. 1, or UUID) — any role: a store admin may name any location, a manager / cashier only their own (another location is refused with 403). Every order refunded must be at that location (else 'Order not found at this location'). Refunds whole orders: the remaining qty on every line of each order. Response data: one refund per order, in order — { id, location, staff (user number), order, receiptId, currency, reason, amount (before tax), tax, total, payments }. payments[] says how the refund is paid back: the same way the sale was paid, each method getting its own part back with the payment tax it was charged — { method, bill_share, payment_tax_percent, payment_tax_amount, amount }. E.g. a sale paid card 600 + cash 937.25 for 12 units gives back card 50 + cash 78.10 per unit; method credit means it was taken off the customer's udhaar. Only the cash part leaves the cash drawer. Refunding unit by unit returns exactly what each method paid (any paisa from rounding comes back on a later unit). Failed orders are listed in failed[]; when all fail the reply is success false with the first error. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      locationId: 1,
      items: [
        { order_id: 2, reason: "Full return", staff_id: 3 },
        { order_id: 3, reason: "Customer changed mind", staff_id: 3 },
      ],
    },
  }),
  ep({
    id: "refund-list-complete",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds",
    summary: "Refunds Complete Orders",
    description:
      "Whole orders refunded with Bulk Order Refund (type=complete) — one entry per order, its lines added up. Each refund { id, location, staff, order, receiptId, currency, reason, amount (before tax), tax, total }. Filters: orderId, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (refund time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "type", default: "complete", required: false },
      { name: "orderId", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "refund-list-partial",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds",
    summary: "Refunds Partial Order",
    description:
      "Item refunds made with Bulk Order Items Refund (type=partial) — one entry per refunded item. Each refund { id, location, staff, order, receiptId, currency, reason, amount (before tax), tax, total }. Filters: orderId, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (refund time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "type", default: "partial", required: false },
      { name: "orderId", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),

  ep({
    id: "rep-all-locations",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/all-locations",
    summary: "All Locations Report",
    description:
      "Store admin only. Every location of the store together, plus by_location (per location: orders, gross_sales, discounts, net_sales, tax, refunds, total_sales, percent). Sections as in Detailed Reporting: sales_summary, by_product, by_category, payments, z_reports, inventory, stock_movement, refunded_orders, cancelled_orders, by_cashier, tax_breakdown (Sales Tax, Product / Category Level Tax, Payment Method Tax). The reply starts with period, locationId, from, to only. locationId is null. Filters: period daily | weekly | monthly | yearly, from, to.",
    query: [
      { name: "period", default: "daily", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
    ],
  }),
  ep({
    id: "rep-location",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/location",
    summary: "Location Report",
    description:
      "One location: locationId = the location number (e.g. 1) or UUID. A store admin picks any location; a manager / cashier gets their own (leave locationId out), another location is refused (403). Sections as in Detailed Reporting: sales_summary, by_product, by_category, payments, z_reports, inventory, stock_movement, refunded_orders, cancelled_orders, by_cashier, tax_breakdown (Sales Tax, Product / Category Level Tax, Payment Method Tax). The reply starts with period, locationId, from, to only. Filters: period daily | weekly | monthly | yearly, from, to.",
    query: [
      { name: "period", default: "daily", required: false },
      { name: "locationId", default: "1", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
    ],
  }),
  ep({
    id: "rep-profit",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/profit",
    summary: "Profit & Loss",
    description:
      "Profit & loss. Totals include sales_collected, cost, discounts, refunds, tax_collection (product, category, default store, payment GST, FBR), and gross_profit.",
    query: [
      { name: "period", default: "monthly", required: false },
      { name: "channel", default: "pos", required: false },
    ],
  }),

  ep({
    id: "sup-list",
    tag: "suppliers",
    method: "GET",
    path: "/api/v1/suppliers",
    summary: "Suppliers",
    description:
      "Suppliers in the Bulk Suppliers shape { id, locations, name, email, phone, payment_terms, address, is_active } — location_ids [] means every location. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
  }),
  ep({
    id: "sup-bulk",
    tag: "suppliers",
    method: "POST",
    path: "/api/v1/suppliers/bulk",
    summary: "Bulk Suppliers",
    description: "{ items: [ ...suppliers ] } — name, phone, email, address, payment_terms. Only a store admin chooses the locations per supplier: location_scope all = every branch; selected + location_ids = one or several branches (location numbers, UUIDs also work). A manager or cashier sends no location — their suppliers go to their token's location. On channel=pos the response is { success, message (\"Suppliers Successfully Created\"), data: [ { id }, ... ] } — one supplier_number per created supplier, in order. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      items: [
        { name: "Nestle Distributor", phone: "03006666666", email: "sales@nestle-dist.local", address: "Industrial Area", payment_terms: "Net 15", location_scope: "all" },
        { name: "Unilever Wholesale", phone: "03007777777", email: "orders@unilever-ws.local", address: "Korangi", payment_terms: "Net 30", location_scope: "selected", location_ids: [1] },
        { name: "Rice Mills Co", phone: "03008888888", email: "info@ricemills.local", address: "Gujranwala", payment_terms: "Cash on delivery", location_scope: "selected", location_ids: [1, 2] },
      ],
    },
    adminOnly: ["location_scope", "location_ids"],
  }),
  ep({
    id: "sup-patch",
    tag: "suppliers",
    method: "PATCH",
    path: "/api/v1/suppliers/:id",
    summary: "Update supplier",
    description:
      "Send only the fields to change. A store admin may also change location_scope / location_ids; a manager or cashier can edit only suppliers of their own location and cannot move them.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Nestle Distributor",
      phone: "03006666666",
      email: "sales@distributor.local",
      address: "Industrial Area",
      payment_terms: "Net 30",
      is_active: true,
      location_scope: "selected",
      location_ids: [1],
    },
    adminOnly: ["location_scope", "location_ids"],
  }),
  ep({
    id: "sup-delete",
    tag: "suppliers",
    method: "DELETE",
    path: "/api/v1/suppliers/:id",
    summary: "Deactivate supplier",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),


  ep({
    id: "data-delete-all",
    tag: "data",
    method: "DELETE",
    path: "/api/v1/admin/data",
    summary: "Delete all database rows",
    description:
      "Super Admin. Deletes every row in every table except SequelizeMeta. You will need to register a Super Admin again.",
    auth: "superadmin",
  }),
  ...dataModuleDeleteEndpoints(),
]

function dataModuleDeleteEndpoints() {
  const modules = [
    "orders",
    "order_items",
    "order_refunds",
    "payments",
    "receipts",
    "categories",
    "products",
    "product_stocks",
    "customers",
    "suppliers",
    "stock_movements",
    "stock_transfers",
    "offers",
    "coupons",
    "carts",
    "addresses",
    "reviews",
    "staff",
    "users",
    "stores",
    "locations",
    "plans",
    "licenses",
    "pos_devices",
    "register_sessions",
    "billings",
    "store_banners",
    "audit_logs",
    "approval_requests",
  ]

  return modules.flatMap((name) => [
    ep({
      id: `data-${name}-all`,
      tag: "data",
      method: "DELETE",
      path: `/api/v1/admin/data/${name}`,
      summary: `Delete all ${name}`,
      description: `Super Admin. Deletes every row in the ${name} module (and its child rows).`,
      auth: "superadmin",
    }),
    ep({
      id: `data-${name}-one`,
      tag: "data",
      method: "DELETE",
      path: `/api/v1/admin/data/${name}/:id`,
      summary: `Delete ${name} by id`,
      description: `Super Admin. Deletes one ${name} row and related child rows.`,
      auth: "superadmin",
      pathParams: [{ name: "id", default: UUID, required: true }],
    }),
  ])
}

export function endpointsByTag(tagId) {
  return endpoints.filter((item) => item.tag === tagId)
}
