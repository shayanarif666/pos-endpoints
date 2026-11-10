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
    id: 1, name: "2 x Pepsi 1L, Pepsi 500ML free",
    components: [{ product: PEPSI_1L, qty: 2, sale_unit: "unit" }],
    reward: { type: "free_item", items: [{ product: PEPSI_500ML, qty: 1, sale_unit: "unit" }] },
    start_at: null, end_at: null, is_active: true, status: "active", staff: ZAYAN,
  },
  {
    id: 2, name: "1 kg Almonds, Garnier Cream free",
    components: [{ product: ALMONDS_1KG, qty: 1, sale_unit: "pack" }],
    reward: { type: "free_item", items: [{ product: GARNIER_CREAM, qty: 1, sale_unit: "unit" }] },
    start_at: null, end_at: null, is_active: true, status: "active", staff: ZAYAN,
  },
  {
    id: 3, name: "Pepsi 350ML + Garnier Cream, 10% off",
    components: [{ product: PEPSI_350ML, qty: 1, sale_unit: "unit" }, { product: GARNIER_CREAM, qty: 1, sale_unit: "unit" }],
    reward: { type: "percentage", value: 10 },
    start_at: null, end_at: null, is_active: true, status: "active", staff: ZAYAN,
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
    tag: "discounts",
    method: "GET",
    path: "/api/v1/discounts",
    summary: "Discounts (order level)",
    description:
      "The order level discounts: a discount on the whole bill, picked by the cashier on an order. { id (discount number), name, discount_type (percentage | fixed), discount_value, is_active, status (active | inactive) }. Any role. The category and the product discounts are set on the category and on the product; the bulk and the bundle discounts have their own lists. The cart's discounts of every level come in one reply from GET /order-discounts.",
    query: [...PAGING, { name: "active", default: "", required: false }],
    ownResponses: true,
    responses: [page(ORDER_DISCOUNTS)],
  },

  // ---- Bulk
  {
    id: "bulk-discount-list",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/bulk-discounts",
    summary: "Bulk Discounts",
    description:
      "A bulk discount is on ONE product (or one variant of it): the more of it is bought, the cheaper each unit gets, in steps (tiers). { id (bulk discount number), name, product { id, title, sku, unit, variant { id, name } | null } (a variant when the discount is on one variant; without variant it is the product), sale_unit (unit | pack: what min_qty counts), tiers [{ min_qty, discount_type (percentage | fixed), discount_value }], start_at, end_at, is_active, status (active | inactive), staff }. From a tier's min_qty on, EVERY unit bought is cut: percentage = that % of the unit's price, fixed = that many rupees off each unit; the highest tier the qty reaches is the one that applies (tiers do not add up). Example — Sugar is Rs 160 a kg and the shopkeeper gives Rs 100 off on 10 kg: one tier { min_qty: 10, fixed, 10 } — 10 kg is Rs 1600 less Rs 100 = Rs 1500; 25 kg is Rs 250 off. A product has at most one bulk discount. The POS works the figure out on the sale line. Any role. Filters: active=1 (live ones only: active, started and not ended), product_id (+ variant_id). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      ...PAGING,
      { name: "active", default: "", required: false },
      { name: "product_id", default: "", required: false },
      { name: "variant_id", default: "", required: false },
    ],
    ownResponses: true,
    responses: [page(BULK_DISCOUNTS)],
  },

  // ---- Bundle
  {
    id: "bundle-discount-list",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/bundle-discounts",
    summary: "Bundle Discounts",
    description:
      "A bundle discount works across products: buy several products together (the components) and get a reward. { id (bundle number), name, components [{ product { id, title, sku, unit, variant { id, name } | null }, qty, sale_unit (unit | pack) }] (everything that has to be bought, each with its qty; two different products, or the same product with a qty of 2 or more), reward { type, items | value }, start_at, end_at, is_active, status (active | inactive), staff }. reward.type free_item: items [{ product, qty, sale_unit }] come free — a different product (1 kg Almonds, Garnier Cream free) or another variant of the same one (2 x Pepsi 1L, Pepsi 500ML free). reward.type percentage | fixed: reward.value is that % (or that many rupees) off the components together. It applies as many times as the cart holds the components (2 x Pepsi 1L twice = 4 x Pepsi 1L gives 2 free). A bundle is across several lines, so it is applied on the order, not on one line. Any role. Filter: active=1 (live ones only). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [...PAGING, { name: "active", default: "", required: false }],
    ownResponses: true,
    responses: [page(BUNDLE_DISCOUNTS)],
  },

  // ---- The cart
  {
    id: "order-discounts",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/order-discounts",
    summary: "Cart Discounts",
    description:
      "Every discount that can touch the cart, in one call: the POS asks again when the cashier changes the cart. product_ids / category_ids = the products and categories in the cart (numbers, comma separated; UUIDs also work); the categories of the cart's products are added by themselves. A level with no discount comes back empty ([]). { categories [{ id, name, discount_name, discount_type, discount_value }] (category level), products [{ id, title, discount_name, discount_type, discount_value, applies_to (all | pack | loose | weight: what the product discount is taken off) }] (product level), bulkDiscount [the live bulk discounts on a product of the cart: the same rows as GET /bulk-discounts], bundle [the live bundle discounts with a product of the cart among their components: the same rows as GET /bundle-discounts], order [every active order level discount: the same rows as GET /discounts] }. Any role. The POS works the figures out.",
    query: [
      { name: "product_ids", default: "1,4", required: false },
      { name: "category_ids", default: "1", required: false },
    ],
    ownResponses: true,
    responses: [
      ok("200 OK", 200, "OK", {
        categories: [{ id: 1, name: "Beverages", discount_name: "Eid Shopping", discount_type: "percentage", discount_value: 5 }],
        products: [{ id: 4, title: "Sugar", discount_name: "Sugar Rs 5 off", discount_type: "fixed", discount_value: 5, applies_to: "weight" }],
        bulkDiscount: [BULK_DISCOUNTS[0], BULK_DISCOUNTS[1]],
        bundle: [BUNDLE_DISCOUNTS[0]],
        order: ORDER_DISCOUNTS,
      }),
      ok("200 OK — nothing applies", 200, "OK", { categories: [], products: [], bulkDiscount: [], bundle: [], order: [] }),
      fail(400, "a bad id", "product_ids must be a number or a UUID"),
    ],
  },
]
