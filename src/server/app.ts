import cors from 'cors';
import express from 'express';
import { AppError, errorHandler } from './middleware/errorHandler.js';
import feedRoutes from './routes/feedRoutes.js';

export const app = express();

app.disable('x-powered-by');
app.use(cors());
app.use(express.json());
app.use('/api', feedRoutes);
app.use((_req, _res, next) => {
  next(new AppError(404, 'Route not found', 'ROUTE_NOT_FOUND'));
});
app.use(errorHandler);

export default app;
