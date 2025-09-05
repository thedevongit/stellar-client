import React from 'react';
import { Accordion } from '@mantine/core';

interface OfferDetailsSectionProps {
  offer: {
    contractAddress: string;
    contractCreator: string;
    contractOwner: string;
    validityPeriod: string;
    royalties: number;
    tokenStandard: string;
    blockchain: string;
    termsUrl: string;
  };
}

const OfferDetailsSection: React.FC<OfferDetailsSectionProps> = ({ offer }) => {
  return (
    <Accordion
      variant="contained"
      defaultValue={null}
      className="mb-6"
      styles={{
        item: { background: 'none' },
        control: {
          transition: 'border 0.3s, color 0.3s, box-shadow 0.3s, background 0.3s',
          background: '#181926 !important',
          color: 'white !important',
        },
        content: {
          background: 'rgba(24, 25, 38, 0.95) !important',
          backdropFilter: 'blur(8px)',
          borderBottomLeftRadius: '1rem',
          borderBottomRightRadius: '1rem',
          borderTop: '1px solid #a855f7',
        },
        panel: {
          background: 'rgba(24, 25, 38, 0.95) !important',
          color: 'white !important',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <Accordion.Item value="details">
        <Accordion.Control
          className="rounded-xl border border-purple-500/60 text-white text-2xl font-extrabold px-8 py-4 flex items-center justify-between transition-all duration-300 shadow-lg backdrop-blur-xl
            hover:border-purple-400 focus:border-purple-400
            hover:shadow-[0_0_16px_2px_rgba(168,85,247,0.25)] focus:shadow-[0_0_24px_4px_rgba(168,85,247,0.35)]
            hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-purple-700/10 focus:bg-gradient-to-r focus:from-purple-900/30 focus:to-purple-700/10
            hover:text-transparent hover:bg-clip-text hover:from-purple-300 hover:to-purple-500 focus:text-transparent focus:bg-clip-text focus:from-purple-300 focus:to-purple-500"
          style={{ background: '#181926', color: 'white' }}
        >
          <span className="transition-all duration-300">Details</span>
        </Accordion.Control>
        <Accordion.Panel className="bg-transparent border-t border-purple-500/30 rounded-b-xl px-8 py-6 shadow-xl backdrop-blur-xl" style={{ background: 'rgba(24, 25, 38, 0.95)', color: 'white' }}>
          <div className="flex flex-col gap-3 text-base text-gray-300">
            <div>
              <span className="font-semibold text-white">Contract Address:</span>{' '}
              <a href={`https://stellar.expert/explorer/testnet/contract/${offer.contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">{offer.contractAddress}</a>
            </div>
            <div>
              <span className="font-semibold text-white">Token Standard:</span> SEP-0039
            </div>
            <div>
              <span className="font-semibold text-white">Blockchain:</span> Stellar
            </div>
          </div>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default OfferDetailsSection; 