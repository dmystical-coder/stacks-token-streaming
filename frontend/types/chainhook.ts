export interface ChainhookEventObserver {
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

export interface ChainhookPayload {
  apply: ChainhookApply[];
  rollback: ChainhookRollback[];
  chainhook: ChainhookMetadata;
}

export interface ChainhookMetadata {
  uuid: string;
  name: string;
}

export interface ChainhookApply {
  block_identifier: BlockIdentifier;
  timestamp: number;
  transactions: TransactionEvent[];
}

export interface ChainhookRollback {
  block_identifier: BlockIdentifier;
}

export interface BlockIdentifier {
  index: number;
  hash: string;
}

export interface TransactionEvent {
  transaction_identifier: {
    hash: string;
  };
  operations: Operation[];
  metadata: {
    sender: string;
    kind: {
      type: string;
      data: any;
    };
    receipt: {
      status: string;
      events: StacksTransactionEvent[];
    };
  };
}

export interface Operation {
  type: string;
  account: {
    address: string;
  };
  amount: {
    value: string;
    currency: {
      symbol: string;
      decimals: number;
    };
  };
}

export interface StacksTransactionEvent {
  type: string;
  transaction_identifier: string;
  contract_identifier?: string;
  data?: {
    value: any;
    type: string; // e.g. "tuple"
  };
}

export interface StreamCreatedEvent {
  event: 'stream-created';
  'stream-id': number;
  sender: string;
  recipient: string;
  amount: number;
  duration: number;
  'token-type': string;
  timestamp: number;
}
