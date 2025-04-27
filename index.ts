import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { connectDB } from "./db";

const app = express();

// CORS middleware
app.use((req, res, next) => {
  // Update CORS to allow your Vercel frontend URL
  const allowedOrigins = ['http://localhost:5173', 'https://your-frontend-url.vercel.app'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
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

// Connect to MongoDB at startup
let isConnected = false;
const connectToDatabase = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

// Initialize routes
let initializedApp: express.Application | null = null;
const initializeApp = async () => {
  if (!initializedApp) {
    await connectToDatabase();
    initializedApp = await registerRoutes(app);
  }
  return initializedApp;
};

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// For local development
if (process.env.NODE_ENV === 'development') {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  initializeApp().then(() => {
    app.listen(port, "0.0.0.0", () => {
      console.log(`Development server running on port ${port}`);
    });
  });
}

// Export for Vercel
export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}
