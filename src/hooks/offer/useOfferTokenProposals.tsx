import { useEffect, useState } from "react";
import { Client, SponsoringOffer, SponsoringProposal } from "soroban-dsponsor";
import { getChainDatas, getNftAdmin } from "../../utils";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface Proposals {
  proposal: SponsoringProposal;
  admin: string;
}

// Get all offers for a specific user
export const useProposals = (chain: string, user: string, offerId: number, tokenId: number, nftContract: string) => {
  const [data, setData] = useState<Proposals>(); // State for data
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
        const call = await client.get_offer_proposals({offer_id: offerId, token_id: tokenId});
        const simulated = await call.simulate();
        const simulation = simulated.simulation as any;
        let result = StellarSdk.scValToNative(simulation?.result?.retval);
        if (!result) {
          throw new Error("No proposals found");
        }
        let admin = await getNftAdmin(chain, user, nftContract);
        result.link.admin = admin;
        setData({ proposal: result.link as any, admin: admin });
      } catch (error: any) {
        console.log("Error fetching proposals", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user]); // Dependency array with url
  return { data, loading, error };
};
