import React from 'react';
import { FaGithub, FaLinkedin } from 'react-icons/fa';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-700">
      <div className="flex justify-center items-center space-x-6">
        <a 
          href="https://github.com/OguzhanBerkeOzdil" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
          aria-label="GitHub"
        >
          <FaGithub className="w-6 h-6" />
        </a>
        <a 
          href="https://www.linkedin.com/in/oguzhanberkeozdil/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors"
          aria-label="LinkedIn"
        >
          <FaLinkedin className="w-6 h-6" />
        </a>
      </div>
    </footer>
  );
};
