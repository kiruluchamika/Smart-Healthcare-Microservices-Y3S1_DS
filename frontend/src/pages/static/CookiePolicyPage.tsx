import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function CookiePolicyPage() {
  return (
    <StaticPageTemplate
      title="Cookie Policy"
      description="This policy describes how Clinexa uses cookies and similar technologies to enhance your experience, maintain security, and understand how the platform is used."
      lastUpdated="April 15, 2026"
      eyebrow="Tracking & Consent"
      variant="cookie"
      highlights={[
        {
          label: "Cookie Types",
          value: "3",
          detail: "Essential, functional, and analytics"
        },
        {
          label: "Opt-Out",
          value: "Available",
          detail: "Disable non-essential cookies anytime"
        },
        {
          label: "Lifespan",
          value: "Varied",
          detail: "From session-only to 2 years"
        }
      ]}
      sections={[
        {
          heading: 'What Are Cookies?',
          paragraphs: [
            'Cookies are small text files stored on your device (computer, phone, tablet) that enable websites to recognize you on return visits.',
            'Similar technologies include web beacons, pixels, and local storage. This policy refers to all these technologies collectively as "cookies."',
          ],
        },
        {
          heading: 'Why We Use Cookies',
          paragraphs: [
            'Cookies serve essential functions to maintain your login session, protect account security, and improve user experience.',
            'We also use cookies to understand how users interact with the Platform, identify issues, and personalize recommendations.',
          ],
          bullets: [
            'Maintain your login session so you do not need to re-authenticate with each page',
            'Remember your preferences (language, theme, accessibility settings)',
            'Protect your account from unauthorized access and detect suspicious activity',
            'Support platform functionality like appointment booking and telemedicine video streaming',
            'Measure traffic, analyze user behavior, and improve features',
            'Deliver personalized content and doctor recommendations',
          ],
        },
        {
          heading: 'Types of Cookies',
          paragraphs: [
            'Clinexa uses three categories of cookies: Essential, Functional, and Analytics.',
          ],
          bullets: [
            'Essential Cookies: Required for basic platform functionality. Cannot be disabled without breaking core features. Examples: session ID, CSRF tokens, user authentication.',
            'Functional Cookies: Enhance user experience by remembering preferences and settings. Examples: language selection, theme preference, appointment filter settings.',
            'Analytics Cookies: Track usage patterns to improve platform performance and user experience. Examples: pageviews, time on page, feature usage.',
          ],
        },
        {
          heading: 'Essential Cookies (Required)',
          paragraphs: [
            'These cookies are necessary for the Platform to function. You cannot opt out without affecting functionality.',
          ],
          bullets: [
            'Session Cookie (session_id): Maintains your login state across pages. Expires when you close the browser.',
            'CSRF Protection (_csrf_token): Prevents cross-site request forgery attacks. Renewed on each request.',
            'Authentication Cookie (auth_token): Stores your encrypted authentication token. Expires after 30 days of inactivity.',
            'Security Cookie (_secure_flag): Flags whether the connection is secure (HTTPS). Session-only.',
            'User Role Cookie (user_role): Stores your role (patient, doctor, admin) for quick access control. Expires after 24 hours.',
          ],
        },
        {
          heading: 'Functional Cookies (Optional)',
          paragraphs: [
            'These cookies improve user experience. You can opt out, but some features may be less convenient.',
          ],
          bullets: [
            'Language Preference (lang_preference): Remembers your selected language. Expires after 1 year.',
            'Theme Setting (theme_preference): Stores your dark/light mode selection. Expires after 1 year.',
            'Accessibility Settings (a11y_settings): Remembers accessibility preferences like high contrast or enlarged fonts. Expires after 1 year.',
            'Filter Preferences (filter_state): Saves your appointment filter settings for convenience. Expires after 30 days.',
            'Sidebar State (sidebar_collapsed): Remembers if your dashboard sidebar is collapsed. Session-only.',
          ],
        },
        {
          heading: 'Analytics Cookies (Optional)',
          paragraphs: [
            'These cookies help us understand platform usage and improve features. You can opt out.',
          ],
          bullets: [
            'Google Analytics (ga, gid): Tracks page views, session duration, and user flow. Expires after 2 years.',
            'Session Analytics (analytics_id): Tracks feature usage and identifies bottlenecks. Expires after 90 days.',
            'Performance Monitoring (__track_pageload): Measures page load performance and identifies issues. Session-only.',
            'Error Tracking (error_logs): Records JavaScript errors to identify bugs. Expires after 30 days.',
          ],
        },
        {
          heading: 'Third-Party Cookies',
          paragraphs: [
            'Some third-party services used by Clinexa may set their own cookies.',
          ],
          bullets: [
            'Payment Processors (Stripe, PayPal): Set cookies for secure payment processing and fraud prevention',
            'Cloud Services (AWS): Set cookies for content delivery and infrastructure management',
            'Support Tools (Zendesk): Set cookies for live chat and support ticket tracking',
            'These services have their own privacy policies. We recommend reviewing their policies for details.',
          ],
        },
        {
          heading: 'Managing Cookies',
          paragraphs: [
            'You can control cookie settings through your browser or through Clinexa\'s preference center.',
          ],
          bullets: [
            'Browser Settings: Most browsers allow you to accept, reject, or delete cookies. Visit your browser\'s settings to manage cookies.',
            'Clinexa Preference Center: You can opt in or out of functional and analytics cookies within your account settings (Patient Settings > Privacy > Cookie Preferences).',
            'Do Not Track: If your browser sends a "Do Not Track" signal, we will honor it for non-essential tracking.',
            'Disable Cookies: Disabling essential cookies will break login functionality. Disabling others may reduce functionality but will not prevent basic access.',
          ],
        },
        {
          heading: 'Cookie Duration',
          paragraphs: [
            'Cookies have different lifespans based on their purpose.',
          ],
          bullets: [
            'Session Cookies: Deleted when you close your browser',
            'Persistent Cookies: Stored for a fixed period (e.g., 1 year, 2 years) unless you delete them manually',
            'First-Party Cookies: Set by Clinexa and stored on your device',
            'Third-Party Cookies: Set by external services and stored per their policies',
          ],
        },
        {
          heading: 'Privacy & Security',
          paragraphs: [
            'Cookies do not contain sensitive information like passwords or medical data. All cookies are encrypted in transit.',
            'Authentication cookies are securely signed and cannot be forged or modified.',
          ],
          bullets: [
            'Session cookies use secure, httpOnly flags to prevent JavaScript access',
            'Analytics cookies are anonymized and do not personally identify you',
            'Payment cookies are set by third-party processors and follow PCI-DSS standards',
          ],
        },
        {
          heading: 'Changes to Cookie Policy',
          paragraphs: [
            'We may update this policy to reflect new technologies, user preferences, or legal requirements.',
            'Material changes will be communicated via email or platform notification.',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'definition',
          title: 'Local Storage & Similar Technologies',
          content: 'In addition to cookies, we use browser local storage and IndexedDB for offline functionality, caching, and performance optimization. These follow similar privacy and security practices as cookies.',
        },
        {
          type: 'requirement',
          title: 'Cookie Consent',
          content: 'Upon first visit, you will be prompted to accept or reject non-essential cookies. You can change your preferences anytime in your account settings or by contacting privacy@clinexa.com.',
        },
      ]}
    />
  );
}
