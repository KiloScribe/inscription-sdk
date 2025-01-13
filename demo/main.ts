import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { HashinalsWalletConnectSDK } from '@hashgraphonline/hashinal-wc';
import { LedgerId } from '@hashgraph/sdk';

type WalletState = {
  accountId: string;
  connected: boolean;
};

const API_KEY = import.meta.env.VITE_API_KEY;
const NETWORK = (import.meta.env.VITE_NETWORK || 'testnet') as
  | 'testnet'
  | 'mainnet';

const state: WalletState = {
  accountId: '',
  connected: false,
};

const sdk = new InscriptionSDK({
  apiKey: API_KEY,
  network: NETWORK,
});

const wallet = new HashinalsWalletConnectSDK();

const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const connectButton = document.getElementById(
  'connectButton'
) as HTMLButtonElement;
const inscribeButton = document.getElementById(
  'inscribeButton'
) as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;
const previewDiv = document.getElementById('preview') as HTMLDivElement;

const updateStatus = (message: string, isError = false) => {
  statusDiv.textContent = message;
  statusDiv.className = `status ${isError ? 'error' : 'success'}`;
};

const handleConnect = async () => {
  try {
    const { accountId, balance } = await wallet.connectWallet(
      import.meta.env.VITE_PROJECT_ID,
      {
        name: 'Inscription SDK Demo',
        description: 'Demo app for inscribing files using WalletConnect',
        url: window.location.origin,
        icons: ['https://walletconnect.com/walletconnect-logo.png'],
      },
      LedgerId.TESTNET
    );

    state.accountId = accountId;
    state.connected = true;

    connectButton.textContent = `Connected: ${accountId} (${balance})`;
    inscribeButton.disabled = !fileInput.files?.length;
    updateStatus('Wallet connected successfully');
  } catch (error) {
    updateStatus(
      error instanceof Error ? error.message : 'Failed to connect wallet',
      true
    );
  }
};

const handleFileSelect = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.src = e.target?.result as string;
      previewDiv.innerHTML = '';
      previewDiv.appendChild(img);
    };
    reader.readAsDataURL(file);
    inscribeButton.disabled = !state.connected;
  }
};

const handleInscribe = async () => {
  const file = fileInput.files?.[0];
  if (!file || !state.connected) return;

  try {
    inscribeButton.disabled = true;
    console.log('Inscribing file...');
    updateStatus('Preparing file for inscription...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];

      try {
        const dAppSigner = wallet.dAppConnector.signers.find((signer) => {
          return signer.getAccountId().toString() === state.accountId;
        })!;
        const result = await sdk.inscribe(
          {
            file: {
              type: 'base64',
              base64,
              fileName: file.name,
              mimeType: file.type,
            },
            holderId: state.accountId,
            mode: 'file',
            network: NETWORK,
            description: 'Inscribed via WalletConnect',
          },
          dAppSigner
        );

        console.log('Inscription completed:', result);
        updateStatus(`Inscription started! Job ID: ${result.jobId}`);

        if (result.jobId) {
          const status = await sdk.retrieveInscription(result.jobId);
          updateStatus(`Inscription status: ${status.status}`);
        }
      } catch (error) {
        updateStatus(
          error instanceof Error ? error.message : 'Inscription failed',
          true
        );
        inscribeButton.disabled = false;
      }
    };
    reader.readAsDataURL(file);
  } catch (error) {
    updateStatus(
      error instanceof Error ? error.message : 'Failed to prepare file',
      true
    );
    inscribeButton.disabled = false;
  }
};

connectButton.addEventListener('click', handleConnect);
fileInput.addEventListener('change', handleFileSelect);
inscribeButton.addEventListener('click', handleInscribe);
