const { expect } = require("chai")
const { loadFixture, setBalance } = require("@nomicfoundation/hardhat-network-helpers")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs")

describe("MyToken contract", function () {
    async function deployContractFixture() {
        const [deployer, user] = await ethers.getSigners()

        const myTokenContract = await ethers.deployContract("MyToken")
        await myTokenContract.waitForDeployment()

        return { myTokenContract, deployer, user }
    }

    describe("Testing Hardhat Chai Matchers", function () {
        it("Should return correct token balance for user after transfer of 10 MT", async function () {
            const { myTokenContract, user } = await loadFixture(deployContractFixture)

            await myTokenContract.transfer(user.address, ethers.parseEther("10"))
            expect(await myTokenContract.balanceOf(user.address)).to.eq(ethers.parseEther("10"))
        })

        it("Should revert when transferring tokens to zero address", async function () {
            const { myTokenContract } = await loadFixture(deployContractFixture)

            await expect(myTokenContract.transfer(ethers.ZeroAddress, ethers.parseEther("1")))
                .to.be.revertedWithCustomError(myTokenContract, "ERC20InvalidReceiver")
                .withArgs(ethers.ZeroAddress)
        })

        it("Should emit a Transfer event on token transfer", async function () {
            const { myTokenContract, user } = await loadFixture(deployContractFixture)

            await expect(myTokenContract.transfer(user.address, ethers.parseEther("1")))
                .to.emit(myTokenContract, "Transfer")
                .withArgs(anyValue, user.address, ethers.parseEther("1"))
        })

        it("Should change token balance after transfer", async function () {
            const { myTokenContract, deployer, user } = await loadFixture(deployContractFixture)

            await expect(myTokenContract.transfer(user.address, 1000)).to.changeTokenBalance(
                myTokenContract,
                deployer.address,
                -1000
            )

            await expect(myTokenContract.transfer(user.address, 1000)).to.changeTokenBalance(
                myTokenContract,
                user.address,
                1000
            )

            //or:
            await expect(myTokenContract.transfer(user.address, 1000)).to.changeTokenBalances(
                myTokenContract,
                [deployer.address, user.address],
                [-1000, 1000]
            )
        })

        it("Should return correct token supply - support for BigInt", async function () {
            const { myTokenContract, deployer, user } = await loadFixture(deployContractFixture)

            const totalSupply = await myTokenContract.totalSupply()
            expect(totalSupply).to.eq(ethers.parseEther("100000"))
            expect(totalSupply).to.eq(100000n * 10n ** 18n)
            expect(totalSupply).to.eq(1_000_000_000_000_000_000_000_00n)
        })
    })

    describe("Testing Hardhat Network Helpers", function () {
        it("Should return correct ETH account balance for user after calling setBalance", async function () {
            const { user } = await loadFixture(deployContractFixture)

            await setBalance(user.address, 1n * 10n ** 18n)
            expect(await ethers.provider.getBalance(user.address)).to.eq(ethers.parseEther("1"))
        })
    })
})
