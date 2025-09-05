import React from 'react';
import { Button, Group, Text, Badge, SegmentedControl } from '@mantine/core';
import { IconShoppingCart, IconGavel, IconFilter } from '@tabler/icons-react';

interface MarketplaceFiltersProps {
  activeTab: 'all' | 'listings' | 'auctions';
  onTabChange: (tab: 'all' | 'listings' | 'auctions') => void;
  listingsCount: number;
  auctionsCount: number;
}

const MarketplaceFilters: React.FC<MarketplaceFiltersProps> = ({
  activeTab,
  onTabChange,
  listingsCount,
  auctionsCount,
}) => {
  return (
    <div className="bg-[#23243a]/80 rounded-2xl p-6 border border-purple-900/40 backdrop-blur-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Title and Stats */}
        <div>
          <Text size="xl" weight={700} className="text-white mb-2">
            Marketplace
          </Text>
          <Group spacing="lg">
            <div className="flex items-center gap-2">
              <IconShoppingCart size={16} className="text-purple-400" />
              <Text size="sm" color="dimmed">
                {listingsCount} Direct Sales
              </Text>
            </div>
            <div className="flex items-center gap-2">
              <IconGavel size={16} className="text-orange-400" />
              <Text size="sm" color="dimmed">
                {auctionsCount} Auctions
              </Text>
            </div>
          </Group>
        </div>

        {/* Filter Tabs */}
        <div className="w-full md:w-auto">
          <SegmentedControl
            value={activeTab}
            onChange={(value) => onTabChange(value as 'all' | 'listings' | 'auctions')}
            data={[
              {
                value: 'all',
                label: (
                  <div className="flex items-center gap-2">
                    <span>All</span>
                    <Badge size="xs" color="gray" variant="filled">
                      {listingsCount + auctionsCount}
                    </Badge>
                  </div>
                ),
              },
              {
                value: 'listings',
                label: (
                  <div className="flex items-center gap-2">
                    <IconShoppingCart size={14} />
                    <span>Sales</span>
                    <Badge size="xs" color="purple" variant="filled">
                      {listingsCount}
                    </Badge>
                  </div>
                ),
              },
              {
                value: 'auctions',
                label: (
                  <div className="flex items-center gap-2">
                    <IconGavel size={14} />
                    <span>Auctions</span>
                    <Badge size="xs" color="orange" variant="filled">
                      {auctionsCount}
                    </Badge>
                  </div>
                ),
              },
            ]}
            classNames={{
              root: 'bg-[#181926] border border-gray-700',
              control: 'text-white hover:bg-purple-600/20',
              controlActive: 'bg-purple-600 text-white',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MarketplaceFilters;
