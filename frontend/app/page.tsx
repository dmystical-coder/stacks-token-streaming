"use client";

import { useState } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CreateStreamModal } from "@/components/CreateStreamModal";
import { StreamCard } from "@/components/StreamCard";
import { WalletView } from "@/components/WalletView";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { StreamFilter } from "@/types/stream";
import { Plus, RefreshCw, Waves, Wallet } from "lucide-react";
import { useStreamsFromChain } from "@/hooks/useStreamsFromChain";
import { IS_TESTNET } from "@/lib/network";

const FILTERS: { value: StreamFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function Home() {
  const { isSignedIn, userAddress } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<StreamFilter>("all");

  const { streams, loading, refresh } = useStreamsFromChain(userAddress);

  const filteredStreams = streams.filter((stream) => {
    if (filter === "all") return true;
    const now = Date.now() / 1000;
    const adjustedEndTime = stream.endTime + stream.totalPausedDuration;
    if (filter === "cancelled") return stream.isCancelled;
    if (filter === "paused") return stream.isPaused && !stream.isCancelled;
    if (filter === "completed")
      return now >= adjustedEndTime && !stream.isCancelled;
    if (filter === "active")
      return (
        now >= stream.startTime &&
        now < adjustedEndTime &&
        !stream.isPaused &&
        !stream.isCancelled
      );
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <Waves className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground tracking-tight">
              StreamSTX
            </span>
            {IS_TESTNET && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30"
                style={{ letterSpacing: "0.06em", textTransform: "uppercase" }}
              >
                Testnet
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-14 h-14 rounded-2xl bg-blue-700 flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
              <Waves className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-slate-900 mb-2 text-center text-balance">
              Token streaming on Stacks
            </h2>
            <p className="text-slate-500 mb-8 text-center max-w-sm text-balance leading-relaxed">
              Send STX continuously over time — for vesting, payroll,
              subscriptions, and more.
            </p>
            <ConnectWallet />
          </div>
        ) : (
          <Tabs defaultValue="streams" className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-auto gap-0.5">
                <TabsTrigger
                  value="streams"
                  className="rounded-md px-3 py-1.5 text-sm font-medium gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700"
                >
                  <Waves className="w-3.5 h-3.5" />
                  Streams
                </TabsTrigger>
                <TabsTrigger
                  value="wallet"
                  className="rounded-md px-3 py-1.5 text-sm font-medium gap-1.5 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-700"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  Wallet
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="streams" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex gap-0.5 p-1 bg-white border border-slate-200 rounded-lg">
                  {FILTERS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setFilter(value)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filter === value
                          ? "bg-slate-900 text-white"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={refresh}
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    className="gap-1.5 h-8 text-xs border-slate-200 text-slate-600"
                  >
                    <RefreshCw
                      className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
                    />
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    size="sm"
                    className="gap-1.5 h-8 text-xs bg-blue-700 hover:bg-blue-800 text-white"
                  >
                    <Plus className="w-3 h-3" />
                    New Stream
                  </Button>
                </div>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-700 rounded-full animate-spin" />
                  <span className="text-sm text-slate-400">
                    Loading streams…
                  </span>
                </div>
              ) : filteredStreams.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
                    <Waves className="w-5 h-5 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">
                    {filter === "all" ? "No streams yet" : `No ${filter} streams`}
                  </p>
                  <p className="text-sm text-slate-400 mb-6">
                    {filter === "all"
                      ? "Create your first token stream to get started."
                      : "Switch to All to see all streams."}
                  </p>
                  {filter === "all" && (
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      size="sm"
                      className="gap-1.5 bg-blue-700 hover:bg-blue-800 text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Create Stream
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredStreams.map((stream) => (
                    <StreamCard
                      key={stream.id}
                      streamId={stream.id!}
                      stream={stream}
                      onUpdate={refresh}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="wallet">
              <WalletView />
            </TabsContent>
          </Tabs>
        )}
      </main>

      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={refresh}
      />
    </div>
  );
}
