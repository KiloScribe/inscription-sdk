import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Network } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from root directory
config({ path: join(__dirname, '..', '.env') });

function validateEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export const sdkConfig = {
  apiKey: validateEnv('API_KEY'),
  network: validateEnv('HEDERA_NETWORK') as Network,
};

export const hederaConfig = {
  accountId: validateEnv('HEDERA_ACCOUNT_ID'),
  privateKey: validateEnv('HEDERA_PRIVATE_KEY'),
  network: validateEnv('HEDERA_NETWORK') as Network,
};

export const inscriptionConfig = {
  holderId: validateEnv('HOLDER_ID'),
};
