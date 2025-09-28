import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  VerticxLogo,
  UsersIcon,
  AttendanceIcon,
  ClipboardListIcon,
  FinanceIcon,
  LibraryIcon,
  BusIcon,
  HostelIcon,
  ReportsIcon,
  BrainCircuitIcon,
  CheckIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  DashboardIcon,
  TeachersIcon,
  StudentsIcon,
  AdmissionsIcon,
  BranchIcon,
} from "../components/icons/Icons.tsx";
import Button from "../components/ui/Button.tsx";
import Card from "../components/ui/Card.tsx";
import Input from "../components/ui/Input.tsx";
import { sharedApiService } from "../services";

// --- Reusable Components ---
const Section: React.FC<{
  id: string;
  children: React.ReactNode;
  className?: string;
}> = ({ id, children, className = "" }) => (
  <section id={id} className={`py-16 md:py-24 w-full ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
  </section>
);

const SectionTitle: React.FC<{
  subtitle: string;
  title: string;
  children?: React.ReactNode;
}> = ({ subtitle, title, children }) => (
  <div className="text-center mb-12">
    <h2 className="text-base font-semibold text-brand-secondary tracking-wide uppercase">
      {subtitle}
    </h2>
    <p className="mt-2 text-3xl lg:text-4xl font-extrabold text-text-primary-dark tracking-tight">
      {title}
    </p>
    {children && (
      <p className="mt-4 max-w-2xl mx-auto text-xl text-text-secondary-dark">
        {children}
      </p>
    )}
  </div>
);

// --- Section Components ---
const Header: React.FC = () => {
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href")?.substring(1);
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#faq", label: "FAQ" },
    { href: "#about", label: "About Us" },
    { href: "#contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-surface-dark/80 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <a href="#" className="flex items-center">
            <VerticxLogo className="h-10 w-10 mr-2" />
            <span className="text-2xl font-bold text-text-primary-dark">
              VERTICX
            </span>
          </a>
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={handleNavClick}
                className="text-base font-medium text-text-secondary-dark hover:text-brand-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center">
            <Button
              variant="secondary"
              onClick={() => navigate("/login")}
              className="mr-2"
            >
              Login
            </Button>
            <Button
              onClick={() =>
                document
                  .getElementById("contact")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

const HeroSection: React.FC = () => (
  <Section id="home" className="bg-slate-50 !pt-24 !pb-24">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
      <div className="text-center lg:text-left">
        <h1 className="text-4xl md:text-6xl font-extrabold text-text-primary-dark leading-tight">
          Revolutionizing{" "}
          <span className="text-brand-primary">Education Management</span>, One
          School at a Time.
        </h1>
        <p className="mt-6 text-lg text-text-secondary-dark max-w-xl mx-auto lg:mx-0">
          Verticx is the all-in-one, AI-powered ERP that streamlines operations,
          empowers educators, and provides unparalleled insights across all your
          branches.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
          <Button
            onClick={() =>
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="!px-8 !py-3 !text-lg"
          >
            Register Your School
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              document
                .getElementById("contact")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="!px-8 !py-3 !text-lg"
          >
            Request a Demo
          </Button>
        </div>
      </div>
      <div className="hidden lg:block">
        <div className="bg-surface-dark p-4 rounded-xl shadow-2xl transform hover:scale-105 transition-transform duration-300">
          <img
            src="https://placehold.co/600x400/E2E8F0/475569?text=ERP+Dashboard+Preview"
            alt="Verticx ERP Dashboard Preview"
            className="rounded-lg"
          />
        </div>
      </div>
    </div>
  </Section>
);

const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ icon, title, children, className }) => (
  <div
    className={`bg-surface-dark p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col ${className}`}
  >
    <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-primary/10 text-brand-primary mb-4 flex-shrink-0">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-text-primary-dark">{title}</h3>
    <p className="mt-2 text-base text-text-secondary-dark flex-grow">
      {children}
    </p>
  </div>
);

const FeaturesSection: React.FC = () => (
  <Section id="features">
    <SectionTitle
      subtitle="Our Features"
      title="A Comprehensive Toolkit for Modern Schools"
    >
      From admissions to analytics, Verticx provides every tool you need to run
      your institution efficiently.
    </SectionTitle>
    <div className="flex flex-wrap justify-center gap-8">
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<UsersIcon className="w-6 h-6" />}
        title="Student Information System"
      >
        Manage student records, demographics, and academic history from a
        centralized system.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<BrainCircuitIcon className="w-6 h-6" />}
        title="AI Insights & Analytics"
      >
        Leverage predictive analytics to identify at-risk students and get
        AI-driven performance reports.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<FinanceIcon className="w-6 h-6" />}
        title="Fee & Finance Management"
      >
        Automate fee collection, manage expenses, and generate financial reports
        with ease.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<AttendanceIcon className="w-6 h-6" />}
        title="Attendance & Timetable"
      >
        Simplify daily attendance marking and create complex, clash-free
        timetables effortlessly.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<ClipboardListIcon className="w-6 h-6" />}
        title="Exams & Gradebook"
      >
        Conduct examinations, manage marks entry, and publish report cards
        digitally.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<LibraryIcon className="w-6 h-6" />}
        title="Library & Asset Management"
      >
        Digitize your library catalog and manage school inventory from a single
        dashboard.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<BusIcon className="w-6 h-6" />}
        title="Transport & Hostel"
      >
        Oversee transport routes, vehicle tracking, and hostel room allocation
        with dedicated modules.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<ReportsIcon className="w-6 h-6" />}
        title="Multi-School Control"
      >
        Manage multiple branches from a single admin portal with cross-school
        benchmarking and reporting.
      </FeatureCard>
    </div>
  </Section>
);

const WhyVerticxSection: React.FC = () => (
  <Section id="why-verticx" className="bg-slate-50">
    <SectionTitle subtitle="Why Choose Us" title="The Verticx Advantage" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">Real-Time Sync</h3>
          <p className="text-text-secondary-dark">
            Dashboards update instantly. No more refreshing pages to see the
            latest data.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">AI Performance Predictions</h3>
          <p className="text-text-secondary-dark">
            Our AI assistant proactively identifies trends and flags potential
            issues before they become problems.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">Multi-Branch Architecture</h3>
          <p className="text-text-secondary-dark">
            Built from the ground up to support institutions with multiple
            campuses seamlessly.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">Role-Specific Portals</h3>
          <p className="text-text-secondary-dark">
            Tailored interfaces for Admins, Principals, Teachers, Students, and
            Parents ensure everyone has the tools they need.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">Secure & Cloud-Based</h3>
          <p className="text-text-secondary-dark">
            Access your data from anywhere, anytime, with enterprise-grade
            security and reliability.
          </p>
        </div>
      </div>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <CheckIcon className="w-6 h-6 text-green-500" />
        </div>
        <div>
          <h3 className="font-bold">Mobile-Ready</h3>
          <p className="text-text-secondary-dark">
            Dedicated mobile apps for parents and students to stay connected on
            the go.
          </p>
        </div>
      </div>
    </div>
  </Section>
);

const PortalsSection: React.FC = () => (
  <Section id="portals">
    <SectionTitle
      subtitle="A Portal for Everyone"
      title="Tailored Experiences for Every Role"
    >
      Verticx provides a unique, focused interface for each member of your
      school community, ensuring everyone has the right tools to succeed.
    </SectionTitle>
    <div className="flex flex-wrap justify-center gap-8">
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<BranchIcon className="w-6 h-6" />}
        title="For Admins"
      >
        System-wide control. Manage multiple schools, approve registrations, and
        oversee all operations.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<DashboardIcon className="w-6 h-6" />}
        title="For Principals"
      >
        360° school oversight, AI-driven insights, and effortless multi-branch
        management.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<AdmissionsIcon className="w-6 h-6" />}
        title="For Registrars"
      >
        The operational hub. Manage admissions, student data, fees, and
        timetables with precision.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<TeachersIcon className="w-6 h-6" />}
        title="For Teachers"
      >
        Streamlined attendance, intuitive gradebooks, and powerful communication
        tools.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<LibraryIcon className="w-6 h-6" />}
        title="For Librarians"
      >
        Digital library management. Catalog books, track issuances, and manage
        fines.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<StudentsIcon className="w-6 h-6" />}
        title="For Students"
      >
        Access grades, assignments, and timetables. Stay on top of your academic
        journey.
      </FeatureCard>
      <FeatureCard
        className="basis-full md:basis-[calc(50%-1rem)] lg:basis-[calc(25%-1.5rem)]"
        icon={<UsersIcon className="w-6 h-6" />}
        title="For Parents"
      >
        Track your child's progress, pay fees online, and communicate with
        teachers seamlessly.
      </FeatureCard>
    </div>
  </Section>
);

const HowItWorksSection: React.FC = () => (
  <Section id="how-it-works" className="bg-slate-50">
    <SectionTitle subtitle="How It Works" title="Getting Started is Easy" />
    <div className="relative">
      <div
        className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-300"
        aria-hidden="true"
      ></div>
      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-brand-primary text-white font-bold text-2xl rounded-full mb-4 z-10 relative">
            1
          </div>
          <h3 className="font-bold text-lg">Register Your School</h3>
          <p className="text-text-secondary-dark mt-2">
            Fill out our simple contact form to begin the onboarding process.
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-brand-primary text-white font-bold text-2xl rounded-full mb-4 z-10 relative">
            2
          </div>
          <h3 className="font-bold text-lg">We Configure Your ERP</h3>
          <p className="text-text-secondary-dark mt-2">
            Our team sets up your dedicated instance, configures modules, and
            imports your existing data.
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto bg-brand-primary text-white font-bold text-2xl rounded-full mb-4 z-10 relative">
            3
          </div>
          <h3 className="font-bold text-lg">Train & Go Live</h3>
          <p className="text-text-secondary-dark mt-2">
            We provide comprehensive training for your staff, ensuring a smooth
            transition.
          </p>
        </div>
      </div>
    </div>
  </Section>
);

const PricingSection: React.FC = () => (
  <Section id="pricing">
    <SectionTitle
      subtitle="Pricing Plans"
      title="Flexible Pricing for Every Institution"
    >
      Choose a plan that scales with your needs. Simple, transparent, and
      powerful.
    </SectionTitle>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="text-center flex flex-col">
        <h3 className="text-xl font-bold">Starter</h3>
        <p className="text-3xl font-bold my-4 text-brand-secondary">
          Get a Quote
        </p>
        <ul className="space-y-2 text-text-secondary-dark text-left flex-grow">
          <li>✓ Up to 500 Students</li>
          <li>✓ All Core Modules</li>
          <li>✓ Parent & Student Portals</li>
          <li>✓ Basic Support</li>
        </ul>
        <Button
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-6 w-full"
        >
          Get Started
        </Button>
      </Card>
      <Card className="text-center flex flex-col border-2 border-brand-primary shadow-2xl relative">
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-primary text-white px-3 py-1 text-sm font-semibold rounded-full">
          Most Popular
        </div>
        <h3 className="text-xl font-bold">Pro</h3>
        <p className="text-3xl font-bold my-4 text-brand-secondary">
          Get a Quote
        </p>
        <ul className="space-y-2 text-text-secondary-dark text-left flex-grow">
          <li>✓ Up to 5000 Students</li>
          <li>✓ All Core Modules</li>
          <li>✓ AI Analytics Module</li>
          <li>✓ Mobile Apps</li>
          <li>✓ Priority Support</li>
        </ul>
        <Button
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-6 w-full"
        >
          Choose Pro
        </Button>
      </Card>
      <Card className="text-center flex flex-col">
        <h3 className="text-xl font-bold">Enterprise</h3>
        <p className="text-3xl font-bold my-4 text-brand-secondary">
          Get a Quote
        </p>
        <ul className="space-y-2 text-text-secondary-dark text-left flex-grow">
          <li>✓ Unlimited Students</li>
          <li>✓ Multi-Branch Support</li>
          <li>✓ Custom Feature Development</li>
          <li>✓ Dedicated Account Manager</li>
          <li>✓ On-Premise Option</li>
        </ul>
        <Button
          variant="secondary"
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="mt-6 w-full"
        >
          Contact Us
        </Button>
      </Card>
    </div>
  </Section>
);

const TestimonialsSection: React.FC = () => (
  <Section id="testimonials" className="bg-slate-50">
    <SectionTitle
      subtitle="Testimonials"
      title="Trusted by Leading Institutions"
    >
      See what principals and teachers are saying about Verticx.
    </SectionTitle>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <Card className="flex flex-col">
        <p className="text-text-secondary-dark flex-grow">
          "Verticx has transformed our multi-branch operations. The real-time
          analytics are a game-changer for strategic decision-making."
        </p>
        <div className="mt-4 pt-4 border-t">
          <p className="font-bold">Dr. Evelyn Reed</p>
          <p className="text-sm text-text-secondary-dark">
            Principal, North Branch
          </p>
        </div>
      </Card>
      <Card className="flex flex-col">
        <p className="text-text-secondary-dark flex-grow">
          "The registrar portal is incredibly intuitive. We've cut down our
          administrative workload by nearly 40% since adopting Verticx."
        </p>
        <div className="mt-4 pt-4 border-t">
          <p className="font-bold">Robert Muldoon</p>
          <p className="text-sm text-text-secondary-dark">
            Registrar, North Branch
          </p>
        </div>
      </Card>
      <Card className="flex flex-col">
        <p className="text-text-secondary-dark flex-grow">
          "As a teacher, having everything from attendance to gradebooks in one
          place saves me hours every week. The AI assistant helps me identify
          students who need extra attention."
        </p>
        <div className="mt-4 pt-4 border-t">
          <p className="font-bold">Dr. Ian Malcolm</p>
          <p className="text-sm text-text-secondary-dark">
            Mathematics Teacher
          </p>
        </div>
      </Card>
    </div>
  </Section>
);

const FaqItem: React.FC<{
  question: string;
  children: React.ReactNode;
  isOpen: boolean;
  onClick: () => void;
}> = ({ question, children, isOpen, onClick }) => (
  <div className="border-b border-slate-200 py-4">
    <button
      onClick={onClick}
      className="w-full flex justify-between items-center text-left text-lg font-medium text-text-primary-dark"
      aria-expanded={isOpen}
    >
      <span>{question}</span>
      <span
        className={`transform transition-transform duration-300 ${
          isOpen ? "rotate-180" : "rotate-0"
        }`}
      >
        ▼
      </span>
    </button>
    <div
      className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isOpen ? "max-h-96 mt-2" : "max-h-0"
      }`}
    >
      <p className="text-text-secondary-dark pt-2">{children}</p>
    </div>
  </div>
);

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Is Verticx suitable for a single-branch school?",
      a: "Absolutely! While Verticx is powerful enough for multi-branch institutions, its modular design makes it perfectly scalable and affordable for single schools of any size.",
    },
    {
      q: "Can we import our existing student data?",
      a: "Yes, our team provides full support for data migration from your existing systems, including spreadsheets, to ensure a seamless transition.",
    },
    {
      q: "Is our data secure with Verticx?",
      a: "Security is our top priority. We use enterprise-grade encryption, secure cloud infrastructure, and regular security audits to protect your school's sensitive data.",
    },
    {
      q: "Do you offer mobile apps?",
      a: "Yes, we offer dedicated mobile apps for both parents and students (available on Pro and Enterprise plans) to keep everyone connected on the go.",
    },
  ];

  return (
    <Section id="faq">
      <SectionTitle subtitle="FAQ" title="Frequently Asked Questions" />
      <div className="max-w-3xl mx-auto">
        {faqs.map((faq, index) => (
          <FaqItem
            key={index}
            question={faq.q}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {faq.a}
          </FaqItem>
        ))}
      </div>
    </Section>
  );
};

const AboutUsSection: React.FC = () => (
  <Section id="about">
    <SectionTitle subtitle="About Us" title="The People Behind the Platform">
      We are a team of educators, technologists, and innovators passionate about
      shaping the future of education.
    </SectionTitle>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div>
        <h3 className="text-2xl font-bold text-text-primary-dark mb-4">
          Our Mission
        </h3>
        <p className="text-text-secondary-dark mb-6">
          To empower educational institutions with intelligent, seamless, and
          integrated technology that streamlines operations, fosters
          collaboration, and ultimately enhances the learning experience for
          every student.
        </p>
        <h3 className="text-2xl font-bold text-text-primary-dark mb-4">
          Our Vision
        </h3>
        <p className="text-text-secondary-dark">
          To be the leading platform for educational management, driving
          innovation and efficiency in schools worldwide, making quality
          education administration accessible to all.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
        <div className="flex flex-col items-center">
          <img
            src="/COF.jpeg?text=co-founder 404 error"
            alt="Rohit Kumar"
            className="w-32 h-32 rounded-full mb-2 object-cover shadow-lg"
          />
          <h4 className="font-bold">Rohit Kumar</h4>
          <p className="text-sm text-text-secondary-dark">
            rohit.singh@verticx.com
          </p>
        </div>
        <div className="flex flex-col items-center">
          <img
            src="/CEO.jpeg?text=CEO"
            alt="Aditi Singh"
            className="w-32 h-32 rounded-full mb-2 object-cover shadow-lg"
          />
          <h4 className="font-bold">Aditi Singh</h4>
          <p className="text-sm text-text-secondary-dark">
            aditi.singh@verticx.com
          </p>
        </div>

        <div className="flex flex-col items-center">
          <img
            src="https://placehold.co/128x128/E2E8F0/475569?text=founder not found"
            alt="Aditya Kumar Singh"
            className="w-32 h-32 rounded-full mb-2 object-cover shadow-lg"
          />
          <h4 className="font-bold">Aditya Kumar Singh</h4>
          <p className="text-sm text-text-secondary-dark">
            aditya.singh@verticx.com
          </p>
        </div>
      </div>
    </div>
  </Section>
);

const CtaSection: React.FC = () => (
  <Section id="cta" className="bg-brand-primary text-white">
    <div className="text-center">
      <h2 className="text-3xl font-extrabold tracking-tight">
        Ready to Transform Your School?
      </h2>
      <p className="mt-4 text-lg leading-6 text-indigo-100">
        Join dozens of institutions that trust Verticx to streamline their
        operations. Get started today.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Button
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="!bg-white !text-brand-primary hover:!bg-slate-100 !px-8 !py-3 !text-lg"
        >
          Register Now
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            document
              .getElementById("contact")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="!px-8 !py-3 !text-lg !bg-brand-primary/50 hover:!bg-brand-primary/80"
        >
          Request a Demo
        </Button>
      </div>
    </div>
  </Section>
);

const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    schoolName: "",
    registrationId: "",
    principalName: "",
    email: "",
    phone: "",
    location: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    try {
      await sharedApiService.registerSchool(formData);
      setMessage(
        "Registration request submitted successfully! We will contact you shortly."
      );
      setFormData({
        schoolName: "",
        registrationId: "",
        principalName: "",
        email: "",
        phone: "",
        location: "",
      });
    } catch (error: any) {
      setMessage(error.message || "An error occurred. Please try again.");
      setIsError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section id="contact" className="bg-slate-50">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <SectionTitle
            subtitle="Get in Touch"
            title="Register Your School Today"
          >
            Fill out the form to get started with Verticx, or contact us to
            request a personalized demo for your institution.
          </SectionTitle>
          <div className="mt-8 space-y-4">
            <p className="flex items-center text-text-secondary-dark">
              <MailIcon className="w-5 h-5 mr-3 text-brand-primary" />{" "}
              sales@verticx.com
            </p>
            <p className="flex items-center text-text-secondary-dark">
              <PhoneIcon className="w-5 h-5 mr-3 text-brand-primary" /> +1 (555)
              123-4567
            </p>
            <p className="flex items-center text-text-secondary-dark">
              <MapPinIcon className="w-5 h-5 mr-3 text-brand-primary" /> 123
              Innovation Drive, Tech City, USA
            </p>
          </div>
        </div>
        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              name="schoolName"
              label="School Name"
              value={formData.schoolName}
              onChange={handleChange}
              required
            />
            <Input
              name="registrationId"
              label="School Registration ID"
              value={formData.registrationId}
              onChange={handleChange}
              required
              placeholder="e.g., VRTX-NORTH-01"
            />
            <Input
              name="principalName"
              label="Principal's Name"
              value={formData.principalName}
              onChange={handleChange}
              required
            />
            <Input
              name="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Input
              name="phone"
              label="Phone Number"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <Input
              name="location"
              label="City / Location"
              value={formData.location}
              onChange={handleChange}
              required
            />
            {message && (
              <p
                className={`text-center ${
                  isError ? "text-red-600" : "text-green-600"
                }`}
              >
                {message}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Submit Registration"}
            </Button>
          </form>
        </Card>
      </div>
    </Section>
  );
};

const Footer: React.FC = () => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.getAttribute("href")?.substring(1);
    if (targetId) {
      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer className="bg-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center mb-4">
              <VerticxLogo className="h-10 w-10 mr-2" />
              <span className="text-2xl font-bold text-white">VERTICX</span>
            </div>
            <p className="text-sm text-slate-400">
              Revolutionizing Education Management, One School at a Time.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              Product
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="#features"
                  onClick={handleNavClick}
                  className="text-base text-slate-400 hover:text-white cursor-pointer"
                >
                  Features
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  onClick={handleNavClick}
                  className="text-base text-slate-400 hover:text-white cursor-pointer"
                >
                  Pricing
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={handleNavClick}
                  className="text-base text-slate-400 hover:text-white cursor-pointer"
                >
                  Request a Demo
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              Company
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href="#about"
                  onClick={handleNavClick}
                  className="text-base text-slate-400 hover:text-white cursor-pointer"
                >
                  About Us
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  onClick={handleNavClick}
                  className="text-base text-slate-400 hover:text-white cursor-pointer"
                >
                  Contact
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-200 tracking-wider uppercase">
              Legal
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/terms"
                  className="text-base text-slate-400 hover:text-white"
                >
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-base text-slate-400 hover:text-white"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="text-base text-slate-400 hover:text-white"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
          <p>
            &copy; {new Date().getFullYear()} Verticx Technologies Pvt. Ltd. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

const LandingPage: React.FC = () => {
  return (
    <div className="bg-background-dark text-text-primary-dark">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <WhyVerticxSection />
        <PortalsSection />
        <HowItWorksSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <AboutUsSection />
        <CtaSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
