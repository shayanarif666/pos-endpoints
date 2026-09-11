const KEY = "pos-api-docs"

const LEGACY_PLAN_FLAGS = [
  "offline_enabled",
  "pin_override_enabled",
  "approval_enabled",
  "advanced_reports",
  "backup_restore_enabled",
  "multi_branch_enabled",
  "has_dedicated_am",
]

const defaults = {
  baseUrl: "https://pak-pos-backend-production.up.railway.app/",
  accessToken: "",
  refreshToken: "",
  licenseKey: "",
  bodies: {},
}

function pretty(value) {
  return JSON.stringify(value, null, 2)
}

export function migrateLegacyPlanBody(text) {
  if (!text) return text
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return text
    let changed = false
    const present = LEGACY_PLAN_FLAGS.filter((key) =>
      Object.prototype.hasOwnProperty.call(obj, key)
    )
    if (present.length) {
      const features = Array.isArray(obj.features)
        ? obj.features.filter((item) => typeof item === "string" && item.trim())
        : []
      for (const key of present) {
        if (obj[key] === true && !features.includes(key)) features.push(key)
        delete obj[key]
      }
      obj.features = features
      changed = true
    }
    if ("location_id" in obj) {
      delete obj.location_id
      changed = true
    }
    if ("store_id" in obj) {
      delete obj.store_id
      changed = true
    }
    return changed ? pretty(obj) : text
  } catch {
    return text
  }
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...defaults }
    const parsed = { ...defaults, ...JSON.parse(raw) }
    const bodies = {}
    for (const [id, text] of Object.entries(parsed.bodies || {})) {
      bodies[id] = migrateLegacyPlanBody(text)
    }
    return { ...parsed, bodies }
  } catch {
    return { ...defaults }
  }
}

export function saveSession(next) {
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function defaultHeaders(auth, method, { accessToken }, { multipart = false } = {}) {
  const headers = { Accept: "application/json" }
  if (!multipart && method !== "GET" && method !== "DELETE") {
    headers["Content-Type"] = "application/json"
  }
  if (auth !== "public" && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }
  return headers
}

export function getByPath(obj, path) {
  return path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj)
}
