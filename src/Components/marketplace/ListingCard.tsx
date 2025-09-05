import React, { useState } from 'react';
import { Button, Badge, Text, Group, Stack, Modal, NumberInput, Alert } from '@mantine/core';
import { IconShoppingCart, IconGavel, IconAlertCircle, IconClock } from '@tabler/icons-react';
import { useWallet } from '../../web3';
import { getChainDatas, stellarTokenDecimal } from '../../utils';
import { useDispatch } from 'react-redux';
import { setNotification } from '../../stores/common';
import { Client } from 'soroban-dsponsor-market';
import * as StellarSdk from '@stellar/stellar-sdk';

interface ListingCardProps {
  listing: {
    id: number;
    seller: string;
    nft_contract: string;
    token_id: bigint;
    currency: string;
    price: bigint;
    active: boolean;
  };
  nftData?: {
    name: string;
    imageUrl: string;
    description?: string;
    owner: string;
  };
  onUpdate?: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, nftData, onUpdate }) => {
  const [buyModalOpened, setBuyModalOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const { walletAddress, createAssembledTransaction } = useWallet();
  const dispatch = useDispatch();

  const isOwner = walletAddress === listing.seller;

  const handleBuy = async () => {
    if (!walletAddress) {
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: "Please connect your wallet first",
        })
      );
      return;
    }

    setLoading(true);
    try {
      // Create marketplace client
      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      // Buy the listing
      const assembledTx = await client.buy({
        listing_id: listing.id,
        buyer: walletAddress,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "NFT purchased successfully!",
          })
        );
        setBuyModalOpened(false);
        onUpdate?.();
      }
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to buy NFT',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: bigint, currency: string) => {
    // This would need to be implemented based on currency decimals
    // For now, showing as is
    return `${price.toString()} ${currency.slice(0, 4)}...`;
  };

  return (
    <>
      <div className="bg-[#23243a]/80 rounded-2xl shadow-xl border border-purple-900/40 backdrop-blur-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* NFT Image */}
        <div className="relative">
          <img 
            src={nftData?.imageUrl || '/placeholder-nft.png'} 
            alt={nftData?.name || 'NFT'} 
            className="w-full h-48 object-cover"
          />
          <Badge 
            color="green" 
            className="absolute top-3 left-3"
            leftSection={<IconShoppingCart size={12} />}
          >
            Direct Sale
          </Badge>
        </div>

        {/* Card Content */}
        <div className="p-6">
          <Stack spacing="sm">
            <div>
              <Text size="lg" weight={600} className="text-white truncate">
                {nftData?.name || `NFT #${listing.token_id.toString()}`}
              </Text>
              <Text size="sm" color="dimmed" className="truncate">
                by {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Text size="sm" color="dimmed">Price</Text>
                <Text size="xl" weight={700} className="text-purple-400">
                  {formatPrice(listing.price, listing.currency)}
                </Text>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-2">
              {isOwner ? (
                <Button 
                  variant="outline" 
                  color="gray" 
                  fullWidth 
                  disabled
                  className="cursor-not-allowed"
                >
                  Your Listing
                </Button>
              ) : (
                <Button 
                  color="violet" 
                  fullWidth
                  leftIcon={<IconShoppingCart size={16} />}
                  onClick={() => setBuyModalOpened(true)}
                  className="font-semibold"
                >
                  Buy Now
                </Button>
              )}
            </div>
          </Stack>
        </div>
      </div>

      {/* Buy Confirmation Modal */}
      <Modal
        opened={buyModalOpened}
        onClose={() => setBuyModalOpened(false)}
        title={null}
        centered
        size="sm"
        overlayProps={{ blur: 4 }}
        classNames={{ 
          content: 'custom-modal-content',
          body: 'p-0'
        }}
        withCloseButton={false}
      >
        <div className="bg-[#181926]/90 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-auto relative">
          <button
            onClick={() => setBuyModalOpened(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>

          <div className="w-full flex flex-col items-center gap-1 mb-6">
            <div className="text-2xl font-extrabold text-white text-center mb-2">
              Confirm Purchase
            </div>
            <Text size="sm" c="dimmed" className="text-center">
              You are about to purchase this NFT
            </Text>
          </div>

          {/* NFT Preview */}
          <div className="bg-[#23243a] rounded-xl p-4 mb-4 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                <img 
                  src={nftData?.imageUrl || '/placeholder-nft.png'} 
                  alt={nftData?.name || 'NFT'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Text size="md" weight={600} className="text-white mb-1 truncate">
                  {nftData?.name || `NFT #${listing.token_id.toString()}`}
                </Text>
                <Text size="xs" color="dimmed" className="mb-1">
                  by {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </Text>
                <div className="flex items-center gap-2">
                  <Text size="xs" color="dimmed">Price:</Text>
                  <Text size="md" weight={700} className="text-purple-400">
                    {formatPrice(listing.price, listing.currency)}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Important"
            color="orange"
            className="bg-orange-900/20 border-orange-500/30 mb-4"
          >
            This action cannot be undone. Make sure you have enough funds in your wallet.
          </Alert>

          <Group position="right" spacing="sm">
            <Button 
              variant="outline" 
              color="gray" 
              onClick={() => setBuyModalOpened(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              color="violet" 
              onClick={handleBuy}
              loading={loading}
              leftIcon={<IconShoppingCart size={16} />}
              className="px-6 font-semibold"
            >
              Confirm Purchase
            </Button>
          </Group>
        </div>
      </Modal>
    </>
  );
};

export default ListingCard;
