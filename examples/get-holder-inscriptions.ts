import { InscriptionSDK } from '../src/inscription-sdk';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.API_KEY;
const network = (process.env.NETWORK || 'testnet') as 'mainnet' | 'testnet';
const holderId = process.env.HOLDER_ID || '';

if (!apiKey) {
  console.error('API_KEY environment variable is required');
  process.exit(1);
}

if (!holderId) {
  console.error('HOLDER_ID environment variable is required');
  process.exit(1);
}

const sdk = new InscriptionSDK({
  apiKey,
  network,
});

async function fetchHolderInscriptions() {
  try {
    const inscriptions = await sdk.getHolderInscriptions({
      holderId,
      includeCollections: true,
    });

    console.log(`Found ${inscriptions.length} inscriptions for holder ${holderId}`);
    
    if (inscriptions.length > 0) {
      console.log('\nFirst 3 inscriptions (or all if fewer):');
      const displayCount = Math.min(3, inscriptions.length);
      
      for (let i = 0; i < displayCount; i++) {
        const inscription = inscriptions[i];
        console.log(`\nInscription #${i + 1}:`);
        console.log(`- ID: ${inscription.tx_id}`);
        console.log(`- Status: ${inscription.status}`);
        console.log(`- Completed: ${inscription.completed}`);
        console.log(`- Mode: ${inscription.mode || 'unknown'}`);
        console.log(`- Topic ID: ${inscription.topic_id || 'N/A'}`);
        
        if (inscription.fileUrl) {
          console.log(`- File URL: ${inscription.fileUrl}`);
        }
        
        if (inscription.jsonFileUrl) {
          console.log(`- JSON File URL: ${inscription.jsonFileUrl}`);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching holder inscriptions:', error);
  }
}

fetchHolderInscriptions(); 