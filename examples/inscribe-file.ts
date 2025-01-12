import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inscribeFile() {
  // Initialize SDK with config from .env
  const sdk = new InscriptionSDK(sdkConfig);

  // Read image file and convert to base64
  const imagePath = join(__dirname, 'assets', 'example.webp');
  const imageBuffer = readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  try {
    const config = {
      file: {
        type: 'base64' as const,
        base64: base64Image,
        fileName: 'example.webp',
      },
      holderId: inscriptionConfig.holderId,
      mode: 'file' as const,
      network: sdkConfig.network,
      description: 'Example inscription',
    };
    console.log('about to inscribe', config);
    // Start inscription and execute transaction in one step
    const result = await sdk.inscribeAndExecute(config, hederaConfig);

    console.log('Inscription completed:', result);

    // You can also retrieve the inscription status
    const status = await sdk.retrieveInscription(result.jobId);
    console.log('Inscription status:', status);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the example
inscribeFile().catch(console.error);
