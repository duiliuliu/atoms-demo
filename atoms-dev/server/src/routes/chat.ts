import { Router } from 'express';
import { AgentService } from '../services/agent/AgentService.js';

const router = Router();
const agentService = new AgentService();

router.post('/', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = await agentService.processRequest(content, {});
    
    for await (const chunk of stream) {
      res.write(chunk);
    }
    
    res.end();
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as chatRouter };
