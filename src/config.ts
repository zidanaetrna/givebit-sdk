/**
 * GiveBit SDK Configuration
 */

import { GiveBitMode } from "./types";

export const CONFIG = {
  testnet: {
    apiEndpoint: "https://testnet.zidanmutaqin.dev/api",
    wsEndpoint: "wss://testnet.zidanmutaqin.dev/api/ws",
    chainId: 17000, // Ethereum Holesky
    contractAddress: "0x5081968D6D4a1124D0B61C5E01F60dF928110ECE", // Proxy contract
  },
  mainnet: {
    apiEndpoint: "https://mainnet.zidanmutaqin.dev/api",
    wsEndpoint: "wss://mainnet.zidanmutaqin.dev/api/ws",
    chainId: 1, // Ethereum Mainnet
    contractAddress: "0x", // Will be populated at runtime
  },
};

export function getConfig(mode: GiveBitMode) {
  return CONFIG[mode];
}

export const SDK_VERSION = "1.0.3";
export const RECONNECT_ATTEMPTS = 5;
export const RECONNECT_DELAY = 3000; // 3 seconds
export const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds
export const REST_FALLBACK_INTERVAL = 5000; // 5 seconds
export const REQUEST_TIMEOUT = 15000; // 15 seconds