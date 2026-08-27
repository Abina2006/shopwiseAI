import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} ShopWise AI. All rights reserved.</p>
        <p className="mt-1 text-slate-500 text-xs">
          Built as a smart shopping platform with automated scraping and Gemini AI comparison analytics.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
