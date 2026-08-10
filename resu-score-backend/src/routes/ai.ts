import express from 'express';
import { rewriteBulletWithAI } from '../services/aiAnalyzer';

const router = express.Router();

/**
 * POST /api/ai/rewrite
 * Rewrites a single resume bullet point using Groq AI.
 * Body: { text: string, jobTitle?: string }
 */
router.post('/rewrite', async (req, res) => {
  try {
    const { text, jobTitle } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length < 5) {
      return res.status(400).json({ error: 'text is required (min 5 characters)' });
    }

    const result = await rewriteBulletWithAI(text.trim(), jobTitle);

    if (!result) {
      return res.status(503).json({
        error: 'AI rewrite unavailable',
        details: 'GROQ_API_KEY is not configured or the service is temporarily unavailable.',
      });
    }

    res.json(result);
  } catch (error: unknown) {
    console.error('AI rewrite route error:', error);
    res.status(500).json({
      error: 'AI rewrite failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
