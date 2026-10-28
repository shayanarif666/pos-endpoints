/**
 * Only the Base URL is shown. Tokens and the license key are still captured and kept in the
 * session (localStorage) and sent with every request — they are just not on screen.
 */
export function AuthorizeBar({ session, onChange }) {
  return (
    <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <label className="flex items-center gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Base URL
        <input
          className="h-9 flex-1 rounded-md border border-slate-300 px-3 font-mono text-sm font-normal normal-case text-slate-800 outline-none focus:border-[#49cc90] focus:ring-2 focus:ring-[#49cc90]/20"
          value={session.baseUrl}
          onChange={(e) => onChange({ baseUrl: e.target.value })}
        />
      </label>
    </div>
  )
}
