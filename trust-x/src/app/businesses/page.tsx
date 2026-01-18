'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  trustScore: number;
  isVerified: boolean;
  verificationBadges: string[];
  reviewCount: number;
  averageRating: number;
  logo?: string;
}

export default function BusinessesPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const categories = [
    'Restaurant',
    'Retail',
    'Services',
    'Healthcare',
    'Education',
    'Technology',
    'Construction',
    'Transportation',
    'Entertainment',
    'Other'
  ];

  useEffect(() => {
    fetchBusinesses();
  }, [search, category, location, verifiedOnly]);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (category) params.append('category', category);
      if (location) params.append('location', location);
      if (verifiedOnly) params.append('verified', 'true');

      const response = await fetch(`/api/businesses?${params}`);
      const data = await response.json();

      if (response.ok) {
        setBusinesses(data.data.businesses);
      } else {
        setError(data.error?.message || 'Failed to fetch businesses');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'New', color: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Discover Local Businesses</h1>
            <p className="text-gray-600 mt-1">Find trusted entrepreneurs in your area</p>
          </div>
          <Link
            href="/businesses/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Register Your Business
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search businesses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Location (city/state)"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />

            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700">Verified Only</span>
            </label>
          </div>
        </div>

        {/* Business List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading businesses...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : businesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 text-lg">No businesses found</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map(business => {
              const trustLevel = getTrustLevel(business.trustScore);
              
              return (
                <Link
                  key={business.id}
                  href={`/businesses/${business.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 cursor-pointer"
                >
                  {/* Business Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {business.name}
                      </h3>
                      <p className="text-sm text-gray-500">{business.category}</p>
                    </div>
                    {business.isVerified && (
                      <div className="flex-shrink-0 ml-2">
                        <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          ✓ Verified
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {business.description}
                  </p>

                  {/* Location */}
                  {business.location.city && (
                    <p className="text-sm text-gray-500 mb-4">
                      📍 {business.location.city}
                      {business.location.state && `, ${business.location.state}`}
                    </p>
                  )}

                  {/* Trust Score */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Trust Score</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${business.trustScore}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${trustLevel.color}`}>
                          {business.trustScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Ratings */}
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-medium text-gray-900">
                          {business.averageRating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        ({business.reviewCount} reviews)
                      </p>
                    </div>
                  </div>

                  {/* Verification Badges */}
                  {business.verificationBadges.length > 0 && (
                    <div className="flex gap-1 mt-3 flex-wrap">
                      {business.verificationBadges.map(badge => (
                        <span
                          key={badge}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
                        >
                          {badge.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
