# Warisan Digital - Sistem Warisan Digital Terdesentralisasi

## 🌟 Deskripsi Proyek

**Warisan Digital** adalah platform blockchain **pertama di Indonesia** yang memungkinkan seseorang melakukan registrasi wasiat digital dengan standar hukum KUHPerdata, regulasi elektronik (UU ITE), dan teknologi Web3 global (ERC-4337, ERC-7579, Chainlink, zk-SNARKs).

Platform ini memastikan:
- ✅ **Legitimate Portie Compliance**: Mematuhi Pasal 913-915 KUHPerdata (bagian mutlak ahli waris)
- 🔐 **Zero-Knowledge Proofs**: Data wasiat privat namun terverifikasi
- ⚖️ **Tanda Tangan Elektronik Tersertifikasi**: Sesuai UU ITE Pasal 11 dari PSrE
- 🤖 **Eksekusi Otomatis**: Death Verification Oracle via Chainlink + SATUSEHAT + Dukcapil
- 🔗 **Smart Account (ERC-4337)**: Account abstraction untuk user experience lebih baik
- 🛡️ **Teknologi Blockchain**: Polygon untuk skalabilitas dan cost efficiency

## 📋 Struktur Monorepo

```
warisan-digital/
├── packages/
│   ├── shared/          # Shared types, constants, utilities
│   ├── contracts/       # Solidity smart contracts (ERC-7579 modules)
│   └── circuits/        # Circom ZK circuits
├── apps/
│   ├── api/             # Fastify backend API
│   └── web/             # Next.js 14 frontend
├── turbo.json           # Turborepo build pipeline
└── .env.example         # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (includes npm)
- PostgreSQL 14+
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd warisan-digital

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local

# Update .env.local dengan config Anda
nano .env.local
```

### Development

```bash
# Start all services (API + Web)
npm run dev

# Or start individual services
npm --workspace=@warisan-digital/api run dev
npm --workspace=@warisan-digital/web run dev
```

### Build & Deploy

```bash
# Build seluruh monorepo
npm run build

# Deploy smart contracts ke Polygon Amoy (testnet)
npm run contracts:deploy

# Generate Prisma client
npm run db:generate
npm run db:push
```

## 🏗️ Komponen Utama

### 1. Smart Contracts (Solidity)

**Location:** `packages/contracts/`

#### Core Contracts:

- **WasiatExecutorModule** (ERC-7579)
  - Executor module untuk eksekusi wasiat otonom
  - Validasi Legitieme Portie per KUHPerdata
  - Non-reentrancy safe transfers

- **DeathVerificationOracle** (Chainlink Functions)
  - Query SATUSEHAT (SMPK - Sertifikat Medis Penyebab Kematian)
  - Query Dukcapil (Status Kependudukan)
  - Cross-validation untuk akurasi tinggi

- **PasskeyValidatorModule** (ERC-7579)
  - WebAuthn/Passkey authentication
  - Secp256r1 signature verification
  - Account abstraction validator

#### Libraries:

- **LegitimePortieLib**
  - Perhitungan LP minimum per jumlah anak sah
  - Validasi compliance KUHPerdata Pasal 914

### 2. Zero-Knowledge Circuits (Circom)

**Location:** `packages/circuits/`

- **wasiat_verifier.circom**
  - Prove wasiat data validity tanpa reveal sensitive info
  - Validate LP compliance
  - Generate Groth16 SNARKs

### 3. Backend API (Fastify)

**Location:** `apps/api/`

#### Core Services:

- **EncryptionService**: AES-256-GCM untuk PII storage
- **BlockchainService**: Web3 interactions via ethers.js
- **SatusehatService/DukcapilService**: Government API integrations
- **PsreService**: TTE Tersertifikasi integration
- **PinataService**: IPFS storage

#### Database:

- **Prisma ORM** dengan PostgreSQL
- Encrypted fields untuk NIK, nama, wasiat data
- Audit logs untuk semua operasi

### 4. Frontend (Next.js 14)

**Location:** `apps/web/`

#### Key Components:

- **LPCalculator**: Real-time Legitieme Portie validation
- **WasiatForm**: Step-by-step wasiat creation
- **AhliWarisCard**: Display & manage ahli waris
- **Dashboard**: Overview wasiat status & executions

#### Hooks:

- `useLegitimePortie()` - Real-time LP validation
- `useWasiat()` - Fetch & manage wasiat data
- `useSmartAccount()` - ERC-4337 smart account interactions
- `usePasskey()` - WebAuthn credential management

## 🔐 Secutiry & Privacy

### Data Protection

- ✅ NIK: Hashed dengan SHA-256 untuk lookups, encrypted untuk storage
- ✅ Nama & Data PII: AES-256-GCM encrypted
- ✅ Wasiat Content: Encrypted + stored on IPFS
- ✅ Signed dengan TTE Tersertifikasi per UU ITE Pasal 11

### Smart Contract Security

- ✅ Checks-Effects-Interactions pattern
- ✅ ReentrancyGuard di functions yang melakukan transfer
- ✅ SafeERC20 untuk token transfers
- ✅ Pausable untuk emergency situations
- ✅ Custom errors untuk gas efficiency

### Compliance

- ✅ KUHPerdata Pasal 913-915 (Legitieme Portie)
- ✅ UU ITE Pasal 11 (Tanda Tangan Elektronik)
- ✅ GDPR-compliant encryption & data handling
- ✅ Audit logging untuk regulasi

## 📊 Legitieme Portie (LP) Reference

Sesuai KUHPerdata Pasal 914:

| Jumlah Anak Sah | LP Minimum | Pasal     |
| --------------- | ---------- | --------- |
| 0               | 0%         | Pasal 914 |
| 1               | 50%        | Pasal 914 |
| 2               | 66.67%     | Pasal 914 |
| 3+              | 75%        | Pasal 914 |

**LP tidak bisa dikurangi** (Pasal 915 KUHPerdata)

## 🌐 Network Configuration

### Polygon Mainnet

```
Chain ID: 137
RPC: https://polygon-rpc.com
Block Explorer: https://polygonscan.com
```

### Polygon Amoy (Testnet)

```
Chain ID: 80002
RPC: https://rpc-amoy.polygon.technology
Block Explorer: https://amoy.polygonscan.com
```

## 📚 API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login dengan signature
- `POST /api/v1/auth/register` - Register smart account
- `GET /api/v1/auth/me` - Get current user

### Wasiat Management

- `POST /api/v1/wasiat` - Create new wasiat
- `GET /api/v1/wasiat/:id` - Get wasiat details
- `PUT /api/v1/wasiat/:id` - Update wasiat
- `DELETE /api/v1/wasiat/:id` - Revoke wasiat
- `POST /api/v1/wasiat/:id/deploy` - Deploy ke blockchain

### Death Verification

- `POST /api/v1/dvo/request` - Request kematian verification
- `GET /api/v1/dvo/status/:pewaris` - Get DVO status

### Execution

- `POST /api/v1/eksekusi` - Execute wasiat transfers
- `GET /api/v1/eksekusi/logs` - Get execution logs

## 🧪 Testing

```bash
# Run Solidity tests
npm run contracts:test

# Run API tests
npm --workspace=@warisan-digital/api run test

# Run frontend tests
npm --workspace=@warisan-digital/web run test

# View coverage
npm run test:coverage
```

## 📝 Environment Variables

Lihat `.env.example` untuk semua required variables:

```env
# Server
NODE_ENV=development
PORT=3001
API_BASE_URL=http://localhost:3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/warisan_digital

# JWT
JWT_SECRET=<min-32-chars>
JWT_EXPIRES_IN=7d

# Blockchain
POLYGON_RPC_URL=https://...
CHAIN_ID=137
WASIAT_MODULE_ADDRESS=0x...
DVO_ORACLE_ADDRESS=0x...
RELAYER_PRIVATE_KEY=...

# Government APIs
SATUSEHAT_CLIENT_ID=...
DUKCAPIL_API_KEY=...

# PSrE (TTE)
PSRE_PROVIDER=PRIVY_ID
PSRE_API_KEY=...

# IPFS
PINATA_API_KEY=...
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

GPL-3.0-or-later - Lihat LICENSE file untuk details

## 📞 Support & Documentation

- 📖 [Full Documentation](./docs/README.md)
- 🐛 [Report Issues](./issues)
- 💬 [Discussions](./discussions)

## ⚠️ Disclaimer

Sistem ini adalah **prototype production-grade** untuk educational & proof-of-concept purposes. Sebelum deployment ke mainnet:

- ✅ Conduct full security audit
- ✅ Legal review sesuai jurisdiksi
- ✅ Test extensive dengan real scenario
- ✅ Set up proper DevOps & monitoring

---

**Build with ❤️ untuk Indonesia Digital**

Sesuai dengan visi Indonesia sebagai ekonomi digital terdepan di Asia Tenggara.
