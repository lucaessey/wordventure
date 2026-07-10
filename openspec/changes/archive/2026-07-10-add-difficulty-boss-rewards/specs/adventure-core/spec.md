## MODIFIED Requirements

### Requirement: Coin earning
Beating a non-boss level SHALL award `adventure.rewards.level` coins (initially $10), identical across all difficulties. Beating a boss SHALL award coins from `adventure.bossReward` keyed by the run's difficulty (initially Easy $25, Normal $20, Hard $15); there SHALL be no flat difficulty-independent boss reward. Coins SHALL accumulate across the run, be displayed during play, and be lost when the run ends. Spending is out of scope for this capability (see the shop change).

#### Scenario: Level reward
- **WHEN** a non-boss level is beaten
- **THEN** the run's coins increase by `adventure.rewards.level` and the amount is shown in the win moment

#### Scenario: Boss reward by difficulty
- **WHEN** a boss level is beaten
- **THEN** the run's coins increase by `adventure.bossReward` for the run's difficulty (Easy, Normal, or Hard)

#### Scenario: Boss reward differs across difficulties
- **WHEN** the same boss level is beaten on Easy versus on Hard
- **THEN** the Easy run gains `adventure.bossReward.easy` and the Hard run gains `adventure.bossReward.hard`, which are different values
