import React, { useState } from "react";
import { Button, Modal, Checkbox } from "@mantine/core";
import { IconShoppingCart } from "@tabler/icons-react";
import OfferDetailsSection from "./OfferDetailsSection";
import { useTokenId } from "../../hooks/tokens/useTokenId";
import "./OfferDetails.css";
import { Client, MintAndSubmitParams } from "soroban-dsponsor";
import {
  getChainDatas,
  stellarLedgerExpiration,
  stellarTokenDecimal,
} from "../../utils";
import { useWallet } from "../../web3";
import * as StellarSdk from "@stellar/stellar-sdk";
import { useDispatch } from "react-redux";
import { setNotification } from "../../stores/common";

interface OfferDetailsProps {
  offer: {
    id: string;
    title: string;
    illustration: string;
    adSpaceLocation: string;
    displayPeriod: string;
    available: number;
    currency: string;
    currencyAddress: string;
    total: number;
    creator: string;
    royalties: number;
    description: string;
    isDisabled: boolean;
    lastSales: number[];
    contractAddress: string;
    contractCreator: string;
    contractOwner: string;
    validityPeriod: string;
    tokenStandard: string;
    blockchain: string;
    termsUrl: string;
    price?: string;
    status?: "active" | "closed";
    startDate?: string;
    endDate?: string;
  };
}

const OfferDetails: React.FC<OfferDetailsProps> = ({ offer }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [approved, setApproved] = useState(false);
  const { walletAddress, createAssembledTransaction, stellarApprove } =
    useWallet();
  const {
    data: tokenId,
    loading: tokenLoading,
    error: tokenError,
  } = useTokenId("stellart", offer.creator, offer.contractAddress);
  const dispatch = useDispatch();


  const handleApprove = async () => {
    try {
      let decimal = await stellarTokenDecimal(
        "stellart",
        walletAddress,
        offer.currencyAddress
      );
      let withDecimals = offer.price ? (Number(offer.price) + 10) * 10 ** Number(decimal) : 0;
      let sequence = await stellarLedgerExpiration("stellart");
      let expirationLedger: StellarSdk.xdr.ScVal = StellarSdk.nativeToScVal(
        sequence + 3000000,
        {
          type: "u32",
        }
      );
      let convertAmount: StellarSdk.xdr.ScVal = StellarSdk.nativeToScVal(
        withDecimals,
        { type: "i128" }
      );

      console.log(
        "Approving",
        offer.currency,
        walletAddress,
        getChainDatas("stellart").address,
        convertAmount,
        expirationLedger
      );
      await stellarApprove(
        offer.currencyAddress,
        false,
        new StellarSdk.Address(walletAddress).toScVal(),
        new StellarSdk.Address(getChainDatas("stellart").address).toScVal(),
        convertAmount,
        expirationLedger
      );
      dispatch(
        setNotification({
          isNotified: true,
          type: "Success",
          message: "Token approved successfully",
        })
      );
      setApproved(true);
    } catch (e) {
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: e.message,
        })
      );
      console.error(e);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log("Token id", tokenId);
      // Step 1: Create NFT
      let mintAndSubmitParams: MintAndSubmitParams = {
        token_id: Number(tokenId) + 1,
        to: walletAddress,
        currency: offer.currencyAddress,
        token_data: "",
        offer_id: Number(offer.id),
        ad_parameters: [],
        ad_datas: [],
        referral_info: "",
      };
      let client = new Client({
        rpcUrl: getChainDatas("stellart").rpc,
        networkPassphrase: getChainDatas("stellart").networkPassphrase,
        contractId: getChainDatas("stellart").address,
        publicKey: walletAddress,
      });
      let assembledCreateNFTTx = await client.mint_and_submit({
        params: mintAndSubmitParams,
      });
      await createAssembledTransaction(assembledCreateNFTTx);
      dispatch(
        setNotification({
          isNotified: true,
          type: "Success",
          message: "Offer token minted successfully",
        })
      );
    } catch (e) {
      // Optionally handle error and close modal
      // setProgressModalOpen(false);
      console.log({e});
      dispatch(
        setNotification({
          isNotified: true,
          type: "Error",
          message: e.message,
        })
      );
    }
  };

  const handleBuy = async () => {
    try {
      await handleSubmit();
      setModalOpened(false);
      setApproved(false);
      setAgreed(false);
    } catch (e) {
      console.error("Error buying:", e);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-10  mx-auto bg-[#23243a]/80 rounded-3xl shadow-2xl p-8 md:p-12 border border-purple-900/40 backdrop-blur-xl">
      {/* Left: Image and preview */}
      <div className="flex-1 flex flex-col items-center justify-start">
        <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-gray-800 bg-white">
          <img
            src={offer.illustration}
            alt={offer.title}
            className="w-full h-48 object-cover"
          />
        </div>
        <div className="mt-4 text-center text-lg font-semibold text-white/90">
          {offer.title}
        </div>
        <div className="mt-2 text-sm text-gray-400">
          {offer.adSpaceLocation}
        </div>
      </div>
      {/* Right: Details */}
      <div className="flex-1 flex flex-col gap-6">
        <div>
          <a
            href={`https://stellar.expert/explorer/testnet/account/${offer.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-purple-400 hover:underline break-all"
          >
            {offer.id}
          </a>
          <h1 className="text-3xl font-extrabold text-white mt-2 mb-2">
            {offer.title}
          </h1>
          <div className="flex flex-wrap gap-3 items-center text-sm text-gray-300 mb-2">
            <span className="text-purple-400 font-semibold">
              Creator {offer.royalties}% royalties
            </span>
            <span>
              Ad Space location:{" "}
              <span className="font-semibold text-white">
                {offer.adSpaceLocation}
              </span>
            </span>
          </div>
          <div className="text-sm text-gray-400 mb-2">
            <span className="font-semibold text-white">Display period:</span>{" "}
            {offer.displayPeriod}
          </div>
        </div>
        <div className="text-white/90 whitespace-pre-line text-base leading-relaxed mb-4">
          {offer.description}
        </div>
        <div className="mt-8">
          {offer.isDisabled ? (
            <Button
              color="red"
              size="lg"
              radius="xl"
              fullWidth
              disabled
              className="font-bold text-lg py-3"
            >
              This offer is disabled
            </Button>
          ) : (
            <>
              <Button
                color="violet"
                size="lg"
                radius="xl"
                fullWidth
                leftIcon={<IconShoppingCart size={22} />}
                className="font-bold text-lg py-3"
                onClick={() => setModalOpened(true)}
              >
                Buy this offer
              </Button>
              <Modal
                opened={modalOpened}
                onClose={() => {
                  setModalOpened(false);
                  setApproved(false);
                  setAgreed(false);
                }}
                title={null}
                centered
                overlayProps={{ blur: 4 }}
                classNames={{ content: "custom-modal-content" }}
                withCloseButton={false}
              >
                <button
                  onClick={() => {
                    setModalOpened(false);
                    setApproved(false);
                    setAgreed(false);
                  }}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl z-10"
                  aria-label="Close"
                  type="button"
                >
                  &times;
                </button>
                <div className="bg-[#181926]/90 rounded-2xl shadow-2xl p-6 md:p-8 flex flex-col items-center gap-6 min-w-[320px] max-w-md mx-auto">
                  <div className="w-32 h-32 rounded-xl overflow-hidden border-2 border-purple-500/30 shadow-md flex items-center justify-center bg-[#23243a]">
                    <img
                      src={offer.illustration}
                      alt={offer.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center gap-1">
                    <div className="text-2xl font-extrabold text-white text-center">
                      {offer.title}
                    </div>
                    {offer.price && (
                      <div className="text-xl font-bold text-purple-400 mt-1">
                        {offer.price} {offer.currency}
                      </div>
                    )}
                  </div>
                  <div className="w-full flex flex-col gap-1 bg-[#23243a]/80 rounded-lg p-4 text-sm text-gray-300">
                    {offer.startDate && offer.endDate && (
                      <div>
                        <span className="font-semibold text-white">
                          Period:
                        </span>{" "}
                        {offer.startDate} to {offer.endDate}
                      </div>
                    )}
                    {offer.status && (
                      <div>
                        <span className="font-semibold text-white">
                          Status:
                        </span>{" "}
                        <span className="capitalize">{offer.status}</span>
                      </div>
                    )}
                  </div>
                  <Checkbox
                    checked={agreed}
                    onChange={(event) => setAgreed(event.currentTarget.checked)}
                    label={
                      <span className="text-white">
                        I agree to the{" "}
                        <a
                          href={offer.termsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 underline"
                        >
                          terms and conditions
                        </a>
                      </span>
                    }
                    color="violet"
                    className="w-full mt-2"
                  />
                  <div className="flex gap-4 w-full mt-2">
                    <Button
                      fullWidth
                      color="gray"
                      radius="xl"
                      size="md"
                      onClick={handleApprove}
                      disabled={approved}
                    >
                      {approved ? "Approved" : "Approve"}
                    </Button>
                    <Button
                      fullWidth
                      color="violet"
                      radius="xl"
                      size="md"
                      disabled={!agreed || !approved}
                      onClick={handleBuy}
                    >
                      Buy now
                    </Button>
                  </div>
                </div>
              </Modal>
            </>
          )}
        </div>
        {/* Details accordion moved here for context, but can be rendered outside if needed */}
        {/* <OfferDetailsSection offer={offer} /> */}
      </div>
    </div>
  );
};

export default OfferDetails;
