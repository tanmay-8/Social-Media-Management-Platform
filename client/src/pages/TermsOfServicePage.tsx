import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const TermsOfServicePage = () => {
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
          <h1 className="mb-4 text-4xl font-bold text-[#003049]">Terms of Service</h1>
          <p className="mb-8 text-sm text-[#7f7270]">Last Updated: January 15, 2026</p>

          <div className="prose prose-slate max-w-none">
            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">1. Acceptance of Terms</h2>
              <p className="mb-4 text-[#003049]">
                By accessing or using the Social Media Management Platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">2. Description of Service</h2>
              <p className="mb-4 text-[#003049]">The Service provides automated social media posting capabilities, specifically:</p>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Automated festival greeting posts to Facebook and Instagram</li>
                <li>Social media account integration via Facebook OAuth</li>
                <li>Image composition and customization tools</li>
                <li>Scheduled post management</li>
                <li>Subscription-based access to premium features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">3. Account Registration</h2>
              <h3 className="mb-2 text-xl font-medium text-[#003049]">3.1 Account Creation</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>You must provide accurate and complete information during registration</li>
                <li>You are responsible for maintaining the security of your account credentials</li>
                <li>You must be at least 18 years old to use the Service</li>
                <li>One person or entity may not maintain multiple accounts</li>
              </ul>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">3.2 Account Responsibility</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized access</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">4. User Obligations</h2>
              <h3 className="mb-2 text-xl font-medium text-[#003049]">4.1 Acceptable Use</h3>
              <p className="mb-2 text-[#003049]">You agree NOT to:</p>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Use the Service for any illegal purposes</li>
                <li>Post content that is defamatory, obscene, or offensive</li>
                <li>Violate any third-party intellectual property rights</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use automated systems (bots) to access the Service without permission</li>
                <li>Reverse engineer or attempt to extract source code</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Upload malware, viruses, or malicious code</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">5. Subscription and Payments</h2>
              <h3 className="mb-2 text-xl font-medium text-[#003049]">5.1 Subscription Plans</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Multiple subscription tiers are available (3, 6, or 12 months)</li>
                <li>Prices are displayed in INR and processed via Razorpay</li>
                <li>Subscriptions are non-refundable except as required by law</li>
                <li>All fees are exclusive of applicable taxes</li>
              </ul>

              <h3 className="mb-2 text-xl font-medium text-[#003049]">5.2 Payment Terms</h3>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>Payment is required in advance for the subscription period</li>
                <li>Failed payments may result in service suspension</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
                <li>Subscriptions do not auto-renew - manual renewal required</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">6. Social Media Integration</h2>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>The Service integrates with Facebook and Instagram via official APIs</li>
                <li>You must have valid accounts on these platforms</li>
                <li>You authorize us to post content on your behalf to connected accounts</li>
                <li>You can disconnect social media accounts at any time</li>
                <li>We store access tokens securely to facilitate posting</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">7. Disclaimers</h2>
              <p className="mb-4 text-[#003049]">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, ACCURACY OR RELIABILITY OF CONTENT.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">8. Limitation of Liability</h2>
              <p className="mb-4 text-[#003049]">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID IN THE LAST 12 MONTHS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">9. Termination</h2>
              <ul className="list-disc pl-6 mb-4 text-[#003049]">
                <li>You may delete your account at any time</li>
                <li>We may suspend or terminate your account for violations</li>
                <li>Deletion is permanent and cannot be reversed</li>
                <li>No refunds will be provided upon voluntary termination</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">10. Governing Law</h2>
              <p className="mb-4 text-[#003049]">
                These Terms are governed by the laws of India. Any disputes shall be resolved in the courts of India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">11. Changes to Terms</h2>
              <p className="mb-4 text-[#003049]">
                We may update these Terms at any time. Material changes will be notified via email or Service notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="mb-3 text-2xl font-semibold text-[#003049]">12. Contact Information</h2>
              <p className="mb-2 text-[#003049]">For questions about these Terms, contact us at:</p>
              <ul className="list-none pl-0 mb-4 text-[#003049]">
                <li className="mb-1"><strong>Email:</strong> support@socimanage.com</li>
                <li><strong>Support:</strong> Available through your account dashboard</li>
              </ul>
            </section>

            <div className="mt-8 rounded-lg bg-[#fdf0d5] p-6">
              <p className="font-semibold text-[#003049]">
                BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
