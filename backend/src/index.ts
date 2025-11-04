import {
  searchFoods,
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  createIngredient,
  getIngredientById,
  getIngredientsByRecipeId,
  updateIngredient,
  deleteIngredient
} from './db';
import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors());
app.use(express.json());

function inputToNumber(x: unknown) {
  return typeof x === 'number' ? x : x ? parseInt(x as string) : null;
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

app.get('/api/foods/search', async (req, res) => {
  const queryString = req.query.q;
  if (!queryString || typeof queryString !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const words = queryString.trim().split(/\s+/);
  const limit = inputToNumber(req.query.limit) || 20;
  const offset = inputToNumber(req.query.offset) || 0;

  try {
    const { results, total } = await searchFoods(words, limit, offset);
    
    res.json({ results, pagination: { total, limit, offset } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});


// Recipes CRUD (recipe only; ingredients are not handled here)
app.get('/api/recipes', async (req, res) => {
  const userId = inputToNumber(req.query.userId);
  if (!userId) {
    return res.status(400).json({ error: 'Query parameter "userId" is required' });
  }

  const limit = inputToNumber(req.query.limit) || 20;
  const offset = inputToNumber(req.query.offset) || 0;

  try {
    const { results, total } = await listRecipes(userId, limit, offset);

    res.json({ results, pagination: { total, limit, offset } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const recipe = await getRecipeById(parseInt(id));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/recipes', async (req, res) => {
  const { user_id, name, description, instructions, servings, total_time_minutes } = req.body;

  if (!user_id || !name) {
    return res.status(400).json({ error: 'Fields "user_id" and "name" are required' });
  }

  try {
    const recipe = await createRecipe(
      parseInt(user_id),
      name,
      description ?? null,
      instructions ?? null,
      inputToNumber(servings),
      inputToNumber(total_time_minutes)
    );
    res.status(201).json(recipe);
  } catch (error: unknown) {
    if ((error as { code: string })?.code === '23505') {
      return res.status(409).json({ error: 'Recipe with that name already exists for this user' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, instructions, servings, total_time_minutes } = req.body;

  try {
    const recipe = await updateRecipe(
      parseInt(id),
      name ?? null,
      description ?? null,
      instructions ?? null,
      inputToNumber(servings),
      inputToNumber(total_time_minutes)
    );
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error: unknown) {
    if ((error as { code: string })?.code === '23505') {
      return res.status(409).json({ error: 'Recipe with that name already exists for this user' });
    }
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/recipes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await deleteRecipe(parseInt(id));
    if (!deleted) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Ingredients endpoints
app.get('/api/recipes/:recipeId/ingredients', async (req, res) => {
  const { recipeId } = req.params;

  // Verify recipe exists
  try {
    const recipe = await getRecipeById(parseInt(recipeId));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  try {
    const ingredients = await getIngredientsByRecipeId(parseInt(recipeId));
    res.json({ ingredients });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/recipes/:recipeId/ingredients', async (req, res) => {
  const { recipeId } = req.params;
  const { food_id, gram_weight, measure_unit_id, quantity } = req.body;

  if (!food_id || gram_weight === undefined) {
    return res.status(400).json({ error: 'Fields "food_id" and "gram_weight" are required' });
  }

  // Verify recipe exists
  try {
    const recipe = await getRecipeById(parseInt(recipeId));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  try {
    const ingredient = await createIngredient(
      parseInt(recipeId),
      parseInt(food_id),
      parseFloat(gram_weight),
      inputToNumber(measure_unit_id),
      quantity !== undefined ? parseFloat(quantity) : null
    );
    res.status(201).json(ingredient);
  } catch (error: unknown) {
    const pgError = error as { code: string; constraint?: string };
    if (pgError.code === '23503') {
      // Foreign key violation
      if (pgError.constraint?.includes('food_id')) {
        return res.status(404).json({ error: 'Food not found' });
      }
      if (pgError.constraint?.includes('measure_unit_id')) {
        return res.status(404).json({ error: 'Measure unit not found' });
      }
      return res.status(400).json({ error: 'Invalid reference' });
    }
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/recipes/:recipeId/ingredients/:ingredientId', async (req, res) => {
  const { recipeId, ingredientId } = req.params;
  const { food_id, gram_weight, measure_unit_id, quantity } = req.body;

  // Verify recipe exists
  try {
    const recipe = await getRecipeById(parseInt(recipeId));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  // Verify ingredient exists and belongs to recipe
  try {
    const existingIngredient = await getIngredientById(parseInt(ingredientId));
    if (!existingIngredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    if (existingIngredient.recipe_id !== parseInt(recipeId)) {
      return res.status(404).json({ error: 'Ingredient not found in this recipe' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  try {
    const ingredient = await updateIngredient(
      parseInt(ingredientId),
      food_id !== undefined ? parseInt(food_id) : null,
      gram_weight !== undefined ? parseFloat(gram_weight) : null,
      measure_unit_id !== undefined ? inputToNumber(measure_unit_id) : null,
      quantity !== undefined ? parseFloat(quantity) : null
    );
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.json(ingredient);
  } catch (error: unknown) {
    const pgError = error as { code: string; constraint?: string };
    if (pgError.code === '23503') {
      // Foreign key violation
      if (pgError.constraint?.includes('food_id')) {
        return res.status(404).json({ error: 'Food not found' });
      }
      if (pgError.constraint?.includes('measure_unit_id')) {
        return res.status(404).json({ error: 'Measure unit not found' });
      }
      return res.status(400).json({ error: 'Invalid reference' });
    }
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.delete('/api/recipes/:recipeId/ingredients/:ingredientId', async (req, res) => {
  const { recipeId, ingredientId } = req.params;

  // Verify recipe exists
  try {
    const recipe = await getRecipeById(parseInt(recipeId));
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  // Verify ingredient exists and belongs to recipe
  try {
    const existingIngredient = await getIngredientById(parseInt(ingredientId));
    if (!existingIngredient) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    if (existingIngredient.recipe_id !== parseInt(recipeId)) {
      return res.status(404).json({ error: 'Ingredient not found in this recipe' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database error' });
  }

  try {
    const deleted = await deleteIngredient(parseInt(ingredientId));
    if (!deleted) {
      return res.status(404).json({ error: 'Ingredient not found' });
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
