# Inscription SDK Demo

A complete example of using the Kiloscribe Inscription SDK with WalletConnect in a browser environment. This demo shows how to:
- Connect a Hedera wallet using WalletConnect
- Select and preview files
- Create inscriptions
- Monitor inscription status

## Prerequisites

1. **Hedera Wallet**
   - Install [HashPack](https://www.hashpack.app/download) or another Hedera wallet
   - Create a testnet account if you don't have one
   - Make sure you have some testnet HBAR (use [Hedera Portal](https://portal.hedera.com) faucet)

2. **WalletConnect Project ID**
   - Create an account at [cloud.walletconnect.com](https://cloud.walletconnect.com)
   - Create a new project
   - Copy your Project ID

3. **Kiloscribe API Key**
   - Get your API key from [kiloscribe.com/inscription-api](https://kiloscribe.com/inscription-api)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Edit `.env` and add your keys:
```env
VITE_API_KEY=your_kiloscribe_api_key
VITE_PROJECT_ID=your_walletconnect_project_id
VITE_NETWORK=testnet
```

## Development

Start the development server:
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Connect Wallet**
   - Click "Connect Wallet"
   - Scan QR code with your mobile wallet, or
   - Click to connect with your browser wallet

2. **Select File**
   - Click "Choose File"
   - Select any supported file type
   - Preview will appear below

3. **Create Inscription**
   - Click "Inscribe"
   - Approve the transaction in your wallet
   - Watch the status update

## File Support

### Size Limits
- Maximum file size: 2MB
- For larger files, use URL inscriptions in the main SDK

### Supported Formats
- Images: jpg, jpeg, png, gif, bmp, webp, tiff, svg
- Video: mp4, webm
- Audio: mp3
- Documents: pdf
- Data: json, txt

## Troubleshooting

### "Failed to connect wallet"
- Check if your wallet is installed
- Make sure you're on testnet
- Verify your WalletConnect Project ID

### "Transaction failed"
- Ensure you have enough testnet HBAR
- Try reconnecting your wallet
- Check the browser console for detailed errors

### "File too large"
- Keep files under 2MB
- Try compressing your file
- For larger files, use URL inscriptions

## Project Structure

```
demo/
├── index.html      # Main HTML file
├── main.ts         # Core application logic
├── style.css       # Styling
├── vite.config.ts  # Vite configuration
└── package.json    # Dependencies
```

## Dependencies

- `@kiloscribe/inscription-sdk`: Core inscription functionality
- `@hashgraphonline/hashinal-wc`: WalletConnect integration
- `@hashgraph/sdk`: Hedera SDK
- `@hashgraph/hedera-wallet-connect`: Hedera WalletConnect types
- `vite`: Development server and bundler
- `vite-plugin-node-polyfills`: Node.js polyfills for browser

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Submit a pull request

## License

MIT - see the main [README](../README.md) for details.
