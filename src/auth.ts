import { PrivateKey } from '@hashgraph/sdk';
import axios from 'axios';

export interface AuthConfig {
  accountId: string;
  privateKey: string;
  network?: 'mainnet' | 'testnet';
  baseUrl?: string;
}

export interface AuthResult {
  apiKey: string;
}

export class Auth {
  private readonly accountId: string;
  private readonly privateKey: PrivateKey;
  private readonly baseUrl: string;
  private readonly network: string;

  constructor(config: AuthConfig) {
    this.accountId = config.accountId;
    this.privateKey = PrivateKey.fromStringED25519(config.privateKey);
    this.network = config.network || 'mainnet';
    this.baseUrl = config.baseUrl || 'https://kiloscribe.com';
  }

  async authenticate(): Promise<AuthResult> {
    const requestSignatureResponse = await axios.get(
      `${this.baseUrl}/api/auth/request-signature`,
      {
        headers: {
          'x-session': this.accountId,
        },
      }
    );

    if (!requestSignatureResponse.data?.message) {
      throw new Error('Failed to get signature message');
    }

    const message = requestSignatureResponse.data.message;
    const signature = await this.signMessage(message);

    const authResponse = await axios.post(
      `${this.baseUrl}/api/auth/authenticate`,
      {
        authData: {
          id: this.accountId,
          signature,
          data: message,
          network: this.network,
        },
        include: 'apiKey',
      }
    );

    if (!authResponse.data?.user?.sessionToken) {
      throw new Error('Authentication failed');
    }

    return {
      apiKey: authResponse.data.apiKey,
    };
  }

  private async signMessage(message: string): Promise<string> {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = await this.privateKey.sign(messageBytes);
    return Buffer.from(signatureBytes).toString('hex');
  }
}
