import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network";

// Environment configuration
export const IS_MAINNET = process.env.NEXT_PUBLIC_NETWORK === "mainnet";
export const IS_TESTNET = !IS_MAINNET;

// Network instance
export const NETWORK_INSTANCE = IS_MAINNET ? STACKS_MAINNET : STACKS_TESTNET;

// Contract configuration based on network
export const getContractConfig = () => {
  if (IS_MAINNET) {
    return {
      contractAddress: "SP3R3SX667CWE61113X23CAQ03SZXXZ3D8D3A4NFH",
      contractName: "str",
      networkUrl: "https://api.hiro.so",
      explorerUrl: "https://explorer.hiro.so",
    };
  }

  return {
    contractAddress: "ST3R3SX667CWE61113X23CAQ03SZXXZ3D8C2MR7YY",
    contractName: "stream-manager",
    networkUrl: "https://api.testnet.hiro.so",
    explorerUrl: "https://explorer.hiro.so/?chain=testnet",
  };
};

// Get the appropriate STX address for current network
export const getNetworkAddress = (userSession: any): string | undefined => {
  if (!userSession) return undefined;

  const userData = userSession.loadUserData();
  const addresses = userData?.profile?.stxAddress;

  return IS_MAINNET ? addresses?.mainnet : addresses?.testnet;
};

// Get explorer URL for transaction
export const getTransactionUrl = (txId: string): string => {
  const config = getContractConfig();
  return `${config.explorerUrl}/txid/${txId}`;
};

// Get explorer URL for address
export const getAddressUrl = (address: string): string => {
  const config = getContractConfig();
  return `${config.explorerUrl}/address/${address}`;
};

// Get explorer URL for contract
export const getContractUrl = (): string => {
  const config = getContractConfig();
  return `${config.explorerUrl}/txid/${config.contractAddress}.${config.contractName}`;
};
