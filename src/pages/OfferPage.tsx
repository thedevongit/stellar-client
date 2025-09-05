import React from "react";
import OfferDetails from "../Components/offer/OfferDetails";
import OfferTokensSection from "../Components/offer/OfferTokensSection";
import OfferAdValidationSection from "../Components/offer/OfferAdValidationSection";
import OfferDetailsSection from "../Components/offer/OfferDetailsSection";
import { Navbar } from "../Components";
import styles from "../styles/style";
import { useSearchParams } from "react-router-dom";
import { useOfferDetails } from "../hooks/offer/useOfferDetails";
import { useSelector } from "react-redux";
import Notifications from "../Components/common/Notif";

const OfferPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const creator = searchParams.get("creator");
  const id = searchParams.get("id");
  const { data, loading, error } = useOfferDetails("stellart", creator || "", id || "");
  const { notification } = useSelector((state: any) => state.common);

  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] text-white">
          <Navbar />
          <center>
        <div className="text-white">Loading offer details...</div>
          </center>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error || "No data available"}</div>
      </div>
    );
  }

  const metadata = data.offer.offer_metadata;

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
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
     <center> <p className="text-white text-2xl font-bold mt-16">Offer</p> </center>
     
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full">
          {/* Left Column - Offer Details */}
          <div className="lg:col-span-2">
            <OfferDetails
              offer={{
                id: data.offer.id,
                title: metadata.title,
                illustration: metadata.illustration,
                currency: metadata.currency,
                currencyAddress: metadata.currencyAddress,
                adSpaceLocation: metadata.exposureUrl || "N/A",
                displayPeriod: `${new Date(metadata.startDate).toLocaleDateString()} - ${new Date(metadata.endDate).toLocaleDateString()}`,
                available: 0,
                total: 0,
                creator: Object.keys(data.offer.admins)[0],
                royalties: metadata.royalties || 0,
                description: metadata.description,
                isDisabled: data.offer.disabled,
                lastSales: [],
                contractAddress: data.offer.nft_contract,
                contractCreator: data.offer.admins[0],
                contractOwner: data.offer.admins[0],
                validityPeriod: `${new Date(metadata.startDate).toLocaleDateString()} - ${new Date(metadata.endDate).toLocaleDateString()}`,
                tokenStandard: "SEP-0039",
                blockchain: "Stellar",
                termsUrl: metadata.legalUrl || "#",
                price: metadata.price  || "N/A",
                status: data.offer.disabled ? "closed" : "active",
                startDate: `${new Date(metadata.startDate).toLocaleDateString()}`,
                endDate: `${new Date(metadata.endDate).toLocaleDateString()}`
              }}
            />
            <div className="mt-8 ">
            <OfferTokensSection
              tokens={data.tokens}
              proposals={data.proposals}
            />
              <OfferAdValidationSection offerId={data.offer.id} tokenId={data.tokens[0].token_id}  nftContract={data.offer.nft_contract} offerProposals={data.proposals} />
              <OfferDetailsSection 
                offer={{
                  contractAddress: data.offer.nft_contract,
                  contractCreator: data.offer.admins[0],
                  contractOwner: data.offer.admins[0],
                  validityPeriod: `${new Date(metadata.startDate).toLocaleDateString()} - ${new Date(metadata.endDate).toLocaleDateString()}`,
                  royalties: data.offer.royalties || 0,
                  tokenStandard: "SEP-0039",
                  blockchain: "Stellar",
                  termsUrl: metadata.legalUrl || "#"
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferPage;
