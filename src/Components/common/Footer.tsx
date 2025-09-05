import React from "react";
import { IconBrandGithub, IconBrandTwitter } from '@tabler/icons-react';

/**
 * Footer Component
 * Displays a simple footer with the application name
 * Uses a dark background and centered text layout
 */
const Footer: React.FC = () => (
  <footer className="w-full bg-[#13141a] border-t border-gray-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center py-8">
        <p className="text-gray-400">
          Siborg on Stellar
        </p>
        <div className="flex items-center gap-4">
          <a 
            href="https://x.com/SiBorgLabs" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <IconBrandTwitter size={24} />
          </a>
          <a 
            href="https://github.com/siborg-ads" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <IconBrandGithub size={24} />
          </a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
