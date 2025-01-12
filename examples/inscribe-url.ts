import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { sdkConfig, hederaConfig, inscriptionConfig } from './config';

async function inscribeUrl() {
  const sdk = new InscriptionSDK(sdkConfig);

  try {
    // Start inscription and execute transaction in one step
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

    console.log('Inscription completed:', result);

    // You can also retrieve the inscription status
    const status = await sdk.retrieveInscription(result.jobId);
    console.log('Inscription status:', status);
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
  }
}

// Run the example
inscribeUrl().catch(console.error);
