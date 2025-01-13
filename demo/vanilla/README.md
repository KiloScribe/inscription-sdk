# Vanilla JavaScript Demo

This is a simple demo showing how to use the Inscription SDK with vanilla JavaScript and HCS-3 recursion to load WalletConnect.

## Setup

1. Replace `YOUR_PROJECT_ID` in `index.html` with your WalletConnect project ID from the [WalletConnect Dashboard](https://cloud.walletconnect.com/)
2. Replace `YOUR_API_KEY` with your Kiloscribe API key from the [Kiloscribe Dashboard](https://kiloscribe.com/dashboard)

## Features

- Wallet connection using WalletConnect via HCS-3 recursion
- File inscription with progress monitoring
- Query inscriptions by account
- Simple UI with real-time status updates

## Running the Demo

Just serve the directory with any static file server. For example:

```bash
npx http-server .
```

Then open `http://localhost:8080` in your browser.

## Important Notes

- Make sure your wallet (e.g., HashPack) is installed and on the correct network
- The demo uses mainnet by default. Change `data-hcs-network` in the HTML to use testnet
- File inscriptions are limited to 2MB when using base64 encoding
