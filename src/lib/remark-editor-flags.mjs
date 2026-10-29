// Wraps [JIM: …] and [TO VERIFY: …] in <mark class="editor-flag"> so they stand out on preview
// builds. Production builds refuse to publish an article that still contains them.
import { visit } from 'unist-util-visit';

const FLAG = /\[(?:JIM|TO VERIFY)\b[^\]]*\]/g;

export default function remarkEditorFlags() {
  return (tree) => {
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || index == null || !FLAG.test(node.value)) return;
      FLAG.lastIndex = 0;
      const parts = [];
      let last = 0;
      for (const m of node.value.matchAll(FLAG)) {
        if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
        parts.push({
          type: 'emphasis',
          data: { hName: 'mark', hProperties: { className: ['editor-flag'] } },
          children: [{ type: 'text', value: m[0] }],
        });
        last = m.index + m[0].length;
      }
      if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}
