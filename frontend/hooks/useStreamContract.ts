'use client';

import {
  uintCV,
  principalCV,
  AnchorMode,
  PostConditionMode,
  Pc,
  type PostCondition,
  type ClarityValue,
} from '@stacks/transactions';
import { CONTRACT_ADDRESS, CONTRACT_NAME, NETWORK, stxToMicroStx, parseDurationToSeconds } from '@/lib/stacks';
import { getTransactionUrl } from '@/lib/network';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/toast';
import { useChainEvents } from '@/contexts/ChainEvents';

interface ContractCall {
  functionName: string;
  functionArgs: ClarityValue[];
  postConditionMode: PostConditionMode;
  postConditions?: PostCondition[];
  /** Human label used in feedback, e.g. "Stream created". */
  label: string;
}

export function useStreamContract() {
  const { userAddress } = useAuth();
  const { toast } = useToast();
  const { watchTx } = useChainEvents();

  // Single path for every contract call so submitted / cancelled / failed
  // feedback is consistent. The wallet returns once the tx is broadcast, not
  // mined, so success here means "submitted, pending confirmation".
  const runContractCall = async ({
    functionName,
    functionArgs,
    postConditionMode,
    postConditions,
    label,
  }: ContractCall) => {
    try {
      const { openContractCall } = await import('@stacks/connect');
      await openContractCall({
        network: NETWORK,
        anchorMode: AnchorMode.Any,
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs,
        postConditionMode,
        postConditions,
        onFinish: (data) => {
          toast({
            variant: 'success',
            title: `${label} — submitted`,
            description: 'Pending on-chain confirmation.',
            action: data?.txId
              ? { label: 'View on explorer', href: getTransactionUrl(data.txId) }
              : undefined,
            duration: 10000,
          });
          // Track this tx so the socket can fire a "confirmed" toast and
          // revalidate the UI the moment it's mined.
          if (data?.txId) watchTx(data.txId, label);
        },
        onCancel: () => {
          toast({ title: 'Transaction cancelled', variant: 'default' });
        },
      });
    } catch (err) {
      toast({
        variant: 'error',
        title: `${label} failed`,
        description: err instanceof Error ? err.message : 'Could not submit transaction.',
      });
      throw err;
    }
  };

  const createStream = async (
    recipient: string,
    amount: number,
    days: number,
    hours: number,
    minutes: number
  ) => {
    const tokenAmount = stxToMicroStx(amount);
    const duration = parseDurationToSeconds(days, hours, minutes);

    const postConditions: PostCondition[] = [];
    if (userAddress) {
      postConditions.push(Pc.principal(userAddress).willSendEq(tokenAmount).ustx());
    }

    await runContractCall({
      label: 'Stream created',
      functionName: 'create-stream',
      functionArgs: [principalCV(recipient), uintCV(tokenAmount), uintCV(duration)],
      postConditionMode: PostConditionMode.Deny,
      postConditions,
    });
  };

  const withdrawFromStream = (streamId: number) =>
    runContractCall({
      label: 'Withdrawal',
      functionName: 'withdraw-from-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
    });

  const cancelStream = (streamId: number) =>
    runContractCall({
      label: 'Stream cancelled',
      functionName: 'cancel-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
    });

  const pauseStream = (streamId: number) =>
    runContractCall({
      label: 'Stream paused',
      functionName: 'pause-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
    });

  const resumeStream = (streamId: number) =>
    runContractCall({
      label: 'Stream resumed',
      functionName: 'resume-stream',
      functionArgs: [uintCV(streamId)],
      postConditionMode: PostConditionMode.Allow,
    });

  return {
    createStream,
    withdrawFromStream,
    cancelStream,
    pauseStream,
    resumeStream,
  };
}
