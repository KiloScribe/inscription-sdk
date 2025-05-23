import { DAppSigner } from '@hashgraph/hedera-wallet-connect';
import axios from 'axios';
import { Logger } from './logger';
import { Buffer } from 'buffer';

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

export class ClientAuth {
  private readonly accountId: string;
  private readonly signer: DAppSigner;
  private readonly baseUrl: string;
  private readonly network: string;
  private readonly logger: Logger;

  constructor(config: AuthConfig) {
    this.accountId = config.accountId;
    this.signer = config.signer;
    this.network = config.network || 'mainnet';
    this.baseUrl = config.baseUrl || 'https://kiloscribe.com';
    this.logger = config.logger;
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

    const signature = await this.signMessage(JSON.stringify(message));

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
    try {
      const messageBytes = new TextEncoder().encode(message);
      this.logger.debug(`signing message`);
      const signatureBytes = await this.signer.sign([messageBytes], {
        encoding: 'utf-8',
      });
      return Buffer.from(signatureBytes?.[0].signature).toString('hex');
    } catch (e) {
      this.logger.error(`Failed to sign message`, e);
      throw new Error('Failed to sign message');
    }
  }
}
