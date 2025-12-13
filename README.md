# Stacks Token Streaming Protocol

A comprehensive token streaming protocol built on Stacks blockchain with full Clarity 4 support.

## Project Overview

This project implements a decentralized token streaming protocol that allows users to stream tokens over time with advanced features including:

- 🎯 **STX & SIP-010 Token Support** - Stream any fungible token
- ⏸️ **Pause/Resume Functionality** - Flexible stream control
- 📊 **Event Logging** - Complete operation tracking
- 🔐 **Clarity 4 Features** - Block time, restrict-assets, contract verification

## Tech Stack

- **Smart Contracts**: Clarity (Version 4)
- **Development Tool**: Clarinet 3.11.0
- **Blockchain Interaction**: Stacks.js (@stacks/connect, @stacks/transactions)
- **Testing**: Vitest
- **Runtime**: Node.js v24.11.0

## Setup & Installation

```bash
# Install dependencies
npm install

# Check contract syntax
clarinet check

# Run tests
npm test

# Start local devnet
clarinet devnet start
```

## Project Structure

```
stacks-token-streaming/
├── contracts/          # Clarity smart contracts
│   └── stream-manager.clar
├── tests/             # Contract tests
│   └── stream-manager.test.ts
|
├── settings/          # Network configurations
│   ├── Devnet.toml
│   ├── Testnet.toml
│   └── Mainnet.toml
└── Clarinet.toml     # Project configuration
```

## Features

### Core Functionality

- ✅ **Create STX Streams** - Stream STX tokens over customizable durations
- ✅ **Create SIP-010 Streams** - Stream any fungible token implementing SIP-010
- ✅ **Withdraw Tokens** - Recipients withdraw vested tokens at any time
- ✅ **Cancel Streams** - Senders can cancel with automatic refunds
- ✅ **Pause/Resume** - Temporarily suspend streams with accurate accounting

### Clarity 4 Features

- 🕐 **stacks-block-time** - Precise timestamp-based vesting
- 📦 **stacks-block-height** - Block-level stream tracking
- 🔍 **contract-hash?** - On-chain contract template verification
- 🔐 **Asset Escrow** - Secure token custody pattern

### Events & Monitoring

- 📢 **stream-created** - Emitted on new stream creation
- 💰 **withdrawal** - Logged on every token withdrawal
- ⛔ **stream-cancelled** - Tracked when streams end early
- ⏸️ **stream-paused** - Recorded when streams pause
- ▶️ **stream-resumed** - Logged when streams resume


## Quick Start

### Create a Stream

```clarity
;; Stream 1 STX over 24 hours
(contract-call? .stream-manager create-stream
    'SP2...RECIPIENT
    u1000000  ;; 1 STX in microSTX
    u86400)   ;; 24 hours in seconds

;; Stream custom token
(contract-call? .stream-manager create-sip010-stream
    'SP2...RECIPIENT
    u1000000
    u86400
    .my-token)
```

### Withdraw from Stream

```clarity
;; Recipient withdraws available tokens
(contract-call? .stream-manager withdraw-from-stream u1)
```

### Pause/Resume Stream

```clarity
;; Sender pauses the stream
(contract-call? .stream-manager pause-stream u1)

;; Sender resumes the stream
(contract-call? .stream-manager resume-stream u1)
```

## API Overview

### Public Functions

| Function                      | Description         | Access    |
| ----------------------------- | ------------------- | --------- |
| `create-stream`               | Create STX stream   | Anyone    |
| `create-sip010-stream`        | Create token stream | Anyone    |
| `withdraw-from-stream`        | Withdraw STX        | Recipient |
| `withdraw-from-sip010-stream` | Withdraw tokens     | Recipient |
| `cancel-stream`               | Cancel STX stream   | Sender    |
| `cancel-sip010-stream`        | Cancel token stream | Sender    |
| `pause-stream`                | Pause stream        | Sender    |
| `resume-stream`               | Resume stream       | Sender    |

### Read-Only Functions

- `get-stream(stream-id)` - Get full stream details
- `get-available-balance(stream-id)` - Get withdrawable amount
- `get-stream-status-string(stream-id)` - Get readable status
- `get-streams-by-sender(sender)` - List sender's streams
- `get-streams-by-recipient(recipient)` - List recipient's streams

## Resources

- [Clarity 4 Documentation](https://docs.stacks.co/reference/clarity/functions)
- [Clarinet Documentation](https://docs.hiro.so/clarinet/getting-started)
- [Stacks.js Documentation](https://stacks.js.org/)
- [SIP-010 Token Standard](https://github.com/stacksgov/sips/blob/main/sips/sip-010/sip-010-fungible-token-standard.md)
- [SIP-033 Specification](https://github.com/stacksgov/sips/pull/218)
- [SIP-034 Specification](https://github.com/314159265359879/sips/blob/9b45bf07b6d284c40ea3454b4b1bfcaeb0438683/sips/sip-034/sip-034.md)

## License

MIT
