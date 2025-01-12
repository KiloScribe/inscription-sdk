# Kiloscribe Inscription SDK

TypeScript/JavaScript SDK for inscribing files on the Hedera network using Kiloscribe's inscription service.

## Installation

```bash
npm install @kiloscribe/inscription-sdk
```

## Quick Start

1. Create a `.env` file:
```env
API_KEY=your_api_key
HEDERA_ACCOUNT_ID=your_hedera_account_id
HEDERA_PRIVATE_KEY=your_hedera_private_key
HEDERA_NETWORK=testnet  # or mainnet
HOLDER_ID=0.0.123456    # Hedera account that will own the inscription
```

2. Initialize SDK:
```typescript
import { InscriptionSDK } from '@kiloscribe/inscription-sdk';

// Load and validate environment variables
const sdkConfig = {
  apiKey: process.env.API_KEY,
  network: process.env.HEDERA_NETWORK,
};

const hederaConfig = {
  accountId: process.env.HEDERA_ACCOUNT_ID,
  privateKey: process.env.HEDERA_PRIVATE_KEY,
  network: process.env.HEDERA_NETWORK,
};

const sdk = new InscriptionSDK(sdkConfig);
```

## Usage Examples

### Inscribe from URL
```typescript
const result = await sdk.inscribeAndExecute(
  {
    file: {
      type: 'url',
      url: 'https://picsum.photos/200/300',
    },
    holderId: process.env.HOLDER_ID,
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

// Check inscription status
const status = await sdk.retrieveInscription(result.jobId);
```

### Inscribe Local File
```typescript
import { readFileSync } from 'fs';

// Read and convert file to base64
const imageBuffer = readFileSync('path/to/file.webp');
const base64Image = imageBuffer.toString('base64');

const result = await sdk.inscribeAndExecute(
  {
    file: {
      type: 'base64',
      base64: base64Image,
      fileName: 'example.webp',
      mimeType: 'image/webp',  // Optional, SDK will try to detect
    },
    holderId: process.env.HOLDER_ID,
    mode: 'file',
    network: sdkConfig.network,
    description: 'Example inscription'
  },
  hederaConfig
);
```

### Create Hashinal NFT
```typescript
const result = await sdk.inscribeAndExecute(
  {
    file: {
      type: 'base64',
      base64: base64Image,  // Your image as base64
      fileName: 'example.webp',
      mimeType: 'image/webp',
    },
    holderId: process.env.HOLDER_ID,
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
```

## Try the Examples

The SDK includes working examples in the `examples` directory:

1. Set up environment:
```bash
# Copy example .env file
cp .env.example .env

# Edit .env with your values
nano .env
```

2. Run examples:
```bash
# Inscribe from URL
npm run example:url

# Inscribe local file
npm run example:file

# Create Hashinal NFT
npm run example:hashinal
```

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

## Error Handling

The SDK provides detailed error messages:
```typescript
try {
  const result = await sdk.inscribeAndExecute(/* ... */);
  console.log('Inscription completed:', result);
  
  // Check inscription status
  const status = await sdk.retrieveInscription(result.jobId);
  console.log('Status:', status);
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : error);
}
```

## Support

For issues and feature requests, reach out via [Telegram](https://t.me/hashinals)
