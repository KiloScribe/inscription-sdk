import axios, { AxiosInstance } from 'axios';
import { Client, PrivateKey, TransferTransaction } from '@hashgraph/sdk';
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
  RetrievedInscriptionResult,
  HolderInscriptionsParams,
  HolderInscriptionsResponse,
} from './types';
import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import { Auth, AuthConfig, AuthResult } from './auth';
import {
  detectKeyTypeFromString,
  HederaMirrorNode,
} from '@hashgraphonline/standards-sdk';
import { ClientAuth } from './client-auth';
import * as fileType from 'file-type';
import { io, Socket } from 'socket.io-client';

export interface RegistrationProgressData {
  stage: 'preparing' | 'submitting' | 'confirming' | 'completed' | 'verifying';
  message: string;
  progressPercent?: number;
  details?: Record<string, any>;
}

export type RegistrationProgressCallback = (
  data: RegistrationProgressData
) => void;

export class InscriptionSDK {
  private readonly client: AxiosInstance;
  private readonly config: InscriptionSDKConfig;
  private readonly logger = Logger.getInstance();
  private socket: Socket | null = null;
  private socketConnected: boolean = false;
  private connectionMode: 'http' | 'websocket' | 'auto' = 'auto';
  private wsBaseUrl: string | null = null;
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
    ico: 'image/x-icon',
    heic: 'image/heic',
    heif: 'image/heif',
    bmp: 'image/bmp',
    webp: 'image/webp',
    tiff: 'image/tiff',
    tif: 'image/tiff',
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
    htm: 'text/html',
    css: 'text/css',
    php: 'application/x-httpd-php',
    java: 'text/x-java-source',
    js: 'application/javascript',
    mjs: 'application/javascript',
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain',
    glb: 'model/gltf-binary',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    oga: 'audio/ogg',
    flac: 'audio/flac',
    aac: 'audio/aac',
    m4a: 'audio/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    m4v: 'video/mp4',
    mpg: 'video/mpeg',
    mpeg: 'video/mpeg',
    ts: 'application/typescript',
    zip: 'application/zip',
    rar: 'application/vnd.rar',
    tar: 'application/x-tar',
    gz: 'application/gzip',
    '7z': 'application/x-7z-compressed',
    xml: 'application/xml',
    yaml: 'application/yaml',
    yml: 'application/yaml',
    md: 'text/markdown',
    markdown: 'text/markdown',
    rtf: 'application/rtf',
    gltf: 'model/gltf+json',
    usdz: 'model/vnd.usdz+zip',
    obj: 'model/obj',
    stl: 'model/stl',
    fbx: 'application/octet-stream',
    ttf: 'font/ttf',
    otf: 'font/otf',
    woff: 'font/woff',
    woff2: 'font/woff2',
    eot: 'application/vnd.ms-fontobject',
    psd: 'application/vnd.adobe.photoshop',
    ai: 'application/postscript',
    eps: 'application/postscript',
    ps: 'application/postscript',
    sqlite: 'application/x-sqlite3',
    db: 'application/x-sqlite3',
    apk: 'application/vnd.android.package-archive',
    ics: 'text/calendar',
    vcf: 'text/vcard',
    py: 'text/x-python',
    rb: 'text/x-ruby',
    go: 'text/x-go',
    rs: 'text/x-rust',
    typescript: 'application/typescript',
    jsx: 'text/jsx',
    tsx: 'text/tsx',
    sql: 'application/sql',
    toml: 'application/toml',
    avif: 'image/avif',
    jxl: 'image/jxl',
    weba: 'audio/webm',
    wasm: 'application/wasm',
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
    this.logger = Logger.getInstance();

    if (config.wsBaseUrl) {
      this.wsBaseUrl = config.wsBaseUrl;
    }

    this.connectionMode = config.connectionMode || 'websocket';

    if (!this.wsBaseUrl && this.connectionMode !== 'http') {
      this.fetchWebSocketServers().catch((err) =>
        this.logger.warn('Failed to fetch WebSocket servers:', err)
      );
    }
  }

  private async getFileMetadata(url: string): Promise<FileMetadata> {
    try {
      const response = await axios.get(url);
      const mimeType = response.headers['content-type'] || '';

      return {
        size: parseInt(response.headers['content-length'] || '0', 10),
        mimeType: mimeType,
      };
    } catch (error) {
      this.logger.error('Error fetching file metadata:', error);
      throw new ValidationError('Unable to fetch file metadata');
    }
  }

  /**
   * Gets the MIME type for a file based on its extension.
   * @param fileName - The name of the file.
   * @returns The MIME type of the file.
   * @throws ValidationError if the file has no extension.
   */
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

  /**
   * Validates the request object.
   * @param request - The request object to validate.
   * @throws ValidationError if the request is invalid.
   */
  private validateRequest(request: StartInscriptionRequest): void {
    this.logger.debug('Validating request:', request);
    if (!request.holderId || request.holderId.trim() === '') {
      this.logger.warn('holderId is missing or empty');
      throw new ValidationError('holderId is required');
    }

    if (!InscriptionSDK.VALID_MODES.includes(request.mode)) {
      throw new ValidationError(
        `Invalid mode: ${
          request.mode
        }. Must be one of: ${InscriptionSDK.VALID_MODES.join(', ')}`
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

  /**
   * Normalizes the MIME type to a standard format.
   * @param mimeType - The MIME type to normalize.
   * @returns The normalized MIME type.
   */
  private normalizeMimeType(mimeType: string): string {
    if (mimeType === 'image/vnd.microsoft.icon') {
      this.logger.debug(
        'Normalizing MIME type from image/vnd.microsoft.icon to image/x-icon'
      );
      return 'image/x-icon';
    }
    return mimeType;
  }

  private validateMimeType(mimeType: string): boolean {
    const validMimeTypes = Object.values(InscriptionSDK.VALID_MIME_TYPES);

    if (validMimeTypes.includes(mimeType)) {
      return true;
    }

    if (mimeType === 'image/vnd.microsoft.icon') {
      this.logger.debug(
        'Accepting alternative MIME type for ICO: image/vnd.microsoft.icon'
      );
      return true;
    }

    return false;
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

      if (!this.validateMimeType(mimeType)) {
        throw new ValidationError(
          'File must have one of the supported MIME types'
        );
      }

      if (file.mimeType === 'image/vnd.microsoft.icon') {
        file.mimeType = this.normalizeMimeType(file.mimeType);
      }
    } else if (file.type === 'url') {
      if (!file.url) {
        throw new ValidationError('URL is required');
      }
    }
  }

  private async detectMimeTypeFromBase64(base64Data: string): Promise<string> {
    if (base64Data.startsWith('data:')) {
      const matches = base64Data.match(/^data:([^;]+);base64,/);
      if (matches && matches.length > 1) {
        return matches[1];
      }
    }

    try {
      const sanitizedBase64 = base64Data.replace(/\s/g, '');
      const buffer = Buffer.from(sanitizedBase64, 'base64');

      const typeResult = await fileType.fileTypeFromBuffer(buffer);
      return typeResult?.mime || 'application/octet-stream';
    } catch (err) {
      this.logger.warn('Failed to detect MIME type from buffer');
      return 'application/octet-stream';
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

      let mimeType = request.file.mimeType;

      if (request.file.type === 'url') {
        const fileMetadata = await this.getFileMetadata(request.file.url);
        mimeType = fileMetadata.mimeType || mimeType;

        if (fileMetadata.size > InscriptionSDK.MAX_URL_FILE_SIZE) {
          throw new ValidationError(
            `File size exceeds maximum URL file limit of ${
              InscriptionSDK.MAX_URL_FILE_SIZE / 1024 / 1024
            }MB`
          );
        }
      } else if (request.file.type === 'base64') {
        mimeType = await this.detectMimeTypeFromBase64(request.file.base64);
      }

      if (mimeType === 'image/vnd.microsoft.icon') {
        mimeType = this.normalizeMimeType(mimeType);
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
          fileMimeType: mimeType || this.getMimeType(request.file.fileName),
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

      const mirrorNode = new HederaMirrorNode(clientConfig.network);
      const account = await mirrorNode.requestAccount(clientConfig.accountId);
      const type = account?.key?._type;

      const keyIsString = typeof clientConfig.privateKey === 'string';
      let privateKey: PrivateKey;

      if (keyIsString) {
        // Use the enhanced key type detection with confidence level
        const keyDetection = detectKeyTypeFromString(clientConfig.privateKey as string);
        
        if (keyDetection.warning && keyDetection.privateKey) {
          this.logger.warn(`Key type detection warning: ${keyDetection.warning}`);
        }
        
        privateKey = keyDetection.privateKey;
      } else {
        privateKey = clientConfig.privateKey as PrivateKey;
      }

      client.setOperator(clientConfig.accountId, privateKey);

      const transaction = TransferTransaction.fromBytes(
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
      const transaction = TransferTransaction.fromBytes(
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
    clientConfig: HederaClientConfig,
    progressCallback?: RegistrationProgressCallback,
    options?: {
      waitForCompletion?: boolean;
      maxWaitTime?: number;
      checkInterval?: number;
    }
  ): Promise<InscriptionResult> {
    const waitForCompletion = options?.waitForCompletion ?? true;
    const maxWaitTime = options?.maxWaitTime ?? 120000;
    const checkInterval = options?.checkInterval ?? 2000;

    this.logger.debug('inscribeAndExecute called', {
      hasProgressCallback: !!progressCallback,
      connectionMode: this.connectionMode,
      wsBaseUrl: this.wsBaseUrl,
    });

    if (this.connectionMode !== 'http') {
      const useWebSocket =
        this.connectionMode === 'websocket' ||
        (this.connectionMode === 'auto' && (await this.detectBestConnection()));

      if (useWebSocket) {
        try {
          const wsResult = await this.inscribeViaWebSocket(
            request,
            clientConfig,
            progressCallback
          );
          return wsResult;
        } catch (error) {
          this.logger.error(
            'WebSocket inscription failed, falling back to HTTP:',
            error
          );
          throw error;
        }
      } else {
        this.logger.info(
          `Not using WebSocket: useWebSocket=${useWebSocket}, wsBaseUrl=${this.wsBaseUrl}`
        );
      }
    } else {
      this.logger.info(
        `Not using WebSocket: hasCallback=${!!progressCallback}, connectionMode=${
          this.connectionMode
        }`
      );
    }

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

    const result = {
      jobId: inscriptionResponse.tx_id,
      transactionId,
    };

    if (waitForCompletion) {
      if (progressCallback) {
        progressCallback({
          stage: 'confirming',
          message: 'Transaction executed, waiting for inscription to complete',
          progressPercent: 5,
        });
      }

      const maxAttempts = Math.floor(maxWaitTime / checkInterval);
      const finalResult = await this.waitForInscription(
        transactionId,
        maxAttempts,
        checkInterval,
        true,
        progressCallback
      );

      return {
        ...result,
        topicId: finalResult.topic_id,
        status: finalResult.status,
        completed: finalResult.completed,
      };
    }

    return result;
  }

  private async fetchWebSocketServers(): Promise<void> {
    try {
      const response = await this.client.get('/inscriptions/websocket-servers');
      const { servers, recommended } = response.data;

      if (recommended) {
        this.wsBaseUrl = recommended;
      } else if (servers && servers.length > 0) {
        const activeServers = servers.filter((s: any) => s.status === 'active');
        if (activeServers.length > 0) {
          const selectedServer = activeServers[0];
          this.wsBaseUrl = selectedServer.url;
        }
      }
    } catch (error) {
      this.logger.debug(
        'Could not fetch WebSocket servers, will use HTTP only'
      );
    }
  }

  private async detectBestConnection(): Promise<boolean> {
    if (!this.wsBaseUrl) return false;

    try {
      const testSocket = io(this.wsBaseUrl, {
        auth: { apiKey: this.config.apiKey },
        transports: ['websocket'],
        timeout: 3000,
      });

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          testSocket.disconnect();
          resolve(false);
        }, 3000);

        testSocket.on('connect', () => {
          clearTimeout(timeout);
          testSocket.disconnect();
          resolve(true);
        });

        testSocket.on('connect_error', () => {
          clearTimeout(timeout);
          testSocket.disconnect();
          resolve(false);
        });
      });
    } catch (e) {
      return false;
    }
  }

  private async inscribeViaWebSocket(
    request: StartInscriptionRequest,
    clientConfig: HederaClientConfig,
    progressCallback?: RegistrationProgressCallback
  ): Promise<InscriptionResult> {
    if (!this.wsBaseUrl) {
      const response = await this.client.get('/inscriptions/websocket-servers');
      const recommended = response.data.recommended;
      if (!recommended) {
        throw new Error('No WebSocket servers available');
      }
      this.wsBaseUrl = recommended;
    }

    await this.connectWebSocket();

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        return reject(new Error('WebSocket not connected'));
      }

      let jobId: string;
      let transactionId: string;
      let topicId: string | undefined;
      let timeoutHandle: NodeJS.Timeout;

      const cleanup = () => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        this.socket?.off('inscription-progress', progressHandler);
        this.socket?.off('inscription-complete', completeHandler);
        this.socket?.off('inscription-error', errorHandler);
      };

      const TIMEOUT_MS = 60000;
      timeoutHandle = setTimeout(() => {
        this.logger.error(
          `WebSocket inscription timeout after ${TIMEOUT_MS / 1000} seconds`,
          {
            jobId,
            transactionId,
            lastTopicId: topicId,
          }
        );
        cleanup();
        resolve({
          jobId,
          transactionId,
          topicId,
          topic_id: topicId,
          status: 'timeout',
          completed: false,
        });
      }, TIMEOUT_MS);

      const completeHandler = (data: any) => {
        cleanup();
        resolve({
          jobId,
          transactionId,
          topicId: data.topicId || data.topic_id,
          topic_id: data.topicId || data.topic_id,
          status: 'completed',
          completed: true,
        });
      };

      const errorHandler = (data: any) => {
        cleanup();
        reject(new Error(data.error || 'Inscription failed'));
      };

      const progressHandler = (data: any) => {
        this.logger.debug('Progress event received:', {
          jobId: data.jobId,
          status: data.status,
          progress: data.progress,
          topicId: data.topicId || data.topic_id,
          topic_id: data.topicId || data.topic_id,
        });

        if (data.topicId || data.topic_id) {
          topicId = data.topicId || data.topic_id;
        }

        if (progressCallback) {
          progressCallback({
            stage: data.status === 'completed' ? 'completed' : 'confirming',
            message: `Processing inscription: ${data.status}`,
            progressPercent: data.progress || 0,
            details: data,
          });
        }

        if (data.status === 'completed' || data.progress === 100) {
          this.logger.info('Inscription completed via progress handler', {
            status: data.status,
            progress: data.progress,
            topicId: data.topicId || data.topic_id || topicId,
            topic_id: data.topicId || data.topic_id || topicId,
          });
          cleanup();
          resolve({
            jobId,
            transactionId,
            topicId: data.topicId || data.topic_id || topicId,
            topic_id: data.topicId || data.topic_id || topicId,
            status: 'completed',
            completed: true,
          });
        }
      };

      this.socket.on('inscription-progress', progressHandler);
      this.socket.on('inscription-complete', completeHandler);
      this.socket.on('inscription-error', errorHandler);

      this.socket.emit(
        'start-inscription',
        {
          ...request,
          network: this.config.network,
        },
        async (response: any) => {
          if (!response.success) {
            cleanup();
            return reject(new Error(response.error || 'Inscription failed'));
          }

          try {
            if (!response.transactionBytes) {
              throw new Error(
                'No transaction bytes returned from WebSocket inscription'
              );
            }

            transactionId = await this.executeTransaction(
              response.transactionBytes,
              clientConfig
            );

            jobId = response.jobId || response.tx_id;
            if (!jobId) {
              throw new Error('No job ID returned from WebSocket inscription');
            }

            if (progressCallback) {
              progressCallback({
                stage: 'confirming',
                message: 'Transaction executed, inscribing to HCS...',
                progressPercent: 5,
              });
            }

            this.logger.info(
              'Transaction executed, waiting for inscription completion...',
              {
                jobId,
                transactionId,
              }
            );
          } catch (error) {
            cleanup();
            reject(error);
          }
        }
      );
    });
  }

  private async connectWebSocket(): Promise<void> {
    if (this.socketConnected && this.socket) return;

    if (!this.wsBaseUrl) {
      throw new Error('WebSocket URL not configured');
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.wsBaseUrl!, {
        auth: { apiKey: this.config.apiKey },
        transports: ['websocket', 'polling'],
      });

      const timeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        this.socketConnected = true;
        this.logger.info('WebSocket connected');
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.socketConnected = false;
        reject(new Error(`WebSocket connection failed: ${error.message}`));
      });

      this.socket.on('disconnect', () => {
        this.socketConnected = false;
        this.logger.info('WebSocket disconnected');
      });
    });
  }

  /**
   * Disconnects the WebSocket connection if active
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.socketConnected = false;
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
  async retrieveInscription(txId: string): Promise<RetrievedInscriptionResult> {
    if (!txId) {
      throw new ValidationError('Transaction ID is required');
    }

    try {
      return await this.retryWithBackoff(async () => {
        const response = await this.client.get(
          `/inscriptions/retrieve-inscription?id=${txId}`
        );
        const result = response.data as ImageJobResponse;
        return { ...result, jobId: result.id };
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
  static async createWithAuth(
    config:
      | {
          type: 'client';
          accountId: string;
          signer: DAppSigner;
          network?: 'mainnet' | 'testnet';
          baseUrl?: string;
          wsBaseUrl?: string;
          connectionMode?: 'http' | 'websocket' | 'auto';
        }
      | {
          type: 'server';
          accountId: string;
          privateKey: string | PrivateKey;
          network?: 'mainnet' | 'testnet';
          baseUrl?: string;
          wsBaseUrl?: string;
          connectionMode?: 'http' | 'websocket' | 'auto';
        }
  ): Promise<InscriptionSDK> {
    const auth =
      config.type === 'client'
        ? new ClientAuth({
            ...config,
            logger: Logger.getInstance(),
          })
        : new Auth(config);

    const { apiKey } = await auth.authenticate();

    return new InscriptionSDK({
      apiKey,
      network: config.network || 'mainnet',
      wsBaseUrl: config.wsBaseUrl,
      connectionMode: config.connectionMode || 'websocket',
    });
  }

  async waitForInscription(
    txId: string,
    maxAttempts: number = 30,
    intervalMs: number = 4000,
    checkCompletion: boolean = false,
    progressCallback?: RegistrationProgressCallback
  ): Promise<RetrievedInscriptionResult> {
    let attempts = 0;
    let highestPercentSoFar = 0;

    const reportProgress = (
      stage:
        | 'preparing'
        | 'submitting'
        | 'confirming'
        | 'completed'
        | 'verifying',
      message: string,
      percent: number,
      details?: Record<string, any>
    ) => {
      if (progressCallback) {
        try {
          highestPercentSoFar = Math.max(highestPercentSoFar, percent);
          progressCallback({
            stage,
            message,
            progressPercent: highestPercentSoFar,
            details: {
              ...details,
              txId,
              currentAttempt: attempts,
              maxAttempts,
            },
          });
        } catch (err) {
          this.logger.warn(`Error in progress callback: ${err}`);
        }
      }
    };

    reportProgress('confirming', 'Starting inscription verification', 0);

    while (attempts < maxAttempts) {
      reportProgress(
        'confirming',
        `Verifying inscription status (attempt ${attempts + 1}/${maxAttempts})`,
        5,
        { attempt: attempts + 1 }
      );

      const result = await this.retrieveInscription(txId);

      if (result.error) {
        reportProgress('verifying', `Error: ${result.error}`, 100, {
          error: result.error,
        });
        throw new Error(result.error);
      }

      let progressPercent = 5;

      if (
        result.messages !== undefined &&
        result.maxMessages !== undefined &&
        result.maxMessages > 0
      ) {
        progressPercent = Math.min(
          95,
          5 + (result.messages / result.maxMessages) * 90
        );

        if (result.completed) {
          progressPercent = 100;
        }
      } else if (result.status === 'processing') {
        progressPercent = 10;
      } else if (result.completed) {
        progressPercent = 100;
      }

      reportProgress(
        result.completed ? 'completed' : 'confirming',
        result.completed
          ? 'Inscription completed successfully'
          : `Processing inscription (${result.status})`,
        progressPercent,
        {
          status: result.status,
          messagesProcessed: result.messages,
          maxMessages: result.maxMessages,
          messageCount: result.messages,
          completed: result.completed,
          confirmedMessages: result.confirmedMessages,
          result,
        }
      );

      const isHashinal = result.mode === 'hashinal';
      const isDynamic = result.fileStandard?.toString() === '6';

      if (isHashinal && result.topic_id && result.jsonTopicId) {
        if (!checkCompletion || result.completed) {
          reportProgress(
            'completed',
            'Inscription verification complete',
            100,
            { result }
          );
          return result;
        }
      }

      if (!isHashinal && !isDynamic && result.topic_id) {
        if (!checkCompletion || result.completed) {
          reportProgress(
            'completed',
            'Inscription verification complete',
            100,
            { result }
          );
          return result;
        }
      }

      if (
        isDynamic &&
        result.topic_id &&
        result.jsonTopicId &&
        result.registryTopicId
      ) {
        if (!checkCompletion || result.completed) {
          reportProgress(
            'completed',
            'Inscription verification complete',
            100,
            { result }
          );
          return result;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      attempts++;
    }

    reportProgress(
      'verifying',
      `Inscription ${txId} did not complete within ${maxAttempts} attempts`,
      100,
      { timedOut: true }
    );

    throw new Error(
      `Inscription ${txId} did not complete within ${maxAttempts} attempts`
    );
  }

  /**
   * Fetch inscriptions owned by a specific holder
   * @param params Query parameters for retrieving holder's inscriptions
   * @returns Array of inscription details owned by the holder
   */
  async getHolderInscriptions(
    params: HolderInscriptionsParams
  ): Promise<HolderInscriptionsResponse> {
    if (!params.holderId) {
      throw new ValidationError('Holder ID is required');
    }

    try {
      const queryParams: Record<string, string> = {
        holderId: params.holderId,
      };

      if (params.includeCollections) {
        queryParams.includeCollections = '1';
      }

      const response = await this.client.get(
        '/inscriptions/holder-inscriptions',
        {
          params: queryParams,
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch holder inscriptions:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to fetch holder inscriptions'
        );
      }
      throw error;
    }
  }
}
