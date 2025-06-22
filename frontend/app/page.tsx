'use client'

import { useState } from 'react'
import SearchForm from '../components/SearchForm'
import LoadingSpinner from '../components/LoadingSpinner'
import SupplierCard from '../components/SupplierCard'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface SupplierData {
  product_title: string
  product_url: string
  price: string
  company_name: string
  company_url: string
  years_on_alibaba_search_page: string
  location_search_page: string
  min_order: string
  certifications: string[]
  response_rate: string
}

interface ApiResponse {
  status: string
  data?: SupplierData[]
  message?: string
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scrapedData, setScrapedData] = useState<SupplierData[]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (keyword: string, maxPages: number) => {
    setIsLoading(true)
    setError(null)
    setScrapedData([])
    setSearchKeyword(keyword)
    setHasSearched(true)

    try {
      const response = await fetch('http://127.0.0.1:5000/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyword,
          max_pages: maxPages,
        }),
      })

      const data: ApiResponse = await response.json()

      if (response.ok && data.status === 'success') {
        setScrapedData(data.data || [])
      } else {
        setError(data.message || 'An error occurred while scraping data')
      }
    } catch (err) {
      setError('Failed to connect to the backend. Please ensure the Flask server is running on http://127.0.0.1:5000')
      console.error('Fetch error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setHasSearched(false)
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Search Form - Always visible */}
        <div className={`mb-8 ${hasSearched && !isLoading ? 'sticky top-4 z-10' : ''}`}>
          <SearchForm onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner keyword={searchKeyword} />}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-red-800 mb-2">
                  Search Failed
                </h3>
                <p className="text-red-700 mb-4">{error}</p>
                <button
                  onClick={handleRetry}
                  className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg transition-colors duration-200"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {!isLoading && !error && hasSearched && (
          <div>
            {scrapedData.length > 0 ? (
              <>
                {/* Results Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Search Results for "{searchKeyword}"
                  </h2>
                  <p className="text-gray-600">
                    Found {scrapedData.length} supplier{scrapedData.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Supplier Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {scrapedData.map((supplier, index) => (
                    <SupplierCard key={index} supplier={supplier} />
                  ))}
                </div>
              </>
            ) : (
              /* No Results */
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No Suppliers Found
                </h3>
                <p className="text-gray-600 mb-6">
                  No suppliers found for "{searchKeyword}". Please try a different search term.
                </p>
                <button
                  onClick={handleRetry}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Search Again
                </button>
              </div>
            )}
          </div>
        )}

        {/* Initial State - Show helpful information */}
        {!hasSearched && !isLoading && (
          <div className="text-center py-16">
            <div className="max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Welcome to Alibaba Supplier Scraper
              </h2>
              <p className="text-gray-600 mb-6">
                Enter a keyword above to search for suppliers on Alibaba. Our tool will extract comprehensive supplier information including prices, company details, certifications, and more.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium text-gray-700 mb-2">🔍 Smart Search</h3>
                  <p>Advanced scraping technology to find relevant suppliers</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium text-gray-700 mb-2">📊 Detailed Data</h3>
                  <p>Extract prices, locations, certifications, and company info</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="font-medium text-gray-700 mb-2">⚡ Fast Results</h3>
                  <p>Get comprehensive supplier data in minutes</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}