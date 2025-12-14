# Stacks Token Streaming Protocol

A comprehensive token streaming protocol built on Stacks blockchain with full Clarity 4 support.

## Project Overview

This project implements a decentralized **STX streaming protocol** that allows users to stream STX tokens over time with advanced features including:

- 🎯 **Native STX Streaming** - Stream STX with time-based vesting
- ⏸️ **Pause/Resume Functionality** - Flexible stream control
- 📊 **Event Logging** - Complete operation tracking
- 🔐 **Clarity 4 Security** - Using `as-contract?` with explicit allowances for enhanced security
- 💰 **Fair Cancellation** - Vested tokens go to recipient, unvested refunded to sender

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

- ✅ **Create STX Streams** - Stream STX tokens over customizable durations (1 min to 1 year)
- ✅ **Withdraw Tokens** - Recipients withdraw vested STX at any time
- ✅ **Cancel Streams** - Fair cancellation: vested goes to recipient, unvested refunded to sender
- ✅ **Pause/Resume** - Temporarily suspend streams with accurate vesting accounting
- ✅ **Minimum Amounts** - Prevents dust attacks (0.001 STX minimum)

### Clarity 4 Features

- 🕐 **stacks-block-time** - Precise timestamp-based vesting calculations
- 📦 **stacks-block-height** - Block-level stream tracking
- 🔍 **contract-hash?** - On-chain contract template verification
- 🔐 **as-contract? with allowances** - Explicit STX allowances prevent unauthorized transfers
- 🛡️ **Reentrancy Protection** - Checks-effects-interactions pattern implemented

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

;; Stream 10 STX over 1 week
(contract-call? .stream-manager create-stream
    'SP2...RECIPIENT
    u10000000  ;; 10 STX
    u604800)   ;; 7 days
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

| Function               | Description                    | Access    |
| ---------------------- | ------------------------------ | --------- |
| `create-stream`        | Create STX stream (1min-1year) | Anyone    |
| `withdraw-from-stream` | Withdraw vested STX            | Recipient |
| `cancel-stream`        | Cancel with fair vesting split | Sender    |
| `pause-stream`         | Pause stream vesting           | Sender    |
| `resume-stream`        | Resume paused stream           | Sender    |

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
- [LearnWeb3 Tutorial](https://learnweb3.io/courses/introduction-to-stacks/project-build-a-token-streaming-protocol/)
- [SIP-033 Specification](https://github.com/stacksgov/sips/pull/218)
- [SIP-034 Specification](https://github.com/314159265359879/sips/blob/9b45bf07b6d284c40ea3454b4b1bfcaeb0438683/sips/sip-034/sip-034.md)

## License

MIT
