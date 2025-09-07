import React, { useState, useEffect } from 'react';
import { Button, Badge, Text, Group, Stack, Modal, NumberInput, Alert, Progress } from '@mantine/core';
import { IconGavel, IconAlertCircle, IconClock, IconTrendingUp, IconEye, IconCheck } from '@tabler/icons-react';
import { useWallet } from '../../web3';
import { getChainDatas, stellarTokenDecimal, getTokenSymbol, formatTokenAmount } from '../../utils';
import { useDispatch } from 'react-redux';
import { setNotification } from '../../stores/common';
import { Client } from 'soroban-dsponsor-market';
import * as StellarSdk from '@stellar/stellar-sdk';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';
import { IconCreditCard } from '@tabler/icons-react';

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
  const [auctionDetailsModalOpened, setAuctionDetailsModalOpened] = useState(false);
  const [bidAmount, setBidAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [tokenSymbol, setTokenSymbol] = useState<string>('UNK');
  const [tokenDecimals, setTokenDecimals] = useState<number>(6);
  const { walletAddress, createAssembledTransaction } = useWallet();
  const dispatch = useDispatch();
  const [fiatVisible, setFiatVisible] = useState(false);

  const isOwner = walletAddress === auction.seller;
  const isHighestBidder = walletAddress === auction.highest_bidder;
  const hasBids = auction.highest_bid > 0n;

  // Fetch token info
  useEffect(() => {
    const fetchTokenInfo = async () => {
      if (!walletAddress) return;
      
      try {
        const [symbol, decimals] = await Promise.all([
          getTokenSymbol('stellart', walletAddress, auction.currency),
          stellarTokenDecimal('stellart', walletAddress, auction.currency)
        ]);
        setTokenSymbol(symbol);
        setTokenDecimals(Number(decimals));
      } catch (error) {
        console.error('Error fetching token info:', error);
      }
    };

    fetchTokenInfo();
  }, [walletAddress, auction.currency]);

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

  const handleFinalizeAuction = async () => {
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

    setFinalizing(true);
    try {
      const marketplaceClient = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      const assembledTx = await marketplaceClient.finalize_auction({
        auction_id: auction.id,
        caller: walletAddress,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: hasBids ? "Auction finalized successfully! NFT transferred to winner." : "Auction finalized. No bids received.",
          })
        );
        setAuctionDetailsModalOpened(false);
        onUpdate?.();
      }
    } catch (error: any) {
      console.error('Error finalizing auction:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to finalize auction',
        })
      );
    } finally {
      setFinalizing(false);
    }
  };

  const formatPrice = (price: bigint) => {
    return formatTokenAmount(price, tokenDecimals, tokenSymbol);
  };

  const getMinBidAmount = () => {
    if (!hasBids) {
      return Number(auction.reserve_price) / (10 ** tokenDecimals);
    }
    return (Number(auction.highest_bid) / (10 ** tokenDecimals)) + 0.1; // 0.1 increment
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
                  {hasBids ? formatPrice(auction.highest_bid) : 'No bids'}
                </Text>
              </div>
              
              <div className="flex items-center justify-between">
                <Text size="sm" color="dimmed">Reserve Price</Text>
                <Text size="sm" className="text-gray-400">
                  {formatPrice(auction.reserve_price)}
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

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button 
                variant="outline" 
                color="blue" 
                fullWidth
                leftIcon={<IconEye size={16} />}
                onClick={() => setAuctionDetailsModalOpened(true)}
                className="font-semibold"
              >
                View Auction
              </Button>
              
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
                      {hasBids ? formatPrice(auction.highest_bid) : 'No bids'}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Text size="xs" color="dimmed">Reserve:</Text>
                    <Text size="xs" className="text-gray-400">
                      {formatPrice(auction.reserve_price)}
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
            <Button 
              variant="outline"
              color="gray" 
              onClick={() => setFiatVisible(true)}
              leftIcon={<IconCreditCard size={16} />}
              className="px-6"
            >
              Buy with fiat
            </Button>
          </Group>
        </div>
      </Modal>

      {/* Auction Details Modal */}
      <Modal
        opened={auctionDetailsModalOpened}
        onClose={() => setAuctionDetailsModalOpened(false)}
        title={null}
        centered
        size="lg"
        overlayProps={{ blur: 4 }}
        classNames={{ 
          content: 'custom-modal-content',
          body: 'p-0'
        }}
        withCloseButton={false}
      >
        <div className="bg-[#181926]/90 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-auto relative">
          <button
            onClick={() => setAuctionDetailsModalOpened(false)}
            className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
            aria-label="Close"
            type="button"
          >
            &times;
          </button>

          <div className="w-full flex flex-col items-center gap-1 mb-6">
            <div className="text-2xl font-extrabold text-white text-center mb-2">
              Auction Details
            </div>
            <Text size="sm" c="dimmed" className="text-center">
              Complete information about this NFT auction
            </Text>
          </div>

          {/* NFT Preview */}
          <div className="bg-[#23243a] rounded-xl p-6 mb-6 border border-orange-500/30">
            <div className="flex items-start gap-6">
              <div className="w-32 h-32 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                <img 
                  src={nftData?.imageUrl || '/placeholder-nft.png'} 
                  alt={nftData?.name || 'NFT'} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Text size="xl" weight={700} className="text-white mb-2 truncate">
                  {nftData?.name || `NFT #${auction.token_id.toString()}`}
                </Text>
                <Text size="sm" color="dimmed" className="mb-4">
                  Token ID: {auction.token_id.toString()}
                </Text>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Text size="sm" color="dimmed">Seller:</Text>
                    <Text size="sm" className="text-white">
                      {auction.seller.slice(0, 6)}...{auction.seller.slice(-4)}
                    </Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text size="sm" color="dimmed">Auction ID:</Text>
                    <Text size="sm" className="text-white">#{auction.id}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text size="sm" color="dimmed">Currency:</Text>
                    <Text size="sm" className="text-white">{tokenSymbol}</Text>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auction Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#23243a] rounded-xl p-4 border border-orange-500/30">
              <Text size="sm" color="dimmed" className="mb-2">Current Bid</Text>
              <Text size="xl" weight={700} className="text-orange-400">
                {hasBids ? formatPrice(auction.highest_bid) : 'No bids yet'}
              </Text>
              {hasBids && auction.highest_bidder && (
                <Text size="xs" color="dimmed" className="mt-1">
                  by {auction.highest_bidder.slice(0, 6)}...{auction.highest_bidder.slice(-4)}
                </Text>
              )}
            </div>
            
            <div className="bg-[#23243a] rounded-xl p-4 border border-orange-500/30">
              <Text size="sm" color="dimmed" className="mb-2">Reserve Price</Text>
              <Text size="xl" weight={700} className="text-gray-400">
                {formatPrice(auction.reserve_price)}
              </Text>
              <Text size="xs" color="dimmed" className="mt-1">
                Minimum bid required
              </Text>
            </div>
          </div>

          {/* Auction Status */}
          <div className="bg-[#23243a] rounded-xl p-4 mb-6 border border-orange-500/30">
            <div className="flex items-center justify-between mb-3">
              <Text size="md" weight={600} className="text-white">Auction Status</Text>
              <Badge color="orange" leftSection={<IconGavel size={12} />}>
                Active
              </Badge>
            </div>
            <Text size="sm" color="dimmed">
              This auction is currently active and accepting bids. The seller can finalize the auction at any time.
            </Text>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              color="gray" 
              onClick={() => setAuctionDetailsModalOpened(false)}
              className="flex-1"
            >
              Close
            </Button>
            
            {isOwner ? (
              <Button 
                color="green" 
                onClick={handleFinalizeAuction}
                loading={finalizing}
                leftIcon={<IconCheck size={16} />}
                className="flex-1 font-semibold"
              >
                Finalize Auction
              </Button>
            ) : !isHighestBidder ? (
              <Button 
                color="orange" 
                onClick={() => {
                  setAuctionDetailsModalOpened(false);
                  setBidModalOpened(true);
                }}
                leftIcon={<IconGavel size={16} />}
                className="flex-1 font-semibold"
              >
                Place Bid
              </Button>
            ) : null}
          </div>
        </div>
      </Modal>
      <MoonPayBuyWidget
        variant="overlay"
        visible={fiatVisible}
        onClose={async () => { setFiatVisible(false); }}
        baseCurrencyCode="usd"
        defaultCurrencyCode="xlm"
        walletAddress={walletAddress || undefined}
      />
    </>
  );
};

export default AuctionCard;
