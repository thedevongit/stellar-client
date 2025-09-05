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
    stellart: {
      address: "CCOWQULXM7GAFJT5ONVSCQSAOSCDZZQPBMMXACAQCTUDIRRK4VUFKJ53",
      rpc: "https://soroban-testnet.stellar.org",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.TESTNET
    },
    factory: {
      address: "CA5VFI7OQHQTXHVFTXRMGF3VD3MKDYI7QMZR2XXN6GLVMDZGSVD7JXYU",
      rpc: "https://soroban-testnet.stellar.org",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.TESTNET
    },
    marketplace: {
      address: "CAHANKZQY2WQI5YON72ZNRO7CTBHYTA7I2H2TYUGXIEK4TKHLSHN335G",
      rpc: "https://soroban-testnet.stellar.org",
      id: { chainId: 0 },
      networkPassphrase: WalletNetwork.TESTNET
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

// stellar allowance 
export const stellarTokenDecimal = async (chain: string, user: string, token: string): Promise<any> => {
  let stellarSC = getChainDatas(chain).address
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