// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract BaseHabitOrbit {
    uint256 public nextHabitId = 1;

    struct HabitOrbitLog {
        address author;
        string habitName;
        string note;
        uint256 streakCount;
        uint256 createdAt;
    }

    mapping(uint256 => HabitOrbitLog) private habitLogs;
    mapping(bytes32 => uint256) private completionCounts;

    event HabitLogged(
        uint256 indexed habitId,
        address indexed author,
        string habitName,
        string note,
        uint256 streakCount
    );

    function logHabit(
        string calldata habitName,
        string calldata note
    ) external returns (uint256 habitId) {
        require(bytes(habitName).length > 0 && bytes(habitName).length <= 24, "Invalid habit");
        require(bytes(note).length > 0 && bytes(note).length <= 180, "Invalid note");

        bytes32 key = keccak256(abi.encodePacked(msg.sender, habitName));
        uint256 streakCount = completionCounts[key] + 1;
        completionCounts[key] = streakCount;

        habitId = nextHabitId++;
        habitLogs[habitId] = HabitOrbitLog({
            author: msg.sender,
            habitName: habitName,
            note: note,
            streakCount: streakCount,
            createdAt: block.timestamp
        });

        emit HabitLogged(habitId, msg.sender, habitName, note, streakCount);
    }

    function getHabitLog(
        uint256 habitId
    )
        external
        view
        returns (
            address author,
            string memory habitName,
            string memory note,
            uint256 streakCount,
            uint256 createdAt
        )
    {
        HabitOrbitLog storage entry = habitLogs[habitId];
        return (
            entry.author,
            entry.habitName,
            entry.note,
            entry.streakCount,
            entry.createdAt
        );
    }
}
