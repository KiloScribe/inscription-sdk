import { PrivateKey } from '@hashgraph/sdk';
import { KeyType } from './key-type-detector';

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
  topicId?: string;
  status?: string;
  completed?: boolean;
}

export interface ImageJobResponse {
  id: string;
  status: string;
  completed: boolean;
  hash?: string;
  jsonHash?: string;
  name?: string;
  tx_id: string;
  jsonName?: string;
  gcpFileName?: string;
  messages?: number;
  maxMessages?: number;
  confirmedMessages?: boolean;
  fileUrl?: string;
  jsonFileUrl?: string;
  error?: string;
  transactionId?: string;
  transactionBytes?: string;
  topic_id: string;
  jsonTopicId: string;
  registryTopicId: string;
  fileStandard?: 1 | 2 | 6;
  mode?: InscriptionMode;
}

export interface RetrievedInscriptionResult extends ImageJobResponse {
  jobId: string;
}

export interface InscriptionSDKConfig {
  apiKey: string;
  network: Network;
  wsBaseUrl?: string;
  connectionMode?: 'http' | 'websocket' | 'auto';
}

export interface HederaClientConfig {
  accountId: string;
  privateKey: string | PrivateKey;
  network: Network;
  keyType?: KeyType;
}

export interface FileMetadata {
  size: number;
  mimeType: string;
}

export interface InscriptionNumbersParams {
  ht_id?: string;
  sn?: number;
  inscriptionNumber?: number;
  sort?: 'asc' | 'desc';
  random?: boolean;
  limit?: number;
}

export interface InscriptionJson {
  name: string;
  creator: string;
  description: string;
  image: string;
  type: string;
  properties: {
    compiler: string;
  };
  format: string;
}

export interface InscriptionNumberDetails {
  sn: number;
  t_id: string;
  account_id: number;
  created_timestamp: string;
  treasury_account_id: string;
  ht_id: number;
  image: string;
  inscription_number: number;
  json: InscriptionJson;
  mimetype: string;
  op: string;
  p: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface HolderInscriptionsParams {
  holderId: string;
  includeCollections?: boolean;
}

export type HolderInscriptionsResponse = ImageJobResponse[];
