import express from 'express';
import { WSRedisRepository } from './repository/ws.repository.js';
import { WSService } from './service/ws.service.js';

const app = express();
const port = 3001;

// Dependency Injection Setup
const redisRepo = new WSRedisRepository();
const websocketService = new WSService(redisRepo);

// Start simulation immediately
websocketService.startWSService();

app.get('/status', (req, res) => {
  res.json({ status: 'WS service is running' });
});

app.listen(port, () => {
  console.log(`WS Service listening at http://localhost:${port}`);
});