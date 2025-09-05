import React, { useState } from 'react';
import {
  Modal,
  TextInput,
  NumberInput,
  Select,
  Button,
  Text,
  Alert,
} from '@mantine/core';
import { IconAlertCircle, IconGavel, IconTag } from '@tabler/icons-react';
import { useWallet } from '../../web3';
import { getChainDatas, stellarTokenDecimal, stellarLedgerExpiration } from '../../utils';
import { useDispatch, useSelector } from 'react-redux';
import { setNotification } from '../../stores/common';
import { Client } from 'soroban-dsponsor-market';
import * as StellarSdk from '@stellar/stellar-sdk';

// Currency options (same as offer form)
const currencies = [
  { value: 'USDS', label: 'USDS', address: 'CDN4DRIVEZMCMSMO2ZADNXBWO3JOT6NAN7GBEDUL2VTMOJ6QU65RBZGS' },
  { value: 'XLM', label: 'XLM', address: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC' },
  { value: 'custom', label: 'Custom' },
];

interface TokenListingModalProps {
  opened: boolean;
  onClose: () => void;
  tokenData: {
    id: number;
    contractAddress: string;
    name: string;
    imageUrl: string;
  };
}

const TokenListingModal: React.FC<TokenListingModalProps> = ({
  opened,
  onClose,
  tokenData,
}) => {
  const [activeTab, setActiveTab] = useState<'direct' | 'auction'>('direct');
  const [loading, setLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState<string | null>(null);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [progressStep, setProgressStep] = useState<0 | 1 | 2>(0); // 0: idle, 1: approve, 2: listing
  
  // Direct listing form
  const [directListing, setDirectListing] = useState({
    price: 1,
    currency: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    customCurrencyAddress: '',
  });

  // Auction form
  const [auction, setAuction] = useState({
    reservePrice: 1,
    currency: 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC',
    customCurrencyAddress: '',
  });

  const { walletAddress, createAssembledTransaction, stellarApprove } = useWallet();
  const { notification } = useSelector((state: any) => state.common);
  const dispatch = useDispatch();

  // Helper for currency display
  const getCurrencyLabel = (currency: string, customAddress: string) => {
    if (currency === 'custom') {
      return `Custom (${customAddress.slice(0, 3) + '...' + customAddress.slice(-3) || 'No address'})`;
    }
    const found = currencies.find(c => c.address === currency);
    return found?.label || 'Unknown';
  };

  // Custom currency validation
  const handleCurrencyChange = (field: 'directListing' | 'auction', v: string | null) => {
    if (v === 'custom') {
      if (field === 'directListing') {
        setDirectListing(f => ({ ...f, currency: 'custom', customCurrencyAddress: '' }));
      } else {
        setAuction(f => ({ ...f, currency: 'custom', customCurrencyAddress: '' }));
      }
    } else {
      const found = currencies.find(c => c.value === v);
      if (field === 'directListing') {
        setDirectListing(f => ({ ...f, currency: found?.address || '', customCurrencyAddress: '' }));
      } else {
        setAuction(f => ({ ...f, currency: found?.address || '', customCurrencyAddress: '' }));
      }
    }
    setCurrencyError(null);
  };

  const handleCustomCurrencyAddress = (field: 'directListing' | 'auction', e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (field === 'directListing') {
      setDirectListing(f => ({ ...f, customCurrencyAddress: value }));
    } else {
      setAuction(f => ({ ...f, customCurrencyAddress: value }));
    }
    
    if (!/^C[A-Z0-9]{54}$/.test(value)) {
      setCurrencyError('Invalid Stellar address format');
    } else {
      setCurrencyError(null);
    }
  };

  // Check if token is already listed
  const checkExistingListing = async (): Promise<boolean> => {
    try {
      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      const allListingsTx = await client.get_all_listings();
      const simulation = await allListingsTx.simulate();
      
      if (!simulation.result) {
        return false;
      }

      const allListings = simulation.result;
      
      // Check if this token is already listed
      const existingListing = allListings.find(listing => 
        listing.nft_contract === tokenData.contractAddress && 
        listing.token_id === BigInt(tokenData.id) &&
        listing.active
      );

      return !!existingListing;
    } catch (error) {
      console.error('Error checking existing listings:', error);
      return false;
    }
  };

  const createDirectListing = async () => {
    if (currencyError) return;
    
    setProgressModalOpen(true);
    setProgressStep(0);
    try {
      // Check if token is already listed
      const isAlreadyListed = await checkExistingListing();
      if (isAlreadyListed) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Error",
            message: "This token is already listed for sale. Please cancel the existing listing first.",
          })
        );
        setProgressModalOpen(false);
        return;
      }

      const currencyAddress = directListing.currency === 'custom' 
        ? directListing.customCurrencyAddress 
        : directListing.currency;

      // Get token decimals
      const decimal = await stellarTokenDecimal('stellart', walletAddress, currencyAddress);
      const priceInSmallestUnit = BigInt(directListing.price * 10 ** Number(decimal));

      // Step 1: Approve marketplace to transfer this NFT
      await stellarApprove(
        tokenData.contractAddress,
        false,
        new StellarSdk.Address(walletAddress).toScVal(),
        new StellarSdk.Address(getChainDatas('marketplace').address).toScVal(),
        StellarSdk.nativeToScVal(BigInt(tokenData.id), { type: 'i128' }),
        // expirationLedger
      );
      setProgressStep(1);

      // Step 2: Create marketplace client
      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      // Step 3: Create listing using the marketplace SDK
      const assembledTx = await client.create_listing({
        seller: walletAddress,
        nft_contract: tokenData.contractAddress,
        token_id: BigInt(tokenData.id),
        currency: currencyAddress,
        price: priceInSmallestUnit,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        setProgressStep(2);
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "Token listed successfully!",
          })
        );
        // Close progress modal after a short delay
        setTimeout(() => {
          setProgressModalOpen(false);
          onClose();
        }, 1200);
      }
    } catch (error: any) {
      console.error('Error creating listing:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to create listing',
        })
      );
      setProgressModalOpen(false);
    }
  };

  const createAuction = async () => {
    if (currencyError) return;
    
    setProgressModalOpen(true);
    setProgressStep(0);
    try {
      // Check if token is already listed
      const isAlreadyListed = await checkExistingListing();
      if (isAlreadyListed) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Error",
            message: "This token is already listed for sale. Please cancel the existing listing first.",
          })
        );
        setProgressModalOpen(false);
        return;
      }

      const currencyAddress = auction.currency === 'custom' 
        ? auction.customCurrencyAddress 
        : auction.currency;

      // Get token decimals
      const decimal = await stellarTokenDecimal('stellart', walletAddress, currencyAddress);
      const priceInSmallestUnit = BigInt(auction.reservePrice * 10 ** Number(decimal));

      // Step 1: Approve marketplace to transfer this NFT
      await stellarApprove(
        tokenData.contractAddress,
        false,
        new StellarSdk.Address(walletAddress).toScVal(),
        new StellarSdk.Address(getChainDatas('marketplace').address).toScVal(),
        StellarSdk.nativeToScVal(BigInt(tokenData.id), { type: 'i128' }),
        // expirationLedger
      );
      setProgressStep(1);

      // Step 2: Create marketplace client
      const client = new Client({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      // Step 3: Create auction using the marketplace SDK
      const assembledTx = await client.create_auction({
        seller: walletAddress,
        nft_contract: tokenData.contractAddress,
        token_id: BigInt(tokenData.id),
        currency: currencyAddress,
        reserve_price: priceInSmallestUnit,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        setProgressStep(2);
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "Auction created successfully!",
          })
        );
        // Close progress modal after a short delay
        setTimeout(() => {
          setProgressModalOpen(false);
          onClose();
        }, 1200);
      }
    } catch (error: any) {
      console.error('Error creating auction:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to create auction',
        })
      );
      setProgressModalOpen(false);
    }
  };

  const isFormValid = (type: 'direct' | 'auction') => {
    if (type === 'direct') {
      return directListing.price > 0 && 
             (directListing.currency !== 'custom' || directListing.customCurrencyAddress.length > 0) &&
             !currencyError;
    } else {
      return auction.reservePrice > 0 && 
             (auction.currency !== 'custom' || auction.customCurrencyAddress.length > 0) &&
             !currencyError;
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={null}
      centered
      size="lg"
      overlayProps={{ blur: 4 }}
      classNames={{ content: 'custom-modal-content' }}
      withCloseButton={false}
    >
      <div className="bg-[#181926]/90 rounded-2xl shadow-2xl p-8 min-w-[480px] max-w-2xl mx-auto relative">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
          aria-label="Close"
          type="button"
        >
          &times;
        </button>

        <div className="w-full flex flex-col items-center gap-1 mb-6">
          <div className="text-2xl font-extrabold text-white text-center mb-2">
            List Token for Sale
          </div>
          <Text size="sm" c="dimmed" className="text-center">
            Choose how you want to sell your {tokenData.name}
          </Text>
        </div>

        {/* Tab Navigation */}
        <div className="bg-[#23243a] border border-purple-500/30 rounded-xl p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('direct')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                activeTab === 'direct' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <IconTag size={16} />
              Direct Listing
            </button>
            <button
              onClick={() => setActiveTab('auction')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-all duration-200 ${
                activeTab === 'auction' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-white hover:bg-purple-600/20'
              }`}
            >
              <IconGavel size={16} />
              Auction
            </button>
          </div>
        </div>

        {/* Direct Listing Tab */}
        {activeTab === 'direct' && (
          <div className="w-full space-y-6">
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Fixed Price Listing"
              color="blue"
              className="bg-blue-900/20 border-blue-500/30"
            >
              Set a fixed price for your token. Buyers can purchase it immediately at this price.
            </Alert>

            <NumberInput
              label={<span className="text-white font-semibold">Price</span>}
              placeholder="Enter price"
              value={directListing.price}
              onChange={(value) => setDirectListing(f => ({ ...f, price: value || 0 }))}
              min={0.01}
              step={0.01}
              precision={2}
              required
              classNames={{
                input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                label: 'text-white'
              }}
            />

            <Select
              label={<span className="text-white font-semibold">Currency</span>}
              placeholder="Select currency"
              value={directListing.currency === 'custom' ? 'custom' : 
                     currencies.find(c => c.address === directListing.currency)?.value}
              onChange={(value) => handleCurrencyChange('directListing', value)}
              data={currencies}
              required
              classNames={{
                input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                label: 'text-white',
                dropdown: 'bg-[#23243a] border-purple-500/30',
                item: 'text-white hover:bg-purple-600/20'
              }}
            />

            {directListing.currency === 'custom' && (
              <TextInput
                label={<span className="text-white font-semibold">Custom Currency Address</span>}
                placeholder="C..."
                value={directListing.customCurrencyAddress}
                onChange={(e) => handleCustomCurrencyAddress('directListing', e)}
                error={currencyError}
                required
                classNames={{
                  input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                  label: 'text-white'
                }}
              />
            )}

            <Button
              onClick={createDirectListing}
              disabled={!isFormValid('direct')}
              color="violet"
              radius="xl"
              size="lg"
              fullWidth
              className="font-bold mt-4"
            >
              Create Listing
            </Button>
          </div>
        )}

        {/* Auction Tab */}
        {activeTab === 'auction' && (
          <div className="w-full space-y-6">
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="English Auction"
              color="orange"
              className="bg-orange-900/20 border-orange-500/30"
            >
              Start an auction with a reserve price. Bidders can place bids, and the highest bidder wins. The auction will remain active until manually finalized.
            </Alert>

            <NumberInput
              label={<span className="text-white font-semibold">Reserve Price</span>}
              placeholder="Enter minimum price"
              value={auction.reservePrice}
              onChange={(value) => setAuction(f => ({ ...f, reservePrice: value || 0 }))}
              min={0.01}
              step={0.01}
              precision={2}
              required
              classNames={{
                input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                label: 'text-white'
              }}
            />

            <Select
              label={<span className="text-white font-semibold">Currency</span>}
              placeholder="Select currency"
              value={auction.currency === 'custom' ? 'custom' : 
                     currencies.find(c => c.address === auction.currency)?.value}
              onChange={(value) => handleCurrencyChange('auction', value)}
              data={currencies}
              required
              classNames={{
                input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                label: 'text-white',
                dropdown: 'bg-[#23243a] border-purple-500/30',
                item: 'text-white hover:bg-purple-600/20'
              }}
            />

            {auction.currency === 'custom' && (
              <TextInput
                label={<span className="text-white font-semibold">Custom Currency Address</span>}
                placeholder="C..."
                value={auction.customCurrencyAddress}
                onChange={(e) => handleCustomCurrencyAddress('auction', e)}
                error={currencyError}
                required
                classNames={{
                  input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400',
                  label: 'text-white'
                }}
              />
            )}

            <Button
              onClick={createAuction}
              disabled={!isFormValid('auction')}
              color="violet"
              radius="xl"
              size="lg"
              fullWidth
              className="font-bold mt-4"
            >
              Create Auction
            </Button>
          </div>
        )}

        {/* Progress Modal */}
        <Modal
          opened={progressModalOpen}
          onClose={() => {}}
          centered
          withCloseButton={false}
          size="sm"
          radius="xl"
          classNames={{ body: 'bg-[#181926] rounded-2xl p-8', header: 'border-b border-gray-800' }}
        >
          <div className="flex flex-col gap-6 items-center">
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full p-3 ${progressStep > 0 ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                {progressStep > 0 ? (
                  <span className="text-green-400 text-2xl">✔️</span>
                ) : (
                  <span className="text-purple-400 text-2xl">🔐</span>
                )}
              </div>
              <div className="text-lg font-bold text-white">Approve NFT</div>
              <div className="text-sm text-purple-300">{progressStep === 0 ? "Processing..." : "Done"}</div>
            </div>
            <div className="border-l-2 border-purple-700 h-8" />
            <div className="flex flex-col items-center gap-2">
              <div className={`rounded-full p-3 ${progressStep === 2 ? 'bg-green-500/20' : 'bg-purple-500/20'}`}>
                {progressStep === 2 ? (
                  <span className="text-green-400 text-2xl">✔️</span>
                ) : (
                  <span className="text-purple-400 text-2xl">{activeTab === 'direct' ? '🏷️' : '🔨'}</span>
                )}
              </div>
              <div className="text-lg font-bold text-white">
                {activeTab === 'direct' ? 'Create Listing' : 'Create Auction'}
              </div>
              <div className="text-sm text-purple-300">{progressStep < 2 ? "Waiting..." : "Done"}</div>
            </div>
          </div>
        </Modal>
      </div>
    </Modal>
  );
};

export default TokenListingModal; 