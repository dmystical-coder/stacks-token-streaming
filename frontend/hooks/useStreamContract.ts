'use client';

import { uintCV, principalCV, AnchorMode, PostConditionMode } from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK, stxToMicroStx, parseDurationToSeconds } from '@/lib/stacks';
import { useAuth } from '@/contexts/AuthContext';

export function useStreamContract() {
  // const { userSession } = useAuth();

  const createStream = async (
    recipient: string,
    amount: number,
    days: number,
    hours: number,
    minutes: number
  ) => {
    const tokenAmount = stxToMicroStx(amount);
    const duration = parseDurationToSeconds(days, hours, minutes);

    const { openContractCall } = await import('@stacks/connect');
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'create-stream',
      functionArgs: [
        principalCV(recipient),
        uintCV(tokenAmount),
        uintCV(duration),
      ],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('Stream created:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      },
    });
  };

  const withdrawFromStream = async (streamId: number) => {
    const { openContractCall } = await import('@stacks/connect');
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'withdraw-from-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Withdrawal successful:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      },
    });
  };

  const cancelStream = async (streamId: number) => {
    const { openContractCall } = await import('@stacks/connect');
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'cancel-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Stream cancelled:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      },
    });
  };

  const pauseStream = async (streamId: number) => {
    const { openContractCall } = await import('@stacks/connect');
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'pause-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Stream paused:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
      },
    });
  };

  const resumeStream = async (streamId: number) => {
    const { openContractCall } = await import('@stacks/connect');
    await openContractCall({
      network: NETWORK,
      anchorMode: AnchorMode.Any,
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName: 'resume-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
      onFinish: (data) => {
        console.log('Stream resumed:', data);
      },
      onCancel: () => {
        console.log('Transaction cancelled');
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
