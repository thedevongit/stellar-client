import { getChainDatas } from "../utils";
import { Network, parseError } from "@blend-capital/blend-sdk";
import {
  AlbedoModule,
  FreighterModule,
  HanaModule,
  HotWalletModule,
  ISupportedWallet,
  LobstrModule,
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  xBullModule,
  RabetModule,
} from "@creit.tech/stellar-wallets-kit";
import { LedgerModule } from "@creit.tech/stellar-wallets-kit/modules/ledger.module";
import {
  WalletConnectAllowedMethods,
  WalletConnectModule,
} from "@creit.tech/stellar-wallets-kit/modules/walletconnect.module";
import { getNetworkDetails as getFreighterNetwork } from "@stellar/freighter-api";
import {
  Asset,
  BASE_FEE,
  Networks,
  Operation,
  rpc,
  Transaction,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import React, { useCallback, useContext, useEffect, useState } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useKit } from "../hooks/common/useKit";


export const useLocalStorageState = (
  key: string,
  defaultState: string | undefined
): [string | undefined, (newState: string | undefined) => void] => {
  // Initialize state directly from localStorage or use defaultState
  const [state, setState] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return defaultState;

    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultState;
    } catch (e) {
      console.warn(`Error reading ${key} from localStorage:`, e);
      return defaultState;
    }
  });

  const setLocalStorageState = useCallback(
    (newState: string | undefined) => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === undefined) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
};

export interface IWalletContext {
  connected: boolean;
  walletAddress: string;
  txStatus: TxStatus;
  lastTxHash: string | undefined;
  lastTxFailure: string | undefined;
  txType: TxType;
  walletId: string | undefined;

  isLoading: boolean;
  connect: (handleSuccess: (success: boolean) => void) => Promise<void>;
  disconnect: () => void;
  clearLastTx: () => void;
  restore: (sim: rpc.Api.SimulateTransactionRestoreResponse) => Promise<void>;
  faucet(): Promise<undefined>;
  createTrustlines(asset: Asset[]): Promise<void>;
  getNetworkDetails(): Promise<Network & { horizonUrl: string }>;
  stellarApprove(
    tokenAddress: string,
    sim: boolean,
    ...approveArgs: any[]
  ): Promise<rpc.Api.SimulateTransactionResponse | undefined>;
  createAssembledTransaction(
    assembled_tx: any
  ): Promise<rpc.Api.SimulateTransactionResponse | any>;
}

export enum TxStatus {
  NONE,
  BUILDING,
  SIGNING,
  SUBMITTING,
  SUCCESS,
  FAIL,
}

export enum TxType {
  // Submit a contract invocation
  CONTRACT,
  // A transaction that is a pre-requisite for another transaction
  PREREQ,
}

export const createWalletKit = (
  version: string,
  walletKit: StellarWalletsKit | null
): StellarWalletsKit | null => {
  if (walletKit != null) return walletKit;
  return new StellarWalletsKit({
    network:
      version == "testnet"
        ? WalletNetwork.TESTNET
        : (WalletNetwork.PUBLIC as WalletNetwork),
    selectedWalletId: XBULL_ID,
    modules: [
      new xBullModule(),
      new RabetModule(),
      new FreighterModule(),
      new LobstrModule(),
      new AlbedoModule(),
      new HanaModule(),
      new LedgerModule(),
      new WalletConnectModule({
        url: "https://siborg.io",
        projectId: "a0fd1483122937b5cabbe0d85fa9c34e",
        method: WalletConnectAllowedMethods.SIGN,
        description: `Siborg is a decentralized ads platform`,
        name: "Siborg",
        icons: [
          "https://docs.blend.capital/~gitbook/image?url=https%3A%2F%2F3627113658-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FlsteMPgIzWJ2y9ruiTJy%252Fuploads%252FVsvCoCALpHWAw8LpU12e%252FBlend%2520Logo%25403x.png%3Falt%3Dmedia%26token%3De8c06118-43b7-4ddd-9580-6c0fc47ce971&width=768&dpr=2&quality=100&sign=f4bb7bc2&sv=1",
        ],
        network: WalletNetwork.TESTNET as WalletNetwork,
      }),
      new HotWalletModule(),
    ],
  });
};
const WalletContext = React.createContext<IWalletContext | undefined>(
  undefined
);

export const StellarWalletProvider = ({
  children = null as any,
  version,
  chain,
}: {
  children?: React.ReactNode;
  version: string;
  chain: string;
}) => {

  const stellarRpc = new rpc.Server(getChainDatas(chain).rpc);
  const [connected, setConnected] = useState<boolean>(false);
  const [autoConnect, setAutoConnect] = useLocalStorageState(
    "autoConnectWallet",
    "false"
  );
  const {walletKit} = useKit(version,autoConnect as string);
  const [loading, setLoading] = useState<boolean>(false);
  const [txStatus, setTxStatus] = useState<TxStatus>(TxStatus.NONE);
  const [txHash, setTxHash] = useState<string | undefined>(undefined);
  const [txFailure, setTxFailure] = useState<string | undefined>(undefined);
  const [txType, setTxType] = useState<TxType>(TxType.CONTRACT);
  // wallet state
  const [walletAddress, setWalletAddress] = useState<string>("");
  useEffect(() => {
    if (
      !connected &&
      autoConnect !== undefined &&
      autoConnect !== "false" &&
      autoConnect !== "wallet_connect" &&
      walletKit !== null
    ) {
      // @dev: timeout ensures chrome has the ability to load extensions
      setTimeout(() => {
        if (walletKit) {
          walletKit.setWallet(autoConnect);
          handleSetWalletAddress();
        } else {
          console.error("Wallet kit is not initialized in setTimeout");
        }
      }, 750);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnect, walletKit]);



  function setFailureMessage(message: string | undefined) {
    if (message) {
      // some contract failures include diagnostic information. If so, try and remove it.
      let substrings = message.split("Event log (newest first):");
      if (substrings.length > 1) {
        setTxFailure(`Contract Error: ${substrings[0].trimEnd()}`);
      } else {
        setTxFailure(`Stellar Error: ${message}`);
      }
    }
  }

  /**
   * Connect a wallet to the application via the walletKit
   */
  async function handleSetWalletAddress(): Promise<boolean> {
    try {
      if (!walletKit) {
        console.error("Wallet kit is not initialized");
        return false;
      }
      const { address: publicKey } = await walletKit.getAddress();
      if (publicKey === "" || publicKey == undefined) {
        console.error("Unable to load wallet key: ", publicKey);
        return false;
      }
      setWalletAddress(publicKey);
      setConnected(true);
      return true;
    } catch (e: any) {
      console.error("Unable to load wallet information: ", e);
      return false;
    }
  }

  /**
   * Open up a modal to connect the user's browser wallet
   */
  async function connect(handleSuccess: (success: boolean) => void) {
    try {
      if (!walletKit) {
        console.error("Wallet kit is not initialized");
        handleSuccess(false);
        return;
      }
      setLoading(true);
      await walletKit.openModal({
        onWalletSelected: async (option: ISupportedWallet) => {
          walletKit.setWallet(option.id);
          let result = await handleSetWalletAddress();
          setAutoConnect(option.id);
          handleSuccess(result);
        },
      });
      setLoading(false);
    } catch (e: any) {
      setLoading(false);
      handleSuccess(false);
      console.error("Unable to connect wallet: ", e);
    }
  }

  function disconnect() {
    setWalletAddress("");
    setConnected(false);
    setAutoConnect("false");
    // cleanWalletCache();
  }

  /**
   * Sign an XDR string with the connected user's wallet
   * @param xdr - The XDR to sign
   * @param networkPassphrase - The network passphrase
   * @returns - The signed XDR as a base64 string
   */
  async function sign(xdr: string): Promise<string> {
    console.log("XDR to sign",xdr);
    
    if (connected) {
      if (!walletKit) {
        throw new Error("Wallet kit is not initialized");
      }
      setTxStatus(TxStatus.SIGNING);
      try {
        console.log("Wallet address to sign",walletAddress);
        console.log("Network passphrase",getChainDatas(chain).networkPassphrase);
        let { signedTxXdr } = await walletKit.signTransaction(xdr, {
          address: walletAddress,
          networkPassphrase: getChainDatas(chain)
            .networkPassphrase as WalletNetwork,
        });
        setTxStatus(TxStatus.SUBMITTING);
        return signedTxXdr;
      } catch (e: any) {
        if (e === "User declined access") {
          setTxFailure("Transaction rejected by wallet.");
        } else if (typeof e === "string") {
          setTxFailure(e);
        }

        setTxStatus(TxStatus.FAIL);
        throw e;
      }
    } else {
      throw new Error("Not connected to a wallet");
    }
  }

  async function restore(
    sim: rpc.Api.SimulateTransactionRestoreResponse
  ): Promise<void> {
    let account = await stellarRpc.getAccount(walletAddress);
    setTxStatus(TxStatus.BUILDING);
    let fee = parseInt(sim.restorePreamble.minResourceFee) + parseInt(BASE_FEE);
    let restore_tx = new TransactionBuilder(account, { fee: fee.toString() })
      .setNetworkPassphrase(getChainDatas(chain).networkPassphrase)
      .setTimeout(0)
      .setSorobanData(sim.restorePreamble.transactionData.build())
      .addOperation(Operation.restoreFootprint({}))
      .build();
    let signed_restore_tx = new Transaction(
      await sign(restore_tx.toXDR()),
      getChainDatas(chain).networkPassphrase
    );
    setTxType(TxType.PREREQ);
    await sendTransaction(signed_restore_tx);
  }

  async function sendTransaction(transaction: Transaction): Promise<boolean> {
    let send_tx_response = await stellarRpc.sendTransaction(transaction);
    let curr_time = Date.now();

    // Attempt to send the transaction and poll for the result
    while (
      send_tx_response.status !== "PENDING" &&
      Date.now() - curr_time < 5000
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      send_tx_response = await stellarRpc.sendTransaction(transaction);
    }
    if (send_tx_response.status !== "PENDING") {
      let error = parseError(send_tx_response as any);
      console.error(
        "Failed to send transaction: ",
        send_tx_response.hash,
        error
      );
      // setFailureMessage(ContractErrorType[error.type]);
      setTxStatus(TxStatus.FAIL);
      return false;
    }

    curr_time = Date.now();
    let get_tx_response = await stellarRpc.getTransaction(
      send_tx_response.hash
    );
    while (
      get_tx_response.status === "NOT_FOUND" &&
      Date.now() - curr_time < 30000
    ) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      get_tx_response = await stellarRpc.getTransaction(send_tx_response.hash);
    }

    if (get_tx_response.status === "NOT_FOUND") {
      console.error(
        "Unable to validate transaction success: ",
        get_tx_response.txHash
      );
      setFailureMessage(
        "The transaction could have been accepted by the network, but we were unable to verify."
      );
      setTxStatus(TxStatus.FAIL);
      return false;
    }

    let hash = transaction.hash().toString("hex");
    setTxHash(hash);
    if (get_tx_response.status === "SUCCESS") {
      console.log("Successfully submitted transaction: ", hash);
      console.log("Transaction result: ", get_tx_response);
      let result = StellarSdk.scValToNative(get_tx_response.returnValue as any);
      // stall for a bit to ensure data propagates to horizon
      await new Promise((resolve) => setTimeout(resolve, 500));
      setTxStatus(TxStatus.SUCCESS);
      return result;
    } else {
      console.log("Transaction failed: ", get_tx_response);
      let error = parseError(get_tx_response as any);
      console.error(`Transaction failed: `, hash, error);
      // setFailureMessage(ContractErrorType[error.type]);
      setTxStatus(TxStatus.FAIL);
      return false;
    }
  }

  async function simulateOperation(
    operation: xdr.Operation
  ): Promise<rpc.Api.SimulateTransactionResponse> {
    try {
      setLoading(true);
      const account = await stellarRpc.getAccount(walletAddress);
      const tx_builder = new TransactionBuilder(account, {
        networkPassphrase: getChainDatas(chain).networkPassphrase,
        fee: BASE_FEE,
        timebounds: {
          minTime: 0,
          maxTime: Math.floor(Date.now() / 1000) + 5 * 60 * 1000,
        },
      }).addOperation(operation);
      const transaction = tx_builder.build();
      const simulation = await stellarRpc.simulateTransaction(transaction);
      setLoading(false);
      return simulation;
    } catch (e) {
      setLoading(false);
      throw e;
    }
  }

  async function invokeSorobanOperation(
    operation: xdr.Operation,
  ) {
    try {
      const account = await stellarRpc.getAccount(walletAddress);
      const tx_builder = new TransactionBuilder(account, {
        networkPassphrase: getChainDatas(chain).networkPassphrase,
        fee: BASE_FEE,
        timebounds: {
          minTime: 0,
          maxTime: Math.floor(Date.now() / 1000) + 5 * 60 * 1000,
        },
      }).addOperation(operation);
      const transaction = tx_builder.build();
      const simResponse = await simulateOperation(operation);
      const assembled_tx = rpc
        .assembleTransaction(transaction, simResponse)
        .build();
      const signedTx = await sign(assembled_tx.toXDR());
      const tx = new Transaction(
        signedTx,
        getChainDatas(chain).networkPassphrase
      );
      await sendTransaction(tx);
      return true;
    } catch (e: any) {
      console.error("Unknown error submitting transaction: ", e);
      setFailureMessage(e?.message);
      setTxStatus(TxStatus.FAIL);
      throw new Error("Failed to submit transaction");
    }
  }

  async function invokeAssembledSorobanOperation(
    assembled_tx: any,
  ) {
    try {
      console.log("Assembled tx in invoke",assembled_tx);
      // const account = await stellarRpc.getAccount(walletAddress);
      // const tx_builder = new TransactionBuilder(account, {
      //   networkPassphrase: getChainDatas(chain).networkPassphrase,
      //   fee: BASE_FEE,
      //   timebounds: {
      //     minTime: 0,
      //     maxTime: Math.floor(Date.now() / 1000) + 5 * 60 * 1000,
      //   },
      // }).addOperation(operation);
      // const transaction = tx_builder.build();
      // const simResponse = await simulateOperation(operation);
      // const assembled_tx = rpc
      //   .assembleTransaction(transaction, simResponse)
      //   .build();
      const signedTx = await sign(assembled_tx.toXDR());
      const tx = new Transaction(
        signedTx,
        getChainDatas('factory').networkPassphrase
      );
      let result = await sendTransaction(tx);
      return result;
    } catch (e: any) {
      console.error("Unknown error submitting transaction: ", e);
      setFailureMessage(e?.message);
      setTxStatus(TxStatus.FAIL);
      throw new Error(e.message);
    }
  }

  function parseRawSendTransaction(raw: any) {
    const {
      resultXdr,
      diagnosticEventsXdr
    } = raw;
    delete raw.resultXdr;
    delete raw.diagnosticEventsXdr;
    if (resultXdr) {
      return {
        ...raw,
        ...(diagnosticEventsXdr !== undefined && diagnosticEventsXdr.length > 0 && {
          diagnosticEvents: diagnosticEventsXdr.map(evt => StellarSdk.xdr.DiagnosticEvent.fromXDR(evt, 'base64'))
        }),
        errorResult: StellarSdk.xdr.TransactionResult.fromXDR(resultXdr, 'base64')
      };
    }
    return {
      ...raw
    };
  }

  function clearLastTx() {
    setTxStatus(TxStatus.NONE);
    setTxHash(undefined);
    setTxFailure(undefined);
    setTxType(TxType.CONTRACT);
  }

  //********** Siborg stellar Functions ***********/
  /**
   * Submit a request to the pool
   * @param tokenAddress - The address of the token contract
   * @param subscribeArgs - The "subscription" function args
   * @param sim - "true" if simulating the transaction, "false" if submitting
   * @returns The Positions, or undefined
   */
  async function createAssembledTransaction(
    assembled_tx: any
  ): Promise<rpc.Api.SimulateTransactionResponse | boolean> {
    try {
      if (connected) {
        // let subsContract = new StellarSdk.Contract(
        //   getChainDatas(chain).address
        // );
        // let operation = subsContract.call(
        //   "create_subscription",
        //   ...createOfferArgs
        // );
        // // const operation = xdr.Operation.fromXDR(tokenContract.approve(approveArgs), 'base64');
        // if (sim) {
        //   return await simulateOperation(operation);
        // }
        let result = await invokeAssembledSorobanOperation(assembled_tx);
        return result;
      }
      return false;
    } catch (error) {
      console.log("Failed to create tx: ", error);
      throw new Error(
        error.message 
      );
    }
  }
  /**
   * Submit a request to the pool
   * @param tokenAddress - The address of the token contract
   * @param approveArgs - The "approve" function args
   * @param sim - "true" if simulating the transaction, "false" if submitting
   * @returns The Positions, or undefined
   */
  async function stellarApprove(
    tokenAddress: string,
    sim: boolean,
    ...approveArgs: any[]
  ): Promise<rpc.Api.SimulateTransactionResponse | undefined> {
    try {
      if (connected) {
        let tokenContract = new StellarSdk.Contract(tokenAddress);
        let operation = tokenContract.call("approve", ...approveArgs);
        // const operation = xdr.Operation.fromXDR(tokenContract.approve(approveArgs), 'base64');
        if (sim) {
          return await simulateOperation(operation);
        }
        await invokeSorobanOperation(operation);
      }
    } catch (error) {
      throw new Error("Failed to approve, please try again or contact support");
    }
  }

  async function faucet(): Promise<undefined> {
    if (connected && process.env.NEXT_PUBLIC_PASSPHRASE === Networks.TESTNET) {
      const url = `https://ewqw4hx7oa.execute-api.us-east-1.amazonaws.com/getAssets?userId=${walletAddress}`;
      try {
        setTxStatus(TxStatus.BUILDING);
        const resp = await fetch(url, { method: "GET" });
        const txEnvelopeXDR = await resp.text();
        let transaction = new Transaction(
          xdr.TransactionEnvelope.fromXDR(txEnvelopeXDR, "base64"),
          getChainDatas(chain).networkPassphrase
        );

        let signedTx = new Transaction(
          await sign(transaction.toXDR()),
          getChainDatas(chain).networkPassphrase
        );
        await sendTransaction(signedTx);
        // if (result) {
        //   cleanWalletCache();
        // }
      } catch (e: any) {
        console.error("Failed submitting transaction: ", e);
        setFailureMessage(e?.message);
        setTxStatus(TxStatus.FAIL);
        return undefined;
      }
    }
  }

  async function createTrustlines(assets: Asset[]) {
    try {
      if (connected) {
        const account = await stellarRpc.getAccount(walletAddress);
        const tx_builder = new TransactionBuilder(account, {
          networkPassphrase: getChainDatas(chain).networkPassphrase,
          fee: BASE_FEE,
          timebounds: {
            minTime: 0,
            maxTime: Math.floor(Date.now() / 1000) + 5 * 60 * 1000,
          },
        });
        for (let asset of assets) {
          const trustlineOperation = Operation.changeTrust({
            asset: asset,
          });
          tx_builder.addOperation(trustlineOperation);
        }
        const transaction = tx_builder.build();
        const signedTx = await sign(transaction.toXDR());
        const tx = new Transaction(
          signedTx,
          getChainDatas(chain).networkPassphrase
        );
        setTxType(TxType.PREREQ);
        await sendTransaction(tx);
        // if (result) {
        //   cleanWalletCache();
        // }
      }
    } catch (e: any) {
      console.error("Failed to create trustline: ", e);
      setFailureMessage(e?.message);
      setTxStatus(TxStatus.FAIL);
    }
  }

  async function getNetworkDetails(): Promise<
    Network & { horizonUrl: string }
  > {
    try {
      const freighterDetails: any = await getFreighterNetwork();
      return {
        rpc: freighterDetails.sorobanRpcUrl,
        passphrase: freighterDetails.networkPassphrase,
        maxConcurrentRequests: 0,
        horizonUrl: freighterDetails.networkUrl,
      };
    } catch (e) {
      console.error("Failed to get network details from freighter", e);
      throw new Error("Failed to get network details from freighter");
    }
  }

  return (
    <WalletContext.Provider
      value={{
        connected,
        walletAddress,
        txStatus,
        lastTxHash: txHash,
        lastTxFailure: txFailure,
        txType,
        walletId: autoConnect,
        isLoading: loading,
        connect,
        disconnect,
        clearLastTx,
        restore,
        faucet,
        createTrustlines,
        getNetworkDetails,
        stellarApprove,
        createAssembledTransaction,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error("Component rendered outside the provider tree");
  }

  return context;
};
