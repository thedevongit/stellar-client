import React from 'react';
import TokenCard from './TokenCard';
import { Tokens } from '../../hooks/tokens/useTokens';


const TokenList: React.FC<{ tokens: Tokens[] }> = ({ tokens }) => {
  return (
    <div className="w-full mt-8">
      <h2 className="text-2xl font-bold text-white mb-4">NFT Tokens</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tokens.map((tokenData, idx) => (
          tokenData.tokens.map((token, idx) => (
            <TokenCard key={idx} imageUrl={token.token_uri} name={token.token_name} tokenId={token.token_id.toString()} owner={token.token_owner} contractAddress={tokenData.nft_contract} offerId={tokenData.offer_id.toString()} />
          ))
        ))}
      </div>
    </div>
  );
};

export default TokenList; 