import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function TermsAndConditionsPage() {
  return (
    <StaticPageTemplate
      title="Terms and Conditions"
      description="These terms of service govern your use of Clinexa. By accessing or using the Platform, you agree to be bound by these terms."
      lastUpdated="April 15, 2026"
      eyebrow="Legal Agreement"
      variant="terms"
      highlights={[
        {
          label: "Effective Date",
          value: "Jan 1, 2024",
          detail: "Last updated April 15, 2026"
        },
        {
          label: "Users",
          value: "3 Types",
          detail: "Patients, Doctors, Administrators"
        },
        {
          label: "Jurisdiction",
          value: "US",
          detail: "Governed by California and US law"
        }
      ]}
      sections={[
        {
          heading: 'Agreement to Terms',
          paragraphs: [
            'By accessing, browsing, or using Clinexa (the "Platform"), you agree to comply with and be legally bound by these Terms and Conditions ("Agreement").',
            'If you do not agree to any part of these terms, you may not use the Platform. We may modify these terms at any time. Continued use implies acceptance of changes.',
          ],
        },
        {
          heading: 'Platform Purpose & Limitations',
          paragraphs: [
            'Clinexa is a digital healthcare platform designed to facilitate access to medical consultations, telemedicine services, and health record management.',
            'Important: Clinexa is NOT an emergency medical service. Do not use this Platform for medical emergencies. In case of emergency, dial 911 or your local emergency number immediately.',
          ],
          bullets: [
            'Consultations are conducted by licensed, verified healthcare professionals',
            'All medical advice is subject to the limitations of remote consultations',
            'The Platform does not replace in-person medical evaluation when clinically necessary',
            'Users must seek in-person care for conditions requiring physical examination, complex diagnostics, or emergency intervention',
          ],
          callout: 'By using Clinexa, you acknowledge that remote consultations have inherent limitations and assume full responsibility for seeking appropriate in-person care when needed.',
        },
        {
          heading: 'User Accounts & Eligibility',
          paragraphs: [
            'Users must be at least 13 years old. Minors aged 13-18 require verified parental or guardian consent.',
          ],
          bullets: [
            'You must provide accurate, complete, and truthful information during registration',
            'You are responsible for maintaining the confidentiality of your password and account credentials',
            'You are liable for all activities conducted under your account',
            'You agree not to share your account with other users or allow unauthorized access',
            'Clinexa reserves the right to terminate accounts for false or misleading information',
          ],
        },
        {
          heading: 'Use of the Platform',
          paragraphs: [
            'By using Clinexa, you agree to use it lawfully and in accordance with these terms.',
          ],
          bullets: [
            'Do not attempt to hack, interfere with, or disrupt the Platform or other user accounts',
            'Do not conduct transactions outside the Platform to circumvent security, verification, or payment systems',
            'Do not harass, discriminate against, or abuse other users, doctors, or staff',
            'Do not post illegal, obscene, offensive, or defamatory content',
            'Do not access other users\' information or records without authorization',
            'Do not engage in fraud, misrepresentation, or unauthorized use of the Platform',
            'Your use must comply with all applicable laws and regulations in your jurisdiction',
          ],
        },
        {
          heading: 'Patient Responsibilities',
          paragraphs: [
            'Patients using Clinexa for healthcare services agree to the following responsibilities.',
          ],
          bullets: [
            'Provide accurate health information, medical history, and current symptoms to your healthcare provider',
            'Disclose all relevant medications, allergies, and pre-existing conditions',
            'Follow professional medical advice and treatment recommendations',
            'Attend scheduled appointments or provide timely cancellation notice',
            'Maintain payment obligations for services rendered',
            'Understand that diagnosis and treatment determination is the doctor\'s professional responsibility',
            'Report any concerns about doctor conduct to support@clinexa.com',
          ],
        },
        {
          heading: 'Healthcare Provider Responsibilities',
          paragraphs: [
            'All doctors using Clinexa must maintain professional healthcare standards.',
          ],
          bullets: [
            'Maintain a valid, current medical license in the jurisdiction where you practice',
            'Provide care within your scope of practice and professional competency',
            'Obtain informed consent from patients before providing care',
            'Document consultations and maintain accurate clinical records',
            'Maintain patient confidentiality and comply with healthcare privacy regulations',
            'Do not engage in inappropriate relationships or boundary violations with patients',
            'Escalate emergency symptoms to in-person or emergency care immediately',
            'Report platform security issues to our security team',
          ],
        },
        {
          heading: 'Payment & Billing',
          paragraphs: [
            'Payment for consultations is due at the time of booking. By scheduling an appointment, you authorize payment processing.',
          ],
          bullets: [
            'Consultation fees are set by individual doctors; fees vary based on specialty and experience',
            'Clinexa charges a platform fee (typically 2-3%) in addition to doctor fees',
            'All fees are clearly displayed before booking confirmation',
            'Payments are processed by secure third-party payment providers (Stripe, PayPal, etc.)',
            'Refunds are issued for cancellations made more than 1 hour before the scheduled appointment',
            'Cancellations within 1 hour of the scheduled time are non-refundable',
            'No-shows are non-refundable and may result in booking restrictions',
            'Disputed charges must be reported within 30 days with evidence',
          ],
        },
        {
          heading: 'Intellectual Property',
          paragraphs: [
            'All content, design, functionality, and intellectual property on the Platform are owned by Clinexa or licensed partners.',
          ],
          bullets: [
            'You may not copy, reproduce, or distribute content without written permission',
            'You may not modify, reverse-engineer, or attempt to derive source code from the Platform',
            'Limited license is granted for personal, non-commercial use only',
            'All rights not explicitly granted are reserved',
          ],
        },
        {
          heading: 'Data & Privacy',
          paragraphs: [
            'Your privacy and data security are fundamental rights. Refer to our Privacy Policy for how your data is handled.',
            'By using Clinexa, you consent to the collection, processing, and use of your data as described in the Privacy Policy.',
          ],
          bullets: [
            'Your medical records are confidential and protected by healthcare privacy laws',
            'You have the right to request access, correction, or deletion of your data',
            'We use industry-standard encryption and security measures to protect your information',
            'Data breaches are investigated and disclosed according to legal requirements',
          ],
        },
        {
          heading: 'Limitation of Liability',
          paragraphs: [
            'To the extent permitted by law, Clinexa and its affiliates shall not be liable for indirect, incidental, consequential, or punitive damages arising from your use of the Platform.',
          ],
          bullets: [
            'We are not liable for medical outcomes, diagnosis accuracy, or treatment effectiveness',
            'We are not liable for service interruptions, data loss, or security breaches (except where negligent)',
            'We are not liable for third-party content, links, or services',
            'Maximum liability is limited to the amount paid for services in the preceding 12 months',
          ],
          callout: 'Certain jurisdictions do not allow limitation of liability for health care services. These limitations may not apply to you.',
        },
        {
          heading: 'Disclaimer of Warranties',
          paragraphs: [
            'The Platform is provided "as is" without warranties of any kind.',
          ],
          bullets: [
            'We do not warrant that the Platform is error-free, uninterrupted, or fit for your specific purpose',
            'We do not warrant the accuracy or completeness of health information or doctor recommendations',
            'Medical consultations are provided at the doctor\'s professional discretion; outcomes are not guaranteed',
            'We recommend consulting in-person healthcare providers for complex or urgent conditions',
          ],
        },
        {
          heading: 'Termination',
          paragraphs: [
            'Clinexa may suspend or terminate your account at any time for violation of these terms or applicable laws.',
          ],
          bullets: [
            'Severe violations (fraud, abuse, illegal activity) result in immediate termination',
            'Minor violations may result in warnings or temporary restrictions',
            'Upon termination, you lose access to the Platform and your account data (within legal and retention limits)',
            'You may appeal termination within 30 days by emailing appeals@clinexa.com',
          ],
        },
        {
          heading: 'Governing Law & Dispute Resolution',
          paragraphs: [
            'These terms are governed by the laws of the State of California and the United States, without regard to conflict of law principles.',
            'Any dispute arising from these terms shall first be addressed through good-faith negotiation. If unresolved, disputes may be subject to binding arbitration under AAA rules.',
          ],
          bullets: [
            'You agree to waive your right to a jury trial in any dispute',
            'You agree to participate in binding arbitration rather than litigation',
            'Small claims court is available for claims below $5,000',
            'Prevailing party in arbitration may recover reasonable attorney fees',
          ],
        },
        {
          heading: 'Contact Information',
          paragraphs: [
            'For questions about these terms, contact legal@clinexa.com. We respond within 10 business days.',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'requirement',
          title: 'Acknowledgment',
          content: 'By clicking "I Agree" during registration or continuing to use the Platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.',
        },
        {
          type: 'definition',
          title: 'Effective Date',
          content: 'These terms became effective on January 1, 2024, and were last updated on April 15, 2026. Material changes will be communicated via email.',
        },
      ]}
    />
  );
}
