-- Food Database Schema
-- Based on USDA FoodData Central JSON structure

-- Table: food_categories
-- Food categories (e.g., "Nut and Seed Products")
CREATE TABLE food_categories (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    emoji VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: foods
-- Main food items table
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    fdc_id INTEGER UNIQUE,
    food_class VARCHAR(50),
    description TEXT NOT NULL,
    ndb_number INTEGER,
    data_type VARCHAR(50),
    food_category_id INTEGER,
    publication_date DATE,
    calorie_density REAL,
    description_tsvector tsvector GENERATED ALWAYS AS (to_tsvector('english', description)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_category_id) REFERENCES food_categories(id)
);

-- Table: nutrients
-- Master list of all nutrients
CREATE TABLE nutrients (
    id INTEGER PRIMARY KEY,
    number VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    rank INTEGER,
    unit_name VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: nutrient_rdas
-- Recommended Daily Allowance values for nutrients (adults ≥4 years)
CREATE TABLE nutrient_rdas (
    id SERIAL PRIMARY KEY,
    nutrient_number VARCHAR(10) NOT NULL UNIQUE,
    unit VARCHAR(20) NOT NULL,
    adult_rda_value REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nutrient_number) REFERENCES nutrients(number) ON DELETE CASCADE
);

-- Table: measure_units
-- Units of measurement (e.g., cup, tablespoon)
CREATE TABLE measure_units (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    abbreviation VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: food_portions
-- Standard portion sizes for foods
CREATE TABLE food_portions (
    id INTEGER PRIMARY KEY,
    food_id INTEGER NOT NULL,
    measure_unit_id INTEGER,
    amount REAL NOT NULL,
    modifier VARCHAR(100),
    gram_weight REAL NOT NULL,
    sequence_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    FOREIGN KEY (measure_unit_id) REFERENCES measure_units(id)
);

-- Table: food_nutrients
-- Junction table linking foods to nutrients with measurement values
CREATE TABLE food_nutrients (
    id INTEGER PRIMARY KEY,
    food_id INTEGER NOT NULL,
    nutrient_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    FOREIGN KEY (nutrient_id) REFERENCES nutrients(id) ON DELETE CASCADE,
    UNIQUE(food_id, nutrient_id)
);

-- Table: users
-- User accounts for the application
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: recipes
-- User-authored recipes
CREATE TABLE recipes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    instructions TEXT,
    servings INTEGER,
    total_time_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Table: ingredients
-- Ingredients that compose a recipe; each references a food
CREATE TABLE ingredients (
    id SERIAL PRIMARY KEY,
    recipe_id INTEGER NOT NULL,
    food_id INTEGER NOT NULL,
    food_portion_id INTEGER,
    quantity REAL,
    gram_weight REAL NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT,
    FOREIGN KEY (food_portion_id) REFERENCES food_portions(id) ON DELETE SET NULL
);

-- Table: meal_plans
-- User-created meal plans (collections of recipes)
CREATE TABLE meal_plans (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, name)
);

-- Table: meal_plan_recipes
-- Junction table linking meal plans to recipes with quantities
CREATE TABLE meal_plan_recipes (
    id SERIAL PRIMARY KEY,
    meal_plan_id INTEGER NOT NULL,
    recipe_id INTEGER NOT NULL,
    quantity REAL NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meal_plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE,
    UNIQUE(meal_plan_id, recipe_id)
);

-- Table: session
-- Express-session PostgreSQL store for user sessions
-- Note: connect-pg-simple will create this table automatically, but it's documented here for reference
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_foods_description ON foods(description);
CREATE INDEX idx_foods_food_category_id ON foods(food_category_id);
CREATE INDEX idx_nutrients_name ON nutrients(name);
CREATE INDEX idx_nutrient_rdas_nutrient_number ON nutrient_rdas(nutrient_number);
CREATE INDEX idx_food_nutrients_food_id ON food_nutrients(food_id);
CREATE INDEX idx_food_nutrients_nutrient_id ON food_nutrients(nutrient_id);
CREATE INDEX idx_food_portions_food_id ON food_portions(food_id);
CREATE INDEX idx_food_portions_measure_unit_id ON food_portions(measure_unit_id);
CREATE INDEX idx_foods_description_tsvector ON foods USING GIN(description_tsvector);
CREATE INDEX idx_recipes_user_id ON recipes(user_id);
CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_food_id ON ingredients(food_id);
CREATE INDEX idx_ingredients_food_portion_id ON ingredients(food_portion_id);
CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plan_recipes_meal_plan_id ON meal_plan_recipes(meal_plan_id);
CREATE INDEX idx_meal_plan_recipes_recipe_id ON meal_plan_recipes(recipe_id);
CREATE INDEX idx_session_expire ON session(expire);

-- Comments for documentation
COMMENT ON TABLE food_categories IS 'Categories for organizing foods (e.g., Nut and Seed Products)';
COMMENT ON TABLE foods IS 'Main food items with basic metadata and USDA FoodData Central IDs';
COMMENT ON TABLE nutrients IS 'Master catalog of all nutrients with their properties';
COMMENT ON TABLE nutrient_rdas IS 'Recommended Daily Allowance (RDA) values for nutrients for adults and children ≥4 years';
COMMENT ON TABLE measure_units IS 'Units of measurement for food portions (cup, tablespoon, etc.)';
COMMENT ON TABLE food_portions IS 'Standard portion sizes and weights for foods';
COMMENT ON TABLE food_nutrients IS 'Junction table storing nutrient amounts for each food';
COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON TABLE recipes IS 'User-authored recipes with instructions and metadata';
COMMENT ON TABLE ingredients IS 'Recipe ingredients linking recipes to foods with quantities and units';
COMMENT ON TABLE meal_plans IS 'User-created meal plans (collections of recipes)';
COMMENT ON TABLE meal_plan_recipes IS 'Junction table linking meal plans to recipes with quantities';
COMMENT ON TABLE session IS 'Express-session store for user authentication sessions';
