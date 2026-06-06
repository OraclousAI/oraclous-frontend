// Recipe library sub-client (GET /api/v1/recipes, /api/v1/recipes/{id}) — the org's ingestion
// recipe templates (format-0.2 documents). Read-only browser surface; the full recipe document is an
// opaque JSON object returned verbatim by the detail endpoint.
import type { ApiTransport } from './transport';

export interface Recipe {
  readonly id: string;
  readonly version: number;
  readonly status: string;
  readonly sourceType: string;
  readonly concern: string;
}

export type RecipeDetail = Readonly<Record<string, unknown>>;

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
