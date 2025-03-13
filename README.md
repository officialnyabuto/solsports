# SolSports

A decentralized sports betting platform built on Solana blockchain, allowing users to place bets on sporting events using SPL tokens (USDC). The platform features a React frontend with Solana wallet integration and a secure Rust-based Solana program for managing bets.

## Features

- Place bets on sports events with SPL tokens (USDC)
- Real-time odds display
- Secure bet management through Solana smart contracts
- Automated payouts for winning bets
- User-friendly interface with Phantom wallet integration
- Comprehensive analytics and compliance features
- Pyth oracle integration for automated settlements

## Project Structure

```
solsports/
├── programs/                    # Solana program (smart contract)
│   └── solana-sports-betting/
│       └── src/
│           └── lib.rs          # Main program logic
├── src/                        # Frontend source code
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── utils/                  # Utility functions and services
│   ├── types/                  # TypeScript type definitions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── tests/                      # Program and integration tests
├── Anchor.toml                 # Anchor configuration
├── package.json               # Project dependencies
└── README.md                  # Project documentation
```

## Prerequisites

- Node.js 16+ and npm
- Rust and Cargo
- Solana CLI tools
- Anchor Framework
- Phantom Wallet browser extension

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solsports
```

2. Install dependencies:
```bash
npm install
```

3. Install Anchor dependencies:
```bash
npm install -g @coral-xyz/anchor-cli
```

4. Build the Solana program:
```bash
anchor build
```

5. Deploy the program to localnet:
```bash
anchor deploy
```

## Development

1. Start the local Solana validator:
```bash
solana-test-validator
```

2. Start the development server:
```bash
npm run dev
```

3. Run program tests:
```bash
anchor test
```

## Smart Contract (Solana Program)

The Solana program implements:

- Betting pool initialization
- Bet placement
- Event settlement via Pyth oracle
- Winnings distribution
- Multi-token support

## Frontend Features

- Wallet integration using `@solana/wallet-adapter`
- Real-time event listing
- Interactive betting interface
- User balance tracking
- Responsive design with Tailwind CSS
- Analytics dashboard
- Compliance monitoring

## Testing

Comprehensive test suite includes:

- Smart contract unit tests
- Integration tests
- Oracle integration tests
- Analytics service tests
- Compliance system tests

## Security Features

- Rate limiting for betting actions
- Comprehensive compliance checks
- Betting limits enforcement
- Oracle data validation
- Error handling and recovery
- Transaction monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details