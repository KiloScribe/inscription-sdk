import { PrivateKey } from '@hashgraph/sdk';
import axios from 'axios';
import { Buffer } from 'buffer';
import { detectKeyTypeFromString } from '@hashgraphonline/standards-sdk';
import { Logger } from './logger';

export interface AuthConfig {
  accountId: string;
  privateKey: string | PrivateKey;
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
  private readonly logger = Logger.getInstance();

  constructor(config: AuthConfig) {
    this.accountId = config.accountId;

    // Handle both string and PrivateKey object inputs
    if (typeof config.privateKey === 'string') {
      // Use the enhanced key type detector to properly parse the string
      const keyDetection = detectKeyTypeFromString(config.privateKey);
      this.privateKey = keyDetection.privateKey;
      
      // Log warning if detection was uncertain
      if (keyDetection.warning) {
        this.logger.warn(`Key type detection warning: ${keyDetection.warning}`);
      }
    } else {
      // Already a PrivateKey object, use as-is
      this.privateKey = config.privateKey;
    }

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
