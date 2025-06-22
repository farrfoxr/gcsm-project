'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchFormData } from '@/types';

interface SearchFormProps {
  onSubmit: (data: SearchFormData) => void;
  isLoading: boolean;
}

export default function SearchForm({ onSubmit, isLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState('');
  const [maxPages, setMaxPages] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSubmit({ keyword: keyword.trim(), max_pages: maxPages });
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-floating p-8 max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-zinc-800 mb-2">
          Alibaba Supplier Finder
        </h1>
        <p className="text-zinc-600">
          Find and compare suppliers with ease
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="keyword" className="block text-sm font-medium text-zinc-700 mb-2">
            Search Term
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-5 w-5" />
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., corn grain, soybean, electronics..."
              className="w-full px-4 py-3 pl-12 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-pinkAccent-500 focus:border-pinkAccent-500 text-zinc-800 placeholder-zinc-400 transition-all duration-200 disabled:bg-zinc-100 disabled:text-zinc-500"
              style={{ outline: 'none', boxShadow: 'none' }}
              onFocus={(e) => {
                e.target.style.boxShadow = '0 0 0 2px rgba(236, 72, 153, 0.2)';
                e.target.style.borderColor = '#ec4899';
              }}
              onBlur={(e) => {
                e.target.style.boxShadow = 'none';
                e.target.style.borderColor = '#e4e4e7';
              }}
              disabled={isLoading}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="max_pages" className="block text-sm font-medium text-zinc-700 mb-2">
            Maximum Pages to Scrape
          </label>
          <select
            id="max_pages"
            value={maxPages}
            onChange={(e) => setMaxPages(parseInt(e.target.value))}
            className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-pinkAccent-500 focus:border-pinkAccent-500 transition-colors disabled:bg-zinc-100 disabled:text-zinc-500"
            disabled={isLoading}
          >
            <option value={1}>1 Page</option>
            <option value={2}>2 Pages</option>
            <option value={3}>3 Pages</option>
            <option value={4}>4 Pages</option>
            <option value={5}>5 Pages</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="w-full bg-white border-2 border-zinc-300 text-zinc-800 font-medium py-3 px-6 rounded-lg hover:border-pinkAccent-500 hover:text-pinkAccent-600 focus:outline-none focus:ring-2 focus:ring-pinkAccent-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-zinc-300 disabled:hover:text-zinc-800"
        >
          {isLoading ? 'Searching...' : 'Search Suppliers'}
        </button>
      </form>
    </div>
  );
}