import { InscriptionSDK } from './inscription-sdk';

export * from './inscription-sdk';
export * from './types';
export { ClientAuth } from './client-auth';
export { Auth } from './auth';

// This variable is replaced at build time.
// @ts-ignore
if ('VITE_BUILD_FORMAT' === 'umd') {
  // @ts-ignore
  window.InscriptionSDK = InscriptionSDK;
}
