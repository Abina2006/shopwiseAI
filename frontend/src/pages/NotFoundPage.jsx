import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <span className="text-6xl mb-4">🔍</span>
      <h1 className="text-4xl font-extrabold text-white mb-2">404 - Page Not Found</h1>
      <p className="text-slate-400 max-w-md mb-6">
        Sorry, the page you are looking for does not exist or has been moved to another location.
      </p>
      <Link
        to="/"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 text-sm"
      >
        Go back Home
      </Link>
    </div>
  );
};

export default NotFoundPage;
