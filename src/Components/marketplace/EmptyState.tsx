import React from 'react';
import { Text, Button, Stack } from '@mantine/core';
import { IconShoppingCart, IconGavel, IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  type: 'all' | 'listings' | 'auctions';
  onCreateClick?: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onCreateClick }) => {
  const getContent = () => {
    switch (type) {
      case 'listings':
        return {
          icon: <IconShoppingCart size={48} className="text-purple-400" />,
          title: 'No Direct Sales Available',
          description: 'There are currently no NFTs listed for direct sale. Be the first to list your NFT!',
          actionText: 'List Your NFT',
        };
      case 'auctions':
        return {
          icon: <IconGavel size={48} className="text-orange-400" />,
          title: 'No Active Auctions',
          description: 'There are currently no active auctions. Start an auction for your NFT!',
          actionText: 'Start Auction',
        };
      default:
        return {
          icon: <IconShoppingCart size={48} className="text-gray-400" />,
          title: 'Marketplace is Empty',
          description: 'No NFTs are currently available for sale or auction. Be the first to list your NFT!',
          actionText: 'Get Started',
        };
    }
  };

  const content = getContent();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          {content.icon}
        </div>
        
        <Text size="xl" weight={600} className="text-white mb-3">
          {content.title}
        </Text>
        
        <Text size="md" color="dimmed" className="mb-8 leading-relaxed">
          {content.description}
        </Text>

        <Stack spacing="sm" align="center">
          <Button
            component={Link}
            to="/create"
            color="violet"
            size="lg"
            leftIcon={<IconPlus size={18} />}
            className="font-semibold"
          >
            {content.actionText}
          </Button>
          
          <Text size="sm" color="dimmed">
            or{' '}
            <Button
              variant="subtle"
              color="violet"
              size="sm"
              onClick={onCreateClick}
              className="p-0 h-auto"
            >
              browse existing offers
            </Button>
          </Text>
        </Stack>
      </div>
    </div>
  );
};

export default EmptyState;
