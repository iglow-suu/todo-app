import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import todoRoutes from './routes/todos';
import groupRoutes from './routes/groups';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug routes
app.get('/debug/routes', (req, res) => {
  res.json({ 
    message: 'Debug endpoint working',
    availableRoutes: ['/api/auth', '/api/todos', '/api/groups', '/health', '/']
  });
});

// Routes
console.log('Setting up routes...');
console.log('AuthRoutes type:', typeof authRoutes);
console.log('TodoRoutes type:', typeof todoRoutes);
console.log('GroupRoutes type:', typeof groupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/groups', groupRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Todo Backend API is running!' });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
