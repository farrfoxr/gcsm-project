'use client';

import { useState, useEffect } from 'react';
import SearchForm from '@/components/SearchForm';
import SupplierTable from '@/components/SupplierTable';
import LoadingSpinner from '@/components/LoadingSpinner';
import SkeletonTable from '@/components/SkeletonTable';
import ErrorMessage from '@/components/ErrorMessage';
import { ApiService } from '@/services/api';
import { Supplier, SearchFormData } from '@/types';

type AppState = 'idle' | 'loading' | 'success' | 'error';

export default function Home() {
  const [state, setState] = useState<AppState>('idle');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentKeyword, setCurrentKeyword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  // Check backend health on component mount
  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await ApiService.healthCheck();
      setIsBackendHealthy(healthy);
    };
    checkHealth();
  }, []);

  const handleSearch = async (formData: SearchFormData) => {
    setState('loading');
    setCurrentKeyword(formData.keyword);
    setError('');

    const result = await ApiService.searchSuppliers(formData);

    if (result.status === 'success' && result.data) {
      setSuppliers(result.data);
      setState('success');
    } else {
      setError(result.message || 'An unexpected error occurred');
      setState('error');
    }
  };

  const handleRetry = () => {
    setState('idle');
    setError('');
    setSuppliers([]);
    setCurrentKeyword('');
  };

  const renderContent = () => {
    switch (state) {
      case 'loading':
        return (
          <div className="space-y-8">
            <LoadingSpinner keyword={currentKeyword} />
            <SkeletonTable />
          </div>
        );
      
      case 'success':
        return (
          <div className="space-y-8">
            <SearchForm onSubmit={handleSearch} isLoading={false} />
            <SupplierTable suppliers={suppliers} keyword={currentKeyword} />
          </div>
        );
      
      case 'error':
        return (
          <div className="space-y-8">
            <SearchForm onSubmit={handleSearch} isLoading={false} />
            <ErrorMessage message={error} onRetry={handleRetry} />
          </div>
        );
      
      default:
        return <SearchForm onSubmit={handleSearch} isLoading={false} />;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Backend Status Indicator */}
        {isBackendHealthy === false && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-center">
            <p className="text-red-700 font-medium">
              ⚠️ Backend service is not available. Please ensure the Flask API is running on http://127.0.0.1:5000
            </p>
          </div>
        )}
        
        {isBackendHealthy === true && state === 'idle' && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-700 font-medium">
              ✅ Backend service is running and ready
            </p>
          </div>
        )}

        {renderContent()}
        
        {/* Footer */}
        <footer className="mt-16 text-center text-zinc-500 text-sm">
          <p>
            Alibaba Supplier Finder - Find and compare suppliers with ease
          </p>
        </footer>
      </div>
    </main>
  );
}