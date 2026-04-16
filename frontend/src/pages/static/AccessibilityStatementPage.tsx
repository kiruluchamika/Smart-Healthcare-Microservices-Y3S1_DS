import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function AccessibilityStatementPage() {
  return (
    <StaticPageTemplate
      title="Accessibility Statement"
      description="Clinexa is committed to ensuring digital accessibility for all users. We design the platform to be usable by everyone, regardless of ability."
      lastUpdated="April 15, 2026"
      eyebrow="Digital Inclusion"
      variant="accessibility"
      highlights={[
        {
          label: "Standard",
          value: "WCAG 2.1 AA",
          detail: "Web Content Accessibility Guidelines compliance"
        },
        {
          label: "Commitment",
          value: "Active",
          detail: "Continuous accessibility improvements"
        },
        {
          label: "Support",
          value: "Available",
          detail: "Dedicated accessibility assistance"
        }
      ]}
      sections={[
        {
          heading: 'Our Accessibility Commitment',
          paragraphs: [
            'Clinexa is committed to designing and maintaining our platform to be accessible to all users, including those with disabilities. We believe digital healthcare should be inclusive.',
            'Our accessibility efforts align with the Web Content Accessibility Guidelines (WCAG 2.1) Level AA standards and the Americans with Disabilities Act (ADA).',
          ],
        },
        {
          heading: 'Accessibility Features',
          paragraphs: [
            'We provide features to support users with various disabilities.',
          ],
          bullets: [
            'Keyboard Navigation: All functionality is accessible via keyboard; mouse is not required',
            'Screen Reader Support: The platform is compatible with popular screen readers (NVDA, JAWS, VoiceOver)',
            'High Contrast Mode: Users can activate a high-contrast color scheme for improved readability',
            'Font Size Control: Text can be enlarged up to 200% in browser settings without loss of functionality',
            'Readable Fonts: We use sans-serif fonts designed for readability on screens',
            'Color Independence: Information is not conveyed by color alone; visual indicators also use text or icons',
            'Form Labels: All form fields have clear, associated labels for screen reader users',
            'Focus Indicators: A visible focus indicator shows which element has keyboard focus',
            'Skip Links: Users can skip navigation elements to jump directly to content',
            'Captions & Transcripts: Video content includes captions; audio content has transcripts available',
          ],
        },
        {
          heading: 'Telemedicine Accessibility',
          paragraphs: [
            'We provide accessibility features for telemedicine consultations.',
          ],
          bullets: [
            'Video Call Accessibility: Captions can be enabled during video consultations; doctors can accommodate communication needs',
            'Alternative Communication: You may request text-based chat or email consultations instead of video',
            'Assistive Technology: Telemedicine supports compatibility with screen readers and speech recognition',
            'Background Accommodation: Doctors understand accessibility needs and can adjust their environment (lighting, positioning)',
            'ASL Interpretation: Upon request, we can arrange sign language interpreters for video consultations (advance notice required)',
            'Document Accessibility: Medical reports and records are provided in accessible formats (e.g., PDF with tags)',
          ],
        },
        {
          heading: 'Compliance & Standards',
          paragraphs: [
            'Our platform is designed and tested to meet accessibility standards.',
          ],
          bullets: [
            'WCAG 2.1 Level AA: Primary compliance target; most features meet Level AAA standards',
            'Section 508: Compliance with US federal accessibility law',
            'ADA Title II: Compliance with Americans with Disabilities Act for digital services',
            'ARIA Landmarks: Proper semantic HTML and ARIA landmarks for assistive technology navigation',
            'Testing: Regular automated and manual accessibility testing is conducted',
            'Assistive Technology: Compatibility with common screen readers, magnifiers, and voice control',
          ],
        },
        {
          heading: 'Accessibility Issue Categories',
          paragraphs: [
            'We continuously identify and address accessibility barriers.',
          ],
          bullets: [
            'Keyboard Access: Ensuring all interactive elements are keyboard accessible',
            'Screen Reader Support: Providing proper semantic markup and ARIA labels',
            'Visual Design: Ensuring sufficient color contrast (4.5:1 for text)',
            'Motor Access: Allowing alternative input methods for users with mobility limitations',
            'Cognitive Access: Using clear language, logical navigation, and consistent interaction patterns',
            'Sensory Access: Providing alternatives for audio and visual information',
          ],
        },
        {
          heading: 'Accessibility Settings',
          paragraphs: [
            'Users can customize the platform to meet their accessibility needs.',
          ],
          bullets: [
            'Settings Menu: Visit Patient Settings > Accessibility to access customization options',
            'Color Themes: Toggle between standard, high-contrast, and dark modes',
            'Font Size: Adjust text size in browsers using zoom controls (Ctrl +/- on Windows, Cmd +/- on Mac)',
            'Reduce Motion: Enable reduced animation for users sensitive to motion',
            'Focus Indicators: Enhanced focus indicators highlight the active element',
            'Sound Notifications: Opt for visual or vibration notifications in place of audio alerts',
          ],
        },
        {
          heading: 'Known Accessibility Issues',
          paragraphs: [
            'While we strive for full accessibility, some known issues may affect certain users.',
          ],
          bullets: [
            'Third-Party Payment: Payment processors (Stripe, PayPal) have their own accessibility implementations; contact support for payment assistance',
            'External Links: Some external resources may not meet our accessibility standards; we are working with partners to improve',
            'Legacy Content: Older pages or documents may not be fully accessible; contact support for accessible alternatives',
          ],
        },
        {
          heading: 'Feedback & Continuous Improvement',
          paragraphs: [
            'Your feedback helps us improve. We actively work to identify and resolve accessibility barriers.',
          ],
          bullets: [
            'Report Issues: Found an accessibility problem? Email accessibility@clinexa.com with details',
            'What to Include: Describe the issue, which browser and assistive technology you used, and steps to reproduce',
            'Response Timeline: We respond to accessibility reports within 5 business days',
            'Priority: We prioritize accessibility issues affecting core features and multiple users',
            'Share Your Experience: Tell us what works well so we can continue supporting your needs',
          ],
          callout: 'Accessibility is an ongoing commitment. We review and improve accessibility regularly based on user feedback and testing.',
        },
        {
          heading: 'Accessibility Resources for Users',
          paragraphs: [
            'Here are resources to help you use Clinexa optimally with your technology.',
          ],
          bullets: [
            'Screen Reader Setup: Learn how to configure NVDA, JAWS, or VoiceOver for web browsing',
            'Keyboard Shortcuts: A guide to keyboard shortcuts in Clinexa is available in Help',
            'Browser Accessibility: Most browsers have built-in zoom, text size, and contrast controls',
            'Operating System: Windows, macOS, iOS, and Android all include accessibility features',
            'Assistive Technology: Popular options include screen readers, voice control, switch access, and magnification',
          ],
        },
        {
          heading: 'Accommodations & Support',
          paragraphs: [
            'If you need special accommodations, we are happy to help.',
          ],
          bullets: [
            'Request Accommodations: Contact accessibility@clinexa.com to request custom accommodations',
            'Extended Support: We can arrange additional support for complex accessibility needs',
            'Consultation Adjustments: Doctors can adjust telemedicine for accessibility (camera positioning, lighting, pacing)',
            'Documentation: We can provide documents in alternative formats (large print, audio, Braille)',
            'No Discrimination: Accommodations are provided at no additional cost and without discrimination',
          ],
        },
        {
          heading: 'Accessibility for Specific Disabilities',
          paragraphs: [
            'Guidance for users with specific disabilities:',
          ],
          bullets: [
            'Blind or Low Vision: Use a screen reader or magnification software; captions available for video',
            'Deaf or Hard of Hearing: Captions available for video; chat or email consultations available',
            'Motor Disabilities: Full keyboard access; switch access compatible; voice control supported',
            'Cognitive Disabilities: Clear language; consistent navigation; extra time for form completion available',
            'Chronic Illness/Fatigue: Appointments can be rescheduled if you do not have energy; save preferences to reduce future effort',
          ],
        },
        {
          heading: 'Legal References',
          paragraphs: [
            'These accessibility practices align with applicable laws:',
          ],
          bullets: [
            'Americans with Disabilities Act (ADA) Title II: Digital accessibility requirements for public services',
            'Section 508 of the Rehabilitation Act: Federal requirement for accessible technology',
            'GDPR: Recognizes digital accessibility as an accessibility right (Articles 6, 7, 14)',
            'WCAG 2.1: International standard for web accessibility published by W3C',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'commitment',
          title: 'Our Promise',
          content: 'Clinexa is committed to removing barriers and providing an inclusive experience for all users. We believe everyone deserves access to quality healthcare technology.',
        },
        {
          type: 'escalation',
          title: 'Report Accessibility Issues',
          content: 'Found an accessibility barrier? Email accessibility@clinexa.com. Include description, browser, assistive technology, and reproduction steps. We respond within 5 business days.',
        },
      ]}
    />
  );
}
