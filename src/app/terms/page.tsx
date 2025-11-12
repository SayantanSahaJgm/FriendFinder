"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Shield, AlertTriangle, Ban, Scale, UserX } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Terms of Service
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: January 2025
          </p>
        </div>

        {/* Critical Disclaimer */}
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-600 dark:border-red-400 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-3">
              <h3 className="font-bold text-xl text-red-900 dark:text-red-200">
                ⚠️ CRITICAL DISCLAIMER - READ CAREFULLY
              </h3>
              <div className="space-y-2 text-red-800 dark:text-red-300">
                <p className="font-semibold">
                  FriendFinder is NOT RESPONSIBLE for any misuse, abuse, or unauthorized use
                  of your data, information, or content by other users or third parties.
                </p>
                <ul className="list-disc list-inside space-y-1 pl-4">
                  <li>
                    We are NOT liable if another user shares, copies, or misuses your photos,
                    messages, location, or any content you share
                  </li>
                  <li>
                    We are NOT responsible for harassment, stalking, fraud, or any harmful
                    behavior by other users
                  </li>
                  <li>
                    We are NOT liable for any damages, losses, or harm resulting from your use
                    of this app or interactions with other users
                  </li>
                  <li>
                    You use this app entirely AT YOUR OWN RISK and are solely responsible for
                    your interactions and what you share
                  </li>
                </ul>
                <p className="font-bold mt-3">
                  BY USING FRIENDFINDER, YOU ACCEPT ALL RISKS AND AGREE TO HOLD US HARMLESS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Acceptance of Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>1. Acceptance of Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              By accessing or using FriendFinder ("the App"), you agree to be bound by these
              Terms of Service ("Terms"). If you do not agree to these Terms, you must not
              use the App.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and FriendFinder.
              Your continued use of the App constitutes acceptance of any modifications to
              these Terms.
            </p>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>2. User Responsibilities and Conduct</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2">You agree to:</h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Provide accurate and truthful information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Be solely responsible for all activity under your account</li>
                <li>Use the App in compliance with all applicable laws</li>
                <li>Respect other users' privacy and rights</li>
                <li>Be cautious about what personal information you share</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">
                You agree NOT to:
              </h3>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Share or post illegal, harmful, or offensive content</li>
                <li>Harass, threaten, or abuse other users</li>
                <li>Impersonate others or create fake profiles</li>
                <li>Use the App for commercial purposes without permission</li>
                <li>Attempt to hack, reverse engineer, or disrupt the App</li>
                <li>Share others' personal information without consent</li>
                <li>Use automated systems or bots</li>
                <li>Violate any user's privacy or safety</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Scale className="h-5 w-5" />
              <span>3. Limitation of Liability</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded border border-yellow-200 dark:border-yellow-800">
              <p className="font-bold mb-2">IMPORTANT - PLEASE READ:</p>
              <p className="text-sm">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, FRIENDFINDER AND ITS AFFILIATES,
                OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR:
              </p>
            </div>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                <strong>Data Misuse:</strong> Any misuse, theft, or unauthorized access to
                your data by other users or third parties
              </li>
              <li>
                <strong>User Conduct:</strong> Any actions, behavior, or content of other
                users, including harassment, fraud, or harm
              </li>
              <li>
                <strong>Privacy Breaches:</strong> Unauthorized sharing or distribution of
                your information by other users
              </li>
              <li>
                <strong>Security Incidents:</strong> Data breaches, hacking, or security
                vulnerabilities despite our security measures
              </li>
              <li>
                <strong>Loss of Data:</strong> Loss, corruption, or deletion of your content
                or data
              </li>
              <li>
                <strong>Service Interruptions:</strong> Downtime, errors, or unavailability
                of the App
              </li>
              <li>
                <strong>Indirect Damages:</strong> Any indirect, incidental, consequential,
                special, or punitive damages
              </li>
              <li>
                <strong>Third-Party Actions:</strong> Actions or omissions of third-party
                services we integrate with
              </li>
            </ul>
            <p className="font-bold text-red-600 dark:text-red-400 mt-4">
              THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND.
              YOU USE THE APP AT YOUR OWN RISK.
            </p>
          </CardContent>
        </Card>

        {/* Content Ownership */}
        <Card>
          <CardHeader>
            <CardTitle>4. Content and Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <div>
              <h3 className="font-semibold mb-2">Your Content:</h3>
              <p>
                You retain ownership of content you post (photos, messages, posts, stories).
                By posting, you grant FriendFinder a worldwide, non-exclusive, royalty-free
                license to use, store, and display your content for providing the service.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-red-600 dark:text-red-400">Warning:</h3>
              <p className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800">
                Once you share content with other users, you cannot control how they use it.
                Other users may screenshot, copy, or share your content. We are NOT
                responsible for how others use content you share with them.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Our Content:</h3>
              <p>
                All App features, design, logos, and functionality are owned by FriendFinder
                and protected by copyright and trademark laws. You may not copy, modify, or
                distribute our intellectual property.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Termination */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserX className="h-5 w-5" />
              <span>5. Account Termination</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              We reserve the right to suspend or terminate your account at any time, with or
              without notice, for any reason, including:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Violation of these Terms</li>
              <li>Illegal or harmful behavior</li>
              <li>Complaints from other users</li>
              <li>Suspicious or fraudulent activity</li>
              <li>Prolonged inactivity</li>
            </ul>
            <p>
              You may delete your account at any time through Settings. Deletion is permanent
              and cannot be undone.
            </p>
          </CardContent>
        </Card>

        {/* Privacy and Data */}
        <Card>
          <CardHeader>
            <CardTitle>6. Privacy and Data Protection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p>
              Your use of the App is also governed by our Privacy Policy. Please review it
              carefully.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
              <p className="font-semibold">Key Points:</p>
              <ul className="list-disc list-inside space-y-1 pl-4 mt-2 text-sm">
                <li>Your friends can see your location if you enable location sharing</li>
                <li>We do not share your data with advertisers or third parties</li>
                <li>You control your privacy settings</li>
                <li>
                  We are NOT responsible for how other users use information you share with
                  them
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Prohibited Uses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Ban className="h-5 w-5" />
              <span>7. Prohibited Uses</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-700 dark:text-gray-300">
            <p className="font-semibold">The following activities are strictly prohibited:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                  Illegal Activities:
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                  <li>Any illegal activity</li>
                  <li>Drug trafficking</li>
                  <li>Human trafficking</li>
                  <li>Fraud or scams</li>
                  <li>Copyright infringement</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                  Harmful Behavior:
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                  <li>Harassment or bullying</li>
                  <li>Hate speech</li>
                  <li>Violence or threats</li>
                  <li>Stalking</li>
                  <li>Sexual exploitation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                  Misuse of Service:
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                  <li>Spam or solicitation</li>
                  <li>Fake accounts</li>
                  <li>Unauthorized automation</li>
                  <li>Scraping or data mining</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2 text-red-600 dark:text-red-400">
                  Privacy Violations:
                </h4>
                <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                  <li>Sharing others' info without consent</li>
                  <li>Doxxing</li>
                  <li>Impersonation</li>
                  <li>Unauthorized screenshots/recordings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Indemnification */}
        <Card>
          <CardHeader>
            <CardTitle>8. Indemnification</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              You agree to indemnify, defend, and hold harmless FriendFinder and its
              affiliates from any claims, damages, losses, liabilities, and expenses
              (including legal fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>Your use of the App</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any laws or regulations</li>
              <li>Your content or interactions with other users</li>
              <li>Any harm caused to other users</li>
            </ul>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card>
          <CardHeader>
            <CardTitle>9. Dispute Resolution and Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              These Terms are governed by the laws of [Your Jurisdiction]. Any disputes shall
              be resolved through binding arbitration, except where prohibited by law.
            </p>
            <p>
              You waive any right to participate in class action lawsuits or class-wide
              arbitration.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card>
          <CardHeader>
            <CardTitle>10. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>
              We may modify these Terms at any time. Changes will be posted on this page with
              an updated "Last updated" date. Continued use of the App after changes
              constitutes acceptance of the new Terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>11. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-700 dark:text-gray-300 space-y-2">
            <p>For questions about these Terms, contact us at:</p>
            <ul className="space-y-1">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:legal@friendfinder.com"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  legal@friendfinder.com
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

        {/* Final Acknowledgment */}
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg border border-gray-300 dark:border-gray-700">
          <p className="text-center font-semibold text-gray-900 dark:text-white">
            By using FriendFinder, you acknowledge that you have read, understood, and agree
            to be bound by these Terms of Service, including all disclaimers and limitations
            of liability.
          </p>
        </div>
      </div>
    </div>
  );
}
