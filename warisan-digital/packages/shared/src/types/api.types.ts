/**
 * API request/response types
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface JwtPayload {
  sub: string;          // User ID
  smartAccountAddr: string;
  nikHash: string;
  iat: number;
  exp: number;
}

export interface AuthRequest {
  smartAccountAddr: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  token: string;
  expiresIn: number;
  user: {
    id: string;
    smartAccountAddr: string;
    nikHash: string;
  };
}

export interface BuatWasiatRequest {
  jumlahAnakSah: number;
  ahliWarisList: Array<{
    dompetAddr: string;
    nikEncrypted: string;
    namaEncrypted: string;
    hubunganKeluarga: string;
    persentaseBps: number;
    isLegitimePortie: boolean;
  }>;
  asetList?: Array<{
    tokenAddr: string;
    tokenSymbol: string;
    tokenDecimals: number;
  }>;
  catatanEncrypted?: string;
}

export interface WasiatResponse {
  id: string;
  status: string;
  tteStatus: string;
  wasiatHash: string;
  ipfsCid?: string;
  jumlahAnakSah: number;
  lpBps?: number;
  totalAhliWaris: number;
  createdAt: string;
  updatedAt: string;
  executedAt?: string;
  ahliWarisList: Array<{
    id: string;
    persentaseBps: number;
    isLegitimePortie: boolean;
    hubunganKeluarga: string;
  }>;
}

export interface RequestTTERequest {
  wasiatId: string;
  signerEmail: string;
}

export interface TTEResponse {
  documentId: string;
  signingUrl: string;
  expiresAt: string;
  status: string;
}

export interface WebhookPayload {
  type: string;
  data: Record<string, unknown>;
  signature: string;
  timestamp: number;
}
