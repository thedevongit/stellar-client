import { useEffect, useState } from "react";
import { SponsoringOffer } from "soroban-dsponsor";
import {
  getTokenDetails,
  getUserAdTokens,
  stellarCall,
} from "../../utils";
import { useOffers } from "../offer/useOffers";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface Tokens {
  offer_id: number;
  nft_contract: string;
  tokens: {
    token_id: number;
    token_name: string;
    token_symbol: string;
    token_uri: string;
    token_owner: string;
  }[];
}

export const useTokens = (
  chain: string,
  user: string,
  offers: SponsoringOffer[]
) => {
  const [data, setData] = useState<Tokens[]>([]); // State for data
  const [loading, setLoading] = useState(true); // State for loading
  const [error, setError] = useState(null); // State for error handling
  const {
    data: totalOffers,
    loading: totalOffersLoading,
    error: totalOffersError,
  } = useOffers("stellart", user);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let tokens: {
          token_ids: number[];
          offer_id: number;
          token_owner: string;
          nft_contract: string;
        }[] = [];
        let offersToUse = (offers && offers.length > 0) ? offers : (totalOffers || []);
        for (let index = 0; index < offersToUse.length; index++) {
          const offer = offersToUse[index];
          const result = await stellarCall(
            chain,
            user,
            offer.nft_contract,
            "get_token_count"
          );
          let tokenCount = StellarSdk.scValToBigInt(
            (result.result as StellarSdk.rpc.Api.SimulateHostFunctionResult)
              .retval
          );
          let tokenAds = await getUserAdTokens(
            chain,
            user,
            offer.nft_contract,
            Number(tokenCount)
          );
          tokens.push({
            token_ids: tokenAds,
            offer_id: offer.id,
            token_owner: user,
            nft_contract: offer.nft_contract,
          });
        }
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
                    token_owner: token.token_owner,
                  })),
                };
              }else {
                return {
                  offer_id: token.offer_id,
                  nft_contract: token.nft_contract,
                  tokens: [],
                };
              }
            }
          )
        );
        setData(tokenDatas);
      } catch (error: any) {
        console.log("Error fetching offers", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user, offers,totalOffers]); // Dependency array with url
  return { data, loading, error };
};
