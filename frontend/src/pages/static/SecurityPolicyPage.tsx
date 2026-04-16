import StaticPageTemplate from '../../components/static/StaticPageTemplate';

export default function SecurityPolicyPage() {
  return (
    <StaticPageTemplate
      title="Data Protection & Security Policy"
      description="Clinexa implements comprehensive security controls to protect patient data, ensure platform integrity, and comply with healthcare security standards."
      lastUpdated="April 15, 2026"
      eyebrow="Security & Compliance"
      variant="security"
      highlights={[
        {
          label: "Encryption",
          value: "AES-256",
          detail: "Military-grade encryption at rest and TLS 1.2+ in transit"
        },
        {
          label: "Certifications",
          value: "HIPAA",
          detail: "Healthcare data protection compliance"
        },
        {
          label: "Monitoring",
          value: "24/7",
          detail: "Continuous security monitoring and threat detection"
        }
      ]}
      sections={[
        {
          heading: 'Security Philosophy',
          paragraphs: [
            'Clinexa prioritizes the confidentiality, integrity, and availability of patient data. We implement a multi-layered security approach combining technical controls, operational practices, and incident response procedures.',
            'Security is not a one-time implementation but a continuous process of assessment, improvement, and vigilance.',
          ],
        },
        {
          heading: 'Data Protection & Encryption',
          paragraphs: [
            'All patient data is protected using industry-leading encryption standards.',
          ],
          bullets: [
            'Data at Rest: All databases, backups, and storage use AES-256 encryption',
            'Data in Transit: All communications use TLS 1.2+ with perfect forward secrecy',
            'Encryption Keys: Master keys are stored in AWS Key Management Service (KMS) with restricted access',
            'Key Rotation: Encryption keys are automatically rotated every 90 days',
            'Backup Encryption: All backups are encrypted and stored in separate secure locations',
          ],
        },
        {
          heading: 'Access Controls & Authentication',
          paragraphs: [
            'We restrict data access to authorized personnel and implement strong authentication.',
          ],
          bullets: [
            'Role-Based Access Control (RBAC): Users access only data necessary for their role (patient, doctor, admin)',
            'Multi-Factor Authentication: Available for all accounts; required for staff and admin accounts',
            'Strong Passwords: Minimum 12 characters with complexity requirements enforced',
            'Session Management: Automatic logout after 30 minutes of inactivity; sessions are secure and httpOnly',
            'Access Logging: All data access is logged with timestamp, user ID, and purpose for audit trails',
            'Credential Storage: Passwords are hashed using bcrypt with strong salting; never stored in plain text',
          ],
        },
        {
          heading: 'Network Security',
          paragraphs: [
            'Our infrastructure is designed with defense-in-depth networking.',
          ],
          bullets: [
            'Firewalls: Multi-layered firewalls restrict incoming and outgoing traffic',
            'Virtual Private Cloud (VPC): Isolated network environment with restricted access',
            'DDoS Protection: CloudFlare DDoS mitigation protects against large-scale attacks',
            'Intrusion Detection: Automated systems monitor for suspicious network activity',
            'VPN & Secure Channels: Staff access to production is restricted to secure VPN',
          ],
        },
        {
          heading: 'Application Security',
          paragraphs: [
            'We follow secure development practices to prevent vulnerabilities.',
          ],
          bullets: [
            'Secure Coding: Code reviews and secure coding training for all developers',
            'Input Validation: All user input is validated and sanitized to prevent injection attacks',
            'Output Encoding: All output is properly encoded to prevent XSS attacks',
            'SQL Injection Prevention: Parameterized queries and ORM frameworks are used',
            'CSRF Protection: Anti-CSRF tokens are used for all state-changing requests',
            'Dependency Management: Third-party libraries are monitored for vulnerabilities',
          ],
        },
        {
          heading: 'Security Testing & Validation',
          paragraphs: [
            'We regularly test and validate our security controls.',
          ],
          bullets: [
            'Penetration Testing: Annual third-party penetration testing to identify vulnerabilities',
            'Vulnerability Scanning: Automated weekly scans of all systems and applications',
            'Security Audits: Annual audits by external security firms',
            'Code Security Analysis: Static and dynamic code analysis tools scan for common vulnerabilities',
            'Bug Bounty Program: We reward security researchers who responsibly disclose vulnerabilities',
          ],
        },
        {
          heading: 'Operational Security',
          paragraphs: [
            'Our team follows strict operational security practices.',
          ],
          bullets: [
            'Employee Screening: Background checks for all staff with access to sensitive data',
            'Security Training: Annual mandatory security training for all employees',
            'Access Controls: Principle of least privilege; staff access limited to necessary systems',
            'Logging & Monitoring: All administrative actions are logged and monitored 24/7',
            'Secure Disposal: All hardware and media containing data is securely destroyed',
            'Vendor Management: Third-party vendors are assessed for security compliance',
          ],
        },
        {
          heading: 'Incident Response & Breach Notification',
          paragraphs: [
            'If a security incident is detected, we follow a documented incident response procedure.',
          ],
          bullets: [
            'Detection: Automated monitoring systems detect unusual activity or potential breaches',
            'Investigation: Security team investigates scope, cause, and impact of the incident',
            'Containment: Affected systems are isolated to prevent further data exposure',
            'Remediation: Vulnerabilities are patched and systems are restored to normal operation',
            'Notification: Affected users are notified within 30 days per HIPAA Breach Notification Rule',
            'Documentation: All incidents are documented and analyzed for prevention lessons',
          ],
          callout: 'We notify affected users if their personal or health data is compromised in a security breach that violates their privacy.',
        },
        {
          heading: 'Compliance & Standards',
          paragraphs: [
            'Clinexa complies with leading healthcare and data protection standards.',
          ],
          bullets: [
            'HIPAA (Health Insurance Portability and Accountability Act): Compliance with US healthcare privacy and security standards',
            'GDPR (General Data Protection Regulation): Compliance with EU data protection requirements',
            'CCPA (California Consumer Privacy Act): Compliance with California privacy laws',
            'HITECH Act: Compliance with US health information technology breach notification standards',
            'SOC 2 Type II: Annual certification of security, availability, and confidentiality controls',
            'PCI-DSS: Payment card data is processed according to PCI Data Security Standard',
          ],
        },
        {
          heading: 'Data Retention & Secure Deletion',
          paragraphs: [
            'Data is retained only as long as legally necessary, then securely destroyed.',
          ],
          bullets: [
            'Active Data: Retained while accounts are active and for 7 years after account closure (legal/compliance requirement)',
            'Backups: Backups are retained for 90 days for recovery purposes, then deleted',
            'Secure Deletion: Data is overwritten multiple times before removal to prevent recovery',
            'Hardware Disposal: End-of-life hardware is physically destroyed or securely wiped',
          ],
        },
        {
          heading: 'Disaster Recovery & Business Continuity',
          paragraphs: [
            'We maintain robust backup and recovery procedures to ensure service availability.',
          ],
          bullets: [
            'Backup Frequency: Daily automated backups to geographically distributed locations',
            'Recovery Testing: Monthly backup recovery drills to ensure restoration capability',
            'Recovery Time Objective (RTO): Less than 1 hour for critical systems',
            'Recovery Point Objective (RPO): Less than 15 minutes of data loss',
            'Redundancy: Multiple availability zones and failover systems for high availability',
          ],
        },
        {
          heading: 'User Security Responsibilities',
          paragraphs: [
            'Security is a shared responsibility. Users can strengthen their account security.',
          ],
          bullets: [
            'Use Strong Passwords: Create unique, complex passwords at least 12 characters long',
            'Enable Multi-Factor Authentication: Add an extra layer of security to your account',
            'Secure Your Device: Keep your computer, phone, and tablet updated with security patches',
            'Beware of Phishing: Never click suspicious links or provide credentials to untrusted sources',
            'Use Secure Networks: Avoid using telemedicine on public WiFi without VPN protection',
            'Log Out: Always log out after completing your session, especially on shared devices',
            'Report Suspicious Activity: Contact support@clinexa.com if you notice unauthorized access',
          ],
        },
        {
          heading: 'Transparency & Communication',
          paragraphs: [
            'We maintain transparency about security practices and communicate proactively.',
          ],
          bullets: [
            'Security Status: Real-time platform status available at status.clinexa.com',
            'Incident Communication: Major incidents are communicated to affected users within 30 days',
            'Security Updates: Monthly security updates and patches are deployed automatically',
            'Vulnerability Disclosure: We follow responsible disclosure practices for security vulnerabilities',
          ],
        },
      ]}
      contentBlocks={[
        {
          type: 'commitment',
          title: 'Security Commitment',
          content: 'Clinexa is committed to protecting patient data with state-of-the-art security controls and transparent practices. We invest continuously in security infrastructure and personnel to maintain the highest standards.',
        },
        {
          type: 'escalation',
          title: 'Report Security Issues',
          content: 'If you discover a security vulnerability or suspect a breach, contact security@clinexa.com immediately. Do not publicly disclose vulnerabilities. We offer a bug bounty for responsibly disclosed issues.',
        },
      ]}
    />
  );
}
