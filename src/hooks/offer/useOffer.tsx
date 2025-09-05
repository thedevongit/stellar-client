import { useEffect, useState } from "react";
import { Client, SponsoringOffer } from "soroban-dsponsor";
import { getChainDatas } from "../../utils";
import * as StellarSdk from "@stellar/stellar-sdk";

// Get all offers for a specific user
export const useOffer = (chain: string, user: string) => {
  const [data, setData] = useState<SponsoringOffer[]>([]); // State for data
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let client = new Client({
          rpcUrl: getChainDatas("stellart").rpc,
          networkPassphrase: getChainDatas("stellart").networkPassphrase,
          contractId: getChainDatas("stellart").address,
          publicKey: user,
        });
        const call = await client.get_user_offers({user});
        const simulated = await call.simulate();
        const simulation = simulated.simulation as any;
        let data = StellarSdk.scValToNative(simulation?.result?.retval);
        if (!data) {
          throw new Error("No offers found");
        }
        setData(data as any);
      } catch (error: any) {
        console.log("Error fetching offers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user]); // Dependency array with url
  return { data, loading, error };
};
