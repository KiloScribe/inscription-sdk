import axios, { AxiosInstance } from 'axios';
import { Client, Transaction, PrivateKey } from '@hashgraph/sdk';
import { Logger } from './logger';
import {
  InscriptionSDKConfig,
  StartInscriptionRequest,
  ImageJobResponse,
  ValidationError,
  FileMetadata,
  FileInput,
  HederaClientConfig,
  InscriptionResult,
  InscriptionNumbersParams,
  InscriptionNumberDetails,
} from './types';
import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import { Auth, AuthConfig, AuthResult } from './auth';

export class InscriptionSDK {
  private readonly client: AxiosInstance;
  private readonly config: InscriptionSDKConfig;
  private readonly logger = Logger.getInstance();
  private static readonly VALID_MODES = [
    'file',
    'upload',
    'hashinal',
    'hashinal-collection',
  ] as const;
  private static readonly MAX_BASE64_SIZE = 2 * 1024 * 1024;
  private static readonly MAX_URL_FILE_SIZE = 100 * 1024 * 1024;
  private static readonly VALID_MIME_TYPES: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    tiff: 'image/tiff',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mp3: 'audio/mpeg',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain',
    glb: 'model/gltf-binary',
  };

  constructor(config: InscriptionSDKConfig) {
    this.config = config;

    if (!config.apiKey) {
      throw new ValidationError('API key is required');
    }

    if (!config.network) {
      throw new ValidationError('Network is required');
    }

    const headers = {
      'x-api-key': config.apiKey,
      'Content-Type': 'application/json',
    };

    this.client = axios.create({
      baseURL: 'https://v2-api.tier.bot/api',
      headers,
    });
  }

  private async getFileMetadata(url: string): Promise<FileMetadata> {
    try {
      const response = await axios.get(url);
      return {
        size: parseInt(response.headers['content-length'] || '0', 10),
        mimeType: response.headers['content-type'] || '',
      };
    } catch (error) {
      this.logger.error('Error fetching file metadata:', error);
      throw new ValidationError('Unable to fetch file metadata');
    }
  }

  private getMimeType(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    if (!extension) {
      throw new ValidationError('File must have an extension');
    }

    const mimeType =
      InscriptionSDK.VALID_MIME_TYPES[
        extension as keyof typeof InscriptionSDK.VALID_MIME_TYPES
      ];
    if (!mimeType) {
      throw new ValidationError(`Unsupported file type: ${extension}`);
    }

    return mimeType;
  }

  private validateRequest(request: StartInscriptionRequest): void {
    this.logger.debug('Validating request:', request);
    if (!request.holderId || request.holderId.trim() === '') {
      this.logger.warn('holderId is missing or empty');
      throw new ValidationError('holderId is required');
    }

    if (!InscriptionSDK.VALID_MODES.includes(request.mode)) {
      throw new ValidationError(
        `Invalid mode. Must be one of: ${InscriptionSDK.VALID_MODES.join(', ')}`
      );
    }

    if (request.mode === 'hashinal') {
      if (!request.jsonFileURL && !request.metadataObject) {
        throw new ValidationError(
          'Hashinal mode requires either jsonFileURL or metadataObject'
        );
      }
    }

    if (request.onlyJSONCollection && request.mode !== 'hashinal-collection') {
      throw new ValidationError(
        'onlyJSONCollection can only be used with hashinal-collection mode'
      );
    }

    this.validateFileInput(request.file);
  }

  private validateFileInput(file: FileInput): void {
    if (file.type === 'base64') {
      if (!file.base64) {
        throw new ValidationError('Base64 data is required');
      }

      const base64Data = file.base64.replace(/^data:.*?;base64,/, '');
      const size = Math.ceil(base64Data.length * 0.75);
      if (size > InscriptionSDK.MAX_BASE64_SIZE) {
        throw new ValidationError(
          `File size exceeds maximum limit of ${
            InscriptionSDK.MAX_BASE64_SIZE / 1024 / 1024
          }MB`
        );
      }

      const mimeType = file.mimeType || this.getMimeType(file.fileName);
      const validMimeTypes = Object.values(InscriptionSDK.VALID_MIME_TYPES);
      if (!validMimeTypes.includes(mimeType)) {
        throw new ValidationError(
          'File must have one of the supported MIME types'
        );
      }
    } else if (file.type === 'url') {
      if (!file.url) {
        throw new ValidationError('URL is required');
      }
    }
  }

  /**
   * Starts an inscription and returns the transaction bytes.
   * @param request - The request object containing the file to inscribe and the client configuration
   * @returns The transaction bytes of the started inscription
   * @throws ValidationError if the request is invalid
   * @throws Error if the inscription fails
   */
  async startInscription(
    request: StartInscriptionRequest
  ): Promise<ImageJobResponse> {
    try {
      this.validateRequest(request);

      if (request.file.type === 'url') {
        const fileMetadata = await this.getFileMetadata(request.file.url);
        if (fileMetadata.size > InscriptionSDK.MAX_URL_FILE_SIZE) {
          throw new ValidationError(
            `File size exceeds maximum URL file limit of ${
              InscriptionSDK.MAX_URL_FILE_SIZE / 1024 / 1024
            }MB`
          );
        }
      }

      if (request.jsonFileURL) {
        const jsonMetadata = await this.getFileMetadata(request.jsonFileURL);
        if (jsonMetadata.mimeType !== 'application/json') {
          throw new ValidationError(
            'JSON file must be of type application/json'
          );
        }
      }

      const requestBody = {
        holderId: request.holderId,
        mode: request.mode,
        network: this.config.network,
        onlyJSONCollection: request.onlyJSONCollection ? 1 : 0,
        creator: request.creator,
        description: request.description,
        fileStandard: request.fileStandard,
        metadataObject: request.metadataObject,
        jsonFileURL: request.jsonFileURL,
      };

      let response;
      if (request.file.type === 'url') {
        response = await this.client.post('/inscriptions/start-inscription', {
          ...requestBody,
          fileURL: request.file.url,
        });
      } else {
        response = await this.client.post('/inscriptions/start-inscription', {
          ...requestBody,
          fileBase64: request.file.base64,
          fileName: request.file.fileName,
          fileMimeType:
            request.file.mimeType || this.getMimeType(request.file.fileName),
        });
      }
      return response.data;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to start inscription'
        );
      }

      throw error;
    }
  }

  /**
   * Executes a transaction with the provided transaction bytes,
   * typically called after inscribing a file through `startInscription`.
   * @param transactionBytes - The bytes of the transaction to execute.
   * @param clientConfig - The configuration for the Hedera client.
   * @returns The transaction receipt.
   * @throws ValidationError if the transaction bytes are invalid.
   * @throws Error if the execution fails.
   */
  async executeTransaction(
    transactionBytes: string,
    clientConfig: HederaClientConfig
  ): Promise<string> {
    try {
      const client =
        clientConfig.network === 'mainnet'
          ? Client.forMainnet()
          : Client.forTestnet();

      const privateKey = PrivateKey.fromString(clientConfig.privateKey);
      client.setOperator(clientConfig.accountId, privateKey);

      const transaction = Transaction.fromBytes(
        Buffer.from(transactionBytes, 'base64')
      );

      const signedTransaction = await transaction.sign(privateKey);
      const executeTx = await signedTransaction.execute(client);
      const receipt = await executeTx.getReceipt(client);
      const status = receipt.status.toString();

      if (status !== 'SUCCESS') {
        throw new Error(`Transaction failed with status: ${status}`);
      }

      return executeTx.transactionId.toString();
    } catch (error) {
      throw new Error(
        `Failed to execute transaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Executes a transaction with the provided transaction bytes using a Signer,
   * typically called after inscribing a file through `startInscription`.
   * @param transactionBytes - The bytes of the transaction to execute.
   * @param clientConfig - The configuration for the Hedera client.
   * @returns The transaction receipt.
   * @throws ValidationError if the transaction bytes are invalid.
   * @throws Error if the execution fails.
   */
  async executeTransactionWithSigner(
    transactionBytes: string,
    signer: DAppSigner
  ): Promise<string> {
    try {
      const transaction = Transaction.fromBytes(
        Buffer.from(transactionBytes, 'base64')
      );

      const executeTx = await transaction.executeWithSigner(signer);
      const receipt = await executeTx.getReceiptWithSigner(signer);
      const status = receipt.status.toString();

      if (status !== 'SUCCESS') {
        throw new Error(`Transaction failed with status: ${status}`);
      }

      return executeTx.transactionId.toString();
    } catch (error) {
      throw new Error(
        `Failed to execute transaction: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  /**
   * Inscribes a file and executes the transaction. Note that base64 files are limited to 2MB, while URL files are limited to 100MB.
   * @param request - The request object containing the file to inscribe and the client configuration
   * @param clientConfig - The configuration for the Hedera network and account
   * @returns The transaction ID of the executed transaction
   * @throws ValidationError if the request is invalid
   * @throws Error if the transaction execution fails
   */
  async inscribeAndExecute(
    request: StartInscriptionRequest,
    clientConfig: HederaClientConfig
  ): Promise<InscriptionResult> {
    const inscriptionResponse = await this.startInscription(request);

    if (!inscriptionResponse.transactionBytes) {
      this.logger.error(
        'No transaction bytes returned from inscription request',
        inscriptionResponse
      );
      throw new Error('No transaction bytes returned from inscription request');
    }

    this.logger.info('executing transaction');
    const transactionId = await this.executeTransaction(
      inscriptionResponse.transactionBytes,
      clientConfig
    );

    return {
      jobId: inscriptionResponse.tx_id,
      transactionId,
    };
  }

  /**
   * Inscribes a file and executes the transaction. Note that base64 files are limited to 2MB, while URL files are limited to 100MB.
   * @param request - The request object containing the file to inscribe and the client configuration
   * @param clientConfig - The configuration for the Hedera network and account
   * @returns The transaction ID of the executed transaction
   * @throws ValidationError if the request is invalid
   * @throws Error if the transaction execution fails
   */
  async inscribe(
    request: StartInscriptionRequest,
    signer: DAppSigner
  ): Promise<InscriptionResult> {
    const inscriptionResponse = await this.startInscription(request);

    if (!inscriptionResponse.transactionBytes) {
      this.logger.error(
        'No transaction bytes returned from inscription request',
        inscriptionResponse
      );
      throw new Error('No transaction bytes returned from inscription request');
    }

    this.logger.info('executing transaction');
    const transactionId = await this.executeTransactionWithSigner(
      inscriptionResponse.transactionBytes,
      signer
    );

    return {
      jobId: inscriptionResponse.tx_id,
      transactionId,
    };
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));

        this.logger.debug(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`
        );
      }
    }
    throw new Error('Retry operation failed');
  }

  /**
   * Retrieves an inscription by its transaction id. Call this function on an interval
   * so you can retrieve the status. Store the transaction id in your database if you
   * need to reference it later on
   * @param txId - The ID of the inscription to retrieve
   * @returns The retrieved inscription
   * @throws ValidationError if the ID is invalid
   * @throws Error if the retrieval fails
   */
  async retrieveInscription(txId: string): Promise<ImageJobResponse> {
    if (!txId) {
      throw new ValidationError('Transaction ID is required');
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await this.client.get(
          `/inscriptions/retrieve-inscription?id=${txId}`
        );
        return response.data;
      });
    } catch (error) {
      this.logger.error('Failed to retrieve inscription:', error);
      throw error;
    }
  }

  /**
   * Fetch inscription numbers with optional filtering and sorting
   * @param params Query parameters for filtering and sorting inscriptions
   * @returns Array of inscription details
   */
  async getInscriptionNumbers(
    params: InscriptionNumbersParams = {}
  ): Promise<InscriptionNumberDetails[]> {
    try {
      const response = await this.client.get('/inscriptions/numbers', {
        params,
      });
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch inscription numbers:', error);
      throw error;
    }
  }

  /**
   * Authenticates the SDK with the provided configuration
   * @param config - The configuration for authentication
   * @returns The authentication result
   */
  static async authenticate(config: AuthConfig): Promise<AuthResult> {
    const auth = new Auth(config);
    return auth.authenticate();
  }

  /**
   * Creates an instance of the InscriptionSDK with authentication.
   * Useful for cases where you don't have an API key but need to authenticate from server-side
   * with a private key.
   * @param config - The configuration for authentication
   * @returns An instance of the InscriptionSDK
   */
  static async createWithAuth(config: AuthConfig): Promise<InscriptionSDK> {
    const auth = new Auth(config);

    const { apiKey } = await auth.authenticate();

    return new InscriptionSDK({
      apiKey,
      network: config.network || 'mainnet',
    });
  }
}
