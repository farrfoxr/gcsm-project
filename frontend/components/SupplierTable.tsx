'use client';

import { useState } from 'react';
import { ExternalLink, Copy, Check, Search, Calendar, MapPin, Star } from 'lucide-react';
import { Supplier } from '@/types';

interface SupplierTableProps {
  suppliers: Supplier[];
  keyword: string;
}

export default function SupplierTable({ suppliers, keyword }: SupplierTableProps) {
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof Supplier | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const copyToClipboard = async (url: string, type: 'product' | 'company') => {
    try {
      await navigator.clipboard.writeText(url);
      const key = `${type}-${url}`;
      setCopiedUrls(prev => new Set(prev).add(key));
      setTimeout(() => {
        setCopiedUrls(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const handleSort = (field: keyof Supplier) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSuppliers = [...suppliers].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-floating p-12 text-center">
        <Search className="h-16 w-16 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-zinc-800 mb-2">
          No suppliers found
        </h3>
        <p className="text-zinc-500">
          No suppliers found for &ldquo;{keyword}&rdquo;. Please try a different search term.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-floating p-6 overflow-hidden">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-zinc-800">
          Found {suppliers.length} suppliers for &ldquo;{keyword}&rdquo;
        </h2>
      </div>
      
      <div className="overflow-x-auto table-container">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-zinc-200">
              <th 
                className="text-left py-4 px-6 font-medium text-zinc-700 cursor-pointer hover:text-pinkAccent-600 transition-colors"
                onClick={() => handleSort('product_title')}
              >
                Product
                {sortField === 'product_title' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-left py-4 px-6 font-medium text-zinc-700 cursor-pointer hover:text-pinkAccent-600 transition-colors"
                onClick={() => handleSort('price')}
              >
                Price
                {sortField === 'price' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th 
                className="text-left py-4 px-6 font-medium text-zinc-700 cursor-pointer hover:text-pinkAccent-600 transition-colors"
                onClick={() => handleSort('company_name')}
              >
                Company
                {sortField === 'company_name' && (
                  <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </th>
              <th className="text-left py-4 px-6 font-medium text-zinc-700">
                Details
              </th>
              <th className="text-left py-4 px-6 font-medium text-zinc-700">
                Min Order
              </th>
              <th className="text-left py-4 px-6 font-medium text-zinc-700">
                Certifications
              </th>
              <th className="text-left py-4 px-6 font-medium text-zinc-700">
                Response Rate
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSuppliers.map((supplier, index) => (
              <tr key={index} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <a
                        href={supplier.product_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-800 hover:text-pinkAccent-600 transition-colors line-clamp-2"
                      >
                        {supplier.product_title || 'N/A'}
                      </a>
                      <ExternalLink className="h-4 w-4 text-zinc-400 flex-shrink-0" />
                    </div>
                    <button
                      onClick={() => copyToClipboard(supplier.product_url, 'product')}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-pinkAccent-600 transition-colors"
                    >
                      {copiedUrls.has(`product-${supplier.product_url}`) ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <span className="font-semibold text-pinkAccent-600 text-lg">
                    {supplier.price || 'Contact for price'}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <a
                      href={supplier.company_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-zinc-800 hover:text-pinkAccent-600 transition-colors block"
                    >
                      {supplier.company_name || 'N/A'}
                    </a>
                    <button
                      onClick={() => copyToClipboard(supplier.company_url, 'company')}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-pinkAccent-600 transition-colors"
                    >
                      {copiedUrls.has(`company-${supplier.company_url}`) ? (
                        <>
                          <Check className="h-3 w-3" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          Copy URL
                        </>
                      )}
                    </button>
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <div className="text-sm text-zinc-600 space-y-1">
                    {supplier.years_on_alibaba_search_page && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {supplier.years_on_alibaba_search_page}
                      </div>
                    )}
                    {supplier.location_search_page && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {supplier.location_search_page}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <span className="text-zinc-700">
                    {supplier.min_order || 'N/A'}
                  </span>
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex flex-wrap gap-1">
                    {supplier.certifications && supplier.certifications.length > 0 ? (
                      supplier.certifications.map((cert, certIndex) => (
                        <span
                          key={certIndex}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cert.toLowerCase().includes('verified') 
                              ? 'bg-pinkAccent-100 text-pinkAccent-700 border border-pinkAccent-200' 
                              : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          {cert}
                        </span>
                      ))
                    ) : (
                      <span className="text-zinc-400 text-sm">No certifications</span>
                    )}
                  </div>
                </td>
                
                <td className="py-4 px-6">
                  <div className="flex items-center gap-1 text-sm text-zinc-600">
                    <Star className="h-3 w-3" />
                    {supplier.response_rate || 'N/A'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}