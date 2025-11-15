import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import {
  searchFoods,
  checkFoodExists,
  getFoodPortions,
  getFoodById
} from './db';

// Types for recipe generation
export type RecipeData = {
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

export type EnrichedIngredient = {
  food_id: number;
  food_portion_id: number | null;
  quantity: number | null;
  gram_weight: number;
  food_description: string;
  calorie_density: number | null;
  portion_amount: number | null;
  portion_modifier: string | null;
};

export type GeneratedRecipe = {
  recipe: {
    name: string;
    description: string;
    instructions: string | null;
    servings: number | null;
    total_time_minutes: number | null;
  };
  ingredients: EnrichedIngredient[];
};

// OpenAI logging function
function logOpenAIRequest(request: unknown, response: unknown | null = null) {
  try {
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logFile = path.join(logsDir, `openai-${new Date().toISOString().split('T')[0]}.log`);

    const logEntry: { timestamp: string; request: unknown; response?: unknown } = {
      timestamp,
      request
    };

    if (response !== null) {
      logEntry.response = response;
    }

    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine, 'utf8');
  } catch (error) {
    console.error('Failed to write OpenAI log:', error);
  }
}

// Helper function to enrich ingredients with food data
async function enrichIngredients(ingredients: RecipeData['ingredients']): Promise<EnrichedIngredient[]> {
  const enrichedIngredients: EnrichedIngredient[] = [];
  
  for (const ingredient of ingredients) {
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

  return enrichedIngredients;
}

// Generate recipe using LLM
export async function generateRecipeWithLLM(name: string, prompt: string, openaiApiKey: string): Promise<GeneratedRecipe> {
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
1. Use search_foods to find ingredients
2. Use get_food_portions to find available measurements for each ingredient
3. Return a JSON-structured recipe as described in the function schema

Important guidelines:
- Only use ingredients returned by search_foods.
- BATCH YOUR TOOL CALLS: To search for multiple ingredients, call search_foods multiple times in a SINGLE response (not one at a time).
  When you need portions for multiple foods, call get_food_portions multiple times in one response.
- The recipe must be in JSON format, following the given structure.
`;

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

  // Helper function to execute a single tool call
  async function executeToolCall(toolCall: OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall): Promise<{ tool_call_id: string; content: string }> {
    const functionName = toolCall.function.name;
    let functionResult: unknown;

    try {
      const args = JSON.parse(toolCall.function.arguments);

      switch (functionName) {
        case 'search_foods': {
          const query = args.query as string;
          const categories = args.categories as number[] | undefined;
          const words = query.trim().split(/\s+/);
          const searchResult = await searchFoods(words, 20, 0, categories || null);
          functionResult = {
            results: searchResult.results,
            total: searchResult.total
          };
          break;
        }
        case 'get_food_portions': {
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
          break;
        }
        default:
          functionResult = { error: 'Unknown function' };
      }
    } catch (error) {
      console.error('Error executing function:', error);
      functionResult = { error: 'Failed to execute function' };
    }

    return {
      tool_call_id: toolCall.id,
      content: JSON.stringify(functionResult)
    };
  }

  const functionDefinition = {
    type: 'function',
    function: {
      name: 'return_recipe',
      description: 'Return the final recipe response. Use this as the last step.',
      parameters: recipeStructuredResponse
    }
  };

  // Add "return_recipe" as the final "function"/tool for the LLM response:
  const toolsWithReturn = [
    ...tools,
    functionDefinition
  ];

  while (iteration < maxIterations) {
    const requestParams = {
      model: 'gpt-4o', // structured outputs most reliably supported on "gpt-4o"
      messages,
      tools: toolsWithReturn,
      tool_choice: 'auto',
      temperature: 0.7,
      response_format: { type: "json_object" }
    };

    console.log('sending to open ai');
    let response: OpenAI.Chat.Completions.ChatCompletion;
    try {
      response = await openai.chat.completions.create(requestParams as Parameters<typeof openai.chat.completions.create>[0]) as OpenAI.Chat.Completions.ChatCompletion;
      // Log both request and response together
      logOpenAIRequest(requestParams, {
        id: response.id,
        model: response.model,
        choices: response.choices,
        usage: response.usage,
        created: response.created
      });
    } catch (err) {
      console.error(err);
      throw err;
    }

    const message = response.choices[0].message;
    if (!message) {
      throw new Error('No response from OpenAI');
    }
    messages.push(message);

    // If LLM wants to call functions, execute them in batches
    if (message.tool_calls && message.tool_calls.length > 0) {
      // Filter to only function-type tool calls
      const functionToolCalls = message.tool_calls.filter((tc): tc is OpenAI.Chat.Completions.ChatCompletionMessageFunctionToolCall => tc.type === 'function');

      // Check for return_recipe first - if present, handle it immediately
      const returnRecipeCall = functionToolCalls.find(tc => tc.function.name === 'return_recipe');
      if (returnRecipeCall) {
        // This is our structured output!
        let recipeData: RecipeData;
        try {
          recipeData = JSON.parse(returnRecipeCall.function.arguments);
        } catch (e) {
          console.error('Could not parse structured recipe output', e, returnRecipeCall.function.arguments);
          throw new Error('Failed to parse LLM structured recipe output');
        }

        // Validate required fields
        if (!recipeData.description || !Array.isArray(recipeData.ingredients)) {
          throw new Error('Invalid recipe structure from LLM');
        }

        // Enrich ingredients with food data
        const enrichedIngredients = await enrichIngredients(recipeData.ingredients);

        if (enrichedIngredients.length === 0) {
          throw new Error('No valid ingredients found in recipe');
        }

        // Return recipe + enriched ingredients
        return {
          recipe: {
            name: name.trim(),
            description: recipeData.description,
            instructions: recipeData.instructions ?? null,
            servings: recipeData.servings ?? null,
            total_time_minutes: recipeData.total_time_minutes ?? null
          },
          ingredients: enrichedIngredients
        };
      }

      // Execute all other tool calls in parallel
      const toolCallResults = await Promise.all(
        functionToolCalls.map(toolCall => executeToolCall(toolCall))
      );

      // Add all tool results to messages, maintaining original order
      // (Promise.all preserves order, but we'll be explicit)
      for (const result of toolCallResults) {
        messages.push({
          role: 'tool',
          tool_call_id: result.tool_call_id,
          content: result.content
        });
      }

      iteration++;
      continue;
    }

    // If LLM replies directly with content (which it shouldn't if using return_recipe tool), try to parse as JSON fallback
    const content = message.content;
    if (!content) {
      throw new Error('LLM response missing content');
    }
    let recipeData: RecipeData;

    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      recipeData = JSON.parse(jsonString);
    } catch (parseError) {
      console.warn(parseError);
      throw new Error('Failed to parse LLM response as JSON');
    }

    if (!recipeData.description || !Array.isArray(recipeData.ingredients)) {
      throw new Error('Invalid recipe structure from LLM');
    }

    const enrichedIngredients = await enrichIngredients(recipeData.ingredients);

    if (enrichedIngredients.length === 0) {
      throw new Error('No valid ingredients found in recipe');
    }

    return {
      recipe: {
        name: name.trim(),
        description: recipeData.description,
        instructions: recipeData.instructions ?? null,
        servings: recipeData.servings ?? null,
        total_time_minutes: recipeData.total_time_minutes ?? null
      },
      ingredients: enrichedIngredients
    };
  }

  throw new Error('Recipe generation took too long');
}

