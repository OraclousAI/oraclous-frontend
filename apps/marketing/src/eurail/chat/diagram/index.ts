// Barrel for the grounded-diagram renderer: the dispatcher, the spec types + coercion, and the atoms.
export { Diagram } from './Diagram.js';
export { coerceDiagramSpec, chipText, chipColor } from './spec.js';
export type {
  DiagramSpec,
  DiagramLayout,
  DiagramNode,
  DiagramEdge,
  DiagramGroup,
  NodeKind,
  NodeFact,
  FactProof,
  FactConfidence,
  FactStrength,
} from './spec.js';
