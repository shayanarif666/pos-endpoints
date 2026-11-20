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
import { SAMPLE_BODY, SAMPLE_ORDERS } from "./orderSamples.js"
import { SAMPLE_REFUND_BODY, SAMPLE_REFUNDS } from "./refundSamples.js"

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
  is_active: true,
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

const DEW_VARIANTS = [
  pv("1L", "DEW-1L", "8961040000018", { is_pack_product: true, pack_size: 5, pack_cost: 400, pack_price: 800, sell_loose: true }),
].map((row) => ({ ...row, is_weight_based: false, stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }] }))

const PRODUCT_DEFS = [
  { key: "pepsi", number: 1, title: "Pepsi", slug: "pepsi", sku: "PEPSI", barcode: "8961014100004", category_id: 1, unit: "bottle", taxes: [], low_stock_threshold: 10, is_weight_based: false, variants: PEPSI_VARIANTS },
  { key: "garnier", number: 2, title: "Garnier Cream", slug: "garnier-cream", sku: "GARNIER-CREAM", barcode: "8901030000001", category_id: 4, unit: "piece", taxes: GARNIER_TAXES, low_stock_threshold: 10, is_weight_based: false, variants: GARNIER_VARIANTS },
  { key: "almonds", number: 3, title: "Almonds", slug: "almonds", sku: "ALMONDS", barcode: "8961020000001", category_id: 5, unit: "gram", taxes: [], low_stock_threshold: 2000, is_weight_based: true, variants: ALMOND_VARIANTS },
  { key: "sugar", number: 4, title: "Sugar", slug: "sugar", sku: "SUGAR", barcode: "8961030000001", category_id: 3, unit: "kg", taxes: [], low_stock_threshold: 20, is_weight_based: true, cost: 140, price: 160, sell_loose: true, stock: [{ location_id: 1, qty: 100 }], variants: [] },
  { key: "dew", number: 5, title: "Mountain Dew", slug: "mountain-dew", sku: "DEW", barcode: "8961040000001", category_id: 1, unit: "bottle", taxes: [], low_stock_threshold: 10, is_weight_based: false, variants: DEW_VARIANTS },
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

// POST /products/bulk: one product with 7 variants (the request as the dashboard / POS sends it).
const PROD_BULK_BODY = {
  storeId: 1,
  items: [
    {
      title: "Pepsi",
      sku: "PEPSI",
      barcode: "8961014100004",
      category_id: 1,
      unit: "bottle",
      // 0 with variants (each variant has its own level); 1 without.
      low_stock_threshold: 0,
      low_stock_unit: "unit",
      is_weight_based: false,
      image: "",
      location_scope: "all",
      stock_scope: "all",
      taxes: [{ name: "Import Duty", type: "percentage", value: 10 }],
      // The product discount: every variant takes it unless it has a discount of its own (350ML 5%, 500ML 7%)
      // or says uses_product_discount: false (2L).
      discount: { name: "Eid Shopping", type: "percentage", value: 10 },
      variants: [
      {
        name: "350ML", sku: "PEPSI-350ML", barcode: "8961014100011",
        cost: 50, price: 100,
        is_pack_product: true, pack_size: 5, pack_cost: 250, pack_price: 500, sell_loose: true,
        discount: { name: "Eid Shopping", type: "percentage", value: 5 },
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "500ML", sku: "PEPSI-500ML", barcode: "8961014100028",
        cost: 70, price: 140,
        is_pack_product: true, pack_size: 5, pack_cost: 350, pack_price: 700, sell_loose: true,
        discount: { name: "Eid Shopping", type: "percentage", value: 7 },
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "1L x 5", sku: "PEPSI-1L", barcode: "8961014100035",
        cost: 80, price: 160,
        is_pack_product: true, pack_size: 5, pack_cost: 400, pack_price: 800, sell_loose: true,
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "1.5L", sku: "PEPSI-1-5L", barcode: "8961014100042",
        cost: 110, price: 220,
        is_pack_product: true, pack_size: 5, pack_cost: 550, pack_price: 1100, sell_loose: true,
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "2L", sku: "PEPSI-2L", barcode: "8961014100059",
        cost: 140, price: 300,
        is_pack_product: true, pack_size: 5, pack_cost: 700, pack_price: 1500, sell_loose: true,
        uses_product_discount: false,
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "Jumbo", sku: "PEPSI-JUMBO", barcode: "8961014100066",
        cost: 190, price: 240,
        is_pack_product: true, pack_size: 5, pack_cost: 950, pack_price: 1200, sell_loose: true,
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      {
        name: "Cane", sku: "PEPSI-CANE", barcode: "8961014100073",
        cost: 60, price: 120,
        is_pack_product: true, pack_size: 5, pack_cost: 300, pack_price: 600, sell_loose: true,
        low_stock_threshold: 2, low_stock_unit: "pack",
        is_weight_based: false, colors: [], taxes: [],
        stock: [{ location_id: 1, qty: 5, stock_unit: "pack" }],
      },
      ],
    },
  ],
}

// The same product as the API answers it (GET /products shape: no stock).
const PEPSI_VARIANT_DISCOUNTS = { 0: { name: "Eid Shopping", type: "percentage", value: 5 }, 1: { name: "Eid Shopping", type: "percentage", value: 7 } }
const PEPSI_CREATED = {
  ...PRODUCT_DEFS[0],
  variants: PRODUCT_DEFS[0].variants.map((v, i) => ({ ...v, ...(PEPSI_VARIANT_DISCOUNTS[i] ? { discount: PEPSI_VARIANT_DISCOUNTS[i] } : {}), ...(i === 4 ? { usesProductDiscount: false } : {}) })),
  justCreated: true,
  taxes: [{ name: "Import Duty", type: "percentage", value: 10 }],
  discount: { name: "Eid Shopping", type: "percentage", value: 10, applies_to: "all" },
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
    product: { id: product.number, title: product.title, sku: product.sku, unit: product.unit, barcode: product.barcode },
    variant: variantId ? { id: variantId, name: product.variants[variantId - 1].name, sku: product.variants[variantId - 1].sku, barcode: product.variants[variantId - 1].barcode } : null,
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

/**
 * A movement as the API answers it: product and variant with their barcode, qty (what moved, out is negative)
 * and the one lot it moved; no qty_after and no order. (The rows above keep both for the reports.)
 */
/** The latest movement of a type (and reason) the docs store made. */
const pickMovement = (type, reason = null) => [...MOVEMENTS].reverse().find((row) => row.movement_type === type && (!reason || row.reason === reason))

function movementView(row) {
  return {
    id: row.id,
    location: row.location,
    product: row.product,
    variant: row.variant,
    supplier: row.supplier,
    staff: row.staff,
    movement_type: row.movement_type,
    reason: row.reason,
    reason_note: row.reason_note,
    qty: row.qty,
    lot: row.lots[0] || null,
    created_at: row.created_at,
  }
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
    // A stock count: an adjustment, qty is the difference (-3 = 3 kg less than the system says).
    { product_id: 4, movement_type: "adjustment", reason: "count", reason_note: "Shelf count: 3 kg less than the system", stock: [{ location_id: 1, qty: -3 }] },
    // A sale posted as a movement (the till was offline): stock_out, the lot that expires first is used.
    {
      product_id: 1, movement_type: "stock_out", reason: "sale", reason_note: "Sold at the counter, till was offline",
      variants: [{ id: 4, stock: [{ location_id: 1, qty: 2 }] }],
    },
  ],
}
const MOVEMENT_BULK_ROWS = [
  movement({ product: PRODUCTS.pepsi, variantId: 1, type: "stock_in", reason: "purchase", qty: 50, note: "Bill #4521", supplier: 1, at: "2026-11-06T08:00:00.000Z", expiry: "2027-03-31" }),
  movement({ product: PRODUCTS.garnier, variantId: 2, type: "stock_out", reason: "damage", qty: -1, note: "1 jar cracked in delivery", at: "2026-11-06T08:00:00.000Z", lotId: 1 }),
  movement({ product: PRODUCTS.sugar, type: "adjustment", reason: "count", qty: -3, note: "Shelf count: 3 kg less than the system", at: "2026-11-06T08:00:00.000Z" }),
  movement({ product: PRODUCTS.pepsi, variantId: 4, type: "stock_out", reason: "sale", qty: -2, note: "Sold at the counter, till was offline", at: "2026-11-06T08:00:00.000Z" }),
]

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
const transferReceivedShort = () => ({
  id: 2,
  from_location: L1,
  status: "completed",
  destinations: [
    {
      to_location: L2,
      status: "completed",
      products: [
        {
          product: productRef(PRODUCTS.pepsi, 4, { barcode: false }), qty: 10, received_qty: 9, loss_reason_note: "1 bottle broke on the way", status: "completed",
          lots: [{ id: 1, qty: 10, expiry_date: null }],
        },
      ],
    },
  ],
  note: "Branch 2 refill — Line 1: received 9 of 10 (1 short: 1 bottle broke on the way)",
  staff: ZAYAN,
  created_at: "2026-11-06T10:30:00.000Z",
})
const transferView = ({ qty15 = 10, extra = null } = {}) => ({
  id: 1,
  from_location: L1,
  status: "on_the_way",
  destinations: [
    {
      to_location: L2,
      status: "on_the_way",
      products: [
        { product: productRef(PRODUCTS.pepsi, 4, { barcode: false }), qty: qty15, received_qty: null, loss_reason_note: "", status: "on_the_way" },
        { product: productRef(PRODUCTS.garnier, 1, { barcode: false }), qty: 5, received_qty: null, loss_reason_note: "", status: "on_the_way" },
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

// ---------------------------------------------------------------- the 4 sales (orderSamples.js is the request)

/** A discount / tax entry as the till sends it ({ id, level, name, type, value }) and what it comes to on a line. */
const entryAmount = (entry, base, qty = 1) => (entry.type === "fixed" ? r2(Math.min(entry.value * qty, base)) : r2((base * entry.value) / 100))

function adaptLine(row) {
  const custom = Boolean(row.is_custom)
  const product = custom ? null : Object.values(PRODUCTS).find((def) => def.number === row.product_id)
  const price = product ? priceOf(product, row.variant_id) : null
  const pack = row.sale_unit === "pack"
  return {
    custom,
    title: row.name,
    category: null,
    product,
    variantId: row.variant_id || null,
    sale_unit: row.sale_unit,
    qty: row.qty,
    units: pack ? row.qty * price.pack_size : row.qty,
    unitPrice: row.price,
    gross: row.gross_amount,
    discount: row.discount_amount,
    discounts: row.discount.map((entry) => ({ ...entry, amount: entryAmount(entry, row.gross_amount) })),
    subtotal: row.subtotal,
    taxes: row.taxes.map((entry) => ({ id: entry.id, level: entry.level, name: entry.name, type: entry.type, rate: entry.value, amount: entry.type === "fixed" ? r2(entry.value * row.qty) : r2((row.subtotal * entry.value) / 100) })),
    tax_amount: row.tax_amount,
    total: row.total,
    bundleId: row.bundle_id ?? null,
    bundleRole: row.bundle_role ?? null,
  }
}

function adaptOrder(sample, index) {
  const lines = sample.order_items.map(adaptLine)
  const payments = sample.payments.map((row) => ({
    method: row.method,
    bill_share: row.bill_amount,
    surcharge_active: row.surcharge_active,
    surcharge_type: row.type,
    surcharge_value: row.value,
    surcharge_amount: row.surcharge_amount,
    amount: row.amount,
    paid: row.paid,
    change: row.method === "cash" ? r2(Math.max(0, row.paid - row.amount)) : 0,
  }))
  const s = sample.summary
  return {
    number: index + 1,
    localId: sample.local_id,
    placedAt: sample.placed_at,
    customer: null,
    lines,
    payments,
    isCustom: lines.every((line) => line.custom),
    taxExempt: Boolean(sample.tax_exempt),
    discountExempt: Boolean(sample.discount_exempt),
    orderDiscount: sample.order_discount,
    bundles: sample.bundles || [],
    gross: s.gross_amount,
    discount: s.items_discount_amount,
    orderDiscountAmount: s.order_discount_amount,
    subtotal: s.subtotal,
    tax: s.tax_amount,
    surcharge: s.surcharge_amount,
    total: s.total_amount,
    paid: sum(payments, (row) => row.paid),
    change: sum(payments, (row) => row.change),
  }
}

export const ORDERS = SAMPLE_ORDERS.map(adaptOrder)
const [O1, O2, O3, O4] = ORDERS
const ORDER_BULK_BODY = SAMPLE_BODY

// The sales move stock (a custom line holds none).
const SALE_MOVEMENTS = []
for (const order of ORDERS) {
  for (const line of order.lines) {
    if (line.custom) continue
    const moved = movement({ product: line.product, variantId: line.variantId, type: "sale", reason: "sale", qty: -line.units, staff: AHMED, at: order.placedAt, order: { id: order.number, status: "completed" } })
    // The lots the line was sold from (a refund puts it back there).
    line.lots = moved.lots.map((lot) => ({ ...lot, qty: -lot.qty }))
    SALE_MOVEMENTS.push(moved)
  }
}

// ---------------------------------------------------------------- refunds (refundSamples.js is the request)

const taxRows = (taxes) => taxes.map(({ level, name, rate, amount }) => ({ level, name, rate, amount }))

/** A line given back: its share (qty ÷ qty sold) of the sale line's gross, discount, subtotal and tax. */
function refundLine(order, itemNumber, qty, { restock = true } = {}) {
  const line = order.lines[itemNumber - 1]
  const share = qty / line.qty
  const taxes = line.taxes.map((tax) => ({ ...tax, amount: r2(tax.amount * share) }))
  const amount = r2(line.subtotal * share)
  const tax = sum(taxes, (x) => x.amount)
  return { order, itemNumber, line, qty, restock: restock && !line.custom, gross: r2(line.gross * share), discount: r2(line.discount * share), amount, taxes: taxRows(taxes), tax, total: r2(amount + tax) }
}

/**
 * What each payment method gets back: the refund's bill split in the proportion the sale was paid, each with its own
 * surcharge on its share (only when it was charged on the sale), cash in whole rupees.
 */
function backWith(order, bill) {
  const shareTotal = sum(order.payments, (p) => p.bill_share)
  let allocated = 0
  return order.payments
    .map((p, index) => {
      const part = index === order.payments.length - 1 ? r2(bill - allocated) : r2((bill * p.bill_share) / shareTotal)
      allocated = r2(allocated + part)
      const surcharge = p.surcharge_active && p.surcharge_amount > 0 ? (p.surcharge_type === "fixed" ? r2((p.surcharge_amount * part) / p.bill_share) : r2((part * p.surcharge_value) / 100)) : 0
      const raw = r2(part + surcharge)
      return { method: p.method, bill_share: part, surcharge_amount: surcharge, amount: p.method === "cash" ? Math.round(raw) : raw }
    })
    .filter((row) => row.bill_share > 0.005)
}

/** picks: [[line number, qty]]; the order discount comes back in the share of the lines' total. */
function refund({ number, type, localId, at, order, reason, picks, receiptId, restockAll }) {
  const lines = picks.map(([itemNumber, qty]) => refundLine(order, itemNumber, qty))
  const orderTotal = sum(order.lines, (l) => l.total)
  const linesTotal = sum(lines, (l) => l.total)
  const orderDiscount = orderTotal > 0 ? r2((order.orderDiscountAmount * linesTotal) / orderTotal) : 0
  const payments = backWith(order, r2(linesTotal - orderDiscount))
  return {
    number, type, localId, at, order, reason, lines, payments, receiptId, restockAll,
    amount: sum(lines, (l) => l.amount), discount: sum(lines, (l) => l.discount), orderDiscount,
    tax: sum(lines, (l) => l.tax), surcharge: sum(payments, (p) => p.surcharge_amount), total: sum(payments, (p) => p.amount),
  }
}

// Partial: a gift wrap from the custom sale (cash) and a Mountain Dew from order 4 (card); complete: order 1 (cash, with its order
// discount) and order 3, which was paid in cash and card. Staff Zayan — refunds need a store admin / manager.
const R1 = refund({ number: 1, type: "partial", localId: SAMPLE_REFUNDS[0].local_id, at: SAMPLE_REFUNDS[0].refunded_at, order: O2, reason: SAMPLE_REFUNDS[0].reason, picks: [[1, 1]], receiptId: 5 })
const R2 = refund({ number: 2, type: "partial", localId: SAMPLE_REFUNDS[1].local_id, at: SAMPLE_REFUNDS[1].refunded_at, order: O4, reason: SAMPLE_REFUNDS[1].reason, picks: [[4, 1]], receiptId: 6 })
const R3 = refund({ number: 3, type: "complete", localId: SAMPLE_REFUNDS[2].local_id, at: SAMPLE_REFUNDS[2].refunded_at, order: O1, reason: SAMPLE_REFUNDS[2].reason, picks: [[1, 1]], receiptId: 7, restockAll: true })
const R4 = refund({ number: 4, type: "complete", localId: SAMPLE_REFUNDS[3].local_id, at: SAMPLE_REFUNDS[3].refunded_at, order: O3, reason: SAMPLE_REFUNDS[3].reason, picks: [[1, 1]], receiptId: 8, restockAll: true })
export const REFUNDS = [R1, R2, R3, R4]

// The request and the figures worked out from the orders must be the same (a guard against a typo in either).
REFUNDS.forEach((ref, index) => {
  const sample = SAMPLE_REFUNDS[index]
  const same = ref.total === sample.total_refunded_amount && ref.surcharge === sample.total_payment_surcharge_refunded && ref.orderDiscount === sample.order_discount_amount && true
  if (!same) throw new Error(`refund ${ref.number}: refundSamples.js does not match the orders (${ref.total} / ${ref.surcharge} / ${ref.orderDiscount})`)
  ref.lines.forEach((l, i) => {
    const item = sample.refund_items[i]
    if (l.gross !== item.gross_amount || l.discount !== item.discount_amount || l.amount !== item.subtotal || l.tax !== item.tax_amount || l.total !== item.total) throw new Error(`refund ${ref.number} line ${i + 1}: refundSamples.js does not match the orders`)
  })
})

// Restocked qty goes back (custom lines hold no stock).
for (const ref of REFUNDS) {
  for (const line of ref.lines) {
    if (!line.restock) continue
    const units = line.line.sale_unit === "pack" ? line.qty * priceOf(line.line.product, line.line.variantId).pack_size : line.qty
    movement({ product: line.line.product, variantId: line.line.variantId, type: "refund", reason: "refund", qty: units, at: ref.at, order: { id: ref.order.number, status: ref.type === "complete" ? "refunded" : "partial_refunded" }, refundOf: line.line })
  }
}

// A complete refund turns the order refunded; a partial one partial_refunded.
const statusOf = (order) => (REFUNDS.some((r) => r.order === order && r.type === "complete") ? "refunded" : REFUNDS.some((r) => r.order === order) ? "partial_refunded" : "completed")

function lineProduct(line) {
  return line.custom ? { name: line.title, category: null } : { product: productRef(line.product, line.variantId) }
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
    refund_items: ref.lines.map((l) => ({
      order_item_id: l.itemNumber,
      ...(l.line.custom ? { is_custom: true } : {}),
      ...lineProduct(l.line),
      qty: l.qty,
      sale_unit: l.line.custom ? "unit" : l.line.sale_unit,
      unit_price: l.line.unitPrice,
      gross_amount: l.gross,
      discount_amount: l.discount,
      subtotal: l.amount,
      tax_amount: l.tax,
      total: l.total,
      restocked: l.restock,
    })),
    order_discount_amount: ref.orderDiscount,
    payments: ref.payments.map((p) => ({ method: p.method, return_amount: p.amount })),
    total_payment_surcharge_refunded: ref.surcharge,
    total_refunded_amount: ref.total,
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
    // Every discount of the line: { id (the Discounts page number: store / bulk / bundle only), level, name, type, value }.
    discount: line.discounts.map(({ id, level, name, type, value }) => ({ id, level, name, type, value })),
    discount_amount: line.discount,
    subtotal: line.subtotal,
    // Every tax of the line: { id (the Taxes page number: store only), level, name, type, value }.
    taxes: line.taxes.map(({ id, level, name, type, rate }) => ({ id, level, name, type, value: rate })),
    tax_amount: line.tax_amount,
    total: line.total,
    ...(line.bundleId != null ? { bundle_id: line.bundleId, bundle_role: line.bundleRole } : {}),
    ...(refundOf === undefined ? {} : refundOf ? lineRefund(refundOf, index + 1) : { is_refunded: false, refund_qty: 0, refund_amount: 0, refund_tax: 0, refund_discount_amount: 0, refund_total: 0 }),
  }
  if (line.custom) {
    return { id: index + 1, is_custom: true, name: line.title, category: line.category ? { id: null, name: line.category } : null, qty: line.qty, unit_price: line.unitPrice, ...common }
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
  }
}

function orderRefund(order, afterRefunds) {
  const rows = afterRefunds ? REFUNDS.filter((r) => r.order === order) : []
  return {
    is_refunded: rows.length > 0,
    refund_status: !rows.length ? "none" : statusOf(order) === "refunded" ? "full" : "partial",
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
    local_receipt_number: null,
    receiptId: order.number,
    location: L1,
    staff: AHMED,
    customer: order.customer,
    batch: BATCH,
    is_custom: order.isCustom,
    tax_exempt: order.taxExempt,
    discount_exempt: order.discountExempt,
    order_items: order.lines.map((line, index) => orderItemView(line, index, afterRefunds ? order : null)),
    // The bundles used: { id, name, reward_type, value }.
    bundles: order.bundles,
    order_discount: order.orderDiscount,
    // Per method: its share of the bill, its surcharge (charged only while surcharge_active), what it paid and handed over.
    payments: order.payments.map((p) => ({
      method: p.method,
      bill_amount: p.bill_share,
      surcharge_active: p.surcharge_active,
      type: p.surcharge_type,
      value: p.surcharge_value,
      surcharge_amount: p.surcharge_amount,
      amount: p.amount,
      paid: p.paid,
    })),
    summary: {
      currency: "PKR",
      total_items: order.lines.length,
      gross_amount: order.gross,
      items_discount_amount: order.discount,
      subtotal: order.subtotal,
      order_discount_amount: order.orderDiscountAmount,
      tax_amount: order.tax,
      surcharge_amount: order.surcharge,
      total_amount: order.total,
    },
    payment_method: order.payments.length > 1 ? "mixed" : order.payments[0].method,
    amount_paid: order.paid,
    change_due: order.change,
    remaining_amount: 0,
    payment_status: afterRefunds && statusOf(order) === "refunded" ? "refunded" : "paid",
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
    local_receipt_number: null,
    store: { name: STORE.name, ntn: STORE.ntn, strn: STORE.strn },
    issued_at: order.placedAt,
    channel: "pos",
    status: statusOf(order),
    payment_status: statusOf(order) === "refunded" ? "refunded" : "paid",
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

/** The Taxes page taxes a product is charged: GST, and the Sugar tax on Pepsi and Sugar (a def can say its own). */
const storeTaxesOf = (def) => def.storeTaxes || [GST, ...(SUGAR_TAXED.has(def.key) ? [SUGAR_TAX] : [])]

/**
 * What ONE pack / ONE unit is cut and charged, every discount and tax of the thing sold worked out: the
 * product / variant discount, then the category discount on what is left, then the store, category,
 * product and variant taxes, each on what is left. A bulk discount depends on the qty, so it is not in these.
 */
function levelFigures(def, price, discount = def.discount, variantTaxes = []) {
  const category = CATEGORIES[def.category_id]
  const cut = category.discount_value > 0 ? category.discount_value : 0
  const taxList = [...storeTaxesOf(def), ...(category.tax_value > 0 ? [{ type: category.tax_type, value: category.tax_value }] : []), ...def.taxes, ...variantTaxes]
  const fixed = taxList.reduce((s, x) => s + (x.type === "fixed" ? x.value : 0), 0)
  const percents = taxList.filter((x) => x.type === "percentage").map((x) => x.value)
  const own = discount
  const of = (listPrice, units) => {
    // The product / variant discount first, then the category discount on what is left.
    const fromProduct = own ? (own.type === "fixed" ? Math.min(listPrice, own.value * units) : r2((listPrice * own.value) / 100)) : 0
    const discount = r2(fromProduct + ((listPrice - fromProduct) * cut) / 100)
    const base = listPrice - discount
    return { discount, tax: r2(percents.reduce((s, v) => s + r2((base * v) / 100), 0) + fixed * units) }
  }
  const unit = price.sell_loose || !price.is_pack ? of(price.unit_price, 1) : null
  const pack = price.is_pack ? of(price.pack_price, price.pack_size) : null
  return {
    pack_discount_value: pack ? pack.discount : null,
    unit_discount_value: unit ? unit.discount : null,
    pack_tax_value: pack ? pack.tax : null,
    unit_tax_value: unit ? unit.tax : null,
  }
}

// The bulk discounts (GET /bulk-discounts) as a product lists them: Pepsi 1L (variant 3) and Sugar.
const BULK_ON_PRODUCT = {
  1: { id: 1, name: "Pepsi 1L bulk", variant_id: 3, sale_unit: "unit", tiers: [{ min_qty: 3, discount_type: "percentage", discount_value: 5 }, { min_qty: 10, discount_type: "fixed", discount_value: 10 }] },
  4: { id: 2, name: "Sugar 10 kg bulk", variant_id: null, sale_unit: "unit", tiers: [{ min_qty: 10, discount_type: "fixed", discount_value: 10 }] },
}

/** One discount / tax of a list as GET /products gives it. */
const discountEntry = (level, x) => ({ level, name: x.name, type: x.type, value: x.value, ...(x.applies_to && x.applies_to !== "all" ? { applies_to: x.applies_to } : {}) })
const taxEntry = (level, x) => ({ level, ...(level === "store" ? { id: x.id } : {}), name: x.name, type: x.type, value: x.value })

function productView(def) {
  const category = CATEGORIES[def.category_id]
  // A product just created has no bulk discount yet.
  const bulk = BULK_ON_PRODUCT[def.number] && !def.justCreated ? [BULK_ON_PRODUCT[def.number]] : []
  const categoryDiscount = category.discount_value > 0 ? [discountEntry("category", { name: category.discount_name, type: category.discount_type, value: category.discount_value })] : []
  const categoryTax = category.tax_value > 0 ? [taxEntry("category", { name: category.tax_name, type: category.tax_type, value: category.tax_value })] : []
  const bulkEntries = (variantId) =>
    bulk.filter((x) => x.variant_id == null || x.variant_id === variantId).map((x) => ({ level: "bulk", id: x.id, name: x.name, sale_unit: x.sale_unit, tiers: x.tiers }))
  const ownTaxList = def.taxes.map((x) => ({ name: x.name, type: x.type, value: x.value }))

  const variants = def.variants.map((v, i) => {
    const price = priceOf(def, i + 1)
    // Its own discount replaces its product's (they do not add up); uses_product_discount false = none.
    const effective = v.discount
      ? { ...v.discount, source: "variant" }
      : v.usesProductDiscount === false || !def.discount
        ? null
        : { ...def.discount, source: "product" }
    const variantTaxes = v.variantTaxes || []
    return {
      id: i + 1,
      name: v.name, sku: v.sku, barcode: v.barcode,
      cost_price: price.unit_cost, selling_price: price.unit_price,
      is_pack_product: price.is_pack, pack_size: price.pack_size, pack_cost_price: price.pack_cost, pack_selling_price: price.pack_price,
      sell_loose: price.is_pack ? price.sell_loose : true, is_weight_based: v.is_weight_based,
      // Its own image (null = show the product's).
      image: null,
      // The colours it comes in (hex codes).
      colors: v.colors || [],
      // Every discount and tax this variant is sold with, by level.
      discounts: [...(effective ? [discountEntry(effective.source, effective)] : []), ...categoryDiscount, ...bulkEntries(i + 1)],
      taxes: [...storeTaxesOf(def).map((x) => taxEntry("store", x)), ...categoryTax, ...ownTaxList.map((x) => taxEntry("product", x)), ...variantTaxes.map((x) => taxEntry("variant", x))],
      // Per ONE pack / ONE unit, the discounts and taxes above worked out (a bulk discount is by qty, so not in them).
      ...levelFigures(def, price, effective, variantTaxes),
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
    category: { id: def.category_id, name: category.name },
    sku: def.sku,
    barcode: def.barcode,
    image: null,
    // The colours it comes in (hex codes); with variants each variant has its own.
    colors: def.colors || [],
    description: null,
    unit: def.unit,
    // The store's currency: every price and amount of the product is in it.
    currency: "PKR",
    // A product with variants has no price of its own (0): each variant carries it.
    cost_price: own ? own.unit_cost : 0,
    selling_price: own ? sell : 0,
    is_pack_product: false,
    pack_size: null,
    pack_cost_price: null,
    pack_selling_price: null,
    sell_loose: own ? true : false,
    is_weight_based: def.is_weight_based,
    has_bulk_discount: bulk.length > 0,
    // 0 on a product with variants: each variant has its own level (GET /products/stock).
    low_stock_threshold: def.variants.length ? 0 : def.low_stock_threshold,
    low_stock_unit: def.variants.length ? null : "unit",
    total_price_each_unit: own ? r2(sell * (1 + taxPct / 100)) : 0,
    total_pack_price: null,
    // Without variants the product carries the per pack / per unit figures itself.
    ...(own ? levelFigures(def, own) : {}),
    has_product_discount: Boolean(def.discount),
    // Without variants: every discount that applies to the product (with variants: on each variant).
    ...(def.variants.length ? {} : { discounts: [...(def.discount ? [discountEntry("product", def.discount)] : []), ...categoryDiscount, ...bulkEntries(null)] }),
    has_product_tax: Boolean(def.taxes.length),
    // Without variants: every tax that applies to the product (with variants: on each variant).
    ...(def.variants.length ? {} : { taxes: [...storeTaxesOf(def).map((x) => taxEntry("store", x)), ...categoryTax, ...ownTaxList.map((x) => taxEntry("product", x))] }),
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

// The GET /products sample: Pepsi with a product level tax (Import Duty 5%), 500ML with a discount of its own (7%)
// and Jumbo with a tax of its own (Import GST 10%); the Taxes page has GST only.
const PEPSI_LIST = {
  ...PRODUCT_DEFS[0],
  taxes: [{ name: "Import Duty", type: "percentage", value: 5 }],
  storeTaxes: [GST],
  variants: PRODUCT_DEFS[0].variants.map((v, i) => ({
    ...v,
    ...(i === 1 ? { discount: { name: "Eid Shopping", type: "percentage", value: 7 } } : {}),
    ...(i === 5 ? { variantTaxes: [{ name: "Import GST", type: "percentage", value: 10 }] } : {}),
  })),
}

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

// ---------------------------------------------------------------- dashboard lists and detail pages

/** The transactions of the sales (one per payment), numbered in the order they were paid. */
const TXNS = ORDERS.flatMap((order) => order.payments.map((p) => ({ order, p }))).map(({ order, p }, index) => ({
  id: index + 1,
  reference: null,
  order: { id: order.number, status: statusOf(order) },
  location: L1,
  method: p.method,
  amount: p.amount,
  surcharge_amount: p.surcharge_amount,
  currency: "PKR",
  status: "success",
  paid_at: order.placedAt,
}))

const productListRow = (view) => ({
  id: view.id,
  title: view.title,
  sku: view.sku,
  barcode: view.barcode,
  category: view.category ?? null,
  total_variants: (view.variants || []).length,
  is_active: view.is_active !== false,
  status: view.is_active === false ? "inactive" : "active",
})
const PRODUCT_LIST_ROWS = PRODUCT_VIEWS.map(productListRow)

/** One row per product (or variant) sold by weight. */
const WEIGHTED_ROWS = PRODUCT_DEFS.flatMap((def) => {
  const category = { id: CATEGORIES[def.category_id].id, name: CATEGORIES[def.category_id].name }
  const rows = def.variants.length ? def.variants.map((v, i) => [i + 1, v]).filter(([, v]) => v.is_weight_based) : def.is_weight_based ? [[null, def]] : []
  return rows.map(([variantId, row]) => ({
    id: def.number,
    title: def.title,
    variant: variantId ? { id: variantId, name: row.name } : null,
    sku: row.sku,
    category,
    unit: def.unit,
    price: row.price ?? null,
    cost_price: row.cost ?? null,
    status: "active",
  }))
})

const soldAt = (row) =>
  row.location_scope === "selected"
    ? { scope: "selected", locations: row.location_ids.map((id) => ({ id, name: LOCATIONS[id].name })) }
    : { scope: "all", locations: [] }
const CATEGORY_LIST_ROWS = CATEGORY_ROWS.map((row) => ({ id: row.id, name: row.name, sold_at: soldAt(row), is_active: true, status: "active" }))

const LOCATION_STAFF = {
  1: [
    { id: 2, name: "Ahmed Malik", email: "ahmed@acadex.co", phone: "03001112233", role: "manager", pin: "2222", is_active: true },
    { id: 3, name: "Sana Tariq", email: "sana@acadex.co", phone: null, role: "cashier", pin: "3333", is_active: true },
  ],
  2: [{ id: 4, name: "Bilal Raza", email: "bilal@acadex.co", phone: "03111234567", role: "manager", pin: "5555", is_active: true }],
  3: [],
}
const LOCATION_DETAILS = {
  1: { address: "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi", city: "Karachi", phone: "03162196345", is_default: true },
  2: { address: "Plot 7, Main Shahrah-e-Faisal, Karachi", city: "Karachi", phone: "03211234567", is_default: false },
  3: { address: "Shop # 12, Main University Road, Gulshan e Iqbal Block 2, Karachi", city: "Karachi", phone: "03001234567", is_default: false },
}
const managerOf = (id) => {
  const user = LOCATION_STAFF[id].find((row) => row.role === "manager")
  return user ? { id: user.id, name: user.name, email: user.email, phone: user.phone } : null
}
const LOCATION_LIST_ROWS = [1, 2, 3].map((id) => ({ id, name: LOCATIONS[id].name, city: LOCATION_DETAILS[id].city, manager: managerOf(id), is_active: true, status: "active" }))
const locationDetail = (id) => ({
  id,
  name: LOCATIONS[id].name,
  address: LOCATION_DETAILS[id].address,
  city: LOCATION_DETAILS[id].city,
  country: "PK",
  postal_code: null,
  phone: LOCATION_DETAILS[id].phone,
  is_default: LOCATION_DETAILS[id].is_default,
  is_active: true,
  status: "active",
  manager: LOCATION_STAFF[id].find((row) => row.role === "manager") || null,
  users: LOCATION_STAFF[id],
  created_at: "2026-10-31T09:27:34.000Z",
  updated_at: "2026-10-31T09:27:34.000Z",
})
const DEVICE_ROWS = [
  { id: 1, device_id: "ACADEX-PC-01", name: "Counter 1", location: L1, platform: "windows", app_version: "1.4.0", last_seen_at: "2026-11-07T09:58:00.000Z", is_active: true, status: "active" },
  { id: 2, device_id: "ACADEX-PC-02", name: "Counter 2", location: L1, platform: "windows", app_version: "1.4.0", last_seen_at: "2026-11-06T21:10:00.000Z", is_active: true, status: "active" },
  { id: 3, device_id: "ACADEX-PC-03", name: "Branch 2 till", location: L2, platform: "windows", app_version: "1.3.2", last_seen_at: null, is_active: false, status: "inactive" },
]

/** GET /orders/:id: the order (as GET /orders gives it), its transactions and its refunds. */
const orderDetail = (order) => ({
  ...orderView(order, { afterRefunds: true }),
  transactions: TXNS.filter((row) => row.order.id === order.number),
  refunds: REFUNDS.filter((r) => r.order === order).map(refundView),
})

export const DEMO_EPS = {
  // ---- Authentication / license
  "auth-login": { body: { email: "zayan@acadex.co", password: "zayanahmed" } },
  "license-validate": { body: { license_key: "PASTE_YOUR_LICENSE_KEY", device_uid: 1 } },

  // ---- Staff
  "staff-bulk": {
    body: { storeId: 1, items: [{ locationId: 1, name: "Ahmed Malik", email: "ahmed@acadex.co", password: "ahmedmalik", pin: "2222", role: "cashier" }] },
    responses: [created([STAFF_ROW], "Staff Created")],
  },
  "staff-list": {
    responses: [
      page([
        {
          ...STAFF_ROW,
          status: "clock_in",
          sessions_total: 2,
          sessions: [
            { id: 2, location: L1, status: "clock_in", opening_at: "2026-11-07T09:00:00.000Z", closing_at: null, hours_worked: 3.5 },
            { id: 1, location: L1, status: "clock_out", opening_at: "2026-11-06T09:00:00.000Z", closing_at: "2026-11-06T17:00:00.000Z", hours_worked: 8 },
          ],
        },
      ]),
    ],
  },

  // ---- Store, locations, sessions, batches (GET)
  "store-me": {
    responses: [
      ok({
        id: 1,
        name: "Acadex",
        business_type: "grocery",
        currency: "PKR",
        timezone: "Asia/Karachi",
        ntn: "1234567-8",
        strn: "3277876123456",
        fbr_invoice_enabled: false,
        pos_enabled: true,
        web_enabled: true,
        is_active: true,
        status: "active",
        created_at: "2026-10-31T09:27:34.000Z",
      }),
    ],
  },
  "location-list": {
    responses: [
      page([
        {
          id: 1,
          name: "Gulshan e Iqbal Block 13 D",
          address: "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi",
          city: "Karachi",
          country: "Pakistan",
          postal_code: null,
          phone: "03162196345",
          is_default: true,
          is_active: true,
          users: [
            { name: "Ahmed Malik", email: "ahmed@acadex.co", phone: null, role: "manager", pin: "2222", is_active: true },
            { name: "Sana Tariq", email: "sana@acadex.co", phone: null, role: "cashier", pin: "3333", is_active: true },
          ],
          created_at: "2026-10-31T09:27:34.000Z",
          updated_at: "2026-10-31T09:27:34.000Z",
        },
      ]),
    ],
  },
  "staff-session-list": {
    responses: [
      page([
        { id: 3, staff: { id: 2, name: "Ahmed Malik", role: "cashier" }, location: L1, status: "clock_in", opening_at: "2026-11-06T09:00:00.000Z", closing_at: null },
        { id: 2, staff: { id: 1, name: "Zayan Ahmed", role: "store_admin" }, location: L1, status: "clock_out", opening_at: "2026-11-05T09:00:00.000Z", closing_at: "2026-11-05T17:30:00.000Z" },
        { id: 1, staff: { id: 2, name: "Ahmed Malik", role: "cashier" }, location: L1, status: "clock_out", opening_at: "2026-11-05T08:55:00.000Z", closing_at: "2026-11-05T17:00:00.000Z" },
      ]),
      fail(400, "status", "status must be clock_in or clock_out"),
    ],
  },
  "batch-list": {
    responses: [
      page([
        {
          id: 1,
          staff: { id: 2, name: "Ahmed Malik", role: "manager" },
          location: { id: 1, name: "Gulshan e Iqbal Block 13 D" },
          status: "closed",
          opening_amount: 5000,
          cash_sales: 1058.53,
          total_cash: 10000,
          cash_variance: 3941.47,
          opening_at: "2026-10-24T09:00:00.000Z",
          closing_at: "2026-10-24T17:00:00.000Z",
        },
      ]),
      fail(400, "status", "status must be open or closed"),
    ],
  },
  "staff-bulk-patch": {
    body: { items: [{ id: 2, phone: "03001112222", pin: "2323" }] },
    responses: [ok([{ ...STAFF_ROW, phone: "03001112222", pin: "2323" }], "Staff Updated")],
  },

  // ---- Categories (the store's three, plus Personal Care and Dry Fruits for the new products)
  "cat-bulk": { body: CAT_BULK_BODY, responses: [created(CATEGORY_ROWS.map(categoryView), "Categories Created")] },
  "cat-list": {
    responses: [
      page(
        CATEGORY_ROWS.map((row) => ({
          id: row.id, name: row.name, slug: row.slug, parent: null, image_url: null, description: null,
          tax_type: row.tax_type, tax_value: row.tax_value, tax_name: row.tax_name,
          discount_type: row.discount_type, discount_value: row.discount_value, discount_name: row.discount_name,
          location_scope: row.location_scope, location_ids: row.location_ids, is_active: true,
        }))
      ),
    ],
  },
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
  "prod-bulk": { body: PROD_BULK_BODY, responses: [created([productView(PEPSI_CREATED)], "Products Created")] },
  "prod-list": {
    description:
      "Every product with all its detail, variants inside, and no stock (the stock of every product and variant, with its lots, is GET /products/stock). One product: { id (product number), title, has_variants, total_variants (how many; null without), variants [{ id (variant number 1, 2, 3…), name, sku, barcode, cost_price, selling_price, is_pack_product, pack_size, pack_cost_price, pack_selling_price, sell_loose, is_weight_based, image, colors, discounts [], taxes [], pack_discount_value, unit_discount_value, pack_tax_value, unit_tax_value, is_active }], slug, category { id, name }, sku, barcode, image, colors, description, unit, currency (the store's currency code, e.g. PKR), cost_price, selling_price, pack fields, sell_loose, is_weight_based, has_bulk_discount, low_stock_threshold, low_stock_unit, total_price_each_unit, total_pack_price, has_product_discount, has_product_tax, location_scope / location_ids, stock_scope / stock_location_ids, is_active, is_pos_visible, is_web_visible }. A product with variants has no price or pack of its own (0 / null), low_stock_threshold 0 and low_stock_unit null, and no discounts or taxes of its own: each variant carries its prices, pack, discounts and taxes (its low stock level is in GET /products/stock). has_product_discount / has_product_tax say whether the product itself has a discount / a tax (every variant takes them unless it has its own); has_bulk_discount whether a live bulk discount is on it or one of its variants. discounts [] of a variant lists every discount it is sold with, each with its level: variant (its own — it replaces the product's, they do not add up), product (the product's discount, taken by a variant that has none of its own), category, and bulk (id = bulk discount number, name, sale_unit, tiers [{ min_qty, discount_type, discount_value }]: from min_qty on every unit is cut; on the variant or on its product). A discount entry is { level, name, type, value } (plus applies_to when it is not all: pack | loose | weight). taxes [] of a variant lists every tax it is charged, each with its level: store (id = tax number: a Taxes page tax that covers it), category, product (the product's own taxes) and variant (its own taxes). A tax entry is { level, name, type, value } (a fixed tax is per unit). pack_discount_value / unit_discount_value: what ONE pack / ONE unit is cut by in rupees, worked out from the discounts [] — the variant (or product) discount, then the category discount, each on what is left. A bulk discount depends on how many are bought, and a bundle on the whole cart, so neither is in these: the POS applies them. pack_tax_value / unit_tax_value: the tax in rupees on ONE pack / ONE unit after those discounts, every tax of taxes [] together (a percentage on the discounted price, a fixed tax per unit — so × pack size on a pack). null = it is not sold that way (no pack, or a pack sold only by the pack for unit). A product without variants carries discounts [], taxes [] and these four figures itself (after total_pack_price / has_product_discount / has_product_tax), with the same levels (product instead of variant). Filters: locations (a list of location numbers or UUIDs: locations=1,2 — the products sold at any of those branches; store admin only, a manager / cashier only sees the products sold at their own location), categories (a list of category numbers: categories=1,2), type (pack = sold in packs, loose = a plain item that is neither pack nor weight based, weight = sold by weight; a list is allowed: type=pack,weight; a product with variants matches when any of its variants does), q (a text found in the title, SKU or barcode of the product or of a variant), from / to (created date, YYYY-MM-DD — to covers the whole day). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    responses: [page([productView(PEPSI_LIST)])],
  },
  "prod-get": {
    description: "One product (:id = product number or UUID) — its information only, no stock (the stock is GET /products/stock): the product (title, sku, barcode, category, unit, taxes, discount, low stock level, where it is sold) and its variants, each with its own prices / pack, discount, taxes and low stock level; without variants its own prices and pack. The same shape as a product of GET /products.",
    responses: [ok(PRODUCT_VIEWS[0]), { ...ok(PRODUCT_VIEWS[3]), label: "200 OK · without variants" }],
  },
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
  "tax-list": {
    responses: [
      page([
        { id: 1, name: "GST", type: "percentage", value: 18, product_scope: "all", product_ids: [], is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z" },
        {
          id: 2, name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 4],
          is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z",
        },
      ]),
    ],
  },

  // ---- Stock inventory
  "movement-bulk": { body: MOVEMENT_BULK_BODY, responses: [created(MOVEMENT_BULK_ROWS.map(movementView), "Stock Movement Created")] },
  // One of each kind, newest first: a sale, a stock count (adjustment), a damage (stock out) and a purchase (stock in).
  "movement-list": {
    responses: [
      page(
        [pickMovement("sale"), pickMovement("adjustment"), pickMovement("stock_out", "damage"), pickMovement("stock_in", "purchase")]
          .sort((a, b) => b.id - a.id)
          .map(movementView)
      ),
    ],
  },
  "transfer-bulk": { body: TRANSFER_BULK_BODY, responses: [created([transferView()], "Stock Transfer Created")] },
  // The second one was received short: 9 of the 10 sent arrived, and the destination said why.
  "transfer-list": { responses: [page([transferView(), transferReceivedShort()])] },
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
      ok([transferView({ qty15: 15, extra: { product: productRef(PRODUCTS.sugar, null, { barcode: false }), qty: 20, received_qty: null, loss_reason_note: "", status: "on_the_way" } })], "Stock Transfers Updated"),
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
  "order-bulk": {
    body: ORDER_BULK_BODY,
    responses: [
      created(ORDERS.map((o) => orderView(o)), "Order Created"),
      { ...created([orderView(O1)], "Order Created"), label: "201 — order 1 sent again (same local_id): the saved order, no double sale" },
      fail(400, "figures do not add up", "order_items[0].total 120 is not subtotal + tax (112.1)", { data: [], failed: [{ index: 0, message: "order_items[0].total 120 is not subtotal + tax (112.1)", status: 400 }] }),
      fail(400, "surcharge off", "payments[0]: surcharge_active is false, so surcharge_amount must be 0", { data: [], failed: [{ index: 0, message: "payments[0]: surcharge_active is false, so surcharge_amount must be 0", status: 400 }] }),
      fail(404, "unknown bundle", "Bundle discount 99 not found", { data: [], failed: [{ index: 0, message: "Bundle discount 99 not found", status: 404 }] }),
      fail(403, "cashier discount", "A manager must perform this action", { data: [], failed: [{ index: 0, message: "A manager must perform this action", status: 403 }] }),
    ],
  },
  "order-list-completed": { responses: [page([orderView(O3, { afterRefunds: true }), orderView(O1, { afterRefunds: true })])] },
  "order-list-pending": { responses: [page([])] },
  "order-list-cancelled": { responses: [page([])] },
  "order-history": {
    responses: [
      page([O4, O3, O2, O1].map((o) => orderView(o, { afterRefunds: true }))),
      fail(400, "status", "status must be completed, partial_refunded, pending, cancelled, refunded or all"),
    ],
  },
  "order-get": {
    description: "One order — :id is the order number (e.g. 1) or UUID — in the same shape as GET /orders (every line with its discounts, taxes, bundle and what was given back of it: is_refunded, refund_qty, refund_amount, refund_tax, refund_discount_amount, refund_total; bundles, order_discount, payments, summary, statuses, the order's refund totals), plus transactions [{ id, reference, order, location, method, amount, surcharge_amount, currency, status, paid_at }] (one per payment, as GET /transactions) and refunds [ …each refund of the order as GET /orders/refunds gives it: refund_items, order_discount_amount, payments { method, return_amount }, total_payment_surcharge_refunded, total_refunded_amount ]. A manager / cashier only sees orders of their own location.",
    responses: [ok(orderDetail(O4)), { ...ok(orderDetail(O3)), label: "200 OK · a split payment, refunded in full" }, fail(404, "not found", "Order not found")],
  },
  "order-receipt": { responses: [ok(receiptView(O1))] },
  "transaction-list": {
    description:
      "The orders' transactions — one per payment, created with the order (id = the transaction number 1, 2, 3…), newest first: { id, reference (the card / wallet reference the till sent, if any), order { id, status }, location { id, name }, method, amount (what the method paid, surcharge included), surcharge_amount (its Payment Method Surcharge), currency, status (initiated | success | failed), paid_at }. Money given back by a refund is not a transaction: it is in GET /orders/refunds. Filters: orderId, method, status, from / to. A store admin sees every location, or the ones in locations (a list of location numbers: locations=1,2; location_id = one location still works); a manager / cashier only their own. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data. Dates (payment time): range = week | month | 6months | year, or from / to (YYYY-MM-DD — to covers the whole day).",
    responses: [page([...TXNS].reverse())],
  },
  "order-bulk-patch": {
    body: { locationId: 1, items: [{ id: 1, customer_id: 2 }] },
    responses: [ok([{ ...orderView(O1, { afterRefunds: true }), customer: CUSTOMERS[2] }], "Orders Updated")],
  },

  // ---- Refunds
  "order-refund-bulk": {
    body: SAMPLE_REFUND_BODY,
    responses: [
      created(REFUNDS.map(refundView), "Refunded Successfully"),
      { ...created([refundView(R4)], "Refunded Successfully"), label: "201 — refund 4 sent again (same local_id): the saved refund" },
      fail(400, "more than left", "Order 4 line 4: only 0 left to refund (1 sent)", { data: [], failed: [{ index: 0, message: "Order 4 line 4: only 0 left to refund (1 sent)", status: 400 }] }),
      fail(400, "not the share of the sale", "Order 2 line 1: gross_amount 200 is not the share of the sale for 1 (300)", { data: [], failed: [{ index: 0, message: "Order 2 line 1: gross_amount 200 is not the share of the sale for 1 (300)", status: 400 }] }),
      fail(400, "complete leaves a line", "Order 4: a complete refund must give back every remaining line (line 1 has 2 left)", { data: [], failed: [{ index: 0, message: "Order 4: a complete refund must give back every remaining line (line 1 has 2 left)", status: 400 }] }),
      fail(400, "partial gives everything", "Order 1: this gives back everything left, send refund_type complete", { data: [], failed: [{ index: 0, message: "Order 1: this gives back everything left, send refund_type complete", status: 400 }] }),
      fail(400, "wrong total", "total_refunded_amount 380 is not what this refund pays back (370)", { data: [], failed: [{ index: 0, message: "total_refunded_amount 380 is not what this refund pays back (370)", status: 400 }] }),
      fail(400, "surcharge total", "total_payment_surcharge_refunded 40 is not the surcharge of these payments (50.98)", { data: [], failed: [{ index: 0, message: "total_payment_surcharge_refunded 40 is not the surcharge of these payments (50.98)", status: 400 }] }),
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
        items: R1.lines.map((l) => ({ id: l.itemNumber, title: l.line.custom ? l.line.title : productRef(l.line.product, l.line.variantId).title, sku: l.line.custom ? null : productRef(l.line.product, l.line.variantId).sku, qty: l.qty, unit_price: l.line.unitPrice, total: l.total })),
        subtotal: R1.amount,
        tax_amount: r2(R1.tax + R1.surcharge),
        total: R1.total,
        payments: R1.payments.map((p) => ({ method: p.method, amount: p.amount })),
      }),
    ],
  },
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
    lot: (changes.lots || row.lots)[0] || null,
    created_at: row.created_at,
    updated_at: null,
    ...Object.fromEntries(Object.entries(changes).filter(([key]) => key !== "lots" && key !== "qty_after")),
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
              movement_type: "adjustment", reason: "count", reason_note: "Shelf count", qty: r2(17 - pepsi15), lot: { id: 1, qty: r2(17 - pepsi15), expiry_date: null },
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
            movement_type: "adjustment", reason: "other", reason_note: "Lot 1 deleted: Wrong batch entered", qty: -garnier3, lot: { id: 1, qty: -garnier3, expiry_date: null },
            created_at: "2026-11-07T09:50:00.000Z", updated_at: null,
          },
        },
        "Stock Deleted"
      ),
    ],
  },
  "tax-bulk": {
    body: { storeId: 1, items: [{ name: "GST", type: "percentage", value: 18, product_scope: "all", isActive: true }, { name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 4], isActive: true }] },
    responses: [
      created(
        [
          { id: 1, name: "GST", type: "percentage", value: 18, product_scope: "all", product_ids: [], is_active: true },
          { id: 2, name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 4], is_active: true },
        ],
        "Taxes Created"
      ),
    ],
  },
  "tax-bulk-patch": {
    body: { items: [{ id: 2, value: 6, product_scope: "selected", product_ids: [1, 4, { product_id: 3, variant_id: 4 }] }] },
    responses: [
      ok(
        [
          {
            id: 2, name: "Sugar tax", type: "fixed", value: 6, product_scope: "selected", product_ids: [1, { product_id: 3, variant_id: 4 }, 4],
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
  id: 2, uuid: "8a2d4c71-2f5b-4e3a-b6c9-7d1e0f3a2b44", name: "Sugar tax", type: "fixed", value: 5, product_scope: "selected", product_ids: [{ product_id: 1, variant_id: 3 }, 4],
  is_active: true, created_at: "2026-11-01T06:00:00.000Z", updated_at: "2026-11-01T06:00:00.000Z",
}
Object.assign(DEMO_EPS, {
  // Payment method surcharges: cash 16%, card 8% (a percentage of the method's share of the bill).
  "surcharge-bulk": {
    body: {
      storeId: 1,
      items: [
        { method: "cash", charges: 16, type: "percentage", isActive: true },
        { method: "card", charges: 8, type: "percentage", isActive: true },
      ],
    },
    responses: [
      created(
        [
          { id: 1, method: "cash", type: "percentage", charges: 16, is_active: true },
          { id: 2, method: "card", type: "percentage", charges: 8, is_active: true },
        ],
        "Surcharges Created"
      ),
    ],
  },
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
        ...ok([{ ...orderView(O2), payment_method: "easypaisa", payments: orderView(O2).payments.map((p) => ({ ...p, method: "easypaisa", paid: p.amount })) }], "Payment Method Updated"),
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
  sales: "Sales Summary", profit: "Profit & Margin", payments: "Payments", batches: "Z-Reports", sessions: "Sessions History",
  top_products: "By Products", top_categories: "By Categories", inventory: "Inventory", refunds_cancelled: "Refunds / Cancelled",
  cashiers: "By Cashiers", offers: "Discount Performance", tax: "Tax Breakdown",
}
const rptTables = (lists) =>
  Object.fromEntries(Object.entries(lists).map(([name, rows]) => [name, { rows, pagination: { page: 1, limit: 20, total: rows.length, total_pages: 1 } }]))
function rptReply(id, summary, lists = {}) {
  const section = REPORT_SECTION[id]
  const reply = ok({ section: id, label: RPT_API_LABEL[id], level: section.level, reporting_level: "advanced", location: "all", from: "2026-11-01", to: "2026-11-07", filters: {}, summary, tables: rptTables(lists) })
  return { ...reply, section: id, label: `${section.label} · 200 OK` }
}
function rptPercent(rows, key) {
  const total = sum(rows, (row) => row[key])
  return rows.map((row) => ({ ...row, percent: total > 0 ? Math.round((row[key] / total) * 100) : 0 }))
}
const rptCategoryName = (line) => (line.custom ? line.category || "Custom" : CATEGORIES[line.product.category_id].name)
/** A sold line's cost: a pack sold as a pack at pack_cost, else the unit cost. */
function rptCost(line) {
  if (line.custom) return 0
  const variant = line.variantId ? line.product.variants[line.variantId - 1] : line.product
  if (line.sale_unit === "pack") return r2((variant.pack_cost || 0) * line.qty)
  return r2((variant.cost || 0) * (line.units ?? line.qty))
}
const RPT_LINES = ORDERS.flatMap((order) => order.lines.map((line) => ({ order, line })))
/** The order discount of a line: its share of the order discount (by the line's subtotal). */
const rptOrderDiscount = (order, line) => (order.orderDiscountAmount > 0 && order.subtotal > 0 ? r2((order.orderDiscountAmount * line.subtotal) / order.subtotal) : 0)
/** Lines added up per group, best seller first. */
function rptGroup(keyOf, headOf) {
  const groups = new Map()
  for (const { order, line } of RPT_LINES) {
    const k = keyOf(line)
    if (!groups.has(k)) groups.set(k, { ...headOf(line), orders: new Set(), units_sold: 0, gross_sales: 0, discounts: 0, net_sales: 0, tax: 0, total_sales: 0, cost: 0 })
    const row = groups.get(k)
    const orderDiscount = rptOrderDiscount(order, line)
    row.orders.add(order.number)
    row.units_sold = r2(row.units_sold + (line.units ?? line.qty))
    row.gross_sales = r2(row.gross_sales + line.gross)
    row.discounts = r2(row.discounts + line.discount + orderDiscount)
    row.net_sales = r2(row.net_sales + line.subtotal - orderDiscount)
    row.tax = r2(row.tax + line.tax_amount)
    row.total_sales = r2(row.total_sales + line.subtotal - orderDiscount + line.tax_amount)
    row.cost = r2(row.cost + rptCost(line))
  }
  return rptPercent(
    [...groups.values()].map(({ orders, cost, ...row }) => ({ ...row, orders: orders.size, cost, gross_profit: r2(row.net_sales - cost) })).sort((a, b) => b.total_sales - a.total_sales),
    "total_sales"
  )
}

function reportSamples() {
  const lineDiscounts = sum(RPT_LINES, ({ line }) => line.discount)
  const orderDiscounts = sum(ORDERS, (order) => order.orderDiscountAmount)
  const net = r2(salesTotals.net - orderDiscounts)
  const cost = sum(RPT_LINES, ({ line }) => rptCost(line))

  // Sales Summary / Profit & Margin: single values only.
  const salesValues = {
    orders: ORDERS.length,
    units_sold: sum(RPT_LINES, ({ line }) => line.units ?? line.qty),
    gross_sales: salesTotals.gross,
    items_discounts: lineDiscounts,
    order_discounts: orderDiscounts,
    discounts: r2(lineDiscounts + orderDiscounts),
    net_sales: net,
    tax: salesTotals.tax,
    payments_tax: salesTotals.surcharge,
    shipping: 0,
    total_sales: salesTotals.total,
    total_collected: salesTotals.total,
    on_credit: 0,
    refunds: salesTotals.refunds,
    refunded_tax: sum(REFUNDS, (refund) => refund.tax),
    refunded_orders: new Set(REFUNDS.map((refund) => refund.order.number)).size,
    refunded_items: REFUNDS.reduce((count, refund) => count + refund.lines.length, 0),
    cancelled_orders: 0,
    cost,
    gross_profit: r2(net - cost),
  }

  // By Products / By Categories: every product (variant) and category sold.
  const products = rptGroup(
    (line) => (line.custom ? `custom:${line.title}` : `${line.product.number}|${line.variantId || 0}`),
    (line) => {
      if (line.custom) return { id: null, variant_id: null, product: line.title, variant: null, sku: null, category: rptCategoryName(line), unit: null }
      const variant = line.variantId ? line.product.variants[line.variantId - 1] : null
      return { id: line.product.number, variant_id: line.variantId || null, product: line.product.title, variant: variant?.name || null, sku: variant?.sku || line.product.sku, category: rptCategoryName(line), unit: line.product.unit }
    }
  )
  const categoryProducts = new Map()
  for (const { line } of RPT_LINES) {
    const name = rptCategoryName(line)
    if (!categoryProducts.has(name)) categoryProducts.set(name, new Set())
    categoryProducts.get(name).add(line.custom ? line.title : `${line.product.number}|${line.variantId || 0}`)
  }
  const categories = rptGroup(
    (line) => rptCategoryName(line),
    (line) => ({ id: line.custom ? null : line.product.category_id, category: rptCategoryName(line) })
  ).map(({ id, category, ...rest }) => ({ id, category, products: categoryProducts.get(category).size, ...rest }))

  // Payments: every method the store created (cash 16%, card 8% — Payment Surcharges) and any other used.
  const RULES = [
    { id: 1, method: "cash", type: "percentage", charges: 16 },
    { id: 2, method: "card", type: "percentage", charges: 8 },
  ]
  const sold = ORDERS.flatMap((order) => {
    const bills = sum(order.payments, (part) => part.bill_share)
    return order.payments.map((part) => ({ ...part, tax: bills > 0 ? r2((order.tax * part.bill_share) / bills) : 0 }))
  })
  const back = REFUNDS.flatMap((refund) => refund.payments).filter((part) => part.method !== "credit")
  const methods = [...RULES.map((rule) => rule.method), ...new Set(sold.map((part) => part.method))].filter((method, index, list) => list.indexOf(method) === index)
  const paymentRows = rptPercent(
    methods.map((method) => {
      const rule = RULES.find((row) => row.method === method)
      const taken = sold.filter((part) => part.method === method)
      const returned = back.filter((part) => part.method === method)
      const amount = sum(taken, (part) => part.amount)
      const refunds = sum(returned, (part) => part.amount)
      return {
        id: rule?.id ?? null,
        method,
        surcharge_type: rule?.type ?? null,
        surcharge_value: rule?.charges ?? null,
        is_active: rule ? true : null,
        transactions: taken.length,
        bill_amount: sum(taken, (part) => part.bill_share),
        tax: sum(taken, (part) => part.tax),
        surcharge: sum(taken, (part) => part.surcharge_amount),
        amount,
        refunds,
        surcharge_refunded: sum(returned, (part) => part.surcharge_amount),
        net_amount: r2(Math.max(0, amount - refunds)),
      }
    }),
    "net_amount"
  )
  const paymentValues = {
    methods: paymentRows.length,
    transactions: sum(paymentRows, (row) => row.transactions),
    bill_amount: sum(paymentRows, (row) => row.bill_amount),
    tax: sum(paymentRows, (row) => row.tax),
    surcharge: sum(paymentRows, (row) => row.surcharge),
    amount: sum(paymentRows, (row) => row.amount),
    refunds: sum(paymentRows, (row) => row.refunds),
    net_amount: sum(paymentRows, (row) => row.net_amount),
  }

  // Z-Reports: the batches history — batch 1, Ahmed's drawer at the first location.
  const methodNet = (name) => paymentRows.find((row) => row.method === name)?.net_amount || 0
  const opening = 5000
  const batchRow = {
    id: 1,
    location: L1.name,
    location_id: L1.id,
    cashier: AHMED.name,
    cashier_id: AHMED.id,
    status: "open",
    opened_at: "2026-11-06T09:00:00.000Z",
    closed_at: null,
    opening_amount: opening,
    orders: ORDERS.length,
    gross_sales: salesTotals.gross,
    discounts: r2(lineDiscounts + orderDiscounts),
    net_sales: net,
    tax: salesTotals.tax,
    surcharge: salesTotals.surcharge,
    refunds: salesTotals.refunds,
    total_sales: salesTotals.total,
    cash_sales: methodNet("cash"),
    card_sales: methodNet("card"),
    jazzcash_sales: 0,
    easypaisa_sales: 0,
    cash_in: 0,
    cash_out: 0,
    expected_cash: r2(opening + methodNet("cash")),
    counted_cash: null,
    variance: 0,
  }

  // Sessions History: every clock in / clock out.
  const sessionRows = [
    { id: 2, staff: ZAYAN.name, staff_id: ZAYAN.id, role: ZAYAN.role, location: L1.name, location_id: L1.id, clock_in_at: "2026-11-06T10:00:00.000Z", clock_out_at: null, hours_worked: 8, status: "on_duty" },
    { id: 1, staff: AHMED.name, staff_id: AHMED.id, role: AHMED.role, location: L1.name, location_id: L1.id, clock_in_at: "2026-11-06T09:00:00.000Z", clock_out_at: "2026-11-06T17:00:00.000Z", hours_worked: 8, status: "clocked_out" },
  ]

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
  const inventoryRows = [...stockKeys.values()].slice(0, 8).map(({ move, in: inn, out }) => {
    const product = productOf(move)
    return {
      id: move.product.id,
      variant_id: move.variant?.id ?? null,
      product: move.product.title,
      variant: move.variant?.name ?? null,
      sku: move.variant ? move.variant.sku : move.product.sku,
      category: CATEGORIES[product.category_id].name,
      location: L1.name,
      location_id: L1.id,
      unit: move.product.unit,
      type: product.is_weight_based ? "weight" : (move.variant ? product.variants[move.variant.id - 1] : product).is_pack_product ? "pack" : "loose",
      stock_in: inn,
      stock_out: out,
      current_stock: move.qty_after,
      stock_status: move.qty_after <= 0 ? "out" : product.low_stock_threshold != null && move.qty_after <= product.low_stock_threshold ? "low" : "ok",
      expiry_date: soonest(product, move),
      expiry_status: lotStatus(soonest(product, move)) || "none",
    }
  })

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
  const refundValues = {
    refunds: refundRows.length,
    complete_refunds: refundRows.filter((row) => row.type === "complete_refund").length,
    partial_refunds: refundRows.filter((row) => row.type === "partial_refund").length,
    voided_orders: 0,
    cancelled_orders: 0,
    refunded_amount: sum(refundRows, (row) => row.amount),
    cancelled_amount: 0,
  }

  // By Cashiers: highest total sales first.
  const cashierRows = [
    {
      id: AHMED.id,
      cashier: AHMED.name,
      role: AHMED.role,
      orders: ORDERS.length,
      units_sold: salesValues.units_sold,
      gross_sales: salesTotals.gross,
      discounts: salesValues.discounts,
      net_sales: net,
      tax: salesTotals.tax,
      total_sales: salesTotals.total,
      refunds: salesTotals.refunds,
    },
  ]

  // Discount Performance: every discount given (the line discounts and the order discounts).
  const discountGroups = new Map()
  const discountRow = (entry) => {
    const k = `${entry.level}|${entry.id ?? ""}|${entry.name}`
    if (!discountGroups.has(k)) discountGroups.set(k, { id: entry.id ?? null, discount: entry.name, level: entry.level, type: entry.type, value: entry.value, orders: new Set(), units: 0, sales: 0, discount_given: 0 })
    return discountGroups.get(k)
  }
  for (const { order, line } of RPT_LINES) {
    for (const entry of line.discounts) {
      if (!(entry.amount > 0)) continue
      const row = discountRow(entry)
      row.orders.add(order.number)
      row.units = r2(row.units + (line.units ?? line.qty))
      row.sales = r2(row.sales + line.subtotal)
      row.discount_given = r2(row.discount_given + entry.amount)
    }
    const orderDiscount = rptOrderDiscount(order, line)
    if (order.orderDiscount && orderDiscount > 0) {
      const row = discountRow({ ...order.orderDiscount, level: "order" })
      row.orders.add(order.number)
      row.units = r2(row.units + (line.units ?? line.qty))
      row.sales = r2(row.sales + line.subtotal - orderDiscount)
      row.discount_given = r2(row.discount_given + orderDiscount)
    }
  }
  const discountRows = [...discountGroups.values()].map(({ orders, ...row }) => ({ ...row, orders: orders.size })).sort((a, b) => b.discount_given - a.discount_given)
  const discounted = RPT_LINES.filter(({ order, line }) => line.discount > 0 || rptOrderDiscount(order, line) > 0)
  const discountValues = {
    discounts: discountRows.length,
    orders_discounted: new Set(discounted.map(({ order }) => order.number)).size,
    discount_given: sum(discountRows, (row) => row.discount_given),
    sales: sum(discounted, ({ order, line }) => line.subtotal - rptOrderDiscount(order, line)),
  }

  // Tax Breakdown: every tax on the lines (the payment surcharges are in Payments).
  const taxGroups = new Map()
  for (const { line } of RPT_LINES) {
    for (const tax of line.taxes) {
      const k = `${tax.level}|${tax.name}`
      if (!taxGroups.has(k)) taxGroups.set(k, { id: tax.level === "store" ? tax.id ?? null : null, tax: tax.name, level: tax.level, type: tax.type || "percentage", rate: tax.rate, taxable_amount: 0, tax_collected: 0 })
      const row = taxGroups.get(k)
      row.taxable_amount = r2(row.taxable_amount + line.subtotal)
      row.tax_collected = r2(row.tax_collected + tax.amount)
    }
  }
  const taxRows = [...taxGroups.values()].sort((a, b) => b.tax_collected - a.tax_collected)
  const byLevel = (level) => sum(taxRows.filter((row) => row.level === level), (row) => row.tax_collected)
  const taxValues = {
    orders: ORDERS.length,
    net_sales: net,
    tax_collected: salesTotals.tax,
    store_tax: byLevel("store"),
    product_tax: byLevel("product"),
    variant_tax: byLevel("variant"),
    category_tax: byLevel("category"),
    sales_with_tax: r2(net + salesTotals.tax),
  }

  return [
    rptReply("sales", salesValues),
    rptReply("profit", { net_sales: net, cost, tax: salesTotals.tax, gross_profit: r2(net - cost) }),
    rptReply("payments", paymentValues, { payments: paymentRows }),
    rptReply("batches", {}, { batches: [batchRow] }),
    rptReply("sessions", { sessions: sessionRows.length, on_duty_now: 1, hours_worked: sum(sessionRows, (row) => row.hours_worked) }, { sessions: sessionRows }),
    rptReply("top_products", {}, { products }),
    rptReply("top_categories", {}, { categories }),
    rptReply("inventory", {}, { inventory: inventoryRows }),
    rptReply("refunds_cancelled", refundValues, { orders: refundRows }),
    rptReply("cashiers", {}, { cashiers: cashierRows }),
    rptReply("offers", discountValues, { discounts: discountRows }),
    rptReply("tax", taxValues, { taxes: taxRows }),
  ]
}

export const DEMO_NEW_EPS = [
  // ---- Orders (dashboard)
  {
    id: "order-lists",
    noEnums: true,
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/lists",
    summary: "Orders List",
    description: "The Orders History table: the orders of GET /orders with only the columns it shows, newest first: { id (order number), placed_at, staff { id, name, role } (the cashier), total_items (the lines), total_amount, currency, order_status (completed | partial_refunded | refunded | pending | cancelled | voided), payment_status }. GET /orders/:id has the whole order. The same filters as GET /orders: status (all | completed | partial_refunded | pending | cancelled | refunded), staffId, batchId, is_custom, from / to (placed_at), range. A store admin sees every location, or the ones in locations (a list of location numbers: locations=1,2; location_id = one location still works); a manager / cashier only their own. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "status", default: "all", required: false, values: ["all", "completed", "partial_refunded", "pending", "cancelled", "refunded"] },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "location_id", default: "", required: false },
      { name: "locations", default: "", required: false },
    ],
    ownResponses: true,
    responses: [
      page(
        [O4, O3, O2, O1].map((order) => {
          const view = orderView(order, { afterRefunds: true })
          return { id: view.id, placed_at: view.placed_at, staff: view.staff, total_items: view.summary.total_items, total_amount: view.summary.total_amount, currency: view.summary.currency, order_status: view.order_status, payment_status: view.payment_status }
        })
      ),
    ],
  },
  // ---- Transactions (dashboard)
  {
    id: "transaction-lists",
    noEnums: true,
    tag: "orders",
    method: "GET",
    path: "/api/v1/transactions/lists",
    summary: "Transactions List",
    description: "The Transactions table: the transactions of GET /transactions with only the columns it shows, newest first: { id (transaction number), order { id, status }, paid_at, method, amount, currency, status }. GET /transactions/:id has the whole transaction. The same filters as GET /transactions: orderId, method, status, from / to. A store admin sees every location, or the ones in locations (a list of location numbers: locations=1,2; location_id = one location still works); a manager / cashier only their own. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "orderId", default: "", required: false },
      { name: "method", default: "", required: false, values: ["cash", "card", "jazzcash", "easypaisa", "bank_transfer", "raast", "other"] },
      { name: "status", default: "", required: false, values: ["initiated", "success", "failed"] },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "locations", default: "", required: false },
    ],
    ownResponses: true,
    responses: [page([...TXNS].reverse().map(({ id, order, paid_at, method, amount, currency, status }) => ({ id, order, paid_at, method, amount, currency, status })))],
  },
  {
    id: "transaction-get",
    noEnums: true,
    tag: "orders",
    method: "GET",
    path: "/api/v1/transactions/:id",
    summary: "Transaction Detail",
    description: "One transaction — :id is the transaction number (e.g. 1) or UUID — in the shape of GET /transactions: { id, reference, order { id, status }, location { id, name }, method, amount (surcharge included), surcharge_amount, currency, status, paid_at }. A manager / cashier only sees the transactions of their own location.",
    pathParams: [{ name: "id", default: "5", required: true }],
    ownResponses: true,
    responses: [ok(TXNS[4]), fail(404, "not found", "Transaction not found")],
  },
  // ---- Products (dashboard)
  {
    id: "prod-lists",
    noEnums: true,
    tag: "products",
    method: "GET",
    path: "/api/v1/products/lists",
    summary: "Products List",
    description: "The Products table: the products of GET /products with only the columns it shows: { id (product number), title, sku, barcode, category { id, name }, total_variants (0 for a product without variants), is_active, status (active | inactive) }. GET /products/:id has the whole product. The same filters as GET /products: q (title, SKU or barcode), categories (a list of category numbers), type (pack | loose | weight), locations (store admin). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "q", default: "", required: false },
      { name: "categories", default: "", required: false },
      { name: "type", default: "", required: false, values: ["pack", "loose", "weight"], multi: true },
      { name: "locations", default: "", required: false },
    ],
    ownResponses: true,
    responses: [page(PRODUCT_LIST_ROWS)],
  },
  {
    id: "prod-weighted",
    noEnums: true,
    tag: "products",
    method: "GET",
    path: "/api/v1/products/weighted",
    summary: "Weighted Products",
    description: "Every product (or variant) sold by weight, one row each: { id (product number), title, variant { id, name } | null, sku, category { id, name }, unit (kg, gram…), price (one unit's), cost_price (one unit's; null for a cashier), status }. A product with variants is not a row itself: its weight variants are. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
    ],
    ownResponses: true,
    responses: [page(WEIGHTED_ROWS)],
  },
  {
    id: "prod-create",
    tag: "products",
    method: "POST",
    path: "/api/v1/products",
    summary: "Add Product",
    description: "One product, in the same body as one item of POST /products/bulk (Bulk Products): title, sku, barcode, category_id, unit, taxes, discount, where it is sold and its variants (each with its prices, pack, discount, low stock level and opening stock), or — without variants — its own prices, pack and stock. The reply is the product as GET /products/:id gives it.",
    body: PROD_BULK_BODY.items[0],
    ownResponses: true,
    responses: [{ ...ok(productView(PEPSI_CREATED), "Products Created"), label: "201 Created", status: 201 }],
  },
  // ---- Categories (dashboard)
  {
    id: "cat-lists",
    noEnums: true,
    tag: "categories",
    method: "GET",
    path: "/api/v1/categories/lists",
    summary: "Categories List",
    description: "The Categories table: the categories of GET /categories with only the columns it shows: { id (category number), name, sold_at { scope (all | selected), locations [{ id, name }] (the locations it is sold at when selected) }, is_active, status }. GET /categories/:id has the category and its products. The same filters as GET /categories: q, isActive, locations (store admin). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "q", default: "", required: false },
      { name: "isActive", default: "", required: false, values: ["true", "false"] },
      { name: "locations", default: "", required: false },
    ],
    ownResponses: true,
    responses: [page(CATEGORY_LIST_ROWS)],
  },
  {
    id: "cat-get",
    noEnums: true,
    tag: "categories",
    method: "GET",
    path: "/api/v1/categories/:id",
    summary: "Category Detail",
    description: "One category — :id is the category number (e.g. 1) or UUID — as GET /categories gives it (name, tax, discount, location_scope, location_ids, is_active), with sold_at { scope, locations [{ id, name }] } and products: its products in the columns of GET /products/lists { id, title, sku, barcode, category, total_variants, is_active, status }. The products are paged: page and limit, with pagination next to data.",
    pathParams: [{ name: "id", default: "1", required: true }],
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
    ],
    ownResponses: true,
    responses: [
      {
        label: "200 OK",
        status: 200,
        body: {
          success: true,
          message: "OK",
          data: { ...categoryView(CATEGORY_ROWS[0]), sold_at: soldAt(CATEGORY_ROWS[0]), products: PRODUCT_LIST_ROWS.filter((row) => row.category?.id === 1) },
          pagination: { page: 1, limit: 20, total: PRODUCT_LIST_ROWS.filter((row) => row.category?.id === 1).length, total_pages: 1 },
        },
      },
      fail(404, "not found", "Category not found"),
    ],
  },
  {
    id: "cat-create",
    tag: "categories",
    method: "POST",
    path: "/api/v1/categories",
    summary: "Add Category",
    description: "One category, in the same body as one item of POST /categories/bulk (Bulk Categories): name, its tax (tax_name, tax_type, tax_value), its discount (discount_name, discount_type, discount_value) and where it is sold (location_scope all | selected, with location_ids). The reply is the category as GET /categories gives it.",
    body: CAT_BULK_BODY.items[0],
    ownResponses: true,
    responses: [{ ...ok(categoryView(CATEGORY_ROWS[0]), "Categories Created"), label: "201 Created", status: 201 }],
  },
  // ---- Locations & devices & store (dashboard)
  {
    id: "location-lists",
    noEnums: true,
    tag: "locations",
    method: "GET",
    path: "/api/v1/locations/lists",
    summary: "Locations List",
    description: "The Locations table: { id (location number), name, city, manager { id, name, email, phone } | null (a location may have no manager), is_active, status }. GET /locations/:id has the whole location and its staff. A manager only sees their own location. Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
    ],
    ownResponses: true,
    responses: [page(LOCATION_LIST_ROWS)],
  },
  {
    id: "location-get",
    noEnums: true,
    tag: "locations",
    method: "GET",
    path: "/api/v1/locations/:id",
    summary: "Location Detail",
    description: "One location — :id is the location number (e.g. 1) or UUID — with everything: { id, name, address, city, country, postal_code, phone, is_default, is_active, status, manager { id, name, email, phone, role, pin, is_active } | null, users [ the manager and the cashiers of the location, the PIN only for a store admin ], created_at, updated_at }. A manager only sees their own location.",
    pathParams: [{ name: "id", default: "1", required: true }],
    ownResponses: true,
    responses: [ok(locationDetail(1)), { ...ok(locationDetail(3)), label: "200 OK · no manager yet" }, fail(404, "not found", "Location not found")],
  },
  {
    id: "device-lists",
    noEnums: true,
    tag: "locations",
    method: "GET",
    path: "/api/v1/devices",
    summary: "Devices",
    description: "The tills (PCs) registered to the store: { id (device number), device_id (the PC's own hardware id), name, location { id, name }, platform, app_version, last_seen_at, is_active, status (active | inactive) }. Store admin / manager (a manager only sees their own location's). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
    ],
    ownResponses: true,
    responses: [page(DEVICE_ROWS)],
  },
  {
    id: "store-detail",
    noEnums: true,
    tag: "store",
    method: "GET",
    path: "/api/v1/stores/detail",
    summary: "Store Information",
    description: "Everything about the store (store admin only; 403 for anyone else): { id (store number), name, legal_name, owner_name, business_type, address, city, contact_email, contact_phone, logo_url, currency, timezone, ntn, strn, fbr_invoice_enabled, expiry_warning_days, expiry_critical_days, receipt_footer, default_location { id, name }, plan { name, code, reporting_level, max_devices, max_locations }, account_manager { name, phone } | null, counts { locations, devices, staff }, status, is_active, trial_ends_at, created_at }.",
    ownResponses: true,
    responses: [
      ok({
        id: 1, name: "Acadex", legal_name: "Acadex Traders (Pvt) Ltd", owner_name: "Zayan Ahmed", business_type: "grocery",
        address: "Shop # 432 Allama rasheed main rashid Minhas road Gulshan e Iqbal Block 13 D Karachi", city: "Karachi",
        contact_email: "info@acadex.co", contact_phone: "03162196345", logo_url: null, currency: "PKR", timezone: "Asia/Karachi",
        ntn: STORE.ntn, strn: STORE.strn, fbr_invoice_enabled: false, expiry_warning_days: 30, expiry_critical_days: 7, receipt_footer: "Thank you for shopping at Acadex",
        default_location: L1, plan: { name: "Advanced", code: "advanced", reporting_level: "advanced", max_devices: 5, max_locations: 3 },
        account_manager: null, counts: { locations: 3, devices: 3, staff: 4 }, status: "active", is_active: true, trial_ends_at: null, created_at: "2026-10-31T09:27:34.000Z",
      }),
      fail(403, "not the store admin", "Only the store admin can see the store information"),
    ],
  },
  {
    id: "customer-list",
    noEnums: true,
    tag: "customers",
    method: "GET",
    path: "/api/v1/customers",
    summary: "Customers",
    description:
      "The store's customers and their udhaar (credit), oldest first: { id (customer number — the customer_id an order sends), name, phone, email, location_id (location number; null = every location), total_debt (all the udhaar ever given), remaining_debt (what the customer still owes), debt_notes, is_active }. Ids in the reply are the short numbers the POS uses. Filters: from / to (created date, YYYY-MM-DD — to covers the whole day), q (matches the name, phone or email). Paged: page (from 1) and limit (1–200, default 20); the reply carries pagination { page, limit, total, total_pages } next to data.",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "q", default: "", required: false },
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
      "ONE endpoint for every report. :section picks the report, the query string filters it. The twelve reports: sales (Sales Summary) and profit (Profit & Margin) are single values only (summary, no lists); payments, batches (Z-Reports: Batches History), sessions (Sessions History), top_products (By Products), top_categories (By Categories), inventory, refunds_cancelled, cashiers (By Cashiers, highest sales first), offers (Discount Performance) and tax (Tax Breakdown) carry ONE list each, with their totals as single values in summary (the KPIs). Every id is a number (product / variant / category / batch / session / staff / tax / surcharge), never a UUID. Payment surcharges are never counted as tax: sales gives tax and payments_tax apart, payments gives each method's tax and surcharge apart. locations takes one or several location numbers (1,2) or all. Open View Section Names for the sections, View Section Filters for every filter of a section, and View Query Parameters: it lists the filters of the section in :section by itself, so nothing has to be typed from memory. Every reply is { section, label, level, reporting_level, location, from, to, summary, tables } — summary = the single figures, tables = { <list name>: { rows, pagination } }; each list is paged (table = the list page / limit / search are for; limit=all for an export). Store admin / manager (a manager: their own location only). A section needs its store plan (level in View Section Names): a lower plan gets 403 plan_locked. A filter the section does not know is ignored; a value that does not fit (an unknown choice, a bad number) is a 400. The reply echoes the filters it applied in filters.",
    pathParams: [{ name: "section", default: "sales", required: true }],
    query: queryRowsFor("sales"),
    sections: REPORT_SECTIONS,
    ownResponses: true,
    responses: [
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
export const DEMO_REMOVED_IDS = ["order-refund-complete-bulk", "batch-current", "tax-get", "surcharge-get", "discount-bulk", "bulk-discount-bulk", "bundle-discount-bulk", "plans-create", "admin-create-store", "admin-register-superadmin", "plans-list", "order-list-completed", "order-list-pending", "order-list-cancelled", "order-receipt", "refund-receipt", "prod-weight-list", "prod-expiry", "prod-image-get", "customer-create", "rep-all-locations", "rep-location", "rep-profit"]

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
  low_stock_threshold: note("The low stock level of a product without variants (default 1), counted in low_stock_unit. With variants it is 0 (default): send the level inside each variant (variants[].low_stock_threshold)"),
  low_stock_unit: note("pack | unit (default unit): what low_stock_threshold counts. Only a pack + loose product has the choice (a pack-only product is always pack, a loose or weight based one always unit). With variants send it inside each variant"),
  is_weight_based: note("true = sold by weight (kg / gram)"),
  image: note("An image URL; empty = none (upload with Product Image Upload)"),
  location_scope: note("all (default) | selected + location_ids — where it is sold"),
  stock_scope: note("all (default) | selected + stock_location_ids — where its stock is held"),
  cost: note("No variants: cost of one unit. A pack that is also sold loose (sell_loose) sends its own unit cost: it is not pack_cost ÷ pack_size"),
  price: note("No variants: selling price of one unit. A pack that is also sold loose sends its own unit price (80 a unit in a pack of 10 at 500 is fine)"),
  sell_loose: note("Sold by the single unit too: a pack product then needs cost and price as well"),
  discount: note("The product level discount as one object { name, type, value }. Leave out = none. With variants it is the discount of every variant that has none of its own (and has not said uses_product_discount false)"),
  "discount.name": note("Its name, e.g. Eid Shopping"),
  "discount.type": must("percentage | fixed (in any case, e.g. Percentage)"),
  "discount.value": must("The % or the Rs off one unit"),
  "discount.applies_to": note("all | pack | loose | weight (default all): what the discount is taken off. pack needs a pack product, weight a weight based product"),
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
  "variants[].low_stock_threshold": note("This variant's low stock level, counted in its low_stock_unit. Default 1"),
  "variants[].low_stock_unit": note("pack | unit (default unit): what this variant's low stock level counts. Only a pack + loose variant has the choice (a pack-only variant is always pack, any other unit)"),
  "variants[].colors": note("The colours this variant comes in, as hex codes [\"#F59E0B\"]. [] = none"),
  "variants[].discount": note("This variant's own discount as one object { name, type, value }; it replaces the product's discount for this variant (they do not add up). Leave out = it takes the product's discount. PATCH: null removes it"),
  "variants[].discount.name": note("Its name, e.g. Eid Shopping"),
  "variants[].discount.type": must("percentage | fixed (in any case, e.g. Percentage)"),
  "variants[].discount.value": must("The % or the Rs off one unit"),
  "variants[].discount.applies_to": note("all | pack | loose | weight (default all): what the discount is taken off. pack needs a pack variant, weight a weight based one"),
  "variants[].uses_product_discount": note("true (default) = without a discount of its own this variant takes the product's discount; false = it takes no discount (the product has one, this variant is left out)"),
  "variants[].taxes": note("This variant's own taxes [{ name, type: percentage | fixed, value }], added to the product's. [] = none"),
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
  "prod-create": PRODUCT_FIELDS,
}
