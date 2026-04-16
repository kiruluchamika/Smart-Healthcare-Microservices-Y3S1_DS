import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function FAQPage() {
  const faqSections = [
    {
      heading: 'Getting Started',
      paragraphs: [
        'If this is your first visit, this section explains how to set up your account and prepare for your first consultation.',
      ],
      bullets: [
        'How do I create an account? Select Register, complete your profile, verify your email, and confirm your phone number before booking.',
        'Do I need insurance? No. You can use Clinexa with or without insurance. Pricing is shown before you confirm payment.',
        'Can family members use one account? No. For safety and medical accuracy, each person must have their own account.',
        'How do I reset my password? Use Forgot Password from the login screen and follow the secure reset link sent to your email.',
        'What devices are supported? Clinexa supports modern browsers on desktop and mobile. A stable internet connection is recommended for video calls.',
      ],
      callout: 'Tip: Complete your medical profile before booking to reduce check-in time and help doctors prepare in advance.',
    },
    {
      heading: 'Booking & Appointments',
      paragraphs: [
        'This section covers availability, cancellations, and what to expect before your session starts.',
      ],
      bullets: [
        'How do I book an appointment? Open Book Appointment, filter by specialty or doctor name, choose a slot, and confirm payment.',
        'Are same-day appointments available? Yes, depending on live doctor availability in your region and specialty.',
        'Can I reschedule or cancel? Yes. You can manage appointments from My Appointments based on policy windows.',
        'What happens if I miss a session? Missed appointments are marked as no-show and may be non-refundable under provider policy.',
        'Can I book the same doctor again? Yes. Open the doctor profile and select Book Again if slots are available.',
        'How are reminders sent? Clinexa sends email and in-app reminders before your scheduled time.',
      ],
    },
    {
      heading: 'Telemedicine Consultations',
      paragraphs: [
        'Telemedicine is designed for non-emergency care, follow-ups, and routine consultation needs.',
      ],
      bullets: [
        'Can I join from my phone? Yes. Mobile and desktop are supported. Use WiFi or strong 4G/5G for better quality.',
        'What do I need before joining? Camera and microphone permissions, private space, and government ID if requested by the provider.',
        'What if my connection drops? The platform attempts reconnect automatically. If reconnection fails, contact support to reschedule.',
        'Are video sessions recorded? No. Clinexa does not store call recordings by default. Clinical notes are documented in your record.',
        'Is telemedicine secure? Yes. Session data and messages are transmitted over encrypted channels.',
        'What if symptoms become urgent? End the session and contact emergency services immediately.',
      ],
      callout: 'Safety first: Telemedicine is not a substitute for emergency care. For severe symptoms, call your local emergency number.',
    },
    {
      heading: 'Medical Records & Privacy',
      paragraphs: [
        'Your health data is protected using role-based access controls and healthcare security standards.',
      ],
      bullets: [
        'Who can access my records? Authorized clinicians involved in your care and limited admin roles for operations and compliance.',
        'How long is data retained? Records are retained according to healthcare legal requirements and your account status.',
        'Can I export my records? Yes. You can download available records from Medical Records in your dashboard.',
        'How is data protected? Data is encrypted in transit and at rest with continuous security monitoring.',
        'Can I share records with another clinic? Yes. You can request record transfer with appropriate verification.',
        'Where can I review policy details? See the Privacy Policy and Security Policy pages for complete information.',
      ],
    },
    {
      heading: 'Payments & Billing',
      paragraphs: [
        'Payment information is shown before checkout so you can review total charges clearly.',
      ],
      bullets: [
        'How is consultation pricing set? Doctors define their base consultation fee by specialty and service type.',
        'Is there a service charge? A small platform service fee may apply and is shown during checkout.',
        'When are refunds issued? Refund eligibility depends on cancellation timing and provider policy.',
        'What if I see a duplicate charge? Contact billing support with transaction ID and booking reference for investigation.',
        'Can I pay later? Most appointments require payment at booking to reserve the slot.',
      ],
    },
    {
      heading: 'AI Features & Symptom Assessment',
      paragraphs: [
        'AI tools help with triage and doctor matching, but they do not replace clinical diagnosis.',
      ],
      bullets: [
        'What does symptom assessment do? It analyzes your entered symptoms and suggests relevant specialties and next steps.',
        'Can AI diagnose my condition? No. AI output is informational and must be reviewed by a licensed doctor.',
        'How can I improve result quality? Provide complete symptom details, duration, medications, allergies, and prior conditions.',
        'Will doctors see my AI summary? Yes. Your assessment summary is attached to your consultation context.',
      ],
    },
    {
      heading: 'Technical & Account Issues',
      paragraphs: [
        'Use these quick fixes before contacting support. Most access issues are resolved in a few steps.',
      ],
      bullets: [
        'The app is slow or unstable. Refresh the page, clear cache, and update your browser or app version.',
        'I did not receive verification email. Check spam folder and confirm your registered email address.',
        'I suspect unauthorized access. Change password immediately and enable multi-factor authentication.',
        'How do I close my account? Open Settings > Account > Delete Account and follow confirmation steps.',
      ],
      callout: 'Support priority: Account lockout, payment failures, and consultation access issues are handled first.',
    },
    {
      heading: 'For Doctors',
      paragraphs: [
        'Provider-focused answers for profile setup, scheduling, documentation, and operational workflows.',
      ],
      bullets: [
        'How do I set availability? Use Availability Manager to publish weekly slots and block unavailable periods.',
        'Can I update consultation fees? Yes. Fee changes apply to future bookings after save and confirmation.',
        'Where do I document consultations? Use consultation notes to record findings, diagnosis, and treatment plans.',
        'Can I add follow-up visits manually? Yes. Doctors can create follow-up bookings when clinically required.',
        'How do I view patient history? Open patient profile to access authorized records relevant to the consultation.',
      ],
    },
  ];

  return (
    <StaticPageTemplate
      title="Frequently Asked Questions"
      description="Find clear, practical answers about appointments, telemedicine, billing, privacy, AI tools, and account support across the Clinexa platform."
      lastUpdated="April 15, 2026"
      eyebrow="Help & Guidance"
      variant="faq"
      highlights={[
        {
          label: 'FAQ Topics',
          value: '8 Core Areas',
          detail: 'From onboarding to telemedicine and provider operations',
        },
        {
          label: 'Average Response Time',
          value: '< 1 Business Day',
          detail: 'Support replies for most account and billing questions',
        },
        {
          label: 'Knowledge Base',
          value: 'Continuously Updated',
          detail: 'Refined using real user issues and support trends',
        }
      ]}
      sections={faqSections}
      contentBlocks={[
        {
          type: 'commitment',
          title: 'Support Commitment',
          content: 'Our team monitors recurring issues and updates help content regularly to keep answers clear, practical, and aligned with real patient and provider workflows.',
        },
        {
          type: 'escalation',
          title: 'Need Immediate Help?',
          content: 'Contact support@clinexa.com or call 1-800-CLINEXA (Monday-Friday, 8 AM-6 PM PT). For medical emergencies, call your local emergency number immediately.',
        },
      ]}
    />
  );
}