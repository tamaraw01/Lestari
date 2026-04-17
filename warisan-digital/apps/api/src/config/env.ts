import { z } from "zod";

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default("0.0.0.0"),
  API_BASE_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // Blockchain
  POLYGON_RPC_URL: z.string().url(),
  POLYGON_AMOY_RPC_URL: z.string().url().optional(),
  CHAIN_ID: z.coerce.number().default(137),
  WASIAT_MODULE_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  DVO_ORACLE_ADDRESS: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  RELAYER_PRIVATE_KEY: z.string().min(64),

  // Chainlink
  CHAINLINK_DON_ID: z.string(),
  CHAINLINK_SUBSCRIPTION_ID: z.coerce.bigint(),

  // Encryption
  ENCRYPTION_KEY: z.string().length(64),

  // SATUSEHAT
  SATUSEHAT_BASE_URL: z.string().url().default("https://api.satusehat.kemkes.go.id"),
  SATUSEHAT_CLIENT_ID: z.string().min(1),
  SATUSEHAT_CLIENT_SECRET: z.string().min(1),
  SATUSEHAT_AUTH_URL: z.string().url(),

  // Dukcapil
  DUKCAPIL_BASE_URL: z.string().url(),
  DUKCAPIL_API_KEY: z.string().min(1),

  // PSrE
  PSRE_PROVIDER: z.enum(["PRIVY_ID", "PERURI", "VIDA"]).default("PRIVY_ID"),
  PSRE_API_KEY: z.string().min(1),
  PSRE_BASE_URL: z.string().url(),

  // IPFS / Pinata
  PINATA_API_KEY: z.string().min(1),
  PINATA_SECRET_KEY: z.string().min(1),
  IPFS_GATEWAY_URL: z.string().url().default("https://gateway.pinata.cloud"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ ENV VALIDATION FAILED:");
  console.error(parsed.error.flatten());
  process.exit(1);
}

export const env = parsed.data;
