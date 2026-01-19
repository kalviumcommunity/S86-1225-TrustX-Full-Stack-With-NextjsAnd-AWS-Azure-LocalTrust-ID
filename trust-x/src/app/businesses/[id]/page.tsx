'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Business {
  id: string;
  name: string;
  category: string;
  description: string;
  location: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  contactInfo: {
    email?: string;
    phone?: string;
    website?: string;
  };
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
  rating: number;
  comment: string;
  user: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export default function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const businessId = resolvedParams.id;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchBusiness();
    fetchReviews();
  }, [businessId]);

  const fetchBusiness = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`);
      const data = await response.json();
      console.log('[Business Detail] Business data:', data);

      if (response.ok) {
        const businessData = data.data.business;
        console.log('[Business Detail] Setting business:', businessData);
        setBusiness(businessData);
      } else {
        setError(data.error?.message || 'Business not found');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`);
      const data = await response.json();
      console.log('[Business Detail] Reviews data:', data);

      if (response.ok) {
        const reviewsData = data.data.reviews || [];
        console.log('[Business Detail] Setting reviews:', reviewsData);
        setReviews(reviewsData);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`/api/businesses/${businessId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, comment })
      });

      const data = await response.json();

      if (response.status === 401) {
        alert('Your session has expired. Redirecting to login...');
        setTimeout(() => {
          router.push(`/login?redirect=/businesses/${businessId}&expired=true`);
        }, 1500);
        return;
      }

      if (response.ok) {
        setShowReviewForm(false);
        setRating(5);
        setComment('');
        fetchBusiness();
        fetchReviews();
      } else {
        alert(data.error?.message || 'Failed to submit review');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      setSubmitting(false);
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
          <p className="text-gray-600 mt-4">Loading business...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Business not found'}</p>
          <Link href="/businesses" className="text-blue-600 hover:underline">
            ← Back to businesses
          </Link>
        </div>
      </div>
    );
  }

  const trustLevel = getTrustLevel(business.trustScore);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link href="/businesses" className="text-blue-600 hover:underline mb-4 inline-block">
            ← Back to businesses
          </Link>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                {business.isVerified && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    ✓ Verified
                  </span>
                )}
              </div>
              <p className="text-gray-600">{business.category}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">{business.description}</p>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                {business.contactInfo.email && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Email:</span>
                    <a href={`mailto:${business.contactInfo.email}`} className="text-blue-600 hover:underline">
                      {business.contactInfo.email}
                    </a>
                  </div>
                )}
                {business.contactInfo.phone && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Phone:</span>
                    <a href={`tel:${business.contactInfo.phone}`} className="text-blue-600 hover:underline">
                      {business.contactInfo.phone}
                    </a>
                  </div>
                )}
                {business.contactInfo.website && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <span className="font-medium">Website:</span>
                    <a href={business.contactInfo.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {business.contactInfo.website}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            {business.location.city && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
                <div className="text-gray-700">
                  {business.location.address && <p>{business.location.address}</p>}
                  <p>
                    {business.location.city}
                    {business.location.state && `, ${business.location.state}`}
                    {business.location.zipCode && ` ${business.location.zipCode}`}
                  </p>
                  {business.location.country && <p>{business.location.country}</p>}
                </div>
              </div>
            )}

            {/* Reviews */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Reviews ({business.reviewCount})
                </h2>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Write Review
                </button>
              </div>

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className={`text-2xl ${star <= rating ? 'text-yellow-500' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Share your experience..."
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
                ) : (
                  reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-200 pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{review.user.name}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={i < review.rating ? 'text-yellow-500' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trust Score */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Trust Score</h3>
              
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-blue-600 mb-2">
                  {business.trustScore}
                </div>
                <span className={`inline-block px-3 py-1 ${trustLevel.bg} ${trustLevel.color} text-sm font-medium rounded-full`}>
                  {trustLevel.label}
                </span>
              </div>

              <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${business.trustScore}%` }}
                ></div>
              </div>

              <p className="text-sm text-gray-600 text-center">
                Based on reviews, verifications, and activity
              </p>
            </div>

            {/* Rating */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Rating</h3>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  {business.averageRating.toFixed(1)}
                </div>
                <div className="flex justify-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xl ${i < Math.round(business.averageRating) ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-sm text-gray-600">
                  {business.reviewCount} {business.reviewCount === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Verification */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification</h3>
              
              {business.verificationBadges.length === 0 ? (
                <p className="text-sm text-gray-600">No verifications yet</p>
              ) : (
                <div className="space-y-2">
                  {business.verificationBadges.map(badge => (
                    <div key={badge} className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-sm text-gray-700 capitalize">
                        {badge.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Views</span>
                  <span className="font-medium text-gray-900">{business.totalViews}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {new Date(business.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
