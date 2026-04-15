import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function GuidelinesPage() {
  return (
    <StaticPageTemplate
      title="Platform Guidelines"
      description="These guidelines define professional conduct, ethical usage, and safe platform practices for all users. Adherence is required to maintain account access."
      lastUpdated="April 15, 2026"
      eyebrow="Conduct & Standards"
      variant="guidelines"
      highlights={[
        {
          label: "User Accounts",
          value: "100,000+",
          detail: "Operating under consistent community standards"
        },
        {
          label: "Violations",
          value: "< 0.1%",
          detail: "Clear policies and swift enforcement"
        },
        {
          label: "Support",
          value: "24/7",
          detail: "Report guideline violations anytime"
        }
      ]}
      sections={[
        {
          heading: 'General User Conduct',
          paragraphs: [
            'All users must treat the platform and other community members with respect. Clinexa is a healthcare platform, and conduct should reflect professionalism and good faith.',
            'Abusive behavior, discrimination, harassment, or illegal activity will result in account suspension or termination without refund.',
          ],
          bullets: [
            'Be respectful to doctors, administrators, and other patients during all interactions',
            'Provide truthful information when creating accounts, booking appointments, and entering health data',
            'Do not attempt to interfere with, overwhelm, or hack the platform or other user accounts',
            'Do not attempt to impersonate staff, doctors, or other users',
            'Do not sell, trade, or transfer your account to another person',
            'Use the platform lawfully and in compliance with local and national regulations',
          ],
          callout: 'Violations of these guidelines are reviewed on a case-by-case basis. We enforce consistently and fairly.',
        },
        {
          heading: 'For Patients',
          paragraphs: [
            'Patients use Clinexa to access healthcare services. Your usage must align with the platform\'s intended purpose.',
          ],
          bullets: [
            'Provide accurate health information during consultations to ensure doctors can provide appropriate care',
            'Keep appointment commitments. Repeated no-shows may result in booking restrictions',
            'Respect your doctor\'s professional judgment and recommendations, even if you disagree',
            'Clearly describe your symptoms and medical history to support better consultations',
            'Do not demand prescriptions or treatments outside standard medical practice',
            'Report any concerning doctor behavior to support@clinexa.com immediately',
            'Understand that telemedicine is not appropriate for medical emergencies',
            'Keep your password and account credentials secure and private',
          ],
        },
        {
          heading: 'For Doctors & Healthcare Providers',
          paragraphs: [
            'Doctors are responsible for maintaining professional standards and providing evidence-based care.',
            'All doctors on Clinexa are licensed, verified healthcare professionals. Failure to maintain professional conduct results in immediate account suspension.',
          ],
          bullets: [
            'Provide consultations in accordance with your medical license and local scope of practice',
            'Document all consultations thoroughly with clinical notes, findings, and recommendations',
            'Verify patient identity and maintain confidentiality during every interaction',
            'Obtain informed consent before providing care or issuing prescriptions',
            'Escalate emergencies to in-person or emergency care immediately; do not attempt remote management',
            'Respect your duty of care and do not provide services outside your competence',
            'Maintain professional boundaries with patients; romantic or inappropriate relationships are prohibited',
            'Report platform misuse, security vulnerabilities, or other concerns to our security team',
            'Never share patient information outside the platform without explicit written consent where legally required',
          ],
        },
        {
          heading: 'Telemedicine Best Practices',
          paragraphs: [
            'Remote consultations require special attention to ensure quality, safety, and compliance.',
          ],
          bullets: [
            'Both parties: Ensure adequate lighting, sound, and privacy for all video consultations',
            'Patients: Verify you\'re consulting with the correct doctor and that you recognize them (use video verification)',
            'Doctors: Maintain professional attire and confirm your credentials are visible when joining consultations',
            'Both parties: Keep consultations on-topic and professional; do not share personal contact details',
            'Doctors: Document the date, time, duration, and clinical content of every consultation',
            'Patients: Ask questions if you don\'t understand recommendations or next steps',
            'Do not attempt to record consultations without both parties\' explicit consent (where legal)',
            'Maintain HIPAA and healthcare privacy compliance throughout all interactions',
          ],
        },
        {
          heading: 'Medical Records & Data Handling',
          paragraphs: [
            'Patient health data is sensitive and requires strict confidentiality and security.',
          ],
          bullets: [
            'Access only records relevant to providing care; unnecessary access is audited and flagged',
            'Never download, screenshot, or export patient data outside clinical necessity',
            'Keep all shared records and prescriptions within the Clinexa platform unless patient requests external sharing',
            'Doctors: Ensure medical records are accurate and complete before finalizing consultations',
            'Report any suspicious access, data sharing, or security concerns to support@clinexa.com',
            'Administrators: Access patient data only for platform management or authorized audits',
            'Understand that all actions are logged and subject to compliance review',
          ],
        },
        {
          heading: 'Prohibited Activities',
          paragraphs: [
            'The following activities are strictly prohibited and will result in immediate account suspension or termination:',
          ],
          bullets: [
            'Fraudulent charges, payment disputes without valid reasons, or financial abuse',
            'Sexual harassment, discrimination, or abusive language toward any user',
            'Attempting to circumvent security measures, bypass access controls, or hack the platform',
            'Soliciting or providing services outside the platform to circumvent Clinexa',
            'Posting or sharing explicit, violent, or illegal content',
            'Spam, phishing, or attempts to steal login credentials',
            'Unauthorized reselling of Clinexa credits or accounts',
            'Operating under false identity or misrepresenting qualifications (especially for doctors)',
            'Accessing or modifying other users\' accounts or records without authorization',
          ],
        },
        {
          heading: 'Content & Communication Standards',
          paragraphs: [
            'All communication within Clinexa must be professional and appropriate for a healthcare platform.',
          ],
          bullets: [
            'Avoid profanity, slurs, and disrespectful language in messages, notes, or feedback',
            'Do not share political, religious, or controversial opinions unrelated to healthcare',
            'Respect patient autonomy and do not impose personal beliefs during clinical interactions',
            'Keep all messaging focused on healthcare needs or administrative topics',
            'Report offensive or inappropriate content using the report feature or contacting support',
          ],
        },
        {
          heading: 'Account Security & Privacy',
          paragraphs: [
            'You are responsible for maintaining the security of your account.',
          ],
          bullets: [
            'Use a strong, unique password and enable multi-factor authentication',
            'Do not share your login credentials with anyone, including family members',
            'Log out after each session, especially on shared devices',
            'Report suspicious activity or unauthorized access immediately to support',
            'Keep your recovery email and phone number current for account recovery',
            'Review your activity logs regularly to spot any unauthorized access',
          ],
        },
        {
          heading: 'Enforcement & Appeals',
          paragraphs: [
            'Violations are reviewed and acted upon promptly. Enforcement can range from warnings to account termination.',
          ],
          bullets: [
            'Minor violations: First warning with information on the guideline',
            'Repeated violations: Account restrictions such as booking limitations or messaging delays',
            'Serious violations: Immediate account suspension pending investigation',
            'Illegal activity: Account termination and potential referral to law enforcement',
          ],
          callout: 'If your account is suspended or terminated, you may appeal by emailing appeals@clinexa.com within 30 days. We will review and provide a decision within 5 business days.',
        },
      ]}
      contentBlocks={[
        {
          type: 'requirement',
          title: 'Compliance Note',
          content: 'These guidelines comply with healthcare privacy regulations (HIPAA), consumer protection laws, and professional medical ethics standards. Continued use of Clinexa implies acceptance of these guidelines.',
        },
        {
          type: 'escalation',
          title: 'Report Violations',
          content: 'Suspected guideline violations can be reported to safety@clinexa.com with details and evidence. All reports are reviewed confidentially.',
        },
      ]}
    />
  );
}
