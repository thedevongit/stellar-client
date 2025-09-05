import React from 'react';
import { Button, Tooltip } from '@mantine/core';
import { IconUser, IconExternalLink } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

interface TokenCardProps {
  imageUrl: string;
  name: string;
  tokenId: string;
  owner: string;
  contractAddress: string;
  offerId: string;
  onView?: () => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ imageUrl, name, tokenId, owner, contractAddress, offerId, onView }) => {
  const navigate = useNavigate();

  const handleViewToken = () => {
    const tokenData = {
      id: tokenId,
      name: name,
      owner: owner,
      imageUrl: imageUrl,
      contractAddress: contractAddress,
      offerId: offerId
    };
    navigate(`/token?data=${encodeURIComponent(JSON.stringify(tokenData))}`);
  };

  return (
    <div className="relative rounded-2xl bg-[rgba(24,25,38,0.85)] border border-purple-500/30 shadow-xl backdrop-blur-xl p-5 flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:border-purple-400/60">
      <div className="w-full h-40 rounded-xl overflow-hidden border border-purple-500/20 shadow-md bg-[#23243a] flex items-center justify-center">
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex flex-col gap-1 mt-2">
        <div className="text-lg font-extrabold text-white truncate">{name}</div>
        <div className="text-xs text-purple-400 font-mono">Token ID: {tokenId}</div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <IconUser size={16} className="text-purple-400" />
          <Tooltip label={owner} withArrow>
            <span className="truncate max-w-[100px] text-purple-300">{owner}</span>
          </Tooltip>
        </div>
      </div>
      <Button
        fullWidth
        radius="xl"
        size="md"
        color="violet"
        className="mt-2 font-bold shadow-md transition-all duration-200 hover:scale-105"
        onClick={handleViewToken}
        // rightSection={<IconExternalLink size={18} className="ml-2" />}
      >
        View
      </Button>
    </div>
  );
};

export default TokenCard; 