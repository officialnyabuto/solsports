# Solana Sports Betting dApp

A decentralized sports betting platform built on Solana blockchain, allowing users to place bets on sporting events using SPL tokens (USDC). The platform features a React frontend with Solana wallet integration and a secure Rust-based Solana program for managing bets.

## Features

- Place bets on sports events with SPL tokens (USDC)
- Real-time odds display
- Secure bet management through Solana smart contracts
- Automated payouts for winning bets
- User-friendly interface with Phantom wallet integration

## Project Structure

```
solana-sports-betting/
├── programs/                    # Solana program (smart contract)
│   └── solana-sports-betting/
│       └── src/
│           └── lib.rs          # Main program logic
├── src/                        # Frontend source code
│   ├── components/             # React components
│   │   ├── BettingModal.tsx   # Betting interface
│   │   ├── EventCard.tsx      # Sports event display
│   │   ├── WalletBalance.tsx  # User balance display
│   │   └── WalletProvider.tsx # Solana wallet integration
│   ├── types/                  # TypeScript type definitions
│   │   └── betting.ts
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── tests/                      # Program tests
│   └── solana-sports-betting.ts
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
cd solana-sports-betting
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

The Solana program (`programs/solana-sports-betting/src/lib.rs`) implements the following functionality:

- `initialize_betting_pool`: Create new betting events
- `place_bet`: Place bets on events
- `settle_event`: Settle event outcomes
- `claim_winnings`: Claim winnings for successful bets

## Frontend

The React frontend provides:

- Wallet connection using `@solana/wallet-adapter`
- Event listing and betting interface
- Real-time balance updates
- Bet placement and management
- Responsive design using Tailwind CSS

## Testing

The project includes comprehensive tests for the Solana program:

- Unit tests for program instructions
- Integration tests for the complete betting flow
- Mock data for testing various scenarios

Run tests with:
```bash
anchor test
```

## Security

- Row-level security for bet access
- Comprehensive error handling
- Input validation
- Time-based constraints for betting
- Authority checks for administrative actions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details