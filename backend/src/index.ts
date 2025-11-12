import {
  searchFoods,
  listFoodCategories,
  checkFoodExists,
  getFoodPortions,
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
  getIngredientsWithFoods,
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

type ConstraintSpec = Record<string, [number, string]>

function inputToNumber(x: unknown) {
  return typeof x === 'number' ? x : x ? parseInt(x as string) : null;
}

// Error response utility
function sendError(res: express.Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

function sendPgConstraintError(res: express.Response, error: unknown, constraintSpec: ConstraintSpec): boolean {
  const pgError = error as { code: string; constraint?: string };
  if (pgError.code === '23505') {
    for (const key in constraintSpec) {
      // Unique constraint violation
      // Empty key is the default, so skip here
      if (key !== '' && pgError.constraint?.includes(key)) {
        sendError(res, constraintSpec[key][0], constraintSpec[key][1]);
        return true
      }
    }

    // Send default error message
    sendError(res, constraintSpec[''][0], constraintSpec[''][1]);
    return true
  }

  return false
}

// Async error handler wrapper
function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>
) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      sendGenericError(error, res);
    });
  };
}

// Authentication middleware
function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.session.userId) {
    return sendError(res, 401, 'Authentication required');
  }
  next();
}

// Recipe verification middleware
async function requireRecipe(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { recipeId } = req.params;

  try {
    const recipe = await getRecipeById(parseInt(recipeId));
    if (!recipe) {
      return sendError(res, 404, 'Recipe not found');
    }
    next();
  } catch (error) {
    sendGenericError(error, res);
  }
}

// Ingredient verification middleware
async function requireIngredient(req: express.Request, res: express.Response, next: express.NextFunction) {
  const { recipeId, ingredientId } = req.params;

  try {
    const existingIngredient = await getIngredientById(parseInt(ingredientId));
    if (!existingIngredient) {
      return sendError(res, 404, 'Ingredient not found');
    }
    if (existingIngredient.recipe_id !== parseInt(recipeId)) {
      return sendError(res, 404, 'Ingredient not found in this recipe');
    }
    next();
  } catch (error) {
    sendGenericError(error, res);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

// Authentication endpoints
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return sendError(res, 400, 'Fields "email" and "password" are required');
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return sendError(res, 400, 'Invalid email format');
  }

  const user = await authenticateUser(email.trim(), password);
  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
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
}));

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return sendError(res, 500, 'Failed to logout');
    }
    res.json({ message: 'Logged out successfully' });
  });
});

app.get('/api/auth/me', asyncHandler(async (req, res) => {
  if (!req.session.userId) {
    return sendError(res, 401, 'Not authenticated');
  }

  const user = await getUserById(req.session.userId);
  if (!user) {
    // Session references non-existent user, clear session
    req.session.destroy(() => {});
    return sendError(res, 401, 'User not found');
  }
  res.json(user);
}));

app.get('/api/foods/categories', requireAuth, asyncHandler(async (_req, res) => {
  const categories = await listFoodCategories();
  res.json({ categories });
}));

app.get('/api/foods/search', requireAuth, asyncHandler(async (req, res) => {
  const queryString = req.query.q;
  if (!queryString || typeof queryString !== 'string') {
    return sendError(res, 400, 'Query parameter "q" is required');
  }

  const words = queryString.trim().split(/\s+/);
  const limit = inputToNumber(req.query.limit) || 20;
  const offset = inputToNumber(req.query.offset) || 0;

  // Parse category IDs from query parameter
  let categoryIds: number[] | null = null;
  if (req.query.categories && typeof req.query.categories === 'string') {
    const categoryStrings = req.query.categories.split(',');
    categoryIds = categoryStrings
      .map(id => {
        const num = parseInt(id.trim());
        return isNaN(num) ? null : num;
      })
      .filter((id): id is number => id !== null);

    // If any category ID was invalid, return error
    if (categoryIds.length !== categoryStrings.length) {
      return sendError(res, 400, 'Invalid category IDs provided');
    }

    // If empty array after filtering, treat as no filter
    if (categoryIds.length === 0) {
      categoryIds = null;
    }
  }

  const { results, total } = await searchFoods(words, limit, offset, categoryIds);

  res.json({ results, pagination: { total, limit, offset } });
}));

app.get('/api/foods/:foodId/portions', requireAuth, asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const foodIdNum = parseInt(foodId);

  if (isNaN(foodIdNum)) {
    return sendError(res, 400, 'Invalid food ID');
  }

  // Check if food exists
  const foodExists = await checkFoodExists(foodIdNum);
  if (!foodExists) {
    return sendError(res, 404, 'Food not found');
  }

  const portions = await getFoodPortions(foodIdNum);
  res.json({ portions });
}));

// User registration
app.post('/api/users', async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return sendError(res, 400, 'Fields "email", "username", and "password" are required');
  }

  // Basic validation
  if (typeof email !== 'string' || !email.includes('@')) {
    return sendError(res, 400, 'Invalid email format');
  }
  if (typeof username !== 'string' || username.trim().length < 3) {
    return sendError(res, 400, 'Username must be at least 3 characters long');
  }
  if (typeof password !== 'string' || password.length < 6) {
    return sendError(res, 400, 'Password must be at least 6 characters long');
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
    if (sendPgConstraintError(res, error, {
      email: [409, 'Email already exists'],
      username: [409, 'Username already exists'],
      '': [409, 'User already exists'],
    })) {
      return;
    }
    sendGenericError(error, res);
  }
});


// Recipes CRUD (recipe only; ingredients are not handled here)
app.get('/api/recipes', requireAuth, asyncHandler(async (req, res) => {
  const userId = req.session.userId!; // requireAuth ensures this exists

  const limit = inputToNumber(req.query.limit) || 20;
  const offset = inputToNumber(req.query.offset) || 0;

  const { results, total } = await listRecipes(userId, limit, offset);

  res.json({ results, pagination: { total, limit, offset } });
}));

app.get('/api/recipes/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const recipe = await getRecipeById(parseInt(id));
  if (!recipe) {
    return sendError(res, 404, 'Recipe not found');
  }
  res.json(recipe);
}));

app.post('/api/recipes', requireAuth, async (req, res) => {
  const { name, description, instructions, servings, total_time_minutes } = req.body;
  const user_id = req.session.userId!; // requireAuth ensures this exists

  if (!name) {
    return sendError(res, 400, 'Field "name" is required');
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
      return sendError(res, 409, 'Recipe with that name already exists for this user');
    }
    sendError(res, 500, 'Database error');
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
      return sendError(res, 404, 'Recipe not found');
    }
    res.json(recipe);
  } catch (error: unknown) {
    if ((error as { code: string })?.code === '23505') {
      return sendError(res, 409, 'Recipe with that name already exists for this user');
    }
    sendError(res, 500, 'Database error');
  }
});

app.delete('/api/recipes/:id', requireAuth, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deleted = await deleteRecipe(parseInt(id));
  if (!deleted) {
    return sendError(res, 404, 'Recipe not found');
  }
  res.status(204).send();
}));

// Ingredients endpoints
app.get('/api/recipes/:recipeId/ingredients', requireAuth, requireRecipe, asyncHandler(async (req, res) => {
  const { recipeId } = req.params;

  const ingredients = await getIngredientsWithFoods(parseInt(recipeId));
  res.json({ ingredients });
}));

function sendGenericError(error: unknown, res: express.Response) {
  console.error(error);
  sendError(res, 500, 'Database error');
}

app.post('/api/recipes/:recipeId/ingredients', requireAuth, requireRecipe, async (req, res) => {
  const { recipeId } = req.params;
  const { food_id, gram_weight, food_portion_id, quantity } = req.body;

  if (!food_id || gram_weight === undefined) {
    return sendError(res, 400, 'Fields "food_id" and "gram_weight" are required');
  }

  try {
    const ingredient = await createIngredient(
      parseInt(recipeId),
      parseInt(food_id),
      parseFloat(gram_weight),
      inputToNumber(food_portion_id),
      quantity !== undefined ? parseFloat(quantity) : null
    );
    res.status(201).json(ingredient);
  } catch (error: unknown) {
    if (sendPgConstraintError(res, error, {
      food_id: [404, 'Food not found'],
      food_portion_id: [404, 'Food portion not found'],
      '': [400, 'Invalid reference'],
    })) {
      return;
    }
    sendGenericError(error, res);
  }
});

app.put('/api/recipes/:recipeId/ingredients/:ingredientId', requireAuth, requireRecipe, requireIngredient, async (req, res) => {
  const { ingredientId } = req.params;
  const { food_id, gram_weight, food_portion_id, quantity } = req.body;

  try {
    const ingredient = await updateIngredient(
      parseInt(ingredientId),
      food_id !== undefined ? parseInt(food_id) : null,
      gram_weight !== undefined ? parseFloat(gram_weight) : null,
      food_portion_id !== undefined ? inputToNumber(food_portion_id) : null,
      quantity !== undefined ? parseFloat(quantity) : null
    );
    if (!ingredient) {
      return sendError(res, 404, 'Ingredient not found');
    }
    res.json(ingredient);
  } catch (error: unknown) {
    if (sendPgConstraintError(res, error, {
      food_id: [404, 'Food not found'],
      food_portion_id: [404, 'Food portion not found'],
      '': [400, 'Invalid reference'],
    })) {
      return;
    }
    sendGenericError(error, res);
  }
});

app.delete('/api/recipes/:recipeId/ingredients/:ingredientId', requireAuth, requireRecipe, requireIngredient, asyncHandler(async (req, res) => {
  const { ingredientId } = req.params;

  const deleted = await deleteIngredient(parseInt(ingredientId));
  if (!deleted) {
    return sendError(res, 404, 'Ingredient not found');
  }
  res.status(204).send();
}));


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
