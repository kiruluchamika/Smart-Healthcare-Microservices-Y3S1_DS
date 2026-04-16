import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function PatientRightsConsentPage() {
  return (
    <StaticPageTemplate
      title="Patient Rights and Informed Consent"
      description="Clinexa is committed to protecting patient rights, ensuring informed consent, and providing clear information about your healthcare choices."
      lastUpdated="April 15, 2026"
      eyebrow="Medical Ethics & Rights"
      variant="consent"
      highlights={[
        {
          label: "Core Right",
          value: "Choice",
          detail: "You control your healthcare decisions"
        },
        {
          label: "Consent",
          value: "Required",
          detail: "Before any treatment or data sharing"
        },
        {
          label: "Support",
          value: "Always Available",
          detail: "Questions about your rights anytime"
        }
      ]}
      sections={[
        {
          heading: 'Your Healthcare Rights',
          paragraphs: [
            'As a patient, you have fundamental rights regarding your healthcare decisions and medical records. Clinexa supports and protects these rights.',
          ],
          bullets: [
            'Right to Receive Care: You have the right to access healthcare services without discrimination based on age, gender, race, religion, disability, or other status',
            'Right to Information: You have the right to clear, honest information about your condition, treatment options, and healthcare providers',
            'Right to Choice: You have the right to choose your healthcare providers, treatment approaches, and whether to proceed with recommended care',
            'Right to Refuse Treatment: You may refuse any treatment or medication after understanding the risks and alternatives',
            'Right to Privacy: Your medical information is confidential and protected by healthcare privacy laws',
            'Right to Medical Records: You may request access to and copies of your medical records within 30 days',
            'Right to Corrections: You may request corrections to inaccurate information in your medical records',
            'Right to Complaint: You may file complaints about your care or the practices of healthcare providers',
          ],
        },
        {
          heading: 'Informed Consent',
          paragraphs: [
            'Informed consent means you understand the nature of your care, including potential benefits and risks, before proceeding.',
            'By using Clinexa for healthcare services, you consent to certain data processing and care delivery activities outlined below.',
          ],
          bullets: [
            'Nature of Consultation: You understand you are receiving remote consultation via telemedicine, not in-person examination',
            'Doctor Verification: You confirm the doctor you are consulting with is licensed by the state/country in which they practice',
            'Limitations: You acknowledge remote consultations have inherent limitations and may not be appropriate for all conditions',
            'Documentation: You consent to your consultation being documented in your electronic medical record',
            'Data Access: You consent to your healthcare providers accessing your medical history as needed for your care',
            'Third-Party Sharing: You consent to your data being shared with appropriate third parties (e.g., pharmacies for prescriptions) as medically necessary',
            'Research (Optional): You may opt to allow anonymized data to be used for healthcare research and platform improvement',
          ],
          callout: 'If you do not consent to any condition above, you may refuse services or request modifications. Contact support for accommodation options.',
        },
        {
          heading: 'What You Consent to by Using Clinexa',
          paragraphs: [
            'By registering and using Clinexa, you provide informed consent to the following:',
          ],
          bullets: [
            'Telemedicine Services: Remote consultation with licensed doctors is not a substitute for in-person emergency care',
            'Data Collection: Your personal, health, and usage information is collected to operate the platform and provide care',
            'Electronic Records: Your consultations, medical history, and prescriptions are stored electronically',
            'System Monitoring: Platform usage is monitored for security, quality assurance, and access control purposes',
            'Automatic Updates: Platform software is automatically updated with security patches and feature improvements',
            'Terms & Policies: You have reviewed and agree to the Terms and Conditions, Privacy Policy, and other platform policies',
          ],
        },
        {
          heading: 'Consent Withdrawal',
          paragraphs: [
            'You may withdraw or modify your consent at any time.',
          ],
          bullets: [
            'Stop Using Services: You may discontinue using Clinexa at any time without penalty',
            'Disable Communications: You may opt out of marketing emails or notifications in your account settings',
            'Modify Preferences: You may change your data sharing preferences or consent settings in your account',
            'Request Changes: You may contact privacy@clinexa.com to modify your consent (e.g., opt out of research)',
            'Delete Account: You may request permanent account deletion, which removes your data from active systems',
          ],
        },
        {
          heading: 'Risks & Alternatives',
          paragraphs: [
            'Before using Clinexa telemedicine, you should understand the risks and alternatives.',
          ],
          bullets: [
            'Telemedicine Risks: Limited physical examination; potential connection issues; inability to prescribe controlled substances in some jurisdictions; delayed responses compared to emergency care',
            'Alternatives: In-person consultations with local doctors; urgent care clinics; emergency rooms for acute conditions; telephone consultations',
            'Appropriate Conditions: Telemedicine works well for follow-ups, minor acute conditions, chronic disease management, and preventive care',
            'Inappropriate Conditions: Do not use for emergencies, potential surgical conditions, conditions requiring physical examination, or severe psychiatric emergencies',
          ],
        },
        {
          heading: 'Confidentiality & Data Sharing',
          paragraphs: [
            'Your medical information is confidential and shared only with explicit permission or legal requirement.',
          ],
          bullets: [
            'Who Has Access: Only you, your healthcare providers, and authorized administrators can access your records',
            'How Data Is Shared: Information is shared securely through encrypted channels; never sold to third parties',
            'Insurance & Billing: If billing is processed through insurance, necessary information is shared with your insurance provider per HIPAA requirements',
            'Family Access: Your family members do not have automatic access; you can grant access by invitation',
            'Pharmacy Access: Prescription information is automatically transmitted to pharmacies to fill your prescriptions',
          ],
        },
        {
          heading: 'Special Populations & Protections',
          paragraphs: [
            'Additional protections apply for minors and vulnerable populations.',
          ],
          bullets: [
            'Minors (Under 18): Parental or guardian consent is required. Parents/guardians can access minors\' records',
            'Minors (13-17): Can create accounts with parental consent; parents receive account notifications',
            'Children Under 13: Clinexa does not service children under 13 without direct parental involvement in every interaction',
            'Mental Health: Extra confidentiality protections apply for psychological counseling; psychiatrists can discuss options for emergency intervention',
            'Substance Use: Patients receive protections for substance use information (42 CFR Part 2 in the US)',
            'Reproductive Health: Information about reproductive health and pregnancy is handled with heightened privacy protections',
          ],
        },
        {
          heading: 'Your Responsibilities',
          paragraphs: [
            'Informed consent is a two-way process. Patients also have responsibilities.',
          ],
          bullets: [
            'Honest Information: Provide truthful health information to enable accurate diagnosis and safe treatment',
            'Disclose Allergies: Tell doctors about all medication allergies and adverse reactions',
            'Follow Instructions: Adhere to medical advice and treatment plans agreed upon',
            'Report Changes: Communicate any changes in your condition or new symptoms to your doctor',
            'Secure Your Account: Protect your login credentials and report unauthorized access',
            'Scope Understanding: Use telemedicine only for conditions appropriate for remote consultation',
          ],
        },
        {
          heading: 'Complaints & Grievances',
          paragraphs: [
            'If you have concerns about your healthcare or treatment, you have multiple options.',
          ],
          bullets: [
            'Doctor Concerns: Contact the doctor directly or report concerns to support@clinexa.com',
            'Platform Issues: Report technical or operational issues to support@clinexa.com',
            'Ethics Concerns: Report patient rights violations to ethics@clinexa.com',
            'Insurance Disputes: Work with your insurance provider or file a complaint with your state insurance commissioner',
            'State Medical Board: File complaints with your state medical board for doctor licensing issues',
          ],
        },
        {
          heading: 'Acknowledgment of Consent',
          paragraphs: [
            'Your acceptance of the Clinexa Terms and Conditions constitutes your informed consent to the practices described in this policy.',
            'You have the right and responsibility to understand your healthcare choices. If you have questions, contact support@clinexa.com.',
          ],
          callout: 'Informed consent is not a one-time agreement but an ongoing dialogue. You can modify your preferences or questions at any time.',
        },
      ]}
      contentBlocks={[
        {
          type: 'commitment',
          title: 'Patient Advocacy',
          content: 'Clinexa is committed to transparent, ethical healthcare practices. We believe patients deserve full information and control over their medical decisions.',
        },
        {
          type: 'definition',
          title: 'Informed Consent Definition',
          content: 'Informed consent is your voluntary agreement to participate in healthcare after you have been fully informed about the benefits, risks, and alternatives.',
        },
      ]}
    />
  );
}
