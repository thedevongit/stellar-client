import React from "react";
import OfferCard from "./OfferCard";
import { SponsoringOffer } from "soroban-dsponsor";
import { useNavigate } from "react-router-dom";

interface OfferListProps {
  offers: SponsoringOffer[];
}

interface OfferMetadata {
  title?: string;
  description?: string;
  illustration?: string;
  price?: string;
  startDate?: string;
  endDate?: string;
  currency?: string;
}

const OfferList: React.FC<OfferListProps> = ({ offers }) => {
  const navigate = useNavigate();

  if (!offers || !Array.isArray(offers)) {
    return (
      <div className="w-full mt-8">
        <h2 className="text-2xl font-bold text-white mb-4">Offers</h2>
        <div className="text-gray-400">No offers available</div>
      </div>
    );
  }

  const handleViewDetails = (creator: string, id: string) => {
    const params = new URLSearchParams({
      creator,
      id
    });
    navigate(`/offer?${params.toString()}`);
  };

  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">Offers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((offer, idx) => {
          let metadata: OfferMetadata = {};
          try {
            console.log("Offer in OfferList", offer);
            metadata = JSON.parse(offer.offer_metadata) as OfferMetadata;
            console.log("Metadata in OfferList", metadata);
          } catch (e) {
            console.error("Failed to parse offer metadata:", e);
          }
          return (
            <OfferCard
              key={idx}
              title={metadata.title || `Offer ${idx + 1}`}
              creator={Object.keys(offer.admins)[0]}
              price={metadata.price ? metadata.price + " " + (metadata.currency || "N/A") : "N/A"}
              status={offer.disabled ? "closed" : "active"}
              startDate={metadata.startDate ? new Date(metadata.startDate).toLocaleDateString() : "N/A"}
              endDate={metadata.endDate ? new Date(metadata.endDate).toLocaleDateString() : "N/A"}
              imageUrl={metadata.illustration || ""}
              onView={() => handleViewDetails(Object.keys(offer.admins)[0], offer.id.toString())}
            />
          );
        })}
      </div>
    </div>
  );
};

export default OfferList;
