'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ExternalLink, Copy, Check, Search, Calendar, MapPin, Star, DollarSign, Clock, Shield, X, Filter, ChevronDown } from 'lucide-react';
import { Supplier } from '@/types';

interface SupplierTableProps {
  suppliers: Supplier[];
  keyword: string;
}

interface FilterState {
  priceMin: string;
  priceMax: string;
  locations: string[];
  yearsMin: string;
  certifications: string[];
  responseRateMin: string;
}

export default function SupplierTable({ suppliers, keyword }: SupplierTableProps) {
  const [copiedUrls, setCopiedUrls] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<keyof Supplier | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [locationsOpen, setLocationsOpen] = useState(false);
  const [certificationsOpen, setCertificationsOpen] = useState(false);
  
  const locationsRef = useRef<HTMLDivElement>(null);
  const certificationsRef = useRef<HTMLDivElement>(null);
  
  // Filter states with string values for inputs
  const [filters, setFilters] = useState<FilterState>({
    priceMin: '',
    priceMax: '',
    locations: [],
    yearsMin: '',
    certifications: [],
    responseRateMin: ''
  });

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (locationsRef.current && !locationsRef.current.contains(event.target as Node)) {
        setLocationsOpen(false);
      }
      if (certificationsRef.current && !certificationsRef.current.contains(event.target as Node)) {
        setCertificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const locations = [...new Set(suppliers.map(s => s.location_search_page?.replace(' Supplier', '') || '').filter(Boolean))].sort();
    const certifications = [...new Set(suppliers.flatMap(s => s.certifications || []))].sort();
    
    return { locations, certifications };
  }, [suppliers]);

  // Parse numeric values from strings
  const parsePrice = (priceStr: string): number => {
    if (!priceStr || priceStr === 'Contact for price') return 0;
    const match = priceStr.match(/\$?([\d,]+)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  };

  const parseYears = (yearsStr: string): number => {
    if (!yearsStr) return 0;
    const match = yearsStr.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };

  const parseResponseRate = (rateStr: string): number => {
    if (!rateStr) return 0;
    const match = rateStr.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  };

  // Validate and parse filter inputs
  const validateNumber = (value: string): boolean => {
    return value === '' || (!isNaN(Number(value)) && Number(value) >= 0);
  };

  const handleFilterChange = (key: keyof FilterState, value: string | string[]) => {
    if (typeof value === 'string' && ['priceMin', 'priceMax', 'yearsMin', 'responseRateMin'].includes(key)) {
      if (validateNumber(value)) {
        setFilters(prev => ({ ...prev, [key]: value }));
      }
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  // Apply filters
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      // Price filter
      const price = parsePrice(supplier.price);
      const minPrice = filters.priceMin ? Number(filters.priceMin) : 0;
      const maxPrice = filters.priceMax ? Number(filters.priceMax) : Infinity;
      if (price > 0 && (price < minPrice || price > maxPrice)) return false;

      // Location filter
      if (filters.locations.length > 0) {
        const location = supplier.location_search_page?.replace(' Supplier', '') || '';
        if (!filters.locations.includes(location)) return false;
      }

      // Years filter
      const years = parseYears(supplier.years_on_alibaba_search_page || '0');
      const minYears = filters.yearsMin ? Number(filters.yearsMin) : 0;
      if (years < minYears) return false;

      // Certifications filter
      if (filters.certifications.length > 0) {
        const hasRequiredCert = filters.certifications.some(cert => 
          supplier.certifications?.includes(cert)
        );
        if (!hasRequiredCert) return false;
      }

      // Response rate filter
      const responseRate = parseResponseRate(supplier.response_rate || '0%');
      const minResponseRate = filters.responseRateMin ? Number(filters.responseRateMin) : 0;
      if (responseRate > 0 && responseRate < minResponseRate) return false;

      return true;
    });
  }, [suppliers, filters]);

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

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return sortDirection === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });

  const clearFilters = () => {
    setFilters({
      priceMin: '',
      priceMax: '',
      locations: [],
      yearsMin: '',
      certifications: [],
      responseRateMin: ''
    });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.locations.length > 0) count++;
    if (filters.certifications.length > 0) count++;
    if (filters.priceMin || filters.priceMax) count++;
    if (filters.yearsMin) count++;
    if (filters.responseRateMin) count++;
    return count;
  }, [filters]);

  if (suppliers.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center">
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
    <div className="space-y-6">
      {/* Results Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-zinc-800">
            Found {sortedSuppliers.length} suppliers for &ldquo;{keyword}&rdquo;
            {filteredSuppliers.length !== suppliers.length && (
              <span className="text-zinc-500 text-lg font-normal ml-2">
                ({suppliers.length - filteredSuppliers.length} filtered out)
              </span>
            )}
          </h2>
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 text-pink-600">
              <Filter className="h-5 w-5" />
              <span className="font-medium">{activeFiltersCount} active filter{activeFiltersCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </div>

      {/* Compact Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-800 flex items-center gap-2">
            <Filter className="h-5 w-5 text-pink-500" />
            Filters
          </h3>
          {activeFiltersCount > 0 && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-600 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
              Clear all
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          
          {/* Price Range Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <DollarSign className="h-4 w-4 text-pink-500" />
              Price Range (USD)
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Min"
                value={filters.priceMin}
                onChange={(e) => handleFilterChange('priceMin', e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-200 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors"
              />
              <input
                type="text"
                placeholder="Max"
                value={filters.priceMax}
                onChange={(e) => handleFilterChange('priceMax', e.target.value)}
                className="px-3 py-2 text-sm border border-zinc-200 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors"
              />
            </div>
          </div>

          {/* Experience Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Clock className="h-4 w-4 text-pink-500" />
              Experience
            </div>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Min years on Alibaba"
                value={filters.yearsMin}
                onChange={(e) => handleFilterChange('yearsMin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors"
              />
              <input
                type="text"
                placeholder="Min response rate (%)"
                value={filters.responseRateMin}
                onChange={(e) => handleFilterChange('responseRateMin', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-md focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors"
              />
            </div>
          </div>

          {/* Locations Dropdown */}
          <div className="space-y-3" ref={locationsRef}>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <MapPin className="h-4 w-4 text-pink-500" />
              Locations
              {filters.locations.length > 0 && (
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {filters.locations.length}
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setLocationsOpen(!locationsOpen)}
                className="w-full px-3 py-2 text-sm text-left border border-zinc-200 rounded-md hover:border-pink-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors flex items-center justify-between"
              >
                <span className="text-zinc-500">
                  {filters.locations.length > 0 
                    ? `${filters.locations.length} selected` 
                    : 'Select locations'
                  }
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${locationsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {locationsOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filterOptions.locations.map(location => (
                    <label key={location} className="flex items-center gap-2 p-2 hover:bg-pink-50 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.locations.includes(location)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('locations', [...filters.locations, location]);
                            } else {
                              handleFilterChange('locations', filters.locations.filter(l => l !== location));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          filters.locations.includes(location) 
                            ? 'bg-pink-500 border-pink-500' 
                            : 'border-zinc-300'
                        }`}>
                          {filters.locations.includes(location) && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-zinc-700">{location}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Certifications Dropdown */}
          <div className="space-y-3" ref={certificationsRef}>
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <Shield className="h-4 w-4 text-pink-500" />
              Certifications
              {filters.certifications.length > 0 && (
                <span className="bg-pink-100 text-pink-700 px-2 py-0.5 rounded-full text-xs font-medium">
                  {filters.certifications.length}
                </span>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setCertificationsOpen(!certificationsOpen)}
                className="w-full px-3 py-2 text-sm text-left border border-zinc-200 rounded-md hover:border-pink-300 focus:border-pink-500 focus:ring-1 focus:ring-pink-200 transition-colors flex items-center justify-between"
              >
                <span className="text-zinc-500">
                  {filters.certifications.length > 0 
                    ? `${filters.certifications.length} selected` 
                    : 'Select certifications'
                  }
                </span>
                <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${certificationsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {certificationsOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-zinc-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filterOptions.certifications.map(cert => (
                    <label key={cert} className="flex items-center gap-2 p-2 hover:bg-pink-50 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={filters.certifications.includes(cert)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleFilterChange('certifications', [...filters.certifications, cert]);
                            } else {
                              handleFilterChange('certifications', filters.certifications.filter(c => c !== cert));
                            }
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          filters.certifications.includes(cert) 
                            ? 'bg-pink-500 border-pink-500' 
                            : 'border-zinc-300'
                        }`}>
                          {filters.certifications.includes(cert) && (
                            <Check className="h-2.5 w-2.5 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-zinc-700">{cert}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 pt-3 border-t border-zinc-200">
          <div className="text-sm text-zinc-600 text-center">
            Showing <span className="font-semibold text-pink-600">{sortedSuppliers.length}</span> of <span className="font-semibold">{suppliers.length}</span> suppliers
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto table-container">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th 
                  className="text-left py-5 px-8 font-semibold text-zinc-700 cursor-pointer hover:text-pink-600 transition-colors min-w-[280px]"
                  onClick={() => handleSort('product_title')}
                >
                  Product
                  {sortField === 'product_title' && (
                    <span className="ml-2 text-pink-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="text-left py-5 px-8 font-semibold text-zinc-700 cursor-pointer hover:text-pink-600 transition-colors min-w-[120px]"
                  onClick={() => handleSort('price')}
                >
                  Price
                  {sortField === 'price' && (
                    <span className="ml-2 text-pink-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="text-left py-5 px-8 font-semibold text-zinc-700 cursor-pointer hover:text-pink-600 transition-colors min-w-[200px]"
                  onClick={() => handleSort('company_name')}
                >
                  Company
                  {sortField === 'company_name' && (
                    <span className="ml-2 text-pink-500">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th className="text-left py-5 px-8 font-semibold text-zinc-700 min-w-[180px]">
                  Location & Experience
                </th>
                <th className="text-left py-5 px-8 font-semibold text-zinc-700 min-w-[140px]">
                  Min Order
                </th>
                <th className="text-left py-5 px-8 font-semibold text-zinc-700 min-w-[200px]">
                  Certifications
                </th>
                <th className="text-left py-5 px-8 font-semibold text-zinc-700 min-w-[120px]">
                  Response Rate
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-100">
              {sortedSuppliers.map((supplier, index) => (
                <tr key={index} className="hover:bg-pink-50/30 transition-colors">
                  <td className="py-6 px-8">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <a
                          href={supplier.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-zinc-800 hover:text-pink-600 transition-colors line-clamp-2 flex-1"
                        >
                          {supplier.product_title || 'N/A'}
                        </a>
                        <ExternalLink className="h-4 w-4 text-zinc-400 flex-shrink-0 mt-0.5" />
                      </div>
                      <button
                        onClick={() => copyToClipboard(supplier.product_url, 'product')}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-pink-600 transition-colors"
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
                  
                  <td className="py-6 px-8">
                    <span className="font-bold text-pink-600 text-lg">
                      {supplier.price || 'Contact for price'}
                    </span>
                  </td>
                  
                  <td className="py-6 px-8">
                    <div className="space-y-2">
                      <a
                        href={supplier.company_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-zinc-800 hover:text-pink-600 transition-colors block"
                      >
                        {supplier.company_name || 'N/A'}
                      </a>
                      <button
                        onClick={() => copyToClipboard(supplier.company_url, 'company')}
                        className="flex items-center gap-2 text-xs text-zinc-500 hover:text-pink-600 transition-colors"
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
                  
                  <td className="py-6 px-8">
                    <div className="text-sm space-y-2">
                      {supplier.location_search_page && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-pink-500 flex-shrink-0" />
                          <span className="text-zinc-700">{supplier.location_search_page}</span>
                        </div>
                      )}
                      {supplier.years_on_alibaba_search_page && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-pink-500 flex-shrink-0" />
                          <span className="text-zinc-700">{supplier.years_on_alibaba_search_page}</span>
                        </div>
                      )}
                      {!supplier.location_search_page && !supplier.years_on_alibaba_search_page && (
                        <span className="text-zinc-400 text-sm">No details available</span>
                      )}
                    </div>
                  </td>
                  
                  <td className="py-6 px-8">
                    <span className="text-zinc-700 font-medium">
                      {supplier.min_order || 'N/A'}
                    </span>
                  </td>
                  
                  <td className="py-6 px-8">
                    <div className="flex flex-wrap gap-1.5">
                      {supplier.certifications && supplier.certifications.length > 0 ? (
                        supplier.certifications.map((cert, certIndex) => (
                          <span
                            key={certIndex}
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              cert.toLowerCase().includes('verified') 
                                ? 'bg-pink-100 text-pink-700 border border-pink-200' 
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
                  
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 bg-pink-100 rounded-full">
                        <Star className="h-4 w-4 text-pink-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-zinc-700">
                          {supplier.response_rate || 'N/A'}
                        </span>
                        {supplier.response_rate && (
                          <span className="text-xs text-zinc-500">response</span>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}