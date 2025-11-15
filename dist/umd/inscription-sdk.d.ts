import { PrivateKey } from '@hashgraph/sdk';
import { InscriptionSDKConfig, StartInscriptionRequest, ImageJobResponse, HederaClientConfig, InscriptionResult, InscriptionNumbersParams, InscriptionNumberDetails, RetrievedInscriptionResult, HolderInscriptionsParams, HolderInscriptionsResponse } from './types';
import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import { AuthConfig, AuthResult } from './auth';
export interface RegistrationProgressData {
    stage: 'preparing' | 'submitting' | 'confirming' | 'completed' | 'verifying';
    message: string;
    progressPercent?: number;
    details?: Record<string, any>;
}
export type RegistrationProgressCallback = (data: RegistrationProgressData) => void;
export declare class InscriptionSDK {
    private readonly client;
    private readonly config;
    private readonly logger;
    private socket;
    private socketConnected;
    private connectionMode;
    private wsBaseUrl;
    private static readonly VALID_MODES;
    private static readonly MAX_BASE64_SIZE;
    private static readonly MAX_URL_FILE_SIZE;
    private static readonly VALID_MIME_TYPES;
    constructor(config: InscriptionSDKConfig);
    private getFileMetadata;
    /**
     * Gets the MIME type for a file based on its extension.
     * @param fileName - The name of the file.
     * @returns The MIME type of the file.
     * @throws ValidationError if the file has no extension.
     */
    private getMimeType;
    /**
     * Validates the request object.
     * @param request - The request object to validate.
     * @throws ValidationError if the request is invalid.
     */
    private validateRequest;
    /**
     * Normalizes the MIME type to a standard format.
     * @param mimeType - The MIME type to normalize.
     * @returns The normalized MIME type.
     */
    private normalizeMimeType;
    private validateMimeType;
    private validateFileInput;
    private detectMimeTypeFromBase64;
    /**
     * Starts an inscription and returns the transaction bytes.
     * @param request - The request object containing the file to inscribe and the client configuration
     * @returns The transaction bytes of the started inscription
     * @throws ValidationError if the request is invalid
     * @throws Error if the inscription fails
     */
    startInscription(request: StartInscriptionRequest): Promise<ImageJobResponse>;
    /**
     * Executes a transaction with the provided transaction bytes,
     * typically called after inscribing a file through `startInscription`.
     * @param transactionBytes - The bytes of the transaction to execute.
     * @param clientConfig - The configuration for the Hedera client.
     * @returns The transaction receipt.
     * @throws ValidationError if the transaction bytes are invalid.
     * @throws Error if the execution fails.
     */
    executeTransaction(transactionBytes: string, clientConfig: HederaClientConfig): Promise<string>;
    /**
     * Executes a transaction with the provided transaction bytes using a Signer,
     * typically called after inscribing a file through `startInscription`.
     * @param transactionBytes - The bytes of the transaction to execute.
     * @param clientConfig - The configuration for the Hedera client.
     * @returns The transaction receipt.
     * @throws ValidationError if the transaction bytes are invalid.
     * @throws Error if the execution fails.
     */
    executeTransactionWithSigner(transactionBytes: string, signer: DAppSigner): Promise<string>;
    /**
     * Inscribes a file and executes the transaction. Note that base64 files are limited to 2MB, while URL files are limited to 100MB.
     * @param request - The request object containing the file to inscribe and the client configuration
     * @param clientConfig - The configuration for the Hedera network and account
     * @returns The transaction ID of the executed transaction
     * @throws ValidationError if the request is invalid
     * @throws Error if the transaction execution fails
     */
    inscribeAndExecute(request: StartInscriptionRequest, clientConfig: HederaClientConfig, progressCallback?: RegistrationProgressCallback, options?: {
        waitForCompletion?: boolean;
        maxWaitTime?: number;
        checkInterval?: number;
    }): Promise<InscriptionResult>;
    private fetchWebSocketServers;
    private detectBestConnection;
    private inscribeViaWebSocket;
    private connectWebSocket;
    /**
     * Disconnects the WebSocket connection if active
     */
    disconnect(): void;
    /**
     * Inscribes a file and executes the transaction. Note that base64 files are limited to 2MB, while URL files are limited to 100MB.
     * @param request - The request object containing the file to inscribe and the client configuration
     * @param clientConfig - The configuration for the Hedera network and account
     * @returns The transaction ID of the executed transaction
     * @throws ValidationError if the request is invalid
     * @throws Error if the transaction execution fails
     */
    inscribe(request: StartInscriptionRequest, signer: DAppSigner): Promise<InscriptionResult>;
    private retryWithBackoff;
    /**
     * Retrieves an inscription by its transaction id. Call this function on an interval
     * so you can retrieve the status. Store the transaction id in your database if you
     * need to reference it later on
     * @param txId - The ID of the inscription to retrieve
     * @returns The retrieved inscription
     * @throws ValidationError if the ID is invalid
     * @throws Error if the retrieval fails
     */
    retrieveInscription(txId: string): Promise<RetrievedInscriptionResult>;
    /**
     * Fetch inscription numbers with optional filtering and sorting
     * @param params Query parameters for filtering and sorting inscriptions
     * @returns Array of inscription details
     */
    getInscriptionNumbers(params?: InscriptionNumbersParams): Promise<InscriptionNumberDetails[]>;
    /**
     * Authenticates the SDK with the provided configuration
     * @param config - The configuration for authentication
     * @returns The authentication result
     */
    static authenticate(config: AuthConfig): Promise<AuthResult>;
    /**
     * Creates an instance of the InscriptionSDK with authentication.
     * Useful for cases where you don't have an API key but need to authenticate from server-side
     * with a private key.
     * @param config - The configuration for authentication
     * @returns An instance of the InscriptionSDK
     */
    static createWithAuth(config: {
        type: 'client';
        accountId: string;
        signer: DAppSigner;
        network?: 'mainnet' | 'testnet';
        baseUrl?: string;
        wsBaseUrl?: string;
        connectionMode?: 'http' | 'websocket' | 'auto';
    } | {
        type: 'server';
        accountId: string;
        privateKey: string | PrivateKey;
        network?: 'mainnet' | 'testnet';
        baseUrl?: string;
        wsBaseUrl?: string;
        connectionMode?: 'http' | 'websocket' | 'auto';
    }): Promise<InscriptionSDK>;
    waitForInscription(txId: string, maxAttempts?: number, intervalMs?: number, checkCompletion?: boolean, progressCallback?: RegistrationProgressCallback): Promise<RetrievedInscriptionResult>;
    /**
     * Fetch inscriptions owned by a specific holder
     * @param params Query parameters for retrieving holder's inscriptions
     * @returns Array of inscription details owned by the holder
     */
    getHolderInscriptions(params: HolderInscriptionsParams): Promise<HolderInscriptionsResponse>;
}
