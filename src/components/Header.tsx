import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { TbStack3 } from 'react-icons/tb';

export const Header: React.FC = () => {
  const [showTechniques, setShowTechniques] = useState(false);

  return (
    <header className="flex justify-between items-center mb-16">
      <Link to="/" className="flex items-center space-x-2">
        <TbStack3 className="text-primary w-6 h-6" />
        <span className="text-2xl font-bold text-text-light dark:text-text-dark">Eukairo</span>
      </Link>
      <nav className="flex items-center space-x-6">
        <div 
          className="relative"
          onMouseEnter={() => setShowTechniques(true)}
          onMouseLeave={() => setShowTechniques(false)}
        >
          <Link 
            className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors" 
            to="/techniques"
          >
            Techniques
          </Link>
          
          {showTechniques && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-card-light dark:bg-card-dark rounded-xl shadow-2xl border border-primary/20 overflow-hidden z-50 animate-fadeIn">
              <div className="p-4 space-y-3">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-2">
                  Quick Preview
                </div>
                
                <div className="space-y-2">
                  <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-text-light dark:text-text-dark">Physiological Sigh</span>
                      <span className="text-lg">😮‍💨</span>
                    </div>
                    <p className="text-xs text-subtext-light dark:text-subtext-dark">Two inhales, long exhale</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-text-light dark:text-text-dark">Box Breathing</span>
                      <span className="text-lg">🔲</span>
                    </div>
                    <p className="text-xs text-subtext-light dark:text-subtext-dark">Even 4-4-4-4 rhythm</p>
                  </div>
                  
                  <div className="p-3 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg hover:from-primary/10 hover:to-primary/15 transition-all cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-sm text-text-light dark:text-text-dark">+ 3 more</span>
                      <span className="text-lg">✨</span>
                    </div>
                    <p className="text-xs text-subtext-light dark:text-subtext-dark">Eye break, 4-7-8, alternate nostril</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-primary/10">
                  <Link 
                    to="/techniques" 
                    className="block text-center text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                  >
                    View all techniques →
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <Link className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors" to="/about">About</Link>
        <Link className="text-subtext-light dark:text-subtext-dark hover:text-text-light dark:hover:text-text-dark transition-colors" to="/insights">Insights</Link>
      </nav>
    </header>
  );
};


