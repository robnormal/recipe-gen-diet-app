# Codebase Map

Concise map of project-owned files and folders. Dependency, build, coverage, and other generated folders such as `node_modules`, `dist`, `build`, and `coverage` are intentionally omitted.

## Root

- `.gitignore` - Git ignore rules for dependencies, generated outputs, environment files, and local artifacts.
- `README.md` - High-level setup and script documentation for the TypeScript Express/React app.
- `docker-compose.yml` - Local service orchestration for PostgreSQL and Meilisearch.
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
- `db.ts` - Data access layer for food search (Meilisearch), category lookup, users, recipes, ingredients, meal plans, and nutrient/calorie-density calculations.
- `db_connection.ts` - PostgreSQL pool singleton, query helper, client helper, and shutdown hooks.
- `import-foods.ts` - USDA FoodData Central JSON importer that upserts categories, foods, nutrients, measure units, portions, and nutrient amounts.
- `import-rdas.ts` - CSV importer for recommended daily allowance values into `nutrient_rdas`.
- `index.ts` - Express server entry point; configures CORS, sessions, auth middleware, and all REST API routes.
- `index-foods.ts` - One-off script to populate the Meilisearch `foods` index from PostgreSQL; also exports `ensureFoodsIndexed` for server startup.
- `meili_client.ts` - Meilisearch client singleton.
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

### `frontend/src/components/` (tests)

- `breadcrumbs.test.tsx` - Tests for breadcrumb rendering and click handlers.
- `food-detail-modal.test.tsx` - Tests for modal open/close, Escape, backdrop click, focus restoration, and full-page link.
- `recipe-detail-header.test.tsx` - Component tests for inline recipe metadata editing behavior.
- `recipe-list.test.tsx` - Tests for recipe list empty-state CTA navigation.

### `frontend/src/hooks/` (tests)

- `useNavigation.test.ts` - Tests for `?food=` param round-trips, `foods` view parsing, modal open/close, and popstate behavior.

### `frontend/src/components/`

- `app-header.tsx` - Header showing the signed-in user and logout action; rendered inside the sidebar footer.
- `auth-view.tsx` - Login and registration UI.
- `breadcrumbs.tsx` - Breadcrumb navigation driven per-view.
- `category-filter.tsx` - Food category multi-filter controls for ingredient search.
- `empty-state.tsx` - Reusable empty-state component with icon, title, description, and CTA buttons.
- `food-detail-modal.tsx` - Modal overlay for food details opened from ingredient rows; focus trap and focus restoration.
- `food-detail-view.tsx` - Food detail UI showing calorie density and nutrient/RDA information; supports `mode='modal' | 'page'`.
- `food-search-results.tsx` - Search result list for selecting foods and opening food detail pages.
- `foods-list-view.tsx` - Top-level Foods browse view reusing search results and category filter.
- `ingredient-row.tsx` - Single ingredient row with always-inline amount editing, explicit unit/portion editing, and delete action behavior.
- `ingredient-search-section.tsx` - Search form and category filter wrapper for adding ingredients.
- `ingredients-table.tsx` - Table of recipe ingredients, inline amount edit wiring, and add-ingredient CTA row.
- `meal-plan-detail-view.tsx` - Meal-plan detail screen for editing metadata, managing recipes, and viewing nutrients.
- `meal-plan-list.tsx` - Meal-plan list and creation UI.
- `measurement-type-selector.tsx` - Selector for entering ingredients by grams or available food portions.
- `new-ingredient-form.tsx` - Form for adding a selected food as a recipe ingredient.
- `recipe-creation-forms.tsx` - UI for manual recipe creation and AI recipe generation prompts.
- `recipe-detail-header.tsx` - Recipe detail header with inline click-to-edit recipe metadata, stats, and field-level saves.
- `recipe-detail-view.tsx` - Recipe detail screen composition.
- `recipe-list.tsx` - Recipe list view plus navigation to create/generate/detail flows.
- `recipe-nutrients-table.tsx` - Nutrient table used for recipes or meal plans.
- `sidebar.tsx` - Primary navigation sidebar with Recipes, Meal Plans, and Foods links; responsive collapse.

### `frontend/src/components/toast/`

- `toast.tsx` - Individual toast notification with optional action and countdown bar.
- `toast-host.tsx` - Fixed-position toast stack renderer.

### `frontend/src/contexts/`

- `toast-context.tsx` - Toast provider and context for push/dismiss notification behavior.

### `frontend/src/hooks/`

- `useAuth.ts` - Authentication state and handlers for session check, login, logout, and registration.
- `useFoodDetail.ts` - Food detail loading state and navigation-aware food detail handlers; exposes `loadFood` for modal use.
- `useFoodSearch.ts` - Food category loading, category selection, and ingredient search state.
- `useFoodsList.ts` - Thin wrapper around `useFoodSearch` for the top-level Foods browse view.
- `useIngredientForm.ts` - State and handlers for adding/editing ingredients, quick amount saves, loading portions, and refreshing recipe data.
- `useMealPlanDetail.ts` - State and handlers for loading, updating, deleting meal plans and managing recipes within them.
- `useMealPlansList.ts` - Meal-plan list loading and create-meal-plan state.
- `useNavigation.ts` - URL-backed view state including `modalFoodId` and `?food=` query param for modal overlays; handles browser back/forward.
- `useRecipeCreation.ts` - Manual recipe creation and AI generation workflow state; creates generated recipes and ingredients.
- `useRecipeDetail.ts` - Recipe detail loading, inline metadata saves, instructions draft state, ingredient list loading, undoable ingredient deletion, and display helpers.
- `useRecipesList.ts` - Recipe list loading state and refresh helper.
- `useToasts.ts` - Convenience hook for the toast context.

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
