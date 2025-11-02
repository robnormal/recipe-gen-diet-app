-- Food Database Schema
-- Based on USDA FoodData Central JSON structure

-- Table: food_categories
-- Food categories (e.g., "Nut and Seed Products")
CREATE TABLE food_categories (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: foods
-- Main food items table
CREATE TABLE foods (
    id SERIAL PRIMARY KEY,
    fdc_id INTEGER UNIQUE,
    food_class VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    ndb_number INTEGER,
    data_type VARCHAR(50),
    food_category_id INTEGER,
    publication_date DATE,
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
    unit_name VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    measure_unit_id INTEGER NOT NULL,
    value NUMERIC(15, 6) NOT NULL,
    amount NUMERIC(15, 6) NOT NULL,
    modifier VARCHAR(100),
    gram_weight NUMERIC(15, 6) NOT NULL,
    sequence_number INTEGER,
    min_year_acquired INTEGER,
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
    amount NUMERIC(15, 6) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE CASCADE,
    FOREIGN KEY (nutrient_id) REFERENCES nutrients(id) ON DELETE CASCADE,
    UNIQUE(food_id, nutrient_id)
);

-- Indexes for performance
CREATE INDEX idx_foods_fdc_id ON foods(fdc_id);
CREATE INDEX idx_foods_description ON foods(description);
CREATE INDEX idx_foods_food_category_id ON foods(food_category_id);
CREATE INDEX idx_nutrients_number ON nutrients(number);
CREATE INDEX idx_nutrients_name ON nutrients(name);
CREATE INDEX idx_food_nutrients_food_id ON food_nutrients(food_id);
CREATE INDEX idx_food_nutrients_nutrient_id ON food_nutrients(nutrient_id);
CREATE INDEX idx_food_portions_food_id ON food_portions(food_id);
CREATE INDEX idx_food_portions_measure_unit_id ON food_portions(measure_unit_id);

-- Comments for documentation
COMMENT ON TABLE food_categories IS 'Categories for organizing foods (e.g., Nut and Seed Products)';
COMMENT ON TABLE foods IS 'Main food items with basic metadata and USDA FoodData Central IDs';
COMMENT ON TABLE nutrients IS 'Master catalog of all nutrients with their properties';
COMMENT ON TABLE measure_units IS 'Units of measurement for food portions (cup, tablespoon, etc.)';
COMMENT ON TABLE food_portions IS 'Standard portion sizes and weights for foods';
COMMENT ON TABLE food_nutrients IS 'Junction table storing nutrient amounts for each food';

