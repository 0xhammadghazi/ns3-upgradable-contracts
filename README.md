# ns3-upgradable-contracts Setup Steps

1. **Initialize a new npm project**:

   ```bash
   npm init -y
   ```

2. **Install Hardhat**:

   ```bash
   npm install --save-dev hardhat
   ```

3. **Initialize Hardhat**:

   ```bash
   npx hardhat init
   ```

   - Select "empty config" when prompted.

4. **Install Hardhat Toolbox**:

   ```bash
   npm i @nomicfoundation/hardhat-toolbox
   ```

5. **Install OpenZeppelin Contracts (upgradeable)**:

   ```bash
   npm install @openzeppelin/contracts-upgradeable
   ```

6. **Install OpenZeppelin Hardhat Upgrades plugin**:

   ```bash
   npm install --save-dev @openzeppelin/hardhat-upgrades
   ```

7. **Ensure you have Node.js version 18 or above**.

8. **Configure Hardhat** by adding the following to your `hardhat.config.js` file:

   ```javascript
   require("@nomicfoundation/hardhat-toolbox");
   require("@openzeppelin/hardhat-upgrades");
   require("dotenv").config();

   module.exports = {
     solidity: "0.8.20",
     networks: {
       sepolia: {
         url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`,
         accounts: [process.env.PRIVATE_KEY],
       },
     },
     etherscan: {
       apiKey: {
         sepolia: process.env.ETHERSCAN_API_KEY,
       },
     },
   };
   ```

9. **Create a `.env` file** and add the following entries:

   ```
   PRIVATE_KEY =
   ETHERSCAN_API_KEY =
   INFURA_API_KEY =
   ```

10. **Create a `.gitignore` file** and add the following lines:

    ```
    node_modules/
    artifacts/
    cache/
    .env
    ```

11. **Install dotenv package**:

    ```bash
    npm i dotenv
    ```

12. **Create the following directories** in your project structure:
    ```
    contracts/
    scripts/
    test/
    ```
13. **To compile contracts**, run:

    ```bash
    npx hardhat compile
    ```

14. **To run tests**, execute:

    ```bash
    npx hardhat test
    ```

15. **To deploy contracts locally**, run:

    ```bash
    npx hardhat run ./scripts/script_name.sol
    ```

    **E.g.**:

    ```bash
    npx hardhat run ./scripts/deployEnsRegistry.sol
    ```

16. **To deploy on a testnet/mainnet and verify it**, run:
    ```bash
    npx hardhat run ./scripts/script_name.sol --network networkName
    ```
    **E.g.**:
    ```bash
    npx hardhat run ./scripts/deployEnsRegistry.sol --network sepolia
    ```
