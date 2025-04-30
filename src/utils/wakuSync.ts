
import { Dispatcher, KeyType } from "waku-dispatcher";
import { MessageType } from "@/types/note";

export type SyncConfig = {
  password: string;
  enabled: boolean;
};

let dispatcher: Dispatcher | null = null;
let syncEnabled = false;
let encryptionKey: Uint8Array | null = null;

export const initializeWaku = async (password: string): Promise<boolean> => {
  try {
    // Create encryption key from password
    const encoder = new TextEncoder();
    // Use the password to create a 32-byte key (for AES-256)
    const passwordBytes = encoder.encode(password);
    const key = await crypto.subtle.digest('SHA-256', passwordBytes);
    encryptionKey = new Uint8Array(key);
    
    // Initialize the Waku dispatcher
    // Correcting the constructor call to match expected parameters
    dispatcher = new Dispatcher(undefined, "/notes/1/sync/json", "notes", false);
    await dispatcher.start();
    
    if (dispatcher) {
      // Register the encryption key
      dispatcher.registerKey(encryptionKey, KeyType.Symmetric, true);
      syncEnabled = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error initializing Waku:", error);
    return false;
  }
};

export const getSyncConfig = (): SyncConfig => {
  const storedConfig = localStorage.getItem("sync-config");
  if (storedConfig) {
    return JSON.parse(storedConfig);
  }
  return { password: "", enabled: false };
};

export const setSyncConfig = (config: SyncConfig): void => {
  localStorage.setItem("sync-config", JSON.stringify(config));
};

export const emit = async <T>(type: MessageType, payload: T): Promise<boolean> => {
  if (!syncEnabled || !dispatcher || !encryptionKey) {
    return false;
  }
  
  try {
    await dispatcher.emit(type, payload, undefined, encryptionKey, false);
    return true;
  } catch (error) {
    console.error(`Error emitting ${type}:`, error);
    return false;
  }
};

export const subscribe = <T>(
  type: MessageType,
  callback: (payload: T) => void
): void => {
  if (!dispatcher) return;
  
  dispatcher.on(
    type,
    async (message: any) => {
      if (message && message.payload) {
        callback(message.payload);
      }
    },
    true,  // verify sender
    true,  // accept only encrypted
    undefined,
    true   // store locally
  );
};

export const isWakuInitialized = (): boolean => {
  return syncEnabled && dispatcher !== null;
};
