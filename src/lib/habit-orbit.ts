import type { Address } from "viem";

export const MAX_HABIT_NAME_LENGTH = 24;
export const MAX_HABIT_NOTE_LENGTH = 180;

export const habitOrbitAbi = [
  {
    type: "function",
    name: "logHabit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "habitName", type: "string" },
      { name: "note", type: "string" },
    ],
    outputs: [{ name: "habitId", type: "uint256" }],
  },
  {
    type: "function",
    name: "getHabitLog",
    stateMutability: "view",
    inputs: [{ name: "habitId", type: "uint256" }],
    outputs: [
      { name: "author", type: "address" },
      { name: "habitName", type: "string" },
      { name: "note", type: "string" },
      { name: "streakCount", type: "uint256" },
      { name: "createdAt", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "nextHabitId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export type HabitOrbitData = {
  author: Address;
  habitName: string;
  note: string;
  streakCount: bigint;
  createdAt: bigint;
};

export const habitOrbitContractAddress = process.env
  .NEXT_PUBLIC_HABIT_ORBIT_CONTRACT_ADDRESS as Address | undefined;
