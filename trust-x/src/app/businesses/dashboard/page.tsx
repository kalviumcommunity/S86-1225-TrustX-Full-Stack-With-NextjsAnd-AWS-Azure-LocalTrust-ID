'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

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

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Verification form
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [verifyType, setVerifyType] = useState('email');
  const [verifyData, setVerifyData] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      // First check authentication and get current user
      const authResponse = await fetch('/api/auth/me');
      
      if (!authResponse.ok) {
        router.push('/login?redirect=/businesses/dashboard');
        return;
      }

      const authData = await authResponse.json();
      const currentUser = authData.data.user;
      setUser(currentUser);

      // Redirect admins to their dashboard
      if (currentUser.role === 'ADMIN') {
        console.log('Admin detected, redirecting to admin dashboard');
        router.push('/dashboard/admin');
        return;
      }

      // Fetch business data
      await fetchMyBusiness();
    } catch (err) {
      console.error('Auth error:', err);
      router.push('/login?redirect=/businesses/dashboard');
    }
  };

  const fetchMyBusiness = async () => {
    try {
      // Get user's business (cookies automatically sent)
      const response = await fetch('/api/businesses');
      const data = await response.json();

      if (response.ok && data.data.businesses.length > 0) {
        // Assuming user has one business
        const userBusiness = data.data.businesses[0];
        setBusiness(userBusiness);
      } else {
        setError('You don\'t have a business yet');
      }
    } catch (err) {
      console.error('Business fetch error:', err);
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
      // Cookies automatically sent
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
          <p className="text-gray-700 text-lg mb-6">
            {error || 'You don\'t have a business profile yet'}
          </p>
          <Link
            href="/businesses/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium inline-block"
          >
            Register Your Business
          </Link>
        </div>
      </div>
    );
  }

  const trustLevel = getTrustLevel(business.trustScore);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Business Dashboard</h1>
              <p className="text-gray-600">Manage your business profile and track performance</p>
            </div>
            <Link
              href={`/businesses/${business.id}`}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              View Public Profile →
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Trust Score</p>
            <p className="text-3xl font-bold text-blue-600">{business.trustScore}</p>
            <p className={`text-sm mt-1 ${trustLevel.color}`}>{trustLevel.label}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Average Rating</p>
            <p className="text-3xl font-bold text-yellow-600">{business.averageRating.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1">⭐ Out of 5.0</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Reviews</p>
            <p className="text-3xl font-bold text-gray-900">{business.reviewCount}</p>
            <p className="text-sm text-gray-500 mt-1">Customer reviews</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Profile Views</p>
            <p className="text-3xl font-bold text-gray-900">{business.totalViews}</p>
            <p className="text-sm text-gray-500 mt-1">Total views</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Business Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>
                <button className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium">
                  Edit Profile
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Business Name</p>
                  <p className="text-gray-900 font-medium">{business.name}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="text-gray-900">{business.category}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-gray-900">{business.description}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-gray-900">
                    {business.location.city && `${business.location.city}, `}
                    {business.location.state}
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Verification Status</h2>
                {!business.isVerified && (
                  <button
                    onClick={() => setShowVerifyForm(!showVerifyForm)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Add Verification
                  </button>
                )}
              </div>

              {business.isVerified ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-800 font-medium">✓ Fully Verified Business</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your business has all required verifications
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
                          className={`flex items-center justify-between p-3 rounded-lg border ${
                            hasIt ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={hasIt ? 'text-green-600' : 'text-gray-400'}>
                              {hasIt ? '✓' : '○'}
                            </span>
                            <span className={hasIt ? 'text-green-900 font-medium' : 'text-gray-600'}>
                              {badge.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </div>
                          {hasIt && (
                            <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
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
                <form onSubmit={handleVerify} className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-4">Add Verification</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification Type
                      </label>
                      <select
                        value={verifyType}
                        onChange={(e) => setVerifyType(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                      >
                        {verifying ? 'Submitting...' : 'Submit Verification'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowVerifyForm(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-2">
                <Link
                  href={`/businesses/${business.id}`}
                  className="block w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-center font-medium"
                >
                  View Public Profile
                </Link>
                <button className="block w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-center font-medium">
                  Edit Profile
                </button>
                <button className="block w-full px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 text-center font-medium">
                  Share Profile
                </button>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips to Increase Trust</h3>
              
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Complete all verification steps</li>
                <li>✓ Encourage satisfied customers to leave reviews</li>
                <li>✓ Keep your business information up to date</li>
                <li>✓ Respond to customer reviews</li>
                <li>✓ Add photos and detailed descriptions</li>
              </ul>
            </div>

            {/* Member Since */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Member Since</h3>
              <p className="text-gray-600">
                {new Date(business.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
