# Codebase Map

Concise map of project-owned files and folders. Dependency, build, coverage, and other generated folders such as `node_modules`, `dist`, `build`, and `coverage` are intentionally omitted.

## Root

- `.gitignore` - Git ignore rules for dependencies, generated outputs, environment files, and local artifacts.
- `README.md` - High-level setup and script documentation for the TypeScript Express/React app.
- `docker-compose.yml` - Local service orchestration, primarily for infrastructure such as PostgreSQL.
- `package.json` - npm workspace root for `backend` and `frontend`; defines aggregate `dev`, `build`, `lint`, and `typecheck` scripts.
- `package-lock.json` - Locked dependency graph for the npm workspaces.
- `schema.sql` - PostgreSQL schema for foods, nutrients, users, recipes, ingredients, meal plans, sessions, indexes, and table comments.

## `agent_docs/`

- `codebase-map.md` - This file; summarizes project-owned folders and files for future agents.

## `backend/`

Express API workspace for authentication, food lookup, recipe management, meal plans, nutrient calculations, and import scripts.

- `.env.example` - Template for backend environment variables such as database URL, session secret, port, and OpenAI API key.
- `IMPORT_FOODS_README.md` - Instructions for loading USDA food data into the application database.
- `eslint.config.js` - ESLint configuration for backend TypeScript.
- `jest.config.js` - Jest configuration for backend tests.
- `package.json` - Backend workspace package with Express, PostgreSQL, sessions, OpenAI, Jest, ESLint, and TypeScript scripts.
- `tsconfig.json` - Backend TypeScript compiler configuration.

### `backend/src/`

- `add-category-emojis.ts` - Utility script that maps known USDA food categories to emojis and updates `food_categories` rows.
- `db.ts` - Data access layer for food search, category lookup, users, recipes, ingredients, meal plans, and nutrient/calorie-density calculations.
- `db_connection.ts` - PostgreSQL pool singleton, query helper, client helper, and shutdown hooks.
- `import-foods.ts` - USDA FoodData Central JSON importer that upserts categories, foods, nutrients, measure units, portions, and nutrient amounts.
- `import-rdas.ts` - CSV importer for recommended daily allowance values into `nutrient_rdas`.
- `index.ts` - Express server entry point; configures CORS, sessions, auth middleware, and all REST API routes.
- `recipe_generation.ts` - OpenAI-based recipe generator that searches database foods through tool calls, validates generated ingredients, enriches results, and logs OpenAI requests.

### `backend/src/__tests__/`

- `health.test.ts` - Backend test coverage for the health endpoint.

## `frontend/`

Vite/React workspace for the authenticated recipe, food, and meal-plan UI.

- `eslintrc.json` - ESLint configuration for frontend TypeScript/React.
- `index.html` - Vite HTML entry point mounting the React app.
- `package.json` - Frontend workspace package with React, Vite, Vitest, Testing Library, ESLint, and TypeScript scripts.
- `tsconfig.json` - Frontend TypeScript configuration.
- `tsconfig.node.json` - TypeScript configuration for Node-based frontend tooling such as Vite config.
- `vite.config.ts` - Vite and Vitest configuration for React and jsdom tests.

### `frontend/src/`

- `App.css` - Main application styling for layout, forms, lists, detail views, tables, navigation, and responsive behavior.
- `App.tsx` - Top-level React composition; wires auth, navigation, recipe, ingredient, food, and meal-plan hooks into views.
- `index.css` - Global browser/page styles.
- `main.tsx` - React entry point that renders `App` into the DOM.
- `setupTests.ts` - Vitest/Testing Library setup, including jest-dom matchers.

### `frontend/src/__tests__/`

- `App.test.tsx` - Frontend smoke/unit test coverage for the app shell.

### `frontend/src/components/`

- `app-header.tsx` - Header showing the signed-in user and logout action.
- `auth-view.tsx` - Login and registration UI.
- `category-filter.tsx` - Food category multi-filter controls for ingredient search.
- `food-detail-view.tsx` - Food detail UI showing calorie density and nutrient/RDA information.
- `food-search-results.tsx` - Search result list for selecting foods and opening food detail pages.
- `ingredient-manager.tsx` - Coordinates ingredient search, creation, editing, and display for a recipe.
- `ingredient-row.tsx` - Single ingredient row with display, edit, update, and delete behavior.
- `ingredient-search-section.tsx` - Search form and category filter wrapper for adding ingredients.
- `ingredients-table.tsx` - Table of recipe ingredients and related actions.
- `meal-plan-detail-view.tsx` - Meal-plan detail screen for editing metadata, managing recipes, and viewing nutrients.
- `meal-plan-list.tsx` - Meal-plan list and creation UI.
- `measurement-type-selector.tsx` - Selector for entering ingredients by grams or available food portions.
- `new-ingredient-form.tsx` - Form for adding a selected food as a recipe ingredient.
- `recipe-creation-forms.tsx` - UI for manual recipe creation and AI recipe generation prompts.
- `recipe-detail-container.tsx` - Layout/container for recipe detail, edit form, ingredients, and nutrient display.
- `recipe-detail-header.tsx` - Recipe detail header and editable recipe metadata form.
- `recipe-detail-view.tsx` - Recipe detail screen composition.
- `recipe-editor.tsx` - Recipe edit form fields and submit controls.
- `recipe-list.tsx` - Recipe list view plus navigation to create/generate/detail flows.
- `recipe-nutrients-table.tsx` - Nutrient table used for recipes or meal plans.

### `frontend/src/hooks/`

- `useAuth.ts` - Authentication state and handlers for session check, login, logout, and registration.
- `useFoodDetail.ts` - Food detail loading state and navigation-aware food detail handlers.
- `useFoodSearch.ts` - Food category loading, category selection, and ingredient search state.
- `useIngredientForm.ts` - State and handlers for adding/editing ingredients, loading portions, and refreshing recipe data.
- `useMealPlanDetail.ts` - State and handlers for loading, updating, deleting meal plans and managing recipes within them.
- `useMealPlansList.ts` - Meal-plan list loading and create-meal-plan state.
- `useNavigation.ts` - URL-backed view state for recipes, foods, creation, generation, meal plans, and browser back/forward handling.
- `useRecipeCreation.ts` - Manual recipe creation and AI generation workflow state; creates generated recipes and ingredients.
- `useRecipeDetail.ts` - Recipe detail loading, editing, ingredient list loading, deletion, and display helpers.
- `useRecipesList.ts` - Recipe list loading state and refresh helper.

### `frontend/src/services/`

- `api.ts` - Typed fetch wrapper functions for auth checks, foods, recipes, ingredients, and meal plans; centralizes response/error handling.

### `frontend/src/types/`

- `index.ts` - Shared frontend TypeScript interfaces for users, foods, nutrients, recipes, ingredients, meal plans, forms, and API responses.

### `frontend/src/utils/`

- `measurement-conversion.ts` - Converts ingredient input between grams and food-portion quantities.
- `nutrients.ts` - Shared nutrient helpers, including total kcal extraction from USDA nutrient number `208`.

## `nutrition_data/`

Project data/documentation used by import scripts.

- `README.md` - Notes for nutrition data files used by the app.
