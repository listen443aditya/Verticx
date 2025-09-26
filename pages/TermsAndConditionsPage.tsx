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

const TermsAndConditionsPage: React.FC = () => {
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
                            <h1 className="text-4xl font-extrabold text-text-primary-dark text-center mb-4">Verticx — Terms & Conditions</h1>
                            <p className="text-sm italic text-center mb-2">Last updated: [DATE]</p>
                            <p className="text-center italic mt-4 mb-8 p-4 bg-slate-50 rounded-lg">We build the schoolhouse of the future — quietly powerful, rigorously safe. These Terms explain how Verticx and you agree to operate that house together.</p>

                            <Section title="1. Agreement; Parties; Acceptance">
                                <p>1.1. These Terms & Conditions (“<b>Terms</b>”) are a binding agreement between <b>[COMPANY LEGAL NAME]</b> (trading as “<b>Verticx</b>”, “we”, “us”, “our”) and you — the entity or person using the Verticx platform (“<b>Customer</b>”, “<b>You</b>”, or “School” where applicable). If you are an individual user (teacher, student, parent, registrar, principal) your access and use are governed by these Terms and any school-level agreement.</p>
                                <p>1.2. By registering, accessing or using Verticx (the “<b>Service</b>”), you accept and agree to these Terms. If you do not agree, do not access or use the Service.</p>
                            </Section>

                            <Section title="2. Definitions">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li><b>Service</b>: Verticx web and mobile applications, APIs, dashboards, real-time channels, worker jobs, integrations, and related software and documentation.</li>
                                    <li><b>Org / Organization</b>: the legal entity that owns one or more schools / branches.</li>
                                    <li><b>School / Branch</b>: a tenant instance managed under an Org; identified by a <code>schoolId</code>.</li>
                                    <li><b>User</b>: any person with an account on Verticx (Administrator, Principal, Registrar, Teacher, Student, Parent, or other roles).</li>
                                    <li><b>Super Admin</b>: platform owner accounts with cross-Org access (company staff).</li>
                                    <li><b>Content</b>: documents, lesson plans, media, student records, uploads, and any data entered by Customer or its Users.</li>
                                    <li><b>AI Features</b>: optional features powered by machine learning or LLMs (e.g., auto-grading suggestions, risk scoring, content suggestions).</li>
                                    <li><b>RLS</b>: Row Level Security or other multi-tenant controls in the database.</li>
                                </ul>
                            </Section>

                            <Section title="3. Scope of Service">
                                <p>3.1. We provide a multi-tenant SaaS platform that enables schools and their staff to manage students, attendance, timetables, examinations, gradebooks, fees, library, transport, hostel, HR/payroll (if enabled), inventory, communications, and related functions as described on our product pages.</p>
                                <p>3.2. Specific features delivered depend on your chosen subscription plan and enabled modules. Some advanced features (AI, geographic benchmarking, custom integrations) may be sold separately or gated behind enterprise contracts.</p>
                            </Section>

                            <Section title="4. Accounts, Authority & Roles">
                                <p>4.1. Each School (or Org) registers and receives a unique <code>schoolId</code>. Users of that school’s account are associated with that <code>schoolId</code>. All data saved by those users is scoped to that <code>schoolId</code>.</p>
                                <p>4.2. Account administrators (Principal, Registrar, or Org Admin) manage user onboarding and role assignments. Admins must ensure they have authority to provide personal data (including minors’ data) and to bind the organization to these Terms.</p>
                                <p>4.3. Super Admin accounts (our company) are reserved for platform operations; they will not access protected school data except as permitted by law or for troubleshooting with consent or pursuant to contractual terms.</p>
                            </Section>
                            
                            <Section title="5. Multi-Tenancy, Data Segregation & Access">
                                <p>5.1. Verticx implements per-tenant segregation (Tenant = <code>schoolId</code>) in application logic and database queries. Users can access only the data that their token or session authorizes.</p>
                                <p>5.2. Admins and Org-level roles may have broader cross-branch visibility; this scope is explicitly granted and logged.</p>
                                <p>5.3. You are responsible for granting and revoking user roles and for ensuring that role assignments comply with applicable law (e.g., parental consent for minors).</p>
                            </Section>

                            <Section title="6. Content, Ownership & Licenses">
                                <p>6.1. <b>Customer Content.</b> Customer retains all ownership rights in Content uploaded by the School and its Users.</p>
                                <p>6.2. <b>License Grant to Verticx.</b> By uploading Content, Customer grants Verticx a non-exclusive, worldwide, royalty-free license to host, store, process, display and transmit the Content as necessary to provide the Service (including backups, CDN caching, real-time distribution to authorized users and integrations), and to create anonymized, aggregated metrics for Service improvement.</p>
                                <p>6.3. <b>License to Customer.</b> Subject to payment and compliance with these Terms, Verticx grants Customer a limited, non-exclusive, non-transferable license to access and use the Service for the Customer’s internal educational and administrative operations.</p>
                                <p>6.4. <b>User-Generated Materials.</b> Teachers, students, and parents retain ownership of original works they create, but must not upload infringing or unlawful content. We may remove content that violates policy or law.</p>
                            </Section>
                            
                            <Section title="7. AI & Automated Features — Disclosure & Limits">
                                <p>7.1. AI features are <b>assistive</b>. Outputs (suggested marks/comments, risk scores, summaries) are advisory and must be reviewed by qualified staff. Customer acknowledges AI outputs are probabilistic and can be incorrect.</p>
                                <p>7.2. By enabling AI features, Customer consents to our processing of Content and metadata for model inference and, if agreed in contract, for model improvement using anonymized/aggregated data. Schools may be provided the option to opt-out of model training data usage.</p>
                                <p>7.3. Verticx is not responsible for decisions made solely based on AI outputs (e.g., high-stakes disciplinary action, exam promotion) unless otherwise agreed in writing.</p>
                            </Section>
                            
                            <Section title="8. Fees, Billing & Payments">
                                <p>8.1. Fees for the Service (the “Fees”) are set in the applicable Order Form, pricing page, or contract. Fees may be per-school, per-student, or flat. Taxes are additional.</p>
                                <p>8.2. Payment Methods: Payments are processed through third-party payment processors (Stripe, Razorpay, etc.). By paying, Customer authorizes us to charge the chosen payment method. Payment disputes must be raised within 30 days.</p>
                                <p>8.3. Overdue amounts may incur late fees and interest and may result in suspension of Service after notice. Suspension for non-payment does not remove the Customer’s obligation to pay.</p>
                                <p>8.4. Refunds: Refund policy is described in the applicable Order/Plan. Trial accounts and promotional credits may be non-refundable.</p>
                            </Section>

                            <Section title="9. Service Levels, Maintenance & Support">
                                <p>9.1. <b>SLA (if applicable).</b> For paid Enterprise customers, Verticx will provide an uptime SLA of [99.9%] excluding scheduled maintenance and force majeure; specific service credits are set in the contract.</p>
                                <p>9.2. <b>Maintenance Windows.</b> We may schedule maintenance and will use commercially reasonable efforts to notify Admins in advance.</p>
                                <p>9.3. <b>Support.</b> Support levels (email, chat, phone, response times) depend on the subscription plan and are detailed in the Order Form. Emergency support for security incidents will follow our incident response procedures.</p>
                            </Section>
                            
                            <Section title="10. Security, Privacy & Data Protection">
                                <p>10.1. <b>Security Measures.</b> We implement industry-standard technical and organizational measures (encryption in transit and at rest where feasible, RLS, access controls, logging, backups). Complete details appear in our Security Whitepaper.</p>
                                <p>10.2. <b>Breach Notification.</b> We will notify the School’s designated admin and, where required by law, affected data subjects and regulators of any confirmed personal data breach within [72] hours of discovery, with remediation actions provided.</p>
                                <p>10.3. <b>Data Residency & Transfers.</b> Data storage and processing locations are described in the Order Form. Cross-border transfers will comply with applicable law; where required customer may request localized hosting at additional cost.</p>
                                <p>10.4. <b>Student Data & Minors.</b> For student data and other minor-related processing, Customer must obtain any required parental/guardian consents and comply with laws such as COPPA, FERPA, or regional equivalents. If required by law, we will implement additional controls upon request and contract.</p>
                                <p>10.5. <b>Data Retention & Export.</b> On termination, Customer may export its Content within [30/90] days. After that period we may permanently delete data unless otherwise agreed. For compliance, audit logs may be retained for a longer period as specified in the contract.</p>
                            </Section>

                            <Section title="11. Backups, Restore & Disaster Recovery">
                                <p>11.1. We perform periodic backups. Restore requests are subject to fees and data state. Business continuity, RTO and RPO targets are available in enterprise SLA documents.</p>
                            </Section>

                            <Section title="12. Integrations & Third-Party Services">
                                <p>12.1. The Service integrates with third parties (payment processors, SMS/email providers, mapping, calendar, LTI, Zoom, Google Classroom). Use of those services may require separate accounts and will be subject to those providers’ terms. Verticx is not liable for a third party’s actions or outages.</p>
                                <p>12.2. Customer consents to our sharing of data with integration partners only as required to provide the integration or as authorized in writing.</p>
                            </Section>

                            <Section title="13. Acceptable Use, Prohibited Conduct">
                                <p>13.1. Customer and Users must not:</p>
                                <ul className="list-disc pl-10 space-y-1">
                                    <li>Use the Service for unlawful activity or to process unlawful Content.</li>
                                    <li>Attempt to access data from other tenants (schoolIds) or otherwise circumvent RLS or access controls.</li>
                                    <li>Interfere with security, perform denial-of-service, or reverse engineer the Service.</li>
                                    <li>Upload malware or malicious scripts.</li>
                                    <li>Use the Service to store or transmit illegal content.</li>
                                </ul>
                                <p>13.2. Violation may result in suspension, termination and legal action.</p>
                            </Section>

                            <Section title="14. Intellectual Property">
                                <p>14.1. Verticx retains all IP rights in the Service, software, design, dashboards, trade secrets and code. Customer receives only the licenses expressly granted herein.</p>
                                <p>14.2. Customer retains IP rights in Customer Content. By uploading, Customer grants Verticx the limited license in §6.2.</p>
                            </Section>

                            <Section title="15. Confidentiality">
                                <p>15.1. Both parties agree to keep confidential Confidential Information of the other and not to disclose it to third parties except as required by law. Confidential Information excludes information that is public or rightfully obtained from a third party.</p>
                                <p>15.2. Confidentiality obligations survive termination for [3] years.</p>
                            </Section>

                            <Section title="16. Warranties; Disclaimers">
                                <p>16.1. <b>Our Warranties.</b> We warrant that we will provide the Service in a professional manner consistent with industry practice.</p>
                                <p>16.2. <b>Disclaimers.</b> Except as expressly stated, the Service is provided “AS IS” and we disclaim all other warranties (merchantability, fitness for a particular purpose, accuracy of AI outputs). We do not guarantee any specific student learning outcomes or regulatory approvals for your jurisdiction.</p>
                            </Section>

                            <Section title="17. Indemnification">
                                <p>17.1. <b>By Customer.</b> Customer will indemnify and hold Verticx harmless from claims arising from Customer Content, misuse of the Service by Customer or its users, or failure to obtain necessary consents for processing student data.</p>
                                <p>17.2. <b>By Verticx.</b> Verticx will indemnify Customer for claims that the Service (excluding Content) infringes third-party IP, subject to remedies and notice and assuming Customer cooperates in defense.</p>
                            </Section>
                            
                            <Section title="18. Limitation of Liability">
                                <p>18.1. To the maximum extent permitted by law, neither party shall be liable for indirect, incidental, special, punitive, or consequential damages.</p>
                                <p>18.2. Verticx’s aggregate liability for any claim under these Terms shall not exceed the fees paid by Customer to Verticx in the [12] months preceding the claim. The above caps do not apply to liability for bodily injury, gross negligence, willful misconduct, or data privacy breaches where law mandates higher liability.</p>
                            </Section>

                            <Section title="19. Term, Termination & Suspension">
                                <p>19.1. These Terms continue while Customer has an active Account. Either party may terminate as set out in the Order Form.</p>
                                <p>19.2. We may suspend or terminate access for breach (with notice where practicable). For serious breaches (data exfiltration, repeated fraud) we may immediately suspend.</p>
                                <p>19.3. On termination for convenience or non-payment, Customer must export data within the export window; we may delete thereafter per §10.5.</p>
                            </Section>

                            <Section title="20. Data Portability & Exit">
                                <p>20.1. Within agreed export window, Customer can request full export of Content in commonly used formats (CSV, XLSX, PDF). Additional conversion or migration services may be charged.</p>
                            </Section>

                            <Section title="21. Changes to the Service & Terms">
                                <p>21.1. We may update the Service and these Terms. For material changes to Terms we will notify account admins and provide [30/60] days’ notice. Continued use after the change constitutes acceptance. Emergency changes to maintain security may be made immediately but will be notified.</p>
                            </Section>

                            <Section title="22. Governing Law & Dispute Resolution">
                                <p>22.1. These Terms are governed by the laws of <b>[JURISDICTION — e.g., State/Country]</b> without regard to conflict of laws.</p>
                                <p>22.2. Disputes will be resolved by [arbitration / courts] in <b>[LOCATION]</b> as specified in the Order Form. (Replace with your preferred dispute resolution.)</p>
                            </Section>

                            <Section title="23. Miscellaneous">
                                <p>23.1. <b>Entire Agreement:</b> These Terms and any Order Forms constitute the entire agreement.</p>
                                <p>23.2. <b>Severability:</b> If any provision is invalid, the remainder survives.</p>
                                <p>23.3. <b>Assignment:</b> Customer may not assign without our consent except to a successor entity; we may assign to an affiliate or purchaser.</p>
                                <p>23.4. <b>Notices:</b> Notices to us will be sent to [legal@yourcompany.com] and notices to Customer will go to the school’s admin email on record.</p>
                            </Section>

                            <Section title="24. Contact">
                                <p>If you have questions about these Terms, contact:<br />
                                <b>Verticx</b><br />
                                Address: [ADDRESS]<br />
                                Email: [LEGAL@COMPANY.COM]<br />
                                Phone: 9801537137</p>
                            </Section>
                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default TermsAndConditionsPage;
