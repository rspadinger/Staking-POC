const { expect } = require("chai")
const { loadFixture, setBalance, time } = require("@nomicfoundation/hardhat-network-helpers")
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs")

describe("Staking contract", function () {
    async function deployContractFixture() {
        const [deployer, user, otherUser] = await ethers.getSigners()

        // Deploy StakingToken first
        const StakingToken = await ethers.getContractFactory("StakingToken")
        const stakingToken = await StakingToken.deploy()
        await stakingToken.waitForDeployment()

        // Deploy Staking contract with StakingToken address
        const Staking = await ethers.getContractFactory("Staking")
        const staking = await Staking.deploy(await stakingToken.getAddress())
        await staking.waitForDeployment()

        // Transfer some tokens to the user for testing
        const mintAmount = ethers.parseEther("10000")
        await stakingToken.mint(user.address, mintAmount)
        await stakingToken.mint(otherUser.address, mintAmount)

        return { staking, stakingToken, deployer, user, otherUser }
    }

    describe("Deployment", function () {
        it("Should set the correct staking token", async function () {
            const { staking, stakingToken } = await loadFixture(deployContractFixture)
            expect(await staking.stakingToken()).to.equal(await stakingToken.getAddress())
        })

        it("Should set the correct initial values", async function () {
            const { staking } = await loadFixture(deployContractFixture)
            expect(await staking.minimumStakeAmount()).to.equal(ethers.parseEther("10"))
            expect(await staking.annualRewardRate()).to.equal(1000) // 10%
            expect(await staking.lockPeriod()).to.equal(30 * 24 * 60 * 60) // 30 days
            expect(await staking.earlyWithdrawalPenalty()).to.equal(500) // 5%
        })
    })

    describe("Staking", function () {
        it("Should allow staking above minimum amount", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const stakeAmount = ethers.parseEther("100")
            
            // Approve staking contract
            await stakingToken.connect(user).approve(await staking.getAddress(), stakeAmount)
            
            // Stake tokens
            await expect(staking.connect(user).stake(stakeAmount))
                .to.emit(staking, "Staked")
                .withArgs(user.address, stakeAmount)

            const userInfo = await staking.userInfo(user.address)
            expect(userInfo.totalStaked).to.equal(stakeAmount)
        })

        it("Should reject staking below minimum amount", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const stakeAmount = ethers.parseEther("1") // Below minimum
            
            await stakingToken.connect(user).approve(await staking.getAddress(), stakeAmount)
            
            await expect(staking.connect(user).stake(stakeAmount))
                .to.be.revertedWith("Stake must be at least minimumStakeAmount")
        })
    })

    describe("Withdrawals", function () {
        it("Should allow withdrawal after lock period without penalty", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const stakeAmount = ethers.parseEther("100")
            
            // Get initial balance
            const initialBalance = await stakingToken.balanceOf(user.address)
            
            // Approve and stake tokens
            await stakingToken.connect(user).approve(await staking.getAddress(), stakeAmount)
            await staking.connect(user).stake(stakeAmount)
            
            // Fast forward past lock period (30 days + 1 second to be safe)
            await time.increase(30 * 24 * 60 * 60 + 1)
            
            // Get balance before withdrawal
            const preWithdrawBalance = await stakingToken.balanceOf(user.address)
            
            // Record owner's balance before withdrawal
            const ownerBalanceBefore = await stakingToken.balanceOf(await staking.owner())
            
            // Withdraw
            const withdrawTx = await staking.connect(user).withdraw(stakeAmount)
            
            // Verify the Withdrawn event
            await expect(withdrawTx)
                .to.emit(staking, "Withdrawn")
                .withArgs(user.address, stakeAmount, 0) // No penalty
            
            // Check final balances
            const finalBalance = await stakingToken.balanceOf(user.address)
            const ownerBalanceAfter = await stakingToken.balanceOf(await staking.owner())
            
            // User should receive full amount
            expect(finalBalance).to.equal(preWithdrawBalance + stakeAmount)
            // Owner should not receive any penalty
            expect(ownerBalanceAfter).to.equal(ownerBalanceBefore)            
        })

        it("Should apply penalty for early withdrawal", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const stakeAmount = ethers.parseEther("100")
            
            // Get initial balances
            const initialUserBalance = await stakingToken.balanceOf(user.address)
            const initialOwnerBalance = await stakingToken.balanceOf(await staking.owner())
            
            // Approve and stake tokens
            await stakingToken.connect(user).approve(await staking.getAddress(), stakeAmount)
            await staking.connect(user).stake(stakeAmount)
            
            // Withdraw early
            const BASE = 10000 // Same as contract's BASE constant
            const penalty = (stakeAmount * BigInt(500)) / BigInt(BASE) // 5% penalty
            
            const withdrawTx = await staking.connect(user).withdraw(stakeAmount)
            
            // Verify the Withdrawn event
            await expect(withdrawTx)
                .to.emit(staking, "Withdrawn")
                .withArgs(user.address, stakeAmount, penalty)
            
            // Check final balances
            const finalUserBalance = await stakingToken.balanceOf(user.address)
            const finalOwnerBalance = await stakingToken.balanceOf(await staking.owner())
            
            // User should receive amount minus penalty
            expect(finalUserBalance).to.equal(initialUserBalance - penalty)
            // Owner should receive the penalty
            expect(finalOwnerBalance).to.equal(initialOwnerBalance + penalty)            
        })
    })

    describe("Rewards", function () {
        it("Should calculate correct tier rewards", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const stakeAmount = ethers.parseEther("5000") // Second tier
            
            await stakingToken.connect(user).approve(await staking.getAddress(), stakeAmount)
            await staking.connect(user).stake(stakeAmount)
            
            // Fast forward 1 year
            await time.increase(365 * 24 * 60 * 60)
            
            const rewards = await staking.pendingRewards(user.address)
            
            // Calculate expected rewards
            // Base rate (10%) + Tier 2 rate (5%) = 15% of staked amount
            const baseReward = (stakeAmount * BigInt(1000)) / BigInt(10000) // 10%
            const tierReward = (stakeAmount * BigInt(500)) / BigInt(10000)  // 5%
            const expectedRewards = baseReward + tierReward
            
            // Allow for a larger margin due to block timestamp variations
            const tolerance = ethers.parseEther("1") // 1 token tolerance
            expect(rewards).to.be.closeTo(expectedRewards, tolerance)
        })

        it("Should auto-compound rewards on new stake", async function () {
            const { staking, stakingToken, user } = await loadFixture(deployContractFixture)
            const initialStake = ethers.parseEther("1000")
            
            // Initial stake
            await stakingToken.connect(user).approve(await staking.getAddress(), initialStake)
            await staking.connect(user).stake(initialStake)
            
            // Fast forward 6 months
            await time.increase(180 * 24 * 60 * 60)
            
            // Additional stake should trigger auto-compound
            const additionalStake = ethers.parseEther("500")
            await stakingToken.connect(user).approve(await staking.getAddress(), additionalStake)
            await staking.connect(user).stake(additionalStake)
            
            const userInfo = await staking.userInfo(user.address)
            expect(userInfo.totalStaked).to.be.gt(initialStake + additionalStake)
        })
    })

    describe("Admin functions", function () {
        it("Should allow owner to update minimum stake amount", async function () {
            const { staking, deployer } = await loadFixture(deployContractFixture)
            const newMinimum = ethers.parseEther("20")
            
            await staking.connect(deployer).setMinimumStakeAmount(newMinimum)
            expect(await staking.minimumStakeAmount()).to.equal(newMinimum)
        })

        it("Should allow owner to update early withdrawal penalty", async function () {
            const { staking, deployer } = await loadFixture(deployContractFixture)
            const newPenalty = 10 // 10%
            
            await expect(staking.connect(deployer).setEarlyWithdrawalPenalty(newPenalty))
                .to.not.be.reverted
            
            expect(await staking.earlyWithdrawalPenalty()).to.equal(newPenalty)
        })

        it("Should reject penalty above 100%", async function () {
            const { staking, deployer } = await loadFixture(deployContractFixture)
            const invalidPenalty = 101
            
            await expect(staking.connect(deployer).setEarlyWithdrawalPenalty(invalidPenalty))
                .to.be.revertedWith("Invalid penalty percentage")
        })
    })
})
