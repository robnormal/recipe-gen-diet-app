import { getMeiliClient } from './meili_client';
import { query } from './db_connection';

const BATCH_SIZE = 1000;
const INDEX_NAME = 'foods';

interface FoodDocument {
  id: number;
  description: string;
  calorie_density: number | null;
  food_category_id: number | null;
}

function assertTaskSucceeded(task: { status: string; error?: { message: string; code: string } | null }, label: string): void {
  if (task.status === 'failed') {
    const errMsg = task.error
      ? `${task.error.code}: ${task.error.message}`
      : 'unknown error';
    throw new Error(`${label} failed: ${errMsg}`);
  }
}

export async function indexAllFoods(): Promise<void> {
  const client = await getMeiliClient();
  const index = client.index(INDEX_NAME);

  // Fetch all foods with category info
  const { rows } = await query<FoodDocument>(
    `SELECT f.id, f.description, f.calorie_density, f.food_category_id
     FROM foods f`
  );

  console.log(`Indexing ${rows.length} foods into Meilisearch...`);

  // Delete existing documents and wait for the task to actually finish
  const deleteTask = await index.deleteAllDocuments().waitTask();
  assertTaskSucceeded(deleteTask, 'Document deletion');
  console.log(`  Deleted ${deleteTask.details?.deletedDocuments ?? 0} existing documents`);

  // Add documents in batches
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const task = await index.addDocuments(batch, { primaryKey: 'id' }).waitTask();
    assertTaskSucceeded(task, `Batch ${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)}`);
    console.log(`  Indexed batch ${i + 1}–${Math.min(i + BATCH_SIZE, rows.length)} (${task.details?.indexedDocuments ?? 0} docs)`);
  }

  // Configure index settings
  const settingsTask = await index.updateSettings({
    searchableAttributes: ['description'],
    filterableAttributes: ['food_category_id'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ],
    typoTolerance: {
      minWordSizeForTypos: {
        oneTypo: 4,
        twoTypos: 8,
      },
    },
  }).waitTask();
  assertTaskSucceeded(settingsTask, 'Settings update');

  console.log('Meilisearch food index build complete.');
}

export async function ensureFoodsIndexed(): Promise<void> {
  const client = await getMeiliClient();
  const index = client.index(INDEX_NAME);

  try {
    const stats = await index.getStats();
    if (stats.numberOfDocuments === 0) {
      console.log('Meilisearch food index is empty; building index...');
      await indexAllFoods();
    } else {
      console.log(`Meilisearch food index already has ${stats.numberOfDocuments} documents.`);
    }
  } catch (err) {
    console.error('Failed to check Meilisearch index status:', err);
    throw err;
  }
}

// Run the index build if this script is executed directly
if (require.main === module) {
  indexAllFoods()
    .then(() => {
      console.log('Indexing completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Indexing failed:', error);
      process.exit(1);
    });
}
