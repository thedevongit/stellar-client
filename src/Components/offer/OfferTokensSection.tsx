import React from 'react';
import { Accordion } from '@mantine/core';
import TokenList from '../token/TokenList';

interface OfferTokensSectionProps {
  tokens: any[];
  proposals: any[];
}

const OfferTokensSection: React.FC<OfferTokensSectionProps> = ({ tokens, proposals }) => {
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
      <Accordion.Item value="tokens">
        <Accordion.Control
          className="rounded-xl border border-purple-500/60 text-white text-2xl font-extrabold px-8 py-4 flex items-center justify-between transition-all duration-300 shadow-lg backdrop-blur-xl
            hover:border-purple-400 focus:border-purple-400
            hover:shadow-[0_0_16px_2px_rgba(168,85,247,0.25)] focus:shadow-[0_0_24px_4px_rgba(168,85,247,0.35)]
            hover:bg-gradient-to-r hover:from-purple-900/30 hover:to-purple-700/10 focus:bg-gradient-to-r focus:from-purple-900/30 focus:to-purple-700/10
            hover:text-transparent hover:bg-clip-text hover:from-purple-300 hover:to-purple-500 focus:text-transparent focus:bg-clip-text focus:from-purple-300 focus:to-purple-500"
          style={{ background: '#181926', color: 'white' }}
        >
          <span className="transition-all duration-300">Tokens</span>
        </Accordion.Control>
        <Accordion.Panel className="bg-transparent border-t border-purple-500/30 rounded-b-xl px-8 py-6 shadow-xl backdrop-blur-xl" style={{ background: 'rgba(24, 25, 38, 0.95)', color: 'white' }}>
          {tokens.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <TokenList tokens={tokens} />
            </div>
          ) : (
            <div className="text-gray-400 text-center">No tokens available</div>
          )}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
};

export default OfferTokensSection; 