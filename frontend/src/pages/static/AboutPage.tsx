import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function AboutPage() {
  return (
    <StaticPageTemplate
      title="About Clinexa"
      description="Clinexa is a comprehensive digital healthcare platform designed to make quality care accessible, secure, and convenient for patients, healthcare providers, and administrators."
      lastUpdated="April 15, 2026"
      eyebrow="Platform Overview"
      variant="about"
      highlights={[
        {
          label: "Patient Focus",
          value: "100,000+",
          detail: "Active patients trusting us with their care"
        },
        {
          label: "Providers",
          value: "2,500+",
          detail: "Licensed doctors and healthcare professionals"
        },
        {
          label: "Uptime",
          value: "99.9%",
          detail: "Commitment to reliability and availability"
        }
      ]}
      sections={[
        {
          heading: 'Our Mission',
          paragraphs: [
            'Clinexa exists to bridge the gap between patients seeking care and healthcare providers delivering it. We believe that geography, scheduling conflicts, and access barriers should never prevent someone from receiving quality medical attention.',
            'Our platform eliminates friction in the healthcare delivery process by providing secure, intuitive digital workflows for appointment booking, telemedicine consultations, medical record management, and care coordination.',
          ],
        },
        {
          heading: 'How We Work',
          paragraphs: [
            'Patients use Clinexa to discover qualified doctors, book consultations at convenient times, and access their medical history in one place. Doctors leverage our tools to manage schedules, conduct remote consultations, document care decisions, and collaborate with colleagues. Administrators monitor platform health, ensure compliance, and support both user groups with operational oversight.',
            'Every interaction on Clinexa is protected by enterprise-grade security, role-based access controls, and compliance with healthcare data regulations.',
          ],
          bullets: [
            'Appointment booking with real-time availability',
            'Secure video consultations with integrated documentation',
            'Complete medical history and records management',
            'AI-powered symptom assessment and doctor suggestions',
            'Prescription and medical report management',
            'Multi-role administrative dashboards',
          ],
        },
        {
          heading: 'Our Values',
          paragraphs: [
            'Trust: We protect patient privacy and healthcare data with the highest security standards.',
            'Accessibility: We design for all users, regardless of technical skill or digital literacy.',
            'Quality: We prioritize reliability, accuracy, and evidence-based healthcare workflows.',
            'Innovation: We continuously improve based on feedback from patients, doctors, and healthcare researchers.',
          ],
          callout: 'Clinexa is built by a team of healthcare technologists, clinicians, and security experts who believe technology should serve patients and providers, not complicate care.',
        },
        {
          heading: 'Platform Capabilities',
          paragraphs: [
            'Our integrated suite includes appointment management, telemedicine infrastructure, medical record systems, and administrative dashboards. All components are designed to work together seamlessly, ensuring a cohesive experience for every user.',
          ],
          bullets: [
            'End-to-end appointment lifecycle management',
            'High-definition video consultation with screen sharing',
            'Patient symptom pre-assessment for better consultations',
            'Integrated electronic health record (EHR) access',
            'Secure prescription issuance and tracking',
            'Comprehensive audit logs and compliance reporting',
            'Role-based access with granular permissions',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'commitment',
          title: 'Security Commitment',
          content: 'All patient data is encrypted at rest and in transit. We comply with HIPAA standards and conduct regular security audits. Multi-factor authentication is available for all accounts.',
        },
        {
          type: 'requirement',
          title: 'Professional Standards',
          content: 'All doctors on our platform are licensed healthcare professionals verified through standard credentialing processes. Patient consent and privacy are paramount in every interaction.',
        },
      ]}
    />
  );
}