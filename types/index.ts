// Portfolio Types
export interface TokenHolding {
  token: string;
  contract: string;
  balance: string;
  decimals: number;
  valueUSD?: number;
}

export interface PortfolioSnapshot {
  date: string;
  totalValueUSD: number;
  holdings: TokenHolding[];
}

export interface Portfolio {
  version: number;
  accountId: string;
  lastUpdated: string;
  holdings: TokenHolding[];
  snapshots?: PortfolioSnapshot[];
}

// Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  verification?: MessageVerification;
}

export interface MessageVerification {
  chat_id: string;
  request_hash: string;
  response_hash: string;
  signature: string;
  signing_address: string;
  signing_algo: string;
  nova_cid?: string;
}

export interface Conversation {
  id: string;
  date: string;
  messages: ChatMessage[];
}

export interface ChatHistory {
  version: number;
  conversations: Conversation[];
}

// NEAR AI Cloud Types
export interface ChatCompletionRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  stream: boolean;
  temperature?: number;
  chat_template_kwargs?: {
    thinking?: boolean;
  };
}

export interface SignatureData {
  text: string;
  signature: string;
  signing_address: string;
  signing_algo: string;
}

export interface AttestationReport {
  model_attestations: Array<{
    signing_public_key: string;
  }>;
  nvidia_payload: {
    nonce: string;
    arch: string;
    evidence_list: Array<{
      evidence: string;
      certificate: string;
    }>;
  };
  intel_quote: string;
  info: {
    compose_manifest: string;
  };
}

// NOVA Types
export interface NovaUploadResult {
  cid: string;
  size: number;
  groupId: string;
}

export interface NovaRetrieveResult {
  data: Buffer;
  metadata: {
    filename: string;
    uploadedAt: string;
  };
}

// Wallet Context Types
export interface WalletState {
  accountId: string | null;
  isConnected: boolean;
  portfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
}

// Vault Context Types
export interface VaultState {
  vaultId: string | null;
  isInitialized: boolean;
  loading: boolean;
  error: string | null;
}

// UI Types
export interface VerificationBadgeProps {
  verification?: MessageVerification;
  onExpand?: () => void;
}

export interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
}

export interface ChatInterfaceProps {
  portfolio: Portfolio;
  vaultId: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Constants
export const KNOWN_TOKENS = {
  'NEAR': 'native',
  'USDC': 'a0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.factory.bridge.near',
  'USDT': 'dac17f958d2ee523a2206206994597c13d831ec7.factory.bridge.near',
  'wBTC': '2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near',
} as const;

export const MODELS = {
  DEEPSEEK_V3: 'deepseek-ai/DeepSeek-V3.1',
  GPT_OSS: 'openai/gpt-oss-120b',
  QWEN3: 'Qwen/Qwen3-30B-A3B-Instruct-2507',
} as const;
