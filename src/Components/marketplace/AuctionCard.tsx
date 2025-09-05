import React, { useState } from 'react';
import { Button, Badge, Text, Group, Stack, Modal, NumberInput, Alert, Progress } from '@mantine/core';
import { IconGavel, IconAlertCircle, IconClock, IconTrendingUp } from '@tabler/icons-react';
import { useWallet } from '../../web3';
import { getChainDatas, stellarTokenDecimal } from '../../utils';
import { useDispatch } from 'react-redux';
import { setNotification } from '../../stores/common';
import { Client } from 'soroban-dsponsor-market';
import * as StellarSdk from '@stellar/stellar-sdk';

interface AuctionCardProps {
  auction: {
    id: number;
    seller: string;
    nft_contract: string;
    token_id: bigint;
    currency: string;
    reserve_price: bigint;
    highest_bid: bigint;
    highest_bidder: string | null;
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

const AuctionCard: React.FC<AuctionCardProps> = ({ auction, nftData, onUpdate }) => {
  const [bidModalOpened, setBidModalOpened] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { walletAddress, createAssembledTransaction } = useWallet();
  const dispatch = useDispatch();

  const isOwner = walletAddress === auction.seller;
  const isHighestBidder = walletAddress === auction.highest_bidder;
  const hasBids = auction.highest_bid > 0n;

  const handleBid = async () => {
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

    if (bidAmount <= 0) {
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: "Please enter a valid bid amount",
        })
      );
      return;
    }

    setLoading(true);
    try {
      // Get token decimals for proper amount calculation
      const decimal = await stellarTokenDecimal('stellart', walletAddress, auction.currency);
      const bidAmountInSmallestUnit = BigInt(bidAmount * 10 ** Number(decimal));

      // Create marketplace client
      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      // Place bid
      const assembledTx = await client.bid({
        auction_id: auction.id,
        bidder: walletAddress,
        amount: bidAmountInSmallestUnit,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "Bid placed successfully!",
          })
        );
        setBidModalOpened(false);
        setBidAmount(0);
        onUpdate?.();
      }
    } catch (error: any) {
      console.error('Error placing bid:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to place bid',
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

  const getMinBidAmount = () => {
    if (!hasBids) {
      return Number(auction.reserve_price) / 1000000; // Assuming 6 decimals
    }
    return (Number(auction.highest_bid) / 1000000) + 0.1; // 0.1 increment
  };

  return (
    <>
      <div className="bg-[#23243a]/80 rounded-2xl shadow-xl border border-orange-900/40 backdrop-blur-xl overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* NFT Image */}
        <div className="relative">
          <img 
            src={nftData?.imageUrl || '/placeholder-nft.png'} 
            alt={nftData?.name || 'NFT'} 
            className="w-full h-48 object-cover"
          />
          <Badge 
            color="orange" 
            className="absolute top-3 left-3"
            leftSection={<IconGavel size={12} />}
          >
            Auction
          </Badge>
          {hasBids && (
            <Badge 
              color="red" 
              className="absolute top-3 right-3"
              leftSection={<IconTrendingUp size={12} />}
            >
              {auction.highest_bidder ? `${auction.highest_bidder.slice(0, 4)}...` : 'Active'}
            </Badge>
          )}
        </div>

        {/* Card Content */}
        <div className="p-6">
          <Stack spacing="sm">
            <div>
              <Text size="lg" weight={600} className="text-white truncate">
                {nftData?.name || `NFT #${auction.token_id.toString()}`}
              </Text>
              <Text size="sm" color="dimmed" className="truncate">
                by {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
              </Text>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Text size="sm" color="dimmed">Current Bid</Text>
                <Text size="lg" weight={700} className="text-orange-400">
                  {hasBids ? formatPrice(auction.highest_bid, auction.currency) : 'No bids'}
                </Text>
              </div>
              
              <div className="flex items-center justify-between">
                <Text size="sm" color="dimmed">Reserve Price</Text>
                <Text size="sm" className="text-gray-400">
                  {formatPrice(auction.reserve_price, auction.currency)}
                </Text>
              </div>

              {hasBids && (
                <div className="pt-2">
                  <Progress 
                    value={75} 
                    color="orange" 
                    size="sm" 
                    className="mb-1"
                  />
                  <Text size="xs" color="dimmed" className="text-center">
                    Auction Active
                  </Text>
                </div>
              )}
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
                  Your Auction
                </Button>
              ) : isHighestBidder ? (
                <Button 
                  variant="outline" 
                  color="green" 
                  fullWidth 
                  disabled
                  className="cursor-not-allowed"
                >
                  You're Winning
                </Button>
              ) : (
                <Button 
                  color="orange" 
                  fullWidth
                  leftIcon={<IconGavel size={16} />}
                  onClick={() => setBidModalOpened(true)}
                  className="font-semibold"
                >
                  Place Bid
                </Button>
              )}
            </div>
          </Stack>
        </div>
      </div>

      {/* Bid Modal */}
      <Modal
        opened={bidModalOpened}
        onClose={() => setBidModalOpened(false)}
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
            onClick={() => setBidModalOpened(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>

          <div className="w-full flex flex-col items-center gap-1 mb-6">
            <div className="text-2xl font-extrabold text-white text-center mb-2">
              Place Your Bid
            </div>
            <Text size="sm" c="dimmed" className="text-center">
              Enter your bid amount for this NFT auction
            </Text>
          </div>

          {/* NFT Preview */}
          <div className="bg-[#23243a] rounded-xl p-4 mb-4 border border-orange-500/30">
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
                  {nftData?.name || `NFT #${auction.token_id.toString()}`}
                </Text>
                <Text size="xs" color="dimmed" className="mb-1">
                  by {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                </Text>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Text size="xs" color="dimmed">Current:</Text>
                    <Text size="sm" weight={600} className="text-orange-400">
                      {hasBids ? formatPrice(auction.highest_bid, auction.currency) : 'No bids'}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Text size="xs" color="dimmed">Reserve:</Text>
                    <Text size="xs" className="text-gray-400">
                      {formatPrice(auction.reserve_price, auction.currency)}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <NumberInput
            label={<span className="text-white font-semibold">Your Bid Amount</span>}
            placeholder={`Minimum: ${getMinBidAmount()}`}
            value={bidAmount}
            onChange={(value) => setBidAmount(value || 0)}
            min={getMinBidAmount()}
            step={0.1}
            precision={2}
            required
            classNames={{
              input: 'bg-[#23243a] text-white border-orange-500/30 focus:border-orange-400',
              label: 'text-white'
            }}
            className="mb-4"
          />

          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Bid Information"
            color="orange"
            className="bg-orange-900/20 border-orange-500/30 mb-4"
          >
            Make sure you have enough funds in your wallet. Your bid will be locked until the auction ends.
          </Alert>

          <Group position="right" spacing="sm">
            <Button 
              variant="outline" 
              color="gray" 
              onClick={() => setBidModalOpened(false)}
              className="px-6"
            >
              Cancel
            </Button>
            <Button 
              color="orange" 
              onClick={handleBid}
              loading={loading}
              leftIcon={<IconGavel size={16} />}
              className="px-6 font-semibold"
            >
              Place Bid
            </Button>
          </Group>
        </div>
      </Modal>
    </>
  );
};

export default AuctionCard;
