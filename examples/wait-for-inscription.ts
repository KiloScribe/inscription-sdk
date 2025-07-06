import { InscriptionSDK } from '../src/inscription-sdk';
import dotenv from 'dotenv';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;

  if (!accountId || !privateKey) {
    throw new Error(
      'HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY environment variables are required'
    );
  }

  try {
    console.log('Initializing Inscription SDK...');
    const sdk = await InscriptionSDK.createWithAuth({
      accountId,
      privateKey,
      network: 'testnet',
      type: 'server',
    });

    const imagePath = join(__dirname, 'assets', 'example.webp');
    const imageBuffer = readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Example 1: Regular File
    console.log('\nTesting regular file inscription:');
    const fileResult = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'base64' as const,
          base64: base64Image,
          fileName: 'example.webp',
        },
        holderId: inscriptionConfig.holderId,
        mode: 'file',
        network: sdkConfig.network,
        description: 'Example file inscription',
      },
      hederaConfig
    );
    console.log('File inscription created:', fileResult);

    const fileComplete = await sdk.waitForInscription(
      fileResult.jobId,
      30,
      4000,
      true
    );
    console.log('File inscription complete:', {
      topic_id: fileComplete.topic_id,
      status: fileComplete.status,
    });

    // Example 2: Hashinal NFT
    console.log('\nTesting Hashinal NFT inscription:');
    const nftResult = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'base64' as const,
          base64: base64Image,
          fileName: 'example.webp',
        },
        holderId: inscriptionConfig.holderId,
        mode: 'hashinal',
        network: sdkConfig.network,
        description: 'Example NFT inscription',
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
    console.log('NFT inscription created:', nftResult);

    const nftComplete = await sdk.waitForInscription(nftResult.jobId);
    console.log('NFT inscription complete:', {
      topic_id: nftComplete.topic_id,
      jsonTopicId: nftComplete.jsonTopicId,
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
