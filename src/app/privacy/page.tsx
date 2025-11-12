"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Database, Users, AlertTriangle } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Privacy Policy
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: January 2025
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-900 dark:text-red-200">
                IMPORTANT DISCLAIMER
              </h3>
              <p className="text-sm text-red-800 dark:text-red-300 mt-1">
                FriendFinder is NOT responsible for any misuse of your data or information
                by other users. While we implement security measures, you are responsible
                for what you share. Never share sensitive personal information (passwords,
                financial details, etc.) with other users.
              </p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Introduction</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Welcome to FriendFinder. We respect your privacy and are committed to
              protecting your personal data. This privacy policy explains how we collect,
              use, and safeguard your information when you use our app.
            </p>
            <p>
              By using FriendFinder, you agree to the collection and use of information in
              accordance with this policy. If you do not agree, please discontinue use of
              the app immediately.
            </p>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>Information We Collect</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2">1. Personal Information</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Name and username</li>
                <li>Email address</li>
                <li>Profile picture</li>
                <li>Bio and personal preferences</li>
                <li>Age range and interests</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Location Data</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>GPS coordinates (when GPS discovery is enabled)</li>
                <li>WiFi network information (when WiFi discovery is enabled)</li>
                <li>Bluetooth proximity data (when Bluetooth discovery is enabled)</li>
                <li>Location accuracy and last updated timestamp</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Usage Data</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Friend connections and interactions</li>
                <li>Posts, stories, and messages</li>
                <li>App usage patterns and preferences</li>
                <li>Device information and browser type</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Your Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="h-5 w-5" />
              <span>How We Use Your Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Friend Discovery:</strong> To help you find and connect with friends
                based on proximity using GPS, WiFi, or Bluetooth
              </li>
              <li>
                <strong>Account Management:</strong> To create and manage your account,
                authenticate you, and provide customer support
              </li>
              <li>
                <strong>Communication:</strong> To enable messaging, posts, and stories
                between you and your friends
              </li>
              <li>
                <strong>Personalization:</strong> To customize your experience based on your
                preferences and language choice
              </li>
              <li>
                <strong>Security:</strong> To detect and prevent fraud, abuse, and security
                incidents
              </li>
              <li>
                <strong>Improvement:</strong> To analyze usage patterns and improve our
                services
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Data Sharing and Disclosure</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                ⚠️ User Responsibility
              </h3>
              <p className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                <strong>CRITICAL:</strong> We are NOT responsible for how other users use,
                share, or misuse information you provide to them. Once you share information
                with another user (messages, location, photos), we cannot control what they
                do with it. Exercise caution and common sense.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">We Share Your Data With:</h3>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  <strong>Your Friends:</strong> Your accepted friends can see your location
                  (if enabled), posts, stories, and profile information
                </li>
                <li>
                  <strong>Service Providers:</strong> Third-party services that help us
                  operate (e.g., email delivery, cloud storage)
                </li>
                <li>
                  <strong>Legal Requirements:</strong> If required by law or to protect our
                  rights
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-green-600 dark:text-green-400">
                ✓ We DO NOT Share With:
              </h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Advertisers or marketing companies</li>
                <li>Data brokers</li>
                <li>Third parties for their own purposes</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-5 w-5" />
              <span>Data Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Encrypted data transmission (HTTPS/TLS)</li>
              <li>Encrypted password storage (bcrypt)</li>
              <li>Secure database access controls</li>
              <li>Regular security audits</li>
              <li>Two-factor authentication (optional)</li>
            </ul>
            <p className="text-sm bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded border border-yellow-200 dark:border-yellow-800">
              <strong>Note:</strong> No system is 100% secure. We cannot guarantee absolute
              security. You are responsible for maintaining the security of your account
              credentials.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card>
          <CardHeader>
            <CardTitle>Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Portability:</strong> Export your data in a machine-readable format
              </li>
              <li>
                <strong>Opt-Out:</strong> Disable location sharing or discovery features
              </li>
              <li>
                <strong>Objection:</strong> Object to certain data processing activities
              </li>
            </ul>
            <p className="text-sm">
              To exercise these rights, contact us at{" "}
              <a
                href="mailto:privacy@friendfinder.com"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                privacy@friendfinder.com
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card>
          <CardHeader>
            <CardTitle>Children's Privacy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              FriendFinder is not intended for users under 13 years of age. We do not
              knowingly collect personal information from children under 13. If you are a
              parent or guardian and believe your child has provided us with personal
              information, please contact us immediately.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Changes to This Policy</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              We may update this privacy policy from time to time. We will notify you of any
              changes by posting the new policy on this page and updating the "Last updated"
              date. Continued use of the app after changes constitutes acceptance of the new
              policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>If you have questions about this privacy policy, contact us at:</p>
            <ul className="space-y-1">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:privacy@friendfinder.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  privacy@friendfinder.com
                </a>
              </li>
              <li>
                <strong>Phone:</strong>{" "}
                <a
                  href="tel:+1-800-FRIEND-1"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  +1-800-FRIEND-1
                </a>
              </li>
              <li>
                <strong>Support:</strong>{" "}
                <a
                  href="mailto:support@friendfinder.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@friendfinder.com
                </a>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
