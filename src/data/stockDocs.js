// GET /api/v1/products/stock: the stock of every product at every location, lots inside. One entry = a product
// at a location, shown once: its variants inside, each with its stock (a product without variants carries it itself).
const PEPSI = { id: 1, title: "Pepsi", unit: "bottle", sku: "PEPSI", barcode: "8961014100004" }

const SUPPLIER = { id: 1, name: "Pepsi Distributor" }

const ROWS = [
  {
    product: {
      ...PEPSI,
      stock: null,
      variants: [
        {
          id: 4, name: "1.5L", sku: "SKU-1.5L", barcode: "2738550255592",
          stock: {
            qty: 28,
            qty_packs: 5,
            pack_size: 5,
            low_stock_threshold: 10,
            low_stock_unit: "unit",
            stock_status: "ok",
            nearest_expiry_date: "2026-11-14",
            lots: [
              { id: 1, received_at: "2026-11-06T12:48:16.000Z", supplier: SUPPLIER, qty: 18, expiry_date: "2026-11-14", days_to_expiry: 5, expiry_status: "critical" },
              { id: 2, received_at: "2026-11-08T12:48:16.000Z", supplier: null, qty: 10, expiry_date: "2027-01-31", days_to_expiry: 83, expiry_status: "ok" },
            ],
          },
        },
      ],
    },
    location: { id: 1, name: "Gulistan e Johar" },
  },
  {
    product: {
      ...PEPSI,
      stock: null,
      variants: [
        {
          id: 5, name: "2L", sku: "SKU-2L", barcode: "2752313531860",
          stock: {
            qty: 4,
            qty_packs: 0,
            pack_size: 5,
            low_stock_threshold: 10,
            low_stock_unit: "unit",
            stock_status: "critical",
            nearest_expiry_date: "2027-01-08",
            lots: [{ id: 2, received_at: "2026-11-08T13:58:13.000Z", supplier: SUPPLIER, qty: 4, expiry_date: "2027-01-08", days_to_expiry: 60, expiry_status: "ok" }],
          },
        },
        {
          id: 6, name: "Jumbo", sku: "SKU-JUMBO", barcode: "2100519964386",
          stock: {
            qty: 0,
            qty_packs: 0,
            pack_size: 5,
            low_stock_threshold: 10,
            low_stock_unit: "unit",
            stock_status: "out",
            nearest_expiry_date: null,
            lots: [],
          },
        },
      ],
    },
    location: { id: 2, name: "Defense View" },
  },
  {
    // A product without variants carries its stock itself: variants is [].
    product: {
      id: 4, title: "Sugar", unit: "kg", sku: "SUGAR", barcode: "8961030000001",
      stock: {
        qty: 150,
        qty_packs: null,
        pack_size: null,
        low_stock_threshold: 20,
        low_stock_unit: "unit",
        stock_status: "ok",
        nearest_expiry_date: null,
        lots: [{ id: 1, received_at: "2026-11-01T09:00:00.000Z", supplier: null, qty: 150, expiry_date: null, days_to_expiry: null, expiry_status: "none" }],
      },
      variants: [],
    },
    location: { id: 1, name: "Gulistan e Johar" },
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
      "The stock of every product at every location, lots (and their expiry) inside. One entry = a product at one location, shown once — the product's details are not repeated per variant: { product { id (product number), title, unit, sku, barcode (the product's own), stock | null, variants [{ id (variant number), name, sku, barcode, stock }] }, location { id, name } }. A product with variants has stock null and every variant (stocked at that location) in variants[], each with its own stock; a product without variants has variants [] and its stock in product.stock. stock { qty, qty_packs (pack products only, else null), pack_size (pack products only, else null), low_stock_threshold, low_stock_unit, stock_status, nearest_expiry_date, lots [{ id, received_at, supplier { id, name } | null, qty, expiry_date, days_to_expiry, expiry_status }] }. qty is the total of its lots. A lot is stock that came in together, with one expiry date and one supplier: stock from another supplier (or from none) is another lot, even with the same expiry date. supplier is { id (supplier number), name } of the stock-in that filled it, or null (opening stock, an adjustment, a transfer of stock that had none). A transfer keeps the supplier of the lots it moves. Lot id counts per product / variant (1, 2, 3…), so it names a lot only together with the product and variant. lots are listed soonest expiry first (no expiry date last), and a lot with nothing left is not listed. " +
      "low_stock_threshold is counted in low_stock_unit: pack for a pack-only product (a pack product not sold loose), unit for a loose or weight based product (piece / gram / kg), and for a pack + loose product the choice saved on it (low_stock_unit on the product / variant, default unit). With pack, qty_packs is compared with the threshold, with unit qty is. Each variant has its own threshold and unit. stock_status: out (qty 0) | critical (half of low_stock_threshold or less) | warning (up to low_stock_threshold) | ok. expiry_status of a lot (fixed days): expired (past) | critical (0–7 days left) | warning (8–30 days) | ok (over 30) | none (no expiry date). days_to_expiry is negative once a lot is past its date. " +
      "Entries are ordered by the soonest expiry of any of their stock (entries without one after), then product, location. Paged by entries (a product at a location): page (from 1) and limit (1–200, default 20), with pagination { page, limit, total, total_pages } — a product's variants and lots are never split over two pages. A store admin sees every location (or one with location_id = the location number or UUID); a manager / cashier only their own. " +
      "Filters: q (title, SKU or barcode of the product or variant), category_id (number), stock_status, expiry_status (a product shows when any of its variants matches; all its variants and lots are still listed). A product that has never been stocked at a location has no entry there; one stocked at 0 has stock with qty 0 and lots [].",
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
