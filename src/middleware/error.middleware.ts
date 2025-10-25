import { Request, Response, NextFunction } from "express";
import { config } from "../config/environment";

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(config.server.nodeEnv === "development" && { stack: err.stack }),
    });
    return;
  }

  console.error("Unexpected Error:", err);
  res.status(500).json({
    success: false,
    error:
      config.server.nodeEnv === "development"
        ? err.message
        : "Internal server error",
    ...(config.server.nodeEnv === "development" && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};
