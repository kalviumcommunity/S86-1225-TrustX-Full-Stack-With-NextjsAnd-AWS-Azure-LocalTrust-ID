'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  location: any;
  contactInfo: any;
  trustScore: number;
  isVerified: boolean;
  verificationBadges: string[];
  reviewCount: number;
  averageRating: number;
  totalViews: number;
  createdAt: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews' | 'analytics' | 'settings'>('overview');
  
  // Verification form
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyType, setVerifyType] = useState('email');
  const [verifyData, setVerifyData] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchMyBusiness();
  }, []);

  const fetchMyBusiness = async () => {
    try {
      // Get user's business
      const response = await fetch('/api/businesses');
      const data = await response.json();

      if (response.ok && data.data.businesses.length > 0) {
        // Get user from JWT
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login?redirect=/businesses/dashboard');
          return;
        }
        const userData = await userRes.json();
        const userId = userData.data.user.id;

        // Find user's business
        const userBusiness = data.data.businesses.find((b: any) => b.ownerId === userId);
        
        if (userBusiness) {
          setBusiness(userBusiness);
          
          // Fetch reviews for this business
          const reviewsRes = await fetch(`/api/reviews?businessId=${userBusiness.id}`);
          if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData.data.reviews || []);
          }
        } else {
          setError('You don\'t have a business yet');
        }
      } else {
        setError('You don\'t have a business yet');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    setVerifying(true);

    try {
      const response = await fetch(`/api/businesses/${business.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          verificationType: verifyType,
          verificationData: {
            [verifyType]: verifyData
          }
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowVerifyForm(false);
        setVerifyData('');
        fetchMyBusiness();
        alert('Verification submitted successfully!');
      } else {
        alert(data.error?.message || 'Failed to submit verification');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setVerifying(false);
    }
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { label: 'Good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { label: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-2xl font-semibold text-gray-900 mt-4">No Business Found</h2>
          <p className="text-gray-600 text-lg mt-2 mb-6">
            {error || 'You don\'t have a business profile yet'}
          </p>
          <Link
            href="/businesses/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block shadow-lg"
          >
            Register Your Business
          </Link>
        </div>
      </div>
    );
  }

  const trustLevel = getTrustLevel(business.trustScore);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{business.name}</h1>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                  {business.category}
                </span>
                {business.isVerified && (
                  <span className="flex items-center text-green-600 text-sm font-medium">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified
                  </span>
                )}
              </div>
            </div>
            <Link
              href={`/businesses/${business.id}`}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-md transition-all"
            >
              View Public Profile →
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-100 text-sm font-medium">Trust Score</p>
              <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-4xl font-bold mb-1">{business.trustScore}</p>
            <p className={`text-sm ${trustLevel.bg} ${trustLevel.color} inline-block px-2 py-1 rounded`}>
              {trustLevel.label}
            </p>
          </div>

          <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-100 text-sm font-medium">Average Rating</p>
              <svg className="w-8 h-8 text-yellow-200" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <p className="text-4xl font-bold mb-1">{business.averageRating.toFixed(1)}</p>
            <p className="text-yellow-100 text-sm">Out of 5.0 ⭐</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-purple-100 text-sm font-medium">Total Reviews</p>
              <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <p className="text-4xl font-bold mb-1">{business.reviewCount}</p>
            <p className="text-purple-100 text-sm">Customer reviews</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <p className="text-green-100 text-sm font-medium">Profile Views</p>
              <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <p className="text-4xl font-bold mb-1">{business.totalViews}</p>
            <p className="text-green-100 text-sm">Total impressions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <nav className="flex space-x-1 p-2">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'reviews', label: 'Reviews', icon: '⭐' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' && (
              <>
                {/* Business Info */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
                    <button className="px-4 py-2 text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition">
                      ✏️ Edit
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Business Name</p>
                      <p className="text-gray-900 font-semibold">{business.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Category</p>
                      <p className="text-gray-900">{business.category}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500 mb-1 font-medium">Description</p>
                      <p className="text-gray-900">{business.description}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Location</p>
                      <p className="text-gray-900">
                        {business.location.city && `${business.location.city}, `}
                        {business.location.state}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1 font-medium">Member Since</p>
                      <p className="text-gray-900">
                        {new Date(business.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recent Reviews */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Recent Reviews</h2>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      View All →
                    </button>
                  </div>

                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No reviews yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.slice(0, 3).map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{review.userName || 'Anonymous'}</p>
                              <div className="flex items-center mt-1">
                                {[...Array(5)].map((_, i) => (
                                  <svg
                                    key={i}
                                    className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="text-gray-700 mt-2 text-sm">{review.comment}</p>
                            </div>
                            <span className="text-xs text-gray-500 ml-4">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'reviews' && (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">All Reviews ({reviews.length})</h2>

                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-sm text-gray-500">Encourage your customers to leave reviews!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">{review.userName || 'Anonymous User'}</p>
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="flex items-center mt-1">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-2 text-sm font-medium text-gray-700">{review.rating}.0</span>
                            </div>
                            <p className="text-gray-700 mt-2">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Analytics</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Total Views</p>
                      <p className="text-2xl font-bold text-gray-900">{business.totalViews}</p>
                      <p className="text-xs text-green-600 mt-1">📈 +12% this month</p>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600 mb-1">Avg. Rating</p>
                      <p className="text-2xl font-bold text-gray-900">{business.averageRating.toFixed(1)}</p>
                      <p className="text-xs text-gray-500 mt-1">From {business.reviewCount} reviews</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="font-medium text-gray-900 mb-3">Rating Distribution</h3>
                    {[5, 4, 3, 2, 1].map(rating => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                      return (
                        <div key={rating} className="flex items-center gap-3 mb-2">
                          <span className="text-sm text-gray-600 w-12">{rating} ⭐</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-yellow-400 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Verification */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
                    {!business.isVerified && (
                      <button
                        onClick={() => setShowVerifyForm(!showVerifyForm)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        ➕ Add Verification
                      </button>
                    )}
                  </div>

                  {business.isVerified ? (
                    <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                      <p className="text-green-800 font-medium text-lg">✓ Fully Verified Business</p>
                      <p className="text-sm text-green-700 mt-1">
                        Your business has completed all required verifications
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Complete verifications to increase your trust score and credibility
                      </p>

                      <div className="space-y-3">
                        {['email_verified', 'phone_verified', 'address_verified'].map(badge => {
                          const hasIt = business.verificationBadges.includes(badge);
                          return (
                            <div
                              key={badge}
                              className={`flex items-center justify-between p-4 rounded-lg border-2 transition ${
                                hasIt 
                                  ? 'bg-green-50 border-green-300' 
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`text-2xl ${hasIt ? 'text-green-600' : 'text-gray-400'}`}>
                                  {hasIt ? '✓' : '○'}
                                </span>
                                <span className={`font-medium ${hasIt ? 'text-green-900' : 'text-gray-700'}`}>
                                  {badge.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                              </div>
                              {hasIt && (
                                <span className="text-xs text-green-700 bg-green-200 px-3 py-1 rounded-full font-medium">
                                  Verified
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Verification Form */}
                  {showVerifyForm && (
                    <form onSubmit={handleVerify} className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-300">
                      <h3 className="font-medium text-gray-900 mb-4">Add Verification</h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Verification Type
                          </label>
                          <select
                            value={verifyType}
                            onChange={(e) => setVerifyType(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="email">Email</option>
                            <option value="phone">Phone</option>
                            <option value="address">Address</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {verifyType === 'email' ? 'Email Address' : verifyType === 'phone' ? 'Phone Number' : 'Business Address'}
                          </label>
                          <input
                            type={verifyType === 'email' ? 'email' : 'text'}
                            value={verifyData}
                            onChange={(e) => setVerifyData(e.target.value)}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder={
                              verifyType === 'email' ? 'business@example.com' : 
                              verifyType === 'phone' ? '+1 (555) 123-4567' : 
                              '123 Main St, City, State'
                            }
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={verifying}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium transition"
                          >
                            {verifying ? 'Submitting...' : 'Submit Verification'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowVerifyForm(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <Link
                  href={`/businesses/${business.id}`}
                  className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium shadow transition"
                >
                  🔗 View Public Profile
                </Link>
                <button className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium transition">
                  ✏️ Edit Profile
                </button>
                <button className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium transition">
                  📤 Share Profile
                </button>
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center font-medium transition"
                >
                  ← Back to Dashboard
                </Link>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Growth Tips</h3>
              
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Complete all verification steps</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Encourage satisfied customers to leave reviews</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Keep your business information up to date</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Respond to customer reviews promptly</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Add photos and detailed descriptions</span>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Need Help?</h3>
              <p className="text-sm text-gray-600 mb-4">
                Contact our support team for assistance
              </p>
              <Link
                href="/contact"
                className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium transition"
              >
                📧 Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
