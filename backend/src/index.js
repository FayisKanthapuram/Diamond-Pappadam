import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import productionRoutes from './routes/productionRoutes.js';
import gramTypeRoutes from './routes/gramTypeRoutes.js';
import qualityTypeRoutes from './routes/qualityTypeRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import salaryLedgerRoutes from './routes/salaryLedgerRoutes.js';
import activityLogRoutes from './routes/activityLogRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/productions', productionRoutes);
app.use('/api/gram-types', gramTypeRoutes);
app.use('/api/quality-types', qualityTypeRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/salary-ledger', salaryLedgerRoutes);
app.use('/api/activity-logs', activityLogRoutes);

app.use(errorHandler);

async function start() {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port} (PORT=${env.port})`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
