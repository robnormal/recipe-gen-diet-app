# Recipe Diet App

A TypeScript application with an Express backend API and React frontend.

## Project Structure

```
recipe-diet-app/
├── backend/          # Express API server
│   └── src/
│       └── index.ts
├── frontend/         # React web app
│   └── src/
│       ├── App.tsx
│       └── main.tsx
└── package.json      # Workspace root
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up backend environment:
```bash
cp backend/.env.example backend/.env
```

3. Run development servers:
```bash
npm run dev
```

This starts both the backend (http://localhost:3001) and frontend (http://localhost:3000).

## Available Scripts

- `npm run dev` - Run both backend and frontend in development mode
- `npm run build` - Build both projects
- `npm run lint` - Lint both projects
- `npm run typecheck` - Type check both projects
