import {
  searchFoods,
  listFoodCategories,
  checkFoodExists,
  getFoodPortions,
  getFoodById,
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
import OpenAI from 'openai';

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

// Recipe generation endpoint
app.post('/api/recipes/generate', requireAuth, asyncHandler(async (req, res) => {
  const { name, prompt } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return sendError(res, 400, 'Field "name" is required');
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return sendError(res, 400, 'Field "prompt" is required');
  }

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    return sendError(res, 500, 'OpenAI API key not configured');
  }

  const openai = new OpenAI({ apiKey: openaiApiKey });

  // OpenAI tools/functions
  const tools = [
    {
      type: 'function' as const,
      function: {
        name: 'search_foods',
        description: 'Search for foods in the database by query string. Returns food IDs, descriptions, and calorie density.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to find foods (e.g., "chicken breast", "olive oil")'
            },
            categories: {
              type: 'array',
              items: { type: 'number' },
              description: 'Optional array of food category IDs to filter results'
            }
          },
          required: ['query']
        }
      }
    },
    {
      type: 'function' as const,
      function: {
        name: 'get_food_portions',
        description: 'Get available portion sizes and measurements for a specific food item.',
        parameters: {
          type: 'object',
          properties: {
            foodId: {
              type: 'number',
              description: 'The ID of the food to get portions for'
            }
          },
          required: ['foodId']
        }
      }
    }
  ];

  // The structure for OpenAI's structured outputs
  const recipeStructuredResponse = {
    type: 'object',
    properties: {
      description: { type: 'string', description: 'Brief description of the recipe' },
      instructions: { type: ['string', 'null'], description: 'Optional step-by-step instructions or null' },
      servings: { type: ['number', 'null'], description: 'Optional number of servings' },
      total_time_minutes: { type: ['number', 'null'], description: 'Optional total time to cook in minutes' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            food_id: { type: 'number', description: 'Food ID from database' },
            gram_weight: { type: 'number', description: 'Ingredient weight in grams' },
            food_portion_id: { type: ['number', 'null'], description: 'Portion ID (optional)' },
            quantity: { type: ['number', 'null'], description: 'Quantity of the portion (optional)' }
          },
          required: ['food_id', 'gram_weight']
        }
      }
    },
    required: ['description', 'ingredients']
  };

  // System prompt for the LLM
  const systemPrompt = `You are a recipe generation assistant. Your task is to help create a recipe based on the user's prompt.

When generating a recipe:
1. Search for foods using the search_foods function to find ingredients in the database
2. Use get_food_portions to understand available measurements for each food
3. Return a structured recipe as described in the function schema

Important: Only use foods that exist in the database. Always search for foods before including them in the recipe.`;

  const userPrompt = `Generate a recipe named "${name.trim()}" based on the following: ${prompt.trim()}`;

  const maxIterations = 10;
  let iteration = 0;
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: userPrompt
    }
  ];

  try {
    const functionDefinition = {
      type: 'function',
      function: {
        name: 'return_recipe',
        description: 'Return the final recipe response for the user. Use this as the last step. Do not call this function unless you have collected and validated all information needed for the recipe.',
        parameters: recipeStructuredResponse
      }
    };

    // Add "return_recipe" as the final "function"/tool for the LLM response:
    const toolsWithReturn = [
      ...tools,
      functionDefinition
    ];

    while (iteration < maxIterations) {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // structured outputs most reliably supported on "gpt-4o"
        messages,
        tools: toolsWithReturn,
        tool_choice: 'auto',
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const message = response.choices[0].message;
      if (!message) {
        return sendError(res, 500, 'No response from OpenAI');
      }
      messages.push(message);

      // If LLM wants to call functions, execute them
      if (message.tool_calls && message.tool_calls.length > 0) {
        for (const toolCall of message.tool_calls) {
          if (toolCall.type !== 'function') continue;

          const functionName = toolCall.function.name;
          let functionResult: unknown;

          try {
            const args = JSON.parse(toolCall.function.arguments);

            if (functionName === 'search_foods') {
              const query = args.query as string;
              const categories = args.categories as number[] | undefined;
              const words = query.trim().split(/\s+/);
              const searchResult = await searchFoods(words, 20, 0, categories || null);
              functionResult = {
                results: searchResult.results,
                total: searchResult.total
              };
            } else if (functionName === 'get_food_portions') {
              const foodId = args.foodId as number;
              if (isNaN(foodId)) {
                functionResult = { error: 'Invalid food ID' };
              } else {
                const foodExists = await checkFoodExists(foodId);
                if (!foodExists) {
                  functionResult = { error: 'Food not found' };
                } else {
                  const portions = await getFoodPortions(foodId);
                  functionResult = { portions };
                }
              }
            } else if (functionName === 'return_recipe') {
              // The LLM is returning the final structured recipe, handle this below.
              functionResult = null;
            } else {
              functionResult = { error: 'Unknown function' };
            }
          } catch (error) {
            console.error('Error executing function:', error);
            functionResult = { error: 'Failed to execute function' };
          }

          if (functionName !== 'return_recipe') {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            });
          } else {
            // This is our structured output!
            let recipeData: {
              description: string;
              instructions: string | null;
              servings: number | null;
              total_time_minutes: number | null;
              ingredients: Array<{
                food_id: number;
                gram_weight: number;
                food_portion_id: number | null;
                quantity: number | null;
              }>;
            };
            try {
              recipeData = JSON.parse(toolCall.function.arguments);
            } catch (e) {
              console.error('Could not parse structured recipe output', e, toolCall.function.arguments);
              return sendError(res, 500, 'Failed to parse LLM structured recipe output');
            }

            // Validate required fields
            if (!recipeData.description || !Array.isArray(recipeData.ingredients)) {
              return sendError(res, 500, 'Invalid recipe structure from LLM');
            }

            // Validate and enrich ingredients with food data
            const enrichedIngredients = [];
            for (const ingredient of recipeData.ingredients) {
              const food = await getFoodById(ingredient.food_id);
              if (!food) {
                continue; // Skip if food not found
              }

              let portionAmount: number | null = null;
              let portionModifier: string | null = null;

              if (ingredient.food_portion_id) {
                const portions = await getFoodPortions(ingredient.food_id);
                const portion = portions.find(p => p.id === ingredient.food_portion_id);
                if (portion) {
                  portionAmount = portion.amount;
                  portionModifier = portion.modifier;
                }
              }

              enrichedIngredients.push({
                food_id: ingredient.food_id,
                food_portion_id: ingredient.food_portion_id ?? null,
                quantity: ingredient.quantity ?? null,
                gram_weight: ingredient.gram_weight,
                food_description: food.description,
                calorie_density: food.calorie_density,
                portion_amount: portionAmount,
                portion_modifier: portionModifier
              });
            }

            if (enrichedIngredients.length === 0) {
              return sendError(res, 500, 'No valid ingredients found in recipe');
            }

            // Return recipe + enriched ingredients
            res.json({
              recipe: {
                name: name.trim(),
                description: recipeData.description,
                instructions: recipeData.instructions ?? null,
                servings: recipeData.servings ?? null,
                total_time_minutes: recipeData.total_time_minutes ?? null
              },
              ingredients: enrichedIngredients
            });

            return;
          }
        }
        iteration++;
        continue;
      }

      // If LLM replies directly with content (which it shouldn't if using return_recipe tool), try to parse as JSON fallback
      const content = message.content;
      if (!content) {
        return sendError(res, 500, 'LLM response missing content');
      }
      let recipeData: {
        description: string;
        instructions: string | null;
        servings: number | null;
        total_time_minutes: number | null;
        ingredients: Array<{
          food_id: number;
          gram_weight: number;
          food_portion_id: number | null;
          quantity: number | null;
        }>;
      };

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
        recipeData = JSON.parse(jsonString);
      } catch (parseError) {
        console.warn(parseError)
        return sendError(res, 500, 'Failed to parse LLM response as JSON');
      }

      if (!recipeData.description || !Array.isArray(recipeData.ingredients)) {
        return sendError(res, 500, 'Invalid recipe structure from LLM');
      }

      const enrichedIngredients = [];
      for (const ingredient of recipeData.ingredients) {
        const food = await getFoodById(ingredient.food_id);
        if (!food) {
          continue; // Skip if food not found
        }

        let portionAmount: number | null = null;
        let portionModifier: string | null = null;

        if (ingredient.food_portion_id) {
          const portions = await getFoodPortions(ingredient.food_id);
          const portion = portions.find(p => p.id === ingredient.food_portion_id);
          if (portion) {
            portionAmount = portion.amount;
            portionModifier = portion.modifier;
          }
        }

        enrichedIngredients.push({
          food_id: ingredient.food_id,
          food_portion_id: ingredient.food_portion_id ?? null,
          quantity: ingredient.quantity ?? null,
          gram_weight: ingredient.gram_weight,
          food_description: food.description,
          calorie_density: food.calorie_density,
          portion_amount: portionAmount,
          portion_modifier: portionModifier
        });
      }

      if (enrichedIngredients.length === 0) {
        return sendError(res, 500, 'No valid ingredients found in recipe');
      }

      res.json({
        recipe: {
          name: name.trim(),
          description: recipeData.description,
          instructions: recipeData.instructions ?? null,
          servings: recipeData.servings ?? null,
          total_time_minutes: recipeData.total_time_minutes ?? null
        },
        ingredients: enrichedIngredients
      });

      return;
    }

    return sendError(res, 500, 'Recipe generation took too long');
  } catch (error) {
    console.error('Error generating recipe:', error);
    if (error instanceof OpenAI.APIError) {
      return sendError(res, 500, `OpenAI API error: ${error.message}`);
    }
    return sendError(res, 500, 'Failed to generate recipe');
  }
}));


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
