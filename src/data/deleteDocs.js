/*
 * The DELETE group: one bulk delete per thing the dashboard deletes, in the bulk form of POST / PATCH /bulk —
 * { storeId, items: [{ id }, ...] }. Each item runs that resource's own delete (the dashboard's), so the
 * rules and the kind of delete stay the same; each is saved on its own: a failure is listed in failed[]
 * ({ index, message, status }) and the rest still delete; when every item fails the reply is that first error.
 */

const BULK_DELETE_NOTE =
  "Bulk form (as POST / PATCH …/bulk): { storeId, items: [{ id }, …] } — always an array, even for one (the POS sends its queued deletes together; the dashboard's Delete sends one). Each item is that resource's own delete, saved on its own: one that fails (not found, not allowed, in use) is listed in failed[] ({ index, message, status }) and the others still delete; when every item fails the reply is the first error. Reply: { success, message, data: [one per deleted item], failed? }."

const ok = (message, data) => ({ label: "200 OK", status: 200, body: { success: true, message, data } })
const partly = (message, data, failed) => ({ label: "200 OK — one failed", status: 200, body: { success: true, message, data, failed } })
const fail = (status, message) => ({ label: `${status} — every item failed`, status, body: { success: false, message, data: [], failed: [{ index: 0, message, status }] } })

const body = (ids) => ({ storeId: 1, items: ids.map((id) => ({ id })) })

export const DELETE_EPS = [
  {
    id: "products-bulk-delete",
    tag: "products",
    method: "DELETE",
    path: "/api/v1/products/bulk",
    summary: "Bulk Delete Products",
    description: `${BULK_DELETE_NOTE} Products → Delete: the product is switched off — not active, off the POS and the website — and so are its variants; its row stays, so past orders, stock history and reports still show it (it can be switched on again with Bulk Update Products, isActive: true). id = the product number (e.g. 3) or UUID. Store admin / manager. Each data row: the product as it now is.`,
    body: body([3, 7]),
    responses: [
      ok("Products Deleted", [{ product_number: 3, title: "Sugar 1kg", sku: "SUGAR-1KG", is_active: false, is_pos_visible: false, is_published: false }]),
      fail(404, "Product not found"),
    ],
  },
  {
    id: "categories-bulk-delete",
    tag: "categories",
    method: "DELETE",
    path: "/api/v1/categories/bulk",
    summary: "Bulk Delete Categories",
    description: `${BULK_DELETE_NOTE} Categories → Delete: the category is removed for good. Only a category no product uses: one with products is 409 ("Cannot delete category while products still reference it") — move or delete its products first. id = the category number (e.g. 4) or UUID. Store admin / manager. Each data row: null.`,
    body: body([4]),
    responses: [ok("Categories Deleted", [null]), fail(409, "Cannot delete category while products still reference it")],
  },
  {
    id: "suppliers-bulk-delete",
    tag: "suppliers",
    method: "DELETE",
    path: "/api/v1/suppliers/bulk",
    summary: "Bulk Delete Suppliers",
    description: `${BULK_DELETE_NOTE} Suppliers → Delete. Soft delete: the supplier leaves the supplier lists and pickers (is_active false, deleted_at set); its row stays, so stock lots and movements that name it still show it. id = the supplier number (e.g. 2) or UUID. Store admin / manager. Each data row: the supplier with deleted_at.`,
    body: body([2]),
    responses: [ok("Suppliers Deleted", [{ supplier_number: 2, name: "Mustafa Traders", phone: "03006666667", is_active: false, deleted_at: "2026-11-21T10:00:00.000Z" }]), fail(404, "Supplier not found")],
  },
  {
    id: "locations-bulk-delete",
    tag: "locations",
    method: "DELETE",
    path: "/api/v1/locations/bulk",
    summary: "Bulk Delete Locations",
    description: `${BULK_DELETE_NOTE} Locations → Delete. Soft delete of a branch: it leaves the location lists and pickers (is_active false, deleted_at set); its row stays, so orders, stock and staff history still name it. Not the default location, nor one still holding stock or with transfers on the way. id = the location number (e.g. 3) or UUID. Store admin. Each data row: the location with deleted_at.`,
    body: body([3]),
    responses: [ok("Locations Deleted", [{ id: 3, name: "Defense View", city: "Karachi", is_default: false, is_active: false, deleted_at: "2026-11-21T10:00:00.000Z" }]), fail(404, "Location 9 not found")],
  },
  {
    id: "staff-bulk-delete",
    tag: "staff",
    method: "DELETE",
    path: "/api/v1/staff/bulk",
    summary: "Bulk Delete Staff",
    description: `${BULK_DELETE_NOTE} Staff → Delete. Soft delete: the staff member leaves the staff list and can no longer sign in (401 Invalid credentials) or use their PIN; their tokens stop working and an open clock-in is closed. The row stays, so their sales, batches and history still show their name (GET /staff?include_deleted=1 lists them with deleted: true). id = the staff number (e.g. 7) or UUID. The store admin and your own account cannot be deleted; a manager cannot delete another manager. Each data row: { id (staff number), deleted: true }.`,
    body: body([7, 8]),
    responses: [partly("Staff Deleted", [{ id: 7, deleted: true }], [{ index: 1, message: "Staff not found", status: 404 }]), fail(404, "Staff not found")],
  },
  {
    id: "staff-sessions-bulk-delete",
    tag: "shifts",
    method: "DELETE",
    path: "/api/v1/staff-sessions/bulk",
    summary: "Bulk Delete Staff Sessions",
    description: `${BULK_DELETE_NOTE} Staff Sessions → Delete. Soft delete: the attendance session leaves the session history and the reports; its row stays in the database. id = the session number (e.g. 1) or UUID. Store admin / manager (a manager only at their own location). Each data row: { id, deleted: true }.`,
    body: body([1, 2]),
    responses: [ok("Staff Sessions Deleted", [{ id: 1, deleted: true }, { id: 2, deleted: true }]), fail(404, "Staff session not found")],
  },
  {
    id: "batches-bulk-delete",
    tag: "shifts",
    method: "DELETE",
    path: "/api/v1/batches/bulk",
    summary: "Bulk Delete Batches",
    description: `${BULK_DELETE_NOTE} Batch History → Delete. Soft delete: the batch leaves Batch History and the reports (Z-reports); its row stays in the database and its orders keep their sales. id = the batch number (e.g. 1) or UUID. Store admin / manager (a manager only at their own location). Each data row: { id, deleted: true }.`,
    body: body([1]),
    responses: [ok("Batches Deleted", [{ id: 1, deleted: true }]), fail(404, "Register session not found")],
  },
  {
    id: "stock-movements-bulk-delete",
    tag: "inventory",
    method: "DELETE",
    path: "/api/v1/stock-movements/bulk",
    summary: "Bulk Delete Stock Movements",
    description: `${BULK_DELETE_NOTE} Stock Movements → Delete. Soft delete of a wrong movement: its qty is taken back off the stock (a +5 stock in takes 5 away, a −5 stock out puts 5 back), the stock after of every later movement there moves the same way, and the movement leaves every list, report and total; its row stays. id = the movement number (e.g. 12). 400 when the stock would go below 0; 409 for a sale, refund or transfer movement. Store admin / manager (a manager only at their own location). Each data row: { movement (with deleted_at), stock (now) }.`,
    body: body([12]),
    responses: [
      ok("Stock Movements Deleted", [
        {
          movement: { id: 12, location: { id: 1, name: "Gulistan e Johar" }, product: { id: 2, title: "Sugar 1kg", sku: "SUGAR-1KG", unit: "piece", variant: null }, movement_type: "stock_in", reason: "purchase", qty: 5, deleted_at: "2026-11-21T10:00:00.000Z" },
          stock: { location: { id: 1, name: "Gulistan e Johar" }, product: { id: 2, title: "Sugar 1kg" }, qty: 95 },
        },
      ]),
      fail(400, "Stock cannot go below 0: after this movement it dropped to 39, and this change takes away 40 more"),
    ],
  },
  {
    id: "stock-transfers-bulk-delete",
    tag: "inventory",
    method: "DELETE",
    path: "/api/v1/stock-transfers/bulk",
    summary: "Bulk Delete Stock Transfers",
    description: `${BULK_DELETE_NOTE} Stock Transfers → Delete. Soft delete: the transfer leaves the transfer list, the reports and the POS sync; its rows stay. Only a transfer nothing of which has been received (on the way or cancelled) — no stock has moved for it, so stock stays as it is; a received one is 409. id = the transfer number (e.g. 1). Store admin. Each data row: the transfer as it was (the create shape) with deleted_at.`,
    body: body([1]),
    responses: [
      ok("Stock Transfers Deleted", [{ id: 1, from_location: { id: 1, name: "Gulistan e Johar" }, status: "on_the_way", destinations: [{ to_location: { id: 4, name: "Defense View" }, status: "on_the_way", products: [{ product: { id: 2, title: "Sugar 1kg" }, qty: 10, received_qty: null }] }], deleted_at: "2026-11-21T10:00:00.000Z" }]),
      fail(404, "Stock transfer not found"),
    ],
  },
  {
    id: "taxes-bulk-delete",
    tag: "taxes",
    method: "DELETE",
    path: "/api/v1/taxes/bulk",
    summary: "Bulk Delete Taxes",
    description: `${BULK_DELETE_NOTE} Taxes → Delete: the store tax is removed for good and stops being charged on new sales (orders already placed keep the tax they were charged). id = the tax number (e.g. 2). Store admin. Each data row: { id, deleted: true }.`,
    body: body([2]),
    responses: [ok("Taxes Deleted", [{ id: 2, deleted: true }]), fail(404, "Tax not found")],
  },
  {
    id: "surcharges-bulk-delete",
    tag: "surcharges",
    method: "DELETE",
    path: "/api/v1/payment-surcharges/bulk",
    summary: "Bulk Delete Payment Method Surcharges",
    description: `${BULK_DELETE_NOTE} Payment Methods → Delete: the payment method's surcharge is removed for good; new payments with that method carry no surcharge (past payments keep theirs). id = the surcharge number (e.g. 3). Store admin. Each data row: { id, deleted: true }.`,
    body: body([3]),
    responses: [ok("Payment Surcharges Deleted", [{ id: 3, deleted: true }]), fail(404, "Surcharge not found")],
  },
  {
    id: "discounts-bulk-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/discounts/bulk",
    summary: "Bulk Delete Discounts",
    description: `${BULK_DELETE_NOTE} Discounts → Order discounts → Delete. Soft delete: the discount leaves the Discounts page and the till's list (GET /discounts); orders that used it keep it. id = the discount number (e.g. 2). Store admin / manager. Each data row: the discount with deleted_at.`,
    body: body([2]),
    responses: [ok("Discounts Deleted", [{ id: 2, name: "Azaadi Sale", discount_type: "percentage", discount_value: 10, is_active: true, status: "active", deleted_at: "2026-11-21T10:00:00.000Z" }]), fail(404, "Discount 9 not found")],
  },
  {
    id: "bulk-discounts-bulk-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/bulk-discounts/bulk",
    summary: "Bulk Delete Bulk Discounts",
    description: `${BULK_DELETE_NOTE} Discounts → Bulk discounts → Delete. Soft delete: the bulk discount (buy more, pay less) leaves the Discounts page and stops applying at the till; orders that used it keep it. id = the bulk discount number (e.g. 1). Store admin / manager. Each data row: the bulk discount with deleted_at.`,
    body: body([1]),
    responses: [
      ok("Bulk Discounts Deleted", [{ id: 1, name: "PEPSI Bulk Discount", product: { id: 1, title: "Pack Of Pepsi", sku: "1-LITRE-PEPSI", unit: "bottle", variant: { id: 1, name: "500ML Pepsi" } }, sale_unit: "unit", tiers: [{ min_qty: 5, discount_type: "percentage", discount_value: 5 }], is_active: true, deleted_at: "2026-11-21T10:00:00.000Z" }]),
      fail(404, "Bulk discount 9 not found"),
    ],
  },
  {
    id: "bundle-discounts-bulk-delete",
    tag: "discounts",
    method: "DELETE",
    path: "/api/v1/bundle-discounts/bulk",
    summary: "Bulk Delete Bundle Discounts",
    description: `${BULK_DELETE_NOTE} Discounts → Bundle discounts → Delete. Soft delete: the bundle (buy together, get a reward) leaves the Discounts page and stops applying at the till; orders that used it keep it. id = the bundle number (e.g. 1). Store admin / manager. Each data row: the bundle with deleted_at.`,
    body: body([1]),
    responses: [
      ok("Bundle Discounts Deleted", [{ id: 1, name: "Buy 2 Litre Pepsi Get 1 500ml Free", products: [{ id: 1, title: "Pack Of Pepsi", variant: { id: 3, name: "1L" }, qty: 2, sale_unit: "unit" }], reward: { type: "free_item", items: [{ product: { id: 1, title: "Pack Of Pepsi", variant: { id: 1, name: "500ML Pepsi" } }, qty: 1 }] }, is_active: true, deleted_at: "2026-11-21T10:00:00.000Z" }]),
      fail(404, "Bundle discount 9 not found"),
    ],
  },
]

// The DELETE group: these sections in this order; the store data wipe (Super Admin) stays under "Other".
export const DELETE_SECTIONS = [
  { id: "delete-products", name: "Products", tag: "products", ids: ["products-bulk-delete"] },
  { id: "delete-categories", name: "Categories", tag: "categories", ids: ["categories-bulk-delete"] },
  { id: "delete-stock", name: "Stock Inventory", tag: "inventory", ids: ["stock-movements-bulk-delete", "stock-transfers-bulk-delete"] },
  { id: "delete-suppliers", name: "Suppliers", tag: "suppliers", ids: ["suppliers-bulk-delete"] },
  { id: "delete-locations", name: "Locations", tag: "locations", ids: ["locations-bulk-delete"] },
  { id: "delete-staff", name: "Staff", tag: "staff", ids: ["staff-bulk-delete"] },
  { id: "delete-staff-sessions", name: "User Sessions", tag: "shifts", ids: ["staff-sessions-bulk-delete"] },
  { id: "delete-batches", name: "Batches", tag: "shifts", ids: ["batches-bulk-delete"] },
  { id: "delete-taxes", name: "Taxes", tag: "taxes", ids: ["taxes-bulk-delete"] },
  { id: "delete-surcharges", name: "Payment Method Surcharges", tag: "surcharges", ids: ["surcharges-bulk-delete"] },
  { id: "delete-discounts", name: "Discounts", tag: "discounts", ids: ["discounts-bulk-delete", "bulk-discounts-bulk-delete", "bundle-discounts-bulk-delete"] },
]

// The one DELETE kept from before: the Super Admin's wipe of one store's data.
export const KEPT_DELETE_IDS = ["store-data-clear"]
