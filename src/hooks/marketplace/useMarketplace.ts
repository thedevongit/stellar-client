import { useState, useEffect } from 'react';
import { Client } from 'soroban-dsponsor-market';
import { getChainDatas, getTokenDetails } from '../../utils';

export interface NFTData {
  name: string;
  imageUrl: string;
  description?: string;
  owner: string;
}

export interface MarketplaceData {
  listings: any[];
  auctions: any[];
  nftData: Map<string, NFTData>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useMarketplace = (walletAddress?: string): MarketplaceData => {
  const [listings, setListings] = useState<any[]>([]);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [nftData, setNftData] = useState<Map<string, NFTData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNFTData = async (nftContract: string, tokenId: bigint): Promise<NFTData> => {
    try {
      // Use getTokenDetails like in useTokens
      const tokenDetails = await getTokenDetails(
        'stellart',
        walletAddress || '',
        nftContract,
        Number(tokenId)
      );

      return {
        name: tokenDetails.name || `NFT #${tokenId.toString()}`,
        imageUrl: tokenDetails.token_uri || '/placeholder-nft.png',
        description: '',
        owner: tokenDetails.owner || '',
      };
    } catch (err) {
      console.warn('Error fetching NFT data:', err);
      return {
        name: `NFT #${tokenId.toString()}`,
        imageUrl: '/placeholder-nft.png',
        owner: '',
      };
    }
  };

  const fetchMarketplaceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress || '',
      });

      // Fetch all listings
      const listingsTx = await client.get_all_listings();
      const listingsSimulation = await listingsTx.simulate();
      const allListings = listingsSimulation.result || [];

      // Fetch all auctions
      const auctionsTx = await client.get_all_auctions();
      const auctionsSimulation = await auctionsTx.simulate();
      const allAuctions = auctionsSimulation.result || [];

      setListings(allListings);
      setAuctions(allAuctions);

      // Fetch NFT data for all items
      const nftDataMap = new Map<string, NFTData>();
      
      // Process listings
      for (const listing of allListings) {
        const key = `${listing.nft_contract}-${listing.token_id}`;
        const data = await fetchNFTData(listing.nft_contract, listing.token_id);
        nftDataMap.set(key, data);
      }

      // Process auctions
      for (const auction of allAuctions) {
        const key = `${auction.nft_contract}-${auction.token_id}`;
        const data = await fetchNFTData(auction.nft_contract, auction.token_id);
        nftDataMap.set(key, data);
      }

      setNftData(nftDataMap);
    } catch (err: any) {
      console.error('Error fetching marketplace data:', err);
      setError(err.message || 'Failed to fetch marketplace data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplaceData();
  }, [walletAddress]);

  return {
    listings,
    auctions,
    nftData,
    loading,
    error,
    refetch: fetchMarketplaceData,
  };
};
