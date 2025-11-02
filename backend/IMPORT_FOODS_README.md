# Food Import Script

This script imports food data from USDA FoodData Central JSON format into the PostgreSQL database.

## Prerequisites

1. PostgreSQL database must be running and the schema must be created (run `schema.sql` first)
2. Database connection environment variables must be configured (see below)
3. Install dependencies: `npm install`

## Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=recipe_diet_app
DB_USER=postgres
DB_PASSWORD=your_password
```

If not specified, the script will use default values (localhost, postgres user, etc.).

## Usage

### Basic Usage

```bash
npm run import-foods [path-to-json-file]
```

If no file path is provided, it defaults to `food-json-example.json` in the project root.

### Examples

```bash
# Import from the example file (default)
npm run import-foods

# Import from a specific file
npm run import-foods ../food-json-example.json

# Import from a file with absolute path
npm run import-foods /path/to/foods.json
```

## What the Script Does

1. **Connects to the database** using the configured connection settings
2. **Reads the JSON file** containing food items
3. **For each food item:**
   - Gets or creates the food category
   - Inserts or updates the food record (based on `fdc_id`)
   - Gets or creates all nutrients referenced by the food
   - Inserts or updates food-nutrient relationships
   - Gets or creates all measure units
   - Inserts or updates food portions

4. **Uses transactions** - each food item is imported atomically (all-or-nothing)
5. **Handles duplicates** - if a food with the same `fdc_id` exists, it updates the existing record

## Data Mapping

The script maps JSON fields to database columns as follows:

| JSON Field | Database Column | Notes |
|------------|----------------|-------|
| `fdcId` | `fdc_id` | Unique identifier |
| `foodClass` | `food_class` | |
| `description` | `description` | |
| `ndbNumber` | `ndb_number` | Optional |
| `dataType` | `data_type` | Optional |
| `publicationDate` | `publication_date` | Parsed from "M/D/YYYY" format |
| `foodCategory.description` | `food_categories.description` | Creates category if needed |
| `foodNutrients[].nutrient.*` | `nutrients.*` | Creates nutrient if needed |
| `foodNutrients[].amount` | `food_nutrients.amount` | |
| `foodPortions[]` | `food_portions.*` | Creates measure unit if needed |

## Error Handling

- If an error occurs during import of a single food item, that item's transaction is rolled back
- The script continues with the next food item
- All errors are logged to the console
- The script exits with code 1 if any fatal errors occur

## Notes

- The script is idempotent - you can run it multiple times with the same data
- Existing foods (by `fdc_id`) will be updated, not duplicated
- Categories, nutrients, and measure units are reused if they already exist
- The script uses database transactions to ensure data consistency

