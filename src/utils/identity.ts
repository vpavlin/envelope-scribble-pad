
import { secp256k1 } from '@noble/secp256k1';

export interface Identity {
  privateKey: string;
  publicKey: string;
}

export const generateIdentity = (): Identity => {
  const privateKeyBytes = secp256k1.utils.randomPrivateKey();
  const privateKey = Buffer.from(privateKeyBytes).toString('hex');
  const publicKeyPoint = secp256k1.getPublicKey(privateKeyBytes);
  const publicKey = Buffer.from(publicKeyPoint).toString('hex');

  return {
    privateKey,
    publicKey
  };
};

export const getStoredIdentity = (): Identity | null => {
  const stored = localStorage.getItem('waku-identity');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Failed to parse stored identity:', error);
      return null;
    }
  }
  return null;
};

export const storeIdentity = (identity: Identity): void => {
  localStorage.setItem('waku-identity', JSON.stringify(identity));
};

export const getOrCreateIdentity = (): Identity => {
  let identity = getStoredIdentity();
  if (!identity) {
    identity = generateIdentity();
    storeIdentity(identity);
  }
  return identity;
};

export const signMessage = (message: string, privateKey: string): string => {
  try {
    const messageHash = new TextEncoder().encode(message);
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const signature = secp256k1.sign(messageHash, privateKeyBytes);
    return Buffer.from(signature.toCompactRawBytes()).toString('hex');
  } catch (error) {
    console.error('Failed to sign message:', error);
    throw error;
  }
};
