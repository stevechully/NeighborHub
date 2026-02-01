import express from 'express';
import cors from 'cors';
import profileRoutes from './routes/profile.routes.js';
import adminRoutes from './routes/admin.routes.js';
import complaintsRoutes from './routes/complaints.routes.js';
import workerServicesRoutes from './routes/workerServices.routes.js';
import facilitiesRoutes from './routes/facilities.routes.js';
import visitorParcelRoutes from './routes/visitorParcel.routes.js';
import marketplaceRoutes from './routes/marketplace.routes.js';
import noticesRoutes from './routes/notices.routes.js';
import eventsRoutes from './routes/events.routes.js';
import maintenanceRoutes from './routes/maintenance.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import adminWorkersRoutes from "./routes/admin.workers.routes.js";
import authRoutes from "./routes/auth.routes.js";
import marketplaceSellersRoutes from "./routes/marketplaceSellers.routes.js";


const app = express();

// 🔥 JSON parsing middleware (REQUIRED for POST/PATCH requests)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Health check
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/worker-services', workerServicesRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api', visitorParcelRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/notices', noticesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/payments', paymentsRoutes);
app.use("/api/admin", adminWorkersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/marketplace", marketplaceSellersRoutes);


export default app;

