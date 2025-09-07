import React, { useState, useEffect } from 'react';
import { Navbar } from '../Components';
import styles from '../styles/style';
import TokenAdValidationSection from '../Components/offer/OfferAdValidationSection';
import TokenDetailsSection from '../Components/offer/OfferDetailsSection';
import TokenListingModal from '../Components/token/TokenListingModal';
import { Button, Modal, TextInput } from '@mantine/core';
import { IconSend, IconTag, IconX } from '@tabler/icons-react';
import { useSearchParams } from 'react-router-dom';
import { Client } from "soroban-dsponsor";
import { Client as MarketplaceClient } from "soroban-dsponsor-market";
import {
  getChainDatas,
} from "../utils";
import { useWallet } from "../web3";
import { useDispatch, useSelector } from 'react-redux';
import Notifications from '../Components/common/Notif';
import { setNotification } from '../stores/common';

const TokenPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenData = JSON.parse(decodeURIComponent(searchParams.get('data') || '{}'));
  const [modalOpened, setModalOpened] = useState(false);
  const [listingModalOpened, setListingModalOpened] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isListed, setIsListed] = useState(false);
  const [listingId, setListingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { walletAddress , createAssembledTransaction} = useWallet();
  const { notification } = useSelector((state: any) => state.common);
  const dispatch = useDispatch();

  // Check if user is owner and if token is listed
  useEffect(() => {
    const checkOwnershipAndListing = async () => {
      if (!walletAddress || !tokenData.contractAddress) return;

      try {
        // Check if user is the owner
        const isTokenOwner = tokenData.owner === walletAddress;
        setIsOwner(isTokenOwner);

        if (isTokenOwner) {
          // Check if token is already listed
          const marketplaceClient = new MarketplaceClient({
            rpcUrl: getChainDatas('marketplace').rpc,
            networkPassphrase: getChainDatas('marketplace').networkPassphrase,
            contractId: getChainDatas('marketplace').address,
            publicKey: walletAddress,
          });

          const allListingsTx = await marketplaceClient.get_all_listings();
          const allListings = await allListingsTx.simulate();
          
          const tokenListing = allListings.result?.find((listing: any) => 
            listing.nft_contract === tokenData.contractAddress && 
            listing.token_id === Number(tokenData.id) &&
            listing.active
          );

          if (tokenListing) {
            setIsListed(true);
            setListingId(tokenListing.id);
          }
        }
      } catch (error) {
        console.error('Error checking ownership and listing status:', error);
      }
    };

    checkOwnershipAndListing();
  }, [walletAddress, tokenData.contractAddress, tokenData.owner, tokenData.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submit logic here
    await handleSubmitAdProposal(imageUrl, externalLink);
    setModalOpened(false);
  };

  const handleSubmitAdProposal = async (imageUrl: string, externalLink: string) => {
    try {
      // Step 1: Create NFT
      let client = new Client({
        rpcUrl: getChainDatas("stellart").rpc,
        networkPassphrase: getChainDatas("stellart").networkPassphrase,
        contractId: getChainDatas("stellart").address,
        publicKey: walletAddress,
      });
      let assembledSubmitAdProposalTx = await client.submit_ad_proposal({
        caller: walletAddress,
        offer_id: Number(tokenData.offerId),
        token_id: Number(tokenData.id),
        ad_parameter: "link",
        data: JSON.stringify({
          imageUrl: imageUrl,
          externalLink: externalLink,
        }),
      });
      console.log("assembledSubmitAdProposalTx", assembledSubmitAdProposalTx);
      
      await createAssembledTransaction(assembledSubmitAdProposalTx);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Success",
          message: "Ad proposal submitted successfully, waiting for review",
        })
      );
    } catch (e) {
      console.log("error submit ad proposal", e);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: e.message,
        })
      );
      // Optionally handle error and close modal
      // setProgressModalOpen(false);
    }
  };

  const handleCancelListing = async () => {
    if (!walletAddress || !listingId) return;

    setLoading(true);
    try {
      const marketplaceClient = new MarketplaceClient({
        rpcUrl: getChainDatas('marketplace').rpc,
        networkPassphrase: getChainDatas('marketplace').networkPassphrase,
        contractId: getChainDatas('marketplace').address,
        publicKey: walletAddress,
      });

      const assembledTx = await marketplaceClient.cancel_listing({
        listing_id: listingId,
        caller: walletAddress,
      });

      const result = await createAssembledTransaction(assembledTx);

      if (result) {
        dispatch(
          setNotification({
            isNotified: true,
            type: "Success",
            message: "Listing cancelled successfully!",
          })
        );
        setIsListed(false);
        setListingId(null);
      }
    } catch (error: any) {
      console.error('Error cancelling listing:', error);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: error.message || 'Failed to cancel listing',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#181926] py-10 px-4">
      {notification.isNotified && (
        <Notifications
          type={notification.type}
          message={notification.message}
        />
      )}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <Navbar />
        </div>
      </div>
      <div className="max-w-3xl mx-auto mt-10">
        {/* NFT image and info card */}
        <div className="flex flex-col items-center bg-[#23243a]/80 rounded-3xl shadow-2xl p-8 md:p-12 border border-purple-900/40 backdrop-blur-xl">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-gray-800 bg-white">
            <img src={tokenData.imageUrl} alt={tokenData.name} className="w-full h-48 object-cover" />
          </div>
          <div className="mt-4 text-center text-lg font-semibold text-white/90">{tokenData.name}</div>
          <div className="mt-2 text-sm text-gray-400">Token ID: {tokenData.id}</div>
          <div className="mt-2 text-xs text-purple-400">Owner: {tokenData.owner}</div>
          {isOwner && (
            <div className="w-full max-w-md mt-8 space-y-4">
              <Button
                color="violet"
                size="lg"
                radius="xl"
                fullWidth
                leftIcon={<IconSend size={22} />}
                className="font-bold text-lg py-3"
                onClick={() => setModalOpened(true)}
              >
                Submit ad
              </Button>
              {isListed ? (
                <Button
                  color="red"
                  size="lg"
                  radius="xl"
                  fullWidth
                  leftIcon={<IconX size={22} />}
                  className="font-bold text-lg py-3"
                  onClick={handleCancelListing}
                  loading={loading}
                >
                  Cancel Listing
                </Button>
              ) : (
                <Button
                  color="blue"
                  size="lg"
                  radius="xl"
                  fullWidth
                  leftIcon={<IconTag size={22} />}
                  className="font-bold text-lg py-3"
                  onClick={() => setListingModalOpened(true)}
                >
                  List Token for Sale
                </Button>
              )}
            </div>
          )}
        </div>
        <Modal
          opened={modalOpened}
          onClose={() => setModalOpened(false)}
          title={null}
          centered
          overlayProps={{ blur: 4 }}
          classNames={{ content: 'custom-modal-content' }}
          withCloseButton={false}
        >
          <div className="bg-[#181926]/90 rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-6 min-w-[320px] max-w-md mx-auto">
            <button
              onClick={() => setModalOpened(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
              aria-label="Close"
              type="button"
            >
              &times;
            </button>
            <div className="w-full flex flex-col items-center gap-1 mb-2">
              <div className="text-2xl font-extrabold text-white text-center mb-2">Submit Ad</div>
            </div>
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
              <TextInput
                label={<span className="text-white font-semibold">Image to show URL</span>}
                placeholder="https://..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.currentTarget.value)}
                required
                classNames={{ input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400', label: '' }}
              />
              <TextInput
                label={<span className="text-white font-semibold">External link</span>}
                placeholder="https://..."
                value={externalLink}
                onChange={(e) => setExternalLink(e.currentTarget.value)}
                required
                classNames={{ input: 'bg-[#23243a] text-white border-purple-500/30 focus:border-purple-400', label: '' }}
              />
              <Button type="submit" color="violet" radius="xl" size="md" fullWidth className="font-bold mt-2">
                Submit
              </Button>
            </form>
          </div>
        </Modal>

        {/* Token Listing Modal */}
        <TokenListingModal
          opened={listingModalOpened}
          onClose={() => setListingModalOpened(false)}
          tokenData={{
            id: Number(tokenData.id),
            contractAddress: tokenData.contractAddress,
            name: tokenData.name,
            imageUrl: tokenData.imageUrl,
          }}
        />

        <div className="mt-10">
          <TokenAdValidationSection offerId={Number(tokenData.offerId)} tokenId={Number(tokenData.id)} nftContract={tokenData.contractAddress} offerProposals={[]} />
        </div>
        <div className="mt-8">
          <TokenDetailsSection offer={tokenData} />
        </div>
      </div>
    </div>
  );
};

export default TokenPage; 