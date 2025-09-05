import React from 'react';
import { Tooltip } from '@mantine/core';
import { useWallet } from '../../web3';
import { useTokens } from '../../hooks/tokens/useTokens';
import { useOffer } from '../../hooks/offer/useOffer';

interface StatCardProps {
  value: string | number;
  label: string;
  tooltip?: string;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, tooltip }) => (
  <div className="bg-[#1a1b23] rounded-xl p-8 relative border border-gray-800 hover:border-purple-500/50 transition-all duration-300">
    <Tooltip label={tooltip} disabled={!tooltip}>
      <div>
        <h2 className="text-5xl font-bold text-white mb-3">{value}</h2>
        <p className="text-gray-400 text-lg">{label}</p>
      </div>
    </Tooltip>
  </div>
);

const ProfileOverview: React.FC = () => {
  const {  walletAddress } = useWallet();
  const { data: offers } = useOffer("stellart", walletAddress || "");
  const { data: tokens } = useTokens('stellart', walletAddress, offers);
  const getTotalAds = (): number => {
    let totalAds = 0;
    tokens.map((token) => {
      totalAds += token.tokens.length;
    });
    return totalAds;
  }
  
  const stats = [
    { value: getTotalAds(), label: "Ad Spaces", tooltip: "Number of ad spaces owned" },
    { value: 0, label: "Boxes", tooltip: "Number of boxes earned" },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white mb-3">Overview</h1>
        <div className="flex items-center space-x-2">
          <p className="text-gray-400 text-sm font-mono break-all bg-[#1a1b23] px-4 py-2 rounded-lg border border-gray-800">
            {walletAddress}
          </p>
          <button 
            className="text-gray-400 hover:text-white bg-[#1a1b23] p-2 rounded-lg border border-gray-800 hover:border-purple-500/50 transition-all duration-300"
            onClick={() => navigator.clipboard.writeText(walletAddress)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default ProfileOverview; 