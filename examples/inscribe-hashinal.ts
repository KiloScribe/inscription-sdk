import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function inscribeHashinal() {
  const sdk = new InscriptionSDK(sdkConfig);

  const imagePath = join(__dirname, 'assets', 'example.webp');
  const imageBuffer = readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  try {
    const result = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'base64',
          base64: base64Image,
          fileName: 'example.webp',
          mimeType: 'image/webp',
        },
        holderId: inscriptionConfig.holderId,
        mode: 'hashinal',
        network: sdkConfig.network,
        description: 'Example hashinal inscription',
        metadataObject: {
          name: 'Example NFT',
          description: 'This is an example NFT',
          attributes: [
            {
              trait_type: 'Example Trait',
              value: 'Example Value',
            },
          ],
        },
      },
      hederaConfig
    );

    console.log('Inscription completed:', result);

    // You can also retrieve the inscription status
    const status = await sdk.retrieveInscription(result.jobId);
    console.log('Inscription status:', status);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the example
inscribeHashinal().catch(console.error);
