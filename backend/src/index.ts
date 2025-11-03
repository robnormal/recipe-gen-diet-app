import {
  searchFoods,
  listRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
} from './db';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
