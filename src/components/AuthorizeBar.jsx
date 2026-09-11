export function AuthorizeBar({ session, onChange, onClear, open, setOpen }) {
  const loggedIn = Boolean(session.accessToken)

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <label className="flex min-w-[280px] flex-1 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Base URL
          <input
            className="h-9 flex-1 rounded border border-slate-300 px-3 font-mono text-sm font-normal normal-case text-slate-800 outline-none focus:border-[#89bf04]"
            value={session.baseUrl}
            onChange={(e) => onChange({ baseUrl: e.target.value })}
          />
        </label>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`h-9 rounded border px-4 text-sm font-semibold ${
            loggedIn
              ? "border-[#49cc90] bg-[#49cc90] text-white"
              : "border-[#89bf04] bg-white text-[#547f00] hover:bg-[#f3f8e6]"
          }`}
        >
          {loggedIn ? "Authorized" : "Authorize"}
        </button>
        {loggedIn ? (
          <button
            type="button"
            onClick={onClear}
            className="h-9 rounded border border-slate-300 px-3 text-sm text-slate-600 hover:bg-slate-50"
          >
            Clear tokens
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="grid gap-3 border-t border-slate-100 bg-[#fafafa] px-4 py-4 md:grid-cols-2">
          <Field
            label="Authorization: Bearer access_token"
            hint="Filled automatically after login. Sent on every authenticated request."
            value={session.accessToken}
            onChange={(accessToken) => onChange({ accessToken })}
            mono
          />
          <Field
            label="refresh_token"
            hint="Used by POST /auth/refresh. Paste into that body or keep here."
            value={session.refreshToken}
            onChange={(refreshToken) => onChange({ refreshToken })}
            mono
          />
          <Field
            label="license_key"
            hint="POS first screen. Auto-captured from store create / validate."
            value={session.licenseKey}
            onChange={(licenseKey) => onChange({ licenseKey })}
            mono
          />
          <p className="self-end text-xs leading-5 text-slate-500">
            Envelope is always <code className="rounded bg-slate-200 px-1">{`{ success, message, data }`}</code>.
            Tenant comes from JWT <code className="rounded bg-slate-200 px-1">store_id</code>. POS checkout must send{" "}
            <code className="rounded bg-slate-200 px-1">channel: "pos"</code>.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, hint, value, onChange, mono }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700">{label}</span>
      <input
        className={`mt-1 h-9 w-full rounded border border-slate-300 px-3 text-sm outline-none focus:border-[#89bf04] ${
          mono ? "font-mono" : ""
        }`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span className="mt-1 block text-xs text-slate-500">{hint}</span>
    </label>
  )
}
