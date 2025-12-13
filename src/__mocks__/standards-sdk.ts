import { PrivateKey } from '@hashgraph/sdk';

export function detectKeyTypeFromString(value: string): {
  privateKey: PrivateKey;
} {
  return { privateKey: PrivateKey.fromString(value) };
}

export class HederaMirrorNode {}

