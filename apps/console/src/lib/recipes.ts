// Recipe library hooks: list the org's recipes, read one's full document, list the built-in
// templates to author from, dry-run a recipe over a sample, and store (save) a recipe.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  DryRunInput,
  DryRunResult,
  Recipe,
  RecipeDetail,
  RecipeDocument,
  RecipeTemplate,
  StoredRecipe,
} from '@oraclous/api-client';
import { useApi } from './api.jsx';
import { useTokenStore } from './token-store.jsx';

export interface RecipesState {
  readonly recipes: readonly Recipe[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useRecipes(): RecipesState {
  const { recipes: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['recipes'],
    queryFn: () => client.list(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  return {
    recipes: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export interface RecipeState {
  readonly recipe: RecipeDetail | null;
  readonly isLoading: boolean;
  readonly isError: boolean;
}

export function useRecipe(recipeId: string): RecipeState {
  const { recipes: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['recipe', recipeId],
    queryFn: () => client.get(recipeId),
    enabled: isAuthenticated && recipeId !== '',
  });

  return {
    recipe: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export interface RecipeTemplatesState {
  readonly templates: readonly RecipeTemplate[];
  readonly isLoading: boolean;
  readonly isError: boolean;
}

// The built-in recipe templates to author a draft from (read-only; rarely changes).
export function useRecipeTemplates(): RecipeTemplatesState {
  const { recipes: client } = useApi();
  const { isAuthenticated } = useTokenStore();

  const query = useQuery({
    queryKey: ['recipe-templates'],
    queryFn: () => client.templates(),
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
  });

  return {
    templates: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

// Dry-run a recipe over a sample (preview, no writes). A mutation — the caller renders the result
// or a 422 error inline.
export function useDryRun() {
  const { recipes: client } = useApi();
  return useMutation({
    mutationFn: (input: DryRunInput): Promise<DryRunResult> => client.dryRun(input),
  });
}

// Persist a recipe document. On success the recipe list refreshes so the new tile appears; the
// caller handles the toast/close and renders a 422 inline (the drawer stays open).
export function useStoreRecipe() {
  const { recipes: client } = useApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipe: RecipeDocument): Promise<StoredRecipe> => client.store(recipe),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
