import React from "react";
import { Accordion, Tabs } from "@mantine/core";
import { IconClock, IconCheck, IconX, IconHistory } from "@tabler/icons-react";
import AdCard from "./AdCard";
import { useWallet } from "../../web3";
import { useProposals } from "../../hooks/offer/useOfferTokenProposals";

const tabStyles = {
  tab: {
    color: "white",
    fontWeight: 700,
    fontSize: "1.15rem",
    background: "transparent",
    border: "none",
    padding: "0.75rem 1.5rem",
    borderRadius: "0.5rem 0.5rem 0 0",
    transition: "color 0.2s",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    "&:hover": {
      background: "transparent",
      color: "#a855f7",
    },
  },
  tabActive: {
    color: "#a855f7",
    borderBottom: "3px solid #a855f7",
    background: "transparent",
  },
  tabLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
  list: {
    borderBottom: "none",
    display: "flex",
    justifyContent: "center",
    gap: "2rem",
    background: "none",
  },
  panel: {
    background: "none",
    color: "white",
    padding: "2rem 0",
    minHeight: "120px",
  },
};

interface OfferAdValidationSectionProps {
  offerId: number;
  tokenId: number;
  nftContract: string;
  offerProposals: any[];
}

const OfferAdValidationSection: React.FC<OfferAdValidationSectionProps> = ({
  offerId,
  tokenId,
  nftContract,
  offerProposals,
}) => {
  const { walletAddress } = useWallet();
  let mockAd: any;
    const {
      data: proposals,
      loading: proposalsLoading,
      error: proposalsError,
    } = useProposals("stellart", walletAddress, offerId, tokenId, nftContract);
     mockAd = {
      imageUrl: proposals?.proposal.data
        ? JSON.parse(proposals.proposal.data).imageUrl
        : undefined,
      externalUrl: proposals?.proposal.data
        ? JSON.parse(proposals.proposal.data).externalLink
        : undefined,
      isPending: proposals?.proposal.last_submitted
        ? proposals.proposal.last_submitted > 0
        : false,
      isValidated: proposals?.proposal.last_validated
        ? proposals.proposal.last_validated > 0
        : false,
      isRefused: proposals?.proposal.last_rejected
        ? proposals.proposal.last_rejected > 0
        : false,
      admin: proposals?.admin,
      proposalId: proposals?.proposal.last_submitted,
    };
  
  const mockAds = offerProposals.map((proposal: any) => ({
    imageUrl: proposal.proposal.data ? JSON.parse(proposal.proposal.data).imageUrl : undefined,
    externalUrl: proposal.proposal.data
      ? JSON.parse(proposal.proposal.data).externalLink
      : undefined,
    isPending: proposal.proposal.last_submitted ? proposal.proposal.last_submitted > 0 : false,
    isValidated: proposal.proposal.last_validated ? proposal.proposal.last_validated > 0 : false,
    isRefused: proposal.proposal.last_rejected ? proposal.proposal.last_rejected > 0 : false,
    admin: proposal.admin,
    proposalId: proposal.proposal.last_submitted,
    tokenId: proposal.tokenId,
  }));

  return (
    <Accordion
      variant="contained"
      defaultValue={null}
      className="mb-6"
      styles={{
        item: { background: "none" },
        control: {
          transition:
            "border 0.3s, color 0.3s, box-shadow 0.3s, background 0.3s",
          background: "#181926 !important",
          color: "white !important",
        },
        content: {
          background: "rgba(24, 25, 38, 0.95) !important",
          backdropFilter: "blur(8px)",
          borderBottomLeftRadius: "1rem",
          borderBottomRightRadius: "1rem",
          borderTop: "1px solid #a855f7",
        },
        panel: {
          background: "rgba(24, 25, 38, 0.95) !important",
          color: "!important",
          backdropFilter: "blur(8px)",
        },
      }}
    >
      <Accordion.Item value="ad-validation">
        <Accordion.Control
          className="rounded-xl border border-purple-500/60 text-white text-2xl font-extrabold px-8 py-4 flex items-center justify-between transition-all duration-300 shadow-lg backdrop-blur-xl
            hover:border-purple-400 focus:border-purple-400
            hover:shadow-[0_0_16px_2px_rgba(168,85,247,0.25)] focus:shadow-[0_0_24px_4px_rgba(168,85,247,0.35)]
            hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-purple-700/10 focus:bg-gradient-to-r focus:from-purple-900/30 focus:to-purple-700/10
            hover:text-transparent hover:bg-clip-text hover:from-purple-300 hover:to-purple-500 focus:text-transparent focus:bg-clip-text focus:from-purple-300 focus:to-purple-500"
          style={{ background: "#181926", color: "" }}
        >
          <span className="transition-all duration-300">Ad Validation</span>
        </Accordion.Control>
        <Accordion.Panel className="bg-transparent border-t border-purple-500/30 rounded-b-xl px-8 py-6 shadow-xl backdrop-blur-xl">
          <Tabs defaultValue="pending" styles={tabStyles}>
            <Tabs.List>
              <Tabs.Tab value="pending" icon={<IconClock size={18} />}>
                Pending 
              </Tabs.Tab>
              <Tabs.Tab value="validated" icon={<IconCheck size={18} />}>
                Validated
              </Tabs.Tab>
              <Tabs.Tab value="refused" icon={<IconX size={18} />}>
                Refused
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="pending">
              {mockAds && mockAds.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-8 justify-center items-start mt-8 max-w-4xl mx-auto">
                  {mockAds
                    .filter((ad) => ad.isPending)
                    .map((ad, idx) => (
                      <div key={idx} className="w-[340px]">
                        <AdCard
                          offerId={offerId}
                          tokenId={ad.tokenId}
                          proposalId={ad.proposalId}
                          imageUrl={ad.imageUrl}
                          externalUrl={ad.externalUrl}
                          admin={ad.admin}
                          hideReviewButton={false}
                        />
                      </div>
                    ))}
                </div>
              ) : mockAd.isPending ? (
                <div className="flex justify-center mt-8">
                  <AdCard
                    offerId={offerId}
                    tokenId={tokenId}
                    proposalId={mockAd.proposalId}
                    imageUrl={mockAd.imageUrl}
                    externalUrl={mockAd.externalUrl}
                    admin={mockAd.admin}
                    hideReviewButton={false}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center mt-8">
                  No pending ads.
                </div>
              )}
            </Tabs.Panel>
            <Tabs.Panel value="validated">
              {mockAds && mockAds.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-8 justify-center items-start mt-8 max-w-4xl mx-auto">
                  {mockAds
                    .filter((ad) => ad.isValidated)
                    .map((ad, idx) => (
                      <div key={idx} className="w-[340px]">
                        <AdCard
                          offerId={offerId}
                          tokenId={ad.tokenId}
                          proposalId={ad.proposalId}
                          imageUrl={ad.imageUrl}
                          externalUrl={ad.externalUrl}
                          admin={ad.admin}
                          hideReviewButton={true}
                        />
                      </div>
                    ))}
                </div>
              ) : mockAd.isValidated ? (
                <div className="flex justify-center mt-8">
                  <AdCard
                    offerId={offerId}
                    tokenId={tokenId}
                    proposalId={mockAd.proposalId}
                    imageUrl={mockAd.imageUrl}
                    externalUrl={mockAd.externalUrl}
                    admin={mockAd.admin}
                    hideReviewButton={true}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center mt-8">
                  No validated ads yet.
                </div>
              )}
            </Tabs.Panel>
            <Tabs.Panel value="refused">
              {mockAds && mockAds.length > 0 ? (
                <div className="flex flex-row flex-wrap gap-8 justify-center items-start mt-8 max-w-4xl mx-auto">
                  {mockAds
                    .filter((ad) => ad.isRefused)
                    .map((ad, idx) => (
                      <div key={idx} className="w-[340px]">
                        <AdCard
                          offerId={offerId}
                          tokenId={ad.tokenId}
                          proposalId={ad.proposalId}
                          imageUrl={ad.imageUrl}
                          externalUrl={ad.externalUrl}
                          admin={ad.admin}
                          hideReviewButton={true}
                        />
                      </div>
                    ))}
                </div>
              ) : mockAd.isRefused ? (
                <div className="flex justify-center mt-8">
                  <AdCard
                    offerId={offerId}
                    tokenId={tokenId}
                    proposalId={mockAd.proposalId}
                    imageUrl={mockAd.imageUrl}
                    externalUrl={mockAd.externalUrl}
                    admin={mockAd.admin}
                    hideReviewButton={true}
                  />
                </div>
              ) : (
                <div className="text-gray-400 text-center mt-8">
                  No refused ads.
                </div>
              )}
            </Tabs.Panel>
          </Tabs>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default OfferAdValidationSection;
