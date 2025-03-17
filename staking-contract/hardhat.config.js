require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config()

const { ALCHEMY_API_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env

module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: { enabled: true, runs: 200 },
        },
    },
    defaultNetwork: "localhost",
    networks: {
        sepolia: {
            url: ALCHEMY_API_URL,
            accounts: [`0x${PRIVATE_KEY}`, "0x15713bef9ffb1cdc53bf42118bff1cf8dd1d61ba670bc092d6247b273004dde8"],
        },
    },
    //npx hardhat verify --network sepolia ADDR "constructor argument"
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
}
