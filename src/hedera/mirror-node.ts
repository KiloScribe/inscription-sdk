import axios from 'axios';
import type { Network } from '../types';

export interface MirrorNodeAccountKey {
  _type: string;
  key: string;
}

export interface MirrorNodeAccountResponse {
  key?: MirrorNodeAccountKey;
}

export class HederaMirrorNode {
  private readonly baseUrl: string;

  constructor(network: Network, baseUrl?: string) {
    this.baseUrl = baseUrl ?? getDefaultMirrorNodeBaseUrl(network);
  }

  async requestAccount(accountId: string): Promise<MirrorNodeAccountResponse> {
    const response = await axios.get<MirrorNodeAccountResponse>(
      `${this.baseUrl}/api/v1/accounts/${accountId}`
    );
    return response.data;
  }
}

function getDefaultMirrorNodeBaseUrl(network: Network): string {
  return network === 'mainnet'
    ? 'https://mainnet-public.mirrornode.hedera.com'
    : 'https://testnet.mirrornode.hedera.com';
}

