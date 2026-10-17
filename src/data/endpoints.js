import { bodyFieldsFor } from "./bodyFields.js"
import { buildBody, defaultToggles } from "./bodyBuilder.js"

const UUID = "00000000-0000-4000-8000-000000000001"

// Shared row pieces for the Category / Product builders (PDF spec, Oct 2026).
const TAX = (name, type, value) => [
  ["tax_name", name, "tax"],
  ["tax_type", type, "tax"],
  ["tax_value", value, "tax"],
]
const DISCOUNT = (name, type, value) => [
  ["discount_name", name, "discount"],
  ["discount_type", type, "discount"],
  ["discount_value", value, "discount"],
]
const VISIBILITY_OPTIONAL = [
  ["is_active", true, "optional"],
  ["is_pos_visible", true, "optional"],
  ["is_web_visible", true, "optional"],
  ["channel", "both", "optional"],
]

function categoryRow(name, taxValue, discountValue) {
  return [
    ["name", name],
    ...TAX("GST", "percentage", taxValue),
    ...DISCOUNT("Eid Shopping", "percentage", discountValue),
    ["description", "", "optional"],
    ["parent_category_id", null, "optional"],
    ...VISIBILITY_OPTIONAL,
  ]
}

const CATEGORY_TOGGLES = [
  { id: "discount", label: "Has Category Discount", default: true },
  { id: "tax", label: "Has Category Tax", default: true },
  { id: "optional", label: "Show Optional Fields", default: false },
]

const PRODUCT_TAIL = [
  ...TAX("GST", "percentage", 5),
  ...DISCOUNT("Eid Shopping", "percentage", 5),
  ["low_stock_threshold", 10],
  ["sell_loose", true],
  ["image", ""],
  ["is_weight_based", false, "optional"],
  ["is_published", false, "optional"],
  ...VISIBILITY_OPTIONAL,
]

const PRODUCT_LOOSE_ROW = [
  ["title", "1 Litre Pepsi"],
  ["barcode", "78263672323325"],
  ["category_id", 1],
  ["unit", "bottle"],
  ["cost", 50],
  ["price", 100],
  ...PRODUCT_TAIL,
]

const PRODUCT_PACK_ROW = [
  ["title", "1 Litre Pepsi"],
  ["barcode", "78263672323325"],
  ["category_id", 1],
  ["unit", "bottle"],
  ["is_pack_product", true],
  ["pack_size", 10],
  ["each_unit_cost", 50],
  ["each_unit_price", 100],
  ["pack_cost", 500],
  ["pack_price", 1000],
  ...PRODUCT_TAIL,
]

const round2 = (n) => Math.round(n * 100) / 100

// Mirrors the products.total_price_each_unit / total_pack_price generated columns: the product's
// own discount first, then its own tax on the discounted price. Fixed amounts are per unit.
function priceAfterDiscountAndTax(item, base, units) {
  const discountValue = Number(item.discount_value)
  const taxValue = Number(item.tax_value)
  let net = base
  if (item.discount_type && item.discount_value != null && discountValue > 0) {
    net -= Math.min(
      base,
      item.discount_type === "percentage" ? (base * discountValue) / 100 : discountValue * units
    )
  }
  let tax = 0
  if (item.tax_type && item.tax_value != null) {
    tax = item.tax_type === "percentage" ? (net * taxValue) / 100 : taxValue * units
  }
  return round2(net + tax)
}

/** Totals the server computes for one product body, labelled per Loose Item / Pack Product. */
function productTotals(item) {
  const isPack = Boolean(item.is_pack_product)
  const packSize = Number(item.pack_size)
  const unitPrice =
    item.each_unit_price ?? item.price ?? item.selling_price ??
    (isPack && packSize ? round2(Number(item.pack_price ?? item.pack_selling_price) / packSize) : null)
  const rows = []
  if (unitPrice != null && !Number.isNaN(Number(unitPrice))) {
    rows.push([
      isPack ? "total_price_each_unit" : "total_price",
      priceAfterDiscountAndTax(item, Number(unitPrice), 1),
    ])
  }
  const packPrice = item.pack_price ?? item.pack_selling_price
  if (isPack && packPrice != null && packSize) {
    rows.push(["total_pack_price", priceAfterDiscountAndTax(item, Number(packPrice), packSize)])
  }
  return rows
}

const PRODUCT_TOGGLES = [
  { id: "discount", label: "Has Product Discount", default: true },
  { id: "tax", label: "Has Product Tax", default: true },
  { id: "optional", label: "Show Optional Fields", default: false },
]

function productBuilder(bulk) {
  return {
    bulk,
    variants: [
      { id: "loose", label: "Loose Item", rows: [PRODUCT_LOOSE_ROW] },
      { id: "pack", label: "Pack Product", rows: [PRODUCT_PACK_ROW] },
    ],
    toggles: PRODUCT_TOGGLES,
  }
}

const MOVEMENT_ROW = [
  ["product_id", 1],
  ["movement_type", "stock_in"],
  ["reason", "purchase"],
  ["qty", 50],
  ["expiry_date", "2026-12-31"],
  ["is_pos_visible", true, "optional"],
  ["is_web_visible", true, "optional"],
  ["channel", "both", "optional"],
]

function movementBuilder(bulk) {
  return {
    bulk,
    variants: [{ id: "default", label: "Movement", rows: [MOVEMENT_ROW] }],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

function offerRow(applyTo) {
  return [
    ["name", "Weekend 10% off"],
    ["type", "promotional"],
    ["apply_to", applyTo],
    ["discount_type", "percentage"],
    ["discount_value", 10],
    applyTo === "category" ? ["category_id", 1] : ["product_id", 1],
    ["min_qty", null],
    ["buy_qty", null],
    ["get_qty", null],
    ["start_at", "2026-09-01T00:00:00.000Z"],
    ["end_at", "2026-12-31T23:59:59.000Z"],
    ["is_active", true],
    ["promo_price", null, "optional"],
    ["free_product_id", null, "optional"],
    ["location_id", null, "optional"],
  ]
}

function offerBuilder(bulk) {
  return {
    bulk,
    variants: [
      { id: "category", label: "Apply To Category", rows: [offerRow("category")] },
      { id: "product", label: "Apply To Product", rows: [offerRow("product")] },
    ],
    toggles: [{ id: "optional", label: "Show Optional Fields", default: false }],
  }
}

export const RESOURCE_ENUMS = {
  plans: {
    type: ["monthly", "yearly"],
  },
  auth: {
    role: ["superadmin", "store_admin", "manager", "cashier", "customer"],
    channel: ["web", "pos"],
  },
  license: {
    status: ["pending", "active", "expired", "revoked"],
  },
  devices: {},
  locations: {},
  store: {
    business_type: [
      "grocery",
      "boutique",
      "retail",
      "pharmacy",
      "restaurant",
      "cafe",
      "bakery",
      "electronics",
      "fashion",
      "clothing",
      "beauty",
      "furniture",
      "hardware",
      "sports",
      "books",
      "jewelry",
      "supermarket",
      "convenience",
      "wholesale",
      "other",
    ],
  },
  shifts: {
    status: ["clock_in", "clock_out"],
  },
  categories: {
    tax_type: ["percentage", "fixed"],
    discount_type: ["percentage", "fixed"],
    channel: ["web", "pos", "both"],
  },
  products: {
    unit: [
      "piece",
      "kg",
      "gram",
      "liter",
      "ml",
      "packet",
      "box",
      "dozen",
      "pair",
      "meter",
      "yard",
      "roll",
      "set",
      "carton",
      "bag",
      "bottle",
      "can",
    ],
    tax_type: ["percentage", "fixed"],
    discount_type: ["percentage", "fixed"],
    channel: ["web", "pos", "both"],
  },
  inventory: {
    "movement_type": [
      "stock_in",
      "stock_out",
      "adjustment",
      "sale",
      "refund",
      "transfer_out",
      "transfer_in",
      "custom_sale",
    ],
    reason: [
      "purchase",
      "opening_balance",
      "return_to_supplier",
      "customer_return",
      "waste",
      "damage",
      "expiry",
      "theft",
      "count",
      "sale",
      "refund",
      "sync",
      "transfer",
      "custom_sale",
      "other",
    ],
    channel: ["web", "pos", "both"],
  },
  customers: {
    entry_type: ["debit", "credit"],
    channel: ["web", "pos", "both"],
  },
  staff: {
    role: ["manager", "cashier"],
  },
  offers: {
    type: ["flash_sale", "bulk_discount", "bogo", "promotional"],
    apply_to: ["product", "category"],
    discount_type: ["percentage", "fixed"],
  },
  orders: {
    channel: ["web", "pos"],
    is_pos_visible: ["true", "false"],
    is_web_visible: ["true", "false"],
    order_status: ["pending", "completed", "voided", "cancelled", "refunded"],
    payment_status: ["pending", "paid", "failed", "refunded"],
    payment_method: ["cash", "card", "jazzcash", "easypaisa", "cod", "mixed"],
  },
  reports: {
    period: ["daily", "weekly", "monthly", "yearly"],
    channel: ["web", "pos"],
  },
  suppliers: {
    entry_type: ["debit", "credit"],
    channel: ["web", "pos", "both"],
  },
  audit: {
    actor_type: ["user", "system"],
    action: [
      "create",
      "update",
      "delete",
      "login",
      "logout",
      "clock_in",
      "clock_out",
      "sale",
      "void",
      "cancel",
      "refund",
      "pin_override",
      "approve",
      "reject",
      "license_activate",
      "backup",
      "restore",
    ],
  },
  data: {},
}

function ep({
  id,
  tag,
  method,
  path,
  summary,
  description,
  auth = "bearer",
  pathParams = [],
  query = [],
  body = null,
  // Alternative to `body`: a template with radio variants and checkbox toggles — see
  // bodyBuilder.js. `body` becomes the template's default output.
  bodyBuilder = null,
  files = [],
  capture = null,
  enums = null,
  // (item) => [[label, value], ...]: values the server computes from a body row, shown under it.
  computed = null,
}) {
  const effectiveBody = bodyBuilder
    ? buildBody(bodyBuilder, bodyBuilder.variants[0].id, defaultToggles(bodyBuilder))
    : body
  return {
    id,
    tag,
    method,
    path,
    summary,
    description,
    auth,
    pathParams,
    query,
    body: effectiveBody,
    bodyBuilder,
    computed,
    files,
    capture,
    enums: enums || RESOURCE_ENUMS[tag] || null,
    fields: effectiveBody == null ? null : bodyFieldsFor({ id, tag }),
  }
}

export const tags = [
  {
    id: "plans",
    name: "Plans",
    description: "Super Admin only. Create, list, update, and delete packages. code is a free-form unique key (not limited to package_1–3).",
    enums: RESOURCE_ENUMS.plans,
  },
  {
    id: "auth",
    name: "Authentication",
    description:
      "Register store (Super Admin), then POS login. get/update me as used on Settings.",
    enums: RESOURCE_ENUMS.auth,
  },
  {
    id: "license",
    name: "License",
    description: "POS Activate page. license_key + device_uid binds this browser.",
    enums: RESOURCE_ENUMS.license,
  },
  {
    id: "devices",
    name: "POS devices",
    description: "POS shell sends heartbeat after login.",
    enums: RESOURCE_ENUMS.devices,
  },
  {
    id: "locations",
    name: "Locations",
    description:
      "Branches of the store. Store admin sees and creates all locations (create needs the plan to allow another location). Manager sees and edits only their own location. Each location has its own manager account.",
    enums: RESOURCE_ENUMS.locations,
  },
  {
    id: "store",
    name: "Store & tax",
    description: "Settings, Tax manager, and cart default tax. GET/PATCH stores/me, tax-rates.",
    enums: RESOURCE_ENUMS.store,
  },
  {
    id: "shifts",
    name: "Register sessions",
    description: "Register page + POS shell current session.",
    enums: RESOURCE_ENUMS.shifts,
  },
  {
    id: "categories",
    name: "Categories",
    description: "POS catalog tabs and Categories page.",
    enums: RESOURCE_ENUMS.categories,
  },
  {
    id: "products",
    name: "Products",
    description: "Products page, POS grid, expiry and weight managers. SKU is generated from title.",
    enums: RESOURCE_ENUMS.products,
  },
  {
    id: "inventory",
    name: "Inventory",
    description:
      "Inventory page and product opening/adjust qty via stock-movements. POST accepts movement_type stock_in, stock_out or adjustment; the other types are written by sales, refunds and transfers.",
    enums: RESOURCE_ENUMS.inventory,
  },
  {
    id: "customers",
    name: "Customers",
    description: "Customers page and POS checkout dropdown.",
    enums: RESOURCE_ENUMS.customers,
  },
  {
    id: "staff",
    name: "Staff",
    description: "Staff page. List and create cashier/manager.",
    enums: RESOURCE_ENUMS.staff,
  },
  {
    id: "offers",
    name: "Offers",
    description: "Offers page plus live cards on the Point of Sale tab.",
    enums: RESOURCE_ENUMS.offers,
  },
  {
    id: "orders",
    name: "Orders",
    description: "POS checkout, history, void, refund, receipts.",
    enums: RESOURCE_ENUMS.orders,
  },
  {
    id: "reports",
    name: "Reports",
    description: "Reports breakdown and profit & loss pages.",
    enums: RESOURCE_ENUMS.reports,
  },
  {
    id: "suppliers",
    name: "Suppliers",
    description: "Suppliers page add / edit / deactivate.",
    enums: RESOURCE_ENUMS.suppliers,
  },
  {
    id: "audit",
    name: "Audit logs",
    description: "Audit page. Read-only.",
    enums: RESOURCE_ENUMS.audit,
  },
  {
    id: "data",
    name: "Delete data",
    description:
      "Super Admin. Wipe the whole database (except SequelizeMeta), wipe one module, delete one row, or bulk-delete by ids.",
    enums: RESOURCE_ENUMS.data,
  },
]

export const endpoints = [
  ep({
    id: "plans-create",
    tag: "plans",
    method: "POST",
    path: "/api/v1/plans",
    summary: "Create plan",
    description:
      "Super Admin only. Upserts by code. code is any unique slug (not limited to package_1–3). type is monthly or yearly. features is a free-form string array.",
    auth: "superadmin",
    body: {
      code: "solo-pos",
      type: "monthly",
      name: "Solo",
      price_pkr: 2500,
      max_devices: 1,
      max_locations: 1,
      features: [],
      is_active: true,
    },
  }),
  ep({
    id: "plans-list",
    tag: "plans",
    method: "GET",
    path: "/api/v1/plans",
    summary: "Get plans",
    description: "Super Admin only. Active packages.",
    auth: "superadmin",
  }),
  ep({
    id: "plans-get",
    tag: "plans",
    method: "GET",
    path: "/api/v1/plans/:id",
    summary: "Get plan by id",
    description: "Super Admin only.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "plans-patch",
    tag: "plans",
    method: "PATCH",
    path: "/api/v1/plans/:id",
    summary: "Update plan",
    description: "Super Admin only.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Solo",
      type: "yearly",
      price_pkr: 2500,
      max_devices: 1,
      max_locations: 1,
      features: [],
      is_active: true,
    },
  }),
  ep({
    id: "plans-delete",
    tag: "plans",
    method: "DELETE",
    path: "/api/v1/plans/:id",
    summary: "Delete plan",
    description: "Super Admin only. 409 if any store still uses this plan.",
    auth: "superadmin",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "admin-register-superadmin",
    tag: "auth",
    method: "POST",
    path: "/api/v1/admin/superadmins",
    summary: "Register Super Admin",
    description:
      "Public only for the very first Super Admin (empty platform). After that it needs a Super Admin token, otherwise 403. Super Admin has no PIN and never signs in with one. Returns access_token + refresh_token.",
    auth: "public",
    body: {
      name: "Platform Super Admin",
      email: "superadmin@platform.local",
      password: "ChangeMeSuperAdmin1",
    },
    capture: {
      accessToken: "data.access_token",
      refreshToken: "data.refresh_token",
    },
  }),
  ep({
    id: "admin-create-store",
    tag: "auth",
    method: "POST",
    path: "/api/v1/admin/stores",
    summary: "Register store",
    description:
      "Super Admin. Creates store (slug from name), first location, store_admin, manager, and a pending license. POS then activates that key. Responses use store_number and location_number.",
    auth: "superadmin",
    body: {
      plan_id: UUID,
      name: "Demo Grocery",
      legal_name: "Demo Grocery Pvt Ltd",
      owner_name: "Ali Khan",
      business_type: "grocery",
      address: "Shop 12, Main Market",
      city: "Lahore",
      contact_email: "owner@demo-grocery.local",
      contact_phone: "03001234567",
      custom_domain: "www.demo-grocery.com",
      location_name: "Main Counter",
      location_address: "Shop 12, Main Market",
      location_city: "Lahore",
      location_phone: "03001234567",
      admin_name: "Store Admin",
      admin_email: "admin@demo-grocery.local",
      admin_phone: "03001111111",
      admin_password: "ChangeMe123",
      admin_pin: "1111",
      manager_name: "Floor Manager",
      manager_email: "manager@demo-grocery.local",
      manager_phone: "03002222222",
      manager_password: "ChangeMe123",
      manager_pin: "2222",
      pos_enabled: true,
      web_enabled: true,
      billing_status: "paid",
      amount: 0,
      method_note: "manual",
    },
    files: [
      { name: "logo", label: "Logo" },
      { name: "favicon", label: "Favicon" },
    ],
    capture: { licenseKey: "data.license.license_key" },
  }),
  ep({
    id: "auth-login",
    tag: "auth",
    method: "POST",
    path: "/api/v1/auth/login",
    summary: "Login (email)",
    description:
      "Email + password + channel, plus an optional device hint on POS (device_id or device_uid — either identifies the till that's signing in, used only to tag the session/token server-side; it isn't echoed back in the response). channel=web for the dashboard (default) returns access_token + refresh_token + expires_in, 1 hour access / 30 days refresh — renew with /auth/refresh. channel=pos for the POS app returns a single field instead, token (the access_token) — no refresh_token, no expires_in; POS tokens last 10 years since the till is mostly offline and can't call /auth/refresh, so there's nothing to renew. Store and license are resolved on the server, and an unknown/stale device hint doesn't fail the login. POS login needs store staff (store admin, manager, cashier), POS enabled on the store and an activated license (POST /licenses/validate), otherwise 403. The POS token stops working when the license is revoked/expired or POS is disabled for the store. If the same email + password exists in two stores the login returns 409. channel=pos's data also carries store{}, plus location{} for a manager or cashier (a store admin gets no location{} — they work across all locations and pick one per request with the X-Location-Id header, the Location dropdown at the top of these docs) — no license detail and no plan at all; both come back from POST /licenses/validate instead, to keep the login payload small.",
    auth: "public",
    body: {
      email: "manager@demo-grocery.local",
      password: "ChangeMe123",
      channel: "pos",
      device_uid: "",
    },
    capture: {
      accessToken: ["data.token", "data.access_token"],
      refreshToken: "data.refresh_token",
      role: "data.user.role",
    },
  }),
  ep({
    id: "auth-login-pin",
    tag: "auth",
    method: "POST",
    path: "/api/v1/auth/login",
    summary: "POS login (PIN)",
    description:
      "POS Login PIN tab. pin + channel, plus the same optional device_id / device_uid hint as POST /auth/login above; channel is always pos (PIN login is not available on the dashboard, channel=web returns 400). A PIN is unique only within one location, so the same PIN can exist at other locations or stores. If the PIN belongs to just one active staff member it signs in directly; if several share it, send device_uid (or device_id) of the till — its store and location pick the right user — otherwise 409. The store must have POS enabled and an activated license. Returns the same single-field token (10-year access_token, no refresh_token) and store{}/location{} shape as POST /auth/login above with channel=pos.",
    auth: "public",
    body: {
      pin: "2222",
      channel: "pos",
      device_uid: "",
    },
    capture: {
      accessToken: "data.token",
      role: "data.user.role",
    },
  }),
  ep({
    id: "auth-me",
    tag: "auth",
    method: "GET",
    path: "/api/v1/auth/me",
    summary: "Get auth me",
    description: "POS Settings → My account. The plain PIN is not returned here (only on Staff screens). License and devices are nested on location(s).",
  }),
  ep({
    id: "auth-patch-me",
    tag: "auth",
    method: "PATCH",
    path: "/api/v1/auth/me",
    summary: "Update auth me",
    description: "POS Settings → My account. Name and phone; change password (with current_password) or POS PIN.",
    body: { name: "Ahmed Malik", phone: "03000000000" },
  }),

  ep({
    id: "license-validate",
    tag: "license",
    method: "POST",
    path: "/api/v1/licenses/validate",
    summary: "Activate license",
    description:
      "POS Activate page. Rules: invalid / expired / revoked key -> success false, data.valid false. Device already registered on a valid key -> valid true. New device -> registered only if the store plan still has a free device slot (active devices across the store), otherwise 409 + valid false. A device the store deactivated gets 403. A new device is registered with location_id = null; the store admin assigns its branch later with PATCH /pos-devices/:id (an already registered device keeps its location). Response data — license_key, device_id (echoes back the device_uid you sent, or null if none was sent), status, starts_at, expires_at, already_registered, suspended_at, suspended_reason, valid, plan{} (id, code, name, max_devices, max_locations, features — id is the plan number, no separate top-level plan_number) — is the only POS-facing response carrying the license_key and the plan; POST /auth/login dropped both to keep the login payload small.",
    auth: "public",
    body: {
      license_key: "FROM_AUTHORIZE",
      device_uid: "",
      name: "Front Counter PC",
      platform: "Win32",
      app_version: "pos-web-1.0",
    },
    capture: { licenseKey: "data.license_key" },
  }),

  ep({
    id: "device-list",
    tag: "devices",
    method: "GET",
    path: "/api/v1/pos-devices",
    summary: "List POS devices",
    description:
      "Store admin sees POS devices across all stores. Manager sees every device in their current store. Response includes store_number and location_number.",
  }),
  ep({
    id: "device-create",
    tag: "devices",
    method: "POST",
    path: "/api/v1/pos-devices",
    summary: "Add POS device",
    description:
      "Store admin / manager. Location comes from JWT. device_uid is unique per store (browser id).",
    body: {
      device_uid: "front-counter-pc",
      name: "Front Counter PC",
      platform: "Win32",
      app_version: "pos-web-1.0",
    },
  }),
  ep({
    id: "device-heartbeat",
    tag: "devices",
    method: "PATCH",
    path: "/api/v1/pos-devices/:id/heartbeat",
    summary: "Device heartbeat",
    description: "POS shell every 60s after login.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {},
  }),

  ep({
    id: "location-list",
    tag: "locations",
    method: "GET",
    path: "/api/v1/locations",
    summary: "List locations",
    description:
      "Store admin: every branch of the store. Manager: only their own location. Each row includes location_number, is_default, is_active and its manager.",
  }),
  ep({
    id: "location-create",
    tag: "locations",
    method: "POST",
    path: "/api/v1/locations",
    summary: "Create location",
    description:
      "Store admin only. Creates the branch and its manager account in one step. 409 when the plan location limit (max_locations) is reached.",
    body: {
      name: "Gulberg Branch",
      address_line: "45 Main Boulevard, Gulberg",
      city: "Lahore",
      postal_code: "54660",
      phone: "03005555555",
      is_active: true,
      is_default: false,
      manager_name: "Branch Manager",
      manager_email: "gulberg@demo-grocery.local",
      manager_password: "ChangeMe123",
      manager_pin: "4444",
      manager_phone: "03005555556",
    },
  }),
  ep({
    id: "location-get",
    tag: "locations",
    method: "GET",
    path: "/api/v1/locations/:id",
    summary: "Get location",
    description: "Store admin: any branch. Manager: only their own location (404 otherwise).",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "location-patch",
    tag: "locations",
    method: "PATCH",
    path: "/api/v1/locations/:id",
    summary: "Update location",
    description:
      "Rename, change address / phone, set default or active, and update the branch manager (manager_* fields). Send at least one field.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Gulberg Branch",
      address_line: "45 Main Boulevard, Gulberg",
      city: "Lahore",
      postal_code: "54660",
      phone: "03005555555",
      is_active: true,
      is_default: false,
      manager_name: "Branch Manager",
      manager_email: "gulberg@demo-grocery.local",
      manager_password: "",
      manager_pin: "4444",
      manager_phone: "03005555556",
      manager_is_active: true,
    },
  }),

  ep({
    id: "store-me",
    tag: "store",
    method: "GET",
    path: "/api/v1/stores/me",
    summary: "Own store profile",
    description: "Settings, Tax manager, POS cart (default_tax_rate), history.",
  }),
  ep({
    id: "store-patch-me",
    tag: "store",
    method: "PATCH",
    path: "/api/v1/stores/me",
    summary: "Update store",
    description:
      "Settings and Tax manager. Optional logo and favicon files. Suspension, go-live, slug, custom domain and account manager are Super Admin only (PATCH /admin/stores/:id) and are ignored here.",
    files: [
      { name: "logo", label: "Logo" },
      { name: "favicon", label: "Favicon" },
    ],
    body: {
      name: "Fatima Stationers",
      legal_name: "Fatima Stationers Pvt Ltd",
      owner_name: "Fatima Khan",
      business_type: "retail",
      address: "Main Market, Lahore",
      city: "Lahore",
      contact_email: "hello@fatima.local",
      contact_phone: "03001234567",
      logo_url: "",
      favicon_url: "",
      currency: "PKR",
      timezone: "Asia/Karachi",
      ntn: "1234567-8",
      strn: "3277876123456",
      fbr_invoice_enabled: false,
      charge_tax_on_sales: true,
      default_tax_rate: 17,
      expiry_warning_days: 30,
      expiry_critical_days: 7,
      receipt_footer: "Thank you for shopping",
      pos_enabled: true,
      web_enabled: true,
      default_location_id: UUID,
    },
  }),
  ep({
    id: "tax-get",
    tag: "store",
    method: "GET",
    path: "/api/v1/tax-rates",
    summary: "List GST rates",
    description: "Tax manager load.",
  }),
  ep({
    id: "tax-put",
    tag: "store",
    method: "PUT",
    path: "/api/v1/tax-rates",
    summary: "Save GST rates",
    description:
      "POS Tax manager. Updates payment GST rows plus store ntn/strn, charge_tax_on_sales, fbr_invoice_enabled, and default_tax_rate.",
    body: {
      ntn: "1234567-8",
      strn: "3277876123456",
      charge_tax_on_sales: true,
      fbr_invoice_enabled: false,
      default_tax_rate: 17,
      rates: [
        { payment_method: "cash", gst_percent: 0 },
        { payment_method: "card", gst_percent: 0 },
        { payment_method: "jazzcash", gst_percent: 0 },
        { payment_method: "easypaisa", gst_percent: 0 },
        { payment_method: "cod", gst_percent: 0 },
      ],
    },
  }),

  ep({
    id: "shift-current",
    tag: "shifts",
    method: "GET",
    path: "/api/v1/register-sessions/current",
    summary: "Open session",
    description: "POS shell. Null if register is closed. Location comes from JWT. Includes store_number and location_number.",
    query: [{ name: "device_id", default: "", required: false }],
  }),
  ep({
    id: "shift-list",
    tag: "shifts",
    method: "GET",
    path: "/api/v1/register-sessions",
    summary: "Shift history",
    description: "Register page. Location comes from JWT for manager/cashier. Includes store_number and location_number.",
  }),
  ep({
    id: "shift-clock-in",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/register-sessions",
    summary: "Clock in",
    description: "Register page. Required before POS checkout. Location comes from JWT. Response is intentionally minimal — just { session_number, opened_at } — not the full session record.",
    body: {
      opening_cash: 5000,
      device_id: UUID,
    },
  }),
  ep({
    id: "shift-clock-out",
    tag: "shifts",
    method: "POST",
    path: "/api/v1/register-sessions/:id/clock-out",
    summary: "Clock out",
    description: "Register page. :id accepts either the session's UUID id or its short session_number (e.g. 1) — use whichever the till has on hand. Response is intentionally minimal — just { session_number, closed_at, counted_cash } — not the full session record.",
    pathParams: [{ name: "Session Number", default: "1", required: true }],
    body: {
      counted_cash: 16450,
    },
  }),

  ep({
    id: "cat-list",
    tag: "categories",
    method: "GET",
    path: "/api/v1/categories",
    summary: "List categories",
    description: "POS grid filter, Products, Categories, Offers.",
  }),
  ep({
    id: "cat-create",
    tag: "categories",
    method: "POST",
    path: "/api/v1/categories",
    summary: "Create category",
    description: "Categories page and Products quick-add. Only name is required. The Has Category Tax / Has Category Discount checkboxes only add or remove the tax_* / discount_* fields in this example — they are not fields themselves and nothing is stored for them; tax/discount apply whenever their type + value are sent. Show Optional Fields adds the rarely-needed fields. Creating the same category again is fine: the slug gets a -2, -3... suffix instead of an error. Optional category icon/image file. On channel=pos, the response is {success, message (\"Category Successfully Created\"), data: { id, name }} instead of the full created record — id here is the short category_number, not the internal UUID (PATCH/DELETE /categories/:id still needs the real UUID).",
    files: [{ name: "icon", label: "Category icon" }],
    bodyBuilder: {
      bulk: false,
      variants: [{ id: "default", label: null, rows: [categoryRow("Soap", 5, 5)] }],
      toggles: CATEGORY_TOGGLES,
    },
  }),
  ep({
    id: "cat-bulk",
    tag: "categories",
    method: "POST",
    path: "/api/v1/categories/bulk",
    summary: "Bulk create categories",
    description: "POS sync. Send { items: [ ...create category bodies ] } or a raw array. Same fields and rules as single create. On channel=pos, the response is {success, message (\"Categories Successfully Created\"), data: [ { id, name }, ... ]} (one entry per created category, in the same order) instead of the full per-item results. id is the short category_number, not the internal UUID.",
    bodyBuilder: {
      bulk: true,
      variants: [
        {
          id: "default",
          label: null,
          rows: [categoryRow("Soap", 5, 5), categoryRow("Daal", 10, 0)],
        },
      ],
      toggles: CATEGORY_TOGGLES,
    },
  }),
  ep({
    id: "cat-patch",
    tag: "categories",
    method: "PATCH",
    path: "/api/v1/categories/:id",
    summary: "Update category",
    pathParams: [{ name: "id", default: UUID, required: true }],
    files: [{ name: "icon", label: "Category icon" }],
    body: {
      name: "Drinks",
      tax_type: "percentage",
      tax_value: 17,
      discount_type: null,
      discount_value: null,
      is_active: true,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "cat-delete",
    tag: "categories",
    method: "DELETE",
    path: "/api/v1/categories/:id",
    summary: "Delete category",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "prod-list",
    tag: "products",
    method: "GET",
    path: "/api/v1/products",
    summary: "List products",
    description: "POS grid, Products, Inventory, Offers, Weight page.",
    query: [
      { name: "q", default: "", required: false },
      { name: "category_id", default: "", required: false },
    ],
  }),
  ep({
    id: "prod-create",
    tag: "products",
    method: "POST",
    path: "/api/v1/products",
    summary: "Create product",
    description: "Products page. Required: title, barcode (unique per store), category_id, and the prices — cost + price for a Loose Item; pack_size + pack_cost + pack_price for a Pack Product (each_unit_cost / each_unit_price are optional there and default to pack price ÷ pack_size). category_id is the category's number (e.g. 1); its UUID also works. image is a plain image URL saved as featured_image and images[0]; an empty string means no image. The Has Product Tax / Has Product Discount checkboxes only add or remove the tax_* / discount_* fields in this example — nothing is stored for them; tax/discount apply whenever their type + value are sent. Show Optional Fields adds the rarely-needed fields after image. The server computes the price after this product's own discount and then its own tax on the discounted price (e.g. 100 → 5% off → 95 → +5% GST → 99.75): total_price for a Loose Item, or total_price_each_unit and total_pack_price for a Pack Product — shown under the body below. Category tax, offers and store tax are added at checkout, not in these totals. Creating the same product again is fine as long as the barcode differs: slug and SKU get a -2, -3... suffix (a repeated barcode returns 409). There is no expiry_date on the product — expiry is per location via stock movements. Responses use the stored column names (cost_price, selling_price, pack_cost_price, pack_selling_price, total_price_each_unit, total_pack_price). On channel=pos, the response is {success, message (\"Product Successfully Created\"), data: { id, title }} — id is the short product_number, not the UUID.",
    bodyBuilder: productBuilder(false),
    computed: productTotals,
  }),
  ep({
    id: "prod-bulk",
    tag: "products",
    method: "POST",
    path: "/api/v1/products/bulk",
    summary: "Bulk create products",
    description: "POS sync. Send { items: [ ...create product bodies ] } or a raw array. JSON only (no files). Same fields and rules as single create (a Pack Product item sends is_pack_product, pack_size, pack_cost, pack_price). On channel=pos, the response is {success, message (\"Products Successfully Created\"), data: [ { id, title }, ... ]} (one entry per created product, in the same order) — id is the short product_number, not the UUID.",
    bodyBuilder: productBuilder(true),
    computed: productTotals,
  }),
  ep({
    id: "prod-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/:id",
    summary: "Update product",
    description: "Products page edit. Optional product image file. Expiry is set on product-stocks (per location), not on the product — there is no expiry_date field here at all. Prices use the same names as create (cost / price for a Loose Item; each_unit_cost, each_unit_price, pack_cost, pack_price for a Pack Product); clearing is_pack_product (setting it false) also clears pack_size and the pack prices. total_price / total_price_each_unit / total_pack_price are recomputed by the server.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    files: [{ name: "image", label: "Product image" }],
    body: {
      title: "1 Litre Pepsi",
      category_id: UUID,
      price: 90,
      tax_type: "percentage",
      tax_value: 17,
      is_pack_product: false,
      pack_size: null,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "prod-expiry",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/expiry",
    summary: "Expiry manager",
    description:
      "Expiry page. Dates come from product_stocks per location. Each row includes store_id, store_number, location_id, location_number, expiry_date.",
  }),
  ep({
    id: "prod-weight-list",
    tag: "products",
    method: "GET",
    path: "/api/v1/products/weight",
    summary: "Weight manager list",
    description: "Weight page.",
  }),
  ep({
    id: "stock-put",
    tag: "inventory",
    method: "PUT",
    path: "/api/v1/product-stocks/:productId",
    summary: "Set stock / expiry",
    description:
      "Set qty and per-location expiry_date. Location comes from JWT (or store default). Store admin may send location_id.",
    pathParams: [{ name: "productId", default: UUID, required: true }],
    body: {
      qty: 50,
      expiry_date: "2026-12-31",
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "prod-weight-patch",
    tag: "products",
    method: "PATCH",
    path: "/api/v1/products/:id/weight",
    summary: "Toggle weight flag",
    description: "Weight page.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { is_weight_based: true },
  }),

  ep({
    id: "movement-list",
    tag: "inventory",
    method: "GET",
    path: "/api/v1/stock-movements",
    summary: "Movement history",
    description: "Inventory page table. Returns store_name and location_name (not store_id_int / location_id_int).",
  }),
  ep({
    id: "movement-create",
    tag: "inventory",
    method: "POST",
    path: "/api/v1/stock-movements",
    summary: "Post movement",
    description: "Inventory page and product create/edit qty. The location comes from the token. product_id is the product's number (e.g. 1); its UUID also works. qty is the change: positive for stock_in, negative for stock_out, either sign for adjustment (e.g. -12 for an adjustment with reason sale). Show Optional Fields adds the visibility fields. On channel=pos, the response is {success, message (\"Stock Successfully Created\"), data} where data is the product's stock at this location after the movement: { product_id, qty } for a loose item, or { product_id, pack_size, number_of_packs, qty } for a pack product (number_of_packs = full packs in qty, e.g. stock_in 50 with pack_size 10 → 5 packs; a sale of 12 then leaves qty 38 → 3 full packs).",
    bodyBuilder: movementBuilder(false),
  }),
  ep({
    id: "movement-bulk",
    tag: "inventory",
    method: "POST",
    path: "/api/v1/stock-movements/bulk",
    summary: "Bulk stock movements",
    description: "POS sync. Send { items: [ ...movement bodies ] } or a raw array. Same fields and rules as a single movement. On channel=pos, the response is {success, message (\"Stock Successfully Created\"), data: [ ... ]} with one stock entry per created movement, in order — { product_id, qty } for loose items, { product_id, pack_size, number_of_packs, qty } for pack products.",
    bodyBuilder: movementBuilder(true),
  }),

  ep({
    id: "cust-list",
    tag: "customers",
    method: "GET",
    path: "/api/v1/customers",
    summary: "List customers",
    description: "Customers page and POS checkout dropdown.",
  }),
  ep({
    id: "cust-create",
    tag: "customers",
    method: "POST",
    path: "/api/v1/customers",
    summary: "Add customer",
    description: "Customers modal. total_debt and remaining_debt are independent (e.g. 1000 / 500). On channel=pos, the response is just {success, message} with data: null (\"Customer Successfully Created\") instead of the created record.",
    body: {
      name: "Ahmed Raza",
      phone: "03004444444",
      email: "ahmed@example.com",
      remaining_debt: 500,
      total_debt: 1000,
      debt_notes: "Opening udhaar",
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "cust-bulk",
    tag: "customers",
    method: "POST",
    path: "/api/v1/customers/bulk",
    summary: "Bulk create customers",
    description: "POS sync. Send { items: [ ...create customer bodies ] } or a raw array. On channel=pos, the response is just {success, message} with data: null (\"Customers Successfully Created\") instead of the per-item results.",
    body: {
      items: [
        {
          name: "Ahmed Raza",
          phone: "03004444444",
          email: "ahmed@example.com",
          remaining_debt: 500,
          total_debt: 1000,
          debt_notes: "Opening udhaar",
          is_pos_visible: true,
          is_web_visible: true,
          channel: "both",
        },
      ],
    },
  }),
  ep({
    id: "cust-patch",
    tag: "customers",
    method: "PATCH",
    path: "/api/v1/customers/:id",
    summary: "Update customer",
    description: "Customers edit. Accepts name/contact plus total_debt, remaining_debt, and debt_notes.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Ahmed Raza",
      phone: "03004444444",
      email: "ahmed@example.com",
      remaining_debt: 200,
      total_debt: 1000,
      debt_notes: "Will pay Friday",
      is_active: true,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),

  ep({
    id: "staff-list",
    tag: "staff",
    method: "GET",
    path: "/api/v1/staff",
    summary: "List staff",
    description: "Staff page. Response includes password: null (hashed in DB). Create returns the password you sent.",
  }),
  ep({
    id: "staff-create",
    tag: "staff",
    method: "POST",
    path: "/api/v1/staff",
    summary: "Create staff",
    description: "Staff page. A store admin or a manager can create a cashier or a manager; the new user gets the location from the token (no location_id needed). The PIN must be unique among the users of that location — the same PIN is fine at another location or store (PIN login then tells them apart by the till's device_uid). On channel=pos, the response is {success, message (\"Cashier Successfully Created\" / \"Manager Successfully Created\"), data: { id, name, role }} — id is the short user_number, not the UUID. Other channels get the full user, including the password you sent.",
    body: {
      name: "Cashier One",
      email: "cashier@demo-grocery.local",
      password: "ChangeMe123",
      pin: "3333",
      role: "cashier",
    },
  }),
  ep({
    id: "staff-bulk",
    tag: "staff",
    method: "POST",
    path: "/api/v1/staff/bulk",
    summary: "Bulk create staff",
    description: "POS sync. Send { items: [ ...create staff bodies ] } or a raw array. Same fields and rules as single create. On channel=pos, the response is {success, message, data: [ { id, name, role }, ... ]} (one per created user, in order); the message is \"Cashiers Successfully Created\" / \"Managers Successfully Created\", or \"Staff Successfully Created\" when the batch mixes roles.",
    body: {
      items: [
        {
          name: "Cashier One",
          email: "cashier@demo-grocery.local",
          password: "ChangeMe123",
          pin: "3333",
          role: "cashier",
        },
      ],
    },
  }),

  ep({
    id: "offer-list",
    tag: "offers",
    method: "GET",
    path: "/api/v1/offers",
    summary: "List offers",
    description: "Offers page (type=) and POS cards (pos=1).",
    query: [
      { name: "type", default: "", required: false },
      { name: "pos", default: "1", required: false },
    ],
  }),
  ep({
    id: "offer-create",
    tag: "offers",
    method: "POST",
    path: "/api/v1/offers",
    summary: "Create offer",
    description: "Offers page. One flat object creates the offer and its target together: the offer fields (name, type, apply_to, discount, quantities, dates) go to the offer, and category_id / product_id, promo_price and free_product_id go to its offer target. apply_to category needs category_id; apply_to product needs product_id — either as the short number (e.g. 1) or the UUID. type: promotional | flash_sale | bulk_discount | bogo. min_qty is for bulk_discount; buy_qty + get_qty are for bogo (buy 2 get 1 → every 3 items, 1 is free); promo_price is a flash_sale fixed price; free_product_id is the bogo free item. Several targets at once: send targets: [{ category_id }, ...] instead. On channel=pos, the response is {success, message (\"Offer Successfully Created\"), data: { id, type, name, category_id | product_id }} — id is the short offer_number and category_id / product_id the short number.",
    bodyBuilder: offerBuilder(false),
  }),
  ep({
    id: "offer-bulk",
    tag: "offers",
    method: "POST",
    path: "/api/v1/offers/bulk",
    summary: "Bulk create offers",
    description: "POS sync. Send { items: [ ...create offer bodies ] } or a raw array. Same flat fields and rules as single create. On channel=pos, the response is {success, message (\"Offers Successfully Created\"), data: [ { id, type, name, category_id | product_id }, ... ]} (one per created offer, in order).",
    bodyBuilder: offerBuilder(true),
  }),
  ep({
    id: "offer-targets-put",
    tag: "offers",
    method: "PUT",
    path: "/api/v1/offers/:id/targets",
    summary: "Set offer targets",
    description: "Replaces all targets of an offer (create already adds the first one). product_id / category_id / free_product_id take the short number (e.g. 1) or the UUID.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      targets: [{ category_id: 1, product_id: null, free_product_id: null, promo_price: null }],
    },
  }),
  ep({
    id: "offer-patch",
    tag: "offers",
    method: "PATCH",
    path: "/api/v1/offers/:id",
    summary: "Pause / activate offer",
    description: "Offers page toggle is_active.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { is_active: false },
  }),
  ep({
    id: "offer-delete",
    tag: "offers",
    method: "DELETE",
    path: "/api/v1/offers/:id",
    summary: "Deactivate offer",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "order-create",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders",
    summary: "POS checkout",
    description:
      "POS checkout. Catalog selling_price is used. Response order.tax splits default store tax, product tax, category tax, payment-method GST (mixed is split per method), and FBR (same invoice GST when fbr_invoice_enabled). Each item includes product_tax_* and category_tax_*.",
    body: {
      channel: "pos",
      is_pos_visible: true,
      is_web_visible: false,
      register_session_id: UUID,
      device_id: UUID,
      customer_id: null,
      tax_exempt: false,
      client_local_id: "pos-local-001",
      items: [
        {
          product_id: UUID,
          quantity: 2,
        },
      ],
      payments: [{ method: "cash", amount: 180 }],
      amount_paid: 200,
      payment_method: "cash",
    },
  }),
  ep({
    id: "order-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/bulk",
    summary: "Bulk create orders",
    description:
      "POS offline sync (Package 2/3). Send { items: [ ...order bodies ] } or a raw array. Each sale keeps its placed_at and is booked into the shift that was open at that time, even if that shift is closed now.",
    body: {
      items: [
        {
          channel: "pos",
          is_pos_visible: true,
          is_web_visible: false,
          register_session_id: UUID,
          device_id: UUID,
          client_local_id: "pos-local-001",
          placed_at: "2026-10-02T10:15:00.000Z",
          items: [{ product_id: UUID, quantity: 2 }],
          payments: [{ method: "cash", amount: 180 }],
          payment_method: "cash",
        },
      ],
    },
  }),
  ep({
    id: "order-list",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders",
    summary: "Sales history",
    description: "History and Cancelled pages.",
    query: [{ name: "channel", default: "pos", required: false }],
  }),
  ep({
    id: "order-get",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id",
    summary: "Order detail",
    description: "History refund modal.",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "order-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id/receipt",
    summary: "Order receipt",
    description: "History reprint.",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),
  ep({
    id: "order-refund",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/:id/refund",
    summary: "Refund item",
    description: "History page item refund.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      order_item_id: UUID,
      quantity: 1,
      reason: "Customer return",
    },
  }),
  ep({
    id: "order-refund-complete",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/:id/refund/complete",
    summary: "Refund remaining items",
    description: "Refunds remaining qty on every line of the order.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { reason: "Full return" },
  }),
  ep({
    id: "order-refund-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/refunds/bulk",
    summary: "Bulk item refunds",
    description: "POS sync. Each item needs order_id, order_item_id, quantity, reason.",
    body: {
      items: [
        {
          order_id: UUID,
          order_item_id: UUID,
          quantity: 1,
          reason: "Customer return",
        },
      ],
    },
  }),
  ep({
    id: "order-refund-complete-bulk",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/refunds/complete/bulk",
    summary: "Bulk complete order refunds",
    description: "POS sync. Refund remaining qty on all items of each order.",
    body: {
      items: [{ order_id: UUID, reason: "Full return" }],
    },
  }),
  ep({
    id: "order-cancelled",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/cancelled",
    summary: "Cancelled / voided",
    description: "Cancelled page.",
  }),
  ep({
    id: "order-refunds",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/refunds",
    summary: "Refund list",
    description: "History > Refund records. Store admin may filter by location_id; from / to filter by refund date.",
    query: [
      { name: "location_id", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
    ],
  }),
  ep({
    id: "order-sales-by-location",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/summary/locations",
    summary: "Sales by location",
    description:
      "Sales tabs summary per branch (store admin: every location or ?location_id=; manager: own branch). Each row: sales (completed totals), completed_orders, pending_orders + pending_amount, cancelled_orders (cancelled + voided), refunded_orders, refunds_count, refunds_amount, net_sales (sales minus partial refunds). Also totals. Filters: from, to (placed_at), channel, payment_method.",
    query: [
      { name: "location_id", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "channel", default: "", required: false },
      { name: "payment_method", default: "", required: false },
    ],
  }),
  ep({
    id: "order-refund-receipt",
    tag: "orders",
    method: "GET",
    path: "/api/v1/orders/:id/refunds/:refundId/receipt",
    summary: "Refund receipt",
    description: "Cancelled page reprint.",
    pathParams: [
      { name: "id", default: UUID, required: true },
      { name: "refundId", default: UUID, required: true },
    ],
  }),
  ep({
    id: "order-void",
    tag: "orders",
    method: "POST",
    path: "/api/v1/orders/:id/void",
    summary: "Void sale",
    description: "Cancelled page.",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: { reason: "POS void" },
  }),

  ep({
    id: "rep-breakdown",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/breakdown",
    summary: "POS reports breakdown",
    description:
      "Reports page (all tabs). sales_summary.totals and tax_breakdown split tax_collection into product, category, default store, payment GST, and FBR. Scope comes from JWT.",
    query: [
      { name: "period", default: "daily", required: false },
      { name: "channel", default: "pos", required: false },
    ],
  }),
  ep({
    id: "rep-profit",
    tag: "reports",
    method: "GET",
    path: "/api/v1/reports/profit",
    summary: "Gross profit & loss",
    description:
      "Profit & loss. Totals include sales_collected, cost, discounts, refunds, tax_collection (product, category, default store, payment GST, FBR), and gross_profit.",
    query: [
      { name: "period", default: "monthly", required: false },
      { name: "channel", default: "pos", required: false },
    ],
  }),

  ep({
    id: "sup-list",
    tag: "suppliers",
    method: "GET",
    path: "/api/v1/suppliers",
    summary: "List suppliers",
    description:
      "Each supplier has location_scope (all | selected), location_ids and locations. Store admin may filter with ?location_id= (suppliers that deliver to that branch, including all-location ones). A manager always gets only suppliers for their own branch.",
    query: [{ name: "location_id", default: "", required: false }],
  }),
  ep({
    id: "sup-create",
    tag: "suppliers",
    method: "POST",
    path: "/api/v1/suppliers",
    summary: "Add supplier",
    description:
      "location_scope all = supplies every branch. selected + location_ids = one branch (one id) or several branches (many ids); sending only location_ids also means selected. A manager's supplier is always for their own branch. Ledger stock entries are rejected (409) at branches the supplier does not serve. On channel=pos, the response is just {success, message} with data: null (\"Supplier Successfully Created\") instead of the created record.",
    body: {
      name: "Nestle Distributor",
      phone: "03006666666",
      email: "sales@distributor.local",
      address: "Industrial Area",
      payment_terms: "Net 15",
      location_scope: "selected",
      location_ids: [UUID],
      is_active: true,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "sup-bulk",
    tag: "suppliers",
    method: "POST",
    path: "/api/v1/suppliers/bulk",
    summary: "Bulk create suppliers",
    description: "POS sync. Send { items: [ ...create supplier bodies ] } or a raw array. On channel=pos, the response is just {success, message} with data: null (\"Suppliers Successfully Created\") instead of the per-item results.",
    body: {
      items: [
        {
          name: "Nestle Distributor",
          phone: "03006666666",
          email: "sales@distributor.local",
          address: "Industrial Area",
          payment_terms: "Net 15",
          is_pos_visible: true,
          is_web_visible: true,
          channel: "both",
        },
      ],
    },
  }),
  ep({
    id: "sup-patch",
    tag: "suppliers",
    method: "PATCH",
    path: "/api/v1/suppliers/:id",
    summary: "Update supplier",
    pathParams: [{ name: "id", default: UUID, required: true }],
    body: {
      name: "Nestle Distributor",
      phone: "03006666666",
      email: "sales@distributor.local",
      address: "Industrial Area",
      payment_terms: "Net 15",
      is_active: true,
      is_pos_visible: true,
      is_web_visible: true,
      channel: "both",
    },
  }),
  ep({
    id: "sup-delete",
    tag: "suppliers",
    method: "DELETE",
    path: "/api/v1/suppliers/:id",
    summary: "Deactivate supplier",
    pathParams: [{ name: "id", default: UUID, required: true }],
  }),

  ep({
    id: "audit-list",
    tag: "audit",
    method: "GET",
    path: "/api/v1/audit-logs",
    summary: "Store audit logs",
    description: "Audit page.",
  }),

  ep({
    id: "data-modules",
    tag: "data",
    method: "GET",
    path: "/api/v1/admin/data/modules",
    summary: "List wipeable modules",
    description: "Super Admin. Names you can pass to the delete-all / delete-one / bulk-delete routes.",
    auth: "superadmin",
  }),
  ep({
    id: "data-delete-all",
    tag: "data",
    method: "DELETE",
    path: "/api/v1/admin/data",
    summary: "Delete all database rows",
    description:
      "Super Admin. Deletes every row in every table except SequelizeMeta. You will need to register a Super Admin again.",
    auth: "superadmin",
  }),
  ...dataModuleDeleteEndpoints(),
]

function dataModuleDeleteEndpoints() {
  const modules = [
    "orders",
    "order_items",
    "order_refunds",
    "payments",
    "receipts",
    "categories",
    "products",
    "product_stocks",
    "customers",
    "suppliers",
    "stock_movements",
    "stock_transfers",
    "offers",
    "coupons",
    "carts",
    "addresses",
    "reviews",
    "staff",
    "users",
    "stores",
    "locations",
    "plans",
    "licenses",
    "pos_devices",
    "register_sessions",
    "billings",
    "store_banners",
    "audit_logs",
    "approval_requests",
  ]

  return modules.flatMap((name) => [
    ep({
      id: `data-${name}-all`,
      tag: "data",
      method: "DELETE",
      path: `/api/v1/admin/data/${name}`,
      summary: `Delete all ${name}`,
      description: `Super Admin. Deletes every row in the ${name} module (and its child rows).`,
      auth: "superadmin",
    }),
    ep({
      id: `data-${name}-one`,
      tag: "data",
      method: "DELETE",
      path: `/api/v1/admin/data/${name}/:id`,
      summary: `Delete ${name} by id`,
      description: `Super Admin. Deletes one ${name} row and related child rows.`,
      auth: "superadmin",
      pathParams: [{ name: "id", default: UUID, required: true }],
    }),
    ep({
      id: `data-${name}-bulk`,
      tag: "data",
      method: "POST",
      path: `/api/v1/admin/data/${name}/bulk-delete`,
      summary: `Bulk delete ${name}`,
      description: `Super Admin. Deletes multiple ${name} rows by id.`,
      auth: "superadmin",
      body: { ids: [UUID, "00000000-0000-4000-8000-000000000002"] },
    }),
  ])
}

export function endpointsByTag(tagId) {
  return endpoints.filter((item) => item.tag === tagId)
}
