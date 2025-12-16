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
