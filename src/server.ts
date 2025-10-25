import express, { Application } from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import path from "path";
import { config } from "./config/environment";
import { initializeDatabase } from "./config/database";
import { initializeSocket } from "./config/socket";
import { initializeFirebase } from "./config/firebase";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { generalLimiter } from "./middleware/rateLimiter.middleware";

// Import routes
import authRoutes from "./routes/auth.routes";
import profileRoutes from "./routes/profile.routes";
import userRoutes from "./routes/user.routes";
import followRoutes from "./routes/follow.routes";
import messageRoutes from "./routes/message.routes";
import likeRoutes from "./routes/like.routes";
import notificationRoutes from './routes/notification.routes';

class Server {
  private app: Application;
  private httpServer;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: config.cors.origin,
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Logging
    if (config.server.nodeEnv === "development") {
      this.app.use(morgan("dev"));
    } else {
      this.app.use(morgan("combined"));
    }

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Serve static files (uploaded images)
    this.app.use(
      "/uploads",
      express.static(path.join(process.cwd(), "uploads"))
    );

    // Rate limiting
    this.app.use(generalLimiter);
  }

  private configureRoutes(): void {
    const apiPrefix = config.server.apiPrefix;

    // Health check
    this.app.get("/health", (_req, res) => {
      res.json({
        success: true,
        message: "Server is running",
        environment: config.server.nodeEnv,
        timestamp: new Date().toISOString(),
      });
    });

    // API routes
    this.app.use(`${apiPrefix}/auth`, authRoutes);
    this.app.use(`${apiPrefix}/profile`, profileRoutes);
    this.app.use(`${apiPrefix}/users`, userRoutes);
    this.app.use(`${apiPrefix}/follows`, followRoutes);
    this.app.use(`${apiPrefix}/messages`, messageRoutes);
    this.app.use(`${apiPrefix}/likes`, likeRoutes);
    this.app.use(`${apiPrefix}/notifications`, notificationRoutes);

    // 404 handler
    this.app.use(notFoundHandler);
  }

  private configureErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await initializeDatabase();

       // Initialize Firebase
      initializeFirebase();

      // Initialize Socket.IO
      initializeSocket(this.httpServer);

      // Start server
      this.httpServer.listen(config.server.port, () => {
        console.log('═══════════════════════════════════════════════════════');
        console.log(`🚀 Server running in ${config.server.nodeEnv} mode`);
        console.log(`📡 HTTP Server: http://localhost:${config.server.port}`);
        console.log(`🔌 Socket.IO: ws://localhost:${config.server.port}`);
        console.log(`📚 API Prefix: ${config.server.apiPrefix}`);
        console.log('═══════════════════════════════════════════════════════');
      });
    } catch (error) {
      console.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason: Error) => {
  console.error("Unhandled Rejection:", reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error: Error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

export default server;
