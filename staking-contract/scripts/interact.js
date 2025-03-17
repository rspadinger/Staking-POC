const { CONTRACT_ADDRESS, CONTRACT_ADDRESS_LOCAL } = process.env

let provider, contract, txn

async function main() {
    //provider = ethers.provider
    const currentNetwork = await ethers.provider.getNetwork()

    if (currentNetwork.chainId.toString().includes(1337)) {
        //we are on a local network
        contract = await ethers.getContractAt("Staking", CONTRACT_ADDRESS_LOCAL)
    } else {
        //we are on a remote network
        contract = await ethers.getContractAt("Staking", CONTRACT_ADDRESS)
    }

    // we only specified 1 PK in hardhat.config.js => to execute this script on Sepolia, a second PK needs to be added
    const [signer1, signer2] = await ethers.getSigners()

    console.log("Minimum Stake Amount: ", ethers.formatEther(await contract.minimumStakeAmount()))

    console.log("Annual Reward Rate: ", await contract.annualRewardRate())

    txn = await contract.setMinimumStakeAmount(ethers.parseEther("5"))
    await txn.wait()

    console.log("Minimum Stake Amount: ", ethers.formatEther(await contract.minimumStakeAmount()))
}

main()
