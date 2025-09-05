import React from 'react';
import { Link } from 'react-router-dom';
import { IconArrowUpRight } from '@tabler/icons-react';
import OfferList from '../offer/OfferList';
import { useOffers } from '../../hooks/offer/useOffers';
import { useWallet } from '../../web3';

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div className="bg-[#1a1b23] rounded-xl p-8 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1">
    <div className="text-5xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
      {value}
    </div>
    <div className="text-gray-400 text-lg">{label}</div>
  </div>
);

const StepCard: React.FC<{ number: string; title: string; description: string; link?: { text: string; url: string } }> = 
  ({ number, title, description, link }) => (
    <div className="bg-[#1a1b23] rounded-xl p-8 border border-gray-800 hover:border-purple-500/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-purple-500/10 rounded-lg p-3">
          <span className="text-xl font-bold text-purple-400">{number}</span>
        </div>
        <div>
          <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
          <p className="text-gray-400 mb-4 leading-relaxed">{description}</p>
          {link && (
            <a 
              href={link.url} 
              className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm group"
            >
              {link.text}
              <IconArrowUpRight 
                size={16} 
                className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" 
              />
            </a>
          )}
        </div>
      </div>
    </div>
  );

const FeatureCard: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="bg-[#1a1b23] rounded-xl p-8 border border-gray-800 hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1">
    <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
    <p className="text-gray-400 leading-relaxed">{description}</p>
  </div>
);

const Show: React.FC = () => {
  const stats = [
    {
      value: "3+",
      label: "Publishers",
    },
    {
      value: "$10k+",
      label: "Sponsorship revenue",
    },
    {
      value: "150+",
      label: "Transactions",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Acquire an Ad Space Token",
      description: "Explore the available offers and decide whether to buy or bid based on the potential you see.",
    },
    {
      number: "2",
      title: "Submit Your Ad",
      description: "As the token holder, you have the exclusive right to submit an ad for the designated space.",
    },
    {
      number: "3",
      title: "Wait for Ad Approval",
      description: "Once your ad is approved, it will appear on the relevant platforms.",
      link: {
        text: "See example with 'Bitcoin' search for the SiBorg app offer",
        url: "#",
      },
    },
    {
      number: "4",
      title: "Keep or Sell Your Ad Space Token",
      description: "You can update your ad at any time, or choose to sell your token whenever you wish.",
    },
  ];

  const features = [
    {
      title: "Boost Visibility",
      description: "Use tokens to increase your brand's presence and reach your target audience effectively.",
    },
    {
      title: "Ad Space as a New Opportunity",
      description: "Convert ad spaces into valuable digital assets that can be traded on the marketplace.",
    },
    {
      title: "Effortless Ad Submission",
      description: "Streamlined process to submit and manage your ads across multiple publishers.",
    },
  ];
  const {walletAddress} = useWallet();
  const {data: offers, loading, error} = useOffers('stellart', walletAddress);
  return (
    <div className="w-full py-16 px-4 bg-[#13141a]">
        <div className="max-w-7xl mx-auto mb-24">
        <h2 className="text-4xl font-bold text-white mb-4">Discover the best toknized ad spaces </h2>
        <div className="grid grid-cols-1 ">
        <OfferList offers={offers && offers.length > 0 ? offers?.slice(0, 3) : []} />
        </div>
      </div>
      {/* Stats Section */}
      <div className="max-w-7xl mx-auto mb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>
      </div>

      {/* How does it work section */}
      <div className="max-w-7xl mx-auto mb-24">
        <h2 className="text-4xl font-bold text-white mb-4">How does it work?</h2>
        <p className="text-gray-400 text-lg mb-12 max-w-2xl">
          Get started with our simple four-step process to begin advertising on the blockchain.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {steps.map((step, index) => (
            <StepCard key={index} {...step} />
          ))}
        </div>
      </div>

      {/* Make Your Marketing Budget Work Smarter section */}
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Make Your Marketing Budget Work Smarter
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Transform your advertising strategy with blockchain technology and maximize your ROI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link 
            to="/market" 
            className="bg-purple-600 hover:bg-purple-700 text-white text-center py-6 px-8 rounded-xl flex items-center justify-center gap-2 group transition-all duration-300 transform hover:-translate-y-1"
          >
            I am looking for visibility
            <IconArrowUpRight 
              size={20} 
              className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" 
            />
          </Link>
          <Link 
            to="/market" 
            className="bg-[#1a1b23] hover:bg-gray-800 text-white text-center py-6 px-8 rounded-xl border border-gray-800 hover:border-purple-500/30 flex items-center justify-center gap-2 group transition-all duration-300 transform hover:-translate-y-1"
          >
            I am looking for sponsors
            <IconArrowUpRight 
              size={20} 
              className="transform transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" 
            />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Show; 