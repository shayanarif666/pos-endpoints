// Every PATCH /bulk takes the body of its POST: the same top keys (storeId, and locationId / staffId
// where the POST has them) and items[] with the same field names, plus each row's id. Only the
// fields sent change. The bodies and descriptions here replace the older ones in endpoints.js / demo.js.

const ROWS =
  "id = the row's number (1, 2, 3…; its UUID also works). Only the fields sent change. Each row saves on its own: a row that fails is listed in failed[] ({ index, message, status }) and the rest still save; when every row fails the reply is that first error. Reply data: the updated rows."
const same = (post, keys = "storeId") => `The body of ${post}, plus each row's id: { ${keys}, items: [{ id, …the same fields as the POST }] }. ${ROWS}`

/** The sub-routes folded into their main PATCH /bulk (the fields go in its items): no longer documented. */
export const PATCH_REMOVED_IDS = [
  "prod-bulk-weight-patch",
  "prod-bulk-status-patch",
  "prod-bulk-visibility-patch",
  "cat-bulk-status-patch",
  "cat-locations-patch",
  "tax-bulk-status-patch",
  "surcharge-bulk-status-patch",
]

export const PATCH_DOCS = {
  "prod-bulk-patch": {
    description: `${same("Bulk Product Creation (POST /products/bulk)")} Any product field: title, sku, barcode, category_id (category number), unit, cost / price, pack_cost / pack_price, discount { name, type, value }, taxes, sell_loose, low_stock_threshold / low_stock_unit, is_weight_based (sold by kg / g), isActive (false = off sale: the record and its history stay; a product with variants: its variants follow), is_pos_visible / is_web_visible, location_scope / location_ids and stock_scope / stock_location_ids (location numbers, store admin only). variants: [{ id (the variant number inside the product), …its fields }] changes that variant; a variant without id is a new one. stock: [{ location_id, qty }] is the counted total per location (the difference is saved as a count movement). The dashboard's Edit Product and its Active / Disabled switch send this.`,
    body: {
      storeId: 1,
      items: [
        { id: 1, variants: [{ id: 4, pack_price: 1150, pack_cost: 560 }] },
        { id: 4, price: 165, low_stock_threshold: 25, is_weight_based: true },
        { id: 2, isActive: false },
      ],
    },
  },
  "cat-bulk-patch": {
    description: `${same("Bulk Category Creation (POST /categories/bulk)")} Any category field: name, tax_name / tax_type / tax_value, discount_name / discount_type / discount_value, location_scope (all | selected) with location_ids (location numbers; selected replaces the current locations), isActive.`,
    body: {
      storeId: 1,
      items: [
        { id: 4, name: "Personal Care & Beauty", tax_name: "GST", tax_type: "percentage", tax_value: 5, location_scope: "selected", location_ids: [1, 2] },
        { id: 3, discount_name: "Ramzan Sale", discount_type: "percentage", discount_value: 15 },
        { id: 2, isActive: false },
      ],
    },
  },
  "movement-patch": {
    description: `${same("Bulk Stock Movements (POST /stock-movements/bulk)", "storeId, staffId")} One row per movement to fix: movement_type (stock_in | stock_out | adjustment), reason (stock_in: purchase, customer_return, other · stock_out: damage, expiry, waste, theft, return_to_supplier, other · adjustment: count, other), reason_note, and stock: [{ qty }] — the amount moved, as on create (a product with variants may send variants: [{ id, stock: [{ qty }] }]). The movement's product, variant and location stay; the difference (new qty − old qty) goes on that stock at once, and the stock after of every later movement there moves by the same amount.`,
    body: {
      storeId: 1,
      staffId: 1,
      items: [
        { id: 21, reason_note: "Bill #4521 was 12 packs, not 10", stock: [{ qty: 60 }] },
        { id: 22, movement_type: "stock_out", reason: "damage", reason_note: "2 jars cracked, not 1", stock: [{ qty: 2 }] },
      ],
    },
  },
  "stock-entry-patch": {
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 1,
      items: [
        { product_id: 1, variant_id: 4, location_id: 1, lot_id: 1, number_of_packs: 3, loose_units: 2, reason: "count", reason_note: "Shelf count" },
        { product_id: 4, location_id: 1, lot_id: 2, expiry_date: "2027-05-31", low_stock_threshold: 25 },
      ],
    },
  },
  "transfer-bulk-patch": {
    description: `${same("Bulk Stock Transfer (POST /stock-transfers/bulk)", "storeId, staffId")} from_location_id, note, destinations: [{ to_location_id, products: [{ product_id, variant_id, qty }] }] — destinations replace every product of the transfer (send the whole list, as on create); left out, the products stay. The source must hold, per product, the qty of every destination together. Only a transfer nothing of which has been received can change (else 409).`,
    body: {
      storeId: 1,
      staffId: 1,
      items: [
        {
          id: 1,
          from_location_id: 1,
          note: "Branch 2 weekly refill",
          destinations: [{ to_location_id: 2, products: [{ product_id: 1, variant_id: 4, qty: 15 }, { product_id: 9, variant_id: 1, qty: 5 }, { product_id: 22, qty: 20 }] }],
        },
      ],
    },
  },
  "order-bulk-patch": {
    description:
      "The body of Bulk Orders (POST /orders/bulk): { storeId, locationId, staffId, orders: [{ id (order number), customer_id (customer number) }] } — attach the customer the cashier forgot to pick (an order that has no customer yet). A sale's items, prices and taxes never change: a wrong item is a refund of that item plus a new sale, so the drawer, stock and tax stay right. Each order saves on its own: one that fails is listed in failed[].",
    body: { storeId: 1, locationId: 1, staffId: 2, orders: [{ id: 1, customer_id: 2 }] },
  },
  "order-bulk-status-patch": {
    description:
      "The body of Bulk Orders (POST /orders/bulk): { storeId, locationId, staffId, orders: [{ id, status, reason?, approval_request_id? }] }. completed — a pending (web / COD) order delivered and paid. cancelled — a pending order. voided — a completed sale: stock goes back and the drawer is reversed (a cashier needs an approval_request_id). An order may carry its own staffId.",
    body: { storeId: 1, locationId: 1, staffId: 1, orders: [{ id: 1, status: "voided", reason: "Rung up twice" }] },
  },
  "order-bulk-payment-method-patch": {
    description:
      "The cashier pressed the wrong method. The body of Bulk Orders (POST /orders/bulk): { storeId, locationId, staffId, orders: [{ id, payment_method }] }. Only a one-method sale with no refund while its batch is open, and only between methods with the same surcharge; otherwise 409 (void it and ring it up again). Store admin / manager.",
    body: { storeId: 1, locationId: 1, staffId: 1, orders: [{ id: 2, payment_method: "easypaisa" }] },
  },
  "surcharge-bulk-patch": {
    description: `${same("Bulk Surcharge Creation (POST /payment-surcharges/bulk)")} Store admin. method, charges, type (percentage | fixed), isActive (false = not added to any bill).`,
    body: { storeId: 1, items: [{ id: 1, charges: 2.5 }, { id: 2, type: "fixed", charges: 30, isActive: false }] },
  },
  "tax-bulk-patch": {
    description: `${same("Bulk Tax Creation (POST /taxes/bulk)")} Store admin. name, type (percentage | fixed), value, product_scope (all | selected), product_ids (replaces the list; a product number = the whole product, { product_id, variant_id } = one variant), isActive (false = not charged and left out of every product's store_taxes).`,
    body: { storeId: 1, items: [{ id: 2, value: 6, product_scope: "selected", product_ids: [1, 4, { product_id: 3, variant_id: 4 }] }, { id: 1, isActive: false }] },
  },
  "sup-bulk-patch": {
    description: `${same("Bulk Supplier Creation (POST /suppliers/bulk)")} name, phone, email, address, payment_terms, location_scope / location_ids (location numbers), isActive.`,
    body: { storeId: 1, items: [{ id: 1, phone: "03006666667", payment_terms: "Net 30" }, { id: 2, location_scope: "all", isActive: true }] },
  },
  "staff-bulk-patch": {
    description: `${same("Bulk Staff Creation (POST /staff/bulk)")} The one staff edit: name, email (unique in the store), phone, role (manager | cashier; store admin only), locationId (location number; a manager only within their own; the PIN must be free there), pin, isActive (false = suspended: 'Account Suspended' on sign-in and PIN). The password is not changed here (POST /auth/forgot-password). The store admin is edited from My Account.`,
    body: { storeId: 1, items: [{ id: 2, locationId: 1, phone: "03001112222", pin: "2323", isActive: true }] },
  },
  "staff-session-bulk-patch": {
    description: `${same("Clock In / Clock Out (POST /staff-sessions/clock-in, clock-out)")} A manager corrects attendance: clock_in_at and / or clock_out_at (ISO date-time; clocked_at of the clock-in / clock-out), clock_in_device_id / clock_out_device_id (the tills — deviceId of the clock-in / clock-out: device number, pos_devices id or hardware id at the session's location; null clears it). Setting clock_out_at closes the session (e.g. the cashier forgot to clock out). Each row of the reply carries clock_in_device_id and clock_out_device_id (device numbers). Store admin / manager.`,
    body: {
      storeId: 1,
      items: [
        { id: 1, clock_out_at: "2026-10-24T18:30:00.000Z" },
        { id: 2, clock_in_at: "2026-10-24T09:00:00.000Z", clock_out_at: "2026-10-24T17:00:00.000Z", clock_in_device_id: 1, clock_out_device_id: 2 },
      ],
    },
  },
  "batch-bulk-patch": {
    description: `${same("Batch Open / Batch Close (POST /batches/open, /batches/close)")} A manager corrects a cash drawer batch with the open / close fields: opening_amount and opening_at (as on open), total_cash and closing_at (as on close — a closed batch only), plus cash_in, cash_out and note. Expected cash (opening + cash in + cash sales − cash out) and the variance (counted − expected) are worked out again. Takings come from the sales and are not edited. Store admin / manager (a manager only at their own location).`,
    body: {
      storeId: 1,
      items: [
        { id: 1, opening_amount: 5000, note: "Float topped up" },
        { id: 2, total_cash: 18250, closing_at: "2026-10-24T22:05:00.000Z" },
      ],
    },
  },
  "customer-bulk-patch": {
    description: `${same("Bulk Customer Creation (POST /customers/bulk)")} name, phone, email, locationId (location number), total_debt and remaining_debt (as on create: a correction of the opening udhaar), debt_notes, isActive. Udhaar payments go through POST /customers/:id/credit, not here.`,
    body: { storeId: 1, items: [{ id: 1, phone: "03009998888", debt_notes: "Pays every Friday" }] },
  },
  "location-bulk-patch": {
    description: `${same("Create Location (POST /locations)")} name, address_line, city, postal_code, phone, isActive, and the manager_* fields of create (manager_name, manager_email, manager_password — blank keeps it, manager_pin, manager_phone). A manager only their own branch.`,
    body: { storeId: 1, items: [{ id: 3, phone: "03001234568", postal_code: "75300" }] },
  },
}
