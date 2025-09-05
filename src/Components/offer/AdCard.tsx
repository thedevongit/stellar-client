import React, { useState } from "react";
import { Button, Modal, TextInput } from "@mantine/core";
import {
  IconExternalLink,
  IconCheck,
  IconX,
  IconSend,
} from "@tabler/icons-react";
import { useWallet } from "../../web3";
import {Client, } from "soroban-dsponsor";
import { getChainDatas } from "../../utils";

interface AdCardProps {
  imageUrl?: string;
  externalUrl?: string;
  admin?: string | null;
  offerId: number;
  tokenId: number;
  proposalId: number;
  hideReviewButton?: boolean;
}

const AdCard: React.FC<AdCardProps> = ({ imageUrl, externalUrl, admin, offerId, tokenId, proposalId, hideReviewButton }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const { walletAddress, createAssembledTransaction } = useWallet();

  const handleSubmit = async (e: React.FormEvent, validated: boolean) => {
    e.preventDefault();
    let client = new Client({
      rpcUrl: getChainDatas('stellart').rpc,
      networkPassphrase: getChainDatas('stellart').networkPassphrase,
      contractId: getChainDatas('stellart').address,
      publicKey: walletAddress,
    });
    let assembledReviewAdTx = await client.review_ad_proposal({
      offer_id: Number(offerId),
      token_id: Number(tokenId),
      proposal_id: proposalId,
      ad_parameter: 'link',
      validated: validated,
      reason: validated ? 'Ad approved, valid and compliant with the offer' : 'Ad rejected, invalid or not compliant with the offer',
      validator: walletAddress,
    });
    await createAssembledTransaction(assembledReviewAdTx);
    setModalOpened(false);
  };

  const isAdmin = admin === walletAddress;

  return (
    <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-lg border border-gray-800 bg-white">
      <img src={imageUrl} alt="Ad" className="w-full h-48 object-cover" />
      <div className="p-4 bg-[#1a1a2e]">
        <div className="flex justify-center gap-4">
          <a href={externalUrl?.startsWith('http') ? externalUrl : `https://${externalUrl}`} target="_blank" rel="noopener noreferrer">
          <Button
            color="violet"
            size="md"
            radius="xl"
            className="font-bold"
          >
            View
          </Button>
          </a>
          {isAdmin && !hideReviewButton && (
            <Button
              color="violet"
              size="md"
              radius="xl"
              leftIcon={<IconSend size={22} />}
              className="font-bold"
              onClick={() => setModalOpened(true)}
            >
              Review
            </Button>
          )}
        </div>
      </div>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={null}
        centered
        overlayProps={{ blur: 4 }}
        classNames={{ content: "custom-modal-content" }}
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
            <div className="text-2xl font-extrabold text-white text-center mb-2">
              Review Ad
            </div>
            <img src={imageUrl} alt="Ad" className="w-full h-48 object-cover rounded-lg" />
          </div>
          <form className="w-full flex flex-col gap-6">
            <Button
              type="button"
              color="violet"
              radius="xl"
              size="md"
              fullWidth
              className="font-bold mt-2"
              onClick={e => handleSubmit(e, true)}
            >
              Approve
            </Button>
            <Button
              type="button"
              color="red"
              radius="xl"
              size="md"
              fullWidth
              className="font-bold"
              onClick={e => handleSubmit(e, false)}
            >
              Reject
            </Button>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default AdCard;
