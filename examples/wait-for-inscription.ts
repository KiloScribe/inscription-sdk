import { InscriptionSDK } from '../src/inscription-sdk';
import dotenv from 'dotenv';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createHashinalCollectionZipBase64(
  imageBuffer: Buffer
): Promise<string> {
  const zip = new JSZip();

  const images = zip.folder('images');
  const metadata = zip.folder('metadata');
  const secondaryImages1 = zip.folder('secondary_images_1');

  if (!images || !metadata || !secondaryImages1) {
    throw new Error('Failed to create ZIP folders');
  }

  images.file('1.webp', imageBuffer);
  images.file('2.webp', imageBuffer);
  secondaryImages1.file('1.webp', imageBuffer);
  secondaryImages1.file('2.webp', imageBuffer);

  const baseMetadata = {
    format: 'HIP412@2.0.0',
    type: 'image/webp',
    creator: 'Inscription SDK Demo',
    image: '',
    attributes: [],
    files: [],
  };

  metadata.file(
    '1.json',
    JSON.stringify(
      {
        ...baseMetadata,
        name: 'Example Collection #1',
        description: 'Example Hashinal collection item #1',
      },
      null,
      2
    )
  );

  metadata.file(
    '2.json',
    JSON.stringify(
      {
        ...baseMetadata,
        name: 'Example Collection #2',
        description: 'Example Hashinal collection item #2',
      },
      null,
      2
    )
  );

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return zipBuffer.toString('base64');
}

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
      connectionMode: 'http',
    });

    const imagePath = join(__dirname, 'assets', 'example.webp');
    const imageBuffer = readFileSync(imagePath);

    // Example 3: Hashinal Collection
    console.log('\nTesting Hashinal Collection inscription:');
    const zipBase64 = await createHashinalCollectionZipBase64(imageBuffer);
    const collectionResult = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'base64' as const,
          base64: zipBase64,
          fileName: 'collection.zip',
        },
        holderId: inscriptionConfig.holderId,
        mode: 'hashinal-collection',
        network: sdkConfig.network,
        description: 'Example Hashinal Collection inscription',
      },
      hederaConfig,
      undefined,
      {
        waitForCompletion: true,
        maxWaitTime: 180000,
        checkInterval: 2000,
      }
    );
    console.log('Collection inscription created:', collectionResult);

    const retrieved = await sdk.retrieveInscription(collectionResult.transactionId);
    console.log('retrieveInscription result:', {
      status: retrieved.status,
      completed: retrieved.completed,
      topic_id: retrieved.topic_id,
      jsonTopicId: retrieved.jsonTopicId,
      registryTopicId: retrieved.registryTopicId,
      mode: retrieved.mode,
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  });
