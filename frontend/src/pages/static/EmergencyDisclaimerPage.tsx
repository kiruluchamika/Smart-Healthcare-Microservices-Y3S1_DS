import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function EmergencyDisclaimerPage() {
  return (
    <StaticPageTemplate
      title="Emergency Disclaimer"
      description="Clinexa is not an emergency medical service. This disclaimer outlines when to seek immediate in-person care and emergency resources."
      lastUpdated="April 15, 2026"
      eyebrow="Critical Safety Information"
      variant="emergency"
      highlights={[
        {
          label: "Emergency",
          value: "Call 911",
          detail: "Do not use Clinexa for medical emergencies"
        },
        {
          label: "Available",
          value: "24/7",
          detail: "Emergency services in your region"
        },
        {
          label: "Clinexa Support",
          value: "Business Hours",
          detail: "Not available for urgent situations"
        }
      ]}
      sections={[
        {
          heading: 'Important Safety Notice',
          paragraphs: [
            'CLINEXA IS NOT AN EMERGENCY MEDICAL SERVICE. Do NOT use Clinexa if you are experiencing a medical emergency.',
            'If you are experiencing a life-threatening situation, chest pain, severe bleeding, difficulty breathing, or any acute emergency symptom, STOP using Clinexa immediately and call 911 or your local emergency number.',
          ],
          callout: 'In a medical emergency, every second matters. Emergency services have the training, equipment, and resources to save lives. Clinexa cannot provide this level of urgent care.',
        },
        {
          heading: 'When You Should Call 911 or Emergency Services',
          paragraphs: [
            'Call emergency services immediately if you or someone near you experiences any of these symptoms:',
          ],
          bullets: [
            'Chest pain or pressure, especially radiating to arm, jaw, or back',
            'Severe difficulty breathing or shortness of breath',
            'Sudden severe headache or weakness on one side of the body (signs of stroke)',
            'Loss of consciousness or unresponsiveness',
            'Severe dizziness or fainting',
            'Severe bleeding or uncontrolled hemorrhage',
            'Suicidal or homicidal thoughts, especially with intent or plan',
            'Severe allergic reactions (anaphylaxis) with breathing difficulty or swelling',
            'Choking or inability to clear airway',
            'Severe poisoning or overdose',
            'Severe burns or injuries',
            'Suspected heart attack or stroke',
            'Motor vehicle accident with injuries',
            'Violent trauma or assault',
            'Any condition you believe is life-threatening',
          ],
        },
        {
          heading: 'Limitations of Clinexa',
          paragraphs: [
            'Clinexa is designed for non-urgent healthcare needs. The platform has inherent limitations.',
          ],
          bullets: [
            'No 24/7 Monitoring: Doctors and support staff are not continuously available; response times vary',
            'No Physical Examination: Video consultations cannot replicate in-person evaluation with vital signs, palpation, or diagnostic equipment',
            'No Emergency Intervention: Clinexa cannot provide emergency medical intervention like CPR, medications, oxygen, or advanced life support',
            'No Direct Access to Emergency Services: Clinexa is not connected to 911 or emergency medical dispatch',
            'No Real-Time Communication: If a doctor is offline, messages may not be received immediately',
            'Limited Diagnostic Tools: Complex or ambiguous symptoms may require in-person evaluation and advanced diagnostics',
            'Not for Emergencies: Even if you can contact a doctor through Clinexa, emergency situations require emergency medical services',
          ],
        },
        {
          heading: 'When to Use In-Person Emergency Care',
          paragraphs: [
            'Go to an emergency room (ER) or urgent care clinic if you experience:',
          ],
          bullets: [
            'Symptoms that could indicate a life-threatening condition',
            'Conditions requiring physical examination (palpation, joint movement, eye examination)',
            'Conditions requiring rapid laboratory or imaging tests (bloodwork, X-ray, CT scan)',
            'Conditions requiring procedures or interventions (IV fluids, injections, catheterization)',
            'Trauma or injuries',
            'Severe intoxication or overdose',
            'Psychiatric emergencies or suicidal/homicidal ideation',
            'Any condition you are unsure about—when in doubt, seek in-person evaluation',
          ],
        },
        {
          heading: 'When Clinexa May Be Appropriate',
          paragraphs: [
            'Clinexa is suitable for certain non-emergency healthcare needs:',
          ],
          bullets: [
            'Mild symptoms: Cold, sore throat, mild allergies, minor rashes',
            'Chronic disease management: Follow-ups for known conditions, medication adjustments',
            'Preventive care: Vaccinations, health screenings, physical exam coordination',
            'Mental health support: Counseling, therapy, medication management for stable conditions',
            'Administrative needs: Prescription refills, medical record requests, appointment scheduling',
            'After-hours non-urgent concerns: Questions about mild symptoms outside doctor office hours',
            'Follow-up care: Post-hospitalization or post-urgent-care follow-ups',
          ],
        },
        {
          heading: 'If You Are Unsure',
          paragraphs: [
            'If you are unsure whether a condition is an emergency:',
          ],
          bullets: [
            'Trust Your Instinct: If something feels like an emergency, seek emergency care',
            'Call 911: Emergency dispatchers can assess your symptoms and direct you appropriately',
            'Urgent Care: Non-emergency urgent medical issues can go to an urgent care clinic or ER',
            'Poison Control: For poisoning or overdose, call Poison Control (1-800-222-1222 in the US) BEFORE doing anything else',
            'Crisis Line: For mental health emergencies, call the 988 Suicide & Crisis Lifeline (call or text 988 in the US)',
            'Err on the Side of Caution: In healthcare, it is always better to be evaluated than to wait',
          ],
        },
        {
          heading: 'Emergency Contact References',
          paragraphs: [
            'Emergency services and crisis support resources:',
          ],
          bullets: [
            'Emergency Medical Services (Ambulance): Dial 911 (US, Canada)', 
            'Police: Dial 911 (US, Canada)',
            'Poison Control: 1-800-222-1222 (US) — Active 24/7',
            'National Suicide Prevention Lifeline: Call or text 988 (US) — Active 24/7',
            'Crisis Text Line: Text HOME to 741741 (US)',
            'Domestic Violence Hotline: 1-800-799-7233 (US) — Active 24/7',
          ],
        },
        {
          heading: 'Clinexa Response to Emergencies',
          paragraphs: [
            'If an emergency is disclosed during a Clinexa consultation:',
          ],
          bullets: [
            'Immediate Escalation: Doctors will advise you to seek emergency care immediately',
            'No Delay: You will not be asked to wait for a response or continue the consultation',
            'Support: If you report an emergency threat to yourself or others, Clinexa may contact emergency services',
            'Privacy Limits: Patient confidentiality does not extend to emergency situations where lives are at risk',
          ],
          callout: 'If a doctor recommends emergency services during your consultation, FOLLOW THAT ADVICE. Stop using Clinexa and seek emergency care immediately.',
        },
        {
          heading: 'Liability & Assumption of Risk',
          paragraphs: [
            'By using Clinexa, you acknowledge and assume the risks of telemedicine.',
          ],
          bullets: [
            'You understand Clinexa is not suitable for medical emergencies',
            'You assume responsibility for recognizing emergency symptoms and seeking appropriate care',
            'You understand that delaying emergency care in favor of Clinexa could result in harm',
            'You release Clinexa from liability related to emergencies or delays in seeking emergency care',
            'You understand that some medical conditions cannot be safely managed through telemedicine',
          ],
        },
        {
          heading: 'Continuous Safety Education',
          paragraphs: [
            'This page is educational in nature to promote patient safety. We encourage all users to:',
          ],
          bullets: [
            'Understand Emergency Symptoms: Learn to recognize signs of common emergencies (stroke, heart attack, severe allergies)',
            'Know Local Resources: Familiarize yourself with hospitals, urgent care centers, and emergency services in your area',
            'Teach Others: Share emergency awareness with family and friends',
            'Practice Prevention: Maintain a healthy lifestyle to reduce emergency risks',
            'Maintain First Aid Skills: Consider CPR/first aid certification from Red Cross or similar organizations',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'escalation',
          title: '⚠️ URGENT: Not For Emergencies',
          content: 'If you are experiencing a medical emergency RIGHT NOW, do not use Clinexa. Call 911 or your local emergency number IMMEDIATELY. Your life may depend on it.',
        },
        {
          type: 'definition',
          title: 'Medical Emergency Definition',
          content: 'A medical emergency is a serious and unexpected situation involving a threat to health or life that requires immediate professional intervention. When in doubt about whether something is an emergency, err on the side of caution and seek emergency care.',
        },
      ]}
    />
  );
}