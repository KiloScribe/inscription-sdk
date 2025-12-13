import { InscriptionSDK } from '@kiloscribe/inscription-sdk';
import { HashinalsWalletConnectSDK } from '@hashgraphonline/hashinal-wc';
import { LedgerId } from '@hashgraph/sdk';
import JSZip from 'jszip';

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

const modeSelect = document.getElementById('modeSelect') as HTMLSelectElement;
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

const getSelectedMode = (): 'file' | 'hashinal-collection' => {
  const value = modeSelect?.value;
  return value === 'hashinal-collection' ? 'hashinal-collection' : 'file';
};

const createHashinalCollectionZipBase64 = async (
  base64Image: string,
  imageFile: File,
  creator: string
): Promise<string> => {
  const zip = new JSZip();
  const images = zip.folder('images');
  const metadata = zip.folder('metadata');
  const secondaryImages1 = zip.folder('secondary_images_1');

  if (!images || !metadata || !secondaryImages1) {
    throw new Error('Failed to create collection ZIP folders');
  }

  const extension =
    imageFile.name.toLowerCase().split('.').pop()?.trim() || 'png';

  images.file(`1.${extension}`, base64Image, { base64: true });
  images.file(`2.${extension}`, base64Image, { base64: true });
  secondaryImages1.file(`1.${extension}`, base64Image, { base64: true });
  secondaryImages1.file(`2.${extension}`, base64Image, { base64: true });

  const baseMetadata = {
    format: 'HIP412@2.0.0',
    type: imageFile.type || 'application/octet-stream',
    creator,
    image: '',
    attributes: [],
    files: [],
  };

  metadata.file(
    '1.json',
    JSON.stringify(
      {
        ...baseMetadata,
        name: 'Demo Collection #1',
        description: 'Demo Hashinal collection item #1',
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
        name: 'Demo Collection #2',
        description: 'Demo Hashinal collection item #2',
      },
      null,
      2
    )
  );

  return zip.generateAsync({ type: 'base64' });
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
    updateStatus('Preparing file for inscription...');

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = (e.target?.result as string).split(',')[1];

      try {
        const dAppSigner = wallet.dAppConnector.signers.find((signer) => {
          return signer.getAccountId().toString() === state.accountId;
        })!;

        const mode = getSelectedMode();
        const fileName =
          mode === 'hashinal-collection' ? 'collection.zip' : file.name;
        const fileBase64 =
          mode === 'hashinal-collection'
            ? await createHashinalCollectionZipBase64(base64, file, state.accountId)
            : base64;

        const result = await sdk.inscribe(
          {
            file: {
              type: 'base64',
              base64: fileBase64,
              fileName,
              mimeType: file.type,
            },
            holderId: state.accountId,
            mode,
            network: NETWORK,
            description:
              mode === 'hashinal-collection'
                ? 'Hashinal collection demo via WalletConnect'
                : 'Inscribed via WalletConnect',
          },
          dAppSigner
        );

        updateStatus(
          `Inscription submitted. Transaction ID: ${result.transactionId}`
        );

        const completion = await sdk.waitForInscription(
          result.transactionId,
          90,
          2000,
          true,
          (data) => {
            const percent = Math.round(data.progressPercent ?? 0);
            updateStatus(`[${data.stage}] ${data.message} (${percent}%)`);
          }
        );

        updateStatus(
          `Completed: status=${completion.status}, completed=${completion.completed}`
        );
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

modeSelect?.addEventListener('change', () => {
  const mode = getSelectedMode();
  updateStatus(
    mode === 'hashinal-collection'
      ? 'Mode: Hashinal Collection (will ZIP your selected image)'
      : 'Mode: File (HCS-1)'
  );
});

connectButton.addEventListener('click', handleConnect);
fileInput.addEventListener('change', handleFileSelect);
inscribeButton.addEventListener('click', handleInscribe);
