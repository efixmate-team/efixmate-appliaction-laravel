"use client";

/**
 * Column
 * Declarative column definition. Renders nothing — PaginatedTable reads its props.
 *
 * @prop {string}   header           - Column header label
 * @prop {string}   [dataKey]        - Key into each row object
 * @prop {"text"|"serial"|"status"|"avatar"|"toggle"|"chips"|"link"|"actions"|"time"|"datetime"|"date"} [type]
 * @prop {function} [render]         - Custom renderer: (value, row, index) => ReactNode
 * @prop {boolean}  [sortable]       - Enable sort chevrons + onSort callback
 * @prop {string}   [width]          - Tailwind width class e.g. "w-32"
 * @prop {object}   [statusMap]      - Extend STATUS_THEMES for type="status"
 * @prop {Array}    [actions]        - For type="actions": [{ label, icon, onClick, variant }]
 * @prop {fn}       [onToggle]       - For type="toggle": called with (checked, row)
 * @prop {boolean|fn} [disabled]     - For type="toggle": disable toggle (or fn(row) => bool)
 */
export function Column() { return null; }
Column.displayName = "Column";
