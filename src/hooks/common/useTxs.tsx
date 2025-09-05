import { useEffect, useState } from "react";
import { Client, SponsoringOffer } from "soroban-dsponsor";
import { getChainDatas } from "../../utils";
import { Tokens, useTokens } from "../tokens/useTokens";

type TransactionHistory = {
  id: string;
  network: string;
  type: string;
  date: string;
  transaction: string;
  item: string;
};

export const useTransactions = (
  chain: string,
  user: string,
  offers: SponsoringOffer[],
  tokens: Tokens[]
) => {
  const [data, setData] = useState<TransactionHistory[]>([]); // State for data
  const [loading, setLoading] = useState<boolean>(true); // State for loading
  const [error, setError] = useState<string | null>(null); // State for error handling
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let txs: TransactionHistory[] = [];
        if (offers && Array.isArray(offers)) {
          txs = offers.map((offer: SponsoringOffer, key: number) => ({
            id: key.toString(),
            network: "Stellar",
            type: "Offer Creation",
            date: new Date().toISOString(),
            transaction: "OFFER TX",
            item: JSON.parse(offer.offer_metadata).title,
          }));
        }
        if (tokens && Array.isArray(tokens)) {
          tokens.map((token: Tokens) => {
            token.tokens.map((token) => {
              txs.push({
                id: token.token_id.toString(),
                network: "Stellar",
                type: "Ad Space Purchase",
                date: new Date().toISOString(),
                transaction: "MINT TX",
                item: token.token_name,
              });
            });
          });
        }
        if (!txs) {
          throw new Error("No transactions found");
        }
        setData(txs);
      } catch (error: any) {
        console.log("Error fetching txs", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [chain, user, offers, tokens]); // Dependency array with url
  return { data, loading, error };
};
