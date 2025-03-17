async function main() {
    const myToken = await ethers.deployContract("StakingToken")
    await myToken.waitForDeployment()

    console.log("MyToken deployed to:", myToken.target)

    const stakingContract = await ethers.deployContract("Staking", [myToken.target])
    await stakingContract.waitForDeployment()

    console.log("staking contract deployed to:", stakingContract.target)
}

main().catch((error) => {
    console.error(error)
    process.exitCode = 1
})

//Token on Seploia: 0xdAcA9A0186C17A9B7772771D8C275f19279Ae125
//Staking on Sepolia: 0x841e3B679D022dff4e86Fa7b6A39CA736C2529A9
