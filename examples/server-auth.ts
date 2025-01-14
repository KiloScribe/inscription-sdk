import { InscriptionSDK } from '../src';
import dotenv from 'dotenv';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';

dotenv.config();

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
    });

    console.log('Inscription SDK initialized', sdk.config);

    const result = await sdk.inscribeAndExecute(
      {
        file: {
          type: 'url',
          url: 'https://picsum.photos/200/300',
        },
        holderId: inscriptionConfig.holderId,
        mode: 'hashinal',
        network: sdkConfig.network,
        description: 'Example URL inscription',
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

    console.log('Inscription created:', result);

    const status = await sdk.retrieveInscription(result.jobId);
    console.log('Inscription status:', status);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
