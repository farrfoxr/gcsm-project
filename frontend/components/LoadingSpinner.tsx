import { Search } from 'lucide-react'

interface LoadingSpinnerProps {
  keyword: string
}

export default function LoadingSpinner({ keyword }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {/* Main spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <Search className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
      </div>
      
      {/* Loading text */}
      <div className="mt-6 text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Searching Alibaba for "{keyword}"
        </h3>
        <p className="text-gray-600">
          Gathering supplier data... this might take a moment.
        </p>
      </div>
      
      {/* Skeleton cards */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-7xl px-4">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="shimmer h-6 bg-gray-200 rounded mb-4"></div>
            <div className="shimmer h-8 bg-gray-200 rounded mb-3"></div>
            <div className="shimmer h-4 bg-gray-200 rounded mb-2"></div>
            <div className="shimmer h-4 bg-gray-200 rounded mb-2"></div>
            <div className="flex gap-2 mb-3">
              <div className="shimmer h-6 w-16 bg-gray-200 rounded-full"></div>
              <div className="shimmer h-6 w-20 bg-gray-200 rounded-full"></div>
            </div>
            <div className="shimmer h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}