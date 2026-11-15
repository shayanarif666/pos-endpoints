// The discounts in the docs, GET only: the order level discounts (the cashier picks one), the bulk
// discounts (buy more of ONE product, every unit gets cheaper), the bundle discounts (buy several
// products together, get a reward) and the one GET that gives the POS every discount of a cart.
// The category and the product discounts are set on the category and on the product.
import { PRODUCTS, ZAYAN } from "./demo.js"

const ok = (label, status, message, data, extra = {}) => ({ label, status, body: { success: true, message, data, ...extra } })
const page = (data) => ({ label: "200 OK", status: 200, body: { success: true, message: "OK", data, pagination: { page: 1, limit: 20, total: data.length, total_pages: 1 } } })
const fail = (status, label, message) => ({ label: `${status} — ${label}`, status, body: { success: false, message } })

/** A product (and one variant) as a reply names it: { id, title, sku, unit, variant { id, name } }. */
const ref = (product, variantId = null) => {
  const variant = variantId ? product.variants[variantId - 1] : null
  return {
    id: product.number,
    title: product.title,
    sku: variant ? variant.sku : product.sku,
    unit: product.unit,
    ...(variant ? { variant: { id: variantId, name: variant.name } } : {}),
  }
}

/** A product to buy in a bundle: { id, title, sku, unit, barcode, variant { id, name, sku, barcode } | null, qty, sale_unit }. */
const bought = (product, variantId, qty, sale_unit) => {
  const variant = variantId ? product.variants[variantId - 1] : null
  return {
    id: product.number,
    title: product.title,
    sku: product.sku,
    unit: product.unit,
    barcode: product.barcode,
    variant: variant ? { id: variantId, name: variant.name, sku: variant.sku, barcode: variant.barcode } : null,
    qty,
    sale_unit,
  }
}

const PEPSI_1L = ref(PRODUCTS.pepsi, 3)
const PEPSI_500ML = ref(PRODUCTS.pepsi, 2)
const PEPSI_350ML = ref(PRODUCTS.pepsi, 1)
const ALMONDS_1KG = ref(PRODUCTS.almonds, 3)
const GARNIER_CREAM = ref(PRODUCTS.garnier, 2)
const SUGAR = ref(PRODUCTS.sugar)

const ORDER_DISCOUNTS = [
  { id: 1, name: "Azaadi Sale", discount_type: "percentage", discount_value: 10, is_active: true, status: "active" },
  { id: 2, name: "Staff Discount", discount_type: "fixed", discount_value: 50, is_active: true, status: "active" },
]

const BULK_DISCOUNTS = [
  {
    id: 1, name: "Pepsi 1L bulk", product: PEPSI_1L, sale_unit: "unit",
    tiers: [
      { min_qty: 3, discount_type: "percentage", discount_value: 5 },
      { min_qty: 10, discount_type: "fixed", discount_value: 10 },
    ],
    start_at: null, end_at: null, is_active: true, status: "active", staff: ZAYAN,
  },
  {
    id: 2, name: "Sugar 10 kg bulk", product: SUGAR, sale_unit: "unit",
    tiers: [{ min_qty: 10, discount_type: "fixed", discount_value: 10 }],
    start_at: "2026-11-01T00:00:00.000Z", end_at: "2026-11-30T18:59:00.000Z", is_active: true, status: "active", staff: ZAYAN,
  },
]

const BUNDLE_DISCOUNTS = [
  {
    id: 1, name: "Buy 2 Litre Pepsi Get 1 500ml Free",
    products: [bought(PRODUCTS.pepsi, 3, 2, "unit")],
    reward: { type: "free_item", items: [{ product: PEPSI_500ML, qty: 1, sale_unit: "unit" }] },
    start_at: null, end_at: null, is_active: true, staff: ZAYAN,
  },
  {
    id: 2, name: "Buy 1 Litre & 1 Litre Mountain Dew Get 50% Off",
    products: [bought(PRODUCTS.pepsi, 3, 1, "unit"), bought(PRODUCTS.dew, 1, 1, "unit")],
    reward: { type: "percentage", value: 50 },
    start_at: null, end_at: null, is_active: true, staff: ZAYAN,
  },
  {
    id: 3, name: "Pepsi 350ML + Garnier Cream, 10% off",
    products: [bought(PRODUCTS.pepsi, 1, 1, "unit"), bought(PRODUCTS.garnier, 2, 1, "unit")],
    reward: { type: "percentage", value: 10 },
    start_at: null, end_at: null, is_active: true, staff: ZAYAN,
  },
]

const PAGING = [
  { name: "page", default: "1", required: false },
  { name: "limit", default: "20", required: false },
]

export const DISCOUNT_EPS = [
  // ---- Order level
  {
    id: "discount-list",
    noEnums: true,
    tag: "discounts",
    method: "GET",
    path: "/api/v1/discounts",
    summary: "Discounts",
    description:
      "The discounts an order can use, in one reply: { discounts, bundle_discounts }. discounts = the order level discounts (a discount on the whole bill, picked by the cashier) { id, name, discount_type (percentage | fixed), discount_value, is_active, status (active | inactive) }; bundle_discounts = the bundle discounts (buy several products together, get a reward) { id, name, products [{ id, title, sku, unit, barcode (the product's), variant { id, name, sku, barcode } | null, qty, sale_unit (unit | pack) }] (everything that has to be bought, each with its qty), reward { type (free_item | percentage | fixed), items [{ product, qty, sale_unit }] | value }, start_at, end_at, is_active, staff }. The ids are the ones an order sends: discounts[].id as the store discount id, bundle_discounts[].id as the bundle id. Filter: active (true = only the live ones: active, started and not ended; false = the ones that are not live; left out = every one). Any role. Not paged: both lists come whole. The category, product and variant discounts are on the category / product (GET /categories, GET /products); the bulk discounts are on the product as well.",
    query: [{ name: "active", default: "", required: false, values: ["true", "false"] }],
    ownResponses: true,
    responses: [ok("200 OK", 200, "OK", { discounts: ORDER_DISCOUNTS, bundle_discounts: BUNDLE_DISCOUNTS })],
  },
]
