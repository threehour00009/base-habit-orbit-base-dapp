"use client";

import {
  Orbit,
  Loader2,
  MoonStar,
  Radar,
  Repeat2,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { Address } from "viem";
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { base } from "wagmi/chains";
import {
  habitOrbitAbi,
  habitOrbitContractAddress,
  MAX_HABIT_NOTE_LENGTH,
  MAX_HABIT_NAME_LENGTH,
} from "@/lib/habit-orbit";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const BUILT_IN_HABITS = ["Read", "Walk", "Ship", "Learn"];

function shortAddress(address?: Address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function dateLabel(createdAt?: bigint) {
  if (!createdAt) return "--";
  return new Date(Number(createdAt) * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function HabitOrbitApp() {
  const [habitIdInput, setHabitIdInput] = useState("1");
  const [habitName, setHabitName] = useState("Read");
  const [note, setNote] = useState(
    "Completed a quiet session and kept the chain of small wins alive.",
  );
  const [status, setStatus] = useState(
    "Log one habit completion on Base and keep an orbital streak record.",
  );
  const [walletStatus, setWalletStatus] = useState("");

  const { address, chainId, connector, isConnected } = useAccount();
  const { connectors, connectAsync, isPending: connecting } = useConnect();
  const { disconnectAsync, isPending: disconnecting } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const {
    data: hash,
    writeContract,
    isPending: writing,
    error: writeError,
  } = useWriteContract();

  const { isLoading: confirming, isSuccess: confirmed } =
    useWaitForTransactionReceipt({ hash });

  const availableConnectors = useMemo(
    () =>
      connectors
        .filter((item) => item.type !== "mock")
        .sort((a, b) => {
          const score = (item: (typeof connectors)[number]) => {
            if (item.id === "baseAccount" || item.name === "Base Account") {
              return 0;
            }
            if (item.type === "injected") return 1;
            return 2;
          };

          return score(a) - score(b);
        }),
    [connectors],
  );

  async function connectWallet() {
    const errors: string[] = [];
    setWalletStatus("Opening wallet...");

    for (const item of availableConnectors) {
      try {
        await connectAsync({ connector: item, chainId: base.id });
        setWalletStatus("");
        return;
      } catch (error) {
        errors.push(
          error instanceof Error
            ? `${item.name}: ${error.message}`
            : `${item.name}: connection failed`,
        );
      }
    }

    setWalletStatus(
      errors[0] ??
        "No wallet connector is available. Open this app inside Base App or install a wallet.",
    );
  }

  async function disconnectWallet() {
    try {
      if (connector) {
        await disconnectAsync({ connector });
      } else {
        await disconnectAsync();
      }
      setWalletStatus("Wallet disconnected. Tap Connect to reconnect.");
    } catch (error) {
      setWalletStatus(
        error instanceof Error ? error.message : "Could not disconnect wallet.",
      );
    }
  }
  const parsedHabitId = BigInt(Math.max(1, Number(habitIdInput || "1")));

  const habitQuery = useReadContract({
    abi: habitOrbitAbi,
    address: habitOrbitContractAddress,
    functionName: "getHabitLog",
    args: [parsedHabitId],
    query: {
      enabled: Boolean(habitOrbitContractAddress),
      refetchInterval: 12000,
    },
  });

  const totalQuery = useReadContract({
    abi: habitOrbitAbi,
    address: habitOrbitContractAddress,
    functionName: "nextHabitId",
    query: {
      enabled: Boolean(habitOrbitContractAddress),
      refetchInterval: 12000,
    },
  });

  const habitTuple = habitQuery.data as
    | readonly [Address, string, string, bigint, bigint]
    | undefined;

  const habit = useMemo(
    () =>
      habitTuple
        ? {
            author: habitTuple[0],
            habitName: habitTuple[1],
            note: habitTuple[2],
            streakCount: habitTuple[3],
            createdAt: habitTuple[4],
          }
        : undefined,
    [habitTuple],
  );

  const totalLogged = totalQuery.data ? Math.max(Number(totalQuery.data) - 1, 0) : 0;

  const canLog =
    Boolean(habitOrbitContractAddress) &&
    isConnected &&
    chainId === base.id &&
    habitName.trim().length > 0 &&
    habitName.trim().length <= MAX_HABIT_NAME_LENGTH &&
    note.trim().length > 0 &&
    note.trim().length <= MAX_HABIT_NOTE_LENGTH;

  const statusText = confirmed
    ? "Habit orbit confirmed on Base."
    : writeError
      ? writeError.message
      : status;

  function logHabit() {
    if (!habitOrbitContractAddress) return;
    setStatus("Confirm the habit orbit in your wallet.");
    writeContract({
      address: habitOrbitContractAddress,
      abi: habitOrbitAbi,
      functionName: "logHabit",
      args: [habitName.trim(), note.trim()],
      chainId: base.id,
    });
  }

  return (
    <main className="min-h-screen bg-[#08101c] text-[#edf4ff]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,#23416e_0%,#08101c_46%,#050a12_100%)]">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between border-b border-[#7db6ff]/15 pb-3">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-[#7db6ff]/25 bg-[#0c1624] shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                <MoonStar className="h-5 w-5 text-[#7db6ff]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#7db6ff]">
                  Base Habit Orbit
                </p>
                <h1 className="text-xl font-black sm:text-2xl">
                  Keep one habit in orbit.
                </h1>
              </div>
            </div>

            {isConnected ? (
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[#7db6ff]/15 bg-[#0b1728] px-3 py-2 text-sm font-semibold text-[#dce9f9]">
                  {shortAddress(address)}
                </span>
                <button
                  className="rounded-full border border-[#7db6ff]/20 bg-[#0e1c30] px-4 py-2 text-sm font-semibold text-white"
                  onClick={disconnectWallet}
                >{disconnecting ? "Disconnecting" : "Disconnect"}</button>
              </div>
            ) : (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-[#7db6ff]/20 bg-[#0e1c30] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                disabled={availableConnectors.length === 0 || connecting}
                onClick={connectWallet}
              >
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Connect
              </button>
            )}
          {walletStatus ? (
            <p className="w-full text-right text-xs font-semibold opacity-75">
              {walletStatus}
            </p>
          ) : null}
        </header>

          <div className="grid flex-1 gap-4 py-4 xl:grid-cols-[minmax(0,1fr)_440px]">
            <section className="order-2 rounded-[34px] border border-[#7db6ff]/12 bg-[linear-gradient(180deg,rgba(10,18,30,0.98)_0%,rgba(7,13,24,0.98)_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] xl:order-1">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <div>
                  <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#7db6ff]/20 bg-[#0d1827] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#7db6ff]">
                    <Orbit className="h-3.5 w-3.5" />
                    Orbital habit log
                  </p>
                  <h2 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl xl:text-6xl">
                    A planet-like habit board for streaks, routines, and visible follow-through.
                  </h2>
                  <p className="mt-4 max-w-2xl text-base leading-7 text-[#93a9c7] sm:text-lg">
                    Pick one habit, note one completion, and pin it to Base as a clean record
                    you can revisit later.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[28px] border border-[#7db6ff]/15 bg-[#0b1724] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7db6ff]">
                      Total logs
                    </p>
                    <p className="mt-3 text-5xl font-black text-white">
                      {totalLogged || "00"}
                    </p>
                    <p className="mt-2 text-sm text-[#93a9c7]">Habit completions on Base</p>
                  </div>
                  <div className="rounded-[28px] border border-[#4c709d] bg-[#0a1625] p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9cc1ff]">
                      Current habit
                    </p>
                    <p className="mt-3 text-3xl font-black text-white">{habitName}</p>
                    <p className="mt-2 text-sm text-[#93a9c7]">
                      {BUILT_IN_HABITS.join(" / ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
                <div className="flex items-center justify-center rounded-[34px] border border-[#7db6ff]/12 bg-[#0b1724] p-6">
                  <div className="relative flex h-[320px] w-[320px] items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-[18px] border-[#27486f]" />
                    <div className="absolute inset-[18px] rounded-full border-[16px] border-[#7db6ff]" />
                    <div className="absolute inset-[54px] rounded-full border-[14px] border-[#ffc56c]" />
                    <div className="absolute inset-[98px] rounded-full border border-dashed border-[#93a9c7]/45" />
                    <div className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#7db6ff]" />
                    <div className="absolute right-7 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#ffc56c]" />
                    <div className="text-center">
                      <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#9cc1ff]">
                        Habit orbit
                      </p>
                      <p className="mt-3 text-7xl font-black text-white">
                        {habit?.streakCount ? habit.streakCount.toString() : "0"}
                      </p>
                      <p className="text-lg font-semibold text-[#93a9c7]">completions</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-[28px] border border-[#7db6ff]/12 bg-[#0b1626] p-5">
                    <div className="flex items-start justify-between gap-3 border-b border-[#7db6ff]/12 pb-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7db6ff]">
                          Latest orbit
                        </p>
                        <h3 className="mt-2 text-3xl font-black text-white">
                          {habit?.habitName || "Read"}
                        </h3>
                      </div>
                      <div className="rounded-full border border-[#7db6ff]/15 bg-[#0e1c30] px-3 py-2 text-sm font-semibold text-white">
                        {habit?.streakCount ? `${habit.streakCount.toString()}x` : "0x"}
                      </div>
                    </div>

                    <div className="grid gap-4 pt-4 lg:grid-cols-[minmax(0,1fr)_250px]">
                      <div className="rounded-[22px] border border-[#7db6ff]/12 bg-[#0a1321] p-4">
                        <p className="text-sm leading-7 text-[#e4eefc]">
                          {habit?.note ||
                            "Completed a quiet session and kept the chain of small wins alive."}
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-[20px] border border-[#7db6ff]/12 bg-[#0a1321] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                            Author
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {habit?.author && habit.author !== ZERO_ADDRESS
                              ? shortAddress(habit.author)
                              : "--"}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-[#7db6ff]/12 bg-[#0a1321] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                            Date
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {dateLabel(habit?.createdAt)}
                          </p>
                        </div>
                        <div className="rounded-[20px] border border-[#7db6ff]/12 bg-[#0a1321] p-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                            Status
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">Stored on Base</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["1", "Pick habit", "Choose Read, Walk, Ship, or Learn"],
                      ["2", "Write note", "One small completion description"],
                      ["3", "Save orbit", "Public habit history on Base"],
                    ].map(([step, label, sub]) => (
                      <div
                        key={step}
                        className="rounded-[24px] border border-[#7db6ff]/12 bg-[#0b1626] p-4"
                      >
                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#7db6ff]">
                          Step {step}
                        </p>
                        <p className="mt-2 text-lg font-semibold text-white">{label}</p>
                        <p className="mt-1 text-sm text-[#93a9c7]">{sub}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <aside className="order-1 flex flex-col gap-4 xl:order-2">
              <section className="rounded-[30px] border border-[#7db6ff]/12 bg-[#0b1626] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0d1827] text-[#7db6ff]">
                    <Radar className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">New orbit</h3>
                    <p className="text-sm text-[#93a9c7]">
                      Log one habit completion from today.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7db6ff]">
                      Habit
                    </span>
                    <input
                      value={habitName}
                      onChange={(event) => setHabitName(event.target.value)}
                      maxLength={MAX_HABIT_NAME_LENGTH}
                      className="mt-2 w-full rounded-[18px] border border-[#7db6ff]/15 bg-[#08101c] px-4 py-3 text-base font-semibold text-white outline-none placeholder:text-[#607d9f]"
                      placeholder="Read"
                    />
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {BUILT_IN_HABITS.map((item) => {
                      const active = habitName === item;
                      return (
                        <button
                          key={item}
                          className={`rounded-[18px] border px-3 py-3 text-sm font-semibold ${
                            active
                              ? "border-[#7db6ff] bg-[#7db6ff] text-[#08101c]"
                              : "border-[#7db6ff]/15 bg-[#08101c] text-white"
                          }`}
                          onClick={() => setHabitName(item)}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7db6ff]">
                      Note
                    </span>
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      maxLength={MAX_HABIT_NOTE_LENGTH}
                      rows={5}
                      className="mt-2 w-full rounded-[18px] border border-[#7db6ff]/15 bg-[#08101c] px-4 py-3 text-base leading-7 text-white outline-none placeholder:text-[#607d9f]"
                      placeholder="Describe the completion."
                    />
                  </label>

                  {!isConnected ? (
                    <button
                      className="w-full rounded-[20px] bg-[#7db6ff] px-4 py-3 text-base font-semibold text-[#08101c]"
                      onClick={connectWallet}
                    >
                      Connect wallet
                    </button>
                  ) : chainId !== base.id ? (
                    <button
                      className="w-full rounded-[20px] bg-[#ffc56c] px-4 py-3 text-base font-semibold text-[#08101c] disabled:opacity-60"
                      disabled={switching}
                      onClick={() => switchChain({ chainId: base.id })}
                    >
                      {switching ? "Switching..." : "Switch to Base"}
                    </button>
                  ) : (
                    <button
                      className="w-full rounded-[20px] bg-[#7db6ff] px-4 py-3 text-base font-semibold text-[#08101c] disabled:opacity-60"
                      disabled={!canLog || writing || confirming}
                      onClick={logHabit}
                    >
                      {writing || confirming ? "Logging..." : "Log orbit on Base"}
                    </button>
                  )}

                  <p className="text-sm leading-6 text-[#93a9c7]">{statusText}</p>
                </div>
              </section>

              <section className="rounded-[30px] border border-[#4c709d] bg-[#0b1626] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0d1827] text-[#7db6ff]">
                    <Repeat2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-3xl font-black text-white">Lookup orbit</h3>
                    <p className="text-sm text-[#93a9c7]">
                      Pull one habit completion by ID.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <label className="block">
                    <span className="text-[11px] font-black uppercase tracking-[0.22em] text-[#7db6ff]">
                      Orbit ID
                    </span>
                    <input
                      value={habitIdInput}
                      onChange={(event) => setHabitIdInput(event.target.value)}
                      inputMode="numeric"
                      className="mt-2 w-full rounded-[18px] border border-[#7db6ff]/15 bg-[#08101c] px-4 py-3 text-base font-semibold text-white outline-none"
                    />
                  </label>

                  <div className="rounded-[24px] border border-[#7db6ff]/12 bg-[#08101c] p-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                      Current orbit
                    </p>
                    <p className="mt-3 text-lg font-semibold text-white">
                      {habit?.habitName || "Waiting for first orbit"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#93a9c7]">
                      {habit?.note ||
                        "Once a habit exists onchain, this panel shows the habit, streak count, and author."}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-[20px] border border-[#7db6ff]/12 bg-[#08101c] p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                        Streak
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {habit?.streakCount ? habit.streakCount.toString() : "--"}
                      </p>
                    </div>
                    <div className="rounded-[20px] border border-[#7db6ff]/12 bg-[#08101c] p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#7db6ff]">
                        Date
                      </p>
                      <p className="mt-2 text-sm font-semibold text-white">
                        {dateLabel(habit?.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}
