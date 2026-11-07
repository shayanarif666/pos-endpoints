import { bodyFieldsFor, enumsFromFields } from "./bodyFields.js"
import { buildBody, defaultToggles } from "./bodyBuilder.js"
import { SAMPLE_RESPONSES } from "./sampleResponses.js"
import { DEMO_EPS, DEMO_NEW_EPS, DEMO_REMOVED_IDS } from "./demo.js"

const UUID = "00000000-0000-4000-8000-000000000001"

// Shared intro of every bulk update (PATCH .../bulk...).
const BULK_UPDATE_NOTE =
  "POS offline sync: updates made while offline queue on the till and go in one request — { items: [{ id, ...fields }] }, id = the row's number (1, 2, 3…), never the UUID. Only the fields sent change. Each row saves on its own: a row that fails is listed in failed[] ({ index, message, status }) and the rest still save; when every row fails the reply is that first error. Reply data: the updated rows."

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

// Where each example row is sold (any role): every location, two locations, one location.
const CATALOG_LOCATIONS = [
  [["location_scope", "all"]],
  [
    ["location_scope", "selected"],
    ["location_ids", [1, 2]],
  ],
  [
    ["location_scope", "selected"],
    ["location_ids", [1]],
  ],
]

function categoryRow(name, taxValue, discountValue, locations = CATALOG_LOCATIONS[0]) {
  return [
    ["name", name],
    ...TAX("GST", "percentage", taxValue),
    ...DISCOUNT("Eid Shopping", "percentage", discountValue),
    ["description", "", "optional"],
    ["parent_category_id", null, "optional"],
    ...VISIBILITY_OPTIONAL,
    ...locations,
  ]
}

const CATEGORY_TOGGLES = [
  { id: "discount", label: "Has Category Discount", default: true },
  { id: "tax", label: "Has Category Tax", default: true },
  { id: "optional", label: "Show Optional Fields", default: false },
]

const GST = [{ name: "GST", type: "percentage", value: 18 }]
const at = (...rows) => rows.map(([location_id, qty, expiry_date]) => ({ location_id, qty, ...(expiry_date ? { expiry_date } : {}) }))
// Pack stock counted in whole packs: stock_unit "pack" (the server keeps packs × pack_size units).
const packs = (...rows) => rows.map(([location_id, qty, expiry_date]) => ({ location_id, qty, stock_unit: "pack", ...(expiry_date ? { expiry_date } : {}) }))
const pack = (size, cost, price, sellLoose) => ({ is_pack_product: true, pack_size: size, pack_cost: cost, pack_price: price, sell_loose: sellLoose })

// A product with variants: where it is sold, where its stock is held, then each variant with its
// own SKU, barcode, prices / pack and opening stock per location.
const productWithVariants = ({ title, sku, barcode, category, unit, threshold, scope, stockScope, variants }) => [
  ["title", title],
  ["sku", sku],
  ["barcode", barcode],
  ["category_id", category],
  ["unit", unit],
  ["taxes", GST, "tax"],
  ["low_stock_threshold", threshold],
  ["is_weight_based", false],
  ["image", ""],
  ...scope,
  ...stockScope,
  // Each variant says whether it is sold by weight (kg); its stock comes last.
  ["variants", variants.map(({ stock, ...variant }) => ({ ...variant, is_weight_based: variant.is_weight_based ?? false, stock }))],
  ["is_published", false, "optional"],
  ...VISIBILITY_OPTIONAL,
]

// Pepsi: loose bottles in four sizes; sold everywhere, stock at locations 1 and 2.
const PRODUCT_PEPSI_ROW = productWithVariants({
  title: "Pepsi", sku: "PEPSI", barcode: "8961014100004", category: 1, unit: "bottle", threshold: 10,
  scope: [["location_scope", "all"]],
  stockScope: [["stock_scope", "selected"], ["stock_location_ids", [1, 2]]],
  variants: [
    { name: "1L", sku: "PEPSI-1L", barcode: "8961014100011", cost: 80, price: 100, stock: at([1, 50, "2027-03-31"], [2, 30, "2027-03-31"]) },
    { name: "1.5L", sku: "PEPSI-1-5L", barcode: "8961014100028", cost: 110, price: 140, stock: at([1, 40], [2, 20]) },
    { name: "2L", sku: "PEPSI-2L", barcode: "8961014100035", cost: 140, price: 180, taxes: [{ name: "Sugar tax", type: "fixed", value: 5 }], stock: at([1, 24], [2, 12]) },
    { name: "Jumbo", sku: "PEPSI-JUMBO", barcode: "8961014100042", cost: 190, price: 240, stock: at([1, 15]) },
  ],
})

// Pack Of Pepsi: every size by the pack; sold (and stocked) at locations 1 and 2.
const PRODUCT_PEPSI_PACK_ROW = productWithVariants({
  title: "Pack Of Pepsi", sku: "PEPSI-PACK", barcode: "8961014200001", category: 1, unit: "bottle", threshold: 12,
  scope: [["location_scope", "selected"], ["location_ids", [1, 2]]],
  stockScope: [["stock_scope", "all"]],
  variants: [
    { name: "1L x 10", sku: "PEPSI-PACK-1L", barcode: "8961014200018", ...pack(10, 780, 950, false), stock: packs([1, 10], [2, 5]) },
    { name: "1.5L x 6", sku: "PEPSI-PACK-1-5L", barcode: "8961014200025", ...pack(6, 630, 800, false), stock: packs([1, 10], [2, 6]) },
    { name: "2L x 6", sku: "PEPSI-PACK-2L", barcode: "8961014200032", ...pack(6, 800, 1020, false), taxes: [{ name: "Sugar tax", type: "fixed", value: 5 }], stock: packs([1, 6], [2, 4]) },
    { name: "Jumbo x 4", sku: "PEPSI-PACK-JUMBO", barcode: "8961014200049", ...pack(4, 720, 920, false), stock: packs([1, 5], [2, 2]) },
  ],
})

// Pack Of Lux Soap: a box of 12 in three colours, single bars sold too; everywhere.
const PRODUCT_LUX_PACK_ROW = productWithVariants({
  title: "Pack Of Lux Soap", sku: "LUX-PACK", barcode: "8961014300008", category: 2, unit: "piece", threshold: 12,
  scope: [["location_scope", "all"]],
  stockScope: [["stock_scope", "all"]],
  variants: [
    { name: "Soft Rose (Pink)", sku: "LUX-PINK", barcode: "8961014300015", ...pack(12, 1080, 1320, true), stock: packs([1, 4], [2, 2], [3, 2]) },
    { name: "Fresh Splash (Green)", sku: "LUX-GREEN", barcode: "8961014300022", ...pack(12, 1080, 1320, true), stock: at([1, 36], [2, 12], [3, 12]) },
    { name: "Sandal & Cream (Yellow)", sku: "LUX-YELLOW", barcode: "8961014300039", ...pack(12, 1080, 1320, true), stock: at([1, 24], [3, 12]) },
  ],
})

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
      { id: "default", label: null, rows: [PRODUCT_PEPSI_ROW, PRODUCT_PEPSI_PACK_ROW, PRODUCT_LUX_PACK_ROW] },
    ],
    bulkTop: [["storeId", 1]],
    toggles: PRODUCT_TOGGLES,
  }
}

const OFFER_DATES = [
  ["start_at", "2026-09-01T00:00:00.000Z"],
  ["end_at", "2026-12-31T23:59:59.000Z"],
  ["is_active", true],
]

// Each offer applies to products and / or categories (several of each).
const OFFER_ROWS = [
  [
    ["name", "Eid Sale 10%"],
    ["type", "promotional"],
    ["discount_type", "percentage"],
    ["discount_value", 10],
    ["products", [1, 2]],
    ["categories", [3]],
    ...OFFER_DATES,
  ],
  [
    ["name", "Flash Sale"],
    ["type", "flash_sale"],
    [
      "products",
      [
        { product_id: 1, promo_price: 90 },
        { product_id: 2, promo_price: 95 },
      ],
    ],
    ...OFFER_DATES,
  ],
  [
    ["name", "Buy 2 get 1 free"],
    ["type", "bogo"],
    ["buy_qty", 2],
    ["get_qty", 1],
    ["products", [1]],
    ["categories", [2]],
    ...OFFER_DATES,
  ],
  [
    ["name", "Buy 3 save 5%"],
    ["type", "bulk_discount"],
    ["discount_type", "percentage"],
    ["discount_value", 5],
    ["min_qty", 3],
    ["categories", [1, 2]],
    ...OFFER_DATES,
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
    ["location_ids", [1]],
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
    bulkTop: [["storeId", 1], ["staffId", 2]],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

// One sale as the till priced it: every figure is worked out on the POS and saved as sent.
const orderRow = ({ id, placed_at, lines, payments, total }) => [
  ["client_local_id", id],
  ["placed_at", placed_at],
  ["customer_id", null, "optional"],
  ["lines", lines],
  ["order_discount", null, "optional"],
  ["coupon", null, "optional"],
  ["payments", payments],
  ["total_amount", total],
]

const tax = (level, name, rate, amount) => ({ level, name, rate, amount })

// Three sales, priced by the till: 2 Pepsi (offer 10%) + Lux paid cash; a custom sale; a split
// card + cash payment. Store: sales tax 18% on, cash payment tax 16%, card 5%.
const ORDER_ROWS = [
  orderRow({
    id: "POS1-20261024-0001",
    placed_at: "2026-10-24T10:05:00.000Z",
    lines: [
      {
        product_id: 1,
        variant_id: 1,
        sale_unit: "unit",
        qty: 2,
        unit_price: 100,
        cost_price: 50,
        discount_amount: 20,
        discount: [{ discount_id: 1 }],
        taxes: [tax("product", "GST", 18, 32.4), tax("category", "GST", 5, 9), tax("sales", "Sales Tax", 18, 32.4)],
      },
      {
        product_id: 11,
        variant_id: 2,
        qty: 1,
        unit_price: 100,
        cost_price: 75,
        discount: [],
        taxes: [tax("product", "GST", 18, 18), tax("category", "GST", 10, 10), tax("sales", "Sales Tax", 18, 18)],
      },
    ],
    payments: [{ method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 63.97, amount: 463.77, paid: 1000 }],
    total: 463.77,
  }),
  orderRow({
    id: "POS1-20261024-0002",
    placed_at: "2026-10-24T10:20:00.000Z",
    lines: [
      { title: "SP10 Blue Pen", category: "Stationary", qty: 2, unit_price: 50, discount: [], taxes: [tax("sales", "Sales Tax", 18, 18)] },
      { title: "A4 Notebook", category: "Stationary", qty: 1, unit_price: 120, discount: [], taxes: [tax("sales", "Sales Tax", 18, 21.6)] },
    ],
    payments: [{ method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 41.54, amount: 301.14, paid: 500 }],
    total: 301.14,
  }),
  orderRow({
    id: "POS1-20261024-0003",
    placed_at: "2026-10-24T11:40:00.000Z",
    lines: [
      {
        product_id: 1,
        variant_id: 2,
        qty: 1,
        unit_price: 100,
        cost_price: 50,
        discount_amount: 10,
        discount: [{ discount_id: 1 }],
        taxes: [tax("product", "GST", 18, 16.2), tax("category", "GST", 5, 4.5), tax("sales", "Sales Tax", 18, 16.2)],
      },
    ],
    payments: [
      { method: "card", surcharge_type: "percentage", surcharge_value: 5, surcharge_amount: 2.38, amount: 50, paid: 50 },
      { method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 12.68, amount: 91.96, paid: 100 },
    ],
    total: 141.96,
  }),
  // Sold by the pack: 2 packs of Pack Of Pepsi 1L x 10 (stock goes down by 20 bottles).
  orderRow({
    id: "POS1-20261024-0004",
    placed_at: "2026-10-24T12:15:00.000Z",
    lines: [
      {
        product_id: 6,
        variant_id: 1,
        sale_unit: "pack",
        qty: 2,
        unit_price: 950,
        cost_price: 780,
        discount: [],
        taxes: [tax("product", "GST", 18, 342)],
      },
    ],
    payments: [{ method: "cash", surcharge_amount: 0, amount: 2242, paid: 2500 }],
    total: 2242,
  }),
]

function orderBuilder() {
  return {
    bulk: true,
    variants: [{ id: "default", label: null, rows: ORDER_ROWS }],
    bulkTop: [["storeId", 1], ["locationId", 1], ["staffId", 2], ["batchId", 1]],
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
    location_scope: ["all", "selected"],
    tax_type: ["percentage", "fixed"],
    discount_type: ["percentage", "fixed"],
    channel: ["web", "pos", "both"],
  },
  products: {
    location_scope: ["all", "selected"],
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
    payment_method: ["cash", "card", "jazzcash", "easypaisa", "cod", "bank_transfer", "raast", "sadapay", "nayapay", "upaisa", "digital_wallet", "cheque", "online", "other", "mixed"],
  },
  reports: {
    period: ["daily", "weekly", "monthly", "yearly"],
    channel: ["web", "pos"],
  },
  taxes: {
    type: ["percentage", "fixed"],
    product_scope: ["all", "selected"],
  },
  surcharges: {
    method: ["cash", "card", "jazzcash", "easypaisa", "cod", "bank_transfer", "raast", "sadapay", "nayapay", "upaisa", "digital_wallet", "cheque", "online", "other"],
    type: ["percentage", "fixed"],
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

// ---- Products: one sample reply per request variant (built from the captured product rows) ----

const SAMPLE_PRODUCTS = Object.fromEntries(
  ["prod-bulk-status-patch"]
    .flatMap((key) => SAMPLE_RESPONSES[key]?.[0]?.body?.data || [])
    .map((row) => [row.id, row])
)

/** A captured product with some fields changed. */
const sampleProduct = (id, fields = {}) => ({ ...SAMPLE_PRODUCTS[id], ...fields })


// ---- Stock edit samples (stock movements / product stocks bulk updates and deletes) ----
// Short numbers only, as the API replies: every reference is { id (its number), name… }.
const SAMPLE_PEPSI = { id: 1, title: "Pepsi", sku: "PEPSI", barcode: "2565770472474", unit: "bottle" }
const PEPSI_1_5L = { ...SAMPLE_PEPSI, variant: { id: 4, title: "1.5L", sku: "SKU-PEPSI-1.5L", barcode: "2355804798478" } }
const PEPSI_350ML = { ...SAMPLE_PEPSI, variant: { id: 1, title: "350ML", sku: "SKU-PEPSI-350ML", barcode: "2355804798461" } }
const GULISTAN = { id: 1, name: "Gulistan e Johar" }
const DEFENSE = { id: 2, name: "Defense View" }
const ZAYAN = { id: 1, name: "Zayan Ahmed", role: "store_admin" }

const sampleMovement = (fields) => ({
  id: fields.id,
  location: fields.location || GULISTAN,
  product: fields.product || PEPSI_1_5L,
  staff: ZAYAN,
  supplier: fields.supplier === undefined ? null : fields.supplier,
  movement_type: fields.movement_type,
  reason: fields.reason,
  reason_note: fields.reason_note ?? null,
  qty: fields.qty,
  qty_after: fields.qty_after,
  created_at: fields.created_at || "2026-11-05T00:12:00.000Z",
  updated_at: fields.updated_at === undefined ? "2026-11-06T09:10:00.000Z" : fields.updated_at,
  ...(fields.deleted_at ? { deleted_at: fields.deleted_at } : {}),
})

/** A loose item: pack fields null. A pack item: pack_size, number_of_packs, loose_units, sell_loose. */
const sampleStock = (fields) => {
  const qty = fields.qty
  const size = fields.pack_size ?? null
  const threshold = fields.low_stock_threshold ?? 5
  return {
    location: fields.location || GULISTAN,
    product: fields.product || PEPSI_1_5L,
    qty,
    pack_size: size,
    number_of_packs: size ? Math.floor(qty / size) : null,
    loose_units: size ? qty - Math.floor(qty / size) * size : null,
    sell_loose: size ? fields.sell_loose ?? true : null,
    expiry_date: fields.expiry_date ?? "2026-11-30",
    low_stock_threshold: threshold,
    is_low: qty <= threshold,
    updated_at: fields.updated_at || "2026-11-06T09:10:00.000Z",
    ...(fields.deleted_at ? { deleted_at: fields.deleted_at } : {}),
  }
}


/** Bulk Stock Transfer's sample transfer, as the Update Stock Transfers example leaves it. */
function transferSample() {
  const created = SAMPLE_RESPONSES["transfer-bulk"]?.[0]?.body?.data?.[0]
  const copy = JSON.parse(JSON.stringify(created || {}))
  copy.note = "Weekly refill — Branch 2 needs more Pepsi"
  const first = copy.destinations?.[0]
  if (first) first.products = first.products.slice(0, 1).map((line) => ({ ...line, qty: 25 }))
  return copy
}

// ---- Order refunds (partial and complete): the POS works out every figure, the server saves them ----
const refundTax = (level, name, rate, amount) => ({ level, name, rate, amount })
const PEPSI_TAXES = [refundTax("product", "GST", 18, 16.2), refundTax("category", "GST", 5, 4.5), refundTax("sales", "Sales Tax", 18, 16.2)]
const LUX_TAXES = [refundTax("product", "GST", 18, 18), refundTax("category", "GST", 10, 10), refundTax("sales", "Sales Tax", 18, 18)]
const REFUND_STAFF = { id: 2, name: "Ahmed Malik", role: "manager" }
const REFUND_LOCATION = { id: 1, name: "Gulistan e Johar" }
const REFUND_BATCH = { id: 3, status: "open" }

const REFUND_PARTIAL_REQUEST = {
  storeId: 1,
  locationId: 1,
  staffId: 2,
  batchId: 3,
  items: [
    {
      client_local_id: "POS1-R-20261106-0001",
      refunded_at: "2026-11-06T09:20:00.000Z",
      order_id: 1,
      reason: "Customer return",
      lines: [
        { order_item_id: 1, qty: 1, restock: true, discount_amount: 10, amount: 90, taxes: PEPSI_TAXES, total: 126.9 },
        { order_item_id: 2, qty: 1, restock: false, discount_amount: 0, amount: 100, taxes: LUX_TAXES, total: 146 },
      ],
      payments: [{ method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 43.66, amount: 316.56 }],
      total_amount: 316.56,
    },
  ],
}

const REFUND_COMPLETE_REQUEST = {
  storeId: 1,
  locationId: 1,
  staffId: 2,
  batchId: 3,
  items: [
    {
      client_local_id: "POS1-R-20261106-0002",
      refunded_at: "2026-11-06T09:30:00.000Z",
      order_id: 3,
      reason: "Customer changed mind",
      restock: true,
      lines: [{ order_item_id: 1, qty: 1, discount_amount: 10, amount: 90, taxes: PEPSI_TAXES, total: 126.9 }],
      payments: [
        { method: "card", surcharge_type: "percentage", surcharge_value: 5, surcharge_amount: 2.38, amount: 50 },
        { method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 12.68, amount: 91.96 },
      ],
      total_amount: 141.96,
    },
    {
      client_local_id: "POS1-R-20261106-0003",
      refunded_at: "2026-11-06T09:35:00.000Z",
      order_id: 2,
      reason: "Full return",
      restock: false,
      lines: [
        { order_item_id: 1, qty: 2, discount_amount: 0, amount: 100, taxes: [refundTax("sales", "Sales Tax", 18, 18)], total: 118 },
        { order_item_id: 2, qty: 1, discount_amount: 0, amount: 120, taxes: [refundTax("sales", "Sales Tax", 18, 21.6)], total: 141.6 },
      ],
      payments: [{ method: "cash", surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 41.54, amount: 301.14 }],
      total_amount: 301.14,
    },
  ],
}

const REFUND_PARTIAL_ROW = {
  id: 5,
  refund_type: "partial",
  client_local_id: "POS1-R-20261106-0001",
  location: REFUND_LOCATION,
  staff: REFUND_STAFF,
  batch: REFUND_BATCH,
  order: { id: 1, status: "partial_refunded" },
  customer: null,
  receiptId: 10,
  currency: "PKR",
  reason: "Customer return",
  lines: [
    {
      order_item_id: 1,
      product: { id: 1, title: "Pepsi", sku: "PEPSI", unit: "bottle", variant: { id: 1, name: "350ML" } },
      qty: 1, sale_unit: "unit", unit_price: 100, discount_amount: 10, amount: 90,
      taxes: PEPSI_TAXES, tax: 36.9, total: 126.9, restocked: true,
    },
    {
      order_item_id: 2,
      product: { id: 11, title: "Pack Of Lux Soap", sku: "LUX-GREEN", unit: "piece", variant: { id: 2, name: "Fresh Splash (Green)" } },
      qty: 1, sale_unit: "unit", unit_price: 100, discount_amount: 0, amount: 100,
      taxes: LUX_TAXES, tax: 46, total: 146, restocked: false,
    },
  ],
  amount: 190,
  discount_amount: 10,
  tax: 82.9,
  surcharge: 43.66,
  total: 316.56,
  payments: [{ method: "cash", bill_share: 272.9, surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 43.66, amount: 316.56 }],
  refunded_at: "2026-11-06T09:20:00.000Z",
  synced_at: "2026-11-06T09:25:12.000Z",
}

const REFUND_COMPLETE_ROWS = [
  {
    id: 6,
    refund_type: "complete",
    client_local_id: "POS1-R-20261106-0002",
    location: REFUND_LOCATION,
    staff: REFUND_STAFF,
    batch: REFUND_BATCH,
    order: { id: 3, status: "refunded" },
    customer: null,
    receiptId: 11,
    currency: "PKR",
    reason: "Customer changed mind",
    lines: [
      {
        order_item_id: 1,
        product: { id: 1, title: "Pepsi", sku: "PEPSI", unit: "bottle", variant: { id: 2, name: "500ML" } },
        qty: 1, sale_unit: "unit", unit_price: 100, discount_amount: 10, amount: 90,
        taxes: PEPSI_TAXES, tax: 36.9, total: 126.9, restocked: true,
      },
    ],
    amount: 90,
    discount_amount: 10,
    tax: 36.9,
    surcharge: 15.06,
    total: 141.96,
    payments: [
      { method: "card", bill_share: 47.62, surcharge_type: "percentage", surcharge_value: 5, surcharge_amount: 2.38, amount: 50 },
      { method: "cash", bill_share: 79.28, surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 12.68, amount: 91.96 },
    ],
    refunded_at: "2026-11-06T09:30:00.000Z",
    synced_at: "2026-11-06T09:31:02.000Z",
  },
  {
    id: 7,
    refund_type: "complete",
    client_local_id: "POS1-R-20261106-0003",
    location: REFUND_LOCATION,
    staff: REFUND_STAFF,
    batch: REFUND_BATCH,
    order: { id: 2, status: "refunded" },
    customer: null,
    receiptId: 12,
    currency: "PKR",
    reason: "Full return",
    lines: [
      {
        order_item_id: 1, title: "SP10 Blue Pen", category: "Stationary", qty: 2, unit_price: 50, discount_amount: 0, amount: 100,
        taxes: [refundTax("sales", "Sales Tax", 18, 18)], tax: 18, total: 118, restocked: false,
      },
      {
        order_item_id: 2, title: "A4 Notebook", category: "Stationary", qty: 1, unit_price: 120, discount_amount: 0, amount: 120,
        taxes: [refundTax("sales", "Sales Tax", 18, 21.6)], tax: 21.6, total: 141.6, restocked: false,
      },
    ],
    amount: 220,
    discount_amount: 0,
    tax: 39.6,
    surcharge: 41.54,
    total: 301.14,
    payments: [{ method: "cash", bill_share: 259.6, surcharge_type: "percentage", surcharge_value: 16, surcharge_amount: 41.54, amount: 301.14 }],
    refunded_at: "2026-11-06T09:35:00.000Z",
    synced_at: "2026-11-06T09:36:40.000Z",
  },
]

const refundCreated = (data) => ({ label: "201 Created", status: 201, body: { success: true, message: "Refunded Successfully", data } })
const refundPage = (data) => ({
  label: "200 OK",
  status: 200,
  body: { success: true, message: "OK", data, pagination: { page: 1, limit: 20, total: data.length, total_pages: 1 } },
})
const REFUND_ROW_SHAPE =
  "Each refund: { id (refund number), refund_type (partial | complete), client_local_id, location, staff, batch, order { id, status }, customer, receiptId, currency, reason, lines [{ order_item_id, product { id, title, sku, unit, variant } (a custom line: title + category), qty, sale_unit, unit_price, discount_amount, amount, taxes [{ level, name, rate, amount }], tax, total, restocked }], amount (after discount, before tax), discount_amount, tax (line taxes), surcharge (payment surcharges), total, payments [{ method, bill_share, surcharge_type, surcharge_value, surcharge_amount, amount }], refunded_at (when it happened at the till), synced_at (when it reached the server) }. One refund and one receipt per order, all its lines in lines[]."
const REFUND_RULES =
  "The POS works out every figure and the server saves them as sent — nothing is calculated again (the same as orders): per line discount_amount, amount (after discount, before tax), taxes [{ level, name, rate, amount }] and total; per payment method surcharge_* and amount (what goes back that way — the POS may pay back another way than the sale, e.g. cash for a card sale; method credit takes it off the customer's udhaar); total_amount. The server only checks: the qty is not more than what is left to refund on that line, and total_amount = the sum of payments[].amount. client_local_id: the till's own id — sending it again returns the saved refund, never a second one (safe to retry offline). refunded_at: when it happened at the till (ISO; at most 30 days ago). batchId: the batch the money leaves from — the drawer open now, not the sale's (defaults to the staff member's open batch). restock: true = the qty goes back to stock (default), false = it does not (damaged, expired) — on a line, or once on the order for every line (a line's own wins). Each order saves on its own: one that fails is listed in failed[] ({ index, message, status }) and the rest still save; when all fail the reply is that first error."

const okReply = (label, variant, message, data) => ({ label, variant, status: 200, body: { success: true, message, data } })

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
  // true = `responses` replace the captured ones (e.g. one reply per bodyBuilder variant).
  ownResponses = false,
}) {
  // The demo store (demo.js) gives the request / replies of the entries it drives.
  const demo = DEMO_EPS[id]
  if (demo) {
    if ("body" in demo) {
      body = demo.body
      bodyBuilder = null
    }
    if (demo.responses) {
      responses = demo.responses
      ownResponses = true
    }
    if (demo.description) description = demo.description
    if (demo.query) query = demo.query
    if (demo.pathParams) pathParams = demo.pathParams
  }
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
    responses: ownResponses ? responses : [...(SAMPLE_RESPONSES[id] || []), ...responses],
    files,
    capture,
    enums: endpointEnums(enums || RESOURCE_ENUMS[tag], effectiveBody == null ? null : bodyFieldsFor({ id, tag })),
    fields: effectiveBody == null ? null : bodyFieldsFor({ id, tag }),
  }
}

export const tags = [
  {
    id: "offers",
    name: "Discounts",
    description: "Discounts (offers): promotional, bulk discount, flash sale and buy X get Y. A sale line names the ones it used with discount_id.",
  },
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
    id: "taxes",
    name: "Taxes",
    description: "Settings › Taxes: a tax for every product or the selected ones.",
    enums: RESOURCE_ENUMS.taxes,
  },
  {
    id: "surcharges",
    name: "Payment Method Surcharges",
    description: "Settings › Payment Method Surcharges: what paying by a method adds to the bill.",
    enums: RESOURCE_ENUMS.surcharges,
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Suppliers page add / edit / deactivate.",
    enums: RESOURCE_ENUMS.suppliers,
  },
  {
    id: "customers",
    name: "Customers",
    description: "Customers and their udhaar (credit).",
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
      product: { id: 1, title: "Pepsi - 1L", sku: "PEPSI-1L", unit: "bottle", variant: { id: 1, name: "1L" } },
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
  { id: "user-sessions", name: "User Sessions", tag: "shifts", ids: ["staff-clock-in", "staff-clock-out"] },
  { id: "staff", name: "Staff", tag: "staff", ids: ["staff-bulk"] },
  { id: "batch-report", name: "Batch Report", tag: "shifts", ids: ["batch-open", "batch-close"] },
  { id: "categories", name: "Categories", tag: "categories", ids: ["cat-bulk"] },
  { id: "products", name: "Products", tag: "products", ids: ["prod-bulk", "prod-image-upload", "prod-variant-image-upload"] },
  { id: "stock-inventory", name: "Stock Inventory", tag: "inventory", ids: ["movement-bulk", "transfer-bulk"] },
  { id: "taxes", name: "Taxes", tag: "taxes", ids: ["tax-bulk"] },
  { id: "surcharges", name: "Payment Method Surcharges", tag: "surcharges", ids: ["surcharge-bulk"] },
  { id: "suppliers", name: "Suppliers", tag: "suppliers", ids: ["sup-bulk"] },
  { id: "customers", name: "Customers", tag: "customers", ids: ["customer-bulk"] },
  { id: "orders", name: "Orders", tag: "orders", ids: ["order-bulk", "order-refund-complete-bulk", "order-refund-bulk"] },
]

// The PUT & PATCH group: the bulk updates by section, then every other PUT / PATCH under "Other".
export const patchSections = [
  { id: "patch-products", name: "Products", tag: "products", ids: ["prod-bulk-patch", "prod-bulk-status-patch"] },
  { id: "patch-categories", name: "Categories", tag: "categories", ids: ["cat-bulk-patch", "cat-bulk-status-patch", "cat-locations-patch"] },
  { id: "patch-stock", name: "Stock Inventory", tag: "inventory", ids: ["movement-patch", "stock-entry-patch"] },
  { id: "patch-transfers", name: "Stock Transfers", tag: "inventory", ids: ["transfer-bulk-patch"] },
  { id: "patch-orders", name: "Orders", tag: "orders", ids: ["order-bulk-patch", "order-bulk-status-patch", "order-bulk-payment-method-patch"] },
  { id: "patch-taxes", name: "Taxes", tag: "taxes", ids: ["tax-bulk-patch", "tax-bulk-status-patch"] },
  { id: "patch-surcharges", name: "Payment Method Surcharges", tag: "surcharges", ids: ["surcharge-bulk-patch", "surcharge-bulk-status-patch"] },
  { id: "patch-suppliers", name: "Suppliers", tag: "suppliers", ids: ["sup-bulk-patch"] },
  { id: "patch-staff", name: "Staff", tag: "staff", ids: ["staff-bulk-patch"] },
  { id: "patch-staff-sessions", name: "User Sessions", tag: "shifts", ids: ["staff-session-bulk-patch"] },
  { id: "patch-batches", name: "Batches", tag: "shifts", ids: ["batch-bulk-patch"] },
  { id: "patch-customers", name: "Customers", tag: "customers", ids: ["customer-bulk-patch"] },
  { id: "patch-locations", name: "Locations", tag: "locations", ids: ["location-bulk-patch"] },
]

// The GET group: these sections in this order, then every other GET under "Other".
export const getSections = [
  { id: "get-super-admin", name: "Super Admin Actions", tag: "plans", ids: ["plans-list"] },
  { id: "get-store", name: "Store & Locations", tag: "store", ids: ["store-me", "location-list", "currency-get"] },
  { id: "get-user-sessions", name: "User Session History", tag: "shifts", ids: ["staff-session-list"] },
  { id: "get-categories", name: "Categories", tag: "categories", ids: ["cat-list"] },
  { id: "get-products", name: "Products", tag: "products", ids: ["prod-list", "prod-get", "prod-image-get", "prod-expiry", "prod-weight-list"] },
  { id: "get-orders", name: "Orders", tag: "orders", ids: ["order-list-completed", "order-list-pending", "order-list-cancelled", "order-get"] },
  { id: "get-refunds", name: "Refunds", tag: "orders", ids: ["refund-list-complete", "refund-list-partial"] },
  { id: "get-stock", name: "Stock Inventory", tag: "inventory", ids: ["movement-list", "transfer-list"] },
  { id: "get-taxes", name: "Taxes", tag: "taxes", ids: ["tax-list", "tax-get"] },
  { id: "get-surcharges", name: "Payment Method Surcharges", tag: "surcharges", ids: ["surcharge-list", "surcharge-get"] },
  { id: "get-suppliers", name: "Suppliers", tag: "suppliers", ids: ["sup-list"] },
  { id: "get-discounts", name: "Discounts", tag: "offers", ids: ["offer-list"] },
  { id: "get-reporting", name: "Detailed Reporting", tag: "reports", ids: ["reporting-overview", "reporting-section", "rep-all-locations", "rep-location", "rep-profit"] },
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

const BASE_ENDPOINTS = [
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
      "Super Admin only (a store admin / manager / cashier gets 403). Every active plan — its id is the plan_id for Store Register and Renew License.",
    auth: "superadmin",
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
      "Store admin or manager only — a cashier never signs in, the till verifies them with POST /auth/pin/verify (cashier email login returns 403). channel=pos returns { token, store, locations | location, users }: the signed-in user is the first row of users[] (no separate user object) — each row { id (user number), name, email, pin, role, phone, is_active }; store { id, name, status (trial | active), trial_ended_at }; a store admin gets locations[] ({ id, name, address }) and users[] (the store admin first with locationId null, then every manager and cashier, with locationId); a manager gets location{} and users[] (the manager first, then the cashiers of that location). The token gives the store and location (and the store admin picks a location with location_id in the body). channel=web returns the dashboard's access_token + refresh_token. A deactivated (suspended) staff account with the right password gets 403 'Account Suspended'; a token of staff deactivated later stops working with 401 'Account Suspended'.",
    auth: "public",
    body: {
      email: "zayan@acadex.co",
      password: "ChangeMe123",
    },
    responses: [
      { label: "Staff deactivated (403)", body: { success: false, message: "Account Suspended", errors: null } },
    ],
    capture: {
      accessToken: ["data.token", "data.access_token"],
      refreshToken: "data.refresh_token",
      // channel=pos: the signed-in user is users[0]; channel=web: data.user.
      role: ["data.users.0.role", "data.user.role"],
    },
  }),
  ep({
    id: "auth-pin-verify",
    tag: "auth",
    method: "POST",
    path: "/api/v1/auth/pin/verify",
    summary: "PIN Verification",
    description:
      "On a signed-in till (store admin / manager token). Checks the PIN of a cashier, manager or the store admin at this location and returns { id, name, email, role, pin, phone, status, is_active } — no token. The POS then sends that id as staff_id (or id) on the cashier's clock in, batch, orders, refunds and stock. The PIN of a deactivated (suspended) staff member gets 403 'Account Suspended'; an unknown PIN 401 'Invalid PIN'.",
    body: { pin: "2222" },
    responses: [
      { label: "Staff deactivated (403)", body: { success: false, message: "Account Suspended", errors: null } },
    ],
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
    id: "store-me",
    tag: "store",
    method: "GET",
    path: "/api/v1/stores/me",
    summary: "Store Profile",
    description: "Settings, Tax manager, POS cart (sales_tax_rate, payment_tax_enabled), history.",
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
    id: "currency-get",
    tag: "store",
    method: "GET",
    path: "/api/v1/currency",
    summary: "Currency",
    description: "The store's currency { code, name, symbol, decimal_places, symbol_position }. Every store gets PKR (Pakistani Rupee, Rs, 2 decimals, symbol before) at registration; a store registered before the currency table shows these defaults until PUT /currency saves its row.",
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
      { name: "staffId", default: "2", required: false },
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
    description: "Attendance (clock in)."+" POS offline sync: { storeId, locationId, staffId, items: [ ... ] } — storeId, locationId and staffId are sent once, before items[] (a row may carry its own staffId when it is a different staff member); clock in / out or open / close many at once (each item saved on its own, failures listed in failed[]; the reply data is the list). A single object without items still works."+" staffId = the staff member (user number, from PIN verification). Response { id, staff, status: clock_in, opening_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 2,
      items: [
        { clocked_at: "2026-10-24T09:00:00.000Z" },
      ],
    },
  }),
  ep({
    id: "staff-clock-out",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/staff-sessions/clock-out",
    summary: "User Session Clock Out",
    description: "Ends the staff member's open attendance session."+" POS offline sync: { storeId, locationId, staffId, items: [ ... ] } — storeId, locationId and staffId are sent once, before items[] (a row may carry its own staffId when it is a different staff member); clock in / out or open / close many at once (each item saved on its own, failures listed in failed[]; the reply data is the list). A single object without items still works."+" Response { id, staff, status: clock_out, closing_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 2,
      items: [
        { clocked_at: "2026-10-24T17:00:00.000Z" },
      ],
    },
  }),
  ep({
    id: "batch-open",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/batches/open",
    summary: "Batch Opening",
    description: "Opens the cash drawer for a staff member. One counter (device) holds one open batch: several items at once need their own device_id (one per counter)."+" POS offline sync: { storeId, locationId, staffId, items: [ ... ] } — storeId, locationId and staffId are sent once, before items[] (a row may carry its own staffId when it is a different staff member); clock in / out or open / close many at once (each item saved on its own, failures listed in failed[]; the reply data is the list). A single object without items still works."+" sales are booked into their open batch. Response { id, staff, opening_amount, opening_at } (id = batch number, used as batch_id / batchId on orders). Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 2,
      items: [
        { opening_amount: 5000, opening_at: "2026-10-24T09:00:00.000Z" },
      ],
    },
  }),
  ep({
    id: "batch-close",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/batches/close",
    summary: "Batch Closing",
    description: "Closes the staff member's open batch with the counted cash. Several items = several staff members, each closing their own open batch."+" POS offline sync: { storeId, locationId, staffId, items: [ ... ] } — storeId, locationId and staffId are sent once, before items[] (a row may carry its own staffId when it is a different staff member); clock in / out or open / close many at once (each item saved on its own, failures listed in failed[]; the reply data is the list). A single object without items still works."+" Response { id, staff, total_cash, closing_at }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 2,
      items: [
        { total_cash: 10000, closing_at: "2026-10-24T17:00:00.000Z" },
      ],
    },
  }),

  ep({
    id: "cat-list",
    tag: "categories",
    method: "GET",
    path: "/api/v1/categories",
    summary: "Categories",
    description:
      "Every category of the store, in the same shape as Bulk Categories: { id, name, slug, parent, image_url, description, tax_type, tax_value, tax_name, discount_type, discount_value, discount_name, location_scope, location_ids (location numbers), is_active }. A store admin sees every category (or the ones sold at one location with location_id = location number or UUID); a manager / cashier only the categories sold at their own location. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
    id: "cat-bulk",
    tag: "categories",
    method: "POST",
    path: "/api/v1/categories/bulk",
    summary: "Bulk Categories",
    description: "POS sync: { items: [ ...categories ] } (or a raw array). Only name is required. Category tax (tax_name, tax_type, tax_value) and discount apply whenever their type + value are sent — the Has Category Tax / Has Category Discount checkboxes only add or remove them in this example. Show Optional Fields adds the rarely-needed fields. A repeated name gets a -2, -3... slug instead of an error. Where each category is sold is set on each row, and any role may send it: location_scope all (every location) or selected + location_ids (one or several location numbers) — the example mixes all, [1, 2] and [1]. A manager / cashier sends their own location; if they leave it out, the category is sold at their token's location. On channel=pos the response is { success, message (\"Categories Successfully Created\"), data: [ { id, name }, ... ] } — one per created category, in order; id is the short category_number. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: {
      bulk: true,
      variants: [
        {
          id: "default",
          label: null,
          rows: [
            categoryRow("Beverages", 5, 5, CATALOG_LOCATIONS[0]),
            categoryRow("Soap", 10, 0, CATALOG_LOCATIONS[1]),
            categoryRow("Rice & Daal", 0, 10, CATALOG_LOCATIONS[2]),
          ],
        },
      ],
      bulkTop: [["storeId", 1]],
      toggles: CATEGORY_TOGGLES,
    },
  }),

  ep({
    id: "prod-image-get",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/:id/image",
    summary: "Product Image",
    description: "The product's image. :id = the product number (e.g. 1) or UUID. Response { id (product number), title, image (URL, or null when it has none) }. Any role.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "prod-list",
    tag: "products",
    method: "GET",
    path: "/api/v1/products",
    summary: "Products",
    description:
      "Products in the same shape as Bulk Products (with location_scope / location_ids and stock_scope / stock_location_ids — location numbers), plus qty (stock at the location read, or every location for a store admin) and stocks [{ location, qty, expiry_date }]. A product with variants lists each variant inside it — variants [{ id (variant number 1, 2, 3…), product_id, name, sku, barcode, prices / pack, taxes, qty, stocks [{ location, qty, expiry_date }] }]; a manager / cashier sees their own location's stock only. Filters: q (title, SKU or barcode), categoryId (category number). Only products sold at the location read are listed: a product's location_scope / locations and its category's must both include it. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
    id: "prod-get",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/:id",
    summary: "Product Detail",
    description:
      "One product (:id = product number or UUID). With variants: the product (title, sku, barcode, category, unit, taxes, discount, low_stock_threshold, where it is sold and where its stock is held) and its variants, each with its own prices / pack, taxes, qty and stocks per location — the product itself has no price, pack or stock fields. Without variants: every product field with its own price, pack, qty and stocks. Location numbers: location_scope / location_ids (sold at), stock_scope / stock_location_ids (stock held at); a variant's id is its number inside the product (1, 2, 3…). A store admin sees every location (or one with location_id); a manager / cashier only their own, and a product not sold at their location is 404. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    pathParams: [{ name: "id", default: "1", required: true }],
    query: [{ name: "location_id", default: "", required: false }],
  }),
  ep({
    id: "prod-bulk",
    tag: "products",
    method: "POST",
    path: "/api/v1/products/bulk",
    summary: "Bulk Products",
    description:
      "{ storeId, items: [ ...products ] }. Product and stock in one request: the frontend never posts the opening stock separately. Each product says where it is sold (location_scope all | selected + location_ids) and which of those locations hold its stock (stock_scope all | selected + stock_location_ids). Its stock comes per location: on each variant (variants[].stock) or, without variants, on the product (stock) — [{ location_id, qty, stock_unit, expiry_date }]. stock_unit says what qty counts: unit (loose items, default) or pack (whole packs of a pack product / pack variant — saved as packs × pack_size items; refused for a loose product). Every row is saved as a stock_in / opening_balance movement; a stock location that is not listed gets qty 0. The example (four products — product numbers 1, 9, 15 and 22, each variant also taking a number of its own: Pepsi's are 2–8): Pepsi — 7 sizes, each a pack of 5 bottles that also sells by the bottle, 5 packs (25 bottles) of each at location 1 (stock_unit pack); Garnier Cream — 5 creams sold by the piece, with the product's own import taxes (Import Duty 20%, Additional Customs Duty 2%, Regulatory Duty 20%, Import Sales Tax 25%) on every variant; Almonds — counted in grams (unit gram): 250 g / 500 g / 1 kg packs (pack_size 250 / 500 / 1000, stock in packs) and three loose kinds priced per gram (Rs 5,500 a kg = 5.5, stock 25000 g = 25 kg); Sugar — no variants, sold by the kg (cost 140, price 160, 100 kg in stock). The product has its own sku and barcode, and so does each variant; a barcode already in use never fails the request: a new 13-digit one (starting with 2) is saved. Variants are numbered 1, 2, 3… inside each product: that is the variant id used by edits and stock movements. A pack variant's unit cost / price = pack price ÷ pack size. Taxes on a variant are added to the product's taxes. A manager / cashier: the product is sold and stocked at their own location only (location / stock scope they send is ignored; stock for another location is skipped and named in stock_warnings). On channel=pos the reply is every product with short numbers, its variants with id (the variant number inside the product, sent as variant_id with the product's id) and their stock per location. colors: the colours it comes in as hex codes ([#E11D48, #2563EB]) — on the product, or on each variant (variants[].colors) when it has variants. Product numbers count products only (1, 2, 3…); a variant has no product number of its own. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    bodyBuilder: productBuilder(),
    computed: productTotals,
  }),
  ep({
    id: "prod-image-upload",
    tag: "products",
    method: "POST",
    path: "/api/v1/products/image",
    summary: "Product Image Upload",
    description:
      "multipart/form-data: productId (the product number, e.g. 1, or UUID) and the image file in the image field (jpg, png, webp or gif, up to 5 MB). One image per product: a new upload replaces the old one. The file is stored on the image server and the product's image becomes its URL — the same image Bulk Products / Products return as image. POST /api/v1/products/:id/image does the same with the product in the path. A variant's image: Variant Image Upload. Response { id (product number), title, image (URL) }. Store admin or manager.",
    body: { productId: 1 },
    files: [{ name: "image", label: "Image" }],
  }),
  ep({
    id: "prod-variant-image-upload",
    tag: "products",
    method: "POST",
    path: "/api/v1/products/variant-image",
    summary: "Variant Image Upload",
    description:
      "multipart/form-data: productId (the product number, e.g. 1, or UUID), variantId (the variant's number inside that product — variants[].id: 1, 2, 3… — or its UUID) and the image file in the image field (jpg, png, webp or gif, up to 5 MB). One image per variant: a new upload replaces the old one. Products return it as variants[].image (null = the variant has no image of its own: show the product's image). POST /api/v1/products/:id/variants/:variantId/image does the same with both in the path; DELETE /api/v1/products/:id/variants/:variantId/image removes it. A variant image URL can also be sent as variants[].image when creating / updating the product. Response { id (product number), title, variant { id (variant number), product_id (the variant's own product number), name, image (URL) } }. Store admin or manager.",
    body: { productId: 1, variantId: 1 },
    files: [{ name: "image", label: "Image" }],
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
    id: "movement-list",
    tag: "inventory",
    method: "GET",
    path: "/api/v1/stock-movements",
    summary: "Stock Movements",
    description:
      "Stock movements, newest first, in the Bulk Stock Movements shape { id, location, product, variant { id (variant number), name, sku } (null without variants), supplier, staff, order, movement_type, reason, reason_note, qty, qty_after, unit_sold }. Opening stock shows as stock_in / opening_balance and a stock count from product edit as adjustment / count. Filters: productId (a product's number: its own and its variants' movements), movement_type, reason, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (movement time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
      "Stock transfers sent from or arriving at the location, newest first: { id, from_location, status (on_the_way until every line is received or cancelled), destinations [{ to_location, status, products [{ product, qty, received_qty, status }] }], note, staff }. A transfer with one product also has the flat to_location / product / qty / received_qty. Filters: status, from / to. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only transfers from or to their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (transfer time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
    description: "New stock and losses after the product was created: { storeId, staffId, items: [ ...products ] }. Lots: a stock in with an expiry_date makes a lot of that date (the same date adds to that lot); a stock out / adjustment takes from lot_id when sent, else from the lot that expires first (FEFO); each movement in the reply lists its lots [{ id (lot number), qty, expiry_date }]. The example: 10 packs of Pepsi 350ML expiring 31 Mar 2027 become Lot #20; the cracked Garnier jar comes out of Lot #9; 50 kg Sugar expiring 30 Jun 2027 become Lot #21. One item per product and reason; a product with variants sends variants [{ id (variant number 1, 2, 3…), stock: [{ location_id, qty, expiry_date }] }], a product without variants sends stock [{ location_id, qty }]. One movement is written per variant and location. qty is positive and counts stock_unit: unit (loose items, default) or pack (whole packs of a pack product — moved as packs × pack_size items; refused for a loose product): stock_in adds it, stock_out takes it away (an adjustment keeps its sign). Reasons — stock_in: purchase, customer_return · stock_out: damage, expiry, waste, theft, return_to_supplier · adjustment: count · any: other. opening_balance is refused: it is written by product create, and a count by product edit. Each location must be one the product is sold at; a manager / cashier may only name their own. A variant / location that fails (unknown variant, location not allowed, not enough stock) is listed in failed[] with the item's index; the others still save. On channel=pos the reply data is one row per movement, in order: { id, location, product (the product), variant { id, name, sku } (null without variants), supplier, staff, order, movement_type, reason, reason_note, qty, qty_after, unit_sold, created_at }.",
    body: {
      storeId: 1,
      staffId: 2,
      items: [
        {
          product_id: 1,
          movement_type: "stock_in",
          reason: "purchase",
          supplier_id: 1,
          reason_note: "Bill #4521",
          variants: [
            { id: 1, stock: [{ location_id: 1, qty: 120, expiry_date: "2027-06-30" }, { location_id: 2, qty: 60, expiry_date: "2027-06-30" }] },
            { id: 3, stock: [{ location_id: 1, qty: 48, stock_unit: "unit", expiry_date: "2027-06-30" }] },
          ],
        },
        {
          product_id: 6,
          movement_type: "stock_out",
          reason: "damage",
          reason_note: "Delivery mein 1 pack phata hua aaya",
          variants: [{ id: 2, stock: [{ location_id: 2, qty: 1, stock_unit: "pack" }] }],
        },
        {
          product_id: 6,
          movement_type: "stock_out",
          reason: "expiry",
          variants: [{ id: 4, stock: [{ location_id: 1, qty: 4 }] }],
        },
        {
          product_id: 11,
          movement_type: "stock_in",
          reason: "purchase",
          supplier_id: 2,
          variants: [
            { id: 1, stock: [{ location_id: 1, qty: 2, stock_unit: "pack" }, { location_id: 3, qty: 1, stock_unit: "pack" }] },
            { id: 2, stock: [{ location_id: 1, qty: 24 }, { location_id: 2, qty: 12 }] },
            { id: 3, stock: [{ location_id: 2, qty: 12 }] },
          ],
        },
        {
          product_id: 11,
          movement_type: "stock_out",
          reason: "return_to_supplier",
          supplier_id: 2,
          variants: [{ id: 3, stock: [{ location_id: 3, qty: 12 }] }],
        },
      ],
    },
  }),
  ep({
    id: "transfer-bulk",
    tag: "inventory",
    method: "POST",
    path: "/api/v1/stock-transfers/bulk",
    summary: "Bulk Stock Transfer",
    description: "{ storeId, staffId, items: [ ...transfers ] }. One transfer sends stock from one location to one or more destinations, each with its own products and qty (location / product numbers or UUIDs): { from_location_id, note, destinations: [{ to_location_id, products: [{ product_id, variant_id, qty }] }] }. A product with variants names the variant sent with variant_id (its number inside the product: 1, 2, 3…); leave it out on a product without variants. The example sends 10 Pepsi 1.5L (product 1, variant 4) and 5 Garnier Vitamin C 50g (product 9, variant 1) from location 1 to Branch 2. The source must hold, per product, the qty of every destination together. Each destination stays on_the_way until it receives its part (Bulk Transfer Receive): the source gives up the qty that left, the destination gets what arrived. The older single form { from_location_id, to_location_id, product_id, qty } still works. On channel=pos the response data is one transfer per item: { id, from_location, status, destinations [{ to_location, status, products [{ product, qty, received_qty, status }] }], note, staff }. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      staffId: 2,
      items: [
        {
          from_location_id: 1,
          note: "Weekly refill",
          destinations: [
            { to_location_id: 2, products: [{ product_id: 1, variant_id: 1, qty: 20 }, { product_id: 11, variant_id: 2, qty: 12 }] },
            { to_location_id: 3, products: [{ product_id: 6, variant_id: 1, qty: 8 }, { product_id: 1, variant_id: 1, qty: 10 }] },
          ],
        },
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
      storeId: 1,
      items: [
        { locationId: 1, name: "Ahmed Malik", email: "ahmed@acadex.co", password: "ahmedmalik", pin: "2222", role: "manager" },
        { locationId: 1, name: "Ameer Hamza", email: "ameer@acadex.co", password: "ameerhamza", pin: "3333", role: "cashier" },
        { locationId: 1, name: "Yasir Ali Khan", email: "yasir@acadex.co", password: "yasiralikhan", pin: "4444", role: "cashier" },
      ],
    },
  }),

  ep({
    id: "order-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/bulk",
    summary: "Bulk Order Creation",
    description:
      "POS sales: { storeId, locationId, staffId, batchId, items: [ ...orders ] }. The POS prices every order itself and sends the figures; the server saves them exactly as sent — nothing is calculated again — and, as before, creates each order's receipt and one transaction per payment, takes the qty off stock and books the sale into the batch. Each order: client_local_id (the till's id — sending it again returns the saved order, no double sale), placed_at, customer_id (udhaar), lines[] { product_id (+ variant_id for a product with variants: the variant's number 1, 2, 3…) | title + category, sale_unit (unit | pack — with pack, qty is packs and the prices one pack's; the 4th order sells 2 packs), qty, unit_price, cost_price, discount_amount (the discount on the whole line, worked out by the till), discount [{ discount_id }] (the discounts applied: an array, one object per discount; [] = none), free_qty (BOGO), taxes [{ level, name, rate, amount }] }, order_discount, coupon, payments[] { method, surcharge_type, surcharge_value, surcharge_amount (the method's Payment Method Surcharge; tax_rate / tax_amount from older tills still work), amount, paid } and total_amount. Line subtotal, line total and the order's gross, tax and change totals are the sums of these (the server adds them up; it does not price them). Paid less than total_amount = udhaar (needs customer_id). Each order also sends local_receipt_number (printed on the till receipt), every line's subtotal (qty × unit_price − discount_amount), taxes, tax_amount and total, and the order's gross_amount, discount_amount, subtotal (checked against the lines), tax_amount and surcharge_amount — all saved as sent. A line's discount is [{ discount_id }] (the discounts of GET /offers it used; [] = none) with discount_amount for the whole line; a pack line sends qty in packs and the pack price; a weight line its qty in the product unit. Reply: each order as saved — client_local_id, local_receipt_number, receiptId, order_items [{ product (with variant), category, qty, sale_unit, unit_price, gross_amount, discount_amount, discount [{ discount_id, name, type, discount_type, discount_value, amount }], free_qty, subtotal, taxes, tax_amount, total }], gross_amount, discount_amount, order_discount, coupon, subtotal, tax_amount (line taxes), surcharge_amount, total_amount, payments [{ method, bill_share, surcharge_type, surcharge_value, surcharge_amount, amount, paid, change }], amount_paid, change_due, synced_at. The examples: order 1 — Pepsi 1.5L (1 pack, Beverages 5% off), 2 Garnier Vitamin C (Azaadi Sale 10% off, with its import taxes) and 2 packs of Almonds 500g (Stock Up & Save 5%), paid by card (2%); order 2 — a custom sale (a bottle and gift wrapping that are not in the inventory) for customer Ali Khan, cash; order 3 — 5 kg Sugar at the Midnight Madness price, 3 Pepsi Cane (Double Delight: 1 free) and 250 g loose Mamra almonds, split over card, JazzCash (Rs 25) and cash. Older form: items[] { productId, qty } without lines — the server prices it from the catalog.",
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
      "Completed sales (status=completed — also the partly refunded ones, status partial_refunded), newest first. Each row is short: { id (order number), is_custom, location_name, items (number of lines), currency, total_amount, status (completed | partial_refunded | refunded | pending | cancelled | voided), payment_status (paid | partial | pending | refunded), remaining_amount (udhaar still owed; 0 when paid), placed_at, channel }. GET /orders/:id has the full detail. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
      "Pending sales — not paid yet (status=pending). Each row is short: { id (order number), is_custom, location_name, items (number of lines), currency, total_amount, status (completed | partial_refunded | refunded | pending | cancelled | voided), payment_status (paid | partial | pending | refunded), remaining_amount (udhaar still owed; 0 when paid), placed_at, channel }. GET /orders/:id has the full detail. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
      "Cancelled and voided sales (status=cancelled). Each row is short: { id (order number), is_custom, location_name, items (number of lines), currency, total_amount, status (completed | partial_refunded | refunded | pending | cancelled | voided), payment_status (paid | partial | pending | refunded), remaining_amount (udhaar still owed; 0 when paid), placed_at, channel }. GET /orders/:id has the full detail. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
      "Every order whatever its status (status=all; also completed | pending | cancelled | refunded). Each row is short: { id (order number), is_custom, location_name, items (number of lines), currency, total_amount, status (completed | partial_refunded | refunded | pending | cancelled | voided), payment_status (paid | partial | pending | refunded), remaining_amount (udhaar still owed; 0 when paid), placed_at, channel }. GET /orders/:id has the full detail. Other filters: staffId, batchId, is_custom, from / to (placed_at). A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (sale time): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
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
      "One order — :id is the order number (e.g. 1) or UUID — with everything about it: the receipt's detail (store, cashier, customer, items with product { id, variant { id, name } (null without variants), title, sku, barcode, discount, taxes[] }, category { id, name, discount, tax }, offer, free_qty, sales_tax, refunded_qty, totals; subtotal, order_discount / coupon / sales_tax / fbr_fee when the sale had them, payment_gst_amount, tax_amount, total, amount_paid, change_due, remaining_amount on udhaar, payments [{ method, gst_percent, gst_amount, amount, paid, change, status }]) plus receipt_id, staff, batch, is_custom, offer_exempt, placed_at, transactions [{ id, method, amount, tax_amount, status, paid_at }] and refunds [ …each refund with items and how it was paid back ]. A manager / cashier only sees orders of their own location. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "order-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id/receipt",
    summary: "Receipt by Order Id",
    description:
      "The sale receipt of an order — :id is the order number (e.g. 1) or UUID. Created automatically with the order; issued_at = when the sale happened (placed_at), even for an offline sale synced later. { id (receipt number), order_id, store { name, ntn, strn }, issued_at, channel, status, payment_status, payment_method, location, cashier { id, name }, customer, currency, items: [{ id, qty, unit_price, gross_amount, product { id, variant { id, name } (a product with variants: the variant sold; null otherwise), title, sku, barcode, discount { name, type, value, amount } | null, taxes [{ name, type, value, amount }] }, category { id, name, discount | null, tax { name, type, value, amount } | null }, offer { id, name, type, discount_type, discount_value, amount } | null, free_qty (BOGO, when any), sales_tax { rate, amount } (only when charged), discount_amount, subtotal, tax_amount, refunded_qty, total }], subtotal, order_discount { type, value, amount } (only when the order had one), coupon { code, amount } (only when used), sales_tax { rate, amount } (only when charged), payment_gst_amount, tax_amount, fbr_fee (only on an FBR invoice), total, amount_paid, change_due, remaining_amount (only on udhaar), payments [{ method, gst_percent, gst_amount, amount, paid, change, status }] }. Every figure is as it was at the sale.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "refund-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds/:refundId/receipt",
    summary: "Receipt by Refund Id",
    description:
      "The receipt of a refund — :refundId is the refund number (the id in the refund replies) or UUID. Created automatically with the refund. What came back and where the money went: { id (receipt number), refund_id, order_id, refund_type, reason, store { name, ntn, strn }, issued_at, location { id, name }, cashier { id, name }, currency, items: [{ id (order item number), title, sku, qty, unit_price, total (with tax) }], subtotal (before tax), tax_amount, total, payments: [{ method, amount }] }. payments is paid back the way the sale was paid: card / wallet back to the card, cash from the drawer, credit = taken off the customer's udhaar.",
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
    description: "Partial refund — some items (or some of their qty) of an order come back: { storeId, locationId, staffId, batchId, items: [{ client_local_id, refunded_at, order_id, reason, restock?, lines: [{ order_item_id, qty, restock?, discount_amount, amount, taxes, total }], payments, total_amount }] }. storeId, locationId, staffId and batchId are sent once before items[] (numbers); an item may carry its own. order_id = the order number; order_item_id = the line's item number in that order (1, 2, 3…). " + REFUND_RULES + " The order turns partial_refunded, or refunded once every line is fully back. " + REFUND_ROW_SHAPE + " The examples, one from each order: order 1 gives back 1 Garnier Vitamin C (585 + its taxes 497.25 = 1082.25, back on the card with its 2% = 1103.90); order 2 gives back the gift wrapping (150 + 27 = 177 in cash — a custom line holds no stock); order 3 gives back 2 kg of the 5 kg Sugar (280 + 60.40 = 340.40 in cash).",
    body: REFUND_PARTIAL_REQUEST,
    ownResponses: true,
    responses: [
      refundCreated([REFUND_PARTIAL_ROW]),
      { label: "400 — more than sold", status: 400, body: { success: false, message: "Order 1 line 1: only 1 left to refund (2 sent)", data: [], failed: [{ index: 0, message: "Order 1 line 1: only 1 left to refund (2 sent)", status: 400 }] } },
      { label: "400 — total ≠ payments", status: 400, body: { success: false, message: "Order 1: total_amount 316.56 is not the sum of payments (300)", data: [], failed: [{ index: 0, message: "Order 1: total_amount 316.56 is not the sum of payments (300)", status: 400 }] } },
    ],
  }),
  ep({
    id: "order-refund-complete-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/refunds/complete/bulk",
    summary: "Bulk Order Refund",
    description: "Complete refund — everything still left on the order comes back (after any partial refund, what remains): the same body as Bulk Order Items Refund, with every remaining line in lines[]: { storeId, locationId, staffId, batchId, items: [{ client_local_id, refunded_at, order_id, reason, restock?, lines: [{ order_item_id, qty, restock?, discount_amount, amount, taxes, total }], payments, total_amount }] }. " + REFUND_RULES + " Every line must be fully back after it (else 400 — use Bulk Order Items Refund for part of an order); the order turns refunded. " + REFUND_ROW_SHAPE + " The example: what is left of order 3 after its partial refund — 3 kg Sugar, the 3 Pepsi Cane (with the free one) and the 250 g Mamra almonds (2443.30) — goes back the way it was paid: card 1000 + 2% = 1020, JazzCash 783.70 + Rs 25 = 808.70, cash 659.60 (2488.30); with the 340.40 already refunded, all of 2828.70 is back and the order turns refunded.",
    body: REFUND_COMPLETE_REQUEST,
    ownResponses: true,
    responses: [
      refundCreated(REFUND_COMPLETE_ROWS),
      { label: "200 — sent again (client_local_id)", status: 200, body: { success: true, message: "Refunded Successfully", data: [REFUND_COMPLETE_ROWS[0]] } },
      { label: "400 — lines left out", status: 400, body: { success: false, message: "Order 3: a complete refund must give back every remaining line (line 2 has 1 left)", data: [], failed: [{ index: 0, message: "Order 3: a complete refund must give back every remaining line (line 2 has 1 left)", status: 400 }] } },
    ],
  }),
  ep({
    id: "refund-list-complete",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds",
    summary: "Refunds Complete Orders",
    description: "Complete refunds (type=complete) made with Bulk Order Refund, newest first. " + REFUND_ROW_SHAPE + " Filters: type, orderId (order number), batchId, staffId, from / to, range. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (refunded_at): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "type", default: "complete", required: false },
      { name: "orderId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "staffId", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
    ownResponses: true,
    responses: [refundPage([REFUND_COMPLETE_ROWS[1], REFUND_COMPLETE_ROWS[0]])],
  }),
  ep({
    id: "refund-list-partial",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds",
    summary: "Refunds Partial Order",
    description: "Partial refunds (type=partial) made with Bulk Order Items Refund, newest first. " + REFUND_ROW_SHAPE + " Filters: type, orderId (order number), batchId, staffId, from / to, range. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Ids in the reply are the short numbers the POS uses. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (refunded_at): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "range", default: "", required: false },
      { name: "type", default: "partial", required: false },
      { name: "orderId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "staffId", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
    ownResponses: true,
    responses: [refundPage([REFUND_PARTIAL_ROW])],
  }),

  ep({
    id: "rep-all-locations",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/all-locations",
    summary: "All Locations Report",
    description:
      "Store admin only. Every location of the store together, plus by_location (per location: orders, gross_sales, discounts, net_sales, tax, refunds, total_sales, percent). Sections as in Detailed Reporting: sales_summary, by_product, by_category, payments, z_reports, inventory (one row per product per location: product, sku, category, location, stock_in, stock_out, current_stock), stock_movement (with its location), stock_transfers (summary { transfers, lines, units_sent, units_received, units_on_the_way, units_cancelled } and rows [{ transfer, date, from, to, product, qty, received_qty, status, staff }]), discounts (total, orders, by_source [{ source, label, lines, orders, amount }]; catalog = every discount entered — offers, product / category discounts, coupons, running or not — [{ kind, id, name, type, amount, applies_to, start_at, end_at, status, used_orders, used_lines, discount_given }]; sales = each discounted sale with its calculation [{ order, date, location, cashier, gross, line_discount, order_discount, coupon_discount, discount, net, tax, total, lines [{ product, qty, unit_price, gross, discount, source, name, net }] }]; rows = every discount line), refunded_orders, cancelled_orders, by_cashier, by_offer (each offer: offer { id, name, type }, orders, units, free_units, discount_given, sales — plus totals), tax_breakdown (Sales Tax, Product / Category Level Tax, Payment Method Tax). sales_summary.totals.discounts_by_source splits the line discounts: product, category, product+category, bulk_tier, offer, custom, unknown (sold before this was kept). The reply starts with period, locationId, from, to only. locationId is null. Filters: period daily | weekly | monthly | yearly, from, to.",
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
      "One location: locationId = the location number (e.g. 1) or UUID. A store admin picks any location; a manager / cashier gets their own (leave locationId out), another location is refused (403). Sections as in Detailed Reporting: sales_summary, by_product, by_category, payments, z_reports, inventory (one row per product per location: product, sku, category, location, stock_in, stock_out, current_stock), stock_movement (with its location), stock_transfers (summary { transfers, lines, units_sent, units_received, units_on_the_way, units_cancelled } and rows [{ transfer, date, from, to, product, qty, received_qty, status, staff }]), discounts (total, orders, by_source [{ source, label, lines, orders, amount }]; catalog = every discount entered — offers, product / category discounts, coupons, running or not — [{ kind, id, name, type, amount, applies_to, start_at, end_at, status, used_orders, used_lines, discount_given }]; sales = each discounted sale with its calculation [{ order, date, location, cashier, gross, line_discount, order_discount, coupon_discount, discount, net, tax, total, lines [{ product, qty, unit_price, gross, discount, source, name, net }] }]; rows = every discount line), refunded_orders, cancelled_orders, by_cashier, by_offer (each offer: offer { id, name, type }, orders, units, free_units, discount_given, sales — plus totals), tax_breakdown (Sales Tax, Product / Category Level Tax, Payment Method Tax). sales_summary.totals.discounts_by_source splits the line discounts: product, category, product+category, bulk_tier, offer, custom, unknown (sold before this was kept). The reply starts with period, locationId, from, to only. Filters: period daily | weekly | monthly | yearly, from, to.",
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
    id: "surcharge-list",
    tag: "surcharges",
    method: "GET",
    path: "/api/v1/payment-surcharges",
    summary: "Payment Method Surcharges",
    description: "Every payment method surcharge, by number: { id (surcharge_number), method, type (percentage | fixed), charges, is_active }. Any role (the POS adds them to the bill). A percentage is of that payment's share of the bill; fixed is once per payment. They replace the old payment-method GST rates (no longer used).",
  }),
  ep({
    id: "surcharge-get",
    tag: "surcharges",
    method: "GET",
    path: "/api/v1/payment-surcharges/:id",
    summary: "Surcharge Detail",
    description: "One surcharge — :id is its number (surcharge_number, e.g. 1) or its UUID: both work. { id (surcharge_number), method, type (percentage | fixed), charges, is_active }.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "surcharge-bulk",
    tag: "surcharges",
    method: "POST",
    path: "/api/v1/payment-surcharges/bulk",
    summary: "Bulk Surcharge Creation",
    description: "Store admin. { storeId, items: [{ method, charges, type, isActive }] } — one surcharge per method (a second one for the same method fails: update it instead). The example: card 2% of its share, JazzCash Rs 25 per payment. On an order the till adds each payment's surcharge and sends it as payments [{ method, surcharge_type, surcharge_value, surcharge_amount, amount }]; a split payment adds each method's own surcharge on its part. A row that fails is listed in failed[]; the others still save. Reply: the created surcharges { id (surcharge_number), method, type (percentage | fixed), charges, is_active }.",
    body: {
      storeId: 1,
      items: [
        { method: "card", charges: 2, type: "percentage", isActive: true },
        { method: "jazzcash", charges: 25, type: "fixed", isActive: true },
      ],
    },
  }),
  ep({
    id: "tax-list",
    tag: "taxes",
    method: "GET",
    path: "/api/v1/taxes",
    summary: "Taxes",
    description: "Every store tax, by number: { id (tax_number), uuid, name, type (percentage | fixed), value, product_scope (all | selected), product_ids (product numbers), products [{ id (product number), uuid, title, variant { id, name } | null }], is_active }. Filters: is_active (true / false), product_scope, q (name). Any role (the POS charges them). Each product in Products / Product Detail also lists the active taxes that apply to it as store_taxes [{ id, name, type, value }] (its variants too), so the POS does not have to match them itself.",
    query: [
      { name: "is_active", default: "", required: false },
      { name: "product_scope", default: "", required: false },
      { name: "q", default: "", required: false },
    ],
  }),
  ep({
    id: "tax-get",
    tag: "taxes",
    method: "GET",
    path: "/api/v1/taxes/:id",
    summary: "Tax Detail",
    description: "One tax — :id is its number (tax_number, e.g. 1) or its UUID: both work. { id (tax_number), uuid, name, type (percentage | fixed), value, product_scope (all | selected), product_ids (product numbers), products [{ id (product number), uuid, title, variant { id, name } | null }], is_active }.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "tax-bulk",
    tag: "taxes",
    method: "POST",
    path: "/api/v1/taxes/bulk",
    summary: "Bulk Tax Creation",
    description: "Store admin. { storeId, items: [ ...taxes ] } — each { name, type, value, product_scope, product_ids }. product_scope all = every product (also ones added later): no product_ids needed. selected = only product_ids: product numbers (a product covers all its variants) or { product_id, variant_id } for one variant. The example: GST 18% on every product, and a Rs 5 Sugar tax (per unit: a bottle, a kg) on Pepsi — all its variants — and Sugar (product numbers 1 and 22). Each tax gets a number (tax_number, 1, 2, 3…) — the id used by updates; its UUID works too. A store tax is charged on the discounted price (fixed = per unit) together with the product's own taxes; on a POS-priced order send it as taxes [{ level: \"store\", name, rate, amount }]. A tax that fails is listed in failed[]; the others still save. Reply: the created taxes { id (tax_number), uuid, name, type (percentage | fixed), value, product_scope (all | selected), product_ids (product numbers), products [{ id (product number), uuid, title, variant { id, name } | null }], is_active }.",
    body: {
      storeId: 1,
      items: [
        { name: "GST", type: "percentage", value: 18, product_scope: "all" },
        { name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 6] },
      ],
    },
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
    description: "{ items: [ ...suppliers ] } — name, phone, email, address, payment_terms. storeId is sent once, before items[]. Each supplier carries its location_scope: all = every branch; selected + location_ids = one or several branches (location numbers, UUIDs also work) — any role; a manager / cashier sends their own location (left out = their token's location). On channel=pos the response is { success, message (\"Suppliers Successfully Created\"), data: [ { id }, ... ] } — one supplier_number per created supplier, in order. Each reference in the reply is an object with its id and a short summary (no separate id field) — staff { id, name, role }, location { id, name }, product { id, title, sku, unit }, batch { id, status }, order { id, status }, category / supplier / customer { id, name } — so no second call is needed to show names.",
    body: {
      storeId: 1,
      items: [
        { name: "Nestle Distributor", phone: "03006666666", email: "sales@nestle-dist.local", address: "Industrial Area", payment_terms: "Net 15", location_scope: "all" },
        { name: "Unilever Wholesale", phone: "03007777777", email: "orders@unilever-ws.local", address: "Korangi", payment_terms: "Net 30", location_scope: "selected", location_ids: [1] },
        { name: "Rice Mills Co", phone: "03008888888", email: "info@ricemills.local", address: "Gujranwala", payment_terms: "Cash on delivery", location_scope: "selected", location_ids: [1] },
      ],
    },
  }),


  ep({
    id: "prod-image-delete",
    tag: "products",
    method: "DELETE",
    path: "/api/v1/products/:id/image",
    summary: "Remove Product Image",
    description: "Removes the product's image (the product stays). :id = the product number (e.g. 1) or UUID. Response { id, title, image: null }. Store admin or manager.",
    pathParams: [{ name: "id", default: "1", required: true }],
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
  ep({
    id: "data-orders-all",
    tag: "data",
    method: "DELETE",
    path: "/api/v1/admin/data/orders",
    summary: "Delete all orders",
    description:
      "Super Admin, for testing. Deletes every order with its items, refunds, payments, receipts and coupon uses (every store). Stock and batch totals are not put back.",
    auth: "superadmin",
  }),
  ep({
    id: "data-orders-one",
    tag: "data",
    method: "DELETE",
    path: "/api/v1/admin/data/orders/:id",
    summary: "Delete one order",
    description:
      "Super Admin, for testing. Deletes one order (its UUID — the id in GET /orders?channel=web) with its items, refunds, payments, receipts and coupon uses. Stock and batch totals are not put back.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "customer-create",
    tag: "customers",
    method: "POST",
    path: "/api/v1/customers",
    summary: "Create Customer",
    description:
      "Adds a customer. Its number (1, 2, 3… — in GET /customers) is the customer_id on an order. An order that is paid less than its total (udhaar) needs a customer: the rest is added to the customer's debt and the order's payment_status is partial with remaining_amount.",
    body: { name: "Ali Khan", phone: "03001231234", email: "ali@example.com" },
  }),
  ep({
    id: "customer-bulk",
    tag: "customers",
    method: "POST",
    path: "/api/v1/customers/bulk",
    summary: "Bulk Customers",
    description: "POS offline sync: { items: [ ...customers ] }, each as in Create Customer. Failed rows are listed in failed[].",
    body: {
      storeId: 1,
      locationId: 1,
      items: [
        { name: "Ali Khan", phone: "03001231234" },
        { name: "Sana Tariq", phone: "03214567890", email: "sana@example.com" },
      ],
    },
  }),
  // ---- Bulk updates (PATCH): POS offline sync — updates queue on the till and go in one request ----
  ep({
    id: "prod-bulk-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/bulk",
    summary: "Normal Product Edit",
    description: `Edit mode 1 of 2 — the full edit (the dashboard's Edit product page; the POS sends every edit made offline here). ${BULK_UPDATE_NOTE} Any product field, as in create — only the fields sent change: title, sku, barcode, category_id (category number), unit, cost / price, discount_*, taxes, pack fields, sell_loose, low_stock_threshold, is_active, is_pos_visible, is_web_visible, location_scope / location_ids and stock_scope / stock_location_ids (location numbers, store admin only). Stock is the counted total per location, not a change: variants[].stock (or stock for a product without variants) = [{ location_id, qty }]; the server writes the difference as an adjustment / count movement, and nothing when it is the same. variants[] with id (the variant number 1, 2, 3…) changes that variant; without id it adds a new one (numbered next) whose stock is its opening balance. A location that newly holds the stock gets qty 0 for each variant. The example: Pepsi 1.5L (product 1, variant 4) gets a new pack price and cost (1150 / 560 — its unit price 230), and Sugar (product 22) a new price (165 a kg) and low-stock level. Reply: the updated products (same shape as create), with stock_warnings when a stock row was skipped.`,

    body: {
      items: [
        {
          id: 1,
          variants: [
            { id: 1, stock: [{ location_id: 1, qty: 48 }] },
            { id: 4, price: 250, stock: [{ location_id: 2, qty: 6 }] },
          ],
        },
        {
          id: 6,
          variants: [
            { name: "500ml x 12", sku: "PEPSI-PACK-500ML", barcode: "8961014200056", is_pack_product: true, pack_size: 12, pack_cost: 600, pack_price: 780, stock: [{ location_id: 1, qty: 48 }] },
          ],
        },
        {
          id: 11,
          stock_scope: "selected",
          stock_location_ids: [1, 3],
          variants: [{ id: 2, stock: [{ location_id: 1, qty: 40 }] }],
        },
      ],
    },
  }),
  ep({
    id: "prod-bulk-weight-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/bulk/weight",
    summary: "Bulk Weight Based Products",
    description: `${BULK_UPDATE_NOTE} { id, is_weight_based }: sold by weight (kg / g) or by unit. Can be combined with a pack product (e.g. a 25 kg rice bag sold by the kg).`,
    body: { items: [{ id: 3, is_weight_based: true }, { id: 1, is_weight_based: false }] },
  }),
  ep({
    id: "prod-bulk-status-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/bulk/status",
    summary: "Multiple Products Status Update",
    description: `Edit mode 2 of 2 — switch several products on or off at once (dashboard: tick products → Update Status). ${BULK_UPDATE_NOTE} { id, is_active }: false takes the product off sale without deleting it (old sales and stock history stay); true puts it back. A product with variants: its variants follow. Rows may differ (one on, one off) — the dashboard sends the same value for every selected product. Pick Active or Disabled above to see each request and its reply.`,
    bodyBuilder: {
      bulk: true,
      variantsLabel: "Status",
      variants: [
        { id: "active", label: "Active", rows: [[["id", 1], ["is_active", true]], [["id", 3], ["is_active", true]]] },
        { id: "disabled", label: "Disabled", rows: [[["id", 1], ["is_active", false]], [["id", 3], ["is_active", false]]] },
      ],
      toggles: [],
    },
    ownResponses: true,
    responses: [
      okReply("200 OK — Active", "active", "Product Status Updated", [sampleProduct(1, { is_active: true }), sampleProduct(3, { is_active: true })]),
      okReply("200 OK — Disabled", "disabled", "Product Status Updated", [sampleProduct(1, { is_active: false }), sampleProduct(3, { is_active: false })]),
    ],
  }),
  ep({
    id: "prod-bulk-visibility-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/bulk/visibility",
    summary: "Bulk Product Visibility",
    description: `${BULK_UPDATE_NOTE} { id, is_pos_visible?, is_web_visible? }: show the product on the POS, the website, or both.`,
    body: { items: [{ id: 1, is_pos_visible: true, is_web_visible: true }, { id: 3, is_web_visible: false }] },
  }),
  ep({
    id: "cat-bulk-patch",
    tag: "categories",
    method: "PATCH",
    path: "/api/v1/categories/bulk",
    summary: "Bulk Update Categories",
    description: `${BULK_UPDATE_NOTE} Any category field, as in create — only the fields sent change: name, description, parent_category_id (category number), tax_name / tax_type / tax_value, discount_name / discount_type / discount_value, sort_order, is_active, is_pos_visible, is_web_visible, location_scope / location_ids (location numbers).`,
    body: {
      items: [
        { id: 1, name: "Beverages", tax_name: "GST", tax_type: "percentage", tax_value: 5, location_scope: "all" },
        { id: 3, discount_name: "Ramzan Sale", discount_type: "percentage", discount_value: 15 },
      ],
    },
  }),
  ep({
    id: "cat-bulk-status-patch",
    tag: "categories",
    method: "PATCH",
    path: "/api/v1/categories/bulk/status",
    summary: "Bulk Category Status",
    description: `${BULK_UPDATE_NOTE} { id, is_active }.`,
    body: { items: [{ id: 2, is_active: true }, { id: 3, is_active: true }] },
  }),
  ep({
    id: "cat-locations-patch",
    tag: "categories",
    method: "PATCH",
    path: "/api/v1/categories/locations",
    summary: "Update Category Locations",
    description:
      "Store admin only. Sets where several categories are sold in one call: { category_ids, location_scope, location_ids }. category_ids = the categories' numbers (1, 2, 3…; UUIDs also work). location_scope all = every location, including ones added later (location_ids is ignored and the old location links are removed); location_scope selected = only the locations in location_ids (one or several location numbers), which replace each category's current locations. Every category gets the same locations. All or nothing: if any category or location is not in this store, nothing changes (404). Pick All Locations or Specific Locations above to see each request. Reply: { success, message (\"Category Locations Updated\"), data: [ ...the updated categories ] } in the same shape as Bulk Update Categories, ordered by category number.",
    bodyBuilder: {
      bulk: false,
      variantsLabel: "Sold at",
      variants: [
        {
          id: "all",
          label: "All Locations",
          rows: [[["category_ids", [1, 2, 3]], ["location_scope", "all"]]],
        },
        {
          id: "selected",
          label: "Specific Locations",
          rows: [[["category_ids", [1, 3]], ["location_scope", "selected"], ["location_ids", [1, 2]]]],
        },
      ],
      toggles: [],
    },
  }),
  ep({
    id: "movement-patch",
    tag: "inventory",
    method: "PATCH",
    path: "/api/v1/stock-movements/bulk",
    summary: "Update Stock Movements",
    description: "Fixes wrong movements, one or many: { items: [{ id, movement_type?, reason?, qty?, reason_note? }] } — always an array, even for one movement (the POS sends its queued edits together; the dashboard's Stock Movements → Edit sends one). id = the movement number (1, 2, 3…), never the UUID. Only what is sent changes: movement_type (stock_in | stock_out | adjustment), reason (stock_in: purchase, customer_return, other · stock_out: damage, expiry, waste, theft, return_to_supplier, other · adjustment: count, other), qty (the amount moved: stock_in adds it, stock_out takes it away whatever the sign, an adjustment keeps its + / − sign; a new type without qty keeps the old amount), reason_note. The difference (new qty − old qty) goes on the stock of that product at that location at once, and the stock after of this movement and of every later one there moves by the same amount. Each row saves on its own: a row that fails (stock below 0, a sale / refund / transfer movement, not found) is listed in failed[] ({ index, message, status }) and the rest still save; when every row fails the reply is that first error. Store admin / manager (a manager only at their own location). Reply data: one { movement, stock } per row, short numbers only — movement { id, location, product (with variant), staff, supplier, movement_type, reason, reason_note, qty, qty_after, created_at, updated_at } and the stock now { location, product, qty, pack_size, number_of_packs, loose_units, sell_loose, expiry_date, low_stock_threshold, is_low, updated_at }. The example: movement 20 (the stock in of 10 packs of Pepsi 350ML = 50 bottles) was really 12 packs (60: +10 → 85); movement 21 (1 Garnier Bright Complete damaged) was 2 jars (−1 more → 13).",
    body: {
      items: [
        { id: 12, qty: 8, reason_note: "Bill #4521 was 8 bottles, not 5" },
        { id: 14, movement_type: "stock_out", reason: "damage", qty: 5, reason_note: "5 bottles broken — not a purchase" },
      ],
    },
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Movements Updated", [
        {
          movement: sampleMovement({ id: 12, movement_type: "stock_in", reason: "purchase", reason_note: "Bill #4521 was 8 bottles, not 5", qty: 8, qty_after: 58, supplier: { id: 1, name: "Mustafa Traders" } }),
          stock: sampleStock({ qty: 58 }),
        },
        {
          movement: sampleMovement({ id: 14, product: PEPSI_350ML, movement_type: "stock_out", reason: "damage", reason_note: "5 bottles broken — not a purchase", qty: -5, qty_after: 45 }),
          stock: sampleStock({ product: PEPSI_350ML, qty: 45, pack_size: 10, expiry_date: "2026-12-31", low_stock_threshold: 10 }),
        },
      ]),
      {
        label: "200 OK — one row failed",
        status: 200,
        body: {
          success: true,
          message: "Stock Movements Updated",
          data: [
            {
              movement: sampleMovement({ id: 12, movement_type: "stock_in", reason: "purchase", reason_note: "Bill #4521 was 8 bottles, not 5", qty: 8, qty_after: 58, supplier: { id: 1, name: "Mustafa Traders" } }),
              stock: sampleStock({ qty: 58 }),
            },
          ],
          failed: [{ index: 1, message: "Stock cannot go below 0: there are 3 left, and this change takes away 10", status: 400 }],
        },
      },
      { label: "409 — sale movement", status: 409, body: { success: false, message: "This sale movement comes from a sale, refund or transfer and cannot be edited here", data: [], failed: [{ index: 0, message: "This sale movement comes from a sale, refund or transfer and cannot be edited here", status: 409 }] } },
    ],
  }),
  ep({
    id: "stock-entry-patch",
    tag: "inventory",
    method: "PATCH",
    path: "/api/v1/product-stocks/bulk",
    summary: "Update Product Stock",
    description: "Sets the stock of products at locations, one or many: { locationId?, staff_id?, items: [...] }. With lot_id an item changes ONE lot (the dashboard edits lot by lot): qty / number_of_packs are that lot's new total and expiry_date its new date; without it qty is the whole stock's new total. The reply: { stock (with lots [{ id, qty, expiry_date, days_left, expiry_status, received_at, source }], soonest first), lot (the one changed), movement (with its lots) }. — always an array, even for one row (the POS syncs its stock changes; the dashboard's Product Stock & Expiry → Edit sends one). Each item: product_id (the product number), variant_id (the variant number inside it, for a product with variants), location_id (the location number; or send locationId once next to items[]; a manager / cashier only their own), then the new stock — qty (the total in units, not a change), or delta (+ adds / − takes away), or for a pack product number_of_packs (+ loose_units when it sells loose; total = packs × pack_size + loose_units) — and / or expiry_date (YYYY-MM-DD, null clears it), low_stock_threshold (the alert level at this location; null = the level set on the product), reason (for a qty change: count (default), purchase, damage, expiry, waste, theft, return_to_supplier, customer_return, other), movement_type (stock_in | stock_out | adjustment (default) — must match the direction), reason_note. A qty change writes a movement for the difference, so Stock Movements shows it; only the expiry date / alert level changing writes none (movement null). Each row saves on its own (failed[] lists the ones that did not). Reply data: one { stock, movement } per row, short numbers only (same shapes as Update Stock Movements). The example: Pepsi 1.5L (a pack of 5 that also sells loose) at location 1 counted 3 packs + 2 bottles (17, was 20 — an adjustment of −3); Sugar at location 1 gets a new expiry date and alert level (no qty change, so no movement).",
    body: {
      items: [
        { product_id: 1, variant_id: 4, location_id: 1, qty: 28, reason: "count", reason_note: "Shelf count" },
        { product_id: 1, variant_id: 1, location_id: 2, number_of_packs: 4, loose_units: 8, expiry_date: "2026-12-31", low_stock_threshold: 10, reason: "damage", reason_note: "2 bottles leaked" },
      ],
    },
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Updated", [
        {
          stock: sampleStock({ qty: 28 }),
          movement: sampleMovement({ id: 15, movement_type: "adjustment", reason: "count", reason_note: "Shelf count", qty: -2, qty_after: 28, created_at: "2026-11-06T09:15:00.000Z", updated_at: null }),
        },
        {
          stock: sampleStock({ location: DEFENSE, product: PEPSI_350ML, qty: 48, pack_size: 10, expiry_date: "2026-12-31", low_stock_threshold: 10 }),
          movement: sampleMovement({ id: 16, location: DEFENSE, product: PEPSI_350ML, movement_type: "adjustment", reason: "damage", reason_note: "2 bottles leaked", qty: -2, qty_after: 48, created_at: "2026-11-06T09:15:00.000Z", updated_at: null }),
        },
      ]),
      okReply("200 OK — expiry date only", null, "Stock Updated", [
        { stock: sampleStock({ qty: 30, expiry_date: "2026-12-15" }), movement: null },
      ]),
      {
        label: "200 OK — one row failed",
        status: 200,
        body: {
          success: true,
          message: "Stock Updated",
          data: [{ stock: sampleStock({ qty: 28 }), movement: sampleMovement({ id: 15, movement_type: "adjustment", reason: "count", reason_note: "Shelf count", qty: -2, qty_after: 28, created_at: "2026-11-06T09:15:00.000Z", updated_at: null }) }],
          failed: [{ index: 1, message: "Pepsi - 350ML is sold only in whole packs: send number_of_packs without loose_units", status: 400 }],
        },
      },
    ],
  }),
  ep({
    id: "transfer-bulk-patch",
    tag: "inventory",
    method: "PATCH",
    path: "/api/v1/stock-transfers/bulk",
    summary: "Update Stock Transfers",
    description: "The one transfer update — the same request and reply as Bulk Stock Transfer (create), plus id: { items: [{ id, from_location_id?, note?, destinations?: [{ to_location_id, products: [{ product_id, variant_id?, qty }] }] }] } — always an array, even for one transfer. id = the transfer number (1, 2, 3…), never the UUID; location / product / variant ids are their numbers as on create. destinations replace every product of the transfer (send the whole list, as when it was created); left out, the products stay and only from_location_id / note change. The source must hold, per product, the qty of every destination together. Only a transfer nothing of which has been received can change (its stock has not moved yet): otherwise 409. Each item saves on its own: one that fails is listed in failed[] ({ index, message, status }) and the rest still save; when every item fails the reply is that first error. Store admin. Reply data: one transfer per item, the create shape — { id, from_location, status, destinations [{ to_location, status, products [{ product, qty, received_qty, status }] }], note, staff, created_at }. The example: transfer 1 (location 1 → Branch 2) now sends 15 Pepsi 1.5L (was 10), the same 5 Garnier Vitamin C, and 20 kg Sugar as well.",
    body: {
      items: [
        {
          id: 1,
          from_location_id: 1,
          note: "Weekly refill — Branch 2 needs more Pepsi",
          destinations: [
            { to_location_id: 2, products: [{ product_id: 1, variant_id: 1, qty: 25 }] },
            { to_location_id: 3, products: [{ product_id: 6, variant_id: 1, qty: 8 }, { product_id: 1, variant_id: 1, qty: 10 }] },
          ],
        },
      ],
    },
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Transfers Updated", [transferSample()]),
      {
        label: "409 — already received",
        status: 409,
        body: { success: false, message: "Part of transfer 1 has been received, so its stock has moved: it cannot be changed", data: [], failed: [{ index: 0, message: "Part of transfer 1 has been received, so its stock has moved: it cannot be changed", status: 409 }] },
      },
    ],
  }),
  ep({
    id: "order-bulk-patch",
    tag: "orders",
    method: "PATCH",
    path: "/api/v1/orders/bulk",
    summary: "Bulk Update Orders",
    description: "POS offline sync: { locationId?, items: [{ id (order number), customer_id (customer number) }] } — attach the customer the cashier forgot to pick (an order that has no customer yet). A sale's items, prices and taxes never change: a wrong / swapped item is a refund of that item plus a new sale, so the cash drawer, stock and tax stay right.",
    body: { locationId: 1, items: [{ id: 4, customer_id: 1 }] },
  }),
  ep({
    id: "order-bulk-status-patch",
    tag: "orders",
    method: "PATCH",
    path: "/api/v1/orders/bulk/status",
    summary: "Bulk Order Status",
    description: "POS / web: { locationId?, staff_id?, items: [{ id, status, reason?, approval_request_id? }] }. completed — a pending (web / COD) order delivered and paid. cancelled — a pending order. voided — a completed sale: stock goes back and the drawer is reversed (a cashier needs an approval_request_id).",
    body: { locationId: 1, staff_id: 2, items: [{ id: 8, status: "voided", reason: "Rung up twice" }] },
  }),
  ep({
    id: "order-bulk-payment-method-patch",
    tag: "orders",
    method: "PATCH",
    path: "/api/v1/orders/bulk/payment-method",
    summary: "Bulk Payment Method",
    description: "The cashier pressed the wrong method: { locationId?, items: [{ id, payment_method }] }. Only a one-method sale with no refund while its batch is open, and only between methods with the same payment tax (e.g. easypaisa 5% → card 5%). The drawer moves the amount to the new method. cash 16% → card 5% would change the bill, so it is refused (409): void it and ring it up again. Store admin / manager.",
    body: { locationId: 1, items: [{ id: 7, payment_method: "card" }] },
  }),
  ep({
    id: "surcharge-bulk-patch",
    tag: "surcharges",
    method: "PATCH",
    path: "/api/v1/payment-surcharges/bulk",
    summary: "Bulk Update Surcharges",
    description: `${BULK_UPDATE_NOTE} Store admin. items[].id = the surcharge's number (surcharge_number, e.g. 1) or its UUID — both work. Any field: method, charges, type, isActive. Reply: the updated surcharges.`,
    body: { items: [{ id: 1, charges: 2.5 }, { id: 2, type: "fixed", charges: 30 }] },
  }),
  ep({
    id: "surcharge-bulk-status-patch",
    tag: "surcharges",
    method: "PATCH",
    path: "/api/v1/payment-surcharges/bulk/status",
    summary: "Bulk Surcharge Status",
    description: `${BULK_UPDATE_NOTE} Store admin. { id (surcharge number or UUID), is_active }: an inactive surcharge is not added to any bill.`,
    body: { items: [{ id: 2, is_active: false }] },
  }),
  ep({
    id: "tax-bulk-patch",
    tag: "taxes",
    method: "PATCH",
    path: "/api/v1/taxes/bulk",
    summary: "Bulk Update Taxes",
    description: `${BULK_UPDATE_NOTE} Store admin. items[].id = the tax's number (tax_number, e.g. 1) or its UUID — both work. Any tax field: name, type, value, product_scope, product_ids (replaces the list), is_active. product_scope all drops the list (every product). Reply: the updated taxes.`,
    body: {
      items: [
        { id: 1, name: "GST", value: 17 },
        { id: 2, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 6, 11] },
      ],
    },
  }),
  ep({
    id: "tax-bulk-status-patch",
    tag: "taxes",
    method: "PATCH",
    path: "/api/v1/taxes/bulk/status",
    summary: "Bulk Tax Status",
    description: `${BULK_UPDATE_NOTE} Store admin. { id (tax number or UUID), is_active }: an inactive tax is not charged and leaves every product's store_taxes.`,
    body: { items: [{ id: 2, is_active: false }] },
  }),
  ep({
    id: "sup-bulk-patch",
    tag: "suppliers",
    method: "PATCH",
    path: "/api/v1/suppliers/bulk",
    summary: "Bulk Update Suppliers",
    description: `${BULK_UPDATE_NOTE} Any supplier field, as in create: name, phone, email, address, payment_terms, is_active, location_scope / location_ids (location numbers).`,
    body: { items: [{ id: 1, phone: "03006666667", payment_terms: "Net 30" }, { id: 2, location_scope: "all" }] },
  }),
  ep({
    id: "staff-bulk-patch",
    tag: "staff",
    method: "PATCH",
    path: "/api/v1/staff/bulk",
    summary: "Bulk Update Staff",
    description: `${BULK_UPDATE_NOTE} The one staff edit: every field except the password — name, email (unique in the store), phone, role (store admin only), location_id (location number; a manager only within their own; the PIN must be free there), is_active (false = suspended: 'Account Suspended' on sign-in and PIN), pin. A password is not changed here (staff reset it with POST /auth/forgot-password). The store admin is edited from My Account.`,
    body: { items: [{ id: 3, name: "Ameer Hamza", email: "ameer@acadex.co", phone: "03001112222" }, { id: 4, location_id: 2, pin: "4545" }, { id: 5, is_active: false }] },
  }),
  ep({
    id: "staff-delete",
    tag: "staff",
    method: "DELETE",
    path: "/api/v1/staff/:id",
    summary: "Delete Staff",
    description: "Soft delete: the staff member leaves the staff list and can no longer sign in (401 Invalid credentials) or use their PIN; their tokens stop working and an open clock-in is closed. The row stays in the database, so their sales, batches and history still show their name (GET /staff?include_deleted=1 lists them with deleted: true). :id = the staff UUID. The store admin and your own account cannot be deleted; a manager cannot delete another manager. Response { id (user number), deleted: true }.",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "staff-session-bulk-patch",
    tag: "shifts",
    method: "PATCH",
    path: "/api/v1/staff-sessions/bulk",
    summary: "Bulk Update Staff Sessions",
    description: `${BULK_UPDATE_NOTE} A manager corrects attendance: { id (session number), clock_in_at?, clock_out_at? } (ISO date-time). Setting clock_out_at closes the session (e.g. the cashier forgot to clock out). Store admin / manager.`,
    body: { items: [{ id: 1, clock_out_at: "2026-10-24T18:30:00.000Z" }, { id: 2, clock_in_at: "2026-10-24T09:00:00.000Z", clock_out_at: "2026-10-24T17:00:00.000Z" }] },
  }),
  ep({
    id: "movement-delete",
    tag: "inventory",
    method: "DELETE",
    path: "/api/v1/stock-movements/:id",
    summary: "Delete Stock Movement",
    description: "Dashboard: Stock Movements → Delete. Soft delete of a wrong movement: its qty is taken back off the stock (a +5 stock in takes 5 away, a −5 stock out puts 5 back), the stock after of every later movement there moves the same way, and the movement leaves every list, report and total; its row stays in the database. :id = the movement number (e.g. 12). 400 when the stock would go below 0; 409 for a sale, refund or transfer movement. Store admin / manager (a manager only at their own location). Reply: { movement (with deleted_at), stock (now) }, short numbers only.",
    pathParams: [{ name: "id", default: "12", required: true }],
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Movement Deleted", {
        movement: sampleMovement({ id: 12, movement_type: "stock_in", reason: "purchase", reason_note: "Bill #4521", qty: 5, qty_after: 55, supplier: { id: 1, name: "Mustafa Traders" }, updated_at: null, deleted_at: "2026-11-06T09:20:00.000Z" }),
        stock: sampleStock({ qty: 50 }),
      }),
    ],
  }),
  ep({
    id: "stock-entry-delete",
    tag: "inventory",
    method: "DELETE",
    path: "/api/v1/product-stocks/:id",
    summary: "Delete Product Stock",
    description: "Dashboard: Product Stock & Expiry → Delete. Soft delete of a stock entry (a product at a location): its qty goes to 0 through an adjustment movement (reason other, note \"Stock entry deleted\" + the optional reason_note sent in the body), then the entry leaves Product Stock & Expiry and the stock lists; its row stays. The next stock change for that product there brings it back (without the old expiry date). :id = the stock entry's id from GET /products/expiry (stocks[0].id). Store admin / manager (a manager only at their own location). Reply: { stock (qty 0, deleted_at), movement (null when it was already 0) }, short numbers only.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { reason_note: "Wrong batch entered" },
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Deleted", {
        stock: sampleStock({ qty: 0, deleted_at: "2026-11-06T09:25:00.000Z" }),
        movement: sampleMovement({ id: 17, movement_type: "adjustment", reason: "other", reason_note: "Stock entry deleted: Wrong batch entered", qty: -30, qty_after: 0, created_at: "2026-11-06T09:25:00.000Z", updated_at: null }),
      }),
    ],
  }),
  ep({
    id: "transfer-delete",
    tag: "inventory",
    method: "DELETE",
    path: "/api/v1/stock-transfers/:id",
    summary: "Delete Stock Transfer",
    description: "Dashboard: Stock Transfers → Delete. Soft delete: the transfer leaves the transfer list, the reports and the POS sync; its rows stay in the database. Only a transfer nothing of which has been received (on the way or cancelled) — no stock has moved for it, so stock stays as it is; a received one is 409. :id = the transfer number (e.g. 1). Store admin. Reply: the transfer as it was (the create shape) with deleted_at.",
    pathParams: [{ name: "id", default: "1", required: true }],
    ownResponses: true,
    responses: [
      okReply("200 OK", null, "Stock Transfer Deleted", { ...transferSample(), deleted_at: "2026-11-06T10:30:00.000Z" }),
      { label: "409 — already received", status: 409, body: { success: false, message: "Part of transfer 1 has been received, so its stock has moved: it cannot be deleted" } },
    ],
  }),
  ep({
    id: "staff-session-delete",
    tag: "shifts",
    method: "DELETE",
    path: "/api/v1/staff-sessions/:id",
    summary: "Delete Staff Session",
    description: "Soft delete: the attendance session leaves the session history and the reports; its row stays in the database. :id = the session number (e.g. 1) or UUID. Store admin / manager (a manager only at their own location). Response { id, deleted: true }.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "batch-bulk-patch",
    tag: "shifts",
    method: "PATCH",
    path: "/api/v1/batches/bulk",
    summary: "Bulk Update Batches",
    description: `${BULK_UPDATE_NOTE} A manager corrects a cash drawer batch: { id (batch number), opening_cash?, cash_in?, cash_out?, counted_cash? (a closed batch), opened_at?, closed_at? (a closed batch), note? }. Expected cash (opening + cash in + cash sales − cash out) and the variance (counted − expected) are worked out again. Takings come from the sales and are not edited. Store admin / manager (a manager only at their own location).`,
    body: { items: [{ id: 1, opening_cash: 5000, note: "Float topped up" }, { id: 2, counted_cash: 18250, closed_at: "2026-10-24T22:05:00.000Z" }] },
  }),
  ep({
    id: "batch-delete",
    tag: "shifts",
    method: "DELETE",
    path: "/api/v1/batches/:id",
    summary: "Delete Batch",
    description: "Soft delete: the batch leaves Batch History and the reports (Z-reports); its row stays in the database and its orders keep their sales. :id = the batch number (e.g. 1) or UUID. Store admin / manager (a manager only at their own location). Response { id, deleted: true }.",
    pathParams: [{ name: "id", default: "1", required: true }],
  }),
  ep({
    id: "customer-bulk-patch",
    tag: "customers",
    method: "PATCH",
    path: "/api/v1/customers/bulk",
    summary: "Bulk Update Customers",
    description: `${BULK_UPDATE_NOTE} name, email, phone, location_id (location number), debt_notes, is_active. Udhaar payments go through POST /customers/:id/credit, not here.`,
    body: { items: [{ id: 1, phone: "03009998888", debt_notes: "Pays every Friday" }] },
  }),
  ep({
    id: "location-bulk-patch",
    tag: "locations",
    method: "PATCH",
    path: "/api/v1/locations/bulk",
    summary: "Bulk Update Locations",
    description: `${BULK_UPDATE_NOTE} name, address_line, city, postal_code, phone, is_active, is_default, manager_* (a manager only their own branch).`,
    body: { items: [{ id: 3, phone: "03001234568", postal_code: "75300" }] },
  }),
]

// The documented list: the entries above (minus the ones no longer documented) and the demo store's new ones.
export const endpoints = [
  ...BASE_ENDPOINTS.filter((item) => !DEMO_REMOVED_IDS.includes(item.id)),
  ...DEMO_NEW_EPS.map((spec) => ep(spec)),
]


export function endpointsByTag(tagId) {
  return endpoints.filter((item) => item.tag === tagId)
}
