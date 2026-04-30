import 'dotenv/config';
import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import expenseRoutes from './src/routes/expense.routes';
import userRoutes from './src/routes/user.routes';
import groupRoutes from './src/routes/group.routes';
import paymentRoutes from './src/routes/payment.routes';
import { requestLogger } from './src/middlewares/requestLogger';
import { setSocketIo } from './src/realtime/socket';
import {
  GROUP_EXPENSES_TABLE_NAME,
  GROUP_MEMBERS_TABLE_NAME,
  GROUPS_TABLE_NAME,
  TABLE_NAME,
  USERS_TABLE_NAME,
} from './src/config/aws';
import { buildSwaggerSpec } from './src/config/swagger';

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLogger);
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: '*' },
});
setSocketIo(io);
io.on('connection', (socket) => {
  socket.on('join-user-room', (payload: { userId?: string }) => {
    const userId = String(payload?.userId || '').trim();
    if (!userId) return;
    socket.join(`user:${userId}`);
  });
});

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
app.use('/api/groups', groupRoutes);
app.use('/api/payments', paymentRoutes);

httpServer.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
  console.log(`Using expenses table: ${TABLE_NAME}`);
  console.log(`Using users table: ${USERS_TABLE_NAME}`);
  console.log(`Using groups table: ${GROUPS_TABLE_NAME}`);
  console.log(`Using group members table: ${GROUP_MEMBERS_TABLE_NAME}`);
  console.log(`Using group expenses table: ${GROUP_EXPENSES_TABLE_NAME}`);
});
