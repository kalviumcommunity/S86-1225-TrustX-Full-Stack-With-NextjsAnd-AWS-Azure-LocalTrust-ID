
'use client';

import React from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            LocalTrust-ID
          </h1>
          <p className="text-2xl text-gray-700 mb-4">
            Build Digital Credibility for Your Local Business
          </p>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            A lightweight verification platform that helps small-scale entrepreneurs establish trust online without heavy KYC friction
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link
              href="/businesses/register"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Register Your Business
            </Link>
            <Link
              href="/businesses"
              className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
            >
              Discover Businesses
            </Link>
          </div>
        </div>

        {/* Problem & Solution */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-red-900 mb-4">😟 The Problem</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Small businesses lack digital identity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>No verified credibility online</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Heavy KYC processes are too complex</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-600 mt-1">✗</span>
                <span>Hard for customers to trust local businesses</span>
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-green-900 mb-4">✓ Our Solution</h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Simple business profile creation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Lightweight verification (email, phone, address)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Trust score based on reviews & activity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>No heavy KYC documents required</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                1. Register Your Business
              </h3>
              <p className="text-gray-600">
                Create a profile with basic info: name, category, location, and description
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                2. Get Verified
              </h3>
              <p className="text-gray-600">
                Complete simple verifications (email, phone, address) to earn trust badges
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                3. Build Trust
              </h3>
              <p className="text-gray-600">
                Get reviews from customers and increase your trust score automatically
              </p>
            </div>
          </div>
        </div>

        {/* Trust Score Breakdown */}
        <div className="bg-blue-600 text-white rounded-xl shadow-xl p-12 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Trust Score Components
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">40</div>
              <p className="text-blue-100">Reviews & Ratings</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">30</div>
              <p className="text-blue-100">Verification Badges</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">15</div>
              <p className="text-blue-100">Business Age</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">15</div>
              <p className="text-blue-100">Activity & Views</p>
            </div>
          </div>
          
          <p className="text-center mt-6 text-blue-100 text-lg">
            = 100 Total Trust Score
          </p>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gray-900 text-white rounded-xl shadow-xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Build Your Digital Identity?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join hundreds of local businesses establishing trust online
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/signup"
              className="px-8 py-4 bg-white text-gray-900 rounded-lg hover:bg-gray-100 font-semibold text-lg"
            >
              Sign Up Free
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
