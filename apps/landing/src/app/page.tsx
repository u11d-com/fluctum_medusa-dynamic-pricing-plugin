"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowRight, BarChart3, Clock, Database, Globe, Server, Zap,
  Menu, X, Code2, Box, ShieldCheck, Paintbrush, 
  CreditCard, Package, Settings, Link as LinkIcon
} from "lucide-react";

export default function Home() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("hero");

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      message: formData.get("message"),
    };

    try {
      const endpoint = process.env.NEXT_PUBLIC_WEBFORM_URL;
      if (!endpoint) {
        console.warn("NEXT_PUBLIC_WEBFORM_URL not set");
        setTimeout(() => setFormStatus("success"), 1000);
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setFormStatus("success");
    } catch (err: unknown) {
      setFormStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred");
    }
  };

  useEffect(() => {
    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        if (cancelled) return;
        const visibleSections = entries.filter((entry) => entry.isIntersecting);
        if (visibleSections.length > 0) {
          // Sort by intersection ratio to find the most prominent one
          visibleSections.sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          setActiveSection(visibleSections[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -40% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    const sections = document.querySelectorAll("section[id]");
    sections.forEach((section) => observer.observe(section));

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  const navLinks = [
    { name: "What is it?", href: "#what-is-it" },
    { name: "Customization", href: "#customization" },
    { name: "Integrations", href: "#integrations" },
    { name: "How it works", href: "#how-it-works" },
    { name: "Use cases", href: "#use-cases" },
    { name: "Deployment", href: "#deployment" },
  ];

  return (
    <div className="min-h-screen font-sans bg-[#0a0a0a] text-white">
      {/* Navbar */}
      <header className="fixed top-0 w-full border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-md z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="#hero" className="flex-shrink-0" onClick={() => setIsMobileMenuOpen(false)}>
            <Image src="/fluctum-logo-full.svg" width={140} height={64} alt="Fluctum Logo" className="w-auto h-8 md:h-10" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  activeSection === link.href.slice(1) 
                    ? "text-[#7c3aed] drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]" 
                    : "text-white/60 hover:text-white"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <a 
              href="https://demo.fluctum.io"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg transition-colors text-sm"
            >
              See Demo
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="lg:hidden p-2 text-white/80 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-[#0a0a0a] border-b border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className={`text-lg font-medium ${
                  activeSection === link.href.slice(1) ? "text-[#7c3aed]" : "text-white/80"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
              <a 
                href="https://demo.fluctum.io"
                target="_blank"
                rel="noreferrer"
                className="w-full px-5 py-3 bg-[#7c3aed] text-white font-semibold rounded-lg text-center"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                See Demo
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* Section 1: Hero */}
        <section id="hero" className="pt-40 pb-24 px-6 relative overflow-hidden">
          {/* Subtle chart background */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
            <svg viewBox="0 0 1200 400" className="absolute bottom-0 left-0 w-full h-full" preserveAspectRatio="none">
              {/* Area chart fill */}
              <path d="M0,300 L0,320 L100,290 L200,310 L300,260 L400,240 L500,200 L600,180 L700,150 L800,130 L900,110 L1000,80 L1100,60 L1200,40 L1200,400 L0,400 Z" fill="url(#chartFill)" />
              {/* Line */}
              <path d="M0,320 L100,290 L200,310 L300,260 L400,240 L500,200 L600,180 L700,150 L800,130 L900,110 L1000,80 L1100,60 L1200,40" fill="none" stroke="url(#chartLine)" strokeWidth="2" />
              {/* Candle stems */}
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((x, i) => {
                const y = [290, 310, 260, 240, 200, 180, 150, 130, 110, 80, 60][i];
                return <line key={x} x1={x} y1={y - 20} x2={x} y2={y + 20} stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.25" />;
              })}
              <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.5" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          {/* Purple glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7c3aed]/15 rounded-full blur-[100px] pointer-events-none z-0"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-7xl md:text-8xl font-extrabold text-white tracking-tight mb-4 leading-none">
              Fluctum
            </h1>
            <p className="text-2xl md:text-3xl font-light text-white/70 mb-12 tracking-wide">
              Real-Time Dynamic Pricing for Medusa
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://demo.fluctum.io"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
              >
                See Demo
                <ArrowRight className="w-4 h-4" />
              </a>
              <Link
                href="#contact"
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-lg transition-colors flex items-center justify-center"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

        {/* Section 2: What is it? */}
        <section id="what-is-it" className="py-24 bg-[#111111] px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 max-w-3xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">What is Fluctum?</h2>
              <p className="text-xl text-white/60 leading-relaxed mb-6">
                Fluctum is an open-source dynamic pricing framework built on top of <a href="https://medusajs.com" target="_blank" rel="noreferrer" className="text-[#7c3aed] hover:underline">Medusa</a> — the composable commerce platform. It ships as three open-source packages: a <strong className="text-white">Medusa plugin</strong>, a <strong className="text-white">backend starter</strong>, and a <strong className="text-white">storefront starter</strong>.
              </p>
              <p className="text-lg text-white/50 leading-relaxed">
                Because it&apos;s Medusa-based, you inherit everything Medusa offers — multi-region, multi-currency, promotions, and customer management — with real-time dynamic pricing layered on top. Both backend and storefront are fully customizable and extendable via TypeScript.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-8 border border-white/10 rounded-xl bg-black/50 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <Box className="w-10 h-10 text-[#7c3aed] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Medusa-native</h3>
                <p className="text-white/60 leading-relaxed">Built as a Medusa plugin; drops into any Medusa 2.x project seamlessly.</p>
              </div>
              <div className="p-8 border border-white/10 rounded-xl bg-black/50 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <Code2 className="w-10 h-10 text-[#7c3aed] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Open source</h3>
                <p className="text-white/60 leading-relaxed">MIT license, community-first; fork and extend freely to fit your business.</p>
              </div>
              <div className="p-8 border border-white/10 rounded-xl bg-black/50 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <ShieldCheck className="w-10 h-10 text-[#7c3aed] mb-6" />
                <h3 className="text-xl font-bold text-white mb-3">Production-ready</h3>
                <p className="text-white/60 leading-relaxed">SSE streams, price locking, and checkout validation — all built in and battle-tested.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Customization */}
        <section id="customization" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Make It Your Own</h2>
                <p className="text-xl text-white/60 leading-relaxed mb-6">
                  Medusa separates backend from frontend — your storefront can look exactly the way you want.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <Paintbrush className="w-6 h-6 text-[#7c3aed] flex-shrink-0" />
                    <span className="text-white/80">Use any framework: Next.js, SvelteKit, Remix, or plain HTML.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Database className="w-6 h-6 text-[#7c3aed] flex-shrink-0" />
                    <span className="text-white/80">The plugin provides the data and logic; your design team provides the UI.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Globe className="w-6 h-6 text-[#7c3aed] flex-shrink-0" />
                    <span className="text-white/80">Our demo uses Next.js 15 + Tailwind, but you can build a Vue app, React Native mobile app, or even an in-store kiosk interface.</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8 border border-white/10 rounded-2xl bg-[#050505] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#7c3aed] to-transparent opacity-50"></div>
                <h4 className="text-white/50 text-sm font-mono mb-4 border-b border-white/10 pb-4">Formula Engine</h4>
                <pre className="text-sm font-mono text-white/80 overflow-x-auto whitespace-pre-wrap">
                  <code className="block mb-2"><span className="text-[#7c3aed]">const</span> <span className="text-blue-300">final_price</span> = </code>
                  <code className="block pl-4 mb-1">weight <span className="text-white/40">×</span></code>
                  <code className="block pl-4 mb-1">spot_price <span className="text-white/40">×</span></code>
                  <code className="block pl-4 mb-1">factor <span className="text-white/40">×</span></code>
                  <code className="block pl-4">fx_rate;</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Integrations */}
        <section id="integrations" className="py-24 bg-[#111111] px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Integrations</h2>
              <p className="text-xl text-white/60 leading-relaxed">
                Since Fluctum is built on Medusa, you inherit the entire Medusa ecosystem out of the box.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {[
                { icon: BarChart3, name: "goldapi.io", desc: "Live gold and silver spot prices" },
                { icon: CreditCard, name: "Stripe / PayPal", desc: "Native Medusa payment providers" },
                { icon: Package, name: "ShipStation / Shippo", desc: "Automated fulfillment and shipping" },
                { icon: Settings, name: "Contentful / Sanity", desc: "Headless CMS for product content" },
                { icon: Zap, name: "Klaviyo / SendGrid", desc: "Transactional emails and marketing" },
                { icon: LinkIcon, name: "Custom ERP feed", desc: "Pipe any JSON/CSV into Fluctum's interface" },
              ].map((item, i) => (
                <div key={i} className="p-6 border border-white/10 rounded-xl bg-black/50 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#7c3aed]/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-6 h-6 text-[#7c3aed]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{item.name}</h3>
                    <p className="text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <a 
                href="https://medusajs.com/plugins/" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
              >
                ...and hundreds more via Medusa Plugins <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        {/* Section 5: How it works */}
        <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center">Built for real-time commerce</h2>
            
            <div className="grid md:grid-cols-3 gap-12">
              <div className="relative p-6 rounded-2xl border border-transparent hover:border-[#7c3aed]/20 transition-colors">
                <div className="text-[#7c3aed] text-6xl font-black opacity-20 absolute -top-4 -left-2">1</div>
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Connect a provider</h3>
                <p className="text-white/60 leading-relaxed">Plug in goldapi.io, your ERP, or a custom feed. Fluctum constantly ingests the latest spot prices.</p>
              </div>
              <div className="relative p-6 rounded-2xl border border-transparent hover:border-[#7c3aed]/20 transition-colors">
                <div className="text-[#7c3aed] text-6xl font-black opacity-20 absolute -top-4 -left-2">2</div>
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Prices flow via SSE</h3>
                <p className="text-white/60 leading-relaxed">Every storefront client receives live spot prices over a single persistent Server-Sent Events connection.</p>
              </div>
              <div className="relative p-6 rounded-2xl border border-transparent hover:border-[#7c3aed]/20 transition-colors">
                <div className="text-[#7c3aed] text-6xl font-black opacity-20 absolute -top-4 -left-2">3</div>
                <h3 className="text-2xl font-bold text-white mb-4 relative z-10">Checkout locks the price</h3>
                <p className="text-white/60 leading-relaxed">When the buyer proceeds, prices are locked for 2 minutes and validated exactly at order completion.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Use Cases */}
        <section id="use-cases" className="py-24 bg-[#111111] px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16">Where Fluctum fits</h2>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="p-8 bg-black/50 border border-white/10 rounded-xl flex items-start gap-4 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <div className="mt-1"><Database className="text-[#7c3aed]" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Precious Metals</h3>
                  <p className="text-white/60">Gold and silver bullion dealers needing sub-second spot accuracy.</p>
                </div>
              </div>
              <div className="p-8 bg-black/50 border border-white/10 rounded-xl flex items-start gap-4 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <div className="mt-1"><BarChart3 className="text-[#7c3aed]" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Industrial Metals</h3>
                  <p className="text-white/60">Copper, platinum, and palladium wholesale operations.</p>
                </div>
              </div>
              <div className="p-8 bg-black/50 border border-white/10 rounded-xl flex items-start gap-4 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <div className="mt-1"><Server className="text-[#7c3aed]" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">B2B & ERP-driven</h3>
                  <p className="text-white/60">Live catalog pricing synced directly with internal inventory systems.</p>
                </div>
              </div>
              <div className="p-8 bg-black/50 border border-white/10 rounded-xl flex items-start gap-4 hover:border-[#7c3aed]/40 hover:bg-white/5 transition-all">
                <div className="mt-1"><Globe className="text-[#7c3aed]" /></div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">FX-Sensitive Goods</h3>
                  <p className="text-white/60">High-value items that require constant currency conversion adjustments.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Deployment */}
        <section id="deployment" className="py-24 px-6 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-16 text-center">Deploy your way</h2>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-10 border border-white/10 rounded-2xl bg-gradient-to-b from-white/5 to-transparent flex flex-col h-full hover:border-[#7c3aed]/30 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4">Medusa Cloud</h3>
                <p className="text-white/60 mb-8 flex-grow">One-click deployment on Medusa&apos;s official managed infrastructure. Optimized for scale.</p>
                <a 
                  href="https://cloud.medusajs.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 border border-[#7c3aed]/30 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-white font-medium rounded-lg transition-colors text-center"
                >
                  cloud.medusajs.com
                </a>
              </div>
              
              <div className="p-10 border border-white/10 rounded-2xl bg-gradient-to-b from-white/5 to-transparent flex flex-col h-full hover:border-[#7c3aed]/30 transition-all">
                <h3 className="text-2xl font-bold text-white mb-4">Self-Hosted</h3>
                <p className="text-white/60 mb-8 flex-grow">Full control on your own AWS, GCP, or bare metal infrastructure.</p>
                <a 
                  href="https://deploymedusa.com" 
                  target="_blank" 
                  rel="noreferrer"
                  className="w-full py-3 border border-[#7c3aed]/30 bg-[#7c3aed]/10 hover:bg-[#7c3aed]/20 text-white font-medium rounded-lg transition-colors text-center"
                >
                  deploymedusa.com
                </a>
              </div>
            </div>
          </div>
        </section>


        {/* Contact Section */}
        <section id="contact" className="py-24 bg-[#0a0a0a] px-6 border-t border-white/5">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Ready to ship live pricing?</h2>
            <p className="text-xl text-white/60">
              Get in touch to discuss implementation for your storefront or reach out at <a href="mailto:hello@u11d.com" className="text-[#7c3aed] hover:underline">hello@u11d.com</a>.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            {formStatus === "success" ? (
              <div className="p-8 border border-green-500/30 bg-green-500/10 rounded-xl text-center">
                <h3 className="text-2xl font-bold text-white mb-2">Message Received</h3>
                <p className="text-white/70">We&apos;ll get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">Name *</label>
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required 
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">Email *</label>
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required 
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all"
                  />
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">Message *</label>
                  <textarea 
                    id="message" 
                    name="message" 
                    rows={5} 
                    required 
                    className="w-full px-4 py-3 bg-black border border-white/20 rounded-lg text-white focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all resize-none"
                  ></textarea>
                </div>
                
                {formStatus === "error" && (
                  <div className="p-4 border border-red-500/30 bg-red-500/10 rounded-lg text-red-400 text-sm">
                    {errorMessage}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={formStatus === "submitting"}
                  className="w-full px-8 py-4 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#7c3aed]/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {formStatus === "submitting" ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
            <Image src="/fluctum-logo-full.svg" width={100} height={46} alt="Fluctum Logo" className="opacity-50 w-auto h-7" />
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/50">
              <a href="https://u11d.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">u11d.com</a>
              <a href="https://github.com/u11d-com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
              <a href="https://deploymedusa.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">deploymedusa.com</a>
              <a href="https://medusajs.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">medusajs.com</a>
            </nav>
          </div>
          <p className="text-center text-white/30 text-sm">© {new Date().getFullYear()} Fluctum by u11d. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
