import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifyCors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "./config/env.js";

/**
 * Setup Fastify app dengan plugins
 */
export async function createApp() {
  const fastify = Fastify({
    logger: {
      level: env.NODE_ENV === "production" ? "warn" : "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          singleLine: false,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
    },
  });

  // Register plugins
  await fastify.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: { expiresIn: env.JWT_EXPIRES_IN },
  });

  await fastify.register(fastifyCors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "15 minutes",
  });

  // Health check
  fastify.get("/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  // API version
  fastify.get("/api/v1/status", async () => ({
    version: "1.0.0",
    environment: env.NODE_ENV,
    network: env.CHAIN_ID,
  }));

  // Error handler
  fastify.setErrorHandler(async (error, request, reply) => {
    fastify.log.error(error);

    reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message || "Internal server error",
      timestamp: new Date().toISOString(),
    });
  });

  // 404 handler
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      success: false,
      error: "Route not found",
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  });

  return fastify;
}
