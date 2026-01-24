import { Pool } from 'pg';
import { pool } from './db_connection';
import fs from 'fs';
import path from 'path';

interface RDARow {
  nutrient_number: string;
  unit: string;
  adult_rda_value: number;
}

/**
 * Parse CSV file and return array of RDA rows
 */
function parseCSV(filePath: string): RDARow[] {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.trim().split('\n');
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const [nutrient_number, unit, adult_rda_value] = line.split(',');
    return {
      nutrient_number: nutrient_number.trim(),
      unit: unit.trim(),
      adult_rda_value: parseFloat(adult_rda_value.trim()),
    };
  }).filter(row => row.nutrient_number && !isNaN(row.adult_rda_value));
}

/**
 * Import RDA values from CSV into database
 */
async function importRDAs(csvFilePath: string): Promise<void> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const rdaRows = parseCSV(csvFilePath);
    console.log(`Found ${rdaRows.length} RDA values to import\n`);

    for (const row of rdaRows) {
      // Check if nutrient exists
      const nutrientCheck = await client.query(
        'SELECT id FROM nutrients WHERE number = $1',
        [row.nutrient_number]
      );

      if (nutrientCheck.rows.length === 0) {
        console.warn(`⚠ Warning: Nutrient number ${row.nutrient_number} not found in database, skipping`);
        continue;
      }

      // Check if RDA already exists
      const existing = await client.query(
        'SELECT id FROM nutrient_rdas WHERE nutrient_number = $1',
        [row.nutrient_number]
      );

      if (existing.rows.length > 0) {
        // Update existing RDA
        await client.query(
          `UPDATE nutrient_rdas 
           SET unit = $1, adult_rda_value = $2, updated_at = CURRENT_TIMESTAMP 
           WHERE nutrient_number = $3`,
          [row.unit, row.adult_rda_value, row.nutrient_number]
        );
        console.log(`✓ Updated RDA for nutrient ${row.nutrient_number}: ${row.adult_rda_value} ${row.unit}`);
      } else {
        // Insert new RDA
        await client.query(
          `INSERT INTO nutrient_rdas (nutrient_number, unit, adult_rda_value) 
           VALUES ($1, $2, $3)`,
          [row.nutrient_number, row.unit, row.adult_rda_value]
        );
        console.log(`✓ Imported RDA for nutrient ${row.nutrient_number}: ${row.adult_rda_value} ${row.unit}`);
      }
    }

    await client.query('COMMIT');
    console.log(`\n✓ Successfully imported ${rdaRows.length} RDA value(s)`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Import failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Main import function
 */
async function main() {
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✓ Connected to database');

    const csvFile = process.argv[2] || path.join(__dirname, '../../nutrition_data/nutrient_rdas.csv');
    const csvPath = path.resolve(csvFile);

    if (!fs.existsSync(csvPath)) {
      throw new Error(`CSV file not found: ${csvPath}`);
    }

    console.log(`\nImporting RDA values from: ${csvPath}\n`);
    await importRDAs(csvPath);
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the import if this script is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✓ Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n✗ Import failed:', error);
      process.exit(1);
    });
}

export { importRDAs };
