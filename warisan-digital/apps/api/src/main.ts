import { createApp } from "./app.js";
import { env } from "./config/env.js";

async function main() {
  try {
    console.log("🚀 Starting Warisan Digital API Server...");
    console.log(`📝 Environment: ${env.NODE_ENV}`);
    console.log(`🌐 Chain ID: ${env.CHAIN_ID}`);

    const app = await createApp();

    // Start server
    await app.listen({ port: env.PORT, host: env.HOST });

    console.log(`✅ Server running on http://${env.HOST}:${env.PORT}`);
    console.log(`📍 API Base URL: ${env.API_BASE_URL}`);
    console.log("🟢 Ready to handle requests");
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

main();
