import { PrivateKey } from '@hashgraph/sdk';

export type DetectedKeyType = 'ed25519' | 'ecdsa';

export interface KeyDetectionResult {
  detectedType: DetectedKeyType;
  privateKey: PrivateKey;
}

export function detectKeyTypeFromString(
  privateKeyString: string
): KeyDetectionResult {
  try {
    const privateKey = PrivateKey.fromStringECDSA(privateKeyString);
    return { detectedType: 'ecdsa', privateKey };
  } catch (ecdsaError) {
    try {
      const privateKey = PrivateKey.fromStringED25519(privateKeyString);
      return { detectedType: 'ed25519', privateKey };
    } catch {
      throw new Error(
        `Failed to parse private key as either ECDSA or ED25519: ${String(
          ecdsaError
        )}`
      );
    }
  }
}

