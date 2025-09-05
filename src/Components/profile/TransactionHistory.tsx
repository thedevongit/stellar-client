import React, { useEffect, useState } from "react";
import { Tabs } from "@mantine/core";
import {
  IconActivity,
  IconGavel,
  IconBox,
  IconShoppingBag,
  IconStars,
  IconSend,
} from "@tabler/icons-react";
import OfferList from "../offer/OfferList";
import TokenList from "../token/TokenList";
import { useOffer } from "../../hooks/offer/useOffer";
import { useTransactions } from "../../hooks/common/useTxs";
import { useWallet } from "../../web3/index";
import { useTokens } from "../../hooks/tokens/useTokens";

interface TabIconProps {
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2">
    {icon}
    <span>{label}</span>
    {count !== undefined && (
      <span className="bg-purple-600/20 text-purple-400 text-xs px-3 py-1 rounded-full">
        {count}
      </span>
    )}
  </div>
);

const TransactionHistory: React.FC = () => {
  const { walletAddress } = useWallet();
  const {
    data: offers,
    loading: offersLoading,
    error: offersError,
  } = useOffer("stellart", walletAddress);

  const {
    data: tokens,
    loading: tokensLoading,
    error: tknError,    
  } = useTokens("stellart", walletAddress, offers);
  const {
    data: transactions,
    loading: txsLoading,
    error: txsError,
  } = useTransactions("stellart", walletAddress, offers , tokens);

  const tableHeaders = ["Network", "Type", "Date", "Transaction", "Item"];

  console.log("Offer in tx history", offers);
  console.log("Tokens in tx history", tokens);
  const getTotalTokens = (): number => {
    let totalAds = 0;
    tokens.map((token) => {
      totalAds += token.tokens.length;
    });
    return totalAds;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="bg-[#1a1b23] rounded-xl border border-gray-800">
        <Tabs
          defaultValue="transactions"
          variant="pills"
          styles={(theme) => ({
            root: {
              padding: "1.5rem",
            },
            list: {
              gap: "0.5rem",
              borderBottom: `1px solid ${theme.colors.gray[8]}`,
              paddingBottom: "1rem",
              marginBottom: "1rem",
            },
            tab: {
              backgroundColor: "transparent",
              color: theme.colors.gray[5],
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              "&:hover": {
                backgroundColor: theme.fn.rgba(theme.colors.gray[8], 0.5),
                color: theme.colors.gray[0],
              },
              "&[data-active]": {
                backgroundColor: theme.fn.rgba(theme.colors.violet[9], 0.2),
                color: theme.colors.violet[4],
                "&:hover": {
                  backgroundColor: theme.fn.rgba(theme.colors.violet[9], 0.3),
                },
              },
            },
          })}
        >
          <Tabs.List className="py-2">
            <Tabs.Tab value="transactions">
              <TabIcon
                icon={<IconActivity size={20} />}
                label="Transactions"
                count={transactions?.length}
              />
            </Tabs.Tab>
            <Tabs.Tab value="bids">
              <TabIcon icon={<IconGavel size={20} />} label="Bids" />
            </Tabs.Tab>
            <Tabs.Tab value="owned">
              <TabIcon
                icon={<IconBox size={20} />}
                label="Owned tokens"
                count={getTotalTokens()}
              />
            </Tabs.Tab>
            <Tabs.Tab value="auction">
              <TabIcon
                icon={<IconShoppingBag size={20} />}
                label="Auction listed tokens"
              />
            </Tabs.Tab>
            <Tabs.Tab value="token-bids">
              <TabIcon
                icon={<IconStars size={20} />}
                label="Token Auction Bids"
              />
            </Tabs.Tab>
            <Tabs.Tab value="offers">
              <TabIcon
                icon={<IconSend size={20} />}
                label="Created Offers"
                count={offers?.length}
              />
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="transactions">
            <div className="overflow-x-auto">
              <div className="mb-6 text-sm text-gray-400 bg-gray-800/50 p-4 rounded-lg">
                Each transaction in XLM or USDC where a sale or auction is
                completed rewards the seller, buyer, and referrer with "Boxes"
                based on the amount paid. Below are the transactions for each
                role that rewarded this profile. "Boxes" may be eligible for an
                airdrop.
              </div>
              {txsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <p>Loading transactions...</p>
                </div>
              ) : txsError ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <IconActivity size={48} className="mb-4 opacity-50" />
                  <p>No transactions found</p>
                </div>
              ) : transactions && transactions.length > 0 ? (
                <table className="min-w-full">
                  <thead>
                    <tr>
                      {tableHeaders.map((header, index) => (
                        <th
                          key={index}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider border-b border-gray-800"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-gray-800/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {tx.network}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {tx.type}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {new Date(tx.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {tx.transaction}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {tx.item}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <IconActivity size={48} className="mb-4 opacity-50" />
                  <p>No transactions found</p>
                </div>
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="bids">
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <IconGavel size={48} className="mb-4 opacity-50" />
              <p>No bids found</p>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="owned">
            {tokensLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p>Loading owned tokens...</p>
              </div>
            ) : tknError ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <IconActivity size={48} className="mb-4 opacity-50" />
                <p>No tokens found</p>
              </div>
            ) : tokens && tokens.length > 0 ? (
              <TokenList tokens={tokens} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <IconActivity size={48} className="mb-4 opacity-50" />
                <p>No tokens found</p>
              </div>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="auction">
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <IconShoppingBag size={48} className="mb-4 opacity-50" />
              <p>No auction listed tokens found</p>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="token-bids">
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <IconStars size={48} className="mb-4 opacity-50" />
              <p>No token auction bids found</p>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="offers">
            {offersLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <p>Loading offers...</p>
              </div>
            ) : offersError ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <IconSend size={48} className="mb-4 opacity-50" />
                <p>No created offers found</p>
              </div>
            ) : offers && offers.length > 0 ? (
              <OfferList offers={offers} />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <IconSend size={48} className="mb-4 opacity-50" />
                <p>No created offers found</p>
              </div>
            )}
          </Tabs.Panel>
        </Tabs>
      </div>
    </div>
  );
};

export default TransactionHistory;
