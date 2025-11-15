import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import { Logger } from './logger';
export interface AuthConfig {
    accountId: string;
    signer: DAppSigner;
    network?: 'mainnet' | 'testnet';
    baseUrl?: string;
    logger: Logger;
}
export interface AuthResult {
    apiKey: string;
}
export declare class ClientAuth {
    private readonly accountId;
    private readonly signer;
    private readonly baseUrl;
    private readonly network;
    private readonly logger;
    constructor(config: AuthConfig);
    authenticate(): Promise<AuthResult>;
    private signMessage;
}
