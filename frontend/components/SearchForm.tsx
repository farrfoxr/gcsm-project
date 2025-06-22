import { Search } from 'lucide-react'
import { FormEvent, useState } from 'react'

interface SearchFormProps {
  onSearch: (keyword: string, maxPages: number) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState('')
  const [maxPages, setMaxPages] = useState(2)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      onSearch(keyword.trim(), maxPages)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Alibaba Supplier Scraper
        </h1>
        <p className="text-lg text-gray-600">
          Search and discover suppliers with comprehensive data extraction
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="space-y-4">
          {/* Keyword Input */}
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
              Search Keyword
            </label>
            <div className="relative">
              <input
                type="text"
                id="keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g., corn grain, soybean, electronics..."
                disabled={isLoading}
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
                required
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Max Pages Input */}
          <div>
            <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Pages to Scrape
            </label>
            <input
              type="number"
              id="maxPages"
              value={maxPages}
              onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="10"
              disabled={isLoading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
            />
            <p className="text-sm text-gray-500 mt-1">
              Default: 2 pages (recommended for faster results)
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Search Suppliers
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}