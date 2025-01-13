# Kiloscribe Inscription SDK

TypeScript/JavaScript SDK for inscribing files on the Hedera network using Kiloscribe's inscription service.

## Prerequisites

Before you start, you'll need:

1. **Hedera Account**:
   - Create a testnet account at [portal.hedera.com](https://portal.hedera.com)
   - Save your Account ID (e.g., `0.0.123456`)
   - Save your Private Key (DER Encoded)

2. **WalletConnect Project** (for browser apps):
   - Create an account at [cloud.walletconnect.com](https://cloud.walletconnect.com)
   - Create a new project
   - Save your Project ID

3. **Kiloscribe API Key**:
   - Get your API key from [kiloscribe.com/inscription-api](https://kiloscribe.com/inscription-api)

4. **Development Environment**:
   - Node.js 20 or later
   - npm or yarn

## Installation

### For Node.js/Backend Projects
```bash
# Install the SDK and its peer dependencies
npm install @kiloscribe/inscription-sdk @hashgraph/sdk
```

### For Browser/Frontend Projects
```bash
# Install the SDK and wallet connection dependencies
npm install @kiloscribe/inscription-sdk @hashgraphonline/hashinal-wc @hashgraph/sdk @hashgraph/hedera-wallet-connect
```

## Getting Started

### 1. Set Up Your Environment

Create a `.env` file in your project root:

```env
# Required for all projects
API_KEY=your_kiloscribe_api_key
HEDERA_NETWORK=testnet  # or mainnet

# For Node.js projects using private key
HEDERA_ACCOUNT_ID=0.0.123456
HEDERA_PRIVATE_KEY=302...

# For browser projects using WalletConnect
WALLETCONNECT_PROJECT_ID=your_project_id
```

### 2. Choose Your Integration Method

#### A. Browser Apps with WalletConnect (Recommended)

This method lets users connect their existing Hedera wallet (like HashPack):

1. Install dependencies:
```bash
npm install @kiloscribe/inscription-sdk @hashgraphonline/hashinal-wc @hashgraph/sdk
```

2. Create your app:
```typescript
import { HashinalsWalletConnectSDK } from '@hashgraphonline/hashinal-wc';
import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { LedgerId } from '@hashgraph/sdk';

// Initialize SDKs
const wallet = new HashinalsWalletConnectSDK();
const sdk = new InscriptionSDK({
  apiKey: process.env.API_KEY,
  network: 'testnet',
});

// Connect wallet (shows QR code or deep links to wallet)
const { accountId } = await wallet.connectWallet(
  process.env.WALLETCONNECT_PROJECT_ID,
  {
    name: 'My dApp',
    description: 'Example dApp',
    url: window.location.origin,
    icons: ['https://my-dapp.com/icon.png'],
  },
  LedgerId.TESTNET
);

// Get signer for the connected account
const dAppSigner = wallet.dAppConnector.signers.find(
  (signer) => signer.getAccountId().toString() === accountId
)!;

// Create an inscription
const result = await sdk.inscribe(
  {
    file: {
      type: 'base64',
      base64: 'your_base64_data',
      fileName: 'example.png',
      mimeType: 'image/png',
    },
    holderId: accountId,
    mode: 'file',  // or 'hashinal' for NFTs
    network: 'testnet',
    description: 'Example inscription',
  },
  dAppSigner
);

// Check status
const status = await sdk.retrieveInscription(result.jobId);
console.log('Status:', status.status);
```

#### B. Node.js Apps with Private Key

This method is for backend services or scripts:

1. Install dependencies:
```bash
npm install @kiloscribe/inscription-sdk @hashgraph/sdk
```

2. Create your script:
```typescript
import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import * as fs from 'fs';

const sdk = new InscriptionSDK({
  apiKey: process.env.API_KEY,
  network: process.env.HEDERA_NETWORK,
});

// Read a file
const file = fs.readFileSync('path/to/file.png');
const base64 = file.toString('base64');

// Create an inscription
const result = await sdk.inscribeAndExecute(
  {
    file: {
      type: 'base64',
      base64,
      fileName: 'example.png',
      mimeType: 'image/png',
    },
    holderId: process.env.HEDERA_ACCOUNT_ID,
    mode: 'file',
    network: process.env.HEDERA_NETWORK,
    description: 'Example inscription',
  },
  {
    accountId: process.env.HEDERA_ACCOUNT_ID,
    privateKey: process.env.HEDERA_PRIVATE_KEY,
    network: process.env.HEDERA_NETWORK,
  }
);
```

## Creating Different Types of Inscriptions

### 1. Basic File Inscription

Upload any supported file type:

```typescript
const result = await sdk.inscribe(
  {
    file: {
      type: 'base64',
      base64: 'your_base64_data',
      fileName: 'example.png',
      mimeType: 'image/png',
    },
    holderId: accountId,
    mode: 'file',
    network: 'testnet',
    description: 'My first inscription',
  },
  dAppSigner  // or use inscribeAndExecute with private key
);
```

### 2. Hashinal NFT

Create an NFT with metadata:

```typescript
const result = await sdk.inscribe(
  {
    file: {
      type: 'base64',
      base64: 'your_base64_data',
      fileName: 'example.png',
      mimeType: 'image/png',
    },
    holderId: accountId,
    mode: 'hashinal',
    network: 'testnet',
    description: 'My first NFT',
    metadataObject: {
      name: 'Cool NFT',
      description: 'An awesome NFT on Hedera',
      attributes: [
        {
          trait_type: 'Background',
          value: 'Blue',
        },
        {
          trait_type: 'Rarity',
          value: 'Legendary',
        },
      ],
    },
  },
  dAppSigner
);
```

### 3. URL Inscription

Inscribe a file from a URL:

```typescript
const result = await sdk.inscribe(
  {
    file: {
      type: 'url',
      url: 'https://example.com/image.png',
    },
    holderId: accountId,
    mode: 'file',
    network: 'testnet',
    description: 'URL inscription',
  },
  dAppSigner
);
```

## Try the Interactive Demo

We've included a complete demo app in the `demo` directory that shows:
- Wallet connection with QR code
- File selection with preview
- Inscription creation
- Status updates

To run it:

1. Clone the repository:
```bash
git clone https://github.com/kiloscribe/inscription-sdk.git
cd inscription-sdk
```

2. Set up the demo:
```bash
cd demo
npm install
cp .env.example .env
```

3. Configure the demo:
Edit `.env` and add:
- Your Kiloscribe API key
- Your WalletConnect Project ID

4. Start the demo:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) and try it out!

## File Support

### Size Limits
- URL files: Up to 100MB
- Base64/Local files: Up to 2MB

### Supported Formats
- Images: jpg, jpeg, png, gif, bmp, webp, tiff, svg
- Video: mp4, webm
- Audio: mp3
- Documents: pdf, doc, docx, xls, xlsx, ppt, pptx
- Web: html, css, js
- Data: csv, json, txt
- 3D: glb

## Common Issues

### 1. "Account ID not found"
- Make sure you're using the correct Account ID format (0.0.123456)
- Check if you're on the right network (testnet/mainnet)

### 2. "Transaction failed"
- Ensure your account has enough HBAR (at least 1 HBAR recommended)
- Check if your private key matches your account ID
- Verify you're using the correct network

### 3. "File too large"
- URL inscriptions: Max 100MB
- Base64/Local files: Max 2MB
- Try compressing your file or using a URL instead

### 4. WalletConnect Issues
- Ensure your wallet (e.g., HashPack) is installed and on the correct network
- Check if your WalletConnect Project ID is correct
- Try clearing your browser cache

## Error Handling

Always wrap SDK calls in try-catch:

```typescript
try {
  const result = await sdk.inscribe(config, signer);
  console.log('Inscription started:', result.jobId);
  
  // Poll for status
  const checkStatus = async () => {
    const status = await sdk.retrieveInscription(result.jobId);
    console.log('Status:', status.status);
    
    if (status.status !== 'completed' && status.status !== 'failed') {
      setTimeout(checkStatus, 2000);  // Check every 2 seconds
    }
  };
  
  checkStatus();
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : error);
}
```

## Support

Need help? We've got you covered:

- [GitHub Issues](https://github.com/kiloscribe/inscription-sdk/issues) - Bug reports and feature requests
- [Documentation](https://docs.kiloscribe.com) - Full API documentation
- [Discord](https://discord.gg/kiloscribe) - Community support
- [Twitter](https://twitter.com/kiloscribe) - Updates and announcements
