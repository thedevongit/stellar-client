import { WalletNetwork } from "@creit.tech/stellar-wallets-kit";
import * as StellarSdk from "@stellar/stellar-sdk";

export const shortenAddress = (address: string) => {
  return `${address.slice(0, 10)}...${address.slice(-10)}`;
}


export const formatDecimal = (value: number) => {
  if (!Number.isInteger(value)) {
    return parseFloat(value.toFixed(2));
  }
  return value;
}

export const utils = {
  chain: {
    // Testnets
    // stellart: {
    //   address: "CCOWQULXM7GAFJT5ONVSCQSAOSCDZZQPBMMXACAQCTUDIRRK4VUFKJ53",
    //   rpc: "https://soroban-testnet.stellar.org",
    //   id: { chainId: 0 },
    //   networkPassphrase: WalletNetwork.TESTNET
    // },
    stellart: {
      address: "CDH3FBNCCBXJXVBME2CF4QZYS27RJFSUVXKRHD5DYVKCKQDCAK6UZBN3",
      rpc: "https://soroban-rpc.creit.tech/",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.PUBLIC
    },
    factory: {
      address: "CAIFM7W2WMSIIDBPIACGG5FNXZ44DEPEYF7TDKIQ4BRNRT5E6VI33NWR",
      rpc: "https://soroban-rpc.creit.tech/",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.PUBLIC
    },
    marketplace: {
      address: "CCPJBIVAAXV2N3XNUO4IKILPPP3NDMFBBT7TABY2DO6ABOKSDRMKZJDM",
      rpc: "https://soroban-rpc.creit.tech/",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.PUBLIC
    },
  }

}


export const getChainDatas = (chain: string): any => {
  switch (chain) {
    // Testnets
    case 'Stellar Testnet':
    case 'stellart':
      return utils.chain.stellart;
    case 'marketplace':
      return utils.chain.marketplace;
    default:
      return utils.chain.stellart;
  }
}
export const stellarCall = async (chain: string, user: string, contractId: string, method: string, ...args: any[]): Promise<any> => {
  let cont = new StellarSdk.Contract(contractId);
  let operation = cont.call(method, ...args);

  let tx = new StellarSdk.TransactionBuilder(
    new StellarSdk.Account(user, "0"),
    {
      fee: "10000000",
      networkPassphrase: getChainDatas(chain).networkPassphrase
    }
  ).addOperation(
    operation
  ).setTimeout(0).build();

  const rpcUrl = getChainDatas(chain).rpc;
  const rpcServer: StellarSdk.rpc.Server = new StellarSdk.rpc.Server(rpcUrl);
  const simulated = await rpcServer.simulateTransaction(tx);
  if (StellarSdk.rpc.Api.isSimulationError(simulated)) {
    throw new Error(simulated.error);
  }

  return simulated;
}

export const stellarLedgerExpiration = async (chain: string): Promise<number> => {
  const rpcUrl = getChainDatas(chain).rpc;
  const rpcServer: StellarSdk.rpc.Server = new StellarSdk.rpc.Server(rpcUrl);
  const latestLedger = await rpcServer.getLatestLedger();
  return latestLedger.sequence;
}

// stellar token decimals get 
export const stellarTokenDecimal = async (chain: string, user: string, token: string): Promise<any> => {
  const result = await stellarCall(chain, user, token, 'decimals');
  let decimal = StellarSdk.scValToBigInt((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  return decimal;
}

export const getUserAdTokens = async (chain: string, user: string, nftContract: string, tokenCount: number): Promise<any> => {
  // loop token count
  let tokens: number[] = [];
  for (let i = 1; i < tokenCount + 1; i++) {
    try {
      const result = await stellarCall(chain, user, nftContract, 'owner_of', StellarSdk.nativeToScVal(i, { type: 'i128' }));
      // check if the result is our user 
      let owner = StellarSdk.scValToNative((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
      if (owner === user) {
        tokens.push(i);
      }
    } catch (error) {
      console.error(`Error checking token ${i}:`, error);
      continue;
    }
  }
  console.log("Final tokens array:", tokens);
  return tokens;
}

export const getTokenDetails = async (chain: string, user: string, nftContract: string, tokenId: number): Promise<{ name: string; symbol: string; token_uri: string; owner?: string }> => {
  const result = await stellarCall(chain, user, nftContract, 'name');
  let name = StellarSdk.scValToNative((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  const result2 = await stellarCall(chain, user, nftContract, 'symbol');
  let symbol = StellarSdk.scValToNative((result2.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  let result3 = await stellarCall(chain, user, nftContract, 'token_uri', StellarSdk.nativeToScVal(tokenId, { type: 'i128' }));
  let token_uri = StellarSdk.scValToNative((result3.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  let result4 = await stellarCall(chain, user, nftContract, 'owner_of', StellarSdk.nativeToScVal(tokenId, { type: 'i128' }));
  let owner = StellarSdk.scValToNative((result4.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  return { name, symbol, token_uri, owner };
}

export const getNftAdmin = async (chain: string, user: string, nftContract: string): Promise<string> => {
  const result = await stellarCall(chain, user, nftContract, 'get_owner');
  let admin = StellarSdk.scValToNative((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
  return admin;
}

export const getTokenName = async (chain: string, user: string, tokenContract: string): Promise<string> => {
  try {
    const result = await stellarCall(chain, user, tokenContract, 'name');
    let name = StellarSdk.scValToNative((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
    return name;
  } catch (error) {
    console.error('Error getting token name:', error);
    return 'Unknown Token';
  }
}

export const getTokenSymbol = async (chain: string, user: string, tokenContract: string): Promise<string> => {
  try {
    const result = await stellarCall(chain, user, tokenContract, 'symbol');
    let symbol = StellarSdk.scValToNative((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
    return symbol;
  } catch (error) {
    console.error('Error getting token symbol:', error);
    return 'UNK';
  }
}

export const formatTokenAmount = (amount: bigint, decimals: number, symbol: string): string => {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionalPart = amount % divisor;
  
  if (fractionalPart === 0n) {
    return `${wholePart.toString()} ${symbol}`;
  }
  
  const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
  const trimmedFractional = fractionalStr.replace(/0+$/, '');
  
  if (trimmedFractional === '') {
    return `${wholePart.toString()} ${symbol}`;
  }
  
  return `${wholePart.toString()}.${trimmedFractional} ${symbol}`;
}