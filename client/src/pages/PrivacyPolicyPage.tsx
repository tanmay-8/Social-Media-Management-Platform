import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';

export const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf0d5] to-[#fffaf0] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(0,48,73,0.25)] bg-white px-4 py-2 text-sm text-[#003049] transition-all hover:bg-[#fdf0d5]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="rounded-2xl border border-[rgba(0,48,73,0.18)] bg-white p-8 shadow-lg">
          <div className="mb-6 flex items-center gap-3">
            <Shield className="h-10 w-10 text-[#669bbc]" />
            <div>
              <h1 className="text-4xl font-bold text-[#003049]">Privacy Policy</h1>
              <p className="text-sm text-[#7f7270]">Last Updated: January 15, 2026</p>
            </div>
          </div>

          <div className="mb-8 rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-900">
              <strong>Your privacy matters to us.</strong> This policy explains how we collect, use, and protect your personal information when you use our Service.
            </p>
          </div>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Database className="h-6 w-6 text-[#669bbc]" />
                <h2 className="text-2xl font-semibold text-[#003049]">1. Information We Collect</h2>
              </div>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">Information You Provide</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Account Information:</strong> Name, email address, phone number (optional), password (encrypted)</li>
                <li><strong>Profile Information:</strong> Profile photo, footer image, festival preferences</li>
                <li><strong>Social Media:</strong> Facebook Page ID, Instagram Business Account ID</li>
                <li><strong>Payment Information:</strong> Processed via Razorpay (we don't store credit card details)</li>
              </ul>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">Information Collected Automatically</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>IP address, browser type, device information</li>
                <li>Usage data (pages visited, time spent)</li>
                <li>Authentication tokens and session data</li>
                <li>Error logs for debugging</li>
              </ul>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">Third-Party Information</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Facebook/Instagram profile data via OAuth</li>
                <li>Page access tokens for posting</li>
                <li>Social media account permissions</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Eye className="h-6 w-6 text-[#669bbc]" />
                <h2 className="text-2xl font-semibold text-[#003049]">2. How We Use Your Information</h2>
              </div>

              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Provide Service:</strong> Create account, process payments, post to social media, schedule posts</li>
                <li><strong>Improve Service:</strong> Analyze usage patterns, fix bugs, develop features</li>
                <li><strong>Communicate:</strong> Send notifications, subscription reminders, support responses</li>
                <li><strong>Security:</strong> Detect fraud, enforce terms, comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <UserCheck className="h-6 w-6 text-[#669bbc]" />
                <h2 className="text-2xl font-semibold text-[#003049]">3. How We Share Your Information</h2>
              </div>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">Service Providers</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Cloudinary:</strong> Image storage and CDN</li>
                <li><strong>Razorpay:</strong> Payment processing</li>
                <li><strong>Facebook/Instagram:</strong> Social media posting</li>
                <li><strong>MongoDB Atlas:</strong> Database hosting (if applicable)</li>
              </ul>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">Legal Requirements</h3>
              <p className="mb-4 text-[#003049]">
                We may disclose information to comply with legal process, protect our rights, investigate fraud, or respond to government requests.
              </p>

              <div className="rounded-lg bg-green-50 border border-green-200 p-4 mb-4">
                <p className="text-sm text-green-900">
                  <strong>We do NOT sell your personal data to third parties.</strong>
                </p>
              </div>
            </section>

            <section className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Lock className="h-6 w-6 text-[#669bbc]" />
                <h2 className="text-2xl font-semibold text-[#003049]">4. Data Security</h2>
              </div>

              <p className="mb-3 text-[#003049]">We implement multiple security measures:</p>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Passwords hashed using bcrypt</li>
                <li>JWT tokens for authentication</li>
                <li>HTTPS encryption for data in transit</li>
                <li>Database access controls</li>
                <li>Regular security audits</li>
                <li>CORS restrictions and request limits</li>
              </ul>

              <p className="mb-4 text-sm text-[#7f7270] italic">
                Note: No system is 100% secure. You are responsible for maintaining your password security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">5. Your Rights and Choices</h2>
              
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate information through account settings</li>
                <li><strong>Deletion:</strong> Delete your account and data at any time</li>
                <li><strong>Portability:</strong> Export your data in machine-readable format</li>
                <li><strong>Object:</strong> Object to certain data processing activities</li>
                <li><strong>Disconnect:</strong> Disconnect social media accounts anytime</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">6. Data Retention</h2>
              
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Active Accounts:</strong> Data retained while account is active</li>
                <li><strong>Deleted Accounts:</strong> Most data deleted within 30 days</li>
                <li><strong>Backups:</strong> May retain data in backups for up to 90 days</li>
                <li><strong>Legal:</strong> Some data retained longer for compliance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">7. Cookies and Tracking</h2>
              
              <p className="mb-3 text-[#003049]">We use cookies for:</p>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li><strong>Essential:</strong> Authentication and security</li>
                <li><strong>Functional:</strong> Remember your preferences</li>
                <li><strong>Analytics:</strong> Understand usage patterns</li>
              </ul>
              <p className="mb-4 text-sm text-[#003049]">
                You can control cookies through browser settings, though this may affect functionality.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">8. International Data Transfers</h2>
              <p className="mb-4 text-[#003049]">
                Data may be processed in India or other countries. By using the Service, you consent to international transfers with appropriate safeguards.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">9. Children's Privacy</h2>
              <p className="mb-4 text-[#003049]">
                The Service is NOT intended for users under 18. We do not knowingly collect data from minors. If discovered, such data will be deleted promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">10. GDPR & CCPA Compliance</h2>
              <p className="mb-3 text-[#003049]">
                We comply with GDPR (EU) and CCPA (California) privacy regulations, providing enhanced rights for applicable users:
              </p>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Right to access and portability</li>
                <li>Right to rectification and erasure</li>
                <li>Right to restrict processing</li>
                <li>Right to object and withdraw consent</li>
                <li>Right to lodge complaints with authorities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">11. Changes to This Policy</h2>
              <p className="mb-4 text-[#003049]">
                We may update this policy periodically. Material changes will be notified via email or Service notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">12. Contact Us</h2>
              <p className="mb-2 text-[#003049]">For privacy-related questions or to exercise your rights:</p>
              <ul className="list-none pl-0 mb-4 text-[#003049]">
                <li className="mb-1"><strong>Email:</strong> privacy@socimanage.com</li>
                <li className="mb-1"><strong>Support:</strong> support@socimanage.com</li>
                <li><strong>Response Time:</strong> Within 30 days</li>
              </ul>
            </section>

            <div className="mt-8 rounded-lg bg-[#fdf0d5] p-6">
              <p className="font-semibold text-[#003049] mb-2">
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO THIS PRIVACY POLICY.
              </p>
              <p className="text-sm text-[#003049]">
                Version 1.0 • Effective Date: January 15, 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
