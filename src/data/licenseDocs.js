/* GET → Licenses: the store's license, short (the POS checks it; the dashboard shows its countdown). */

export const LICENSE_EPS = [
  {
    id: "license-current",
    tag: "license",
    method: "GET",
    path: "/api/v1/licenses/current",
    summary: "Store License",
    description:
      "The store's license — the one in use (active / trial first, then pending, suspended, expired, revoked; the latest when there are several): { store { id, name }, plan { id, code, name }, license_key, status (active | trial | pending | suspended | expired | revoked), starts_at, expires_at, expired (true once expires_at has passed), time_left { days, hours, minutes, seconds, total_seconds } (to expires_at; all 0 once passed), grace_days, devices { used (tills bound to it), max (the plan's limit) } }. storeId (query, optional): your store number (e.g. 1) or UUID — it must be the store of your token (else 403). Store admin / manager / cashier. 404 when the store has no license.",
    query: [{ name: "storeId", default: "1", required: false }],
    ownResponses: true,
    responses: [
      {
        label: "200 OK",
        status: 200,
        body: {
          success: true,
          message: "OK",
          data: {
            store: { id: 1, name: "Acadex" },
            plan: { id: 2, code: "standard", name: "Standard" },
            license_key: "PKPOS-7F3A-91C2-55D0",
            status: "active",
            starts_at: "2026-11-01T09:00:00.000Z",
            expires_at: "2026-12-01T09:00:00.000Z",
            expired: false,
            time_left: { days: 9, hours: 14, minutes: 32, seconds: 5, total_seconds: 829925 },
            grace_days: 0,
            devices: { used: 2, max: 3 },
          },
        },
      },
      { label: "403 — another store", status: 403, body: { success: false, message: "storeId must be the store of your token", errors: null } },
      { label: "404 — no license", status: 404, body: { success: false, message: "License not found", errors: null } },
    ],
  },
]
