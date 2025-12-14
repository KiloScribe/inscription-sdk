import { InscriptionSDK } from '../src/inscription-sdk';
import dotenv from 'dotenv';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';
import JSZip from 'jszip';

dotenv.config();

async function createHashinalCollectionZipBase64(): Promise<string> {
  const zip = new JSZip();

  const images = zip.folder('images');
  const metadata = zip.folder('metadata');
  const secondaryImages1 = zip.folder('secondary_images_1');
  const secondaryImages2 = zip.folder('secondary_images_2');

  if (!images || !metadata || !secondaryImages1 || !secondaryImages2) {
    throw new Error('Failed to create ZIP folders');
  }

  const jpegBase64 =
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBUQEA8QEBUPDw8PDw8QDw8PDw8QFREWFhURFRUYHSggGBolGxUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OFQ8PFS0dFR0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAbAAEAAwEBAQEAAAAAAAAAAAAABQYHAgMEAf/EADYQAAIBAgQDBgQEBwAAAAAAAAECAwQRAAUSITFBBhMiUWEHFDKBkaGx0SNCUuEHJDOCorL/xAAbAQEAAwEBAQEAAAAAAAAAAAAABQYHAgMEAf/EAC8RAAICAQMDAgQFBQAAAAAAAAABAhEDBBIhMRMiQVFhIhRxgZGhsdHh8PFC/9oADAMBAAIRAxEAPwD3k0oJjC5v3t3bG9eQGfQb8Xb9T0sY9w9r4Xk4y2+6lQqjO2mC0rM5B3b4g8c9L3mW8t8eQ2o1lQqYJmX4d9Vq5m6wX2c+gYl1p2o0tHn1mHqY0kYfZyVwVwq7mZxwYw7bYpUq2e0YVw1wJ7p1y3o3qYVj3o9a8bqgV3Xc2b6bqQkqg8i0QK9Xn4aJx7cLr0mZsQ2kqGgk0hS1I3w6v1cY5d8p1y8kP5j2Vx2k5b2j1m8wqzqQm1mSg0mZP0qfX4lq5p3m4qS8u7G0m0bq3x8a8cV9o8Zb6z7k2o0pVZQx2qYJk2VfWJ7D7nqk0lW3bYkqWqQ0WZkJ3bWc6k5uWQ7m3m4a7bSgqgk0oUo1Gm2m0o0pUo0qX//Z';

  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6nq3UAAAAASUVORK5CYII=';

  const mp4Placeholder = Buffer.from('00000018667479706D703432', 'hex');

  const jpegBuffer = Buffer.from(jpegBase64, 'base64');
  const pngBuffer = Buffer.from(pngBase64, 'base64');

  images.file('1.jpeg', jpegBuffer);
  images.file('2.jpeg', jpegBuffer);
  secondaryImages1.file('1.png', pngBuffer);
  secondaryImages1.file('2.png', pngBuffer);
  secondaryImages2.file('1.mp4', mp4Placeholder);
  secondaryImages2.file('2.mp4', mp4Placeholder);

  const baseMetadata = (index: 1 | 2) => ({
    format: 'HIP412@2.0.0',
    type: 'image/jpeg',
    creator: 'Inscription SDK Demo',
    image: '',
    attributes: [],
    files: [
      { uri: `secondary_images_1/${index}.png`, type: 'image/png' },
      { uri: `secondary_images_2/${index}.mp4`, type: 'video/mp4' },
    ],
  });

  metadata.file(
    '1.json',
    JSON.stringify(
      {
        ...baseMetadata(1),
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
        ...baseMetadata(2),
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

    // Example 3: Hashinal Collection
    console.log('\nTesting Hashinal Collection inscription:');
    const zipBase64 = await createHashinalCollectionZipBase64();
    const collectionResult = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'base64' as const,
          base64: zipBase64,
          fileName: 'collection.zip',
          mimeType: 'application/zip',
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
