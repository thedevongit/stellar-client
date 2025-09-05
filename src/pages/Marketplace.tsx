import React, { useState } from "react";
import { Navbar } from "../Components";
import { 
  ListingCard, 
  AuctionCard, 
  MarketplaceFilters, 
  EmptyState 
} from "../Components/marketplace";
import { useMarketplace } from "../hooks/marketplace/useMarketplace";
import { useWallet } from "../web3";
import { Grid, Container, LoadingOverlay, Alert, Text } from "@mantine/core";
import { IconAlertCircle, IconRefresh } from "@tabler/icons-react";
import Notifications from "../Components/common/Notif";
import styles from "../styles/style";

/**
 * Marketplace Component
 * Displays all available NFT listings and auctions
 */
const Marketplace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'listings' | 'auctions'>('all');
  const { walletAddress } = useWallet();
  const { listings, auctions, nftData, loading, error, refetch } = useMarketplace(walletAddress);

  const filteredListings = listings.filter(listing => listing.active);
  const filteredAuctions = auctions.filter(auction => auction.active);

  const getDisplayedItems = () => {
    switch (activeTab) {
      case 'listings':
        return { listings: filteredListings, auctions: [] };
      case 'auctions':
        return { listings: [], auctions: filteredAuctions };
      default:
        return { listings: filteredListings, auctions: filteredAuctions };
    }
  };

  const { listings: displayListings, auctions: displayAuctions } = getDisplayedItems();
  const hasItems = displayListings.length > 0 || displayAuctions.length > 0;

  const handleRefresh = () => {
    refetch();
  };

  if (error) {
    return (
      <div className="w-full overflow-hidden bg-[#13141a] min-h-screen">
        {/* Navigation Section */}
        <div className={`${styles.paddingX} ${styles.flexCenter}`}>
          <div className={`${styles.boxWidth}`}>
            <Navbar />
          </div>
        </div>

        {/* Error State */}
        <div className={`${styles.boxWidth}`}>
          <div className="w-full py-16 px-4">
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Error Loading Marketplace"
              color="red"
              className="bg-red-900/20 border-red-500/30"
            >
              <Text color="dimmed" className="mb-4">
                {error}
              </Text>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <IconRefresh size={16} />
                Try Again
              </button>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-[#13141a] min-h-screen">
      {/* Navigation Section */}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>

      {/* Main Content Section */}
      <div className="w-full flex justify-center">
        <div className="w-full max-w-7xl py-8 px-4">
          {/* Filters */}
          <div className="mb-8">
            <MarketplaceFilters
              activeTab={activeTab}
              onTabChange={setActiveTab}
              listingsCount={filteredListings.length}
              auctionsCount={filteredAuctions.length}
            />
          </div>

          {/* Content */}
          <div className="relative">
            <LoadingOverlay visible={loading} />
            
            {!loading && !hasItems ? (
              <EmptyState type={activeTab} />
            ) : (
              <Grid gutter="lg">
                {/* Listings */}
                {displayListings.map((listing) => {
                  const nftKey = `${listing.nft_contract}-${listing.token_id}`;
                  const nftInfo = nftData.get(nftKey);
                  return (
                    <Grid.Col key={`listing-${listing.id}`} span={12} sm={6} lg={4}>
                      <ListingCard
                        listing={listing}
                        nftData={nftInfo}
                        onUpdate={refetch}
                      />
                    </Grid.Col>
                  );
                })}

                {/* Auctions */}
                {displayAuctions.map((auction) => {
                  const nftKey = `${auction.nft_contract}-${auction.token_id}`;
                  const nftInfo = nftData.get(nftKey);
                  return (
                    <Grid.Col key={`auction-${auction.id}`} span={12} sm={6} lg={4}>
                      <AuctionCard
                        auction={auction}
                        nftData={nftInfo}
                        onUpdate={refetch}
                      />
                    </Grid.Col>
                  );
                })}
              </Grid>
            )}
          </div>
        </div>
      </div>
      <Notifications />
    </div>
  );
};

export default Marketplace;
