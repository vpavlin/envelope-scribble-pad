
import { Dispatcher, KeyType } from "waku-dispatcher";
import { MessageType } from "@/types/note";
import {
  createLightNode,
} from "@waku/sdk";
import { wakuPeerExchangeDiscovery } from "@waku/discovery";
import { derivePubsubTopicsFromNetworkConfig } from "@waku/utils"
import { Identity } from "./identity";

export type SyncConfig = {
  password: string;
  enabled: boolean;
};

let dispatcher: Dispatcher | null = null;
let identity: Identity = new Identity("test", "notes-identity")
let syncEnabled = false;
let encryptionKey: Uint8Array | null = null;
let initializing = false
let initializedPromise: Promise<Dispatcher>

const bootstrapNodes: string[] = [
  "/dns4/waku-test.bloxy.one/tcp/8095/wss/p2p/16Uiu2HAmSZbDB7CusdRhgkD81VssRjQV5ZH13FbzCGcdnbbh6VwZ",
  "/dns4/node-01.do-ams3.waku.sandbox.status.im/tcp/8000/wss/p2p/16Uiu2HAmNaeL4p3WEYzC9mgXBmBWSgWjPHRvatZTXnp8Jgv3iKsb",
]

export const DEFAULT_WAKU_CLUSTER_ID = "42"
export const DEFAULT_WAKU_SHARD_ID = "0"
export const WAKU_CLUSTER_ID_STORAGE_KEY = "waku-cluster-id"
export const WAKU_SHARD_ID = "waku-shard-id"

// Function to derive content topic from password
const deriveContentTopic = (password: string): string => {
  // Create a simple hash of the password to derive a unique content topic
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Use the hash to create a unique content topic
  return `/notes/${Math.abs(hash).toString(16).substring(0, 8)}/sync/json`;
};

export const generateSecurePassword = (): string => {
  // Characters to use in the password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  // Length of the password
  const length = 24;
  
  let password = '';
  
  // Generate a random password
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < length; i++) {
    password += chars[randomValues[i] % chars.length];
  }
  
  return password;
};

export const initializeWaku = async (password: string): Promise<Dispatcher> => {
  if (initializing) return initializedPromise
  console.log("initializing")
  if (!initializing && !dispatcher) {
    initializing = true
    initializedPromise = new Promise(async (resolve) => {
      try {
        await identity.init()
        // Create encryption key from password
        const encoder = new TextEncoder();
        // Use the password to create a 32-byte key (for AES-256)
        const passwordBytes = encoder.encode(password);
        const key = await crypto.subtle.digest('SHA-256', passwordBytes);
        encryptionKey = new Uint8Array(key);
        
        // Derive content topic from password
        const contentTopic = deriveContentTopic(password);
        
        // Initialize the Waku dispatcher
        const wakuClusterId = localStorage.getItem(WAKU_CLUSTER_ID_STORAGE_KEY) || DEFAULT_WAKU_CLUSTER_ID
        const wakuShardId = localStorage.getItem(WAKU_SHARD_ID) || DEFAULT_WAKU_SHARD_ID
        let libp2p = undefined
        const networkConfig =  {clusterId: parseInt(wakuClusterId), shards: [parseInt(wakuShardId)]}
        
        if (wakuClusterId != "1") {
            libp2p = {
                peerDiscovery: [
                  wakuPeerExchangeDiscovery(derivePubsubTopicsFromNetworkConfig(networkConfig))
                ]
              }
        }
        const node = await createLightNode({
            networkConfig: networkConfig,
            defaultBootstrap: false,
            bootstrapPeers: bootstrapNodes,
            numPeersToUse: 3,
            libp2p: libp2p,
        });
    
        dispatcher = new Dispatcher(node, contentTopic, "notes", false);
        
        if (dispatcher) {
          // Register the encryption key
          dispatcher.registerKey(encryptionKey, KeyType.Symmetric, true);
          syncEnabled = true;
          resolve(dispatcher);
        }
      } catch (error) {
        console.error("Error initializing Waku:", error);
      }
    });
  }
  return initializedPromise;
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
    await dispatcher.emit(type, payload, identity.getWallet(), encryptionKey, false);
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
    async (message: T) => {
      if (message) {
        callback(message)
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
