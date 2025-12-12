# Stacks Token Streaming Protocol

A token streaming protocol built on Stacks blockchain.

## Project Overview

This project implements a decentralized token streaming protocol that allows users to stream tokens over time.

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

- Create token streams with customizable duration and amounts
- Cancel streams and withdraw unlocked tokens
- Time-based vesting using `stacks-block-time`
- Enhanced security with asset restrictions
- On-chain contract verification

## Resources

- [Clarity 4 Documentation](https://docs.stacks.co/reference/clarity/functions)
- [Clarinet Documentation](https://docs.hiro.so/clarinet/getting-started)
- [Stacks.js Documentation](https://stacks.js.org/)
- [SIP-033 Specification](https://github.com/stacksgov/sips/pull/218)
- [SIP-034 Specification](https://github.com/314159265359879/sips/blob/9b45bf07b6d284c40ea3454b4b1bfcaeb0438683/sips/sip-034/sip-034.md)

## License

MIT
