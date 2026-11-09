// GET /api/v1/products/stock: the stock of every product / variant at every location, lots inside.
const PEPSI = { id: 1, title: "Pepsi", unit: "bottle", sku: "PEPSI", barcode: "8961014100004" }

const SUPPLIER = { id: 1, name: "Pepsi Distributor" }

const ROWS = [
  {
    product: { ...PEPSI, variant: { id: 4, name: "1.5L", sku: "SKU-1.5L", barcode: "2738550255592" } },
    location: { id: 1, name: "Gulistan e Johar" },
    qty: 28,
    qty_packs: 5,
    low_stock_threshold: 10,
    stock_status: "ok",
    nearest_expiry_date: "2026-11-14",
    lots: [
      { id: 1, received_at: "2026-11-06T12:48:16.000Z", supplier: SUPPLIER, qty: 18, expiry_date: "2026-11-14", days_to_expiry: 5, expiry_status: "critical" },
      { id: 2, received_at: "2026-11-08T12:48:16.000Z", supplier: null, qty: 10, expiry_date: "2027-01-31", days_to_expiry: 83, expiry_status: "ok" },
    ],
  },
  {
    product: { ...PEPSI, variant: { id: 5, name: "2L", sku: "SKU-2L", barcode: "2752313531860" } },
    location: { id: 2, name: "Defense View" },
    qty: 4,
    qty_packs: 0,
    low_stock_threshold: 10,
    stock_status: "critical",
    nearest_expiry_date: "2027-01-08",
    lots: [{ id: 2, received_at: "2026-11-08T13:58:13.000Z", supplier: SUPPLIER, qty: 4, expiry_date: "2027-01-08", days_to_expiry: 60, expiry_status: "ok" }],
  },
  {
    product: { id: 4, title: "Sugar", unit: "kg", sku: "SUGAR", barcode: "8961030000001", variant: null },
    location: { id: 1, name: "Gulistan e Johar" },
    qty: 150,
    qty_packs: null,
    low_stock_threshold: 20,
    stock_status: "ok",
    nearest_expiry_date: null,
    lots: [{ id: 1, received_at: "2026-11-01T09:00:00.000Z", supplier: null, qty: 150, expiry_date: null, days_to_expiry: null, expiry_status: "none" }],
  },
  {
    product: { ...PEPSI, variant: { id: 6, name: "Jumbo", sku: "SKU-JUMBO", barcode: "2100519964386" } },
    location: { id: 2, name: "Defense View" },
    qty: 0,
    qty_packs: 0,
    low_stock_threshold: 10,
    stock_status: "out",
    nearest_expiry_date: null,
    lots: [],
  },
]

export const STOCK_EPS = [
  {
    id: "prod-stock",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/stock",
    summary: "Product Stock",
    description:
      "The stock of every product at every location, lots (and their expiry) inside. One row = a product, or a variant, at one location: { product { id (product number), title, unit, sku, barcode (the product's own), variant { id, name, sku, barcode } | null }, location { id, name }, qty, qty_packs (pack products only, else null), low_stock_threshold, stock_status, nearest_expiry_date, lots [{ id, received_at, supplier { id, name } | null, qty, expiry_date, days_to_expiry, expiry_status }] }. qty is the total of its lots. A lot is stock that came in together, with one expiry date and one supplier: stock from another supplier (or from none) is another lot, even with the same expiry date. supplier is { id (supplier number), name } of the stock-in that filled it, or null (opening stock, an adjustment, a transfer of stock that had none). A transfer keeps the supplier of the lots it moves. Lot id counts per product / variant (1, 2, 3…), so it names a lot only together with the product and variant. lots are listed soonest expiry first (no expiry date last), and a lot with nothing left is not listed. " +
      "stock_status: out (qty 0) | critical (half of low_stock_threshold or less) | warning (up to low_stock_threshold) | ok. expiry_status of a lot (fixed days): expired (past) | critical (0–7 days left) | warning (8–30 days) | ok (over 30) | none (no expiry date). days_to_expiry is negative once a lot is past its date. " +
      "Rows are ordered by their soonest expiry (rows without one after), then product, variant, location. Paged by rows: page (from 1) and limit (1–200, default 20), with pagination { page, limit, total, total_pages } — a product's lots are never split over two pages. A store admin sees every location (or one with location_id = the location number or UUID); a manager / cashier only their own. " +
      "Filters: q (title, SKU or barcode of the product or variant), category_id (number), stock_status, expiry_status (rows with any lot of that status — all its lots are still listed). A product that has never been stocked at a location has no row there; one stocked at 0 has a row with qty 0 and lots [].",
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "location_id", default: "", required: false },
      { name: "category_id", default: "", required: false },
      { name: "q", default: "", required: false },
      { name: "stock_status", default: "", required: false },
      { name: "expiry_status", default: "", required: false },
    ],
    enums: {
      stock_status: ["ok", "warning", "critical", "out"],
      expiry_status: ["ok", "warning", "critical", "expired", "none"],
    },
    ownResponses: true,
    responses: [
      { label: "200 OK", status: 200, body: { success: true, message: "OK", data: ROWS, pagination: { page: 1, limit: 20, total: ROWS.length, total_pages: 1 } } },
      { label: "400 — a filter", status: 400, body: { success: false, message: "stock_status must be ok, warning, critical, out" } },
    ],
  },
]
