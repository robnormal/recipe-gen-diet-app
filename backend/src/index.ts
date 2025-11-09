import {
  searchFoods,
  createUser,
  authenticateUser,
  getUserById,
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
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { pool } from './db_connection';

// Extend express-session types to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

const PORT = process.env.PORT;
const app = express();

// Configure CORS to allow credentials
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Configure express-session with PostgreSQL store
const PgSession = connectPgSimple(session);
const sessionSecret = process.env.SESSION_SECRET || 'change-this-secret-in-production';

app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session'
  }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

function inputToNumber(x: unknown) {
  return typeof x === 'number' ? x : x ? parseInt(x as string) : null;
}

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Authentication endpoints
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Fields "email" and "password" are required' });
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const user = await authenticateUser(email.trim(), password);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Store userId in session
    req.session.userId = user.id;

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await getUserById(req.session.userId);
    if (!user) {
      // Session references non-existent user, clear session
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/foods/search', requireAuth, async (req, res) => {
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

// User registration
app.post('/api/users', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ error: 'Fields "email", "username", and "password" are required' });
  }

  // Basic validation
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  if (typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const user = await createUser(email.trim(), username.trim(), password);
    // Don't return password hash
    res.status(201).json({
      id: user.id,
      email: user.email,
      username: user.username,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error: unknown) {
    const pgError = error as { code: string; constraint?: string };
    if (pgError.code === '23505') {
      // Unique constraint violation
      if (pgError.constraint?.includes('email')) {
        return res.status(409).json({ error: 'Email already exists' });
      }
      if (pgError.constraint?.includes('username')) {
        return res.status(409).json({ error: 'Username already exists' });
      }
      return res.status(409).json({ error: 'User already exists' });
    }
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Recipes CRUD (recipe only; ingredients are not handled here)
app.get('/api/recipes', requireAuth, async (req, res) => {
  const userId = req.session.userId!; // requireAuth ensures this exists

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

app.get('/api/recipes/:id', requireAuth, async (req, res) => {
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

app.post('/api/recipes', requireAuth, async (req, res) => {
  const { name, description, instructions, servings, total_time_minutes } = req.body;
  const user_id = req.session.userId!; // requireAuth ensures this exists

  if (!name) {
    return res.status(400).json({ error: 'Field "name" is required' });
  }

  try {
    const recipe = await createRecipe(
      user_id,
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

app.put('/api/recipes/:id', requireAuth, async (req, res) => {
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

app.delete('/api/recipes/:id', requireAuth, async (req, res) => {
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
app.get('/api/recipes/:recipeId/ingredients', requireAuth, async (req, res) => {
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

app.post('/api/recipes/:recipeId/ingredients', requireAuth, async (req, res) => {
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

app.put('/api/recipes/:recipeId/ingredients/:ingredientId', requireAuth, async (req, res) => {
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

app.delete('/api/recipes/:recipeId/ingredients/:ingredientId', requireAuth, async (req, res) => {
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
