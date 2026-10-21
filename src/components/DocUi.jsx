import { useEffect, useRef } from "react"

/** Centered dialog: closes on Escape, on the backdrop and on the × button. */
export function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose()
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl ${
          wide ? "max-w-5xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-semibold text-slate-800">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded text-xl leading-none text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            ×
          </button>
        </div>
        <div className="overflow-auto p-5">{children}</div>
      </div>
    </div>
  )
}

/** A "View …" button for the row under an expanded endpoint. */
export function ViewButton({ label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50"
    >
      {label}
      {count != null ? (
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
          {count}
        </span>
      ) : null}
    </button>
  )
}

const TOKEN_RE =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:])/g

const TOKEN_CLASS = {
  key: "text-[#0b5cad]",
  string: "text-[#a31515]",
  number: "text-[#098658]",
  boolean: "text-[#7c3aed]",
  null: "text-[#7c3aed] italic",
  punct: "text-slate-500",
}

function tokenType(token) {
  if (token.startsWith('"')) return /:\s*$/.test(token) ? "key" : "string"
  if (token === "true" || token === "false") return "boolean"
  if (token === "null") return "null"
  if (/^[{}[\],:]$/.test(token)) return "punct"
  return "number"
}

/** JSON text as colored spans; anything that is not a token is kept as plain text. */
function highlightJson(text) {
  const out = []
  let last = 0
  let i = 0
  for (const match of text.matchAll(TOKEN_RE)) {
    if (match.index > last) out.push(text.slice(last, match.index))
    const token = match[0]
    const type = tokenType(token)
    if (type === "key") {
      const colon = token.lastIndexOf(":")
      out.push(
        <span key={i++} className={TOKEN_CLASS.key}>
          {token.slice(0, colon)}
        </span>,
        <span key={i++} className={TOKEN_CLASS.punct}>
          {token.slice(colon)}
        </span>
      )
    } else {
      out.push(
        <span key={i++} className={TOKEN_CLASS[type]}>
          {token}
        </span>
      )
    }
    last = match.index + token.length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

const CODE_TEXT = "font-mono text-sm leading-6"

/** Read-only, colored JSON. */
export function JsonView({ text, className = "" }) {
  return (
    <pre className={`overflow-auto whitespace-pre p-4 ${CODE_TEXT} text-slate-800 ${className}`}>
      {highlightJson(text)}
    </pre>
  )
}

/**
 * Editable, colored JSON: a transparent textarea on top of the highlighted text, scrolled
 * together, so typing works like a normal textarea.
 */
export function JsonEditor({ value, onChange, invalid }) {
  const preRef = useRef(null)
  const lines = Math.max(value.split("\n").length, 6)
  const syncScroll = (e) => {
    if (!preRef.current) return
    preRef.current.scrollTop = e.target.scrollTop
    preRef.current.scrollLeft = e.target.scrollLeft
  }
  return (
    <div
      className={`relative overflow-hidden rounded-md border bg-white ${
        invalid ? "border-red-400" : "border-slate-300 focus-within:border-[#4990e2]"
      }`}
      style={{ height: `${Math.min(lines, 26) * 1.5 + 2}rem` }}
    >
      <pre
        ref={preRef}
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre p-4 ${CODE_TEXT} text-slate-800`}
      >
        {highlightJson(value)}
        {"\n"}
      </pre>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        wrap="off"
        className={`absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent p-4 ${CODE_TEXT} text-transparent caret-slate-800 outline-none selection:bg-[#4990e2]/25`}
      />
    </div>
  )
}
