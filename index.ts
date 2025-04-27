import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { connectDB } from "./db";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  // Update CORS to allow your Vercel frontend URL
  const allowedOrigins = ['http://localhost:5173', 'https://smart-scheduler-client.vercel.app'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// Initialize routes
let initializedApp: express.Application | null = null;
const initializeApp = async () => {
  try {
    if (!initializedApp) {
      console.log('Initializing application...');
      await connectDB();
      initializedApp = await registerRoutes(app);
      console.log('Application initialized successfully');
    }
    return initializedApp;
  } catch (error) {
    console.error('Failed to initialize application:', error);
    throw error;
  }
};

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Global error handler caught:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ 
    error: message,
    status: status 
  });
});

// For local development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  initializeApp().then(() => {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`Development server running on port ${port}`);
    });
    return server;
  }).catch(err => {
    console.error('Failed to start development server:', err);
    process.exit(1);
  });
}

// Export for Vercel
export default async function handler(req: Request, res: Response) {
  try {
    console.log('Handler invoked with method:', req.method, 'path:', req.path);
    
    // Initialize app if needed
    await initializeApp();
    
    // Handle the request
    return new Promise((resolve, reject) => {
      app(req, res, (err?: any) => {
        if (err) {
          console.error('Express middleware error:', err);
          reject(err);
        } else {
          resolve(undefined);
        }
      });
    });
  } catch (error: any) {
    console.error('Handler error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
