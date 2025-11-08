import { Pool, PoolClient } from 'pg';
import { pool } from './db_connection'
import { CALORIE_NUTRIENT_NUMBERS } from './db'
import fs from 'fs';
import path from 'path';

dotenv.config();

interface NutrientData {
  id: number;
  number: string;
  name: string;
  rank: number;
  unitName: string;
}

interface MeasureUnit {
  id: number;
  name: string;
  abbreviation?: string;
}

interface FoodPortion {
  id: number;
  value?: number;
  amount?: number;
  modifier?: string;
  gramWeight: number;
  sequenceNumber?: number;
  measureUnit: MeasureUnit;
}

interface FoodNutrient {
  id?: number;
  amount: number;
  nutrient: NutrientData;
}

interface FoodCategory {
  description: string;
  id?: number;
}

interface FoodItem {
  fdcId: number;
  foodClass: string;
  description: string;
  ndbNumber?: number;
  dataType?: string;
  publicationDate?: string;
  foodCategory?: FoodCategory;
  foodNutrients?: FoodNutrient[];
  foodPortions?: FoodPortion[];
}

/**
 * Parse a date string in "M/D/YYYY" format to a Date object
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const [month, day, year] = dateStr.split('/').map(Number);
  if (!month || !day || !year) return null;
  return new Date(year, month - 1, day);
}

/**
 * Get or create a food category and return its ID
 */
async function getOrCreateFoodCategory(client: PoolClient, description: string): Promise<number> {
  if (!description) {
    throw new Error('Food category description is required');
  }

  // Check if category exists
  const existing = await client.query(
    'SELECT id FROM food_categories WHERE description = $1',
    [description]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  } else {
    // Create new category
    const result = await client.query(
      'INSERT INTO food_categories (description) VALUES ($1) RETURNING id',
      [description]
    );

    return result.rows[0].id;
  }
}

/**
 * Get or create a nutrient and return its ID
 */
async function getOrCreateNutrient(client: PoolClient, nutrient: NutrientData): Promise<number> {
  // Check if nutrient exists
  const existing = await client.query(
    'SELECT id FROM nutrients WHERE id = $1 OR number = $2',
    [nutrient.id, nutrient.number]
  );

  if (existing.rows.length > 0) {
    const nutrientId = existing.rows[0].id;
    // Update if information has changed
    await client.query(
      `UPDATE nutrients SET name = $1, rank = $2, unit_name = $3 
       WHERE id = $4`,
      [nutrient.name, nutrient.rank, nutrient.unitName, nutrientId]
    );
    return nutrientId;
  }

  // Create new nutrient
  const result = await client.query(
    `INSERT INTO nutrients (id, number, name, rank, unit_name) 
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [nutrient.id, nutrient.number, nutrient.name, nutrient.rank, nutrient.unitName]
  );

  return result.rows[0].id;
}

/**
 * Get or create a measure unit and return its ID
 */
async function getOrCreateMeasureUnit(
  client: PoolClient,
  measureUnit: MeasureUnit
): Promise<number> {
  // Check if measure unit exists
  const existing = await client.query(
    'SELECT id FROM measure_units WHERE id = $1',
    [measureUnit.id]
  );

  if (existing.rows.length > 0) {
    const unitId = existing.rows[0].id;
    // Update if information has changed
    await client.query(
      `UPDATE measure_units SET name = $1, abbreviation = $2 WHERE id = $3`,
      [measureUnit.name, measureUnit.abbreviation || null, unitId]
    );
    return unitId;
  }

  // Create new measure unit
  const result = await client.query(
    `INSERT INTO measure_units (id, name, abbreviation) 
     VALUES ($1, $2, $3) RETURNING id`,
    [measureUnit.id, measureUnit.name, measureUnit.abbreviation || null]
  );

  return result.rows[0].id;
}

/**
 * Import a single food item into the database
 */
async function importFood(pool: Pool, food: FoodItem): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get or create food category
    let foodCategoryId: number | null = null;
    if (food.foodCategory?.description) {
      foodCategoryId = await getOrCreateFoodCategory(
        client,
        food.foodCategory.description
      );
    }

    // Parse publication date
    const publicationDate = food.publicationDate
      ? parseDate(food.publicationDate)
      : null;

    // Check if food already exists (by fdc_id)
    const existingFood = await client.query(
      'SELECT id FROM foods WHERE fdc_id = $1',
      [food.fdcId]
    );

    let foodId: number;

    if (existingFood.rows.length > 0) {
      // Update existing food
      foodId = existingFood.rows[0].id;
      await client.query(
        `UPDATE foods SET 
         food_class = $1, 
         description = $2, 
         ndb_number = $3, 
         data_type = $4, 
         food_category_id = $5, 
         publication_date = $6,
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          food.foodClass,
          food.description,
          food.ndbNumber || null,
          food.dataType || null,
          foodCategoryId,
          publicationDate,
          foodId,
        ]
      );

      // Delete existing portions and nutrients for this food
      await client.query('DELETE FROM food_portions WHERE food_id = $1', [foodId]);
      await client.query('DELETE FROM food_nutrients WHERE food_id = $1', [foodId]);
    } else {
      // Insert new food
      const foodResult = await client.query(
        `INSERT INTO foods (
         fdc_id, food_class, description, ndb_number, data_type, 
         food_category_id, publication_date
         ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [
          food.fdcId,
          food.foodClass,
          food.description,
          food.ndbNumber || null,
          food.dataType || null,
          foodCategoryId,
          publicationDate,
        ]
      );
      foodId = foodResult.rows[0].id;
    }

    let calorieDensity: number | null = null;

    // Import nutrients
    if (food.foodNutrients && food.foodNutrients.length > 0) {
      for (const foodNutrient of food.foodNutrients) {
        if (foodNutrient.nutrient && foodNutrient.amount !== undefined) {
          const nutrientId = await getOrCreateNutrient(
            client,
            foodNutrient.nutrient
          );

          // Check if this food_nutrient already exists
          const existingFoodNutrient = await client.query(
            'SELECT id FROM food_nutrients WHERE food_id = $1 AND nutrient_id = $2',
            [foodId, nutrientId]
          );

          if (existingFoodNutrient.rows.length > 0) {
            // Update existing record
            const existingId = existingFoodNutrient.rows[0].id;
            await client.query(
              `UPDATE food_nutrients 
               SET amount = $1, updated_at = CURRENT_TIMESTAMP 
               WHERE id = $2`,
              [foodNutrient.amount, existingId]
            );
          } else {
            // Insert new record - use foodNutrient.id if available, otherwise generate one
            const foodNutrientId = foodNutrient.id || 
              (foodId * 1000000 + nutrientId); // Simple ID generation
            
            await client.query(
              `INSERT INTO food_nutrients (id, food_id, nutrient_id, amount)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (id) DO UPDATE SET 
                 amount = $4, 
                 updated_at = CURRENT_TIMESTAMP`,
              [foodNutrientId, foodId, nutrientId, foodNutrient.amount]
            );
          }

          // Record calorie density, if this nutrient is calories
          // TODO: This will ignore all but the last "energy" nutrient, if multiple are present
          if (foodNutrient.nutrient && CALORIE_NUTRIENT_NUMBERS.indexOf(foodNutrient.nutrient.number) >= 0) {
            // Nutrient amounts are per 100g. Let's make life easier on ourselves
            calorieDensity = foodNutrient.amount / 100.0;
          }
        }
      }
    }

    if (calorieDensity !== null) {
      // Update existing food
      await client.query(
        `UPDATE foods SET 
         calorie_density = $1, 
         updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [
          calorieDensity,
          foodId,
        ]
      );
    }

    // Import portions
    if (food.foodPortions && food.foodPortions.length > 0) {
      for (const portion of food.foodPortions) {
        const portionAmount = portion.amount || portion.value;

        if (portion.measureUnit && portionAmount) {
          const measureUnitId = await getOrCreateMeasureUnit(
            client,
            portion.measureUnit
          );

          await client.query(
            `INSERT INTO food_portions (
             id, food_id, measure_unit_id, amount, modifier, 
             gram_weight, sequence_number
             ) VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO UPDATE SET
             food_id = $2,
             measure_unit_id = $3,
             amount = $4,
             modifier = $5,
             gram_weight = $6,
             sequence_number = $7`,
            [
              portion.id,
              foodId,
              measureUnitId,
              portionAmount,
              portion.modifier || null,
              portion.gramWeight,
              portion.sequenceNumber || null,
            ]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log(`✓ Imported: ${food.description} (FDC ID: ${food.fdcId})`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`✗ Failed to import: ${food.description}`, error);
    throw error;
  } finally {
    client.release();
  }
}

function getFileContent(filepath: string): string {
  // Read and parse JSON file
  const filePath = path.resolve(filepath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`JSON file not found: ${filePath}`);
  }

  return fs.readFileSync(filePath, 'utf-8');
}

function parseFoods(fileContent: string) {
  let foodObj: Record<string, FoodItem[]>
  try {
    foodObj = JSON.parse(fileContent);
  } catch (parseError) {
    throw new Error(`Failed to parse JSON file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }

  const foods: FoodItem[] = [];
  for (const key in foodObj) {
    foods.push(...foodObj[key]);

    if (!Array.isArray(foods)) {
      throw new Error('JSON file must contain an array of food items');
    }
  }

  return foods;
}

/**
 * Main import function
 */
async function importFoods(jsonFilePath: string): Promise<void> {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Connected to database');

    const fileContent = getFileContent(jsonFilePath);
    const foods = parseFoods(fileContent);

    console.log(`\nFound ${foods.length} food item(s) to import\n`);

    // Import each food item
    for (let i = 0; i < foods.length; i++) {
      const food = foods[i];
      console.log(`[${i + 1}/${foods.length}] Processing: ${food.description}`);
      await importFood(pool, food);
    }

    console.log(`\n✓ Successfully imported ${foods.length} food item(s)`);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  const jsonFile = process.argv[2];
  if (!jsonFile) {
    console.error('No file to import');
    process.exit(1);
  }
  importFoods(jsonFile)
    .then(() => {
      console.log('\n✓ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Import failed:', error);
      process.exit(1);
    });
}

export { importFoods };
