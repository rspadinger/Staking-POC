// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Staking is Ownable {
    uint256 public constant BASE = 1000; //100%
    uint256 public constant SECONDS_PER_YEAR = 365 * 24 * 60 * 60; //31536000

    IERC20 public stakingToken;

    struct UserInfo {
        uint256 totalStaked;
        uint256 weightedStartTime;
    }

    mapping(address => UserInfo) public userInfo;

    uint256 public minimumStakeAmount = 10e18;
    uint256 public annualRewardRate = 1000; // expressed in basis points (e.g., 1000 = 10%)
    uint256[3] public tierThresholds = [1000 ether, 5000 ether, 10000 ether];
    uint256[3] public tierRewardRates = [300, 500, 700]; // 3%, 5%, 7%

    uint256 public lockPeriod = 30 days;
    uint256 public earlyWithdrawalPenalty = 500; // 5% penalty

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount, uint256 penalty);
    event AnnualRewardRateUpdated(uint256 newAnnualRate);

    constructor(address _stakingToken) Ownable(msg.sender) {
        stakingToken = IERC20(_stakingToken);
    }

    // ========= Admin Functions =========
    function setTierThresholds(uint256[3] memory _thresholds) external onlyOwner {
        tierThresholds = _thresholds;
    }

    function setTierRewardRates(uint256[3] memory _rates) external onlyOwner {
        tierRewardRates = _rates;
    }

    function setLockPeriod(uint256 _lockPeriod) external onlyOwner {
        lockPeriod = _lockPeriod;
    }

    function setMinimumStakeAmount(uint256 _minimumStakeAmount) external onlyOwner {
        minimumStakeAmount = _minimumStakeAmount;
    }

    function setEarlyWithdrawalPenalty(uint256 _penalty) external onlyOwner {
        require(_penalty <= 100, "Invalid penalty percentage");
        earlyWithdrawalPenalty = _penalty;
    }

    function setAnnualRewardRate(uint256 _annualRate) external onlyOwner {
        require(_annualRate <= 5000, "Rate cannot exceed 50%");
        annualRewardRate = _annualRate;

        emit AnnualRewardRateUpdated(_annualRate);
    }

    // ========= Internal Helper Functions =========
    function getTierRewardRate(uint256 amount) internal view returns (uint256) {
        if (amount >= tierThresholds[2]) {
            return tierRewardRates[2];
        } else if (amount >= tierThresholds[1]) {
            return tierRewardRates[1];
        } else if (amount >= tierThresholds[0]) {
            return tierRewardRates[0];
        } else {
            return 0;
        }
    }

    function pendingRewards(address _user) public view returns (uint256) {
        UserInfo storage user = userInfo[_user];
        if (user.totalStaked == 0) return 0;

        uint256 timeStaked = block.timestamp - user.weightedStartTime;
        uint256 tierRate = getTierRewardRate(user.totalStaked);

        //careful : this assumes our StakingToken has 18 decimals => adjust this for all tokens !
        uint256 adjustedRate = ((annualRewardRate + tierRate) * 1e18) / (SECONDS_PER_YEAR * BASE);
        uint256 totalRewards = (adjustedRate * timeStaked * user.totalStaked) / 1e18;
        return totalRewards;
    }

    // ========= Staking Functions =========
    function stake(uint256 amount) external {
        require(amount >= minimumStakeAmount, "Stake must be at least minimumStakeAmount");

        // Auto-compound pending rewards before updating state
        _autoCompound(msg.sender);

        UserInfo storage user = userInfo[msg.sender];

        if (user.totalStaked > 0) {
            // Update weighted start time using weighted average
            uint256 totalWeight = (user.totalStaked * user.weightedStartTime) + (amount * block.timestamp);
            user.weightedStartTime = totalWeight / (user.totalStaked + amount);
        } else {
            user.weightedStartTime = block.timestamp;
        }

        user.totalStaked += amount;

        stakingToken.transferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) external {
        _autoCompound(msg.sender);

        _withdraw(amount);
    }

    function withdrawAll() external {
        _autoCompound(msg.sender);

        _withdraw(userInfo[msg.sender].totalStaked);
    }

    function _withdraw(uint256 amount) internal {
        UserInfo storage user = userInfo[msg.sender];

        require(amount > 0 && user.totalStaked >= amount, "Invalid withdrawal amount");

        uint256 penalty = 0;

        if (block.timestamp < user.weightedStartTime + lockPeriod) {
            // Apply early withdrawal penalty
            penalty = (amount * earlyWithdrawalPenalty) / BASE;
            stakingToken.transfer(owner(), penalty);
        }

        user.totalStaked -= amount;

        if (user.totalStaked == 0) {
            user.weightedStartTime = 0;
        }

        stakingToken.transfer(msg.sender, amount - penalty);
        emit Withdrawn(msg.sender, amount, penalty);
    }

    // ========= Auto-Compounding =========
    function _autoCompound(address _user) internal {
        UserInfo storage user = userInfo[_user];
        uint256 pending = pendingRewards(_user);

        if (pending > 0) {
            // Update weighted start time to reflect new total
            uint256 totalWeight = (user.totalStaked * user.weightedStartTime) + (pending * block.timestamp);
            user.weightedStartTime = totalWeight / (user.totalStaked + pending);

            user.totalStaked += pending;
        }
    }
}
