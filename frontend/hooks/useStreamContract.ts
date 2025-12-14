"use client";

import {
  uintCV,
  principalCV,
  AnchorMode,
  PostConditionMode,
  Pc,
} from "@stacks/transactions";
import {
  CONTRACT_ADDRESS,
  CONTRACT_NAME,
  NETWORK,
  stxToMicroStx,
  parseDurationToSeconds,
} from "@/lib/stacks";
import { useAuth } from "@/contexts/AuthContext";
import { parseContractError, formatErrorMessage } from "@/lib/errors";
import { useToast } from "@/components/ui/toast";

// Determine if we're on mainnet
const IS_MAINNET = NETWORK === "mainnet";

export function useStreamContract() {
  const { userAddress } = useAuth();
  const { toast } = useToast();

  const createStream = async (
    recipient: string,
    amount: number,
    days: number,
    hours: number,
    minutes: number
  ) => {
    const tokenAmount = stxToMicroStx(amount);
    const duration = parseDurationToSeconds(days, hours, minutes);

    const { openContractCall } = await import("@stacks/connect");

    // Create post conditions for escrow pattern:
    // 1. User sends exact amount
    // 2. Contract doesn't send anything (only receives)
    const postConditions = userAddress
      ? [
          Pc.principal(userAddress).willSendEq(tokenAmount).ustx(),
          Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
            .willSendEq(BigInt(0))
            .ustx(),
        ]
      : [];

    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "create-stream",
      functionArgs: [
        principalCV(recipient),
        uintCV(tokenAmount),
        uintCV(duration),
      ],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      onFinish: (data) => {
        console.log("Stream created:", data);
        toast({
          title: "Stream successfully created",
          description: "Your transaction was submitted to the network.",
          variant: "success",
        });
        // Success callback
      },
      onCancel: () => {
        console.log("Transaction cancelled");
        toast({ title: "Transaction cancelled", variant: "info" });
        // User cancelled
      },
    });
  };

  const withdrawFromStream = async (streamId: number) => {
    const { openContractCall } = await import("@stacks/connect");

    // Create post condition: contract must transfer STX to user (recipient)
    const postConditions = userAddress
      ? [
          Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
            .willSendGte(BigInt(1))
            .ustx(),
        ]
      : [];

    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "withdraw-from-stream",
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      onFinish: (data) => {
        console.log("Withdrawal successful:", data);
        toast({
          title: "Withdrawal initiated",
          description: "Transaction submitted to the network",
          variant: "success",
        });
      },
      onCancel: () => {
        console.log("Transaction cancelled");
        toast({ title: "Transaction cancelled", variant: "info" });
      },
    });
  };

  const cancelStream = async (streamId: number) => {
    const { openContractCall } = await import("@stacks/connect");

    // Post condition: contract must transfer STX (refund + vested)
    const postConditions = [
      Pc.principal(`${CONTRACT_ADDRESS}.${CONTRACT_NAME}`)
        .willSendGte(BigInt(0))
        .ustx(),
    ];

    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "cancel-stream",
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
      onFinish: (data) => {
        console.log("Stream cancelled:", data);
        toast({
          title: "Stream cancellation initiated",
          description: "Transaction submitted to the network",
          variant: "success",
        });
      },
      onCancel: () => {
        console.log("Transaction cancelled");
        toast({ title: "Transaction cancelled", variant: "info" });
      },
    });
  };

  const pauseStream = async (streamId: number) => {
    const { openContractCall } = await import("@stacks/connect");
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "pause-stream",
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log("Stream paused:", data);
        toast({
          title: "Stream pause initiated",
          description: "Transaction submitted to the network",
          variant: "success",
        });
      },
      onCancel: () => {
        console.log("Transaction cancelled");
        toast({ title: "Transaction cancelled", variant: "info" });
      },
    });
  };

  const resumeStream = async (streamId: number) => {
    const { openContractCall } = await import("@stacks/connect");
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: "resume-stream",
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log("Stream resumed:", data);
        toast({
          title: "Stream resume initiated",
          description: "Transaction submitted to the network",
          variant: "success",
        });
      },
      onCancel: () => {
        console.log("Transaction cancelled");
        toast({ title: "Transaction cancelled", variant: "info" });
      },
    });
  };

  return {
    createStream,
    withdrawFromStream,
    cancelStream,
    pauseStream,
    resumeStream,
  };
}
