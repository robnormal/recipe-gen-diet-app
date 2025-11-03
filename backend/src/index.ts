import { dbPool } from './db'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend API is running' });
});

app.get('/api/foods/search', async (req, res) => {
  const { q, limit = 20, offset = 0 } = req.query;
  
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  const pool = dbPool();

  try {
    // Create search query using ts_query (handles multiple words)
    const searchQuery = q.trim().split(/\s+/).join(' & ');

    const result = await pool.query(
      `SELECT 
        f.description, f.calorie_density,
        ts_rank(to_tsvector('english', f.description), 
                plainto_tsquery('english', $1)) as rank
       FROM foods f
       WHERE to_tsvector('english', f.description) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC, f.description
       LIMIT $2 OFFSET $3`,
      [searchQuery, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) 
       FROM foods 
       WHERE to_tsvector('english', description) @@ plainto_tsquery('english', $1)`,
      [q]
    );

    res.json({
      results: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Database error' });
  } finally {
    await pool.end();
  }
});


if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
