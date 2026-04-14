import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import expenseRoutes from './src/routes/expense.routes';
import userRoutes from './src/routes/user.routes';
import { requestLogger } from './src/middlewares/requestLogger';
import { TABLE_NAME, USERS_TABLE_NAME } from './src/config/aws';
import { buildSwaggerSpec } from './src/config/swagger';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);

const PORT = Number(process.env.PORT || 4000);
const swaggerSpec = buildSwaggerSpec(PORT);

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'expense-budget-api' });
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (_req: Request, res: Response) => {
  res.json(swaggerSpec);
});

app.use('/api/expenses', expenseRoutes);
app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
  console.log(`Using expenses table: ${TABLE_NAME}`);
  console.log(`Using users table: ${USERS_TABLE_NAME}`);
});
