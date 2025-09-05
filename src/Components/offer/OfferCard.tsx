import React from 'react';
import { Badge, Button, Tooltip } from '@mantine/core';
import { IconUser, IconCalendar, IconCurrencyDollar, IconExternalLink, IconCheck, IconClock } from '@tabler/icons-react';

interface OfferCardProps {
  title: string;
  imageUrl: string;
  creator: string;
  price: string;
  status: 'active' | 'closed';
  startDate: string;
  endDate: string;
  onView?: () => void;
}

const statusColors = {
  active: 'green',
  closed: 'red',
};

const statusIcons = {
  active: <IconCheck size={16} />,
  closed: <IconClock size={16} />,
};

const OfferCard: React.FC<OfferCardProps> = ({
  title,
  imageUrl,
  creator,
  price,
  status,
  startDate,
  endDate,
  onView,
}) => {
  return (
    <div className="relative rounded-2xl bg-[rgba(24,25,38,0.85)] border border-purple-500/30 shadow-xl backdrop-blur-xl p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:border-purple-400/60">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-extrabold text-white mb-2">{title}</h3>
        <Badge
          color={statusColors[status]}
          leftSection={statusIcons[status]}
          size="lg"
          variant="light"
          className="uppercase tracking-wide"
        >
          {status}
        </Badge>
      </div>
      <img
        src={imageUrl}
        alt={title}
        className="w-full h-40 object-cover rounded-xl mb-2 border border-purple-500/20 shadow-md"
      />
      <div className="flex flex-col gap-2 text-gray-300 text-base">
        <div className="flex items-center gap-2">
          <IconUser size={18} className="text-purple-400" />
          <span className="font-semibold text-white">Creator:</span>
          <Tooltip label={creator} withArrow>
            <span className="truncate max-w-[120px] text-purple-300">{creator}</span>
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <IconCurrencyDollar size={18} className="text-purple-400" />
          <span className="font-semibold text-white">Price:</span>
          <span className="text-purple-300">{price}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconCalendar size={18} className="text-purple-400" />
          <span className="font-semibold text-white">Start:</span>
          <span>{startDate}</span>
        </div>
        <div className="flex items-center gap-2">
          <IconCalendar size={18} className="text-purple-400" />
          <span className="font-semibold text-white">End:</span>
          <span>{endDate}</span>
        </div>
      </div>
      <Button
        fullWidth
        radius="xl"
        size="md"
        color="violet"
        className="mt-2 font-bold shadow-md transition-all duration-200 hover:scale-105"
        onClick={onView}
      >
        View Details
        <IconExternalLink size={18} className="ml-2" />
      </Button>
    </div>
  );
};

export default OfferCard; 