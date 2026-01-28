# GiveBit SDK

> Production-grade TypeScript SDK for non-custodial crypto donations

[![npm version](https://img.shields.io/npm/v/givebit-sdk.svg)](https://www.npmjs.com/package/@givebit/sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen)](https://nodejs.org/)

**GiveBit** is an event-driven SDK for integrating non-custodial crypto donations into any web application. Funds go directly from donors to creators—no intermediary wallet, no custody risk.

## Features

- **Non-Custodial** - Funds transfer directly: Donor → Smart Contract → Creator
- **Real-Time Events** - WebSocket + REST API fallback for instant donation updates
- **Web Embed Ready** - Works in browsers, React apps, Vue, Svelte, and custom frontends
- **Livestream Overlay Support** - OBS-compatible donation display
- **Auto-Reconnect** - Exponential backoff with 5 retry levels
- **Multi-Chain** - Support for Ethereum, Base, Holesky (testnet)
- **Type-Safe** - Full TypeScript support with complete type definitions
- **Framework Agnostic** - Works with any JavaScript framework
- **SDK-First Design** - Backend-only API key management, never exposed to client

## Installation

```bash
npm install givebit-sdk
# or
yarn add givebit-sdk
```

### Requirements

- Node.js 18+ or modern browser
- TypeScript 5.0+ (optional, works with plain JavaScript)

## Quick Start

### 1. Initialize GiveBit

```typescript
import { GiveBit } from 'givebit-sdk';

// Initialize SDK (call once per app)
const givebit = GiveBit.init({
  projectId: 'your-project-id',
  apiKey: 'your-api-key', // Generated on backend, never hardcoded
  mode: 'testnet', // or 'mainnet'
});

// Connect to real-time updates
await givebit.connect();
```

### 2. Listen for Donations

```typescript
// Listen for donation events
givebit.on('donation_pending', (event) => {
  console.log('Pending donation:', event.session);
  // Update UI: show "Payment processing..."
});

givebit.on('donation_confirmed', (event) => {
  console.log('Confirmed:', event.session);
  // Update UI: show transaction hash
});

givebit.on('donation_finalized', (event) => {
  console.log('Donation received!', event.session);
  // Update UI: show received amount, trigger celebration
});

givebit.on('donation_failed', (event) => {
  console.error('Donation failed:', event.error);
  // Update UI: show error message
});
```

### 3. Create a Donation Session

```typescript
const session = await givebit.createDonationSession(
  '0x1234...creator-wallet', // Creator's wallet
  {
    donorWallet: '0x5678...donor-wallet', // Optional
    amount: '0.5', // ETH amount
    memo: 'Great content!', // Optional message
  }
);

console.log('Session ID:', session.id);
console.log('Status:', session.status);
```

### 4. React Example

```typescript
import { useEffect, useState } from 'react';
import { GiveBit } from 'givebit-sdk';

export function DonationWidget() {
  const [donations, setDonations] = useState([]);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    // Initialize
    const givebit = GiveBit.init({
      projectId: process.env.REACT_APP_PROJECT_ID!,
      apiKey: process.env.REACT_APP_API_KEY!,
      mode: 'testnet',
    });

    // Connect
    givebit.connect().then(() => setIsConnecting(false));

    // Listen for donations
    givebit.on('donation_finalized', (event) => {
      setDonations((prev) => [event.session, ...prev]);
    });

    return () => givebit.disconnect();
  }, []);

  return (
    <div className="donation-widget">
      {isConnecting && <p>Connecting...</p>}
      {donations.map((d) => (
        <div key={d.id} className="donation-item">
          <p>{d.amount} ETH from {d.donorWallet?.slice(0, 6)}...</p>
          <p>{d.memo}</p>
        </div>
      ))}
    </div>
  );
}
```

## API Reference

### GiveBit Class

#### Static Methods

##### `GiveBit.init(config: GiveBitConfig): GiveBit`

Initialize the SDK singleton. Call once per application.

```typescript
const givebit = GiveBit.init({
  projectId: 'proj_abc123',
  apiKey: 'gb_test_...', // Get from your backend
  mode: 'testnet', // 'testnet' | 'mainnet'
  wsEndpoint: 'wss://testnet.zidanmutaqin.dev/ws', // Optional
  apiEndpoint: 'https://testnet.zidanmutaqin.dev', // Optional
  reconnectAttempts: 5, // Default
  reconnectDelay: 3000, // ms, Default
});
```

##### `GiveBit.getInstance(): GiveBit`

Get the initialized SDK instance.

```typescript
const givebit = GiveBit.getInstance();
```

#### Instance Methods

##### `connect(): Promise<void>`

Connect to WebSocket. Falls back to REST polling if WebSocket fails.

```typescript
try {
  await givebit.connect();
  console.log('Connected to real-time updates');
} catch (error) {
  console.log('WebSocket failed, using REST polling');
}
```

##### `createDonationSession(creatorWallet, options?): Promise<DonationSession>`

Create a new donation session for fundraising.

```typescript
const session = await givebit.createDonationSession(
  '0x1234...', // Creator wallet (required)
  {
    donorWallet: '0x5678...', // Optional: pre-fill donor address
    amount: '1.0', // Optional: default donation amount in ETH
    memo: 'Thanks for the stream!', // Optional: donation message
  }
);

// Returns: { id, projectId, creatorWallet, status, amount, ... }
```

##### `getDonationSession(sessionId): Promise<DonationSession>`

Fetch status of a specific donation.

```typescript
const session = await givebit.getDonationSession('sess_xyz789');
console.log(session.status); // 'pending' | 'confirmed' | 'finalized' | 'failed'
```

##### `getDonationHistory(limit?): Promise<DonationSession[]>`

Get recent donations (default: last 50).

```typescript
const recent = await givebit.getDonationHistory(100);
recent.forEach((d) => {
  console.log(`${d.amount} ETH from ${d.donorWallet} at ${d.createdAt}`);
});
```

##### `on(event, callback): void`

Subscribe to donation events.

```typescript
givebit.on('connection_open', (event) => {
  console.log('Connected at', new Date(event.timestamp));
});

givebit.on('donation_pending', (event) => {
  // Donation initiated, awaiting confirmation
});

givebit.on('donation_confirmed', (event) => {
  // Blockchain confirmation received
});

givebit.on('donation_finalized', (event) => {
  // Funds transferred to creator
});

givebit.on('donation_failed', (event) => {
  console.error(event.error);
});
```

##### `off(event, callback): void`

Unsubscribe from events.

```typescript
const handler = (event) => console.log(event);
givebit.on('donation_finalized', handler);
// ... later
givebit.off('donation_finalized', handler);
```

##### `isConnected(): boolean`

Check if WebSocket is currently connected.

```typescript
if (givebit.isConnected()) {
  console.log('Using real-time updates');
} else {
  console.log('Using REST polling fallback');
}
```

##### `disconnect(): void`

Close connection and clean up resources.

```typescript
givebit.disconnect();
```

### Types

```typescript
interface GiveBitConfig {
  projectId: string;
  apiKey: string;
  mode: 'testnet' | 'mainnet';
  wsEndpoint?: string; // Custom WebSocket URL
  apiEndpoint?: string; // Custom API URL
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

interface DonationSession {
  id: string;
  projectId: string;
  creatorWallet: string;
  donorWallet?: string;
  amount: string; // Wei or ETH depending on context
  memo?: string;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed' | 'expired';
  transactionHash?: string;
  blockNumber?: number;
  expiresAt: number; // Unix timestamp
  createdAt: number; // Unix timestamp
}

type EventType = 
  | 'connection_open' 
  | 'connection_lost' 
  | 'donation_pending' 
  | 'donation_confirmed' 
  | 'donation_finalized' 
  | 'donation_failed';

interface DonationEvent {
  type: EventType;
  session: DonationSession;
  timestamp: number;
  error?: string;
}

type EventCallback = (event: DonationEvent) => void;
```

## Configuration

### Environment Variables

Set these in your `.env` file:

```bash
# Testnet
VITE_GIVEBIT_PROJECT_ID=your_project_id_testnet
VITE_GIVEBIT_API_KEY=gb_test_xxxxx
VITE_GIVEBIT_MODE=testnet

# Mainnet (when ready)
VITE_GIVEBIT_PROJECT_ID=your_project_id_mainnet
VITE_GIVEBIT_API_KEY=gb_live_xxxxx
VITE_GIVEBIT_MODE=mainnet
```

### Custom Endpoints

If hosting GiveBit backend yourself:

```typescript
GiveBit.init({
  projectId: 'proj_abc',
  apiKey: 'gb_test_...',
  mode: 'testnet',
  wsEndpoint: 'wss://your-domain.com/ws',
  apiEndpoint: 'https://your-domain.com',
});
```

## OBS Livestream Overlay

GiveBit includes a standalone HTML overlay for live streaming:

1. Save the overlay HTML from `/demo/overlay.html`
2. In OBS, add **Browser Source** → point to the HTML file
3. Set dimensions: **1920x1080** (or your stream resolution)
4. Open the overlay source settings and add query parameters:

```
file:///path/to/overlay.html?projectId=proj_abc&apiKey=gb_test_xyz
```

The overlay will:
- Display incoming donations in real-time
- Show donor name, amount, and message
- Auto-hide after 5 seconds
- Reconnect automatically if connection drops

## Multi-Chain Support

GiveBit works across multiple blockchains:

| Network | testnet | mainnet |
|---------|---------|---------|
| Holesky (testnet) | ✅ | - |
| Ethereum | ✅ | ✅ |
| Base | ✅ | ✅ |

Set mode in init:

```typescript
// Testnet: Uses Holesky
GiveBit.init({ mode: 'testnet' });

// Mainnet: Uses Ethereum + Base
GiveBit.init({ mode: 'mainnet' });
```

## Security

### API Key Management

IMPORTANT: Never expose API keys in client-side code!

**Correct approach:**
1. Generate API key on your backend
2. Wrap it with your own authentication
3. Send to client via secure channel
4. Client passes it to SDK

**Incorrect:**
```typescript
// DO NOT DO THIS
const apiKey = 'gb_test_...'; // Hardcoded in JS
```

**Correct:**
```typescript
// Backend generates and returns API key
app.post('/api/get-donation-token', (req, res) => {
  const apiKey = generateOrFetchAPIKey(req.user.id);
  res.json({ apiKey, projectId: 'proj_...' });
});

// Frontend fetches it
const { apiKey, projectId } = await fetch('/api/get-donation-token').then(r => r.json());
GiveBit.init({ apiKey, projectId, mode: 'testnet' });
```

### Non-Custodial Funds

GiveBit uses smart contracts that **never hold funds**. Donations flow:

```
Donor Wallet → Smart Contract (instant transfer) → Creator Wallet
```

No intermediary storage, no withdrawal delays, no bridge risk.

## Connection Strategy

GiveBit uses a hybrid approach for reliability:

1. **WebSocket (Primary)** - Real-time updates
2. **REST Polling (Fallback)** - 5-second intervals if WebSocket fails
3. **Auto-Reconnect** - Exponential backoff up to 5 attempts

```typescript
// WebSocket: <100ms latency
givebit.on('donation_finalized', handler); // Instant

// REST Polling: 5-second delay
// Automatically used if WebSocket unavailable
```

## Testing

### Local Testing

1. Start the backend:
```bash
cd backend
go run cmd/main.go
```

2. Start the indexer:
```bash
cd indexer
cargo run --release
```

3. Test in your app:
```typescript
const givebit = GiveBit.init({
  projectId: 'test-project',
  apiKey: 'gb_test_...',
  mode: 'testnet',
  apiEndpoint: 'http://localhost:8080',
  wsEndpoint: 'ws://localhost:8080/ws',
});

await givebit.connect();
```

### Testnet (Holesky)

Free testnet tokens:
- [Holesky Faucet](https://www.alchemy.com/faucets/ethereum-sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

## Examples

### Leaderboard

```typescript
async function updateLeaderboard() {
  const donations = await givebit.getDonationHistory(1000);
  
  const byDonor = {};
  donations.forEach((d) => {
    if (!byDonor[d.donorWallet]) byDonor[d.donorWallet] = 0;
    byDonor[d.donorWallet] += parseFloat(d.amount);
  });
  
  const leaderboard = Object.entries(byDonor)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);
  
  console.table(leaderboard);
}
```

### Donation Goal

```typescript
async function checkDonationGoal(targetAmount) {
  const donations = await givebit.getDonationHistory();
  const total = donations
    .filter((d) => d.status === 'finalized')
    .reduce((sum, d) => sum + parseFloat(d.amount), 0);
  
  return {
    total,
    target: targetAmount,
    reached: total >= targetAmount,
    percentage: (total / targetAmount) * 100,
  };
}
```

### Real-Time Counter

```typescript
let totalDonations = 0;

givebit.on('donation_finalized', (event) => {
  totalDonations += parseFloat(event.session.amount);
  console.log(`Total: ${totalDonations} ETH`);
  document.getElementById('total').innerText = totalDonations;
});
```

## Troubleshooting

### WebSocket Connection Fails

```typescript
givebit.on('connection_lost', () => {
  console.log('WebSocket failed, using REST polling');
  // SDK automatically falls back to REST
});
```

### Donation Not Appearing

1. Check transaction on Etherscan:
   - Testnet: https://holesky.etherscan.io/
   - Mainnet: https://etherscan.io/

2. Verify creator wallet is correct:
   ```typescript
   console.log(session.creatorWallet);
   ```

3. Check session status:
   ```typescript
   const status = await givebit.getDonationSession(sessionId);
   console.log(status.status);
   ```

### API Key Issues

- **`401 Unauthorized`** - API key invalid or expired
- **`403 Forbidden`** - Project mismatch or rate limited
- **`429 Too Many Requests`** - Rate limit exceeded

Rate limits per API key:
- REST API: 100 req/min
- WebSocket: 10 req/sec
- Webhooks: 50 req/min

## Documentation

- [Main Documentation](../README.md)
- [Backend API](../backend/README.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Smart Contract](../contracts/)

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

## License

Apache License 2.0 - see [LICENSE](../LICENSE) file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/zidanaetrna/givebit-sdk/issues)
- **Discussions**: [GitHub Discussions](https://github.com/zidanaetrna/givebit-sdk/discussions)
- **Email**: tumbaldiscord292@gmail.com

## Roadmap

- [ ] Native mobile SDKs (React Native, Flutter)
- [ ] Payment page hosting
- [ ] Advanced analytics dashboard
- [ ] Multi-token support (USDC, USDT, etc.)
- [ ] Subscription donations
- [ ] Custom UI components
- [ ] Webhook delivery guarantees

## Acknowledgments

Built with:
- [WebSocket.js](https://github.com/theturtle32/WebSocket-Node)
- [TypeScript](https://www.typescriptlang.org/)
- [ethers.js](https://docs.ethers.org/)

## Related Projects

- [GiveBit Backend](../backend/) - REST API & WebSocket server
- [GiveBit Indexer](../indexer/) - Blockchain event listener
- [GiveBit Contracts](../contracts/) - Smart contracts

---

**Made by the GiveBit team**

Non-custodial. Event-driven. Production-ready.
