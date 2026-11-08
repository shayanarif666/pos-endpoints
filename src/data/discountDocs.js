// The five discount levels in the docs: category and product discounts are set on the category
// and the product; these are the order level, bulk (buy X get Y), bundle discounts and the one GET
// that gives the POS every discount of a cart.
import { OFFER_SAMPLES, PRODUCTS, ZAYAN, productRef } from "./demo.js"

const ok = (label, status, message, data, extra = {}) => ({ label, status, body: { success: true, message, data, ...extra } })
const page = (data) => ({ label: "200 OK", status: 200, body: { success: true, message: "OK", data, pagination: { page: 1, limit: 20, total: data.length, total_pages: 1 } } })
const fail = (status, label, message) => ({ label: `${status} — ${label}`, status, body: { success: false, message } })

const ORDER_DISCOUNTS = [
  { id: 1, name: "Eid Sale", discount_type: "percentage", discount_value: 10, apply_to_all_orders: true, is_active: true, status: "active" },
  { id: 2, name: "Staff Discount", discount_type: "fixed", discount_value: 50, apply_to_all_orders: false, is_active: true, status: "active" },
]

const CARTON = { id: 5, title: "Crockery Set Carton", sku: "CROCKERY-CARTON", unit: "piece", variant: null, pack_size: 12, pack_price: 5000 }
const BUNDLES = [
  {
    id: 1, name: "Crockery Carton Offer", discount_type: "percentage", discount_value: 10, products: [CARTON],
    start_at: null, end_at: null, is_active: true, status: "active", staff: ZAYAN,
  },
]

const GARNIER_BULK = {
  ...OFFER_SAMPLES[0],
  id: 5, name: "Garnier 3 + 1", products: [{ ...productRef(PRODUCTS.garnier, 1, { barcode: false }), sale_unit: "unit", promo_price: null, promo_pack_price: null, free_product: null }],
  buy_qty: 3, get_qty: 1,
}
const BULK_DISCOUNTS = [OFFER_SAMPLES[0], GARNIER_BULK]

const PAGING = [
  { name: "page", default: "1", required: false },
  { name: "limit", default: "20", required: false },
]

const NOT_PACK = fail(400, "not a pack product", "Almonds is not a pack product: a bundle discount is on a whole pack / carton")

export const DISCOUNT_EPS = [
  // ---- Order level
  {
    id: "discount-list",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/discounts",
    summary: "Discounts (order level)",
    description:
      "The order level discounts: a discount on the whole bill. { id (discount number), name, discount_type (percentage | fixed), discount_value, apply_to_all_orders (true = the POS puts it on every order by itself; false = the cashier picks it), is_active, status }. Any role. The category and product discounts are set on the category and the product; bulk (buy X get Y) and bundle discounts have their own lists. The cart's discounts of every level come in one reply from GET /order-discounts.",
    query: [...PAGING, { name: "active", default: "", required: false }],
    ownResponses: true,
    responses: [page(ORDER_DISCOUNTS)],
  },
  {
    id: "discount-bulk",
    tag: "discounts",
    enums: { discount_type: ["percentage", "fixed"], status: ["active", "inactive"] },
    method: "POST",
    path: "/api/v1/discounts/bulk",
    summary: "Bulk Discount Creation (order level)",
    description:
      "Store admin / manager. { storeId, staffId, items: [{ name, discount_type, discount_value, apply_to_all_orders, status }] }: an order level discount. apply_to_all_orders true (default) = it goes on every order; false = picked by the cashier. A row that fails is listed in failed[], the rest still save.",
    body: {
      storeId: 1,
      staffId: 1,
      items: [
        { name: "Eid Sale", discount_type: "percentage", discount_value: 10, apply_to_all_orders: true },
        { name: "Staff Discount", discount_type: "fixed", discount_value: 50, apply_to_all_orders: false },
      ],
    },
    ownResponses: true,
    responses: [ok("201 Created", 201, "Discount Created", ORDER_DISCOUNTS), fail(400, "percentage over 100", "A percentage discount cannot be more than 100")],
  },
  {
    id: "discount-bulk-patch",
    tag: "discounts",
    enums: { discount_type: ["percentage", "fixed"], status: ["active", "inactive"] },
    method: "PATCH",
    path: "/api/v1/discounts/bulk",
    summary: "Bulk Update Discounts (order level)",
    description:
      "Store admin / manager. items[] = [{ id (the discount number), name?, discount_type?, discount_value?, apply_to_all_orders?, status? }]. A row that fails is listed in failed[], the rest still save.",
    body: { items: [{ id: 1, discount_value: 12 }, { id: 2, apply_to_all_orders: true, status: "inactive" }] },
    ownResponses: true,
    responses: [ok("200 OK", 200, "Discounts Updated", [{ ...ORDER_DISCOUNTS[0], discount_value: 12 }, { ...ORDER_DISCOUNTS[1], apply_to_all_orders: true, is_active: false, status: "inactive" }])],
  },
  {
    id: "discount-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/discounts/:id",
    summary: "Delete Discount (order level)",
    description: "Soft delete (:id = the discount number or UUID): it leaves the list and the POS; sales made with it keep their discount. Switching it off instead is PATCH status inactive. Store admin / manager.",
    pathParams: [{ name: "id", default: "2", required: true }],
    ownResponses: true,
    responses: [ok("200 OK", 200, "Discount deleted", { ...ORDER_DISCOUNTS[1], deleted_at: "2026-11-07T10:00:00.000Z" })],
  },

  // ---- Bulk (buy X get Y)
  {
    id: "bulk-discount-list",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/bulk-discounts",
    summary: "Bulk Discounts",
    description:
      "The bulk discounts: buy X, get Y free. { id (the discount number: the discount_id a sale line sends), name, products [{ id, title, sku, unit, variant, sale_unit (unit | pack | both on a pack product), free_product }], categories [{ id, name }], buy_qty + buy_unit (unit | pack), get_qty + get_unit, sale_unit, start_at, end_at, location_scope, locations, is_active, status, staff }. Any role. The free items of a sale line go in free_qty.",
    query: [...PAGING, { name: "active", default: "", required: false }, { name: "location_id", default: "", required: false }],
    ownResponses: true,
    responses: [page(BULK_DISCOUNTS)],
  },
  {
    id: "bulk-discount-bulk",
    tag: "discounts",
    enums: { buy_unit: ["unit", "pack"], get_unit: ["unit", "pack"], sale_unit: ["unit", "pack", "both"], status: ["active", "inactive"], location_scope: ["all", "selected"] },
    method: "POST",
    path: "/api/v1/bulk-discounts/bulk",
    summary: "Bulk Discount Creation (buy X get Y)",
    description:
      "Store admin / manager / cashier. { storeId, staffId, items: [{ name, products | categories, buy_qty, get_qty, buy_unit?, get_unit?, sale_unit?, start_at?, end_at?, location_scope?, location_ids? }] }. Buy X get Y free on products and / or categories; buy_unit / get_unit count single items (unit) or packs (a pack product). There is no type: every bulk discount is buy X get Y. A row that fails is listed in failed[], the rest still save.",
    body: {
      storeId: 1,
      staffId: 1,
      items: [
        { name: "Double Delight", products: [{ product_id: 1, sale_unit: "unit" }], buy_qty: 2, get_qty: 1, start_at: "2026-11-01T00:00:00.000Z", end_at: "2026-11-15T18:59:00.000Z", location_scope: "all" },
        { name: "Garnier 3 + 1", products: [2], buy_qty: 3, get_qty: 1 },
      ],
    },
    ownResponses: true,
    responses: [ok("201 Created", 201, "Offer Created", BULK_DISCOUNTS), fail(400, "buy and get are required", "buy_qty is required for a bogo offer")],
  },
  {
    id: "bulk-discount-bulk-patch",
    tag: "discounts",
    enums: { buy_unit: ["unit", "pack"], get_unit: ["unit", "pack"], sale_unit: ["unit", "pack", "both"], status: ["active", "inactive"], location_scope: ["all", "selected"] },
    method: "PATCH",
    path: "/api/v1/bulk-discounts/bulk",
    summary: "Bulk Update Bulk Discounts",
    description:
      "Store admin / manager. items[] = [{ id (the discount number), name?, buy_qty?, get_qty?, buy_unit?, get_unit?, start_at?, end_at?, status?, products?, categories?, location_scope?, location_ids? }]. products / categories replace what the discount applies to. The type cannot change.",
    body: { items: [{ id: 5, get_qty: 2 }, { id: 4, status: "inactive" }] },
    ownResponses: true,
    responses: [ok("200 OK", 200, "Offers Updated", [{ ...GARNIER_BULK, get_qty: 2 }, { ...OFFER_SAMPLES[0], is_active: false, status: "inactive" }])],
  },
  {
    id: "bulk-discount-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/bulk-discounts/:id",
    summary: "Delete Bulk Discount",
    description: "Soft delete (:id = the discount number or UUID): it stops at checkout and leaves the list and the POS; sales made with it keep it. Store admin / manager.",
    pathParams: [{ name: "id", default: "5", required: true }],
    ownResponses: true,
    responses: [ok("200 OK", 200, "Offer deleted", { ...GARNIER_BULK, deleted_at: "2026-11-07T10:00:00.000Z" })],
  },

  // ---- Bundle
  {
    id: "bundle-discount-list",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/bundle-discounts",
    summary: "Bundle Discounts",
    description:
      "The bundle discounts: a discount on selling a whole pack / carton, e.g. the crockery carton at Rs. 5000 with 10% off. { id (the bundle number), name, discount_type, discount_value, products [{ id, title, sku, unit, variant, pack_size, pack_price }] (the pack products it covers), start_at, end_at, is_active, status, staff }. Any role.",
    query: [...PAGING, { name: "active", default: "", required: false }],
    ownResponses: true,
    responses: [page(BUNDLES)],
  },
  {
    id: "bundle-discount-bulk",
    tag: "discounts",
    enums: { discount_type: ["percentage", "fixed"], status: ["active", "inactive"] },
    method: "POST",
    path: "/api/v1/bundle-discounts/bulk",
    summary: "Bulk Bundle Discount Creation",
    description:
      "Store admin / manager. { storeId, staffId, items: [{ name, products, discount_type, discount_value, start_at?, end_at?, status? }] }. products = pack product numbers: a bundle discount is on a whole pack / carton, so a product that is not a pack product is refused. A row that fails is listed in failed[], the rest still save.",
    body: {
      storeId: 1,
      staffId: 1,
      items: [{ name: "Crockery Carton Offer", products: [5], discount_type: "percentage", discount_value: 10 }],
    },
    ownResponses: true,
    responses: [ok("201 Created", 201, "Bundle Discount Created", BUNDLES), NOT_PACK],
  },
  {
    id: "bundle-discount-bulk-patch",
    tag: "discounts",
    enums: { discount_type: ["percentage", "fixed"], status: ["active", "inactive"] },
    method: "PATCH",
    path: "/api/v1/bundle-discounts/bulk",
    summary: "Bulk Update Bundle Discounts",
    description: "Store admin / manager. items[] = [{ id (the bundle number), name?, products?, discount_type?, discount_value?, start_at?, end_at?, status? }]. products replaces the pack products it covers.",
    body: { items: [{ id: 1, discount_value: 15 }] },
    ownResponses: true,
    responses: [ok("200 OK", 200, "Bundle Discounts Updated", [{ ...BUNDLES[0], discount_value: 15 }])],
  },
  {
    id: "bundle-discount-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/bundle-discounts/:id",
    summary: "Delete Bundle Discount",
    description: "Soft delete (:id = the bundle number or UUID): it leaves the list and the POS. Store admin / manager.",
    pathParams: [{ name: "id", default: "1", required: true }],
    ownResponses: true,
    responses: [ok("200 OK", 200, "Bundle discount deleted", { ...BUNDLES[0], deleted_at: "2026-11-07T10:00:00.000Z" })],
  },

  // ---- The cart
  {
    id: "order-discounts",
    tag: "discounts",
    method: "GET",
    path: "/api/v1/order-discounts",
    summary: "Cart Discounts",
    description:
      "Every discount that can touch the cart, in one call: the POS asks again when the cashier changes the cart. product_ids / category_ids = the products and categories in the cart (numbers, comma separated; UUIDs also work); the categories of the cart's products are added by themselves. The order discount is global, so it needs no query. A level with no discount comes back empty ([] or {}). { categories [{ id, name, discount_name, discount_type, discount_value }] (category level), products [{ id, title, discount_name, discount_type, discount_value, applies_to (all | pack | loose | weight: what the product discount is taken off) }] (product level), order { id, name, discount_type, discount_value, apply_to_all_orders } (the order level discount that goes on every order), bundle [{ id, name, discount_type, discount_value, products }] (live bundle discounts on a pack product of the cart), bulkDiscount [buy X get Y discounts on a product or category of the cart: the same rows as GET /bulk-discounts] }. Any role. The POS works the figures out; a sale line sends discount_amount (every level), discount [{ discount_id }] for a bulk discount (and free_qty), and order_discount for the order level one.",
    query: [
      { name: "product_ids", default: "1,5", required: false },
      { name: "category_ids", default: "1", required: false },
    ],
    ownResponses: true,
    responses: [
      ok("200 OK", 200, "OK", {
        categories: [{ id: 1, name: "Beverages", discount_name: "Beverages 5%", discount_type: "percentage", discount_value: 5 }],
        products: [{ id: 4, title: "Sugar", discount_name: "Sugar Rs 5 off", discount_type: "fixed", discount_value: 5, applies_to: "weight" }],
        order: ORDER_DISCOUNTS[0],
        bundle: BUNDLES,
        bulkDiscount: [OFFER_SAMPLES[0]],
      }),
      ok("200 OK — nothing applies", 200, "OK", { categories: [], products: [], order: {}, bundle: [], bulkDiscount: [] }),
      fail(400, "a bad id", "product_ids must be a number or a UUID"),
    ],
  },
]

/** Where the discounts of an order line are named: the bulk discount's number, as GET /bulk-discounts gives it. */
export const DISCOUNT_ID_NOTE = "The bulk discount number (GET /bulk-discounts). Product, category and bundle discounts are in the line's discount_amount; the order level discount is order_discount"
