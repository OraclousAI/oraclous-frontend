// Recipe library hooks: list the org's recipes and read one's full document.
import { useQuery } from '@tanstack/react-query';
import type { Recipe, RecipeDetail } from '@oraclous/api-client';
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
