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

const RefundPolicyPage: React.FC = () => {
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
                            <h1 className="text-4xl font-extrabold text-text-primary-dark text-center mb-4">Verticx — Refund Policy</h1>
                            <p className="text-sm italic text-center mb-8">Last updated: [DATE]</p>

                            <Section title="1. Summary (TL;DR)">
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Tuition, fees and any payments collected on behalf of a school are governed by that school’s refund rules — Verticx acts as the payment processor for those amounts and will follow the school’s directions.</li>
                                    <li>For Verticx subscription and platform fees, refunds are limited and available only under narrow conditions and time windows. We keep refunds tight to protect platform sustainability.</li>
                                    <li>Duplicate charges, gateway errors, or demonstrable non-delivery by Verticx will be reviewed and, if validated, refunded.</li>
                                    <li>Setup, customization, third-party integration fees, and transactional gateway fees are non-refundable unless otherwise stated in the Order/Contract.</li>
                                </ul>
                            </Section>

                            <Section title="2. Definitions">
                                 <ul className="list-disc pl-5 space-y-2">
                                    <li><b>Platform Fees / Verticx Fees:</b> subscription charges paid to Verticx for use of the software, mobile apps, support, and hosted services.</li>
                                    <li><b>School Fees / Tuition:</b> fees collected by a school (tuition, transport, hostel, library fines) that Verticx may process on behalf of the school.</li>
                                    <li><b>One-time Services:</b> setup, onboarding, custom development, integrations, training sessions.</li>
                                    <li><b>Payment Processor Fees:</b> fees charged by Stripe/Razorpay/other gateways per transaction.</li>
                                </ul>
                            </Section>
                            
                            <Section title="3. General Rules & Principles">
                                 <p><b>School-collected payments (tuition, transport, hostel, etc.)</b><br/>
                                These are subject to the school’s own refund rules. Verticx will process refunds when instructed by the school and where the original payment gateway / settlement permits reversal. If a school requests a refund, Verticx will return funds less any non-recoverable payment processor fees unless the school instructs otherwise.</p>
                                <p><b>Verticx subscription fees (monthly/annual):</b></p>
                                <ul className="list-disc pl-10 space-y-1">
                                    <li><b>Trial Period:</b> If a trial is offered, a full refund is available if the customer cancels within the trial window (default: 7 days unless contract specifies otherwise).</li>
                                    <li><b>Monthly Subscriptions:</b> Non-refundable for partial months. Cancellations stop future billing; no pro-rata refunds for time already used.</li>
                                    <li><b>Annual Subscriptions / Prepaid:</b> Non-refundable after a short grace window (default: 7 days). After that, we may offer a prorated account credit at our discretion (less any third-party fees and accrued usage charges).</li>
                                    <li><b>Enterprise Contracts:</b> Refunds governed by the signed Order Form / SOW. Standard refunds do not apply to custom enterprise agreements.</li>
                                </ul>
                                <p><b>One-time services & custom work:</b> Non-refundable once work has begun. If we have not started work (and this is verifiable), we may refund less any administrative fees. Custom development and integrations are billed separately and not refundable after milestone acceptance.</p>
                                <p><b>Third-party & gateway fees:</b> Payment processor fees (Stripe, Razorpay, etc.) are non-recoverable. Refunds will be reduced by the amount those processors do not return to Verticx.</p>
                                <p><b>Disputed / Duplicate / Fraudulent charges:</b> Valid duplicates or processor errors will be refunded promptly after verification and after the payment processor’s rules allow reversal. We will coordinate with the school and the payment provider.</p>
                                <p><b>Marketplace / Content Purchases:</b> Purchases of third-party content, tutors, or marketplace items follow the vendor’s refund rules; Verticx will mediate disputes where reasonable.</p>
                            </Section>
                            
                            <Section title="4. Refund Eligibility Matrix">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b">
                                                <th className="p-3 font-semibold">Payment Type</th>
                                                <th className="p-3 font-semibold">Refund Allowed?</th>
                                                <th className="p-3 font-semibold">Typical Window</th>
                                                <th className="p-3 font-semibold">Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b"><td className="p-3">School tuition & fees</td><td className="p-3">Depends on school rules</td><td className="p-3">School-defined</td><td className="p-3">Verticx follows school instruction.</td></tr>
                                            <tr className="border-b"><td className="p-3">Verticx subscription — Trial</td><td className="p-3">Yes (full)</td><td className="p-3">Within trial (default 7 days)</td><td className="p-3">Full refund if canceled in trial.</td></tr>
                                            <tr className="border-b"><td className="p-3">Verticx subscription — Monthly</td><td className="p-3">No</td><td className="p-3">N/A</td><td className="p-3">Cancel to stop future billing.</td></tr>
                                            <tr className="border-b"><td className="p-3">Verticx subscription — Annual</td><td className="p-3">Limited / case-by-case</td><td className="p-3">7 days grace (default)</td><td className="p-3">Prorated credits at discretion.</td></tr>
                                            <tr className="border-b"><td className="p-3">One-time setup/custom work</td><td className="p-3">No (once work started)</td><td className="p-3">N/A</td><td className="p-3">Refund only if no work started.</td></tr>
                                            <tr className="border-b"><td className="p-3">Duplicate / processor error</td><td className="p-3">Yes (validated)</td><td className="p-3">As per gateway rules</td><td className="p-3">Processed after verification.</td></tr>
                                            <tr className="border-b"><td className="p-3">Marketplace (third-party)</td><td className="p-3">Per vendor</td><td className="p-3">Vendor-defined</td><td className="p-3">Verticx mediates.</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Section>
                            
                             <Section title="5. How to Request a Refund (Customer Steps)">
                                <p><b>Who can request:</b> Only the account admin (Principal / Registrar / Org Admin) may request refunds for school-managed payments. Individual users must contact their school admin. For Verticx subscription refunds, billing contact or authorized signatory must request.</p>
                                <p><b>Request method:</b> Submit a refund request via the Admin Billing UI or email billing@[COMPANY].com with: invoice/transaction ID, payer name, reason, and supporting documents.</p>
                                <p><b>Verification:</b> Our Finance team will verify the transaction, check gateway status, confirm school approvals (if applicable), and validate eligibility under this policy.</p>
                                <p><b>Decision timeline:</b> We will respond with an approval/denial within 10 business days of receiving all required info. If approved, we will initiate the refund per section 6.</p>
                                <p><b>Dispute escalation:</b> If you disagree with the decision, provide additional evidence; enterprise customers may follow the dispute path in their contract.</p>
                            </Section>
                            
                             <Section title="6. How Refunds Are Processed (Timing & Deductions)">
                                <p><b>Processing time:</b> After approval, refunds to the original payment method are initiated within 7–14 business dayssubject to payment processor settlement times. Processor rules may lengthen this.</p>
                                <p><b>Deductions:</b> Refunds will be net of any non-recoverable payment processor fees; platform charges for services already consumed; and agreed administrative cancellation fees.</p>
                                <p><b>Accounting:</b> Verticx issues a Credit Note / Refund Receipt; the school and payer will receive the receipt by email and in the Admin UI.</p>
                            </Section>
                            
                            <Section title="7. Special Cases / Exceptions">
                                <p><b>Service Non-Delivery / Outage:</b> If Verticx materially fails to provide the service per SLA (for paid Enterprise customers) and the customer’s use is demonstrably impaired, the customer may be eligible for service credits or partial refunds as per SLA. Credits are the usual remedy; refunds only in severe, contractually defined cases.</p>
                                <p><b>Fraud / Unauthorized Charges:</b> We will work with payment processors and the school to resolve and refund validated unauthorized charges.</p>
                                <p><b>Regulatory Requirements:</b> If local consumer law mandates refunds in circumstances inconsistent with this policy, the legal requirement will prevail.</p>
                            </Section>
                             
                            <Section title="8. Refunds for School-Managed Tuition (Operational Note)">
                                <p>Verticx acts as the payment processor / gateway integrator for schools that use our payments. The school is responsible for refund rules communicated to parents/guardians at the time of fee collection.</p>
                                <p>When a school instructs Verticx to refund tuition, Verticx will process the refund subject to gateway rules and may deduct non-recoverable fees before issuing funds to the payer. Schools must explicitly authorize any refunds through the Admin UI and accept any deductions.</p>
                            </Section>

                            <Section title="9. Chargebacks & Payment Disputes">
                                <p>If a payer disputes a transaction via their bank, Verticx/School will be notified. The school/admin must cooperate by providing proof of service and consent. If a chargeback is lost, the amount may be debited from the school’s account or invoiced to the school. Repeated chargebacks may lead to additional verification, holds, or account suspension.</p>
                            </Section>
                            
                            <Section title="10. Refund Records, Audit & Reporting">
                                <p>All refunds and related actions will be logged in the AuditLog with actorId, timestamp, reason, and proof docs. Refunds will generate a unique Refund ID and credit note.</p>
                                <p>Verticx reserves the right to refuse refunds in cases of fraud, abuse, or where the request lacks required documentation.</p>
                            </Section>

                            <Section title="11. Changes to This Refund Policy">
                                <p>Verticx may update this Refund Policy. For material changes, we will notify account admins via email and admin dashboards. Continued use after notice constitutes acceptance.</p>
                            </Section>
                            
                            <Section title="12. Contact">
                                <p>For refund requests and billing questions, please contact: <b>billing@[COMPANY_DOMAIN].com</b>.</p>
                            </Section>

                        </div>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default RefundPolicyPage;
