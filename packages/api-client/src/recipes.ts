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

// A built-in, author-ready recipe template: a concern label + a seed recipe document to open as a
// draft. (GET /api/v1/recipes/templates.)
export interface RecipeTemplate {
  readonly concern: string;
  readonly recipe: RecipeDocument;
}

// The result of persisting a recipe (POST /api/v1/recipes). The store endpoint persists a DRAFT
// (status "draft") and bumps the version; promotion to "promoted" is a separate step (not part of
// this surface).
export interface StoredRecipe {
  readonly id: string;
  readonly version: number;
  readonly status: string;
}

// Dry-run a recipe over a small sample — a preview with NO writes (POST /api/v1/recipes/dry-run).
export interface DryRunInput {
  readonly sample: string;
  readonly sourceType: string;
  // The recipe document to project with (the draft/saved document). Omit to let the backend
  // synthesise a default recipe from the sample shape.
  readonly recipe?: RecipeDocument;
  readonly ontology?: Readonly<Record<string, unknown>>;
}

// The dry-run preview. For structured sources it reports the projected labels + counts; for sources
// that need LLM extraction it returns requires_llm + a note instead. Fields are optional + a
// passthrough is kept (the engine owns the authoritative shape).
export interface DryRunResult {
  readonly source_type?: string;
  readonly recipe_id?: string;
  readonly node_labels?: Readonly<Record<string, number>>;
  readonly relationship_types?: readonly string[];
  readonly container_labels?: Readonly<Record<string, number>>;
  readonly counts?: {
    readonly nodes?: number;
    readonly edges?: number;
    readonly containers?: number;
    readonly properties?: number;
    readonly units_skipped?: number;
    readonly [key: string]: unknown;
  };
  readonly ontology_violations?: readonly unknown[];
  readonly warnings?: readonly string[];
  readonly requires_llm?: boolean;
  readonly note?: string;
  readonly [key: string]: unknown;
}

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
  // The built-in recipe templates to author from.
  templates(): Promise<RecipeTemplate[]>;
  // Preview a recipe over a sample — no writes; 422 on a malformed sample/recipe.
  dryRun(input: DryRunInput): Promise<DryRunResult>;
  // Persist a recipe document as a draft (201); 422 on an invalid document (see StoredRecipe).
  store(recipe: RecipeDocument): Promise<StoredRecipe>;
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
    async templates(): Promise<RecipeTemplate[]> {
      const { data } = await transport.execute<RecipeTemplate[]>({
        method: 'GET',
        path: '/api/v1/recipes/templates',
      });
      return Array.isArray(data) ? data : [];
    },
    async dryRun(input: DryRunInput): Promise<DryRunResult> {
      const body: {
        sample: string;
        source_type: string;
        recipe?: RecipeDocument;
        ontology?: Readonly<Record<string, unknown>>;
      } = { sample: input.sample, source_type: input.sourceType };
      if (input.recipe !== undefined) body.recipe = input.recipe;
      if (input.ontology !== undefined) body.ontology = input.ontology;
      const { data } = await transport.execute<DryRunResult>({
        method: 'POST',
        path: '/api/v1/recipes/dry-run',
        body,
      });
      return data;
    },
    async store(recipe: RecipeDocument): Promise<StoredRecipe> {
      const { data } = await transport.execute<StoredRecipe>({
        method: 'POST',
        path: '/api/v1/recipes',
        body: { recipe },
      });
      return data;
    },
  };
}
