import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function ContactPage() {
  return (
    <StaticPageTemplate
      title="Contact & Support"
      description="We're here to help. Reach out with account questions, technical issues, appointment concerns, or feedback about your experience on Clinexa."
      lastUpdated="April 15, 2026"
      eyebrow="Support & Assistance"
      variant="contact"
      highlights={[
        {
          label: "Response Time",
          value: "< 1 Business Day",
          detail: "Most inquiries answered within 24 hours"
        },
        {
          label: "Support Channels",
          value: "3",
          detail: "Email, phone, and in-app support available"
        },
        {
          label: "Uptime Status",
          value: "99.9%",
          detail: "Real-time platform status monitoring"
        }
      ]}
      sections={[
        {
          heading: 'Primary Support Channels',
          paragraphs: [
            'Contact our support team using the method that works best for you. We aim to respond to all inquiries within one business day. For urgent technical issues affecting access, priority support is available.',
          ],
          bullets: [
            'Email: support@clinexa.com — Technical support, account issues, general inquiries',
            'Phone: 1-800-CLINEXA (1-800-254-6392) — Urgent support, billing, account recovery',
            'In-App Support: Use the help icon in your dashboard for instant guidance and live chat',
            'Office: 2550 Mission Street, San Francisco, CA 94110',
          ],
        },
        {
          heading: 'Common Support Topics',
          paragraphs: [
            'We frequently assist with account access, appointment rescheduling, technical troubleshooting, and feature questions.',
          ],
          bullets: [
            'Password reset and account recovery — We verify your identity and restore access securely',
            'Appointment booking and management — Help with scheduling, cancellations, and rescheduling',
            'Telemedicine technical issues — Troubleshooting video, audio, and connection problems',
            'Medical records and reports — Assistance accessing or managing health information',
            'Billing and payment questions — Invoice clarification and payment method updates',
            'Feature guidance — Explanation of platform capabilities and workflows',
          ],
        },
        {
          heading: 'When to Contact Us',
          paragraphs: [
            'We support a wide range of needs. Reach out if you experience issues, have questions about your care journey, need technical help, or want to provide feedback on improving Clinexa.',
            'For non-urgent matters, email is best. For time-sensitive issues like forgotten passwords or missed appointments, call or use in-app chat for immediate assistance.',
          ],
          callout: 'If you experience a medical emergency, do not use Clinexa for support. Call 911 or your local emergency number immediately.',
        },
        {
          heading: 'Account & Privacy Support',
          paragraphs: [
            'We take your privacy seriously. Our team handles requests for data access, corrections, and privacy inquiries with care and in compliance with applicable regulations.',
          ],
          bullets: [
            'Data access requests — Request a copy of your information stored in Clinexa',
            'Privacy corrections — Update inaccurate personal or health information',
            'Consent withdrawal — Manage your preferences and communication settings',
            'Account deletion — Permanent account removal and data retention options',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'escalation',
          title: 'Escalation & Complaints',
          content: 'If you are dissatisfied with support or need to escalate an issue, reply to your support email with "Escalation request" in the subject line. Management will review your case within 2 business days.',
        },
        {
          type: 'definition',
          title: 'Business Hours',
          content: 'Support is available Monday–Friday 8 AM–6 PM PT, and Saturday 10 AM–4 PM PT. Emergency support for platform outages is available 24/7.',
        },
      ]}
    />
  );
}