// @peculiar/x509 v2 uses tsyringe, which requires the reflect-metadata polyfill
// loaded before any of its code runs. It must be imported first at the entry
// point. We also pin the crypto provider to the browser's Web Crypto.
import 'reflect-metadata';
import { cryptoProvider } from '@peculiar/x509';

if (typeof globalThis.crypto !== 'undefined') {
  cryptoProvider.set(globalThis.crypto);
}
