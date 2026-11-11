// Prepares Markdown tables for the responsive table style in global.css.
// - Wraps each table in <div class="table-wrap"> (a scroll fallback for very wide tables).
// - Gives every body cell a data-label with its column header, so on phones each row can be
//   shown as a stacked card with the header as a small label above each value.
// - Adds ARIA table roles, because changing a table's CSS display can make some browsers
//   (Safari in particular) drop its table semantics for screen readers.
// Runs at build time; no JavaScript reaches the reader.

const text = (node) =>
  node.type === 'text' ? node.value : (node.children || []).map(text).join('');

const els = (node, tag) => (node.children || []).filter((c) => c.type === 'element' && c.tagName === tag);

function prepare(table) {
  const thead = els(table, 'thead')[0];
  const tbody = els(table, 'tbody')[0];
  const headRow = thead && els(thead, 'tr')[0];
  const labels = headRow ? els(headRow, 'th').map((th) => text(th).trim()) : [];

  table.properties = { ...table.properties, role: 'table', dataCols: String(labels.length || '') };
  for (const section of [thead, tbody].filter(Boolean)) {
    section.properties = { ...section.properties, role: 'rowgroup' };
    for (const tr of els(section, 'tr')) {
      tr.properties = { ...tr.properties, role: 'row' };
      for (const cell of (tr.children || []).filter((c) => c.type === 'element')) {
        const isHead = section === thead;
        cell.properties = { ...cell.properties, role: isHead ? 'columnheader' : 'cell' };
      }
    }
  }
  if (tbody) {
    for (const tr of els(tbody, 'tr')) {
      els(tr, 'td').forEach((td, i) => {
        if (labels[i]) td.properties = { ...td.properties, dataLabel: labels[i] };
      });
    }
  }
}

function walk(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    if (child.type === 'element' && child.tagName === 'table' && !child.properties?.className?.includes('data')) {
      prepare(child);
      return { type: 'element', tagName: 'div', properties: { className: ['table-wrap'] }, children: [child] };
    }
    walk(child);
    return child;
  });
}

export default function rehypeTables() {
  return (tree) => walk(tree);
}
