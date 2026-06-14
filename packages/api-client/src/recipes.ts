// Recipe library sub-client (GET /api/v1/recipes, /api/v1/recipes/{id}) — the org's ingestion
// recipe templates (format-0.2 documents). Read-only browser surface; the detail endpoint returns
// the full recipe document verbatim, typed below as RecipeDocument (the recipe engine owns the
// authoritative JSON Schema — we type only what the UI reads and pass unknown fields through).
import type { ApiTransport } from './transport';

export interface Recipe {
  readonly id: string;
  readonly version: number;
  readonly status: string;
  readonly sourceType: string;
  readonly concern: string;
}

// ── Recipe document (ingestion recipe format 0.2) ────────────────────────────
// A declarative JSON document validated server-side by a JSON Schema and interpreted mechanically
// (never executed as code; see ADR-022). The document uses snake_case field names natively — we keep
// them as-is rather than reshape, so the typed view matches the raw document the engine consumes.
// Every named field is OPTIONAL on the client (the gateway returns the document verbatim — render
// defensively) and each shape carries an index signature so unrecognised/forward-compat fields pass
// through untouched.

// Where a recipe applies: the source kind and a compact signature of the expected source shape.
export interface RecipeAppliesTo {
  readonly source_type?: string;
  readonly shape_signature?: string;
  readonly [key: string]: unknown;
}

// Authoring provenance for the recipe (who/what it was designed against).
export interface RecipeAuthoring {
  readonly authored_by?: string;
  readonly created?: string;
  readonly sample_basis?: string;
  readonly design_notes_ref?: string;
  readonly [key: string]: unknown;
}

// Engine defaults applied to projections unless a rule overrides them.
export interface RecipeDefaults {
  readonly provenance?: string;
  readonly materialize_fine_grain?: boolean;
  readonly [key: string]: unknown;
}

// One mapping rule: projects a source unit into a graph node or edge. Only the fields the UI reads
// are named (`project_to` discriminates node vs edge; `label` is a node's label, `type` an edge's
// type); the rest of the rule passes through.
export interface RecipeMapping {
  readonly id?: string;
  readonly project_to?: string;
  readonly label?: string;
  readonly type?: string;
  readonly [key: string]: unknown;
}

// An NLP extraction rule: pulls entities/relationships out of a field and links them to a node.
export interface RecipeExtraction {
  readonly id?: string;
  readonly ontology?: {
    readonly entity_types?: ReadonlyArray<{
      readonly name?: string;
      readonly [key: string]: unknown;
    }>;
    readonly relationship_types?: ReadonlyArray<{
      readonly name?: string;
      readonly [key: string]: unknown;
    }>;
    readonly [key: string]: unknown;
  };
  readonly link?: { readonly type?: string; readonly [key: string]: unknown };
  readonly [key: string]: unknown;
}

export interface RecipeDocument {
  readonly recipe_format_version?: string;
  readonly id?: string;
  readonly version?: number;
  readonly status?: string;
  readonly concern?: string;
  readonly applies_to?: RecipeAppliesTo;
  readonly defaults?: RecipeDefaults;
  readonly authoring?: RecipeAuthoring;
  readonly mappings?: ReadonlyArray<RecipeMapping>;
  readonly extractions?: ReadonlyArray<RecipeExtraction>;
  readonly similarities?: ReadonlyArray<Readonly<Record<string, unknown>>>;
  readonly [key: string]: unknown;
}

// The detail endpoint returns a full recipe document.
export type RecipeDetail = RecipeDocument;

interface RecipeWire {
  readonly id: string;
  readonly version: number;
  readonly status: string;
  readonly source_type: string;
  readonly concern: string;
}

export interface RecipesClient {
  // The org's recipe library (summaries).
  list(): Promise<Recipe[]>;
  // The full recipe document by id.
  get(recipeId: string): Promise<RecipeDetail>;
}

export function createRecipesClient(transport: ApiTransport): RecipesClient {
  return {
    async list(): Promise<Recipe[]> {
      const { data } = await transport.execute<RecipeWire[]>({
        method: 'GET',
        path: '/api/v1/recipes',
      });
      return (data ?? []).map((r) => ({
        id: r.id,
        version: r.version,
        status: r.status,
        sourceType: r.source_type,
        concern: r.concern,
      }));
    },
    async get(recipeId: string): Promise<RecipeDetail> {
      const { data } = await transport.execute<RecipeDetail>({
        method: 'GET',
        path: `/api/v1/recipes/${encodeURIComponent(recipeId)}`,
      });
      return data;
    },
  };
}
