import { query } from './db_connection';

// Mapping of food category descriptions to emojis
const categoryEmojis: Record<string, string> = {
  'American Indian/Alaska Native Foods': '🌽',
  'Baby Foods': '👶',
  'Baked Products': '🍞',
  'Beef Products': '🥩',
  'Beverages': '🥤',
  'Breakfast Cereals': '🥣',
  'Cereal Grains and Pasta': '🌾',
  'Dairy and Egg Products': '🥛',
  'Fast Foods': '🍔',
  'Fats and Oils': '🫒',
  'Finfish and Shellfish Products': '🐟',
  'Fruits and Fruit Juices': '🍎',
  'Lamb, Veal, and Game Products': '🐑',
  'Legumes and Legume Products': '🫘',
  'Meals, Entrees, and Side Dishes': '🍽️',
  'Nut and Seed Products': '🥜',
  'Pork Products': '🐷',
  'Poultry Products': '🍗',
  'Restaurant Foods': '🍴',
  'Sausages and Luncheon Meats': '🌭',
  'Snacks': '🍿',
  'Soups, Sauces, and Gravies': '🍲',
  'Spices and Herbs': '🌿',
  'Sweets': '🍬',
  'Vegetables and Vegetable Products': '🥕',
};

async function addEmojisToCategories() {
  console.log('Fetching food categories from database...');
  
  // Get all categories
  const categories = await query(
    'SELECT id, description FROM food_categories ORDER BY description',
    []
  );

  console.log(`Found ${categories.rows.length} categories`);
  console.log('\nCategory emoji mappings:');
  console.log('========================\n');

  // Update each category with its emoji
  let updated = 0;
  for (const category of categories.rows) {
    const emoji = categoryEmojis[category.description] || '❓';
    console.log(`${emoji} ${category.description}`);
    
    await query(
      'UPDATE food_categories SET emoji = $1 WHERE id = $2',
      [emoji, category.id]
    );
    updated++;
  }

  console.log(`\n✅ Updated ${updated} categories with emojis!`);
}

// Run if called directly
if (require.main === module) {
  addEmojisToCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Error:', err);
      process.exit(1);
    });
}

export { categoryEmojis };
