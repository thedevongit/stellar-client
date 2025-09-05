import { useEffect, useState } from "react";
import { Client, SponsoringOffer } from "soroban-dsponsor";
import {
  getChainDatas,
  getNftAdmin,
  getTokenDetails,
  stellarCall,
} from "../../utils";
import * as StellarSdk from "@stellar/stellar-sdk";
import { Proposals } from "./useOfferTokenProposals";

type OfferDetails = {
  offer: any;
  tokens: any[];
  proposals: Proposals[];
};

export const useOfferDetails = (chain: string, user: string, id: string) => {
  const [data, setData] = useState<OfferDetails>(); // State for data
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error handling

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      let tokens: {
        token_ids: number[];
        offer_id: number;
        token_owner: string;
        nft_contract: string;
      }[] = [];
      try {
        let client = new Client({
          rpcUrl: getChainDatas("stellart").rpc,
          networkPassphrase: getChainDatas("stellart").networkPassphrase,
          contractId: getChainDatas("stellart").address,
          publicKey: user,
        });
        const call = await client.get_user_offers({ user });
        const simulated = await call.simulate();
        const simulation = simulated.simulation as any;
        let result = StellarSdk.scValToNative(simulation?.result?.retval);
        let offer = result.find(
          (offer: SponsoringOffer) => offer.id === Number(id)
        );
        if (!offer) {
          throw new Error("No offer found with the specified ID");
        }
        offer.offer_metadata = JSON.parse(offer.offer_metadata);
        let admin = await getNftAdmin(chain, user, offer.nft_contract);
        let formatProposals = Object.keys(offer.proposals).map(
          (key: string) => {
            return {
              admin: admin,
              tokenId: key,
              proposal: offer.proposals[key].link,
            };
          }
        );
        const getTokenCount = await stellarCall(
          chain,
          user,
          offer.nft_contract,
          "get_token_count"
        );
        let tokenCount = StellarSdk.scValToBigInt(
          (
            getTokenCount.result as StellarSdk.rpc.Api.SimulateHostFunctionResult
          ).retval
        );
        tokens.push({
          token_ids: Array.from(
            { length: Number(tokenCount) },
            (_, i) => i + 1
          ),
          offer_id: offer.id,
          token_owner: admin,
          nft_contract: offer.nft_contract,
        });
        const tokenDatas = await Promise.all(
          tokens.map(
            async (token: {
              token_ids: number[];
              offer_id: number;
              token_owner: string;
              nft_contract: string;
            }) => {
              if (token.token_ids.length > 0) {
                const tokenDetails = await getTokenDetails(
                  chain,
                  user,
                  token.nft_contract,
                  token.token_ids[0]
                );
                return {
                  offer_id: token.offer_id,
                  nft_contract: token.nft_contract,
                  tokens: token.token_ids.map((token_id: number) => ({
                    token_id: token_id,
                    token_name: tokenDetails.name,
                    token_symbol: tokenDetails.symbol,
                    token_uri: tokenDetails.token_uri,
                    token_owner: tokenDetails.owner,
                  })),
                };
              } else {
                return {
                  offer_id: token.offer_id,
                  nft_contract: token.nft_contract,
                  tokens: [],
                };
              }
            }
          )
        );
        const data: OfferDetails = {
          offer: offer,
          tokens: tokenDatas,
          proposals: formatProposals,
        };
        if (!data) {
          throw new Error("No offers found");
        }
        setData(data as any);
      } catch (error: any) {
        console.log("Error fetching offers", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user, id]); // Dependency array with url
  return { data, loading, error };
};
