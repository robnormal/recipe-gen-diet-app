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

   Configure the following environment variables in `backend/.env`:
   - `OPENAI_API_KEY` - Required for recipe generation feature. Get your API key from [OpenAI](https://platform.openai.com/api-keys)
   - `PORT` - Backend server port (default: 3001)
   - `SESSION_SECRET` - Secret for session management
   - Database connection variables (see `backend/.env.example` for details)

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
