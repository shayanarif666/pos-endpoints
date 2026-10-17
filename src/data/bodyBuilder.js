/*
 * Request bodies built from a template instead of a fixed example.
 *
 *   bodyBuilder: {
 *     bulk: true | false,                         // wrap rows as { items: [...] }
 *     variants: [{ id, label, rows: [ROW, ...] }], // radio buttons when there is more than one
 *     toggles: [{ id, label, default }],           // checkboxes
 *   }
 *   ROW = [[key, value, group?], ...]
 *
 * A field with a group is only included while that toggle is checked; field order is the order
 * in the row, so toggled fields land in their documented place rather than at the end.
 */

export function defaultToggles(builder) {
  return Object.fromEntries(builder.toggles.map((t) => [t.id, Boolean(t.default)]))
}

export function allToggles(builder) {
  return Object.fromEntries(builder.toggles.map((t) => [t.id, true]))
}

export function buildBody(builder, variantId, toggles) {
  const variant = builder.variants.find((v) => v.id === variantId) || builder.variants[0]
  const rows = variant.rows.map((row) =>
    Object.fromEntries(
      row.filter(([, , group]) => !group || toggles[group]).map(([key, value]) => [key, value])
    )
  )
  return builder.bulk ? { items: rows } : rows[0]
}
