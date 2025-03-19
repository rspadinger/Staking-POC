# POC For A Simple Staking Contract

Smart contract that enables users to stake and withdraw a specific ERC20 token, featuring additional functionalities to enhance the staking experience. The contract automatically compounds rewards, includes customizable reward tiers based on staked amounts, and offers flexible parameters to fine-tune the staking process.

## Demo Frontend for StakeFlow Staking DApp

[StakeFlow Staking POC](https://staking-poc.vercel.app/)

## Dependencies

Install the following tools:

-   Node.js & NPM: https://nodejs.org
-   Hardhat: https://hardhat.org/hardhat-runner/docs/getting-started

Optionally, create an account on the following sites:

-   Alchemy (third party node provider): https://auth.alchemyapi.io/signup
-   Etherscan: https://etherscan.io/register

## Step 1. Clone the project

`git clone https://github.com/rspadinger/Staking-POC.git`

## Step 2. Install dependencies

```
`$ cd project_folder` => (replace project_folder with the name of the folder where the downloaded project files are located)
`$ npm install`
```

## Step 3. Start a local blockchain

To run a local Hardhat node, open a command window, select a directory where Hardhat is installed (cd myHardhatFolder...) and run the command:

`$ npx hardhat node`

## Step 4. Create a .env file

Rename the file .ENV-EXAMPLE to .env and provide correct values for the listed environment variables

## Step 5. Deploy the Smart Contract

The deployment script is located at: scripts/deploy.js

-   To deploy the SC to a local blockchain, open a command window and type: `$npx hardhat run scripts/deploy.js`
-   To deploy the SC to a remote blockchain (for example: sepolia), open a command window and type: npx hardhat run `$scripts/deploy.js --network sepolia`

## Step 6. Run the Script(s)

To execute the script file, open a command windom, navigate to the project folder and type:

`$ npx hardhat run scripts/scripn-name.js`

## Key Features:

### Auto-Compounded Rewards:

-   Rewards are automatically compounded, meaning that any earned rewards are added to the staked amount, generating more rewards over time.

### Reward Tiers:

-   The contract supports three reward tiers, which are adjustable by the admin. Users who stake higher amounts are eligible for higher reward rates, incentivizing larger stakes.

### Minimum Stake Amount:

-   The admin can set a minimum amount required for users to participate in staking.

### Lock Period and Early Withdrawal Penalty:

-   The contract allows the admin to set a minimum lock period during which staked tokens cannot be withdrawn. If users choose to withdraw before the lock period expires, they will incur an early withdrawal penalty.
-   Admin Configurations:
-   The contract allows the admin to configure:
-   Reward tiers and their associated reward rates.
-   Minimum stake amount.
-   Lock period.
-   Early withdrawal penalty.
-   Annual reward rate (expressed in basis points).

## Simple Proof-of-Concept:

This is a simple proof-of-concept (POC) at this stage, and the contract is not yet production-ready. The following are some important notes:

-   Some features are still missing.
-   The contract has not been tested thoroughly.
-   The functions lack detailed comments for easier understanding.
-   The contract provides a foundation for building a more complex and feature-rich staking system, but further work and testing are required before it is ready for live deployment.
