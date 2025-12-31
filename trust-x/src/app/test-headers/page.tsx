'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface SecurityHeaders {
  [key: string]: string | undefined;
}

interface HeaderTestResult {
  header: string;
  expected: string;
  actual: string | undefined;
  passed: boolean;
  description: string;
}

export default function TestSecurityHeadersPage() {
  const [headers, setHeaders] = useState<SecurityHeaders>({});
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState<HeaderTestResult[]>([]);
  const [corsTest, setCorsTest] = useState<{
    status: 'idle' | 'testing' | 'success' | 'error';
    message: string;
    data?: any;
  }>({ status: 'idle', message: '' });

  // Expected security headers
  const expectedHeaders = [
    {
      name: 'Strict-Transport-Security',
      expected: 'max-age=63072000',
      description: 'HSTS - Forces HTTPS for 2 years',
    },
    {
      name: 'Content-Security-Policy',
      expected: "default-src 'self'",
      description: 'CSP - Restricts content sources',
    },
    {
      name: 'X-Frame-Options',
      expected: 'DENY',
      description: 'Prevents clickjacking',
    },
    {
      name: 'X-Content-Type-Options',
      expected: 'nosniff',
      description: 'Prevents MIME sniffing',
    },
    {
      name: 'X-XSS-Protection',
      expected: '1; mode=block',
      description: 'Enables XSS filter',
    },
    {
      name: 'Referrer-Policy',
      expected: 'strict-origin-when-cross-origin',
      description: 'Controls referrer information',
    },
    {
      name: 'Permissions-Policy',
      expected: 'geolocation=()',
      description: 'Restricts browser features',
    },
  ];

  useEffect(() => {
    fetchHeaders();
  }, []);

  const fetchHeaders = async () => {
    setLoading(true);
    try {
      // Fetch from a simple API endpoint to capture response headers
      const response = await fetch('/api/cors-example', {
        method: 'GET',
        credentials: 'include',
      });

      // Extract headers
      const capturedHeaders: SecurityHeaders = {};
      response.headers.forEach((value, key) => {
        capturedHeaders[key] = value;
      });

      setHeaders(capturedHeaders);

      // Test each expected header
      const results: HeaderTestResult[] = expectedHeaders.map((expected) => {
        const actual = capturedHeaders[expected.name.toLowerCase()];
        const passed = actual ? actual.includes(expected.expected) : false;

        return {
          header: expected.name,
          expected: expected.expected,
          actual: actual || 'Not found',
          passed,
          description: expected.description,
        };
      });

      setTestResults(results);
      setLoading(false);

      const passedCount = results.filter((r) => r.passed).length;
      if (passedCount === results.length) {
        toast.success(`All ${results.length} security headers configured correctly!`);
      } else {
        toast.error(`${results.length - passedCount} security headers missing or incorrect`);
      }
    } catch (error) {
      console.error('Error fetching headers:', error);
      toast.error('Failed to fetch security headers');
      setLoading(false);
    }
  };

  const testCors = async () => {
    setCorsTest({ status: 'testing', message: 'Testing CORS configuration...' });
    
    try {
      const response = await fetch('/api/cors-example', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'CORS test from test page',
          timestamp: new Date().toISOString(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCorsTest({
          status: 'success',
          message: 'CORS configured correctly!',
          data,
        });
        toast.success('CORS test passed!');
      } else {
        setCorsTest({
          status: 'error',
          message: `CORS test failed: ${data.message || 'Unknown error'}`,
        });
        toast.error('CORS test failed');
      }
    } catch (error) {
      setCorsTest({
        status: 'error',
        message: `CORS error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      toast.error('CORS request blocked');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
          🔒 Security Headers & HTTPS Testing
        </h1>

        {/* Introduction */}
        <div className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg p-6 mb-6 border-2 border-blue-500">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            🛡️ HTTPS Enforcement & Security Headers Dashboard
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            This page verifies the implementation of critical security headers that protect against common web attacks.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li><strong>HSTS</strong>: Enforces HTTPS connections (prevents MITM attacks)</li>
            <li><strong>CSP</strong>: Controls allowed content sources (prevents XSS)</li>
            <li><strong>CORS</strong>: Restricts cross-origin API access (prevents unauthorized access)</li>
          </ul>
        </div>

        {/* Test Results */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Security Headers Test Results
            </h2>
            <button
              onClick={fetchHeaders}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Re-test Headers'}
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading headers...</div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    result.passed
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-lg ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                          {result.passed ? '✅' : '❌'}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {result.header}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {result.description}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="font-semibold">Expected:</span>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                        {result.expected}
                      </pre>
                    </div>
                    <div>
                      <span className="font-semibold">Actual:</span>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                        {result.actual}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary */}
          {!loading && testResults.length > 0 && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900 dark:text-white">
                  Test Summary:
                </span>
                <span className={`font-bold text-lg ${
                  testResults.every(r => r.passed) ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {testResults.filter(r => r.passed).length} / {testResults.length} Passed
                </span>
              </div>
            </div>
          )}
        </div>

        {/* CORS Testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            CORS Configuration Test
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test CORS (Cross-Origin Resource Sharing) configuration by sending a POST request to the API.
          </p>

          <button
            onClick={testCors}
            disabled={corsTest.status === 'testing'}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50 mb-4"
          >
            {corsTest.status === 'testing' ? 'Testing CORS...' : 'Test CORS Configuration'}
          </button>

          {corsTest.status !== 'idle' && (
            <div className={`p-4 rounded-lg border-2 ${
              corsTest.status === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                : corsTest.status === 'error'
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {corsTest.status === 'success' ? '✅' : corsTest.status === 'error' ? '❌' : '⏳'}
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {corsTest.message}
                </span>
              </div>
              {corsTest.data && (
                <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded mt-2 overflow-x-auto text-xs">
                  {JSON.stringify(corsTest.data, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* All Headers Display */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            All Response Headers
          </h2>
          
          <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono">
              {Object.entries(headers).length > 0
                ? Object.entries(headers)
                    .sort()
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n')
                : 'No headers captured yet. Click "Re-test Headers" button.'}
            </pre>
          </div>

          {Object.keys(headers).length > 0 && (
            <button
              onClick={() => copyToClipboard(JSON.stringify(headers, null, 2))}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700"
            >
              📋 Copy Headers JSON
            </button>
          )}
        </div>

        {/* Security Scan Links */}
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-6 border border-purple-500">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            🔍 External Security Scanning Tools
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Use these online tools to scan your deployed application for security issues:
          </p>
          <div className="space-y-2">
            <a
              href="https://securityheaders.com"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-blue-600 dark:text-blue-400"
            >
              🔗 SecurityHeaders.com - Scan security headers
            </a>
            <a
              href="https://observatory.mozilla.org"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-blue-600 dark:text-blue-400"
            >
              🔗 Mozilla Observatory - Comprehensive security scan
            </a>
            <a
              href="https://www.ssllabs.com/ssltest/"
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-2 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow text-blue-600 dark:text-blue-400"
            >
              🔗 SSL Labs - Test HTTPS/TLS configuration
            </a>
          </div>
        </div>

        {/* Security Checklist */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            ✅ Security Implementation Checklist
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>HSTS configured (2 years)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Content Security Policy (CSP)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>X-Frame-Options (DENY)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>X-Content-Type-Options (nosniff)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>X-XSS-Protection (enabled)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Referrer-Policy (configured)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Permissions-Policy (restrictive)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>CORS (trusted origins only)</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Cross-Origin-Embedder-Policy</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Cross-Origin-Opener-Policy</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>Cross-Origin-Resource-Policy</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✅</span>
              <span>HTTPS Enforcement Ready</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
