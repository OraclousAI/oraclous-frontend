// Diagram — the dispatcher for a verified DiagramSpec. RichMessage hands it a spec already parsed +
// coerced (coerceDiagramSpec): every fact in it is GROUNDED (verified server-side, re-checked + number-
// scrubbed client-side), so this component only has to lay it out. It wraps the chosen layout in a
// single <figure role="img"> whose aria-label VERBALISES the whole diagram — every node with its
// verified value + confidence, and every edge — so a screen reader gets the same grounded story the
// sighted reader does. The visual layers are all aria-hidden; the figure's label is the text equivalent.
//
// Aesthetic matches the chat charts (MetricChart/BarChart) and the inline-SVG diagrams (LayerStack,
// RunTimeline): a hairline-bordered --bg-soft card, a mono micro-title, --accent as the single
// emphasis. Gate 5: everything is React elements — no raw-HTML sink, not even in a comment.
//
// Color is never the sole signal: emphasis also thickens borders; confidence chips carry a WORD
// (DIRECT·H) alongside their colour; edges carry arrowheads + optional text labels.
import type { ReactNode } from 'react';
import type { DiagramSpec } from './spec.js';
import { speakNode } from './spec.js';
import { Layered } from './layouts/Layered.js';
import { Flow } from './layouts/Flow.js';
import { Timeline } from './layouts/Timeline.js';
import { Matrix } from './layouts/Matrix.js';
import { Network } from './layouts/Network.js';

/** Build the spoken sentence: title, then each node verbalised, then each edge, then caption. */
function ariaLabel(spec: DiagramSpec): string {
  const parts: string[] = [];
  const layoutWord: Record<DiagramSpec['layout'], string> = {
    layered: 'Layered diagram',
    flow: 'Flow diagram',
    timeline: 'Timeline',
    matrix: 'Matrix diagram',
    network: 'Network diagram',
  };
  parts.push(spec.title ? `${layoutWord[spec.layout]}: ${spec.title}.` : `${layoutWord[spec.layout]}.`);

  const labelOf = new Map(spec.nodes.map((n) => [n.id, n.label]));
  const groupOf = spec.groups ? new Map(spec.groups.map((g) => [g.id, g.label])) : undefined;

  for (const n of spec.nodes) {
    const lane = n.group && groupOf?.get(n.group) ? ` in ${groupOf.get(n.group)}` : '';
    parts.push(`${speakNode(n)}${lane}.`);
  }

  if (spec.edges?.length) {
    for (const e of spec.edges) {
      const from = labelOf.get(e.from) ?? e.from;
      const to = labelOf.get(e.to) ?? e.to;
      parts.push(e.label ? `${from} ${e.label} ${to}.` : `${from} connects to ${to}.`);
    }
  }

  if (spec.caption) parts.push(spec.caption);
  return parts.join(' ');
}

function Body({ spec }: { spec: DiagramSpec }): ReactNode {
  const edges = spec.edges ?? [];
  switch (spec.layout) {
    case 'layered':
      return <Layered nodes={spec.nodes} />;
    case 'flow':
      return <Flow nodes={spec.nodes} edges={edges} />;
    case 'timeline':
      return <Timeline nodes={spec.nodes} />;
    case 'matrix':
      return <Matrix nodes={spec.nodes} groups={spec.groups ?? []} />;
    case 'network':
      return <Network nodes={spec.nodes} edges={edges} />;
    default:
      // coerceDiagramSpec only emits the five layouts; stay graceful for any future shape.
      return null;
  }
}

export function Diagram({ spec }: { spec: DiagramSpec }): ReactNode {
  return (
    <figure
      role="img"
      aria-label={ariaLabel(spec)}
      style={{
        margin: 'var(--sp-3) 0',
        padding: 'var(--sp-3) var(--sp-4)',
        border: '1px solid var(--rule)',
        borderRadius: 'var(--r-3)',
        background: 'var(--bg-soft)',
      }}
    >
      {spec.title && (
        <figcaption
          className="t-dense"
          aria-hidden="true"
          style={{ fontWeight: 600, marginBottom: 'var(--sp-3)', letterSpacing: '-0.01em' }}
        >
          {spec.title}
        </figcaption>
      )}
      <Body spec={spec} />
      {spec.caption && (
        <p
          className="t-mono"
          aria-hidden="true"
          style={{
            margin: 'var(--sp-3) 0 0',
            fontSize: 'var(--t-tiny-size)',
            color: 'var(--fg-mute)',
            letterSpacing: '0.02em',
          }}
        >
          {spec.caption}
        </p>
      )}
    </figure>
  );
}
