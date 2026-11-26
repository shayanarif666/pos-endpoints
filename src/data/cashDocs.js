/*
 * Cash Movements (Pay In / Pay Out): cash put into or taken out of a till's drawer by hand — change put
 * in, the owner taking cash, a supplier paid, an expense, a salary advance. Used by the POS and the
 * dashboard (Cash Movements page). The replies are the backend's, with the docs' demo store names.
 */
import { AHMED, LOCATIONS, ZAYAN } from "./demo.js"

const L1 = LOCATIONS[1]
const BATCH = { id: 1, status: "open" }
const at = "2026-11-26T10:15:00.000Z"

const row = (fields) => ({
  location: L1,
  batch: BATCH,
  device_id: 1,
  staff: AHMED,
  party: null,
  from_user: null,
  to_user: null,
  attachment_url: null,
  local_id: null,
  occurred_at: at,
  created_at: at,
  updated_at: at,
  ...fields,
})

const ROWS = [
  row({ id: 1, type: "pay_in", amount: 1000, reason: "Change for the drawer", party: { type: "staff", id: 1, name: ZAYAN.name }, from_user: ZAYAN, to_user: AHMED, local_id: "CM-1-0001" }),
  row({ id: 2, type: "pay_out", amount: 750.5, reason: "Milk bill #88", party: { type: "supplier", id: 1, name: "Nestle Distributor" }, from_user: AHMED, attachment_url: "https://cdn.example.com/receipts/88.jpg", local_id: "CM-1-0002" }),
  row({ id: 3, type: "pay_out", amount: 120, reason: "Chai", party: { type: "other", id: null, name: "Chai wala" }, local_id: "CM-1-0003" }),
]

const TYPES = "type: pay_in (cash put into the drawer) | pay_out (cash taken out)"
const ROW_SHAPE =
  "Each row: { id (movement number), type, amount, reason, location { id, name }, batch { id, status } (null = no batch was open), device_id (device number), staff { id, name, role } (who entered it), party { type, id, name } (who the cash went to / came from; null = none), from_user / to_user { id, name, role } (the staff members who gave / took it), occurred_at, attachment_url, local_id, created_at, updated_at }."
const BATCH_NOTE =
  "Every movement is on a batch (the drawer of one shift): the batch sent (batchId), else the open batch of the device / staff member at the location — for an offline movement (occurred_at in the past) the batch that was open then; none found = saved with batch null. The batch's cash_in (Pay In) / cash_out (Pay Out) and expected cash (opening + cash sales + cash in − cash out) follow every create, edit and delete; on a closed batch its cash variance follows too."

const ok = (message, data, status = 200, extra = {}) => ({ label: `${status} OK`, status, body: { success: true, message, data, ...extra } })

export const CASH_EPS = [
  {
    id: "cash-bulk",
    tag: "cash",
    method: "POST",
    path: "/api/v1/cash-movements/bulk",
    summary: "Bulk Cash Movements (Pay In / Pay Out)",
    description: `{ storeId, locationId, staffId, deviceId, items: [ ...movements ] } — storeId, locationId, staffId and deviceId are sent once, before items[] (an item may carry its own staffId / deviceId / batchId). ${TYPES}; amount above 0; reason = why (free text: "Milk bill #88", "Chai", "Change for the drawer"). party_type supplier | customer | staff with party_id (that supplier / customer / staff number) — the reply gives its name; or party_name alone for anyone else (party_type other). from_user / to_user: the staff numbers of who gave and who took the cash (null when not a staff member: a supplier paid by the cashier = from_user the cashier, to_user null). ${BATCH_NOTE} local_id: the till's own id — the same local_id sent again returns the saved movement (no second one). Each item is saved on its own: one that fails is listed in failed[] ({ index, message, status }) and the rest still save; when every item fails the reply is that first error. Store admin, manager or cashier (a manager / cashier: their own location). ${ROW_SHAPE}`,
    body: {
      storeId: 1,
      locationId: 1,
      staffId: 2,
      deviceId: 1,
      items: [
        { local_id: "CM-1-0001", type: "pay_in", amount: 1000, reason: "Change for the drawer", party_type: "staff", party_id: 1, from_user: 1, to_user: 2, occurred_at: at },
        { local_id: "CM-1-0002", type: "pay_out", amount: 750.5, reason: "Milk bill #88", party_type: "supplier", party_id: 1, from_user: 2, attachment_url: "https://cdn.example.com/receipts/88.jpg", occurred_at: at },
        { local_id: "CM-1-0003", type: "pay_out", amount: 120, reason: "Chai", party_name: "Chai wala", occurred_at: at },
      ],
    },
    responses: [
      ok("Cash Movements Created", ROWS, 201),
      ok("Cash Movements Created", ROWS.slice(0, 2), 200, { failed: [{ index: 2, message: "amount must be a number above 0", status: 400 }] }),
      { label: "400 — every item failed", status: 400, body: { success: false, message: "type must be pay_in or pay_out", data: [], failed: [{ index: 0, message: "type must be pay_in or pay_out", status: 400 }] } },
    ],
  },
  {
    id: "cash-list",
    tag: "cash",
    noEnums: true,
    method: "GET",
    path: "/api/v1/cash-movements",
    summary: "Cash Movements",
    description: `The Pay In / Pay Out history, newest first. Filters: type (pay_in | pay_out), partyType (supplier | customer | staff | other), staffId (who entered it, staff number), batchId (batch number), deviceId (device number), locations (location numbers: locations=1,2 — store admin only; a manager / cashier only sees their own location), from / to (occurred_at, YYYY-MM-DD — to covers the whole day) or range (week | month | 6months | year), q (a text in the reason or the party name, or the movement number). Paged: page (from 1) and limit (1–200, default 20); next to data the reply carries pagination { page, limit, total, total_pages } and summary { pay_in, pay_out, net, count } — the totals of every matching movement (not only this page). Deleted movements are left out. ${ROW_SHAPE}`,
    query: [
      { name: "page", default: "1", required: false },
      { name: "limit", default: "20", required: false },
      { name: "type", default: "", required: false, values: ["pay_in", "pay_out"] },
      { name: "partyType", default: "", required: false, values: ["supplier", "customer", "staff", "other"] },
      { name: "staffId", default: "", required: false },
      { name: "batchId", default: "", required: false },
      { name: "deviceId", default: "", required: false },
      { name: "locations", default: "", required: false },
      { name: "from", default: "", required: false },
      { name: "to", default: "", required: false },
      { name: "range", default: "", required: false, values: ["week", "month", "6months", "year"] },
      { name: "q", default: "", required: false },
    ],
    responses: [
      ok("OK", [...ROWS].reverse(), 200, { pagination: { page: 1, limit: 20, total: 3, total_pages: 1 }, summary: { pay_in: 1000, pay_out: 870.5, net: 129.5, count: 3 } }),
    ],
  },
  {
    id: "cash-get",
    tag: "cash",
    noEnums: true,
    method: "GET",
    path: "/api/v1/cash-movements/:id",
    summary: "Cash Movement",
    description: `One movement. :id = the movement number (e.g. 2) or UUID. A manager / cashier: their own location only (else 404). ${ROW_SHAPE}`,
    pathParams: [{ name: "id", default: "2", required: true }],
    responses: [ok("Cash Movement", ROWS[1]), { label: "404", status: 404, body: { success: false, message: "Cash movement not found" } }],
  },
  {
    id: "cash-bulk-patch",
    tag: "cash",
    method: "PATCH",
    path: "/api/v1/cash-movements/bulk",
    summary: "Bulk Update Cash Movements",
    description: `The body of Bulk Cash Movements (POST /cash-movements/bulk), plus each row's id: { storeId, items: [{ id, …the same fields as the POST }] }. id = the movement number (1, 2, 3…; its UUID also works). Only the fields sent change: type, amount, reason, party_type / party_id / party_name, from_user / to_user, occurred_at, attachment_url, batchId (moves it to that batch, and to its location), deviceId, staffId. The batch's cash_in / cash_out and expected cash follow: the old figures come off the old batch and the new ones go onto the (new) batch. Each row saves on its own: a row that fails is listed in failed[] ({ index, message, status }) and the rest still save; when every row fails the reply is that first error. Reply data: the updated rows.`,
    body: { storeId: 1, items: [{ id: 2, amount: 800, reason: "Milk bill #88 (corrected)" }, { id: 3, type: "pay_in" }] },
    responses: [
      ok("Cash Movements Updated", [{ ...ROWS[1], amount: 800, reason: "Milk bill #88 (corrected)", updated_at: "2026-11-26T11:00:00.000Z" }, { ...ROWS[2], type: "pay_in", updated_at: "2026-11-26T11:00:00.000Z" }]),
      { label: "404 — every row failed", status: 404, body: { success: false, message: "Cash movement 9 not found", data: [], failed: [{ index: 0, message: "Cash movement 9 not found", status: 404 }] } },
    ],
  },
]
