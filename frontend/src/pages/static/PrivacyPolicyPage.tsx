import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function PrivacyPolicyPage() {
  return (
    <StaticPageTemplate
      title="Privacy Policy"
      description="This policy explains how Clinexa collects, uses, protects, and respects your personal and health-related data. Your privacy is a fundamental right we protect."
      lastUpdated="April 15, 2026"
      eyebrow="Data Protection"
      variant="privacy"
      highlights={[
        {
          label: "Encryption",
          value: "256-bit",
          detail: "Industry-standard AES encryption at rest and in transit"
        },
        {
          label: "Compliance",
          value: "HIPAA",
          detail: "Health Insurance Portability and Accountability Act standards"
        },
        {
          label: "Retention",
          value: "Defined",
          detail: "Clear data retention and deletion policies"
        }
      ]}
      sections={[
        {
          heading: 'Introduction',
          paragraphs: [
            'Clinexa ("we," "us," "our," or "Company") operates a digital healthcare platform (the "Platform"). This Privacy Policy explains how we collect, process, use, share, protect, and respect your personal and health-related data.',
            'We are committed to protecting your privacy. If you do not agree with any part of this policy, please discontinue use of the Platform.',
            'This policy applies to all users: patients, healthcare providers, administrators, and anyone accessing the Platform.',
          ],
        },
        {
          heading: 'Information We Collect',
          paragraphs: [
            'We collect information necessary to operate healthcare services, ensure security, and improve user experience.',
          ],
          bullets: [
            'Account Information: Name, email, phone, password hash, date of birth, address, gender, and professional license (for doctors)',
            'Health Information: Medical history, symptoms, medications, allergies, consultation notes, prescriptions, lab results, and medical reports',
            'Appointment Data: Booking history, consultation dates/times, duration, doctor-patient interactions, and payment records',
            'Payment Information: Credit card details, billing address, transaction history, and payment method (processed securely by third-party payment providers)',
            'Telemedicine Data: Video/audio recordings (not stored; real-time only), session metadata, IP address, device type, and browser information',
            'Usage Analytics: Pages visited, buttons clicked, features used, search history, and time spent on sections (for platform improvement)',
            'Communication: Messages, note content, feedback, and complaint records',
            'Technical Data: Device type, operating system, browser type, IP address, device identifiers, and log files',
          ],
        },
        {
          heading: 'Legal Basis for Processing',
          paragraphs: [
            'We process personal data based on the following legal justifications:',
          ],
          bullets: [
            'Service Delivery: Processing necessary to provide healthcare services you request',
            'Contractual Rights: To fulfill terms of service and process payments',
            'Legal Obligation: To comply with healthcare laws (HIPAA), tax requirements, and court orders',
            'Legitimate Interest: To improve platform security, prevent fraud, and enhance user experience',
            'Consent: For marketing communications and non-essential features (you can withdraw consent anytime)',
            'Vital Interest: To protect life, health, and safety in emergency situations',
          ],
        },
        {
          heading: 'How We Use Your Data',
          paragraphs: [
            'Your information is used to operate the Platform securely and provide quality healthcare services.',
          ],
          bullets: [
            'Service Delivery: To manage appointments, process payments, document consultations, and maintain medical records',
            'Communication: To send appointment reminders, consultation confirmations, billing notifications, and support responses',
            'Security: To detect fraud, prevent unauthorized access, monitor system health, and comply with security standards',
            'Improvement: To analyze user behavior, identify system issues, improve features, and personalize recommendations',
            'Legal Compliance: To maintain records for regulatory audits, respond to legal requests, and meet healthcare reporting requirements',
            'Quality Assurance: To evaluate doctor performance, gather user feedback, and improve service quality',
            'Research: To conduct anonymized research on healthcare outcomes and platform effectiveness (only with consent)',
            'Marketing: To send updates, newsletters, and promotions (only if you opt-in)',
          ],
        },
        {
          heading: 'Data Sharing & Third Parties',
          paragraphs: [
            'We share data only when necessary for service delivery or legal compliance. We never sell personal data.',
          ],
          bullets: [
            'Healthcare Providers: Your information is shared with your assigned doctor to enable consultations and care coordination',
            'Payment Processors: Credit card and payment data is shared with PCI-DSS compliant payment processors (Stripe, PayPal)',
            'Cloud Infrastructure: Data is stored on secure AWS servers with encryption and access controls',
            'Legal Authorities: Data is disclosed to law enforcement only when legally compelled by court order or subpoena',
            'Service Providers: Qualified vendors assist with email delivery, analytics, and customer support (all bound by confidentiality agreements)',
            'Business Partners: Anonymized data may be shared with healthcare researchers or system integrators with written agreements',
            'No Marketing Partners: We do not share personal data with third-party marketers',
          ],
        },
        {
          heading: 'Data Security & Protection',
          paragraphs: [
            'We implement enterprise-grade security to protect your information.',
          ],
          bullets: [
            'Encryption: All data is encrypted at rest (AES-256) and in transit (TLS 1.2+)',
            'Access Controls: Role-based permissions ensure users access only necessary data',
            'Authentication: Multi-factor authentication available for all accounts',
            'Monitoring: Security logs are monitored 24/7 for suspicious activity',
            'Backup: Automated daily backups ensure data recovery in emergencies',
            'Pen Testing: Regular security audits and penetration tests are conducted',
            'Employee Access: Staff access is restricted, logged, and subject to oversight',
            'Incident Response: A documented process is in place to detect, investigate, and disclose security breaches',
          ],
          callout: 'While we implement industry-standard protections, no security system is 100% impenetrable. We continually improve our safeguards.',
        },
        {
          heading: 'Your Rights',
          paragraphs: [
            'You have rights regarding your personal data under GDPR, CCPA, and healthcare privacy laws.',
          ],
          bullets: [
            'Right to Access: Request a copy of all information we hold about you',
            'Right to Correction: Update inaccurate or incomplete information',
            'Right to Deletion: Request permanent deletion of your account and data (except where legally required to retain)',
            'Right to Portability: Receive your data in a standard, machine-readable format to transfer to other providers',
            'Right to Withdraw Consent: Opt out of marketing, non-essential analytics, and research at any time',
            'Right to Restrict Processing: Ask us to limit how we use your data',
            'Right to Object: Oppose certain processing activities',
            'Right to Lodge a Complaint: File a complaint with your local data protection authority',
          ],
        },
        {
          heading: 'Data Retention',
          paragraphs: [
            'We retain data only as long as necessary to provide services or comply with legal obligations.',
          ],
          bullets: [
            'Active Accounts: Data is retained while your account is active',
            'Medical Records: Retained for 7 years after the last consultation (standard healthcare practice)',
            'Payment Records: Retained for 7 years for tax and audit purposes',
            'After Deletion: Backup copies are deleted within 30 days unless legally required to retain',
            'Logs & Analytics: System logs are retained for 12 months; anonymized analytics are retained indefinitely',
          ],
        },
        {
          heading: 'Children & Minors',
          paragraphs: [
            'Clinexa is not intended for users under 13 years old. Parental consent is required for minors 13-18. We do not knowingly collect data from children under 13.',
            'If we learn that a child under 13 has created an account, we will delete it immediately.',
          ],
        },
        {
          heading: 'International Data Transfers',
          paragraphs: [
            'Our servers are located in the United States. By using Clinexa, you consent to your data being transferred and stored in the US.',
            'For EU residents, we comply with GDPR Standard Contractual Clauses (SCCs) to ensure adequate data protection.',
          ],
        },
        {
          heading: 'Changes to This Policy',
          paragraphs: [
            'This Privacy Policy may be updated to reflect changes in our practices, technology, or legal requirements. We will notify users of material changes via email or platform announcement.',
            'Continued use after changes implies acceptance of the updated policy.',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'definition',
          title: 'What is HIPAA?',
          content: 'The Health Insurance Portability and Accountability Act is a US federal law that protects the privacy of health information. Clinexa complies with HIPAA standards for all processing, storage, and breach notification.',
        },
        {
          type: 'escalation',
          title: 'Privacy Concerns or Requests',
          content: 'To request data access, deletion, or file a privacy complaint, email privacy@clinexa.com. We respond within 15 business days.',
        },
      ]}
    />
  );
}
