import { PrivateKey } from '@hashgraph/sdk';
export interface AuthConfig {
    accountId: string;
    privateKey: string | PrivateKey;
    network?: 'mainnet' | 'testnet';
    baseUrl?: string;
}
export interface AuthResult {
    apiKey: string;
}
export declare class Auth {
    private readonly accountId;
    private readonly privateKey;
    private readonly baseUrl;
    private readonly network;
    constructor(config: AuthConfig);
    authenticate(): Promise<AuthResult>;
    private signMessage;
}
