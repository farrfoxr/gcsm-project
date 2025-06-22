import { ExternalLink, MapPin, Calendar, Star, Shield, Copy } from 'lucide-react'
import { useState } from 'react'

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

interface SupplierCardProps {
  supplier: SupplierData
}

export default function SupplierCard({ supplier }: SupplierCardProps) {
  const [copied, setCopied] = useState<string | null>(null)

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const isVerifiedSupplier = supplier.certifications.some(cert => 
    cert.toLowerCase().includes('verified')
  )

  const formatValue = (value: string) => {
    return value === 'N/A' || !value ? '-' : value
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
      {/* Product Title */}
      <div className="mb-4">
        <a
          href={supplier.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 line-clamp-2 block"
        >
          {supplier.product_title}
        </a>
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="text-2xl font-bold text-green-600">
          {formatValue(supplier.price)}
        </div>
      </div>

      {/* Company Name */}
      <div className="mb-4 flex items-center justify-between">
        <a
          href={supplier.company_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 transition-colors duration-200"
        >
          {supplier.company_name}
          <ExternalLink className="w-4 h-4" />
        </a>
        {isVerifiedSupplier && (
          <Shield className="w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Location and Years */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <MapPin className="w-4 h-4" />
          <span>{formatValue(supplier.location_search_page)}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatValue(supplier.years_on_alibaba_search_page)}</span>
        </div>
      </div>

      {/* Minimum Order */}
      <div className="mb-4">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Min. Order:</span> {formatValue(supplier.min_order)}
        </div>
      </div>

      {/* Certifications */}
      {supplier.certifications.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {supplier.certifications.map((cert, index) => (
              <span
                key={index}
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  cert.toLowerCase().includes('verified')
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : 'bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {cert}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Response Rate */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Star className="w-4 h-4" />
          <span>{formatValue(supplier.response_rate)}</span>
        </div>
      </div>

      {/* Copy URLs */}
      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <button
          onClick={() => copyToClipboard(supplier.product_url, 'product')}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
        >
          <Copy className="w-3 h-3" />
          {copied === 'product' ? 'Copied!' : 'Copy Product'}
        </button>
        <button
          onClick={() => copyToClipboard(supplier.company_url, 'company')}
          className="flex items-center gap-1 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors duration-200"
        >
          <Copy className="w-3 h-3" />
          {copied === 'company' ? 'Copied!' : 'Copy Company'}
        </button>
      </div>
    </div>
  )
}