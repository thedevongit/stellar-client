import { useEffect, useState } from "react";
import { Client, SponsoringOffer } from "soroban-dsponsor";
import { getChainDatas, stellarCall } from "../../utils";
import * as StellarSdk from "@stellar/stellar-sdk";

export const useTokenId = (chain: string,user: string, nftContract: string) => {
  const [data, setData] = useState<number>(); // State for data
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await stellarCall(chain, user, nftContract, 'get_token_count');
        let tokenId = StellarSdk.scValToBigInt((result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult).retval);
        setData(tokenId as any);
      } catch (error: any) {
        console.log("Error fetching offers", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user]); // Dependency array with url
  return { data, loading, error };
};
