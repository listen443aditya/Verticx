import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { VerticxLogo } from '../components/icons/Icons.tsx';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h2 className="text-2xl font-bold text-text-primary-dark mb-3 pb-2 border-b border-slate-200">{title}</h2>
        <div className="space-y-4 text-base leading-relaxed">{children}</div>
    </div>
);

const PrivacyPolicyPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-background-dark min-h-screen">
            <header className="sticky top-0 z-50 bg-surface-dark/80 backdrop-blur-sm shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <a href="/#/landing" className="flex items-center" onClick={(e) => { e.preventDefault(); navigate('/landing'); }}>
                            <VerticxLogo className="h-10 w-10 mr-2" />
                            <span className="text-2xl font-bold text-text-primary-dark">VERTICX</span>
                        </a>
                        <Button onClick={() => navigate('/landing')}>Back to Home</Button>
                    </div>
                </div>
            </header>
            <main className="py-12 md:py-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Card>
                        <div className="text-text-secondary-dark">
                            <h1 className="text-4xl font-extrabold text-text-primary-dark text-center mb-4">Verticx — Detailed Privacy Policy</h1>
                            <p className="text-sm italic text-center mb-8">Effective date: [DATE]</p>

                            <Section title="1. Introduction & Roles">
                                <p>Verticx provides a multi-tenant school management and learning platform. In almost all cases, the school (or school organization / “Org”) is the Data Controller — it decides what personal data to collect and why. Verticx acts as the Data Processor and processes school data only on the school’s instructions, or as needed to provide the Service, unless Verticx is acting as Controller for actions clearly stated below (e.g., demo requests, job applications).</p>
                            </Section>

                            <Section title="2. Data we collect — categories">
                                <p>We collect the following categories of personal data (examples — not exhaustive):</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><b>A. Student & Education Data:</b> Identifier: name, roll number, student ID, photo. Academic: grades, assessments, attendance, disciplinary records, learning progress. Health/allergies (only where school collects and stores). Guardian/parent contact info.</li>
                                    <li><b>B. Staff & Faculty Data:</b> Employment records, payroll identifiers (partial bank tokens), performance notes.</li>
                                    <li><b>C. Financial & Billing Data:</b> Invoices, payment transaction IDs.</li>
                                    <li><b>D. Uploaded Content:</b> Documents (certificates, ID scans), videos, lesson content, chat messages.</li>
                                    <li><b>E. Authentication & Telemetry:</b> Login timestamps, IP addresses, device metadata, error logs, usage metrics.</li>
                                    <li><b>F. Third-party integrations:</b> Zoom IDs, Google Classroom links, SMS delivery receipts — only as needed and consented.</li>
                                </ul>
                            </Section>

                            <Section title="3. Legal bases & purposes">
                                <p>Where required by law, our legal bases for processing include:</p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><b>Performance of a contract / Service delivery</b> — core functions (attendance, grade storage, timetables, payments).</li>
                                    <li><b>Legal obligation</b> — compliance with law (e.g., audits, subpoenas).</li>
                                    <li><b>Legitimate interests</b> — platform security, fraud prevention, aggregated analytics; only after balancing tests.</li>
                                    <li><b>Consent</b> — for optional processing (marketing communications, certain AI training uses, optional analytics trackers, video/biometric attendance where enabled). For students/children, consent is mediated by the school and parents per applicable law (COPPA/GDPR-child).</li>
                                </ul>
                            </Section>

                            <Section title="4. Children’s data & parental rights">
                                <p>Verticx recognizes student data as sensitive; schools must obtain required parental/guardian consent before the school collects or uploads children’s personally identifiable information (PII), as required by local law. Verticx requires Admins to certify they have necessary consents.</p>
                                <p>We do not market to children and do not use student data for targeted advertising. If you enable optional features (e.g., face-recognition attendance), those require explicit opt-in and separate parental consent.</p>
                            </Section>

                            <Section title="5. AI features & model training">
                                <p>AI features (risk scoring, auto-grading suggestions, personalized learning) may analyze student content and metadata. AI outputs are assistive only — human decision required for high-stakes actions (promotions, expulsions, final grades).</p>
                                <p><b>Training data:</b> Verticx will by default not use identifiable student data to train models used beyond the customer’s Org unless the school opts-in in writing. If the school opts in, data used for model training is anonymized/aggregated per agreement and in compliance with applicable law.</p>
                                <p>We publish model descriptions and a confidence/limitations notice in the UI where AI outputs appear.</p>
                            </Section>

                            <Section title="6. Data sharing & subprocessors">
                                <p>We only share data with: (i) the school’s authorized users, (ii) subprocessors (listed in our DPA) who provide necessary services (payments, SMS, file storage, analytics), and (iii) when required by law.</p>
                                <p>A current subprocessor list is maintained in our admin portal and on request. Schools may review and object to critical subprocessor changes per DPA terms.</p>
                                <p>Third-party processors (e.g., Stripe, Twilio, Google Cloud) will be bound by contract to data protection standards.</p>
                            </Section>
                            
                            <Section title="7. International transfers & cross-border processing">
                                <p>Data may be stored/processed in different countries. We use appropriate safeguards (Standard Contractual Clauses, binding corporate rules or local requirements) for international transfers. Customers may request localized hosting for legal/regulatory reasons (enterprise add-on).</p>
                            </Section>

                            <Section title="8. Data retention & deletion">
                                <p><b>Default retention for active Org data:</b> while the school account is active.</p>
                                <p>After account termination, schools may export all data within 90 days (configurable in Agreement). After the export window, data will be securely deleted or anonymized except for limited records we retain for legal/financial obligations (e.g., invoices) or for backups for a defined additional retention period (documented).</p>
                                <p>Admins can request immediate deletion of Org data subject to contractual terms and legal constraints.</p>
                            </Section>

                            <Section title="9. Security controls">
                                <p>We implement industry standard technical and organizational measures, including but not limited to: Tenant isolation, Encryption, Authentication, Access control, Auditing, Logging & monitoring, Backups, Pen testing & assessments, and Vendor risk.</p>
                            </Section>

                            <Section title="10. Incident response & breach notification">
                                <p>Verticx maintains an Incident Response Plan with roles, communications, and remediation steps. For confirmed personal data breaches we will contain & remediate immediately and notify affected Org admin(s) within 72 hours of becoming aware.</p>
                            </Section>

                            <Section title="11. Rights of data subjects">
                                <p>Schools are the first point of contact (Controller). Verticx assists in fulfilling requests such as: Access, Correction, Deletion, Portability, and Restriction / objection.</p>
                            </Section>

                            <Section title="12. Cookies, tracking & analytics">
                                <p>Marketing site uses cookies for analytics and marketing (consent banner controls non-essential cookies). Within the platform, telemetry is collected for security and product improvement; schools can opt out of some analytics in their Org settings.</p>
                            </Section>

                            <Section title="13. Payment & financial data">
                                <p>We do not store full card/bank details. Payment processors handle full payment data; Verticx stores transaction metadata, receipts, invoice IDs for reconciliation. Refunds, chargebacks and related processes are governed by our Refund Policy and school instructions.</p>
                            </Section>

                            <Section title="14. Data Protection Officer, contact & DPA">
                                <p>DPO / Privacy contact: [name, email, address]. Schools may sign a Data Processing Addendum (DPA) that includes: subprocessor list, security controls, incident notification timelines, international transfer safeguards and rights support.</p>
                            </Section>
                            
                            <Section title="15. Audits, certifications & compliance posture">
                                <p>We will maintain or pursue: SOC2 Type II, ISO 27001 (where applicable), routine external audits and penetration tests; audit reports available under NDA for enterprise customers.</p>
                            </Section>
                            
                            <Section title="16. Changes to policy & versioning">
                                <p>We will post policy updates on the admin dashboard and notify Org admins for material changes; continued use constitutes acceptance.</p>
                            </Section>

                            <Section title="17. How to contact us">
                                <p>Privacy team: privacy@[company domain].com</p>
                                <p>Security team (incident reporting): security@[company domain].com</p>
                                <p>DPO contact: [name & contact]</p>
                                <p>Mailing address: [legal address]</p>
                            </Section>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default PrivacyPolicyPage;
