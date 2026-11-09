/*
 * The demo store behind every request and reply in these docs — one place, so every reply matches
 * its request and every later request (updates, refunds, lists) builds on what came before.
 *
 *   Store Acadex (store 1) · locations 1 / 2 / 3 · Zayan Ahmed (store admin, user 1) · Ahmed Malik
 *   (cashier, user 2) · categories Beverages / Soap / Rice & Daal / Personal Care / Dry Fruits ·
 *   taxes GST 18% (every product) + Sugar tax Rs 5 per unit (Pepsi, Sugar) · surcharges card 2%,
 *   JazzCash Rs 25 · products Pepsi (7 pack variants), Garnier Cream (5 variants, import taxes),
 *   Almonds (weight, packs in grams + loose), Sugar (no variants, by the kg) · discounts Azaadi Sale,
 *   Stock Up & Save, Midnight Madness, Double Delight · 3 sales, 3 partial refunds, 1 complete refund.
 *
 * The POS works out every figure (the server saves them as sent): line gross = qty × price, minus
 * its discount (an offer, else the category discount) = subtotal; taxes on the subtotal — the
 * product's own (product), the Taxes page ones (store: GST %, Sugar tax Rs 5 × units) and the
 * category's (category); payment surcharge on each method's share of the bill.
 */

import { REPORT_SECTION, REPORT_SECTIONS, queryRowsFor } from "./reportSections.js"

const R = "required"
const O = "optional"
const note = (text) => [O, text]
const must = (text) => [R, text]

export const r2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100
const sum = (rows, pick) => r2(rows.reduce((total, row) => total + Number(pick(row) || 0), 0))

// ---------------------------------------------------------------- store, people, places

export const STORE = { id: 1, name: "Acadex", ntn: "1234567-8", strn: "3277876123456", currency: "PKR" }
export const LOCATIONS = {
  1: { id: 1, name: "Gulshan e Iqbal Block 13 D" },
  2: { id: 2, name: "Branch 2" },
  3: { id: 3, name: "Gulshan e Iqbal Block 2" },
}
const L1 = LOCATIONS[1]
const L2 = LOCATIONS[2]
export const ZAYAN = { id: 1, name: "Zayan Ahmed", role: "store_admin" }
export const AHMED = { id: 2, name: "Ahmed Malik", role: "cashier" }
const BATCH = { id: 1, status: "open" }
const CUSTOMERS = { 1: { id: 1, name: "Ali Khan", phone: "03001231234" }, 2: { id: 2, name: "Sana Tariq", phone: "03214567890" } }
const SUPPLIERS = { 1: { id: 1, name: "Nestle Distributor" }, 2: { id: 2, name: "Unilever Wholesale" }, 3: { id: 3, name: "Rice Mills Co" } }

// ---------------------------------------------------------------- categories

const CATEGORY_ROWS = [
  { id: 1, name: "Beverages", slug: "beverages", tax_name: "GST", tax_type: "percentage", tax_value: 5, discount_name: "Eid Shopping", discount_type: "percentage", discount_value: 5, location_scope: "all", location_ids: [] },
  { id: 2, name: "Soap", slug: "soap", tax_name: "GST", tax_type: "percentage", tax_value: 10, discount_name: "Eid Shopping", discount_type: "percentage", discount_value: 0, location_scope: "selected", location_ids: [1, 2] },
  { id: 3, name: "Rice & Daal", slug: "rice-daal", tax_name: "GST", tax_type: "percentage", tax_value: 0, discount_name: "Eid Shopping", discount_type: "percentage", discount_value: 10, location_scope: "selected", location_ids: [1] },
  { id: 4, name: "Personal Care", slug: "personal-care", tax_name: null, tax_type: null, tax_value: null, discount_name: null, discount_type: null, discount_value: null, location_scope: "all", location_ids: [] },
  { id: 5, name: "Dry Fruits", slug: "dry-fruits", tax_name: null, tax_type: null, tax_value: null, discount_name: null, discount_type: null, discount_value: null, location_scope: "all", location_ids: [] },
]
export const CATEGORIES = Object.fromEntries(CATEGORY_ROWS.map((row) => [row.id, row]))
const categoryView = (row) => ({
  id: row.id, name: row.name,
  tax_name: row.tax_name, tax_type: row.tax_type, tax_value: row.tax_value,
  discount_name: row.discount_name, discount_type: row.discount_type, discount_value: row.discount_value,
  location_scope: row.location_scope, location_ids: row.location_ids,
})
const CAT_BULK_BODY = {
  storeId: 1,
  items: CATEGORY_ROWS.map((row) => {
    const out = { name: row.name }
    if (row.tax_type) Object.assign(out, { tax_name: row.tax_name, tax_type: row.tax_type, tax_value: row.tax_value })
    if (row.discount_type) Object.assign(out, { discount_name: row.discount_name, discount_type: row.discount_type, discount_value: row.discount_value })
    out.location_scope = row.location_scope
    if (row.location_scope === "selected") out.location_ids = row.location_ids
    return out
  }),
}

// ---------------------------------------------------------------- taxes & surcharges

const GST = { id: 1, name: "GST", type: "percentage", value: 18 }
const SUGAR_TAX = { id: 2, name: "Sugar tax", type: "fixed", value: 5 }
const SURCHARGES = {
  card: { id: 1, method: "card", type: "percentage", charges: 2 },
  jazzcash: { id: 2, method: "jazzcash", type: "fixed", charges: 25 },
}

// ---------------------------------------------------------------- products

// Product numbers count products only: Pepsi 1, Garnier 2, Almonds 3, Sugar 4. A variant has no
// product number of its own: it is named by its product number + its variant number inside the
// product (1, 2, 3…). Lot numbers also start at 1 for each product (or variant).
// A pack variant that is also sold loose has its own unit cost / price: here pack ÷ size (it may be more).
const pv = (name, sku, barcode, extra) => ({
  name,
  sku,
  barcode,
  ...(extra.is_pack_product && extra.sell_loose && extra.price == null ? { cost: r2(extra.pack_cost / extra.pack_size), price: r2(extra.pack_price / extra.pack_size) } : {}),
  ...extra,
})
const PEPSI_VARIANTS = [
  pv("350ML", "PEPSI-350ML", "8961014100011", { is_pack_product: true, pack_size: 5, pack_cost: 250, pack_price: 500, sell_loose: true }),
  pv("500ML", "PEPSI-500ML", "8961014100028", { is_pack_product: true, pack_size: 5, pack_cost: 350, pack_price: 700, sell_loose: true }),
  pv("1L x 5", "PEPSI-1L", "8961014100035", { is_pack_product: true, pack_size: 5, pack_cost: 400, pack_price: 800, sell_loose: true }),
  pv("1.5L", "PEPSI-1-5L", "8961014100042", { is_pack_product: true, pack_size: 5, pack_cost: 550, pack_price: 1100, sell_loose: true }),
  pv("2L", "PEPSI-2L", "8961014100059", { is_pack_product: true, pack_size: 5, pack_cost: 700, pack_price: 1500, sell_loose: true }),
  pv("Jumbo", "PEPSI-JUMBO", "8961014100066", { is_pack_product: true, pack_size: 5, pack_cost: 950, pack_price: 1200, sell_loose: true }),
  pv("Cane", "PEPSI-CANE", "8961014100073", { is_pack_product: true, pack_size: 5, pack_cost: 300, pack_price: 600, sell_loose: true, low_stock_threshold: 3, low_stock_unit: "pack" }),
].map((row) => ({ ...row, is_weight_based: false, stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }] }))

const GARNIER_TAXES = [
  { name: "Import Duty", type: "percentage", value: 20 },
  { name: "Additional Customs Duty", type: "percentage", value: 2 },
  { name: "Regulatory Duty", type: "percentage", value: 20 },
  { name: "Import Sales Tax", type: "percentage", value: 25 },
]
const GARNIER_VARIANTS = [
  pv("Vitamin C Brightening Cream 50g", "GARNIER-VITC-50G", "8901030000018", { cost: 450, price: 650, colors: ["#F59E0B", "#FFFFFF"], stock: [{ location_id: 1, qty: 20 }] }),
  pv("Bright Complete Cream 50g", "GARNIER-BRIGHT-50G", "8901030000025", { cost: 500, price: 750, colors: ["#FBBF24"], stock: [{ location_id: 1, qty: 15 }] }),
  pv("Sakura Glow Cream 50g", "GARNIER-SAKURA-50G", "8901030000032", { cost: 550, price: 800, colors: ["#F9A8D4", "#FFFFFF"], stock: [{ location_id: 1, qty: 10 }] }),
  pv("Vitamin C Brightening Cream 100g", "GARNIER-VITC-100G", "8901030000049", { cost: 800, price: 1100, stock: [{ location_id: 1, qty: 10 }] }),
  pv("Men TurboBright Cream 50g", "GARNIER-MEN-50G", "8901030000056", { cost: 600, price: 850, stock: [{ location_id: 1, qty: 10 }] }),
].map((row) => ({ ...row, is_weight_based: false }))

// Almonds are counted in grams: a 250 g pack is pack_size 250; loose almonds are priced per gram
// (Rs 5,500 a kg = 5.5 a gram) and their stock is in grams (25 kg = 25000).
const ALMOND_VARIANTS = [
  pv("American Almonds 250g Pack", "ALMONDS-USA-250G", "8961020000018", { is_pack_product: true, pack_size: 250, pack_cost: 350, pack_price: 450, sell_loose: true, stock: [{ location_id: 1, qty: 20, stock_unit: "pack" }] }),
  pv("American Almonds 500g Pack", "ALMONDS-USA-500G", "8961020000025", { is_pack_product: true, pack_size: 500, pack_cost: 680, pack_price: 850, sell_loose: true, stock: [{ location_id: 1, qty: 15, stock_unit: "pack" }] }),
  pv("American Almonds 1kg Pack", "ALMONDS-USA-1KG", "8961020000032", { is_pack_product: true, pack_size: 1000, pack_cost: 1300, pack_price: 1600, sell_loose: true, stock: [{ location_id: 1, qty: 10, stock_unit: "pack" }] }),
  pv("Mamra Almonds", "ALMONDS-MAMRA", "8961020000049", { cost: 4.5, price: 5.5, is_pack_product: false, sell_loose: true, stock: [{ location_id: 1, qty: 25000, stock_unit: "unit" }] }),
  pv("Regular Almonds", "ALMONDS-REGULAR", "8961020000056", { cost: 1.8, price: 2.3, is_pack_product: false, sell_loose: true, stock: [{ location_id: 1, qty: 50000, stock_unit: "unit" }] }),
  pv("California Almonds", "ALMONDS-CALIFORNIA", "8961020000063", { cost: 2.2, price: 2.8, is_pack_product: false, sell_loose: true, stock: [{ location_id: 1, qty: 30000, stock_unit: "unit" }] }),
].map((row) => ({ ...row, is_weight_based: true }))

const PRODUCT_DEFS = [
  { key: "pepsi", number: 1, title: "Pepsi", slug: "pepsi", sku: "PEPSI", barcode: "8961014100004", category_id: 1, unit: "bottle", taxes: [], low_stock_threshold: 10, is_weight_based: false, variants: PEPSI_VARIANTS },
  { key: "garnier", number: 2, title: "Garnier Cream", slug: "garnier-cream", sku: "GARNIER-CREAM", barcode: "8901030000001", category_id: 4, unit: "piece", taxes: GARNIER_TAXES, low_stock_threshold: 10, is_weight_based: false, variants: GARNIER_VARIANTS },
  { key: "almonds", number: 3, title: "Almonds", slug: "almonds", sku: "ALMONDS", barcode: "8961020000001", category_id: 5, unit: "gram", taxes: [], low_stock_threshold: 2000, is_weight_based: true, variants: ALMOND_VARIANTS },
  { key: "sugar", number: 4, title: "Sugar", slug: "sugar", sku: "SUGAR", barcode: "8961030000001", category_id: 3, unit: "kg", taxes: [], low_stock_threshold: 20, is_weight_based: true, cost: 140, price: 160, sell_loose: true, stock: [{ location_id: 1, qty: 100 }], variants: [] },
]
export const PRODUCTS = Object.fromEntries(PRODUCT_DEFS.map((def) => [def.key, def]))
// The Taxes page "Sugar tax" (Rs 5 a unit) is on Pepsi (every variant) and Sugar.
const SUGAR_TAXED = new Set(["pepsi", "sugar"])

/** Unit cost / price of a variant (or a product without variants), and one pack's. */
function priceOf(product, variantId) {
  const row = variantId ? product.variants[variantId - 1] : product
  if (row.is_pack_product) {
    return {
      unit_cost: r2(row.pack_cost / row.pack_size), unit_price: r2(row.pack_price / row.pack_size),
      pack_cost: row.pack_cost, pack_price: row.pack_price, pack_size: row.pack_size, is_pack: true, sell_loose: row.sell_loose,
    }
  }
  return { unit_cost: row.cost, unit_price: row.price, pack_cost: null, pack_price: null, pack_size: null, is_pack: false, sell_loose: Boolean(row.sell_loose) }
}

/** A product reference in a reply: the product's number and title; a variant inside it. */
export function productRef(product, variantId, { barcode = true } = {}) {
  const variant = variantId ? product.variants[variantId - 1] : null
  return {
    id: product.number,
    title: variant ? `${product.title} - ${variant.name}` : product.title,
    sku: variant ? variant.sku : product.sku,
    ...(barcode ? { barcode: variant ? variant.barcode : product.barcode } : {}),
    unit: product.unit,
    variant: variant ? { id: variantId, name: variant.name } : null,
  }
}

const PROD_BULK_BODY = {
  storeId: 1,
  items: PRODUCT_DEFS.map((def) => {
    const base = {
      title: def.title, sku: def.sku, barcode: def.barcode, category_id: def.category_id, unit: def.unit,
      taxes: def.taxes, low_stock_threshold: def.variants.length ? 0 : def.low_stock_threshold, is_weight_based: def.is_weight_based, image: "",
      location_scope: "all", stock_scope: "all",
    }
    if (!def.variants.length) return { ...base, cost: def.cost, price: def.price, sell_loose: def.sell_loose, stock: def.stock }
    // Each variant carries its own low stock level; the product's own is 0.
    return { ...base, variants: def.variants.map((v) => ({ low_stock_threshold: def.low_stock_threshold, ...v })) }
  }),
}

// ---------------------------------------------------------------- stock (what each list shows at the end)

// Opening stock (Bulk Products), then the movements, sales and refunds below, at location 1.
const stockNow = new Map() // "product|variant|location" -> units
const key = (product, variantId, location) => `${product.key}|${variantId || 0}|${location}`
for (const def of PRODUCT_DEFS) {
  const rows = def.variants.length ? def.variants.map((v, i) => [i + 1, v]) : [[0, def]]
  for (const [variantId, row] of rows) {
    for (const entry of row.stock || []) {
      const units = entry.stock_unit === "pack" ? entry.qty * row.pack_size : entry.qty
      stockNow.set(key(def, variantId, entry.location_id), units)
    }
  }
}
const moveStock = (product, variantId, location, delta) => {
  const k = key(product, variantId, location)
  const next = r2((stockNow.get(k) || 0) + delta)
  stockNow.set(k, next)
  return next
}

// ---------------------------------------------------------------- lots

// Each stock in is a lot with its own expiry date (the same date adds to that lot); stock out takes
// the lot that expires first (FEFO: by date, lots without one last, then the oldest).
const LOTS = new Map() // key -> [{ id, qty, expiry_date, received_at, source }]
// Lot numbers run 1, 2, 3… per product (or variant).
const lotNumbers = new Map()
const productOfKey = (k) => k.split("|").slice(0, 2).join("|")
const DOC_TODAY = Date.UTC(2026, 10, 7)
const daysLeft = (date) => (date ? Math.round((Date.parse(`${date}T00:00:00Z`) - DOC_TODAY) / 86400000) : null)
function lotStatus(date) {
  const left = daysLeft(date)
  if (left == null) return null
  if (left < 0) return "expired"
  if (left <= 7) return "critical"
  if (left <= 30) return "warning"
  return "ok"
}
export const lotView = (lot) => ({
  id: lot.id, qty: lot.qty, expiry_date: lot.expiry_date, days_left: daysLeft(lot.expiry_date),
  expiry_status: lotStatus(lot.expiry_date), received_at: lot.received_at, source: lot.source,
})
const fefo = (list) =>
  [...list].sort((a, b) => (a.expiry_date == null) - (b.expiry_date == null) || String(a.expiry_date).localeCompare(String(b.expiry_date)) || a.received_at.localeCompare(b.received_at) || a.id - b.id)
const lotsAt = (k) => LOTS.get(k) || []
/** The lots in stock at a key, soonest expiry first. */
const lotsInStock = (k) => fefo(lotsAt(k).filter((lot) => lot.qty > 0))
function putLot(k, qty, expiry, at, source) {
  const list = lotsAt(k)
  let lot = list.find((row) => row.expiry_date === (expiry || null))
  if (!lot) {
    const next = (lotNumbers.get(productOfKey(k)) || 0) + 1
    lotNumbers.set(productOfKey(k), next)
    lot = { id: next, qty: 0, expiry_date: expiry || null, received_at: at, source }
    list.push(lot)
    LOTS.set(k, list)
  }
  lot.qty = r2(lot.qty + qty)
  return [{ id: lot.id, qty, expiry_date: lot.expiry_date }]
}
function takeLots(k, qty, lotId = null) {
  const out = []
  let need = qty
  for (const lot of lotId ? lotsAt(k).filter((row) => row.id === lotId) : lotsInStock(k)) {
    if (need <= 0) break
    const part = Math.min(need, lot.qty)
    lot.qty = r2(lot.qty - part)
    out.push({ id: lot.id, qty: -part, expiry_date: lot.expiry_date })
    need = r2(need - part)
  }
  return out
}
/** A refund: back into the lots the sale line took (the last one first). */
function returnLots(k, line, qty) {
  const out = []
  let left = qty
  for (const taken of [...(line.lots || [])].reverse()) {
    if (left <= 0) break
    const free = taken.qty - (taken.returned || 0)
    const part = Math.min(free, left)
    if (part <= 0) continue
    const lot = lotsAt(k).find((row) => row.id === taken.id)
    lot.qty = r2(lot.qty + part)
    taken.returned = r2((taken.returned || 0) + part)
    out.push({ id: lot.id, qty: part, expiry_date: lot.expiry_date })
    left = r2(left - part)
  }
  return out
}
// Opening stock (Bulk Products): one lot per variant and location, no expiry date.
for (const def of PRODUCT_DEFS) {
  const rows = def.variants.length ? def.variants.map((v, i) => [i + 1, v]) : [[0, def]]
  for (const [variantId, row] of rows) {
    for (const entry of row.stock || []) {
      const units = entry.stock_unit === "pack" ? entry.qty * row.pack_size : entry.qty
      putLot(key(def, variantId, entry.location_id), units, entry.expiry_date || null, "2026-11-01T06:00:00.000Z", "opening")
    }
  }
}

// ---------------------------------------------------------------- stock movements

let movementNumber = PRODUCT_DEFS.reduce((n, def) => n + Math.max(1, def.variants.length), 0) // opening balances: 1–19
const MOVEMENTS = []
function movement({ product, variantId, location = 1, type, reason, qty, note: reasonNote = null, supplier = null, staff = ZAYAN, at, order = null, expiry = null, lotId = null, refundOf = null }) {
  movementNumber += 1
  const k = key(product, variantId, location)
  const source = reason === "purchase" ? "purchase" : reason === "refund" ? "refund" : type === "adjustment" ? "adjustment" : "stock_in"
  const lots = qty > 0 ? (refundOf ? returnLots(k, refundOf, qty) : putLot(k, qty, expiry, at, source)) : takeLots(k, -qty, lotId)
  const after = moveStock(product, variantId, location, qty)
  const row = {
    id: movementNumber,
    location: LOCATIONS[location],
    product: { id: product.number, title: product.title, sku: product.sku, unit: product.unit },
    variant: variantId ? { id: variantId, name: product.variants[variantId - 1].name, sku: product.variants[variantId - 1].sku } : null,
    supplier: supplier ? SUPPLIERS[supplier] : null,
    staff,
    // Only the order's number: its status changes, a movement does not.
    order: order ? { id: order.id } : null,
    movement_type: type,
    reason,
    reason_note: reasonNote,
    qty,
    qty_after: after,
    // The lot(s) it moved: [{ id (lot number), qty, expiry_date }].
    lots,
    created_at: at,
  }
  MOVEMENTS.push(row)
  return row
}

const MOVEMENT_BULK_BODY = {
  storeId: 1,
  staffId: 1,
  items: [
    {
      product_id: 1, movement_type: "stock_in", reason: "purchase", supplier_id: 1, reason_note: "Bill #4521",
      variants: [{ id: 1, stock: [{ location_id: 1, qty: 10, stock_unit: "pack", expiry_date: "2027-03-31" }] }],
    },
    {
      product_id: 2, movement_type: "stock_out", reason: "damage", reason_note: "1 jar cracked in delivery",
      variants: [{ id: 2, stock: [{ location_id: 1, qty: 1, lot_id: 1 }] }],
    },
    { product_id: 22, movement_type: "stock_in", reason: "purchase", supplier_id: 3, reason_note: "Bill #RM-208", stock: [{ location_id: 1, qty: 50, expiry_date: "2027-06-30" }] },
  ],
}
const MOVEMENT_BULK_ROWS = [
  movement({ product: PRODUCTS.pepsi, variantId: 1, type: "stock_in", reason: "purchase", qty: 50, note: "Bill #4521", supplier: 1, at: "2026-11-06T08:00:00.000Z", expiry: "2027-03-31" }),
  movement({ product: PRODUCTS.garnier, variantId: 2, type: "stock_out", reason: "damage", qty: -1, note: "1 jar cracked in delivery", at: "2026-11-06T08:00:00.000Z", lotId: 1 }),
  movement({ product: PRODUCTS.sugar, type: "stock_in", reason: "purchase", qty: 50, note: "Bill #RM-208", supplier: 3, at: "2026-11-06T08:00:00.000Z", expiry: "2027-06-30" }),
]
const EXPIRY = { [key(PRODUCTS.pepsi, 1, 1)]: "2027-03-31", [key(PRODUCTS.sugar, 0, 1)]: "2027-06-30" }

// ---------------------------------------------------------------- stock transfers

const TRANSFER_BULK_BODY = {
  storeId: 1,
  staffId: 1,
  items: [
    {
      from_location_id: 1,
      note: "Branch 2 weekly refill",
      destinations: [{ to_location_id: 2, products: [{ product_id: 1, variant_id: 4, qty: 10 }, { product_id: 2, variant_id: 1, qty: 5 }] }],
    },
  ],
}
const transferView = ({ qty15 = 10, extra = null } = {}) => ({
  id: 1,
  from_location: L1,
  status: "on_the_way",
  destinations: [
    {
      to_location: L2,
      status: "on_the_way",
      products: [
        { product: productRef(PRODUCTS.pepsi, 4, { barcode: false }), qty: qty15, received_qty: null, status: "on_the_way" },
        { product: productRef(PRODUCTS.garnier, 1, { barcode: false }), qty: 5, received_qty: null, status: "on_the_way" },
        ...(extra ? [extra] : []),
      ],
    },
  ],
  note: "Branch 2 weekly refill",
  staff: ZAYAN,
  created_at: "2026-11-06T08:30:00.000Z",
})

// ---------------------------------------------------------------- discounts (offers)

const OFFERS = [
  {
    id: 1, type: "promotional", name: "Azaadi Sale", apply_to: "product",
    products: GARNIER_VARIANTS.map((_, i) => ({ ...productRef(PRODUCTS.garnier, i + 1, { barcode: false }), sale_unit: "both", promo_price: null, promo_pack_price: null, free_product: null })),
    categories: [], discount_type: "percentage", discount_value: 10, sale_unit: "both",
    start_at: "2026-11-01T00:00:00.000Z", end_at: "2026-11-30T18:59:00.000Z",
    min_qty: null, min_qty_unit: "unit", buy_qty: null, buy_unit: "unit", get_qty: null, get_unit: "unit",
  },
  {
    id: 2, type: "bulk_discount", name: "Stock Up & Save", apply_to: "product",
    products: [1, 2, 3].map((v) => ({ ...productRef(PRODUCTS.almonds, v, { barcode: false }), sale_unit: "pack", promo_price: null, promo_pack_price: null, free_product: null })),
    categories: [], discount_type: "percentage", discount_value: 5, sale_unit: "pack",
    start_at: "2026-11-01T00:00:00.000Z", end_at: null,
    min_qty: 2, min_qty_unit: "pack", buy_qty: null, buy_unit: "unit", get_qty: null, get_unit: "unit",
  },
  {
    id: 3, type: "flash_sale", name: "Midnight Madness", apply_to: "product",
    products: [{ ...productRef(PRODUCTS.sugar, null, { barcode: false }), sale_unit: "unit", promo_price: 140, promo_pack_price: null, free_product: null }],
    categories: [], discount_type: null, discount_value: null, sale_unit: "unit",
    start_at: "2026-11-06T19:00:00.000Z", end_at: "2026-11-07T01:00:00.000Z",
    min_qty: null, min_qty_unit: "unit", buy_qty: null, buy_unit: "unit", get_qty: null, get_unit: "unit",
  },
  {
    id: 4, type: "bogo", name: "Double Delight", apply_to: "product",
    products: [{ ...productRef(PRODUCTS.pepsi, 7, { barcode: false }), sale_unit: "unit", promo_price: null, promo_pack_price: null, free_product: null }],
    categories: [], discount_type: null, discount_value: null, sale_unit: "unit",
    start_at: "2026-11-01T00:00:00.000Z", end_at: "2026-11-15T18:59:00.000Z",
    min_qty: null, min_qty_unit: "unit", buy_qty: 2, buy_unit: "unit", get_qty: 1, get_unit: "unit",
  },
].map((offer) => ({ ...offer, location_scope: "all", locations: [], is_active: true, status: "active", staff: ZAYAN, created_at: "2026-11-01T06:00:00.000Z" }))
const OFFER = Object.fromEntries(OFFERS.map((row) => [row.id, row]))
// The one bulk discount (buy X get Y) of the old samples: the others are product / category discounts now.
export const OFFER_SAMPLES = [OFFER[4]]
const isBulkOffer = (offerId) => OFFER[offerId]?.type === "bogo"
const offerOnLine = (offerId, amount) => {
  const o = OFFER[offerId]
  return { discount_id: o.id, name: o.name, type: o.type, discount_type: o.discount_type, discount_value: o.discount_value, amount }
}

// ---------------------------------------------------------------- the POS price of a line

/**
 * One line as the POS prices it. sale_unit pack: qty = packs, price = one pack's. qty on a loose
 * weight line is in the product unit (grams for Almonds, kg for Sugar).
 */
function priceLine({ product, variantId = null, sale_unit = "unit", qty, offerId = null, discountAmount = null, freeQty = 0 }) {
  const price = priceOf(product, variantId)
  const pack = sale_unit === "pack"
  const unitPrice = pack ? price.pack_price : price.unit_price
  const unitCost = pack ? price.pack_cost : price.unit_cost
  const units = pack ? qty * price.pack_size : qty
  const gross = r2(unitPrice * qty)
  const category = CATEGORIES[product.category_id]
  // The offer's discount when it has one; otherwise the category's (one discount per line).
  let discount = discountAmount
  if (discount == null) discount = !offerId && category.discount_type === "percentage" && category.discount_value > 0 ? r2((gross * category.discount_value) / 100) : 0
  const subtotal = r2(gross - discount)
  const taxes = [
    ...product.taxes.map((tax) => ({ level: "product", name: tax.name, rate: tax.value, amount: r2((subtotal * tax.value) / 100) })),
    { level: "store", name: GST.name, rate: GST.value, amount: r2((subtotal * GST.value) / 100) },
    ...(SUGAR_TAXED.has(product.key) ? [{ level: "store", name: SUGAR_TAX.name, rate: SUGAR_TAX.value, amount: r2(units * SUGAR_TAX.value) }] : []),
    ...(category.tax_type === "percentage" && category.tax_value > 0 ? [{ level: "category", name: category.tax_name, rate: category.tax_value, amount: r2((subtotal * category.tax_value) / 100) }] : []),
  ]
  const tax_amount = sum(taxes, (tax) => tax.amount)
  return {
    product, variantId, sale_unit, qty, units, unitPrice, unitCost, gross, discount, offerId, freeQty, subtotal, taxes, tax_amount,
    total: r2(subtotal + tax_amount),
  }
}

/** The request line (what the POS sends). */
function lineRequest(line) {
  return {
    product_id: line.product.number,
    ...(line.variantId ? { variant_id: line.variantId } : {}),
    sale_unit: line.sale_unit,
    qty: line.qty,
    unit_price: line.unitPrice,
    cost_price: line.unitCost,
    discount_amount: line.discount,
    discount: line.offerId && isBulkOffer(line.offerId) ? [{ discount_id: line.offerId }] : [],
    ...(line.freeQty ? { free_qty: line.freeQty } : {}),
    subtotal: line.subtotal,
    taxes: line.taxes,
    tax_amount: line.tax_amount,
    total: line.total,
  }
}

/** A custom line (not in the catalog). */
function customLine({ title, category, qty, price, cost }) {
  const subtotal = r2(qty * price)
  const taxes = [{ level: "store", name: GST.name, rate: GST.value, amount: r2((subtotal * GST.value) / 100) }]
  const tax_amount = sum(taxes, (tax) => tax.amount)
  return { custom: true, title, category, qty, unitPrice: price, unitCost: cost, gross: subtotal, discount: 0, subtotal, taxes, tax_amount, total: r2(subtotal + tax_amount) }
}

/** payments: [{ method, bill_share, paid? }] → the surcharge of each (card 2%, JazzCash Rs 25, cash none). */
function pay(rows) {
  return rows.map((row) => {
    const rule = SURCHARGES[row.method]
    const surcharge = !rule ? 0 : rule.type === "percentage" ? r2((row.bill_share * rule.charges) / 100) : rule.charges
    const amount = r2(row.bill_share + surcharge)
    return {
      method: row.method,
      bill_share: row.bill_share,
      surcharge_type: rule ? rule.type : null,
      surcharge_value: rule ? rule.charges : null,
      surcharge_amount: surcharge,
      amount,
      paid: row.paid ?? amount,
      change: row.method === "cash" ? r2((row.paid ?? amount) - amount) : 0,
    }
  })
}

// ---------------------------------------------------------------- the 3 sales

function sale({ number, localId, receiptNo, placedAt, customer = null, lines, payments, isCustom = false }) {
  const subtotal = sum(lines, (l) => l.subtotal)
  const tax = sum(lines, (l) => l.tax_amount)
  const surcharge = sum(payments, (p) => p.surcharge_amount)
  const total = r2(subtotal + tax + surcharge)
  const billShare = sum(payments, (p) => p.bill_share)
  if (Math.abs(billShare - r2(subtotal + tax)) > 0.01) throw new Error(`sale ${number}: payments do not cover the bill`)
  return {
    number, localId, receiptNo, placedAt, customer, lines, payments, isCustom,
    gross: sum(lines, (l) => l.gross), discount: sum(lines, (l) => l.discount), subtotal, tax, surcharge, total,
    paid: sum(payments, (p) => p.paid), change: sum(payments, (p) => p.change),
  }
}

// Order 1 — several items, one payment (card).
const O1lines = [
  // 1 pack of Pepsi 1.5L (category discount: Beverages 5%).
  priceLine({ product: PRODUCTS.pepsi, variantId: 4, sale_unit: "pack", qty: 1 }),
  // 2 Garnier Vitamin C 50g with Azaadi Sale (10% off).
  priceLine({ product: PRODUCTS.garnier, variantId: 1, qty: 2, offerId: 1, discountAmount: 130 }),
  // 2 packs of Almonds 500g with Stock Up & Save (5% off from 2 packs).
  priceLine({ product: PRODUCTS.almonds, variantId: 2, sale_unit: "pack", qty: 2, offerId: 2, discountAmount: 85 }),
]
const O1 = sale({
  number: 1, localId: "POS1-20261106-0001", receiptNo: "POS1-R-0001", placedAt: "2026-11-06T10:05:00.000Z",
  lines: O1lines,
  payments: pay([{ method: "card", bill_share: r2(sum(O1lines, (l) => l.subtotal) + sum(O1lines, (l) => l.tax_amount)) }]),
})

// Order 2 — a custom sale: a customer buys things that are not in the inventory.
const O2lines = [
  customLine({ title: "Steel Water Bottle 1L", category: "Kitchenware", qty: 1, price: 850, cost: 600 }),
  customLine({ title: "Gift Wrapping", category: "Services", qty: 1, price: 150, cost: 20 }),
]
const O2 = sale({
  number: 2, localId: "POS1-20261106-0002", receiptNo: "POS1-R-0002", placedAt: "2026-11-06T11:20:00.000Z", customer: CUSTOMERS[1], isCustom: true,
  lines: O2lines,
  payments: pay([{ method: "cash", bill_share: r2(sum(O2lines, (l) => l.subtotal) + sum(O2lines, (l) => l.tax_amount)), paid: 1200 }]),
})

// Order 3 — split over three methods (card, JazzCash, cash), in the Midnight Madness hours.
const O3lines = [
  priceLine({ product: PRODUCTS.sugar, qty: 5, offerId: 3, discountAmount: 100 }),
  priceLine({ product: PRODUCTS.pepsi, variantId: 7, qty: 3, offerId: 4, discountAmount: 120, freeQty: 1 }),
  priceLine({ product: PRODUCTS.almonds, variantId: 4, qty: 250 }),
]
const O3bill = r2(sum(O3lines, (l) => l.subtotal) + sum(O3lines, (l) => l.tax_amount))
const O3 = sale({
  number: 3, localId: "POS1-20261106-0003", receiptNo: "POS1-R-0003", placedAt: "2026-11-06T19:30:00.000Z",
  lines: O3lines,
  payments: pay([
    { method: "card", bill_share: 1000 },
    { method: "jazzcash", bill_share: r2(O3bill - 2000) },
    { method: "cash", bill_share: 1000, paid: 1000 },
  ]),
})
export const ORDERS = [O1, O2, O3]

function orderRequest(order) {
  return {
    client_local_id: order.localId,
    local_receipt_number: order.receiptNo,
    placed_at: order.placedAt,
    customer_id: order.customer ? order.customer.id : null,
    lines: order.lines.map((line) =>
      line.custom
        ? {
            title: line.title, category: line.category, qty: line.qty, unit_price: line.unitPrice, cost_price: line.unitCost,
            discount_amount: 0, discount: [], subtotal: line.subtotal, taxes: line.taxes, tax_amount: line.tax_amount, total: line.total,
          }
        : lineRequest(line)
    ),
    order_discount: null,
    coupon: null,
    gross_amount: order.gross,
    discount_amount: order.discount,
    subtotal: order.subtotal,
    tax_amount: order.tax,
    surcharge_amount: order.surcharge,
    payments: order.payments.map((p) => ({
      method: p.method,
      ...(p.surcharge_type ? { surcharge_type: p.surcharge_type, surcharge_value: p.surcharge_value } : {}),
      surcharge_amount: p.surcharge_amount,
      amount: p.amount,
      paid: p.paid,
    })),
    total_amount: order.total,
  }
}
const ORDER_BULK_BODY = { storeId: 1, locationId: 1, staffId: 2, batchId: 1, items: ORDERS.map(orderRequest) }

// The sale moves stock (order 2 is custom: no stock).
const SALE_MOVEMENTS = []
for (const order of [O1, O3]) {
  for (const line of order.lines) {
    const moved = movement({ product: line.product, variantId: line.variantId, type: "sale", reason: "sale", qty: -line.units, staff: AHMED, at: order.placedAt, order: { id: order.number, status: "completed" } })
    // The lots the line was sold from (a refund puts it back there).
    line.lots = moved.lots.map((lot) => ({ ...lot, qty: -lot.qty }))
    SALE_MOVEMENTS.push(moved)
  }
}

// ---------------------------------------------------------------- refunds

function refundLine(order, itemNumber, qty, { restock = true } = {}) {
  const line = order.lines[itemNumber - 1]
  const share = qty / line.qty
  const taxes = line.taxes.map((tax) => ({ ...tax, amount: r2(tax.amount * share) }))
  const amount = r2(line.subtotal * share)
  const tax = sum(taxes, (t) => t.amount)
  return { order, itemNumber, line, qty, restock: restock && !line.custom, discount: r2(line.discount * share), amount, taxes, tax, total: r2(amount + tax) }
}

function refund({ number, type, localId, at, order, reason, lines, payments, receiptId, restockAll }) {
  const amount = sum(lines, (l) => l.amount)
  const tax = sum(lines, (l) => l.tax)
  const surcharge = sum(payments, (p) => p.surcharge_amount)
  const total = sum(payments, (p) => p.amount)
  if (Math.abs(total - r2(amount + tax + surcharge)) > 0.01) throw new Error(`refund ${number}: payments do not add up`)
  return { number, type, localId, at, order, reason, lines, payments, receiptId, restockAll, amount, discount: sum(lines, (l) => l.discount), tax, surcharge, total }
}

/** Pays a refund back: each method its share of the bill, with its surcharge (as on the sale). */
const backWith = (rows) => pay(rows).map(({ paid, change, ...row }) => row)

// Partial: something from each order (staff Zayan — refunds need a store admin / manager).
const R1lines = [refundLine(O1, 2, 1)]
const R1 = refund({
  number: 1, type: "partial", localId: "POS1-R-20261106-0001", at: "2026-11-06T13:00:00.000Z", order: O1, reason: "Customer return", receiptId: 4,
  lines: R1lines, payments: backWith([{ method: "card", bill_share: r2(sum(R1lines, (l) => l.total)) }]),
})
const R2lines = [refundLine(O2, 2, 1)]
const R2 = refund({
  number: 2, type: "partial", localId: "POS1-R-20261106-0002", at: "2026-11-06T13:10:00.000Z", order: O2, reason: "Gift wrap not needed", receiptId: 5,
  lines: R2lines, payments: backWith([{ method: "cash", bill_share: r2(sum(R2lines, (l) => l.total)) }]),
})
const R3lines = [refundLine(O3, 1, 2)]
const R3 = refund({
  number: 3, type: "partial", localId: "POS1-R-20261106-0003", at: "2026-11-06T20:10:00.000Z", order: O3, reason: "Bought too much", receiptId: 6,
  lines: R3lines, payments: backWith([{ method: "cash", bill_share: r2(sum(R3lines, (l) => l.total)) }]),
})
// Complete: what is left on order 3 (3 kg Sugar, 3 Pepsi Cane, 250 g Mamra), back the way it was paid.
const R4lines = [refundLine(O3, 1, 3), refundLine(O3, 2, 3), refundLine(O3, 3, 250)]
const R4bill = r2(sum(R4lines, (l) => l.total))
const R4 = refund({
  number: 4, type: "complete", localId: "POS1-R-20261107-0001", at: "2026-11-07T09:00:00.000Z", order: O3, reason: "Customer changed mind", receiptId: 7, restockAll: true,
  lines: R4lines,
  payments: backWith([
    { method: "card", bill_share: 1000 },
    { method: "jazzcash", bill_share: O3.payments[1].bill_share },
    { method: "cash", bill_share: r2(R4bill - 1000 - O3.payments[1].bill_share) },
  ]),
})
export const REFUNDS = [R1, R2, R3, R4]

// Restocked qty goes back (custom lines hold no stock).
for (const ref of REFUNDS) {
  for (const line of ref.lines) {
    if (!line.restock) continue
    const units = line.line.sale_unit === "pack" ? line.qty * priceOf(line.line.product, line.line.variantId).pack_size : line.qty
    movement({ product: line.line.product, variantId: line.line.variantId, type: "refund", reason: "refund", qty: units, at: ref.at, order: { id: ref.order.number, status: ref === R4 ? "refunded" : "partial_refunded" }, refundOf: line.line })
  }
}

const statusOf = (order) => (order === O3 ? "refunded" : "partial_refunded")

function refundRequest(ref) {
  return {
    client_local_id: ref.localId,
    refunded_at: ref.at,
    order_id: ref.order.number,
    reason: ref.reason,
    ...(ref.restockAll ? { restock: true } : {}),
    lines: ref.lines.map((l) => ({
      order_item_id: l.itemNumber,
      qty: l.qty,
      ...(ref.restockAll ? {} : { restock: l.restock }),
      discount_amount: l.discount,
      amount: l.amount,
      taxes: l.taxes,
      total: l.total,
    })),
    payments: ref.payments.map((p) => ({
      method: p.method,
      ...(p.surcharge_type ? { surcharge_type: p.surcharge_type, surcharge_value: p.surcharge_value } : {}),
      surcharge_amount: p.surcharge_amount,
      amount: p.amount,
    })),
    total_amount: ref.total,
  }
}

function lineProduct(line) {
  return line.custom ? { title: line.title, category: { id: null, name: line.category } } : { product: productRef(line.product, line.variantId) }
}

function refundView(ref) {
  return {
    id: ref.number,
    refund_type: ref.type,
    client_local_id: ref.localId,
    location: L1,
    staff: ZAYAN,
    batch: BATCH,
    order: { id: ref.order.number, status: statusOf(ref.order) },
    customer: ref.order.customer,
    receiptId: ref.receiptId,
    currency: "PKR",
    reason: ref.reason,
    lines: ref.lines.map((l) => ({
      order_item_id: l.itemNumber,
      ...lineProduct(l.line),
      qty: l.qty,
      sale_unit: l.line.custom ? "unit" : l.line.sale_unit,
      unit_price: l.line.unitPrice,
      discount_amount: l.discount,
      amount: l.amount,
      taxes: l.taxes,
      tax: l.tax,
      total: l.total,
      restocked: l.restock,
    })),
    amount: ref.amount,
    discount_amount: ref.discount,
    tax: ref.tax,
    surcharge: ref.surcharge,
    total: ref.total,
    payments: ref.payments,
    refunded_at: ref.at,
    synced_at: ref.at.replace(/:00\.000Z$/, ":04.000Z"),
  }
}

// ---------------------------------------------------------------- the order as the API returns it

const refundedQty = (order, itemNumber) =>
  sum(REFUNDS.filter((r) => r.order === order).flatMap((r) => r.lines).filter((l) => l.itemNumber === itemNumber), (l) => l.qty)

/** What was given back of one order line (all its refunds added up). */
function lineRefund(order, itemNumber) {
  const rows = REFUNDS.filter((r) => r.order === order).flatMap((r) => r.lines).filter((l) => l.itemNumber === itemNumber)
  return {
    is_refunded: rows.length > 0,
    refund_qty: sum(rows, (l) => l.qty),
    refund_amount: sum(rows, (l) => l.amount),
    refund_tax: sum(rows, (l) => l.tax),
    refund_discount_amount: sum(rows, (l) => l.discount),
    refund_total: sum(rows, (l) => l.total),
  }
}

/** refundOf (order lines only): the order whose refunds to show; null = nothing refunded yet. */
function orderItemView(line, index, refundOf) {
  const common = {
    gross_amount: line.gross,
    discount_amount: line.discount,
    discount: line.offerId && isBulkOffer(line.offerId) ? [offerOnLine(line.offerId, line.discount)] : [],
    free_qty: line.freeQty || 0,
    subtotal: line.subtotal,
    taxes: line.taxes,
    tax_amount: line.tax_amount,
    total: line.total,
    ...(refundOf === undefined ? {} : refundOf ? lineRefund(refundOf, index + 1) : { is_refunded: false, refund_qty: 0, refund_amount: 0, refund_tax: 0, refund_discount_amount: 0, refund_total: 0 }),
  }
  if (line.custom) {
    return { id: index + 1, title: line.title, category: { id: null, name: line.category }, qty: line.qty, unit_price: line.unitPrice, ...common }
  }
  const category = CATEGORIES[line.product.category_id]
  return {
    id: index + 1,
    product: productRef(line.product, line.variantId),
    category: { id: category.id, name: category.name },
    qty: line.qty,
    sale_unit: line.sale_unit,
    ...(line.sale_unit === "pack" ? { pack_size: line.units / line.qty, units: line.units } : {}),
    unit_price: line.unitPrice,
    ...common,
    // The lots it was sold from (soonest expiry first): [{ id (lot number), qty, expiry_date }].
    lots: (line.lots || []).map(({ id, qty, expiry_date }) => ({ id, qty, expiry_date })),
  }
}

function orderRefund(order, afterRefunds) {
  const rows = afterRefunds ? REFUNDS.filter((r) => r.order === order) : []
  return {
    is_refunded: rows.length > 0,
    refund_status: !rows.length ? "none" : order === O3 ? "full" : "partial",
    refund_count: rows.length,
    refund_amount: sum(rows, (r) => r.amount),
    refund_tax: sum(rows, (r) => r.tax),
    refund_discount_amount: sum(rows, (r) => r.discount),
    refund_total: sum(rows, (r) => r.total),
  }
}

export function orderView(order, { afterRefunds = false } = {}) {
  return {
    id: order.number,
    client_local_id: order.localId,
    local_receipt_number: order.receiptNo,
    receiptId: order.number,
    location: L1,
    staff: AHMED,
    customer: order.customer,
    batch: BATCH,
    currency: "PKR",
    is_custom: order.isCustom,
    order_items: order.lines.map((line, index) => orderItemView(line, index, afterRefunds ? order : null)),
    gross_amount: order.gross,
    discount_amount: order.discount,
    order_discount: null,
    coupon: null,
    subtotal: order.subtotal,
    tax_amount: order.tax,
    surcharge_amount: order.surcharge,
    total_amount: order.total,
    payment_method: order.payments.length > 1 ? "mixed" : order.payments[0].method,
    payments: order.payments,
    amount_paid: order.paid,
    change_due: order.change,
    remaining_amount: 0,
    payment_status: afterRefunds && order === O3 ? "refunded" : "paid",
    order_status: afterRefunds ? statusOf(order) : "completed",
    // What was given back, every partial and complete refund added up (each one is in GET /orders/refunds).
    ...orderRefund(order, afterRefunds),
    fbr_invoice_enabled: false,
    fbr_tax_amount: 0,
    cancel_reason: null,
    cancelled_by: null,
    placed_at: order.placedAt,
    synced_at: order.placedAt.replace(/:00\.000Z$/, ":03.000Z"),
    channel: "pos",
    is_pos_visible: true,
    is_web_visible: false,
  }
}

/** The receipt (GET /orders/:id, /orders/:id/receipt). */
function receiptView(order, { withHistory = false } = {}) {
  const view = {
    id: order.number,
    order_id: order.number,
    local_receipt_number: order.receiptNo,
    store: { name: STORE.name, ntn: STORE.ntn, strn: STORE.strn },
    issued_at: order.placedAt,
    channel: "pos",
    status: statusOf(order),
    payment_status: order === O3 ? "refunded" : "paid",
    payment_method: order.payments.length > 1 ? "mixed" : order.payments[0].method,
    location: L1,
    cashier: { id: AHMED.id, name: AHMED.name },
    customer: order.customer ? { id: order.customer.id, name: order.customer.name } : null,
    currency: "PKR",
    items: order.lines.map((line, index) => {
      const item = orderItemView(line, index)
      return { ...item, refunded_qty: refundedQty(order, index + 1) }
    }),
    subtotal: order.subtotal,
    tax_amount: order.tax,
    surcharge_amount: order.surcharge,
    total: order.total,
    amount_paid: order.paid,
    change_due: order.change,
    payments: order.payments.map((p) => ({ ...p, status: "success" })),
  }
  if (!withHistory) return view
  return {
    ...view,
    receipt_id: order.number,
    staff: AHMED,
    batch: BATCH,
    is_custom: order.isCustom,
    placed_at: order.placedAt,
    cancel_reason: null,
    transactions: order.payments.map((p, i) => ({ id: order.number * 10 + i, method: p.method, amount: p.amount, surcharge_amount: p.surcharge_amount, status: "success", paid_at: order.placedAt })),
    refunds: REFUNDS.filter((r) => r.order === order).map(refundView),
  }
}

// ---------------------------------------------------------------- products as the API returns them

function stockRows(product, variantId) {
  const rows = []
  for (const location of [1, 2, 3]) {
    const qty = stockNow.get(key(product, variantId, location))
    if (qty == null) continue
    const lots = lotsInStock(key(product, variantId, location))
    rows.push({ location: LOCATIONS[location], qty, expiry_date: lots.find((lot) => lot.expiry_date)?.expiry_date || null, lots: lots.map(lotView) })
  }
  return rows
}
const ownTaxes = (product) => product.taxes.map((tax) => ({ name: tax.name, type: tax.type, value: tax.value }))

function productView(def, { withStock = true } = {}) {
  const variants = def.variants.map((v, i) => {
    const price = priceOf(def, i + 1)
    return {
      id: i + 1,
      name: v.name, sku: v.sku, barcode: v.barcode,
      cost_price: price.unit_cost, selling_price: price.unit_price,
      is_pack_product: price.is_pack, pack_size: price.pack_size, pack_cost_price: price.pack_cost, pack_selling_price: price.pack_price,
      sell_loose: price.is_pack ? price.sell_loose : true, is_weight_based: v.is_weight_based,
      taxes: ownTaxes(def),
      // Its own image (null = show the product's).
      image: null,
      // The colours it comes in (hex codes).
      colors: v.colors || [],
      is_active: true,
    }
  })
  const first = variants[0]
  const own = def.variants.length ? null : priceOf(def, null)
  const taxPct = def.taxes.reduce((s, t) => s + (t.type === "percentage" ? t.value : 0), 0)
  const sell = own ? own.unit_price : first.selling_price
  return {
    id: def.number,
    title: def.title,
    has_variants: Boolean(def.variants.length),
    total_variants: def.variants.length || null,
    variants,
    slug: def.slug,
    category: { id: def.category_id, name: CATEGORIES[def.category_id].name },
    sku: def.sku,
    barcode: def.barcode,
    image: null,
    // The colours it comes in (hex codes); with variants each variant has its own.
    colors: def.colors || [],
    description: null,
    unit: def.unit,
    // A product with variants has no price of its own (0): each variant carries it.
    cost_price: own ? own.unit_cost : 0,
    selling_price: own ? sell : 0,
    has_product_discount: false,
    discount_type: null,
    discount_value: null,
    discount_name: null,
    discount_applies_to: null,
    has_product_tax: Boolean(def.taxes.length),
    taxes: ownTaxes(def),
    // The Taxes page taxes that apply to it: [{ id (tax number), name, type, value }].
    store_taxes: [GST, ...(SUGAR_TAXED.has(def.key) ? [SUGAR_TAX] : [])],
    is_pack_product: false,
    pack_size: null,
    pack_cost_price: null,
    pack_selling_price: null,
    sell_loose: own ? true : false,
    is_weight_based: def.is_weight_based,
    has_bulk_discount: false,
    // 0 on a product with variants: each variant has its own.
    low_stock_threshold: def.variants.length ? 0 : def.low_stock_threshold,
    // What the low stock level counts: pack or unit; null with variants (each variant's level is in GET /products/stock).
    low_stock_unit: def.variants.length ? null : "unit",
    total_price_each_unit: own ? r2(sell * (1 + taxPct / 100)) : 0,
    total_pack_price: null,
    location_scope: "all",
    location_ids: [],
    stock_scope: "all",
    stock_location_ids: [],
    is_active: true,
    is_pos_visible: true,
    is_web_visible: true,
  }
}

// ---------------------------------------------------------------- reply helpers

const ok = (data, message = "OK", extra = {}) => ({ label: "200 OK", status: 200, body: { success: true, message, data, ...extra } })
const created = (data, message) => ({ label: "201 Created", status: 201, body: { success: true, message, data } })
const page = (data) => ok(data, "OK", { pagination: { page: 1, limit: 20, total: data.length, total_pages: 1 } })
const fail = (status, label, message, extra = {}) => ({ label: `${status} — ${label}`, status, body: { success: false, message, ...extra } })

// ---------------------------------------------------------------- the docs entries this data drives

const productTargetsNote = "products [{ product_id, variant_id? (the variant number), sale_unit?, promo_price?, promo_pack_price?, free_product_id? }]"
const PRODUCT_VIEWS = PRODUCT_DEFS.map((def) => productView(def))

const STAFF_ROW = { id: 2, location: L1, name: "Ahmed Malik", email: "ahmed@acadex.co", pin: "2222", role: "cashier", phone: null, is_active: true }

const salesTotals = (() => {
  const orders = ORDERS
  const gross = sum(orders, (o) => o.gross)
  const discounts = sum(orders, (o) => o.discount)
  const net = sum(orders, (o) => o.subtotal)
  const tax = sum(orders, (o) => o.tax)
  const surcharge = sum(orders, (o) => o.surcharge)
  const total = sum(orders, (o) => o.total)
  const refunds = sum(REFUNDS, (r) => r.total)
  const byMethod = {}
  for (const o of orders) for (const p of o.payments) byMethod[p.method] = r2((byMethod[p.method] || 0) + p.surcharge_amount)
  return { gross, discounts, net, tax, surcharge, total, refunds, byMethod }
})()

export const DEMO_EPS = {
  // ---- Authentication / license
  "auth-login": { body: { email: "zayan@acadex.co", password: "zayanahmed" } },
  "license-validate": { body: { license_key: "PASTE_YOUR_LICENSE_KEY", device_uid: 1 } },

  // ---- Staff
  "staff-bulk": {
    body: { storeId: 1, items: [{ locationId: 1, name: "Ahmed Malik", email: "ahmed@acadex.co", password: "ahmedmalik", pin: "2222", role: "cashier" }] },
    responses: [created([STAFF_ROW], "Staff Created")],
  },
  "staff-list": { responses: [page([STAFF_ROW])] },
  "staff-bulk-patch": {
    body: { items: [{ id: 2, phone: "03001112222", pin: "2323" }] },
    responses: [ok([{ ...STAFF_ROW, phone: "03001112222", pin: "2323" }], "Staff Updated")],
  },

  // ---- Categories (the store's three, plus Personal Care and Dry Fruits for the new products)
  "cat-bulk": { body: CAT_BULK_BODY, responses: [created(CATEGORY_ROWS.map(categoryView), "Categories Created")] },
  "cat-list": { responses: [page(CATEGORY_ROWS.map(categoryView))] },
  "cat-bulk-patch": {
    body: { items: [{ id: 4, name: "Personal Care & Beauty", tax_name: "GST", tax_type: "percentage", tax_value: 5 }, { id: 3, discount_name: "Ramzan Sale", discount_type: "percentage", discount_value: 15 }] },
    responses: [
      ok(
        [
          categoryView({ ...CATEGORIES[4], name: "Personal Care & Beauty", slug: "personal-care-beauty", tax_name: "GST", tax_type: "percentage", tax_value: 5 }),
          categoryView({ ...CATEGORIES[3], discount_name: "Ramzan Sale", discount_value: 15 }),
        ],
        "Categories Updated"
      ),
    ],
  },
  "cat-bulk-status-patch": {
    body: { items: [{ id: 2, is_active: false }] },
    responses: [ok([{ ...categoryView(CATEGORIES[2]), is_active: false }], "Category Status Updated")],
  },

  // ---- Products
  "prod-bulk": { body: PROD_BULK_BODY, responses: [created(PRODUCT_DEFS.map((def) => productView(def, { withStock: false })).map((view, i) => withOpening(view, PRODUCT_DEFS[i])), "Products Created")] },
  "prod-list": {
    description:
      "Every product with all its detail, variants inside, and no stock: { id (product number), title, has_variants, total_variants (how many; null without), variants [{ id (variant number 1, 2, 3…), name, sku, barcode, cost_price, selling_price, pack fields, sell_loose, is_weight_based, taxes, image, colors, is_active }], slug, category { id, name }, sku, barcode, image, colors, description, unit, prices, discount, taxes, store_taxes, pack fields, low stock level, location_scope / location_ids, stock_scope / stock_location_ids, is_active, is_pos_visible, is_web_visible }. A product with variants has no price or pack of its own (0 / null), low_stock_threshold 0 and low_stock_unit null: each variant carries its prices and pack, and its low stock level is in GET /products/stock. The stock (qty, lots, expiry, supplier) of every product and variant is not here: it is GET /products/stock. Filters: q (title, SKU or barcode), categoryId (category number). Only products sold at the location read are listed. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range.",
    responses: [page(PRODUCT_VIEWS)],
  },
  "prod-get": { responses: [ok(PRODUCT_VIEWS[0]), { ...ok(PRODUCT_VIEWS[3]), label: "200 OK · without variants" }] },
  "prod-weight-list": {
    description:
      "The Weight Based Products tab as a short list: one row per product, or per variant, sold by weight: { id (product number), title, variant { id, name } | null, sku, category { id, name }, image, unit (kg, gram…), price, cost_price, price_with_tax, pack { size, price } | null, stock, qty_packs, status (active | inactive) }. A product with variants is not a row itself: each of its weight variants is, with the product's id and title and its own variant. price and cost_price are per ONE unit (per kg, per gram); price_with_tax is what one unit is charged: the price after the product and category discounts, plus every tax (the product's own, the Taxes page and the category tax). pack only for a pack product (the pack's size in units and its price), else null; stock is in the unit, at the location read (every location for a store admin without location_id); qty_packs = the whole packs in it (pack products only, else null). cost_price is for the store admin / manager. image is the variant's own, else the product's. Ordered by title, then variant. Paged: page (from 1) and limit (1–200, default 20), with pagination { page, limit, total, total_pages }; range / from / to filter by the created date.",
    responses: [
      page([
        { id: 3, title: "Almonds", variant: { id: 2, name: "Mamra" }, sku: "ALMONDS-MAMRA", category: { id: 5, name: "Dry Fruits" }, image: null, unit: "gram", price: 4.8, cost_price: 3.9, price_with_tax: 5.66, pack: { size: 250, price: 1200 }, stock: 3250, qty_packs: 13, status: "active" },
        { id: 4, title: "Sugar", variant: null, sku: "SUGAR", category: { id: 3, name: "Rice & Daal" }, image: null, unit: "kg", price: 160, cost_price: 140, price_with_tax: 174.92, pack: null, stock: 150, qty_packs: null, status: "active" },
      ]),
    ],
  },
  "prod-expiry": {
    responses: [
      page(
        [
          [PRODUCTS.pepsi, 1],
          [PRODUCTS.sugar, null],
        ].flatMap(([product, variantId]) =>
          lotsInStock(key(product, variantId, 1))
            .filter((lot) => lot.expiry_date)
            .map((lot) => ({ product: productRef(product, variantId), location: L1, lot: { id: lot.id, received_at: lot.received_at }, qty: lot.qty, expiry_date: lot.expiry_date, expiry_status: lotStatus(lot.expiry_date) }))
        )
      ),
    ],
  },
  "prod-bulk-patch": {
    body: { items: [{ id: 1, variants: [{ id: 4, pack_price: 1150, pack_cost: 560 }] }, { id: 4, price: 165, low_stock_threshold: 25 }] },
    responses: [
      ok(
        [
          (() => {
            const v = productView(PRODUCTS.pepsi)
            v.variants[3] = { ...v.variants[3], pack_selling_price: 1150, pack_cost_price: 560, selling_price: 230, cost_price: 112 }
            return v
          })(),
          { ...productView(PRODUCTS.sugar), selling_price: 165, low_stock_threshold: 25, total_price_each_unit: 165 },
        ],
        "Products Updated"
      ),
    ],
  },
  "prod-bulk-status-patch": {
    body: { items: [{ id: 2, is_active: false }] },
    responses: [ok([{ ...productView(PRODUCTS.garnier), is_active: false, variants: productView(PRODUCTS.garnier).variants.map((v) => ({ ...v, is_active: false })) }], "Product Status Updated")],
  },

  // ---- Taxes (GST on every product; Sugar tax on Pepsi and Sugar)
  "tax-bulk": {
    body: { storeId: 1, items: [{ name: "GST", type: "percentage", value: 18, product_scope: "all" }, { name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [1, 4] }] },
  },
  "tax-list": {
    responses: [
      page([
        { id: 1, name: "GST", type: "percentage", value: 18, product_scope: "all", product_ids: [], is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z" },
        {
          id: 2, name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [1, 4],
          is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z",
        },
      ]),
    ],
  },
  "tax-bulk-patch": {
    body: { items: [{ id: 2, value: 6, product_scope: "selected", product_ids: [1, 4, { product_id: 3, variant_id: 4 }] }] },
  },

  // ---- Stock inventory
  "movement-bulk": { body: MOVEMENT_BULK_BODY, responses: [created(MOVEMENT_BULK_ROWS, "Stock Movement Created")] },
  "movement-list": { responses: [page([...MOVEMENTS].reverse().slice(0, 8))] },
  "transfer-bulk": { body: TRANSFER_BULK_BODY, responses: [created([transferView()], "Stock Transfer Created")] },
  "transfer-list": { responses: [page([transferView()])] },
  "transfer-bulk-patch": {
    body: {
      items: [
        {
          id: 1,
          from_location_id: 1,
          note: "Branch 2 weekly refill",
          destinations: [{ to_location_id: 2, products: [{ product_id: 1, variant_id: 4, qty: 15 }, { product_id: 9, variant_id: 1, qty: 5 }, { product_id: 22, qty: 20 }] }],
        },
      ],
    },
    responses: [
      ok([transferView({ qty15: 15, extra: { product: productRef(PRODUCTS.sugar, null, { barcode: false }), qty: 20, received_qty: null, status: "on_the_way" } })], "Stock Transfers Updated"),
      fail(409, "already received", "Part of transfer 1 has been received, so its stock has moved: it cannot be changed", { data: [], failed: [{ index: 0, message: "Part of transfer 1 has been received, so its stock has moved: it cannot be changed", status: 409 }] }),
    ],
  },
  "transfer-delete": {
    responses: [ok({ ...transferView(), deleted_at: "2026-11-07T09:30:00.000Z" }, "Stock Transfer Deleted"), fail(409, "already received", "Part of transfer 1 has been received, so its stock has moved: it cannot be deleted")],
  },

  // ---- Customers
  "customer-bulk": {
    body: { storeId: 1, locationId: 1, items: [{ name: "Ali Khan", phone: "03001231234", total_debt: 5000, remaining_debt: 3500, debt_notes: "Old udhaar from the paper register" }, { name: "Sana Tariq", phone: "03214567890", email: "sana@example.com" }] },
    responses: [
      created(
        [
          { id: 1, name: "Ali Khan", phone: "03001231234", email: null, location_id: 1, total_debt: 5000, remaining_debt: 3500, debt_notes: "Old udhaar from the paper register", is_active: true },
          { id: 2, name: "Sana Tariq", phone: "03214567890", email: "sana@example.com", location_id: 1, total_debt: 0, remaining_debt: 0, debt_notes: null, is_active: true },
        ],
        "Customers Created"
      ),
    ],
  },

  // ---- Orders
  "order-bulk": { body: ORDER_BULK_BODY, responses: [created(ORDERS.map((o) => orderView(o)), "Order Created")] },
  "order-list-completed": { responses: [page([orderView(O2, { afterRefunds: true }), orderView(O1, { afterRefunds: true })])] },
  "order-list-pending": { responses: [page([])] },
  "order-list-cancelled": { responses: [page([])] },
  "order-history": { responses: [page([O3, O2, O1].map((o) => orderView(o, { afterRefunds: true })))] },
  "order-get": { responses: [ok(receiptView(O1, { withHistory: true }))] },
  "order-receipt": { responses: [ok(receiptView(O1))] },
  "transaction-list": {
    responses: [
      page(
        [
          ...ORDERS.flatMap((o) => o.payments.map((p) => ({ kind: "sale", order: { id: o.number, status: statusOf(o) }, method: p.method, amount: p.amount, surcharge_amount: p.surcharge_amount, at: o.placedAt }))),
          ...REFUNDS.flatMap((r) => r.payments.map((p) => ({ kind: "refund", order: { id: r.order.number, status: statusOf(r.order) }, method: p.method, amount: -p.amount, surcharge_amount: -p.surcharge_amount, at: r.at }))),
        ]
          .map((row, i) => ({ id: i + 1, reference: null, type: row.kind, order: row.order, location: L1, method: row.method, amount: row.amount, surcharge_amount: row.surcharge_amount, currency: "PKR", status: "success", paid_at: row.at }))
          .reverse()
      ),
    ],
  },
  "order-bulk-patch": {
    body: { locationId: 1, items: [{ id: 1, customer_id: 2 }] },
    responses: [ok([{ ...orderView(O1, { afterRefunds: true }), customer: CUSTOMERS[2] }], "Orders Updated")],
  },

  // ---- Refunds
  "order-refund-bulk": {
    body: { storeId: 1, locationId: 1, staffId: 1, batchId: 1, items: [R1, R2, R3].map(refundRequest) },
    responses: [
      created([R1, R2, R3].map(refundView), "Refunded Successfully"),
      fail(400, "more than sold", "Order 1 line 2: only 1 left to refund (2 sent)", { data: [], failed: [{ index: 0, message: "Order 1 line 2: only 1 left to refund (2 sent)", status: 400 }] }),
      fail(400, "total ≠ payments", "total_amount 1103.9 is not the sum of payments (1100)", { data: [], failed: [{ index: 0, message: "total_amount 1103.9 is not the sum of payments (1100)", status: 400 }] }),
    ],
  },
  "order-refund-complete-bulk": {
    body: { storeId: 1, locationId: 1, staffId: 1, batchId: 1, items: [refundRequest(R4)] },
    responses: [
      created([refundView(R4)], "Refunded Successfully"),
      { ...created([refundView(R4)], "Refunded Successfully"), label: "201 — sent again (same client_local_id): the saved refund" },
      fail(400, "lines left out", "Order 3: a complete refund must give back every remaining line (line 3 has 250 left)", { data: [], failed: [{ index: 0, message: "Order 3: a complete refund must give back every remaining line (line 3 has 250 left)", status: 400 }] }),
    ],
  },
  // Every refund, partial and complete together, newest first.
  "refund-list": { responses: [page([R4, R3, R2, R1].map(refundView))] },
  "refund-receipt": {
    responses: [
      ok({
        id: R1.receiptId,
        refund_id: R1.number,
        order_id: R1.order.number,
        refund_type: R1.type,
        reason: R1.reason,
        store: { name: STORE.name, ntn: STORE.ntn, strn: STORE.strn },
        issued_at: R1.at,
        location: L1,
        cashier: { id: ZAYAN.id, name: ZAYAN.name },
        currency: "PKR",
        items: R1.lines.map((l) => ({ id: l.itemNumber, title: productRef(l.line.product, l.line.variantId).title, sku: productRef(l.line.product, l.line.variantId).sku, qty: l.qty, unit_price: l.line.unitPrice, total: l.total })),
        subtotal: R1.amount,
        tax_amount: r2(R1.tax + R1.surcharge),
        total: R1.total,
        payments: R1.payments.map((p) => ({ method: p.method, amount: p.amount })),
      }),
    ],
  },
}

/** The create reply: each variant with its opening stock (stock_unit pack = packs × pack_size units). */
function withOpening(view, def) {
  const stockOf = (row) =>
    (row.stock || []).map((entry) => ({ location: LOCATIONS[entry.location_id], qty: entry.stock_unit === "pack" ? entry.qty * row.pack_size : entry.qty, expiry_date: null }))
  if (!def.variants.length) {
    const stocks = stockOf(def)
    return { ...view, qty: sum(stocks, (s) => s.qty), stocks }
  }
  return { ...view, variants: view.variants.map((v, i) => { const stocks = stockOf(def.variants[i]); return { ...v, qty: sum(stocks, (s) => s.qty), stocks } }) }
}

// ---------------------------------------------------------------- stock edits (after the sales and refunds above)

/** The product of a stock-edit reply: the product (number, title, sku, barcode) and its variant. */
function editProduct(product, variantId) {
  const variant = variantId ? product.variants[variantId - 1] : null
  return {
    id: product.number, title: product.title, sku: product.sku, barcode: product.barcode, unit: product.unit,
    variant: variant ? { id: variantId, title: variant.name, sku: variant.sku, barcode: variant.barcode } : null,
  }
}
function editStock(product, variantId, qty, { expiry, threshold, deletedAt = null, at = "2026-11-07T09:40:00.000Z", lots } = {}) {
  const stockLots = lots ?? lotsInStock(key(product, variantId, 1)).map(lotView)
  if (expiry === undefined) expiry = stockLots.find((lot) => lot.expiry_date)?.expiry_date || null
  const price = priceOf(product, variantId)
  const size = price.is_pack ? price.pack_size : null
  const level = threshold ?? product.low_stock_threshold
  return {
    location: L1,
    product: editProduct(product, variantId),
    qty,
    pack_size: size,
    number_of_packs: size ? Math.floor(qty / size) : null,
    loose_units: size ? r2(qty - Math.floor(qty / size) * size) : null,
    sell_loose: size ? price.sell_loose : null,
    // The soonest expiry still in stock; each lot keeps its own (lots, soonest first).
    expiry_date: expiry,
    lots: stockLots,
    low_stock_threshold: level,
    is_low: qty <= level,
    updated_at: at,
    ...(deletedAt ? { deleted_at: deletedAt } : {}),
  }
}
function editMovement(row, changes = {}) {
  return {
    id: row.id,
    location: row.location,
    product: editProduct(Object.values(PRODUCTS).find((p) => p.number === row.product.id), row.variant ? row.variant.id : null),
    staff: row.staff,
    supplier: row.supplier,
    movement_type: row.movement_type,
    reason: row.reason,
    reason_note: row.reason_note,
    qty: row.qty,
    qty_after: row.qty_after,
    lots: row.lots,
    created_at: row.created_at,
    updated_at: null,
    ...changes,
  }
}
const [M20, M21] = MOVEMENT_BULK_ROWS
const pepsi350 = stockNow.get(key(PRODUCTS.pepsi, 1, 1))
const garnier2 = stockNow.get(key(PRODUCTS.garnier, 2, 1))
const pepsi15 = stockNow.get(key(PRODUCTS.pepsi, 4, 1))
const sugarNow = stockNow.get(key(PRODUCTS.sugar, 0, 1))
const garnier3 = stockNow.get(key(PRODUCTS.garnier, 3, 1))
const lastMovement = movementNumber

Object.assign(DEMO_EPS, {
  "movement-patch": {
    body: {
      items: [
        { id: M20.id, qty: 60, reason_note: "Bill #4521 was 12 packs, not 10" },
        { id: M21.id, movement_type: "stock_out", reason: "damage", qty: 2, reason_note: "2 jars cracked, not 1" },
      ],
    },
    responses: [
      ok(
        [
          {
            movement: editMovement(M20, { qty: 60, qty_after: r2(M20.qty_after + 10), lots: [{ id: 2, qty: 60, expiry_date: "2027-03-31" }], reason_note: "Bill #4521 was 12 packs, not 10", updated_at: "2026-11-07T09:40:00.000Z" }),
            stock: editStock(PRODUCTS.pepsi, 1, r2(pepsi350 + 10), { lots: [lotView({ id: 2, qty: 60, expiry_date: "2027-03-31", received_at: "2026-11-06T08:00:00.000Z", source: "purchase" }), lotView({ id: 1, qty: 25, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" })] }),
          },
          {
            movement: editMovement(M21, { qty: -2, qty_after: r2(M21.qty_after - 1), lots: [{ id: 1, qty: -2, expiry_date: null }], reason_note: "2 jars cracked, not 1", updated_at: "2026-11-07T09:40:00.000Z" }),
            stock: editStock(PRODUCTS.garnier, 2, r2(garnier2 - 1), { lots: [lotView({ id: 1, qty: 13, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" })] }),
          },
        ],
        "Stock Movements Updated"
      ),
      fail(400, "stock below 0", "Stock cannot go below 0: there are 3 left, and this change takes away 10", { data: [], failed: [{ index: 0, message: "Stock cannot go below 0: there are 3 left, and this change takes away 10", status: 400 }] }),
      fail(409, "sale movement", "This sale movement comes from a sale, refund or transfer and cannot be edited here", { data: [], failed: [{ index: 0, message: "This sale movement comes from a sale, refund or transfer and cannot be edited here", status: 409 }] }),
    ],
  },
  "stock-entry-patch": {
    body: {
      items: [
        { product_id: 1, variant_id: 4, location_id: 1, lot_id: 1, number_of_packs: 3, loose_units: 2, reason: "count", reason_note: "Shelf count" },
        { product_id: 4, location_id: 1, lot_id: 2, expiry_date: "2027-05-31", low_stock_threshold: 25 },
      ],
    },
    responses: [
      ok(
        [
          {
            stock: editStock(PRODUCTS.pepsi, 4, 17, { lots: [lotView({ id: 1, qty: 17, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" })] }),
            lot: lotView({ id: 1, qty: 17, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" }),
            movement: {
              id: lastMovement + 1, location: L1, product: editProduct(PRODUCTS.pepsi, 4), staff: ZAYAN, supplier: null,
              movement_type: "adjustment", reason: "count", reason_note: "Shelf count", qty: r2(17 - pepsi15), qty_after: 17, lots: [{ id: 1, qty: r2(17 - pepsi15), expiry_date: null }],
              created_at: "2026-11-07T09:40:00.000Z", updated_at: null,
            },
          },
          { stock: editStock(PRODUCTS.sugar, null, sugarNow, { threshold: 25, lots: [lotView({ id: 2, qty: 50, expiry_date: "2027-05-31", received_at: "2026-11-06T08:00:00.000Z", source: "purchase" }), lotView({ id: 1, qty: 100, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" })] }), lot: lotView({ id: 2, qty: 50, expiry_date: "2027-05-31", received_at: "2026-11-06T08:00:00.000Z", source: "purchase" }), movement: null },
        ],
        "Stock Updated"
      ),
      fail(400, "packs on a loose item", "Garnier Cream is not a pack product: send qty (units)", { data: [], failed: [{ index: 0, message: "Garnier Cream is not a pack product: send qty (units)", status: 400 }] }),
    ],
  },
  "movement-delete": {
    pathParams: [{ name: "id", default: String(M20.id), required: true }],
    responses: [
      ok(
        { movement: editMovement(M20, { deleted_at: "2026-11-07T09:45:00.000Z" }), stock: editStock(PRODUCTS.pepsi, 1, r2(pepsi350 - 50), { at: "2026-11-07T09:45:00.000Z", lots: [lotView({ id: 1, qty: 25, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" })] }) },
        "Stock Movement Deleted"
      ),
    ],
  },
  "stock-entry-delete": {
    pathParams: [{ name: "id", default: "1", required: true }],
    // Lot numbers are per product: which product (and location) the lot is.
    query: [
      { name: "product_id", default: "2", required: true },
      { name: "variant_id", default: "3", required: false },
      { name: "location_id", default: "1", required: true },
    ],
    body: { reason_note: "Wrong batch entered" },
    responses: [
      ok(
        {
          stock: editStock(PRODUCTS.garnier, 3, 0, { at: "2026-11-07T09:50:00.000Z", lots: [] }),
          lot: { ...lotView({ id: 1, qty: 0, expiry_date: null, received_at: "2026-11-01T06:00:00.000Z", source: "opening" }), deleted_at: "2026-11-07T09:50:00.000Z" },
          movement: {
            id: lastMovement + 2, location: L1, product: editProduct(PRODUCTS.garnier, 3), staff: ZAYAN, supplier: null,
            movement_type: "adjustment", reason: "other", reason_note: "Lot 1 deleted: Wrong batch entered", qty: -garnier3, qty_after: 0, lots: [{ id: 1, qty: -garnier3, expiry_date: null }],
            created_at: "2026-11-07T09:50:00.000Z", updated_at: null,
          },
        },
        "Stock Deleted"
      ),
    ],
  },
  "tax-bulk": {
    responses: [
      created(
        [
          { id: 1, name: "GST", type: "percentage", value: 18, product_scope: "all", product_ids: [], is_active: true },
          { id: 2, name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [1, 4], is_active: true },
        ],
        "Taxes Created"
      ),
    ],
  },
  "tax-bulk-patch": {
    responses: [
      ok(
        [
          {
            id: 2, name: "Sugar tax", type: "fixed", value: 6, product_scope: "selected", product_ids: [1, 4, 3],
            is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-07T09:55:00.000Z",
          },
        ],
        "Taxes Updated"
      ),
    ],
  },
})

// ---------------------------------------------------------------- lots: what the descriptions say

const LOTS_NOTE =
  " Lots: the stock of a product at a location is kept in lots — stock that came in together, each with its own expiry date (Lot #2 = 50 bottles expiring 31 Mar 2027, Lot #1 = 25 bottles without one). A stock in makes a lot (or adds to the lot with the same expiry date); a stock out takes the lot that expires first (FEFO: lots without a date last), unless a lot_id is sent; a refund puts the qty back into the lots the sale took. Lot numbers are the product's own: each product (or variant) has lot 1, 2, 3…, so a lot is named with its product (product_id + variant_id)."
for (const [id, extra] of Object.entries({
  "prod-expiry": {
    description:
      "Store admin / manager. One row per lot with an expiry date, soonest first: { product { id, title, sku, barcode, unit, variant }, location, lot { id (lot number), received_at }, qty (that lot's), expiry_date, expiry_status (expired | critical | warning | ok, from the store's expiry_critical_days / expiry_warning_days) }. The same product at the same location shows once per lot — e.g. Pepsi 350ML: Lot #20 (31 Mar 2027); its Lot #1 has no expiry date so it is not listed. A store admin sees every location (or one with location_id); a manager only their own. The dashboard asks all=1: lots without an expiry date too (the whole stock, lot by lot). Paged: page (from 1) and limit (1–200, default 20); pagination next to data. Dates (expiry date): range = week | month | 6months | year, or from / to (YYYY-MM-DD)." +
      LOTS_NOTE,
  },
  "stock-entry-delete": {
    description:
      "Dashboard: Product Stock & Expiry → Delete (on a lot). Soft delete of ONE lot: its qty goes to 0 through an adjustment movement (reason other, note \"Lot N deleted\" + the optional reason_note sent in the body), then the lot leaves Product Stock & Expiry and the stock lists; the other lots of that product stay and its row stays. :id = the lot number (e.g. 1, from GET /products/expiry) with the lot's product in the query: product_id (the product number, or UUID), variant_id (a variant: its number inside the product) and location_id — lot numbers are per product, so every product has its own lot 1. A lot's UUID needs no product. A stock entry's UUID instead deletes the whole entry (every lot). Store admin / manager (a manager only at their own location). Reply: { stock (now, with its lots), lot (the deleted one, with deleted_at), movement }." +
      LOTS_NOTE,
  },
})) DEMO_EPS[id] = { ...DEMO_EPS[id], ...extra }

// ---------------------------------------------------------------- the other updates, on the same data

const SUGAR_TAX_ROW = {
  id: 2, uuid: "8a2d4c71-2f5b-4e3a-b6c9-7d1e0f3a2b44", name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [1, 4],
  is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z",
}
Object.assign(DEMO_EPS, {
  "tax-get": { responses: [ok(SUGAR_TAX_ROW)] },
  "tax-bulk-status-patch": {
    body: { items: [{ id: 2, is_active: false }] },
    responses: [ok([{ ...SUGAR_TAX_ROW, is_active: false, updated_at: "2026-11-07T10:00:00.000Z" }], "Tax Status Updated")],
  },
  "prod-bulk-weight-patch": {
    body: { items: [{ id: 4, is_weight_based: true }, { id: 1, is_weight_based: false }] },
    responses: [ok([productView(PRODUCTS.sugar), productView(PRODUCTS.pepsi)], "Weight Settings Updated")],
  },
  "prod-bulk-visibility-patch": {
    body: { items: [{ id: 2, is_pos_visible: true, is_web_visible: false }] },
    responses: [ok([{ ...productView(PRODUCTS.garnier), is_web_visible: false }], "Product Visibility Updated")],
  },
  "order-bulk-status-patch": {
    body: { locationId: 1, staff_id: 1, items: [{ id: 1, status: "voided", reason: "Rung up twice" }] },
    responses: [
      { ...ok([{ ...orderView(O1), order_status: "voided", payment_status: "refunded", cancel_reason: "Rung up twice", cancelled_by: ZAYAN }], "Order Status Updated"), label: "200 OK — order 1 voided (before any refund)" },
      fail(409, "after a refund", "Only a completed order can be voided", { data: [], failed: [{ index: 0, message: "Only a completed order can be voided", status: 409 }] }),
    ],
  },
  "order-bulk-payment-method-patch": {
    body: { locationId: 1, items: [{ id: 2, payment_method: "easypaisa" }] },
    responses: [
      {
        ...ok([{ ...orderView(O2), payment_method: "easypaisa", payments: O2.payments.map((p) => ({ ...p, method: "easypaisa", paid: p.amount, change: 0 })) }], "Payment Method Updated"),
        label: "200 OK — order 2 paid by EasyPaisa, not cash (before its refund)",
      },
      fail(409, "after a refund", "This sale has a refund; its payment method cannot change", { data: [], failed: [{ index: 0, message: "This sale has a refund; its payment method cannot change", status: 409 }] }),
    ],
  },
})

// ---------------------------------------------------------------- new entries

// ---------------------------------------------------------------- Detailed Reporting: one reply per section
// Worked out from the demo store's sales, refunds and stock movements, so the figures agree with
// the rest of the docs. (The sales reply is written out in full below.)

const RPT_API_LABEL = {
  sales: "Sales Summary", top_products: "Top Products", top_categories: "Top Categories", payments: "Payments", batches: "Z-Reports (Batches)",
  inventory: "Inventory", movements: "Stock Movements", refunds_cancelled: "Refunds / Cancelled", cashiers: "By Cashier", tax: "Tax Breakdown",
}
const rptTables = (lists) =>
  Object.fromEntries(Object.entries(lists).map(([name, rows]) => [name, { rows, pagination: { page: 1, limit: 20, total: rows.length, total_pages: 1 } }]))
function rptReply(id, summary, lists) {
  const section = REPORT_SECTION[id]
  const reply = ok({ section: id, label: RPT_API_LABEL[id], level: section.level, reporting_level: "standard", location: "all", from: "2026-11-01", to: "2026-11-07", filters: {}, summary, tables: rptTables(lists) })
  return { ...reply, section: id, label: `${section.label} · 200 OK` }
}
function rptPercent(rows, key) {
  const total = sum(rows, (row) => row[key])
  return rows.map((row) => ({ ...row, percent: total > 0 ? Math.round((row[key] / total) * 100) : 0 }))
}
const rptTax = (line, level) => sum(line.taxes.filter((tax) => tax.level === level), (tax) => tax.amount)
const rptFigures = (line) => ({
  units_sold: line.custom ? line.qty : line.units,
  gross_sales: line.gross,
  discounts: line.discount,
  net_sales: line.subtotal,
  sales_tax: 0,
  product_tax: sum(line.taxes.filter((tax) => tax.level !== "category"), (tax) => tax.amount),
  category_tax: rptTax(line, "category"),
  tax: line.tax_amount,
  total_sales: line.total,
})
/** The sold lines added up per group (a product / variant, or a category), best seller first. */
function rptGroupLines(keyOf, headOf) {
  const groups = new Map()
  for (const order of ORDERS) {
    for (const line of order.lines) {
      const k = keyOf(line)
      const figures = rptFigures(line)
      if (!groups.has(k)) groups.set(k, { ...headOf(line), ...Object.fromEntries(Object.keys(figures).map((name) => [name, 0])) })
      const row = groups.get(k)
      for (const [name, value] of Object.entries(figures)) row[name] = r2(row[name] + value)
    }
  }
  return rptPercent([...groups.values()].sort((a, b) => b.total_sales - a.total_sales), "total_sales")
}
const rptProductName = (line) => (line.custom ? line.title : productRef(line.product, line.variantId, { barcode: false }).title)
const rptCategoryName = (line) => (line.custom ? line.category : CATEGORIES[line.product.category_id].name)
const rptReason = (reason) => String(reason || "other").split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ")

function reportSamples() {
  // By Products / By Categories
  const products = rptGroupLines((line) => rptProductName(line), (line) => ({ product: rptProductName(line), category: rptCategoryName(line), unit: line.custom ? null : line.product.unit })).map((row, index) => ({ id: index + 1, ...row }))
  const categories = rptGroupLines((line) => rptCategoryName(line), (line) => ({ category: rptCategoryName(line) }))

  // Payments: what each method took, what went back by it, the surcharge kept.
  const sold = ORDERS.flatMap((order) => order.payments)
  const back = REFUNDS.flatMap((refund) => refund.payments).filter((part) => part.method !== "credit")
  const methods = [...new Set(sold.map((part) => part.method))]
  const paymentRows = rptPercent(
    methods
      .map((method) => {
        const taken = sold.filter((part) => part.method === method)
        const gross = sum(taken, (part) => part.amount)
        const refunds = sum(back.filter((part) => part.method === method), (part) => part.amount)
        const tax = r2(sum(taken, (part) => part.surcharge_amount) - sum(back.filter((part) => part.method === method), (part) => part.surcharge_amount))
        return { method: method.toUpperCase(), transactions: taken.length, gross_amount: gross, tax, refunds, net_amount: r2(Math.max(0, gross - refunds)) }
      })
      .sort((a, b) => b.net_amount - a.net_amount),
    "net_amount"
  )
  const paymentTotals = {
    transactions: sum(paymentRows, (row) => row.transactions),
    gross_amount: sum(paymentRows, (row) => row.gross_amount),
    tax: sum(paymentRows, (row) => row.tax),
    refunds: sum(paymentRows, (row) => row.refunds),
    net_amount: sum(paymentRows, (row) => row.net_amount),
  }

  // Z-Reports: batch 1 (Ahmed's drawer, opened with Rs 5,000) and each cashier's overall sales.
  const methodNet = (name) => paymentRows.find((row) => row.method === name)?.net_amount || 0
  const opening = 5000
  const batchRow = {
    id: "6f1c2a52-9d0e-4b6a-8e57-1a2b3c4d5e61",
    session_id: "SESS-5E61",
    batch_number: 1,
    cashier_id: "8a4e0b1c-5d27-4c3a-9a10-2b7c6d5e4f30",
    date_time: "2026-11-06T09:00:00.000Z",
    closed_at: null,
    status: "OPEN",
    cashier: AHMED.name,
    opening_amount: opening,
    orders: ORDERS.length,
    gross_sales: salesTotals.gross,
    discounts: salesTotals.discounts,
    net_sales: salesTotals.net,
    tax: r2(salesTotals.tax + salesTotals.surcharge),
    refunds: salesTotals.refunds,
    total_sales: salesTotals.total,
    cash_sales: methodNet("CASH"),
    card_sales: methodNet("CARD"),
    jazzcash_sales: methodNet("JAZZCASH"),
    easypaisa_sales: methodNet("EASYPAISA"),
    cash_in: 0,
    cash_out: 0,
    expected_cash: r2(opening + methodNet("CASH")),
    counted_cash: null,
    variance: 0,
    sales: salesTotals.total,
  }
  const cashierId = "8a4e0b1c-5d27-4c3a-9a10-2b7c6d5e4f30"
  // by_cashier (Z-Reports): each cashier's batches added up.
  const batchCashiers = [{ id: cashierId, cashier: AHMED.name, batches: 1, orders: ORDERS.length, discounts: salesTotals.discounts, tax: batchRow.tax, refunds: salesTotals.refunds, total_sales: batchRow.total_sales }]
  const cashierNet = r2(Math.max(0, salesTotals.total - salesTotals.refunds))

  // Inventory: the stock at the first location, and what came in / went out in the movements.
  const stockKeys = new Map()
  for (const move of MOVEMENTS) {
    if (move.location.id !== 1) continue
    const k = `${move.product.id}|${move.variant?.id || 0}`
    if (!stockKeys.has(k)) stockKeys.set(k, { move, in: 0, out: 0 })
    const row = stockKeys.get(k)
    row.move = move
    if (move.qty >= 0) row.in = r2(row.in + move.qty)
    else row.out = r2(row.out + -move.qty)
  }
  const productOf = (move) => Object.values(PRODUCTS).find((product) => product.number === move.product.id)
  const soonest = (product, move) =>
    (LOTS.get(key(product, move.variant?.id || 0, 1)) || []).filter((lot) => lot.qty > 0 && lot.expiry_date).map((lot) => lot.expiry_date).sort()[0] || null
  const inventoryRows = [...stockKeys.values()]
    .slice(0, 8)
    .map(({ move, in: inn, out }, index) => {
      const product = productOf(move)
      return {
        id: `stock-${index + 1}`,
        product: move.variant ? `${move.product.title} - ${move.variant.name}` : move.product.title,
        sku: move.variant ? move.variant.sku : move.product.sku,
        category: CATEGORIES[product.category_id].name,
        location: LOCATIONS[1].name,
        location_id: 1,
        unit: move.product.unit,
        // weight = sold by weight; pack = a pack product; loose = the rest.
        type: product.is_weight_based ? "weight" : (move.variant ? product.variants[move.variant.id - 1] : product).is_pack_product ? "pack" : "loose",
        stock_in: inn,
        stock_out: out,
        current_stock: move.qty_after,
        // out = nothing left; low = at or under its alert; ok = above it.
        stock_status: move.qty_after <= 0 ? "out" : product.low_stock_threshold != null && move.qty_after <= product.low_stock_threshold ? "low" : "ok",
        // The soonest expiry of the stock, and its state (none = no expiry date).
        expiry_date: soonest(product, move),
        expiry_status: lotStatus(soonest(product, move)) || "none",
      }
    })

  // Stock Movements: the latest ones.
  const movementRows = [...MOVEMENTS]
    .reverse()
    .slice(0, 8)
    .map((move) => ({
      id: move.id,
      date: move.created_at,
      product: move.variant ? `${move.product.title} - ${move.variant.name}` : move.product.title,
      location: move.location.name,
      location_id: move.location.id,
      type: move.movement_type.toUpperCase(),
      qty: move.qty,
      unit: move.product.unit,
      reason: rptReason(move.reason),
      channel: "pos",
      cashier: move.staff?.name || "System",
    }))

  // Refunds / Cancelled: every refund (partial and complete), newest first. No order was cancelled or voided.
  const refundRows = [...REFUNDS]
    .sort((a, b) => b.at.localeCompare(a.at))
    .map((refund) => ({
      id: refund.number,
      type: refund.type === "complete" ? "complete_refund" : "partial_refund",
      date: refund.at,
      order_number: refund.order.number,
      channel: "pos",
      amount: refund.total,
      reason: refund.reason,
      cashier: AHMED.name,
      refund_methods: refund.payments.map((part) => part.method),
    }))

  // Tax: every tax rule on the lines (the payment surcharge is listed apart).
  const taxGroups = new Map()
  for (const order of ORDERS) {
    for (const line of order.lines) {
      for (const tax of line.taxes) {
        const k = `${tax.level}|${tax.name}`
        if (!taxGroups.has(k)) taxGroups.set(k, { tax_rule: tax.name, level: tax.level, tax_type: tax.name === SUGAR_TAX.name ? "fixed" : "percentage", rate: tax.rate, tax_collected: 0 })
        taxGroups.get(k).tax_collected = r2(taxGroups.get(k).tax_collected + tax.amount)
      }
    }
  }
  const taxRows = [...taxGroups.values()].sort((a, b) => b.tax_collected - a.tax_collected).map((row, index) => ({ id: index + 1, ...row }))
  const surchargeRows = Object.values(SURCHARGES).map((rule) => {
    const taken = sold.filter((part) => part.method === rule.method)
    return { id: rule.method, method: rule.method.toUpperCase(), surcharge_type: rule.type, surcharge_value: rule.charges, payments: taken.length, surcharge_collected: sum(taken, (part) => part.surcharge_amount) }
  })

  return [
    rptReply("top_products", { shown: products.length, total: products.length, top_only: false }, { rows: products }),
    rptReply("top_categories", { shown: categories.length, total: categories.length, top_only: false }, { rows: categories }),
    rptReply("payments", { totals: paymentTotals }, { rows: paymentRows }),
    rptReply("batches", {}, { rows: [batchRow], by_cashier: batchCashiers }),
    rptReply("inventory", {}, { rows: inventoryRows }),
    rptReply("movements", {}, { rows: movementRows }),
    rptReply(
      "refunds_cancelled",
      { totals: { refund_count: refundRows.length, complete: refundRows.filter((row) => row.type === "complete_refund").length, partial: refundRows.filter((row) => row.type === "partial_refund").length, voids: 0, cancelled: 0, amount: sum(refundRows, (row) => row.amount) } },
      { rows: refundRows }
    ),
    rptReply("cashiers", {}, { rows: [{ id: cashierId, cashier: AHMED.name, orders: ORDERS.length, total_sales: salesTotals.total, discounts: salesTotals.discounts, tax: salesTotals.tax, refunds: salesTotals.refunds, net_sales: cashierNet }] }),
    rptReply(
      "tax",
      {
        totals: {
          orders: ORDERS.length,
          net_sales: salesTotals.net,
          tax_collected: r2(salesTotals.tax + salesTotals.surcharge),
          total_sales: salesTotals.total,
          taxes: { sales_tax: 0, product_tax: salesTotals.tax, category_tax: 0, payment_method_tax: { total: salesTotals.surcharge }, total: r2(salesTotals.tax + salesTotals.surcharge) },
          fbr_reported: 0,
        },
        // The surcharge is no tax: the tax without it, and the surcharge on its own.
        tax_collected_excl_surcharge: salesTotals.tax,
        surcharge_collected: salesTotals.surcharge,
      },
      {
        // rows: the older summary (kept for the dashboard); rules: per tax rule, what the filters narrow.
        rows: [
          { id: "sales_tax", tax_rule: "Sales Tax", tax_collected: 0 },
          { id: "product_tax", tax_rule: "Product Level Tax", tax_collected: salesTotals.tax },
          { id: "category_tax", tax_rule: "Category Level Tax", tax_collected: 0 },
          { id: "payment_tax", tax_rule: "Payment Method Tax (total)", tax_collected: salesTotals.surcharge },
          { id: "total", tax_rule: "Total Tax", tax_collected: r2(salesTotals.tax + salesTotals.surcharge) },
        ],
        rules: taxRows,
        surcharges: surchargeRows,
      }
    ),
  ]
}

export const DEMO_NEW_EPS = [
  {
    id: "customer-list",
    tag: "customers",
    method: "GET",
    path: "/api/v1/customers",
    summary: "Customers",
    description:
      "The store's customers and their udhaar (credit), oldest first: { id (customer number — the customer_id an order sends), name, phone, email, location_id (location number; null = every location), total_debt (all the udhaar ever given), remaining_debt (what the customer still owes), debt_notes, is_active }. A store admin sees every location (or one with location_id = location number or UUID); a manager / cashier only their own location, plus the customers that belong to every location. Ids in the reply are the short numbers the POS uses. Search: q matches the name, phone or email. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (created date): range = week | month | 6months | year (counted back from now), or from / to (YYYY-MM-DD — to covers the whole day); from / to win over range.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "q", default: "", required: false },
      { name: "range", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
    ],
    ownResponses: true,
    responses: [
      page([
        { id: 1, name: "Ali Khan", phone: "03001231234", email: null, location_id: 1, total_debt: 5000, remaining_debt: 3500, debt_notes: "Old udhaar from the paper register", is_active: true },
        { id: 2, name: "Sana Tariq", phone: "03214567890", email: "sana@example.com", location_id: 1, total_debt: 0, remaining_debt: 0, debt_notes: null, is_active: true },
      ]),
    ],
  },
  {
    id: "reporting-section",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reporting/:section",
    summary: "Detailed Reporting",
    description:
      "ONE endpoint for every report. :section picks the report, the query string filters it. Open View Section Names for the sections (the POS shows the ten listed there), View Section Filters for every filter of a section, and View Query Parameters: it lists the filters of the section in :section by itself, so nothing has to be typed from memory. Every reply is { section, label, level, reporting_level, location, from, to, summary, tables } — summary = the single figures, tables = { <list name>: { rows, pagination } }; each list is paged (table = the list page / limit / search are for; limit=all for an export). Store admin / manager (a manager: their own location only). A section needs its store plan (level in View Section Names): a lower plan gets 403 plan_locked. A filter the section does not know is ignored; a value that does not fit (an unknown choice, a bad number) is a 400. The reply echoes the filters it applied in filters.",
    pathParams: [{ name: "section", default: "sales", required: true }],
    query: queryRowsFor("sales"),
    sections: REPORT_SECTIONS,
    ownResponses: true,
    responses: [
      { ...ok({
        section: "sales",
        label: "Sales Summary",
        level: "basic",
        reporting_level: "standard",
        location: "all",
        from: "2026-11-01",
        to: "2026-11-07",
        filters: {},
        summary: {
          orders: 3,
          units_sold: r2(ORDERS.flatMap((o) => o.lines).reduce((s, l) => s + (l.units ?? l.qty), 0)),
          gross_sales: salesTotals.gross,
          line_discounts: salesTotals.discounts,
          order_discounts: 0,
          discounts: salesTotals.discounts,
          net_sales: salesTotals.net,
          taxes: {
            sales_tax: 0,
            product_tax: sum(ORDERS.flatMap((o) => o.lines).flatMap((l) => l.taxes).filter((t) => t.level !== "category"), (t) => t.amount),
            category_tax: sum(ORDERS.flatMap((o) => o.lines).flatMap((l) => l.taxes).filter((t) => t.level === "category"), (t) => t.amount),
            payment_method_tax: { cash: 0, card: salesTotals.byMethod.card || 0, jazzcash: salesTotals.byMethod.jazzcash || 0, total: salesTotals.surcharge },
            total: r2(salesTotals.tax + salesTotals.surcharge),
          },
          shipping: 0,
          total_sales: salesTotals.total,
          total_collected: salesTotals.total,
          on_credit: 0,
          refunds: salesTotals.refunds,
          refunded_tax: sum(REFUNDS, (r) => r.tax + r.surcharge),
          refunded_orders: 3,
          refunded_items: REFUNDS.reduce((s, r) => s + r.lines.length, 0),
          voided_orders: 0,
          cancelled_orders: 0,
          discounts_by_source: { product: 0, category: O1.lines[0].discount, "product+category": 0, bulk_tier: 0, offer: r2(salesTotals.discounts - O1.lines[0].discount), custom: 0, unknown: 0 },
          tax: r2(salesTotals.tax + salesTotals.surcharge),
          avg_order_value: r2(salesTotals.total / 3),
          payments_net: r2(salesTotals.total - salesTotals.refunds),
        },
        tables: {
          trend: {
            rows: [
              { date: "2026-11-06", orders: 3, gross_sales: salesTotals.gross, discounts: salesTotals.discounts, net_sales: salesTotals.net, tax: r2(salesTotals.tax + salesTotals.surcharge), total_sales: salesTotals.total, refunds: sum([R1, R2, R3], (r) => r.total) },
              { date: "2026-11-07", orders: 0, gross_sales: 0, discounts: 0, net_sales: 0, tax: 0, total_sales: 0, refunds: R4.total },
            ],
            pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
          },
          payments: {
            rows: ["card", "jazzcash", "cash"].map((method) => {
              const sold = sum(ORDERS.flatMap((o) => o.payments).filter((p) => p.method === method), (p) => p.amount)
              const back = sum(REFUNDS.flatMap((r) => r.payments).filter((p) => p.method === method), (p) => p.amount)
              return { method, collected: sold, refunded: back, net: r2(sold - back) }
            }),
            pagination: { page: 1, limit: 20, total: 3, total_pages: 1 },
          },
        },
      }), section: "sales", label: "Sales · 200 OK" },
      ...reportSamples(),
    ],
  },
  // ---- The deletes the dashboard makes (and the Super Admin store clear)
  ...[
    ["category-delete", "categories", "/api/v1/categories/:id", "Delete Category", "4", "Removes a category (:id = its number or UUID). Refused (409) while products still use it — move them first. Store admin / manager.", { id: 4, deleted: true }],
    ["product-delete", "products", "/api/v1/products/:id", "Delete Product", "2", "Soft delete (:id = the product number or UUID): the product (and its variants) is switched off — it leaves the catalog and the POS, its stock rows and sales history stay. Switching it back on is Multiple Products Status Update. Store admin / manager.", { ...productView(PRODUCTS.garnier, { withStock: false }), is_active: false, is_pos_visible: false, is_web_visible: false }],
    ["location-delete", "locations", "/api/v1/locations/:id", "Delete Location", "3", "Soft delete of a branch (:id = the location number or UUID): it leaves the location list, the POS and the plan count; its orders, stock and staff history keep its name. Its manager and cashiers are switched off and signed out. Refused (409) for the default location, while it holds stock, or while a transfer to / from it is on the way. Store admin only.", { ...LOCATIONS[3], is_default: false, is_active: false, deleted_at: "2026-11-07T10:00:00.000Z" }],
    ["supplier-delete", "suppliers", "/api/v1/suppliers/:id", "Delete Supplier", "3", "Soft delete (:id = the supplier UUID, as in GET /suppliers): the supplier leaves the supplier list and can no longer be picked on a stock movement or its ledger; stock movements and ledger entries that named it keep its name (its row stays). Switching it off instead is PATCH is_active. Store admin / manager (a manager only a supplier of their own location).", { id: 3, name: "Rice Mills Co", phone: "03008888888", email: "info@ricemills.local", address: "Gujranwala", payment_terms: "Cash on delivery", location_scope: "selected", location_ids: [1], is_active: false, deleted_at: "2026-11-07T10:00:00.000Z" }],
    ["tax-delete", "taxes", "/api/v1/taxes/:id", "Delete Tax", "2", "Removes a tax of the Taxes page (:id = the tax number or UUID); new sales stop charging it, sales already made keep it. Store admin.", { id: 2, deleted: true }],
    ["surcharge-delete", "surcharges", "/api/v1/payment-surcharges/:id", "Delete Payment Surcharge", "2", "Removes a payment method surcharge (:id = its number or UUID); that method has no surcharge on new sales. Store admin.", { id: 2, deleted: true }],
    ["banner-delete", "store", "/api/v1/store-banners/:id", "Delete Store Banner", "1", "Removes a banner of the store website (:id = the banner id). Store admin.", { id: 1, deleted: true }],
    ["plan-delete", "plans", "/api/v1/plans/:id", "Delete Plan", "3", "Super Admin. Removes a plan (:id = the plan id); refused while a store is on it.", { id: 3, deleted: true }],
    ["data-module-delete", "data", "/api/v1/admin/data/:module", "Delete a module's rows", "orders", "Super Admin, for testing. Deletes every row of one module in every store (:module = orders, order_items, order_refunds, payments, receipts, categories, products, product_stocks, customers, suppliers, stock_movements, stock_transfers, offers, coupons…) with its child rows. The dashboard's Settings → Data uses it.", { module: "orders", wiped: [{ table: "order_refund_items", deleted: 4 }, { table: "order_refunds", deleted: 4 }, { table: "order_items", deleted: 8 }, { table: "payments", deleted: 5 }, { table: "receipts", deleted: 7 }, { table: "orders", deleted: 3 }] }],
  ].map(([id, tag, path, summary, def, description, data]) => ({
    id, tag, method: "DELETE", path, summary, description,
    pathParams: [{ name: path.includes(":module") ? "module" : "id", default: def, required: true }],
    ownResponses: true,
    responses: [ok(data, `${summary.replace(/^Delete /, "")} deleted`)],
  })),
  {
    id: "variant-delete",
    tag: "products",
    method: "DELETE",
    path: "/api/v1/products/:id/variants/:variantId",
    summary: "Delete Variant",
    description:
      "Dashboard: Product detail → Delete variant (on a variant card), or the variant's own page → Delete variant. Soft delete of ONE variant (:id = the product number or UUID, :variantId = the variant's number inside it — 1, 2, 3… — or its UUID): it is switched off and hidden — it leaves the product's variants, the add / edit product form, Product Stock & Expiry, the stock lists, Weight Based Products and the POS, and can no longer be sold, stocked, transferred or put in a discount / tax. Its stock rows, lots, stock movements and orders stay as they were, so history, receipts and reports still name it. Its variant number is not given to a new variant. Store admin / manager. Reply: the product without it.",
    pathParams: [
      { name: "id", default: "2", required: true },
      { name: "variantId", default: "5", required: true },
    ],
    ownResponses: true,
    responses: [
      ok({ ...productView(PRODUCTS.garnier), variants: productView(PRODUCTS.garnier).variants.filter((row) => row.id !== 5) }, "Variant deleted"),
      { label: "Unknown variant (404)", status: 404, body: { success: false, message: "Variant 9 is not a variant of this product", errors: null } },
    ],
  },
  {
    id: "store-data-clear",
    tag: "data",
    method: "DELETE",
    path: "/api/v1/admin/stores/:storeId/data",
    summary: "Clear a Store's Data",
    description:
      "Super Admin only (signed in as a super admin, else 401 / 403). Deletes every business row of ONE store — products and variants, categories, stock and its movements and transfers, orders, refunds, receipts, payments, customers and udhaar, suppliers, discounts and coupons, taxes and surcharges, staff (not the store admin), batches, sessions, audit logs, carts and reviews — and starts their numbering again from 1. Kept: the store itself, its store admin(s) (still signed in), its default location, its plan / license / billing, its POS devices, its settings and look, and its backups. :storeId = the store number (e.g. 1) or UUID. Other stores and the super admins are never touched.",
    pathParams: [{ name: "storeId", default: "1", required: true }],
    ownResponses: true,
    responses: [
      ok(
        {
          store: { id: 1, name: "Acadex" },
          kept: ["store", "store admin", "default location", "plan / license / billing", "POS devices", "settings and look", "backups"],
          cleared: [
            { table: "order_items", deleted: 8 }, { table: "order_refund_items", deleted: 6 }, { table: "offer_targets", deleted: 10 },
            { table: "categories", deleted: 5 }, { table: "customers", deleted: 2 }, { table: "offers", deleted: 4 }, { table: "order_refunds", deleted: 4 },
            { table: "orders", deleted: 3 }, { table: "payments", deleted: 5 }, { table: "product_stocks", deleted: 21 }, { table: "products", deleted: 22 },
            { table: "receipts", deleted: 7 }, { table: "register_sessions", deleted: 1 }, { table: "stock_movements", deleted: MOVEMENTS.length + movementNumber - MOVEMENTS.length },
            { table: "stock_transfers", deleted: 1 }, { table: "stock_transfer_items", deleted: 2 }, { table: "store_taxes", deleted: 2 }, { table: "suppliers", deleted: 3 }, { table: "users", deleted: 1 },
          ],
        },
        "Store data cleared"
      ),
      fail(404, "unknown store", "Store not found"),
      fail(403, "not a super admin", "Forbidden"),
    ],
  },
]

// These are no longer documented (POST /locations: locations come with the store; POST /customers: use Bulk Customers).
export const DEMO_REMOVED_IDS = ["prod-expiry", "prod-image-get", "location-create", "customer-create", "rep-all-locations", "rep-location", "rep-profit"]

// ---------------------------------------------------------------- the attributes of the bodies above

const LINE_TAX = {
  level: must("product (the product's own) | store (a Taxes page tax) | category | sales"),
  name: note("Label on the receipt, e.g. GST"),
  rate: note("The % (a fixed tax: its amount per unit)"),
  amount: must("Tax on the whole line"),
}
const prefixed = (prefix, spec) => Object.fromEntries(Object.entries(spec).map(([k, v]) => [`${prefix}${k}`, v]))

const PRODUCT_FIELDS = {
  title: R,
  sku: note("Unique in the store; left out = made from the title"),
  barcode: note("Unique in the store"),
  category_id: must("The category number (e.g. 1)"),
  unit: must("piece | kg | gram | liter | ml | packet | box | dozen | pair | meter | yard | roll | set | carton | bag | bottle | can — the unit stock and loose prices count in (grams for Almonds)"),
  taxes: note("The product's own taxes [{ name, type: percentage | fixed, value }] (on top of the Taxes page ones). [] = none"),
  "taxes[].name": R,
  "taxes[].type": must("percentage | fixed"),
  "taxes[].value": R,
  low_stock_threshold: note("Low-stock alert level: in packs for a pack-only product, else in units (see low_stock_unit)"),
  is_weight_based: note("true = sold by weight (kg / gram)"),
  image: note("An image URL; empty = none (upload with Product Image Upload)"),
  location_scope: note("all (default) | selected + location_ids — where it is sold"),
  stock_scope: note("all (default) | selected + stock_location_ids — where its stock is held"),
  cost: note("No variants: cost of one unit. A pack that is also sold loose (sell_loose) sends its own unit cost: it is not pack_cost ÷ pack_size"),
  price: note("No variants: selling price of one unit. A pack that is also sold loose sends its own unit price (80 a unit in a pack of 10 at 500 is fine)"),
  sell_loose: note("Sold by the single unit too: a pack product then needs cost and price as well"),
  discount_type: note("The product level discount: percentage | fixed. Leave out = none"),
  discount_value: note("The % or the Rs off one unit"),
  discount_name: note("Its name, e.g. Eid special"),
  discount_applies_to: note("What the discount is taken off: all (default) | pack | loose | weight. pack needs a pack product, weight a weight based product"),
  stock: note("No variants: opening stock [{ location_id, qty, stock_unit? }]"),
  "stock[].location_id": must("The location number"),
  "stock[].qty": must("Opening qty (packs with stock_unit pack)"),
  "stock[].stock_unit": note("unit (default) | pack"),
  variants: note("A product with variants: one row per variant (each is sold and stocked on its own)"),
  "variants[].name": R,
  "variants[].sku": note("Unique in the store"),
  "variants[].barcode": note("Unique in the store"),
  "variants[].cost": note("A loose variant: cost of one unit (one gram for Almonds)"),
  "variants[].price": note("A loose variant: price of one unit"),
  "variants[].is_pack_product": note("true = sold as a pack of pack_size units"),
  "variants[].pack_size": note("Units in one pack (2 or more; 250 for a 250 g pack in grams)"),
  "variants[].pack_cost": note("Cost of one pack (unit cost = pack_cost ÷ pack_size)"),
  "variants[].pack_price": note("Price of one pack (unit price = pack_price ÷ pack_size)"),
  "variants[].sell_loose": note("A pack variant: single units are sold too; it then sends its own cost and price"),
  "variants[].is_weight_based": note("Sold by weight"),
  "variants[].stock": note("Opening stock of this variant [{ location_id, qty, stock_unit? }]"),
  "variants[].stock[].location_id": must("The location number"),
  "variants[].stock[].qty": must("Opening qty (packs with stock_unit pack; grams / units otherwise)"),
  "variants[].stock[].stock_unit": note("unit (default) | pack (qty = whole packs)"),
}

const ORDER_LINE = {
  product_id: note("A catalog line: the product number (e.g. 1). Leave out on a custom line"),
  variant_id: note("A product with variants: the variant number inside it (1, 2, 3…)"),
  title: note("A custom line (not in the catalog): what was sold"),
  category: note("A custom line: the category typed at the till"),
  sale_unit: note("unit (default) | pack — pack: qty = packs, unit_price / cost_price = one pack's"),
  qty: must("Units sold (grams / kg on a weight line); packs on a pack line"),
  unit_price: must("Price of one unit (one pack on a pack line) before discount"),
  cost_price: note("Cost of one unit / pack, for profit reports"),
  discount_amount: note("The discount on the whole line (all its discounts together), worked out by the till"),
  discount: note("The bulk discounts applied: [{ discount_id }] — [] = none, one object per discount (product, category and bundle discounts are only in discount_amount)"),
  "discount[].discount_id": must("The bulk discount number (GET /bulk-discounts). Product, category and bundle discounts are in the line's discount_amount; the order level discount is order_discount"),
  free_qty: note("BOGO: the free units on this line"),
  subtotal: must("qty × unit_price − discount_amount"),
  taxes: note("Every tax on the line [{ level, name, rate, amount }]"),
  ...prefixed("taxes[].", LINE_TAX),
  tax_amount: must("The line's taxes together"),
  total: must("subtotal + tax_amount"),
}
const PAYMENT = {
  method: must("cash | card | jazzcash | easypaisa | bank_transfer | credit (udhaar) | …"),
  surcharge_type: note("percentage | fixed — the method's Payment Method Surcharge"),
  surcharge_value: note("The surcharge % (or fixed Rs)"),
  surcharge_amount: note("The surcharge on this method's share (0 = none)"),
  amount: must("What this method pays toward the bill, surcharge included"),
  paid: note("What the customer handed over (cash: change = paid − amount)"),
}

export const DEMO_FIELDS = {
  "auth-login": { email: R, password: R },
  "license-validate": { license_key: must("The store's license key"), device_uid: must("This till's device id (e.g. 1)") },
  "staff-bulk": {
    storeId: note("Your store number (e.g. 1)"),
    items: R,
    "items[].locationId": must("The location number the staff member works at"),
    "items[].name": R,
    "items[].email": must("Unique in the store"),
    "items[].password": must("Min 6 characters"),
    "items[].pin": must("4 digits, free at that location"),
    "items[].role": must("manager | cashier"),
  },
  "prod-bulk": { storeId: note("Your store number (e.g. 1)"), items: R, ...prefixed("items[].", PRODUCT_FIELDS) },
  "order-bulk": {
    storeId: note("Your store number (e.g. 1)"),
    locationId: must("The location number of every order"),
    staffId: must("The cashier (user number) of every order; an order may carry its own"),
    batchId: note("The open batch number (cash drawer)"),
    items: must("One row per order — an array even for one"),
    "items[].client_local_id": must("The till's id for the order — sent again, the saved order comes back (no double sale)"),
    "items[].local_receipt_number": note("The number printed on the till (offline) receipt"),
    "items[].placed_at": note("When it was sold at the till (ISO, at most 30 days ago)"),
    "items[].customer_id": note("The customer number (needed for udhaar)"),
    "items[].lines": must("The lines as the till priced them"),
    ...prefixed("items[].lines[].", ORDER_LINE),
    "items[].order_discount": note("null, or { type: percentage | fixed, value, amount } off the whole bill"),
    "items[].coupon": note("null, or { code, amount }"),
    "items[].gross_amount": note("Σ qty × unit_price"),
    "items[].discount_amount": note("Σ line discount_amount"),
    "items[].subtotal": note("Σ line subtotal — checked against the lines"),
    "items[].tax_amount": note("Σ line tax_amount"),
    "items[].surcharge_amount": note("Σ payment surcharges"),
    "items[].payments": must("One row per payment method; several = split payment"),
    ...prefixed("items[].payments[].", PAYMENT),
    "items[].total_amount": must("subtotal − order_discount − coupon + tax_amount + surcharge_amount"),
  },
}
