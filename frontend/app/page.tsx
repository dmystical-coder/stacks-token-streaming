"use client";

import { useState, useEffect, useMemo } from "react";
import { ConnectWallet } from "@/components/ConnectWallet";
import { CreateStreamModal } from "@/components/CreateStreamModal";
import { StreamCard } from "@/components/StreamCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Stream, StreamFilter } from "@/types/stream";
import {
  Plus,
  RefreshCw,
  Waves,
  LayoutDashboard,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import {
  fetchCallReadOnlyFunction,
  cvToJSON,
  uintCV,
} from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  NETWORK,
  microStxToStx,
} from "@/lib/stacks";
import { useStreamEvents } from "@/hooks/useStreamEvents";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WalletView } from "@/components/WalletView";

export default function Home() {
  const { isSignedIn, userAddress } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [streams, setStreams] = useState<Array<{ id: number; data: Stream }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<StreamFilter>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (isSignedIn && userAddress) {
      loadStreams();
    }
  }, [isSignedIn, userAddress]);

  useStreamEvents(userAddress, () => {
    loadStreams(false);
  });

  const loadStreams = async (showLoadingSpinner = true) => {
    if (!userAddress) return;

    if (showLoadingSpinner) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const totalResult = await fetchCallReadOnlyFunction({
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: "get-total-streams",
        functionArgs: [],
        network: NETWORK,
        senderAddress: userAddress,
      });

      const totalJson = cvToJSON(totalResult);
      let totalValue = totalJson.value;
      if (totalJson.type?.startsWith("(response") && totalJson.value) {
        totalValue = totalJson.value;
      }
      if (
        totalValue &&
        typeof totalValue === "object" &&
        "value" in totalValue
      ) {
        totalValue = totalValue.value;
      }

      const total = Number(totalValue);

      if (isNaN(total)) {
        console.error("Failed to parse total streams count", totalJson);
        return;
      }

      const loadedStreams: Array<{ id: number; data: Stream }> = [];

      // Optimize: Use Promise.all with chunks if total is large, but sequential is safer for public nodes for now
      // Or just fetch all sequentially as before.

      // We will fetch in batches of 5 to speed it up slightly without rate limiting
      const batchSize = 5;
      for (let i = 1; i <= total; i += batchSize) {
        const batch = [];
        for (let j = i; j < i + batchSize && j <= total; j++) {
          batch.push(
            fetchCallReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: "get-stream",
              functionArgs: [uintCV(j)],
              network: NETWORK,
              senderAddress: userAddress,
            }).then((res) => ({ id: j, res }))
          );
        }

        const results = await Promise.all(batch);

        for (const { id, res } of results) {
          const streamData = cvToJSON(res);
          if (!streamData || !streamData.value) continue;

          let innerValue = streamData.value;
          if (
            streamData.type === "(response (optional (tuple ...)))" ||
            streamData.type?.startsWith("(response")
          ) {
            innerValue = streamData.value.value;
          }

          if (
            (innerValue && innerValue.type === "(optional (tuple ...))") ||
            innerValue?.type?.startsWith("(optional")
          ) {
            innerValue = innerValue.value;
          }

          if (innerValue && innerValue.value) {
            const stream = innerValue.value;
            if (
              stream.sender?.value === userAddress ||
              stream.recipient?.value === userAddress
            ) {
              try {
                loadedStreams.push({
                  id,
                  data: {
                    sender: stream.sender.value,
                    recipient: stream.recipient.value,
                    tokenAmount: Number(stream["token-amount"].value),
                    startTime: Number(stream["start-time"].value),
                    endTime: Number(stream["end-time"].value),
                    withdrawnAmount: Number(stream["withdrawn-amount"].value),
                    isCancelled: stream["is-cancelled"].value,
                    isPaused: stream["is-paused"].value,
                    pausedAt: Number(stream["paused-at"].value),
                    totalPausedDuration: Number(
                      stream["total-paused-duration"].value
                    ),
                    createdAtBlock: Number(stream["created-at-block"].value),
                    tokenType: "STX",
                    tokenContract: null,
                  },
                });
              } catch (e) {
                console.error("Error parsing stream", id, e);
              }
            }
          }
        }
      }

      setStreams(loadedStreams.sort((a, b) => b.id - a.id)); // Sort by newest first
    } catch (error) {
      console.error("Error loading streams:", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const filteredStreams = useMemo(() => {
    return streams.filter((stream) => {
      if (filter === "all") return true;

      const now = Date.now() / 1000;
      const adjustedEndTime =
        stream.data.endTime + stream.data.totalPausedDuration;

      if (filter === "cancelled") return stream.data.isCancelled;
      if (filter === "paused")
        return stream.data.isPaused && !stream.data.isCancelled;
      if (filter === "completed")
        return now >= adjustedEndTime && !stream.data.isCancelled;
      if (filter === "active")
        return (
          now >= stream.data.startTime &&
          now < adjustedEndTime &&
          !stream.data.isPaused &&
          !stream.data.isCancelled
        );

      return true;
    });
  }, [streams, filter]);

  const stats = useMemo(() => {
    const totalVolume = streams.reduce((acc, s) => acc + s.data.tokenAmount, 0);
    const activeStreams = streams.filter((s) => {
      const now = Date.now() / 1000;
      const adjustedEndTime = s.data.endTime + s.data.totalPausedDuration;
      return (
        now >= s.data.startTime &&
        now < adjustedEndTime &&
        !s.data.isPaused &&
        !s.data.isCancelled
      );
    }).length;

    return {
      totalStreams: streams.length,
      activeStreams,
      totalVolume: microStxToStx(totalVolume),
    };
  }, [streams]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block">
              <h1 className="text-lg font-bold leading-none">
                Token Streaming
              </h1>
              <p className="text-xs text-zinc-500 font-medium">
                Stacks Protocol
              </p>
            </div>
          </div>
          <ConnectWallet />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {!isSignedIn ? (
          <div className="flex flex-col items-center justify-center py-32 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-8">
              <Waves className="w-16 h-16 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-4xl font-extrabold mb-4 tracking-tight text-center">
              Stream Tokens over Time
            </h2>
            <p className="text-zinc-500 dark:text-zinc-400 mb-8 text-center max-w-lg text-lg">
              Securely stream STX and SIP-010 tokens with built-in vesting
              schedules, pause/resume capabilities, and completely trustless
              smart contracts.
            </p>
            <div className="transform scale-110">
              <ConnectWallet />
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <Tabs defaultValue="dashboard" className="w-full">
              <div className="flex items-center justify-between mb-8">
                <TabsList className="bg-zinc-100 dark:bg-zinc-800 p-1">
                  <TabsTrigger value="dashboard" className="px-4">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </TabsTrigger>
                  <TabsTrigger value="wallet" className="px-4">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet
                  </TabsTrigger>
                </TabsList>

                <Button
                  onClick={() => setShowCreateModal(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Stream
                </Button>
              </div>

              <TabsContent value="dashboard" className="space-y-8 mt-0">
                {/* Dashboard Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Volume
                      </CardTitle>
                      <Wallet className="h-4 w-4 text-zinc-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalVolume} STX
                      </div>
                      <p className="text-xs text-zinc-500">
                        Lifetime volume streamed
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Streams
                      </CardTitle>
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.activeStreams}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Currently flowing streams
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Streams
                      </CardTitle>
                      <LayoutDashboard className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {stats.totalStreams}
                      </div>
                      <p className="text-xs text-zinc-500">
                        Created or received
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <Tabs
                    value={filter}
                    onValueChange={(v: string) => setFilter(v as StreamFilter)}
                    className="w-full md:w-auto"
                  >
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="paused">Paused</TabsTrigger>
                      <TabsTrigger value="completed">Completed</TabsTrigger>
                      <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                      onClick={() => loadStreams(false)}
                      variant="outline"
                      size="sm"
                      disabled={loading || isRefreshing}
                      className="ml-auto md:ml-0"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                      Refresh
                    </Button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <RefreshCw className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                    <p className="text-zinc-500">Loading your streams...</p>
                  </div>
                ) : filteredStreams.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="bg-zinc-100 dark:bg-zinc-800 p-4 rounded-full mb-4">
                        <ArrowDownLeft className="w-8 h-8 text-zinc-400" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        No {filter !== "all" ? filter : ""} streams found
                      </h3>
                      <p className="text-zinc-500 mb-6 max-w-sm">
                        {filter === "all"
                          ? "You haven't created or received any streams yet. Start by creating a new stream."
                          : `You don't have any ${filter} streams at the moment.`}
                      </p>
                      {filter === "all" && (
                        <Button onClick={() => setShowCreateModal(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create First Stream
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredStreams.map((stream) => (
                      <StreamCard
                        key={stream.id}
                        streamId={stream.id}
                        stream={stream.data}
                        onUpdate={() => loadStreams(false)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="wallet" className="mt-0">
                <WalletView />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>

      <CreateStreamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => loadStreams()}
      />
    </div>
  );
}
