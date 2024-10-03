# How to Clone and Run This Repository

## Prerequisites
- Node.js version 18 or above

## Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/0xhammadghazi/ns3-upgradable-contracts.git
   ```

2. **Install dependencies**
   ```bash
   npm i
   ```

3. **Configure environment**
   Create a `.env` file in the root directory and add the following entries:
   ```
   PRIVATE_KEY=
   ETHERSCAN_API_KEY=
   INFURA_API_KEY=
   ```

## Usage

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests
```bash
npx hardhat test
```

### Deploy Contracts

#### Local Deployment
```bash
npx hardhat run ./scripts/script_name.sol
```
Example:
```bash
npx hardhat run ./scripts/deployEnsRegistry.sol
```

#### Testnet/Mainnet Deployment and Verification
```bash
npx hardhat run ./scripts/script_name.sol --network networkName
```
Example:
```bash
npx hardhat run ./scripts/deployEnsRegistry.sol --network sepolia
```

## Notes
- Make sure to replace the environment variables in the `.env` file with your actual values
- For network deployments, ensure you have sufficient funds in your wallet for the target network