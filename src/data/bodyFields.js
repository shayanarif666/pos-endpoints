/*
 * Request-body attribute rules, per endpoint id, taken from the backend validators.
 *   "required"            -> must be sent
 *   "optional"            -> may be left out (shown as "(optional)")
 *   ["optional", "note"]  -> optional, with a short rule shown next to it
 *   ["required", "note"]  -> required, with a short rule shown next to it
 * Nested keys use dotted paths; array rows use "[]" (e.g. "items[].product_id").
 * Every key present in an endpoint's example body must be listed here (see missingBodyFields).
 */

import { DEMO_FIELDS } from "./demo.js"

const R = "required"
const O = "optional"
const note = (text) => [O, text]
const must = (text) => [R, text]

const VISIBILITY = {
  is_pos_visible: O,
  is_web_visible: O,
  channel: note("web | pos | both. Default both"),
}

function prefixed(prefix, spec) {
  return Object.fromEntries(Object.entries(spec).map(([key, rule]) => [`${prefix}${key}`, rule]))
}

/** Bulk endpoints: `items` is required and every row follows the single-create rules. */
function bulkOf(spec) {
  return { items: R, ...prefixed("items[].", spec) }
}

// Store admin only: their token has no location, so they name it (a manager's or cashier's
// location comes from their token). On a bulk request it is sent once, next to items[].
const ADMIN_LOCATION = {
  location_id: note("Store admin only: the location number (e.g. 1) or UUID this applies to. Manager / cashier: leave it out — the token's location is used"),
}

/** Bulk body with the store admin's location_id at the top level instead of in every row. */
function bulkAtLocation(spec) {
  return { ...ADMIN_LOCATION, ...bulkOf(spec) }
}

// The store's tax settings: PUT /tax-rates, and the same fields at store registration.
const TAX_SETTINGS = {
  ntn: O,
  strn: O,
  charge_tax_on_sales: note("Master switch for all tax on sales. Default true at registration"),
  fbr_invoice_enabled: note("Default false"),
  sales_tax_enabled: note("Sales tax on / off. Default on — switch off when each product carries its own sales tax"),
  sales_tax_rate: note("Store-wide sales tax %, 0–100, on every taxable line. Default 18"),
  payment_tax_enabled: note("Payment-method GST on / off. Default on — when off, rates are kept but not charged"),
  rates: note("Payment-method GST rows to change. Defaults: cash 16, card 5, jazzcash 5, easypaisa 5"),
  "rates[].payment_method": must("cash | card | jazzcash | easypaisa | cod"),
  "rates[].gst_percent": must("0–100"),
}

const PLAN_CREATE = {
  code: R,
  type: must("monthly | yearly"),
  name: R,
  price_pkr: R,
  max_devices: R,
  max_locations: R,
  max_users: note("Max staff accounts. Leave out / null = no limit"),
  reporting_level: note("basic | standard | advanced | custom. Default basic"),
  import_export: note("Import & export data. Default false"),
  staff_attendance: note("Staff attendance (clock in / clock out). Default false"),
  email_integration: note("Default false"),
  whatsapp_integration: note("Default false"),
  receipt_customization: note("Default false"),
  barcode_scanning: note("Default false"),
  batch_management: note("Batch opening / closing. Default false"),
  remote_access: note("AnyDesk-type remote connection. Default false"),
  features: note("Free-text selling points for the plan card"),
  is_active: note("Default true"),
}

// Sent once at the top of a bulk body, before items[] (they apply to every item).
// Each may also be sent on the items instead; when both are sent, the top one is kept (staffId /
// batchId: the item's own wins for that item). Unknown fields are ignored, never an error.
const TOP_STORE = { storeId: note("Once, before items[] (or on each item): your store number (e.g. 1) or UUID. Must be the store of your token (else 403)") }
const TOP_LOCATION = { locationId: must("Once, before items[] (or on each item — all the same location): the location number (e.g. 1) or UUID. A manager / cashier sends their own location") }
const TOP_STAFF = { staffId: must("Once, before items[]: the staff member doing it (user number from PIN, e.g. 2). An item may carry its own staffId, which wins for that item. Leave out = the signed-in admin / manager") }
const TOP_BATCH = { batchId: note("Once, before items[]: the open batch number for every order (an item's own batchId wins). Defaults to the staff member's open batch") }
const without = (spec, keys) => Object.fromEntries(Object.entries(spec).filter(([key]) => !keys.includes(key)))

const STAFF_ID = note("The staff member doing it — the cashier picked by PIN (their user number, e.g. 3). Leave out = the signed-in admin / manager")


// Where a category / product is sold (any role; a manager / cashier sends their own location).
const CATALOG_LOCATIONS = {
  location_scope: note("all (every location, default) | selected (only location_ids). Manager / cashier: send selected + their own location; left out = their token's location"),
  location_ids: note("Required when selected: location numbers, e.g. [1] or [1, 2] (UUIDs also work)"),
}

const CATEGORY_CREATE = {
  name: must("A name that already exists is accepted — the slug gets a -2, -3... suffix"),
  tax_name: note("Label for the tax, e.g. GST"),
  tax_type: note("percentage | fixed. Category tax applies when type + value are sent"),
  tax_value: O,
  discount_name: note("Label for the discount, e.g. Eid Shopping"),
  discount_type: note("percentage | fixed. Category discount applies when type + value are sent"),
  discount_value: O,
  ...CATALOG_LOCATIONS,
}

const PRODUCT_CREATE = {
  title: R,
  sku: note("The product's own SKU, unique per store. Left out = made from the title"),
  barcode: must("Unique per store. One already in use is not an error: the product is saved with a new 13-digit barcode (starting with 2) and the dashboard reply names it in barcode_replaced"),
  category_id: must("The category's number (e.g. 1) or its UUID"),
  unit: note("Default piece"),
  cost: must("Loose Item: cost of one unit. Stored as cost_price"),
  price: must("Loose Item: selling price of one unit. Stored as selling_price. Its total_price = price after discount, then tax"),
  is_pack_product: note("true for a Pack Product. Default false (Loose Item)"),
  pack_size: must("Pack Product only: units per pack, >= 2"),
  pack_cost: must("Pack Product only: whole-pack cost. Stored as pack_cost_price; cost per unit = pack_cost ÷ pack_size (calculated)"),
  pack_price: must("Pack Product only: whole-pack selling price. Stored as pack_selling_price; price per unit = pack_price ÷ pack_size (calculated)"),
  taxes: note("Product-level taxes — as many as apply (e.g. GST + excise / import duty). Empty or left out = no product tax. Category tax and the store's sales tax are added at checkout"),
  "taxes[].name": note("Label shown on the receipt, e.g. GST"),
  "taxes[].type": must("percentage | fixed (fixed = per unit)"),
  "taxes[].value": must("The % or the amount per unit"),
  discount: note("The product discount as one object { name, type, value }; type is percentage or fixed, in any case (e.g. Percentage). Left out = no product discount. discount_name, discount_type and discount_value flat also work"),
  "discount.name": note("Label for the discount, e.g. Eid Shopping"),
  "discount.type": must("percentage | fixed"),
  "discount.value": must("The % (0–100) or the Rs off one unit"),
  discount_name: note("Label for the discount, e.g. Eid Shopping"),
  discount_type: note("percentage | fixed. Product discount applies when type + value are sent"),
  discount_value: O,
  sell_loose: note("True if units can also be sold individually"),
  low_stock_threshold: note("The low stock level of a product without variants, default 1: counted in low_stock_unit — packs for a pack-only product, units (piece / gram / kg) for a loose or weight based one, and for a pack + loose product the one you choose with low_stock_unit. With variants it is 0 (default): send the level inside each variant (variants[].low_stock_threshold); the product's own level is saved and returned as 0"),
  low_stock_unit: note("pack | unit (default unit). Only a pack + loose product (is_pack_product + sell_loose) has this choice: pack = low_stock_threshold counts packs, unit = single units. A pack-only product is always pack, a loose or weight based one always unit; the value sent is ignored there. With variants send it inside each variant. The response always shows the one in effect"),
  image: note("Image URL, saved as featured_image and images[0]. Empty string = no image"),
  is_weight_based: note("Sold by weight (kg). Can be combined with is_pack_product"),
  colors: note("Optional. The colours the product comes in, as hex codes: [\"#E11D48\", \"#2563EB\"] (as many as needed; \"e11d48\" / \"#abc\" are saved as \"#E11D48\" / \"#AABBCC\", repeats dropped). With variants, send each variant's colours in variants[].colors instead. PATCH: the new list replaces the old; [] clears it"),
  is_published: note("Default false"),
  is_active: note("Default true"),
  ...VISIBILITY,
  location_scope: note("Where it is sold (it and every variant): all (every location, default) | selected (only location_ids). The product shows at a location only when its category is sold there too. Store admin only: a manager / cashier's product is always sold at their own location"),
  location_ids: CATALOG_LOCATIONS.location_ids,
  stock_scope: note("Which of those locations hold its stock: all (every location it is sold at, default) | selected (stock_location_ids). Every one of them gets a stock row — qty 0 where no stock is sent. Store admin only"),
  stock_location_ids: note("stock_scope selected: location numbers (e.g. [1, 2]), each one it is sold at"),
  stock: note("A product without variants: its opening stock per location, [{ location_id, qty, stock_unit, expiry_date }]. Each row is saved as a stock_in / opening_balance movement. A manager / cashier: their own location only (another one is skipped and named in stock_warnings)"),
  "stock[].location_id": must("The location number (e.g. 1) or UUID — one that holds its stock"),
  "stock[].qty": must("Loose items, or packs with stock_unit pack, >= 0"),
  "stock[].stock_unit": note("unit | pack (default unit): what qty counts — unit = loose items, pack = whole packs (pack products / pack variants only; saved as packs × pack_size items)"),
  "stock[].expiry_date": note("YYYY-MM-DD"),
  variants: note("Sizes, colours… (1L, 1.5L, 2L…): each variant is sold on its own with its own SKU, barcode, prices, pack and stock, and the product's category, unit, taxes and locations. Variants are numbered 1, 2, 3… inside each product (the variant id). The product itself is not sold"),
  "variants[].name": must("e.g. 1.5L"),
  "variants[].sku": note("Unique per store. Left out = made from the title"),
  "variants[].barcode": must("A barcode already in use is replaced with a new 13-digit one"),
  "variants[].cost": must("Loose variant: cost of one unit (cost_price also works)"),
  "variants[].price": must("Loose variant: selling price of one unit (selling_price also works)"),
  "variants[].is_pack_product": note("true = this variant is sold by the pack (its own pack_size, pack_cost, pack_price). Default false"),
  "variants[].pack_size": must("Pack variant: units per pack, >= 2"),
  "variants[].pack_cost": must("Pack variant: whole-pack cost; cost per unit = pack_cost ÷ pack_size"),
  "variants[].pack_price": must("Pack variant: whole-pack price; price per unit = pack_price ÷ pack_size"),
  "variants[].sell_loose": note("Pack variant: single units can also be sold"),
  "variants[].low_stock_threshold": note("This variant's low stock level, counted in its low_stock_unit. Default 1"),
  "variants[].low_stock_unit": note("pack | unit (default unit). Pack + loose variant only: what the low stock level counts for this variant; a pack-only variant is always pack, any other unit"),
  "variants[].colors": note("Optional. This variant's colours, as hex codes: [\"#F59E0B\", \"#FFFFFF\"]. PATCH (an existing variant): the new list replaces the old; [] clears it; left out = stays"),
  "variants[].image": note("Optional. This variant's own image URL (one per variant). PATCH: null removes it. Or upload a file with POST /api/v1/products/variant-image. No image = the POS shows the product's image"),
  "variants[].is_weight_based": note("This variant is sold by weight (kg) on the scale. Left out = as the product's is_weight_based. Can be combined with a pack (e.g. a 25 kg bag sold by the kg)"),
  "variants[].taxes": note("Taxes on this variant only, added to the product's taxes: [{ name, type: percentage | fixed, value }]. When the product's taxes change, every variant gets them again plus its own"),
  "variants[].stock": note("Opening stock per location, [{ location_id, qty, stock_unit, expiry_date }]: each row is saved as a stock_in / opening_balance movement. Locations that hold the stock and are not listed get qty 0"),
  "variants[].stock[].location_id": must("The location number (e.g. 1) or UUID — one that holds the product's stock"),
  "variants[].stock[].qty": must("Loose items, or packs with stock_unit pack, >= 0"),
  "variants[].stock[].stock_unit": note("unit | pack (default unit): what qty counts — unit = loose items, pack = whole packs (pack products / pack variants only; saved as packs × pack_size items)"),
  "variants[].stock[].expiry_date": note("YYYY-MM-DD"),
}

const MOVEMENT_CREATE = {
  staffId: must("The staff member who did this movement: their user number (e.g. 1) or UUID — the cashier picked by PIN, or the admin / manager. Sent on every item (staff_id also works)"),
  product_id: must("The product's number (e.g. 1) or its UUID"),
  movement_type: must("stock_in (adds) | stock_out (takes away) | adjustment (either sign)"),
  reason: must("stock_in: purchase, customer_return · stock_out: damage, expiry, waste, theft, return_to_supplier · adjustment: count · any: other. opening_balance is refused — it is written when the product is created"),
  reason_note: note("e.g. the bill number"),
  supplier_id: note("Purchases / returns: the supplier number (e.g. 1)"),
  variants: must("A product with variants: one row per variant, [{ id, stock: [{ location_id, qty, expiry_date }] }]. One movement is written per variant and location; a row that fails is listed in failed[] and the others still save"),
  "variants[].id": must("The variant's number inside the product (1, 2, 3…) or its UUID"),
  "variants[].stock": must("Per location: [{ location_id, qty, stock_unit, expiry_date }]"),
  "variants[].stock[].location_id": must("The location number (e.g. 1) or UUID — one the product is sold at. A manager / cashier: their own only"),
  "variants[].stock[].qty": must("Positive, in stock_unit (loose items by default): stock_in adds it, stock_out takes it away (an adjustment keeps its sign)"),
  "variants[].stock[].stock_unit": note("unit | pack (default unit): what qty counts — unit = loose items, pack = whole packs (pack products / pack variants only; saved as packs × pack_size items)"),
  "variants[].stock[].expiry_date": note("Stock in: YYYY-MM-DD — the lot of that expiry date (a new date = a new lot; the same date adds to that lot). Left out: a lot without an expiry date"),
  "variants[].stock[].lot_id": note("Stock out / adjustment: the lot number to take from (GET /products/expiry; lot numbers are this variant's own, 1, 2, 3…). Left out = the lot that expires first (FEFO)"),
  stock: note("A product without variants: [{ location_id, qty, expiry_date }] (instead of variants)"),
  "stock[].location_id": must("The location number (e.g. 1) or UUID"),
  "stock[].qty": must("Positive, in stock_unit (as for variants)"),
  "stock[].stock_unit": note("unit | pack (default unit): what qty counts — unit = loose items, pack = whole packs (pack products / pack variants only; saved as packs × pack_size items)"),
  "stock[].expiry_date": note("Stock in: YYYY-MM-DD — the lot of that expiry date (a new date = a new lot)"),
  "stock[].lot_id": note("Stock out / adjustment: the lot number to take from (this product's own, 1, 2, 3…). Left out = the lot that expires first (FEFO)"),
  qty: note("Older clients: one qty at locationId / the token's location (instead of variants / stock)"),
  expiry_date: note("With qty: YYYY-MM-DD"),
  ...VISIBILITY,
}

// A store tax (Taxes page): one tax for every product or for the products listed.
const TAX_CREATE = {
  name: must("e.g. GST, Sugar tax (taxName also works)"),
  type: must("percentage | fixed (fixed = Rs per unit; taxType also works)"),
  value: must("The % (0–100) or the amount per unit (amount also works)"),
  product_scope: note("all (default) = every product, including ones added later — no product_ids needed | selected = only product_ids"),
  product_ids: note("product_scope selected: product numbers (e.g. [1, 6]) or UUIDs — a product covers all its variants; { product_id, variant_id } for one variant only"),
  "product_ids[].product_id": must("The product's number or UUID"),
  "product_ids[].variant_id": note("The variant's number inside the product (1, 2, 3…) or UUID"),
  is_active: note("Default true"),
}
const TAX_ID = must("The tax's number (1, 2, 3… — tax_number) or its UUID: both work")

// A payment method surcharge: what paying by the method adds to the bill.
const SURCHARGE_CREATE = {
  method: must("cash | card | jazzcash | easypaisa | cod | bank_transfer | raast | sadapay | nayapay | upaisa | digital_wallet | cheque | online | other — one surcharge per method"),
  charges: must("The % (percentage, 0–100) or the Rs amount (fixed)"),
  type: note("percentage (default: of that payment's share of the bill) | fixed (once per payment)"),
  isActive: note("Default true (is_active also works)"),
}
const SURCHARGE_ID = must("The surcharge's number (1, 2, 3… — surcharge_number) or its UUID: both work")

const CUSTOMER_CREATE = {
  name: R,
  phone: O,
  email: O,
  location_id: O,
  total_debt: note("Opening udhaar: everything the customer has ever owed (>= 0, default 0). Only remaining_debt sent = the same amount"),
  remaining_debt: note("What is still unpaid (>= 0, never more than total_debt). Only total_debt sent = the same amount. Default 0"),
  debt_notes: note("Note of the opening udhaar entry (max 4000 characters)"),
  ...VISIBILITY,
}

const STAFF_CREATE = {
  name: R,
  email: R,
  password: note("Manager: required, min 6 characters (dashboard sign-in). Cashier: leave it out — a cashier works on the POS with the PIN only"),
  pin: must("4–6 digits. Must differ from every other user's PIN at this location (and from the store admin's); another location or store may reuse it"),
  role: must("manager | cashier"),
  location_id: note("Store admin only: the location number (e.g. 2) the manager / cashier works at. A manager's new staff get the manager's location"),
  phone: O,
}

const DISCOUNT_STATUS = note("active (default) | inactive. An inactive discount is never applied")
const DISCOUNT_IS_ACTIVE = note("true / false: the same as status")

// Order level discount: a discount on the whole bill.
const ORDER_DISCOUNT_CREATE = {
  staff_id: STAFF_ID,
  name: R,
  discount_type: must("percentage | fixed"),
  discount_value: must("The % (0–100) or the Rs off the bill"),
  apply_to_all_orders: note("true (default) = the POS puts it on every order by itself; false = the cashier picks it"),
  status: DISCOUNT_STATUS,
  is_active: DISCOUNT_IS_ACTIVE,
}

// Bulk discount: buy X, get Y free (there is no type: it is always buy X get Y).
const BULK_DISCOUNT_CREATE = {
  staff_id: STAFF_ID,
  name: R,
  products: note("The products it applies to: numbers (e.g. [1, 2]) or { product_id, sale_unit?, free_product_id? }. Send products and / or categories: at least one"),
  "products[].product_id": note("The product's number (e.g. 1) or UUID"),
  "products[].sale_unit": note("A pack product: unit | pack | both"),
  "products[].free_product_id": note("The free item for this product, if not the same product (number or UUID)"),
  categories: note("The categories it applies to: numbers, e.g. [1, 3]. A product in a listed category gets the discount; a product listed itself wins over its category"),
  buy_qty: must("Items paid for in each group"),
  get_qty: must("Items free in each group"),
  buy_unit: note("unit (default) | pack: what buy_qty counts"),
  get_unit: note("unit (default) | pack: what get_qty counts"),
  sale_unit: note("A pack product: unit | pack | both (default both)"),
  start_at: O,
  end_at: O,
  status: DISCOUNT_STATUS,
  is_active: DISCOUNT_IS_ACTIVE,
  location_scope: note("all (every location, default) | selected (only location_ids). Manager / cashier: their own location"),
  location_ids: note("Required when selected: location numbers, e.g. [1] or [1, 2] (UUIDs also work)"),
}

// Bundle discount: a discount on selling a whole pack / carton.
const BUNDLE_DISCOUNT_CREATE = {
  staff_id: STAFF_ID,
  name: R,
  products: must("The pack products (numbers or UUIDs) the bundle covers. A product that is not a pack product is refused"),
  discount_type: must("percentage | fixed (Rs off each unit in the pack)"),
  discount_value: must("The % (0–100) or the Rs"),
  start_at: O,
  end_at: O,
  status: DISCOUNT_STATUS,
  is_active: DISCOUNT_IS_ACTIVE,
}

const ORDER_ITEM = {
  "items[].productId": note("Catalog line: the product number (e.g. 1) or UUID. Leave out on custom sale lines"),
  "items[].qty": R,
  "items[].offer_exempt": note("true = no offer on this line only. Default false"),
  "items[].weight": note("Weight-based products (kg)"),
  "items[].category": note("Custom sale lines only: the category typed at the till"),
  "items[].title": note("Custom sale lines only"),
  "items[].price": note("Custom sale lines only; catalog lines use the product's selling price"),
}

const ORDER_CREATE = {
  channel: note("Default pos. Send web only for a web order"),
  is_pos_visible: note("Ignored: the server sets it from channel"),
  is_web_visible: note("Ignored: the server sets it from channel"),
  staff_id: STAFF_ID,
  batch_id: note("The open batch (its number). Defaults to the staff member's open batch"),
  device_id: note("Defaults to the device in your POS token"),
  customer_id: note("Customer number. Required when part of the bill is credit / udhaar"),
  tax_exempt: note("true = no tax of any kind on this order (product, category, sales tax and payment GST). Default false"),
  offer_exempt: note("true = no offer on any line of this order (product / category discounts still apply). Default false — active offers apply automatically"),
  placed_at: must("When the sale happened on the till (ISO date-time) — offline sales sync later, so the sale keeps its real time. Left out = when the server receives it"),
  coupon_code: O,
  order_discount_type: note("percentage | fixed. Cashiers need an approval"),
  order_discount_value: O,
  approval_request_id: note("Approved discount_override request (cashier discounts)"),
  is_custom: note("true for a custom sale (lines without a catalog product)"),
  items: R,
  ...ORDER_ITEM,
  payments: note("One row per payment method; several rows = split payment. Each method pays its own share of the bill plus its own payment tax. Leave out to pay the full total by payment_method"),
  "payments[].method": must("cash | card | jazzcash | easypaisa | cod | bank_transfer | raast | sadapay | nayapay | upaisa | digital_wallet | cheque | online | other"),
  "payments[].bill_share": note("This method's share of the bill before payment tax. Leave out on cash to cover the rest of the bill"),
  "payments[].amount": note("What this method pays toward the bill = bill_share + its payment tax (e.g. cash 16%: 500 → 580). Required on a card / wallet row without bill_share"),
  "payments[].paid": note("What the customer handed over. Only cash may be more than amount — the rest is change"),
  amount_paid: note("Older form: total handed over, or per method [{ method, paid }]"),
  payment_method: note("Required when payments is not sent"),
}

// POS-priced order: the till works out every figure and the server saves them as sent.
const POS_PRICED_ORDER = {
  client_local_id: note("The till's own id for this sale. Sending the same one again returns the order already saved (no double sale after a network drop)"),
  placed_at: must("When the sale happened on the till (ISO date-time) — offline sales sync later, so the sale keeps its real time"),
  customer_id: note("Customer number. Required when part of the bill is credit / udhaar"),
  lines: must("Every line of the sale, priced by the till. A line without product_id is a custom line (title + category)"),
  "lines[].product_id": note("Catalog line: the product number (e.g. 1) or UUID. A product with variants: its number, with variant_id. Leave out on a custom line"),
  "lines[].variant_id": note("A product with variants: the variant sold — its number inside the product (1, 2, 3…) or UUID. Left out on a product without variants."),
  "lines[].sale_unit": note("unit (default) | pack. pack = the line is sold by the whole pack (a pack product / variant): qty is the number of packs and unit_price / cost_price are one pack's. Stock goes down by qty × pack size"),
  "lines[].title": note("Custom line only: what was sold"),
  "lines[].category": note("Custom line only: the category typed at the till"),
  "lines[].qty": must("Units sold (kg for a weight-based product); with sale_unit pack, the number of packs"),
  "lines[].unit_price": must("Price of one unit before any discount (one pack's with sale_unit pack)"),
  "lines[].cost_price": note("Cost of one unit, for profit reports. Left out = the product's cost price"),
  "lines[].discount_amount": note("The discount on the whole line, worked out by the till (all its discounts together). Saved as sent; 0 / left out = none"),
  "lines[].free_qty": note("BOGO: the free units on this line"),
  "lines[].discount": note("The discounts applied to this line: an array, one object per discount — [] (or left out) = none, one object for one discount, several for several"),
  "lines[].discount[].discount_id": must("The discount number (Discounts page, e.g. 1)"),
  "lines[].taxes": note("Every tax on the line, worked out by the till. Empty = no tax"),
  "lines[].taxes[].level": must("product | store (a Taxes page tax — the product's store_taxes) | category | sales"),
  "lines[].taxes[].name": note("Label on the receipt, e.g. GST"),
  "lines[].taxes[].rate": note("The % (a fixed tax: its amount per unit)"),
  "lines[].taxes[].amount": must("Tax on the whole line"),
  order_discount: note("null, or { type: percentage | fixed, value, amount } — amount is what comes off the bill. Cashiers need an approval_request_id"),
  coupon: note("null, or { code, amount } — amount is what the coupon takes off"),
  payments: must("One row per payment method; several rows = split payment"),
  "payments[].method": must("cash | card | jazzcash | easypaisa | cod | bank_transfer | raast | sadapay | nayapay | upaisa | digital_wallet | cheque | online | other"),
  "payments[].surcharge_type": note("The method's surcharge (Payment Method Surcharges): percentage | fixed"),
  "payments[].surcharge_value": note("Its % (percentage) or Rs (fixed), as set for the method"),
  "payments[].surcharge_amount": must("What the surcharge added to this payment (0 when the method has none). tax_rate / tax_amount from older tills still work"),
  "payments[].amount": must("What this method pays = its share of the bill + its surcharge"),
  "payments[].paid": note("What the customer handed over. Only cash may be more than amount — the rest is change. Left out = amount"),
  "payments[].transaction_id": note("The card / wallet reference, if the till has one"),
  total_amount: must("The order total as the till worked it out. Saved as sent; paid less than it = udhaar for the customer"),
}

// One transfer: from one location to one or more destinations, each with its own products and qty.
const TRANSFER_CREATE = {
  from_location_id: must("Location number (e.g. 1) or UUID the stock leaves from"),
  note: O,
  destinations: must("Where it goes: one row per destination location"),
  "destinations[].to_location_id": must("Location number (e.g. 2) or UUID — not the source"),
  "destinations[].products": must("What this destination gets: one row per product"),
  "destinations[].products[].product_id": must("Product number (e.g. 1) or UUID"),
  "destinations[].products[].variant_id": note("A product with variants: the variant sent — its number inside the product (1, 2, 3…) or UUID. Left out on a product without variants"),
  "destinations[].products[].qty": must("Above 0. The source must hold, per product, the qty of every destination together"),
}

const SUPPLIER_CREATE = {
  name: R,
  phone: O,
  email: O,
  address: O,
  payment_terms: O,
  location_scope: note("all (every branch, default) | selected (only location_ids). Manager / cashier: send selected + their own location; left out = their token's location"),
  location_ids: note("Required when selected: location numbers, e.g. [1] or [1, 2, 3] (UUIDs also work)"),
}

const LOCATION_CREATE = {
  name: R,
  address_line: R,
  city: R,
  postal_code: O,
  phone: O,
  is_active: note("Default true"),
  is_default: note("Default false"),
  manager_name: note("Optional: send all four manager_* fields to add a manager with the location, or add one later with POST /staff"),
  manager_email: note("With manager_name"),
  manager_password: note("With manager_name. Min 6 characters"),
  manager_pin: note("With manager_name. 4–6 digits, unique within the location"),
  manager_phone: O,
}

function allOptional(spec, extra = {}) {
  return {
    ...Object.fromEntries(
      Object.entries(spec).map(([key, rule]) => [key, Array.isArray(rule) ? [O, rule[1]] : O])
    ),
    ...extra,
  }
}


// ---- Bulk updates (PATCH .../bulk): items[] = [{ id (the row's number), ...fields }] ----

/** A bulk update body: items[] with the row's number as id; every other field optional. */
function bulkUpdateOf(label, spec, extra = {}) {
  return {
    ...extra,
    items: must("One row per record to change; a row that fails is listed in failed[], the rest still save"),
    "items[].id": must(`The ${label}'s number (1, 2, 3…), not the UUID`),
    ...prefixed("items[].", spec),
  }
}

const UPDATE_STAFF_ID = note("The staff member doing it (user number, e.g. 3), sent once; a row may carry its own. Leave out = the signed-in admin / manager")
const UPDATE_LOCATION = note("The location number (e.g. 1), sent once. A manager / cashier: their own location")

export const BODY_FIELDS = {
  "customer-create": { name: R, phone: O, email: O, location_id: note("The location number"), debt_notes: O },
  "customer-bulk": { ...TOP_STORE, ...TOP_LOCATION, ...bulkOf({ name: R, phone: O, email: O, debt_notes: O }) },
  // Plans
  "plans-create": PLAN_CREATE,
  "plans-patch": allOptional(PLAN_CREATE),

  // Auth
  "admin-register-superadmin": {
    name: R,
    email: R,
    password: must("Min 6 characters"),
  },
  "admin-create-store": {
    ...TAX_SETTINGS,
    status: note("trial = 3-day free trial (license trial, no billing) | active = purchased plan. Default active"),
    plan_id: R,
    name: R,
    legal_name: O,
    owner_name: O,
    business_type: R,
    address: R,
    city: O,
    contact_email: R,
    contact_phone: R,
    custom_domain: note("Storefront domain, e.g. www.fatimastationers.com"),
    logo_url: O,
    favicon_url: O,
    location_name: R,
    location_address: O,
    location_city: O,
    location_phone: note("Defaults to contact_phone"),
    admin_name: R,
    admin_email: R,
    admin_phone: O,
    admin_password: must("Min 6 characters"),
    admin_pin: must("4–6 digits, unique within the location"),
    pos_enabled: note("Default true"),
    web_enabled: note("Default true"),
    billing_status: note("pending | paid | failed | refunded. Default pending"),
    amount: O,
    method_note: O,
    billing_note: O,
  },
  "auth-login": {
    email: must("Store admin or manager (a cashier is verified by PIN instead)"),
    password: R,
  },
  "auth-pin-verify": {
    pin: must("The staff member's PIN (cashier, manager or store admin) at this location"),
  },
  "auth-patch-me": {
    name: O,
    phone: O,
    current_password: note("Required when password is sent"),
    password: note("New password, min 6 characters"),
    pin: note("New POS PIN, 4–6 digits, unique across all stores"),
  },

  // License
  "license-validate": {
    license_key: R,
    device_uid: must("This till's id, an integer (e.g. 1). Leave it out only to just inspect the key"),
  },

  // Devices
  "license-renew": {
    plan_id: note("Plan number (e.g. 1) or UUID. Leave out to renew on the current plan; another plan switches it"),
    amount: note("Billing amount. Default: the plan's price_pkr"),
    billing_status: note("pending | paid | failed | refunded. Default paid"),
    method_note: note("How it was paid, e.g. cash. Default manual"),
    note: O,
  },
  "device-heartbeat": {},

  // Store & tax
  "store-patch-me": {
    name: O,
    legal_name: O,
    owner_name: O,
    business_type: O,
    address: O,
    city: O,
    contact_email: O,
    contact_phone: O,
    logo_url: O,
    favicon_url: O,
    timezone: O,
    ntn: O,
    strn: O,
    fbr_invoice_enabled: O,
    charge_tax_on_sales: note("Master switch for all tax on sales"),
    sales_tax_enabled: note("Sales tax on / off. Default on"),
    sales_tax_rate: note("Sales tax %, 0–100. Default 18"),
    payment_tax_enabled: note("Payment-method GST on / off. Default on"),
    expiry_warning_days: O,
    expiry_critical_days: O,
    receipt_footer: O,
    pos_enabled: O,
    web_enabled: O,
    default_location_id: O,
  },
  "currency-put": {
    code: note("3-letter ISO code, e.g. PKR, USD. Default PKR"),
    name: note("e.g. Pakistani Rupee"),
    symbol: note("e.g. Rs"),
    decimal_places: note("0–4. Default 2"),
    symbol_position: note("before | after the amount. Default before"),
  },
  "tax-put": TAX_SETTINGS,

  // Staff sessions (attendance) and batches (cash drawer)
  "staff-clock-in": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    items: must("One row per clock-in; each saved on its own (POS offline sync). Leave out to send a single object"),
    "items[].staffId": note("Only when a row is a different staff member than the one on top"),
    "items[].clocked_at": note("Offline sync: when it actually happened. Defaults to now"),
  },
  "staff-clock-out": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    items: must("One row per clock-out; each saved on its own (POS offline sync). Leave out to send a single object"),
    "items[].staffId": note("Only when a row is a different staff member than the one on top"),
    "items[].clocked_at": note("Offline sync: when it actually happened. Defaults to now"),
  },
  "batch-open": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    items: must("One row per batch; each saved on its own (POS offline sync). Leave out to send a single object"),
    "items[].staffId": note("Only when a row belongs to a different staff member than the one on top"),
    "items[].opening_amount": must("Cash put in the drawer"),
    "items[].device_id": note("This PC's hardware id or pos_devices id. Defaults to the device in your POS token"),
    "items[].note": O,
    "items[].opening_at": note("When the batch opened (ISO date-time). Defaults to now"),
  },
  "batch-close": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    items: must("One row per batch; each saved on its own (POS offline sync). Leave out to send a single object"),
    "items[].staffId": note("Only when a row is a different staff member's batch than the one on top"),
    "items[].total_cash": must("Cash counted in the drawer (or send the note counts below instead)"),
    "items[].note_5000_count": O,
    "items[].note_1000_count": O,
    "items[].note_500_count": O,
    "items[].note_100_count": O,
    "items[].note_50_count": O,
    "items[].note_20_count": O,
    "items[].coins_total": O,
    "items[].note": O,
    "items[].closing_at": note("When the batch closed (ISO date-time). Defaults to now"),
  },

  // Categories
  "cat-create": CATEGORY_CREATE,
  "cat-bulk": { ...TOP_STORE, ...bulkOf(CATEGORY_CREATE) },
  "cat-patch": allOptional(CATEGORY_CREATE),

  // Products
  "prod-image-upload": {
    productId: must("The product number (e.g. 1) or UUID. Send the file in the image field (multipart/form-data)"),
  },
  "prod-variant-image-upload": {
    productId: must("The product number (e.g. 1) or UUID — the product the variant belongs to"),
    variantId: must("The variant's number inside the product (variants[].id: 1, 2, 3…) or its UUID. Send the file in the image field (multipart/form-data)"),
  },
  "prod-create": PRODUCT_CREATE,
  "prod-bulk": { ...TOP_STORE, ...bulkOf(PRODUCT_CREATE) },
  // category_id here is UUID-only, unlike create/bulk's flexible id-or-category_number.
  "prod-patch": allOptional({ ...PRODUCT_CREATE, category_id: note("UUID only on PATCH") }),
  "prod-weight-patch": { is_weight_based: R },

  // Inventory
  "stock-put": {
    qty: note("Send at least one of qty, low_stock_threshold or expiry_date"),
    location_id: note("Store admin only"),
    low_stock_threshold: O,
    expiry_date: note("YYYY-MM-DD for this location"),
    reason: O,
    reason_note: O,
    ...VISIBILITY,
  },
  "movement-create": { ...ADMIN_LOCATION, ...MOVEMENT_CREATE },
  "movement-bulk": { ...TOP_STORE, ...TOP_LOCATION, ...TOP_STAFF, ...bulkOf(without(MOVEMENT_CREATE, ["staffId"])) },

  // Customers
  "cust-create": CUSTOMER_CREATE,
  "cust-bulk": bulkOf(CUSTOMER_CREATE),
  "cust-patch": allOptional(CUSTOMER_CREATE, { is_active: O }),

  // Staff
  "staff-create": STAFF_CREATE,
  "staff-bulk": { ...TOP_STORE, ...bulkOf({
    locationId: must("On every staff item: the location number (e.g. 1) or UUID they work at. A manager can only use their own location"),
    ...Object.fromEntries(Object.entries(STAFF_CREATE).filter(([key]) => key !== "location_id")),
  }) },

  // Stock transfers
  "transfer-create": { ...TRANSFER_CREATE, staff_id: STAFF_ID },

  "transfer-bulk": { ...TOP_STORE, ...TOP_STAFF, ...bulkOf(TRANSFER_CREATE) },

  // Discounts
  "discount-bulk": { ...TOP_STORE, ...TOP_STAFF, ...bulkOf(without(ORDER_DISCOUNT_CREATE, ["staff_id"])) },
  "bulk-discount-bulk": { ...TOP_STORE, ...TOP_STAFF, ...bulkOf(without(BULK_DISCOUNT_CREATE, ["staff_id"])) },
  "bundle-discount-bulk": { ...TOP_STORE, ...TOP_STAFF, ...bulkOf(without(BUNDLE_DISCOUNT_CREATE, ["staff_id"])) },

  // Orders
  "order-create": { ...ADMIN_LOCATION, ...ORDER_CREATE },
  "order-bulk": { ...TOP_STORE, ...TOP_LOCATION, ...TOP_STAFF, ...TOP_BATCH, ...bulkOf(POS_PRICED_ORDER) },
  "order-refund": {
    order_item_id: must("The line's item number in the order (1, 2, 3...) or its UUID"),
    qty: R,
    reason: R,
    staff_id: STAFF_ID,
  },
  "order-refund-complete": { reason: R, staff_id: STAFF_ID },
  "order-refund-bulk": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    batchId: note("Once, before items[]: the batch the money leaves from — the drawer open now, not the sale's. An item's own batchId wins. Defaults to the staff member's open batch"),
    items: must("One row per order — an array even for one; an order that fails is listed in failed[], the rest still save"),
    "items[].client_local_id": must("The till's id for this refund — sent again, the saved refund comes back (no second refund)"),
    "items[].refunded_at": note("When it happened at the till (ISO date-time, at most 30 days ago). Left out = now"),
    "items[].order_id": must("The order number (e.g. 1)"),
    "items[].reason": must("Shown on the refund receipt and reports"),
    "items[].restock": note("true (default) = the qty goes back to stock; false = it does not (damaged / expired). For every line; a line's own restock wins"),
    "items[].lines": must("The lines that come back: one row per order line"),
    "items[].lines[].order_item_id": must("The line's item number in that order (1, 2, 3…)"),
    "items[].lines[].qty": must("How many come back (packs on a pack line) — at most what is left on that line"),
    "items[].lines[].restock": note("This line only: true = back to stock, false = not"),
    "items[].lines[].discount_amount": note("The discount on the qty given back, worked out by the till"),
    "items[].lines[].amount": must("What the qty given back costs after its discount, before tax"),
    "items[].lines[].taxes": note("Every tax given back on this line: [{ level, name, rate, amount }] — product | store | category | sales"),
    "items[].lines[].taxes[].level": must("product | store | category | sales — as on the sale"),
    "items[].lines[].taxes[].name": note("Label on the refund receipt, e.g. GST"),
    "items[].lines[].taxes[].rate": note("The % (a fixed tax: its amount per unit)"),
    "items[].lines[].taxes[].amount": must("The tax given back on this line"),
    "items[].lines[].total": must("amount + its taxes"),
    "items[].payments": must("How the money goes back: one row per method (the POS may choose another method than the sale). method credit = off the customer's udhaar"),
    "items[].payments[].method": must("cash | card | credit | … (as on orders)"),
    "items[].payments[].surcharge_type": note("percentage | fixed — the Payment Method Surcharge given back"),
    "items[].payments[].surcharge_value": note("The % (or fixed amount) of that surcharge"),
    "items[].payments[].surcharge_amount": note("The surcharge given back on this method"),
    "items[].payments[].amount": must("What goes back this way, surcharge included"),
    "items[].total_amount": must("The whole refund — must equal the sum of payments[].amount"),
  },
  "order-refund-complete-bulk": {
    ...TOP_STORE,
    ...TOP_LOCATION,
    ...TOP_STAFF,
    batchId: note("Once, before items[]: the batch the money leaves from — the drawer open now, not the sale's. An item's own batchId wins. Defaults to the staff member's open batch"),
    items: must("One row per order — an array even for one; an order that fails is listed in failed[], the rest still save"),
    "items[].client_local_id": must("The till's id for this refund — sent again, the saved refund comes back (no second refund)"),
    "items[].refunded_at": note("When it happened at the till (ISO date-time, at most 30 days ago). Left out = now"),
    "items[].order_id": must("The order number (e.g. 1)"),
    "items[].reason": must("Shown on the refund receipt and reports"),
    "items[].restock": note("true (default) = the qty goes back to stock; false = it does not (damaged / expired). For every line; a line's own restock wins"),
    "items[].lines": must("Every line still left on the order, with all of its remaining qty"),
    "items[].lines[].order_item_id": must("The line's item number in that order (1, 2, 3…)"),
    "items[].lines[].qty": must("All of what is left on that line"),
    "items[].lines[].restock": note("This line only: true = back to stock, false = not"),
    "items[].lines[].discount_amount": note("The discount on the qty given back, worked out by the till"),
    "items[].lines[].amount": must("What the qty given back costs after its discount, before tax"),
    "items[].lines[].taxes": note("Every tax given back on this line: [{ level, name, rate, amount }] — product | store | category | sales"),
    "items[].lines[].taxes[].level": must("product | store | category | sales — as on the sale"),
    "items[].lines[].taxes[].name": note("Label on the refund receipt, e.g. GST"),
    "items[].lines[].taxes[].rate": note("The % (a fixed tax: its amount per unit)"),
    "items[].lines[].taxes[].amount": must("The tax given back on this line"),
    "items[].lines[].total": must("amount + its taxes"),
    "items[].payments": must("How the money goes back: one row per method (the POS may choose another method than the sale). method credit = off the customer's udhaar"),
    "items[].payments[].method": must("cash | card | credit | … (as on orders)"),
    "items[].payments[].surcharge_type": note("percentage | fixed — the Payment Method Surcharge given back"),
    "items[].payments[].surcharge_value": note("The % (or fixed amount) of that surcharge"),
    "items[].payments[].surcharge_amount": note("The surcharge given back on this method"),
    "items[].payments[].amount": must("What goes back this way, surcharge included"),
    "items[].total_amount": must("The whole refund — must equal the sum of payments[].amount"),
  },
  "receipt-generate": { order_id: must("Order number (e.g. 1) or UUID") },
  "order-void": {
    reason: O,
    approval_request_id: note("Cashiers on Package 2/3: approved void_order request"),
  },

  // Suppliers
  "sup-create": SUPPLIER_CREATE,
  "sup-bulk": { ...TOP_STORE, ...bulkOf(SUPPLIER_CREATE) },
  "tax-bulk": { ...TOP_STORE, ...bulkOf(TAX_CREATE) },
  "surcharge-bulk": { ...TOP_STORE, ...bulkOf(SURCHARGE_CREATE) },
  "sup-patch": allOptional(SUPPLIER_CREATE, { is_active: note("false = deactivate") }),

  // Locations
  "location-create": LOCATION_CREATE,
  "location-patch": allOptional(LOCATION_CREATE, {
    manager_password: note("Leave blank to keep the current password"),
    manager_is_active: O,
  }),

  // Bulk updates (PATCH)
  "prod-bulk-patch": bulkUpdateOf("product", {
    ...allOptional(PRODUCT_CREATE, {
      category_id: note("The category's number (e.g. 2)"),
      cost: note("Loose Item: cost of one unit (cost_price also works)"),
      price: note("Loose Item: selling price of one unit (selling_price also works)"),
      pack_cost: note("Pack Product: whole-pack cost"),
      pack_price: note("Pack Product: whole-pack selling price"),
      stock: note("A product without variants: the counted stock per location, [{ location_id, qty }]. qty is the total counted, not a change: the difference is saved as an adjustment / count movement (nothing when it is the same)"),
      "variants[].stock": note("The counted stock per location, [{ location_id, qty }] — as for the product's stock. A new variant (no id): its opening stock"),
      "variants[].stock[].qty": must("The total counted there (units)"),
    }),
    sku: O,
    "variants[].id": note("The variant's number inside the product (1, 2, 3…) or its UUID — changes that variant. Left out = a new variant (numbered next)"),
  }),
  "prod-bulk-weight-patch": bulkUpdateOf("product", { is_weight_based: must("true = sold by weight (kg / g), false = by unit") }),
  "prod-bulk-status-patch": bulkUpdateOf("product", { is_active: must("false = off sale (record and history stay), true = back on sale") }),
  "prod-bulk-visibility-patch": bulkUpdateOf("product", { is_pos_visible: note("Shown on the POS"), is_web_visible: note("Shown on the website") }),
  "cat-bulk-patch": bulkUpdateOf("category", allOptional(CATEGORY_CREATE)),
  "cat-bulk-status-patch": bulkUpdateOf("category", { is_active: R }),
  "cat-locations-patch": {
    category_ids: must("The categories to change: their numbers (1, 2, 3…). Every one gets the same locations"),
    location_scope: must("all = every location (location_ids not needed) | selected = only location_ids"),
    location_ids: note("Required with selected: one or several location numbers (e.g. [1, 2]). Replaces each category's current locations"),
  },
  "movement-patch": {
    items: must("One row per movement to fix — an array even for one; a row that fails is listed in failed[], the rest still save"),
    "items[].id": must("The movement number (1, 2, 3…), not the UUID"),
    "items[].movement_type": note("stock_in | stock_out | adjustment. Left out = stays"),
    "items[].reason": note("stock_in: purchase, customer_return, other · stock_out: damage, expiry, waste, theft, return_to_supplier, other · adjustment: count, other"),
    "items[].qty": note("The amount moved (not the stock): stock_in adds it, stock_out takes it away, an adjustment keeps its + / − sign. The difference goes on the stock"),
    "items[].reason_note": note("Why it was fixed; null clears it"),
  },
  "stock-entry-patch": {
    locationId: note("The location number, sent once for every item (an item's own location_id wins)"),
    staff_id: note("Who did it (user number), sent once; a row may carry its own. Leave out = the signed-in user"),
    items: must("One row per product and location — an array even for one; a row that fails is listed in failed[]"),
    "items[].product_id": must("The product number (e.g. 1)"),
    "items[].variant_id": note("The variant number inside the product (1, 2, 3…), for a product with variants"),
    "items[].location_id": note("The location number (e.g. 1). Leave out = locationId, or a manager's own location"),
    "items[].qty": note("The new total in units (not a change). Send qty, delta or number_of_packs"),
    "items[].delta": note("+ adds / − takes away from the current stock"),
    "items[].number_of_packs": note("A pack product: whole packs; total = packs × pack_size (+ loose_units)"),
    "items[].loose_units": note("A pack product that sells loose: single units on top of the packs"),
    "items[].expiry_date": note("YYYY-MM-DD; null clears it"),
    "items[].low_stock_threshold": note("Alert level at this location, in packs for a pack-only product, else in units; null = the level set on the product"),
    "items[].reason": note("For a qty change: count (default), purchase, damage, expiry, waste, theft, return_to_supplier, customer_return, other"),
    "items[].movement_type": note("stock_in | stock_out | adjustment (default) — must match the direction"),
    "items[].reason_note": note("Saved on the movement"),
    "items[].lot_id": note("One lot (its number, GET /products/expiry): qty / number_of_packs are that lot's new total and expiry_date its date. Left out: qty is the whole stock's new total (a cut comes off the lot that expires first) and expiry_date goes on that lot"),
  },
  "stock-entry-delete": {
    reason_note: note("Optional; saved on the movement that sets the qty to 0"),
  },
  "transfer-bulk-patch": {
    staff_id: note("Who changed it (user number), sent once. Leave out = the signed-in admin"),
    items: must("One row per transfer to change — an array even for one; a row that fails is listed in failed[]"),
    "items[].id": must("The transfer number (1, 2, 3…), not the UUID"),
    "items[].from_location_id": note("Location number the stock leaves from. Left out = stays"),
    "items[].note": note("Left out = stays; null clears it"),
    "items[].destinations": note("The whole new list, as on create — it replaces every product of the transfer. Left out = the products stay"),
    "items[].destinations[].to_location_id": must("Location number (e.g. 2) — not the source"),
    "items[].destinations[].products": must("What this destination gets: one row per product"),
    "items[].destinations[].products[].product_id": must("Product number (e.g. 1)"),
    "items[].destinations[].products[].variant_id": note("A product with variants: the variant number inside it (1, 2, 3…)"),
    "items[].destinations[].products[].qty": must("Above 0. The source must hold, per product, the qty of every destination together"),
  },
  "order-bulk-patch": bulkUpdateOf("order", { customer_id: must("The customer's number; only an order with no customer yet") }, { locationId: UPDATE_LOCATION }),
  "order-bulk-status-patch": bulkUpdateOf(
    "order",
    {
      status: must("completed (pending web / COD order paid) | cancelled (pending order) | voided (completed sale)"),
      reason: note("Shown on the order"),
      approval_request_id: note("A cashier voiding: the approved void_order request"),
      staff_id: note("This row's staff member (user number), if not the one sent once"),
    },
    { locationId: UPDATE_LOCATION, staff_id: UPDATE_STAFF_ID }
  ),
  "order-bulk-payment-method-patch": bulkUpdateOf(
    "order",
    { payment_method: must("cash | card | jazzcash | easypaisa — same payment tax as the old method") },
    { locationId: UPDATE_LOCATION, staff_id: UPDATE_STAFF_ID }
  ),
  "sup-bulk-patch": bulkUpdateOf("supplier", { ...allOptional(SUPPLIER_CREATE), is_active: O }),
  "tax-bulk-patch": {
    ...bulkUpdateOf("tax", { ...allOptional(TAX_CREATE), product_ids: note("Replaces the products the tax applies to (with product_scope selected)") }),
    "items[].id": TAX_ID,
  },
  "surcharge-bulk-patch": {
    ...bulkUpdateOf("surcharge", allOptional(SURCHARGE_CREATE)),
    "items[].id": SURCHARGE_ID,
  },
  "surcharge-bulk-status-patch": {
    ...bulkUpdateOf("surcharge", { is_active: must("false = not added to any bill, true = added again") }),
    "items[].id": SURCHARGE_ID,
  },
  "tax-bulk-status-patch": {
    ...bulkUpdateOf("tax", { is_active: must("false = not charged on any sale, true = charged again") }),
    "items[].id": TAX_ID,
  },
  "staff-bulk-patch": bulkUpdateOf("staff member", {
    name: O,
    email: note("Unique in the store"),
    phone: O,
    role: note("manager | cashier. Store admin only"),
    location_id: note("The location number; the PIN must be free there"),
    is_active: note("false = suspended (cannot sign in or use a PIN), true = active again"),
    pin: note("4–6 digits, unique at the location"),
  }),
  "batch-bulk-patch": bulkUpdateOf("batch", {
    opening_cash: note("Cash in the drawer at opening, >= 0"),
    cash_in: note(">= 0"),
    cash_out: note(">= 0"),
    counted_cash: note("A closed batch: the cash counted at closing; the variance is worked out again"),
    opened_at: note("ISO date-time"),
    closed_at: note("A closed batch: ISO date-time, after opened_at"),
    note: O,
  }),
  "staff-session-bulk-patch": bulkUpdateOf("session", {
    clock_in_at: note("ISO date-time"),
    clock_out_at: note("ISO date-time, after clock_in_at. Closes the session"),
  }),
  "customer-bulk-patch": bulkUpdateOf("customer", {
    name: O,
    phone: O,
    email: O,
    location_id: note("The location number"),
    debt_notes: O,
    is_active: O,
  }),
  "discount-bulk-patch": bulkUpdateOf("discount", allOptional(without(ORDER_DISCOUNT_CREATE, ["staff_id"]))),
  "bulk-discount-bulk-patch": bulkUpdateOf("discount", allOptional(without(BULK_DISCOUNT_CREATE, ["staff_id"]))),
  "bundle-discount-bulk-patch": bulkUpdateOf("bundle", allOptional(without(BUNDLE_DISCOUNT_CREATE, ["staff_id"]))),
  "location-bulk-patch": bulkUpdateOf(
    "location",
    allOptional(LOCATION_CREATE, { manager_password: note("Leave blank to keep the current password"), manager_is_active: O })
  ),
}

/** Rules for a body: explicit entry, or the generic `ids` rule of the data bulk-delete routes. */
export function bodyFieldsFor(endpoint) {
  if (DEMO_FIELDS[endpoint.id]) return DEMO_FIELDS[endpoint.id]
  if (BODY_FIELDS[endpoint.id]) return BODY_FIELDS[endpoint.id]
  if (endpoint.tag === "data" && endpoint.id.endsWith("-bulk")) return { ids: R }
  return null
}

/** Every attribute path in an example body ("items[].product_id" for array rows). */
export function bodyPaths(value, prefix = "") {
  if (Array.isArray(value)) {
    const first = value.find((row) => row && typeof row === "object" && !Array.isArray(row))
    return first ? bodyPaths(first, `${prefix}[].`) : []
  }
  if (!value || typeof value !== "object") return []
  return Object.entries(value).flatMap(([key, child]) => {
    const path = `${prefix}${key}`
    const isRows = Array.isArray(child) && child.some((row) => row && typeof row === "object")
    return [path, ...(isRows ? bodyPaths(child, path) : [])]
  })
}

/** Body attributes with no required/optional rule (should always be empty). */
export function missingBodyFields(endpoint) {
  if (endpoint.body == null) return []
  const rules = bodyFieldsFor(endpoint) || {}
  return bodyPaths(endpoint.body).filter((path) => !(path in rules))
}

export function ruleOf(rule) {
  if (Array.isArray(rule)) return { required: rule[0] === R, note: rule[1] }
  return { required: rule === R, note: "" }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const NUMBER_SUFFIX_RE =
  /_(number|int|count|qty|quantity|price|cash|amount|percent|value|values|days|threshold|size|total|pkr|rate)$/
// Known numbers that don't end in a number suffix.
const KNOWN_NUMBER_KEYS = new Set(["cost", "price", "pack_cost", "pack_price", "qty", "delta", "sort_order", "min_qty", "buy_qty", "get_qty"])
// Known booleans that don't follow the is_/has_ naming convention.
const KNOWN_BOOLEAN_KEYS = new Set([
  "sell_loose",
  "pos_enabled",
  "web_enabled",
  "fbr_invoice_enabled",
  "charge_tax_on_sales",
  "payment_tax_enabled",
  "sales_tax_enabled",
  "tax_exempt",
])

/**
 * Data type shown in the attributes table. Prefers the live example body's own value (most
 * accurate, whatever a developer actually wired up); falls back to a heuristic over the
 * attribute's name and note when that path isn't present in the body — this project's own
 * naming convention is consistent enough (_id, _at, is_/has_, _number/_count/...) that the
 * fallback is reliable without hand-annotating every field.
 */
export function typeOf(path, rule, bodyValue) {
  const { note: noteText } = ruleOf(rule)
  // References that take the short number or the UUID (location_id, product_id...).
  if (/(^|_)id$|[a-z]Id$/.test(path.split(".").pop()) && /number/i.test(noteText) && /UUID/.test(noteText.replace(/not the UUID/i, ""))) {
    return "number | UUID"
  }
  // References that take only the short number (bulk updates: id, category_id, location_id...).
  if (/(^|_)id$|[a-z]Id$/.test(path.split(".").pop()) && /number/i.test(noteText) && !/UUID/.test(noteText.replace(/not the UUID/i, ""))) {
    return "number"
  }
  if (bodyValue !== undefined) {
    if (typeof bodyValue === "boolean") return "boolean"
    if (typeof bodyValue === "number") return "number"
    if (Array.isArray(bodyValue)) return "array"
    if (bodyValue && typeof bodyValue === "object") return "object"
    if (typeof bodyValue === "string") {
      if (UUID_RE.test(bodyValue)) return "UUID"
      if (noteText && /\s\|\s/.test(noteText)) return "enum"
      return "string"
    }
  }
  const key = path.split(".").pop().replace(/\[\]$/, "")
  if (noteText && /\s\|\s/.test(noteText)) return "enum"
  if (/(^|_)id$/.test(key)) return "UUID"
  if (/_at$/.test(key)) return "date-time"
  if (/^(is_|has_)/.test(key) || KNOWN_BOOLEAN_KEYS.has(key)) return "boolean"
  if (NUMBER_SUFFIX_RE.test(key) || KNOWN_NUMBER_KEYS.has(key)) return "number"
  if (key === "items" || key === "features" || key === "targets" || key === "rates") return "array"
  return "string"
}

// "Default X" / "Defaults to X" / "Default: X" inside a note, up to " — ", ". ", ";" or the end.
const DEFAULT_RE = /\s*\bDefaults?(?::|\s+to|\s+is)?\s+(.+?)(?=\s+—|[.;]\s|[.;]?$)[.;]?/i

/** The default value a note names (e.g. "web | pos | both. Default both" → "both"), or null. */
export function defaultOf(rule) {
  const { note } = ruleOf(rule)
  const match = note && note.match(DEFAULT_RE)
  return match ? match[1].trim() : null
}

/** The note without its "Default …" part (that one has its own column). */
export function noteWithoutDefault(rule) {
  const { note } = ruleOf(rule)
  if (!note) return ""
  return note
    .replace(DEFAULT_RE, "")
    .replace(/\s*\.\s*—\s*/, ". ")
    .replace(/^[\s—.;]+|[\s—;]+$/g, "")
    .trim()
}

/**
 * Enums written in the attribute notes ("manager | cashier", "percentage | fixed (per unit)"):
 * { attribute: [values] }. A bulk row's attributes read without "items[].".
 */
export function enumsFromFields(fields) {
  const out = {}
  for (const [path, rule] of Object.entries(fields || {})) {
    const { note } = ruleOf(rule)
    const part = note && note.split(/\.\s/).find((piece) => piece.includes(" | "))
    if (!part) continue
    const values = part
      .split("|")
      .map((piece) => piece.trim().match(/^[A-Za-z0-9_-]+/)?.[0])
      .filter(Boolean)
    if (values.length >= 2) out[path.replace(/^items\[\]\./, "")] = [...new Set(values)]
  }
  return out
}
