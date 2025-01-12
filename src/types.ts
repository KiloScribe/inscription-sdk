export type Network = 'mainnet' | 'testnet';

export type InscriptionMode =
  | 'file'
  | 'upload'
  | 'hashinal'
  | 'hashinal-collection';

export interface MetadataObject {
  [key: string]: unknown;
}

export type FileInput =
  | {
      type: 'url';
      url: string;
      fileName?: string;
      mimeType?: string;
    }
  | {
      type: 'base64';
      base64: string;
      fileName: string;
      mimeType?: string;
    };

export interface StartInscriptionRequest {
  file: FileInput;
  holderId: string;
  ttl?: number;
  mode: InscriptionMode;
  network?: Network;
  creator?: string;
  description?: string;
  fileStandard?: string;
  onlyJSONCollection?: boolean;
  jsonFileURL?: string;
  metadataObject?: MetadataObject;
}

export interface InscriptionResult {
  jobId: string;
  transactionId: string;
}

export interface ImageJobResponse {
  id: string;
  status: string;
  hash?: string;
  jsonHash?: string;
  name?: string;
  tx_id: string;
  jsonName?: string;
  gcpFileName?: string;
  fileUrl?: string;
  jsonFileUrl?: string;
  error?: string;
  transactionId?: string;
  transactionBytes?: string;
}

export interface InscriptionSDKConfig {
  apiKey: string;
  network: Network;
}

export interface HederaClientConfig {
  accountId: string;
  privateKey: string;
  network: Network;
}

export interface FileMetadata {
  size: number;
  mimeType: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}