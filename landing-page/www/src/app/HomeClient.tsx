"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sun,
  Moon,
  ArrowRight,
  ArrowUpRight,
  ChartColumn,
  Database,
  Globe,
  Server,
  Zap,
  CodeXml,
  Box,
  ShieldCheck,
  Paintbrush,
  CreditCard,
  DollarSign,
  ExternalLink,
  Package,
  Link as LinkIcon,
  Briefcase,
  Wrench,
  GitMerge,
  Cloud,
  HardDrive,
} from "lucide-react";
import CandleChart from "./CandleChart";
import { faqs } from "./faq-data";

declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback: () => void) => void;
        execute: (
          siteKey: string,
          options: { action: string },
        ) => Promise<string>;
      };
    };
  }
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
const RECAPTCHA_ACTION = "contact_form";

function getRecaptchaToken(): Promise<string | undefined> {
  if (
    !RECAPTCHA_SITE_KEY ||
    typeof window === "undefined" ||
    !window.grecaptcha
  ) {
    return Promise.resolve(undefined);
  }

  const siteKey = RECAPTCHA_SITE_KEY;
  return new Promise((resolve, reject) => {
    window.grecaptcha!.enterprise.ready(() => {
      window
        .grecaptcha!.enterprise.execute(siteKey, { action: RECAPTCHA_ACTION })
        .then(resolve)
        .catch(reject);
    });
  });
}

const features = [
  {
    icon: Box,
    title: "Medusa-native",
    desc: "Built as a Medusa plugin; drops into any Medusa project seamlessly.",
  },
  {
    icon: CodeXml,
    title: "Open source",
    desc: "MIT license, community-first; fork and extend freely to fit your business.",
  },
  {
    icon: ShieldCheck,
    title: "Production-ready",
    desc: "SSE streams, price locking, and checkout validation - all built in and battle-tested.",
  },
];

const customizationPoints = [
  {
    icon: Paintbrush,
    text: "Use any framework: Next.js, SvelteKit, Remix, or plain HTML.",
  },
  {
    icon: Database,
    text: "The plugin provides the data and logic; your design team provides the UI.",
  },
  {
    icon: Globe,
    text: "Our demo uses Next.js 16 + Tailwind, but you can build a Vue app, React Native mobile app, or even an in-store kiosk interface.",
  },
];

const integrations = [
  {
    icon: ChartColumn,
    name: "GoldAPI.io / nFusion",
    desc: "Live precious metals spot prices",
  },
  {
    icon: CreditCard,
    name: "Stripe / PayPal",
    desc: "Native Medusa payment providers",
  },
  {
    icon: Package,
    name: "ShipStation / InPost",
    desc: "Automated fulfillment and shipping",
  },
  {
    icon: DollarSign,
    name: "Avalara / TaxJar",
    desc: "Automated tax calculation",
  },
  {
    icon: Zap,
    name: "Mailchimp / SendGrid",
    desc: "Transactional emails and marketing",
  },
  {
    icon: LinkIcon,
    name: "Odoo / Base",
    desc: "ERP sync via custom API",
  },
];

const steps = [
  {
    title: "Connect a provider",
    desc: "Plug in GoldAPI.io, your ERP, or a custom feed. Fluctum constantly ingests the latest spot prices.",
  },
  {
    title: "Prices flow via SSE",
    desc: "Every storefront client receives live spot prices over a single persistent Server-Sent Events connection.",
  },
  {
    title: "Checkout locks the price",
    desc: "When the buyer proceeds, Fluctum creates locks from the latest spot prices stored in your database for your configured window (for example, 2 or 10 minutes), then validates them at order completion.",
  },
];

const useCases = [
  {
    icon: Database,
    title: "Precious Metals",
    desc: "Gold and silver bullion dealers needing sub-second spot accuracy.",
  },
  {
    icon: ChartColumn,
    title: "Industrial Metals",
    desc: "Copper, platinum, and palladium wholesale operations.",
  },
  {
    icon: Server,
    title: "B2B & ERP-driven",
    desc: "Live catalog pricing synced directly with internal inventory systems.",
  },
  {
    icon: Globe,
    title: "FX-Sensitive Goods",
    desc: "High-value items that require constant currency conversion adjustments.",
  },
];

const deployments = [
  {
    icon: Cloud,
    title: "Medusa Cloud",
    desc: "One-click deployment on Medusa's official managed infrastructure. Optimized for scale.",
    href: "https://cloud.medusajs.com",
    event: "cta_deploy_medusa_cloud",
  },
  {
    icon: HardDrive,
    title: "Self-Hosted",
    desc: "Full control on your own AWS, GCP, or bare metal infrastructure.",
    href: "https://deploymedusa.com",
    event: "cta_deploy_self_hosted",
  },
];

const partnership = [
  {
    icon: Briefcase,
    title: "Holistic Process Design",
    desc: "We start by understanding your entire operation—from inventory and ERP to WMS and fulfillment—to design a seamless data flow.",
  },
  {
    icon: Wrench,
    title: "Custom Solution Development",
    desc: "We build custom storefronts, back-office tools, and middleware to solve your unique business challenges, using Fluctum as a core component.",
  },
  {
    icon: GitMerge,
    title: "Seamless Systems Integration",
    desc: "Our expertise lies in connecting disparate systems into a cohesive, scalable commerce architecture that grows with your business.",
  },
];

const footerLinks = [
  {
    name: "GitHub repo",
    href: "https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin",
  },
  {
    name: "Starter",
    href: "https://github.com/u11d-com/fluctum_starter",
  },
  {
    name: "NPM package",
    href: "https://www.npmjs.com/package/@u11d/medusa-dynamic-pricing",
  },
  { name: "Medusa", href: "https://medusajs.com" },
  { name: "Deploy Medusa", href: "https://deploymedusa.com" },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/showcase/fluctum-dynamic-pricing",
  },
];

const h2 = "text-4xl md:text-6xl font-bold tracking-tight";
const linkAcc = "text-acc underline underline-offset-4";

export default function HomeClient() {
  const [formStatus, setFormStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.1 },
    );
    document
      .querySelectorAll(".reveal")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
  };

  const handleContactSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("submitting");

    const formData = new FormData(e.currentTarget);

    try {
      const endpoint = process.env.NEXT_PUBLIC_WEBFORM_URL;
      if (!endpoint) {
        console.warn("NEXT_PUBLIC_WEBFORM_URL not set");
        setTimeout(() => setFormStatus("success"), 1000);
        return;
      }

      const captchaToken = await getRecaptchaToken();
      if (RECAPTCHA_SITE_KEY && !captchaToken) {
        throw new Error(
          "Unable to verify you're not a robot. Please try again.",
        );
      }

      const data = {
        name: formData.get("name"),
        email: formData.get("email"),
        message: formData.get("message"),
        acceptPrivacyPolicy: formData.get("acceptPrivacyPolicy") === "on",
        ...(captchaToken ? { captchaToken } : {}),
      };

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
      setErrorMessage(
        err instanceof Error ? err.message : "An unexpected error occurred",
      );
    }
  };

  return (
    <div className="min-h-screen font-sans text-fg overflow-x-clip">
      <header className="fixed top-0 inset-x-0 z-50 bg-bg/85 backdrop-blur border-b border-line">
        <div className="max-w-7xl mx-auto h-14 px-4 sm:px-6 flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center btn-ghost text-muted hover:text-fg"
              aria-label="Toggle theme"
              data-umami-event="toggle_theme"
              data-umami-event-location="header"
            >
              <Sun className="w-4 h-4 hidden dark:block" />
              <Moon className="w-4 h-4 dark:hidden" />
            </button>
            <a
              href="https://fluctum.medusajs.site/us"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-2 h-9 px-4 btn-ghost font-mono text-xs uppercase tracking-wider"
              data-umami-event="cta_see_demo"
              data-umami-event-location="header"
            >
              See Demo
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href="#contact"
              className="flex items-center h-9 px-4 btn-acc font-mono text-xs uppercase tracking-wider font-bold"
              data-umami-event="cta_contact_us"
              data-umami-event-location="header"
            >
              Contact us
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section id="hero" className="pt-28 sm:pt-32 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-6 panel brk p-8 md:p-12 flex flex-col justify-center reveal">
              <h1 className="text-7xl sm:text-8xl xl:text-9xl font-bold tracking-[-0.06em] leading-[0.85] mb-6">
                Fluctum
              </h1>
              <p className="text-2xl md:text-3xl font-medium text-muted tracking-tight mb-10">
                Real-Time Dynamic Pricing for Medusa
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="https://fluctum.medusajs.site/us"
                  target="_blank"
                  rel="noreferrer"
                  className="h-12 px-6 btn-ghost font-mono text-sm uppercase tracking-wider flex items-center justify-center gap-2"
                  data-umami-event="cta_see_demo"
                  data-umami-event-location="hero"
                >
                  See Demo
                  <ExternalLink className="w-4 h-4" />
                </a>
                <Link
                  href="#contact"
                  className="h-12 px-6 btn-acc font-mono text-sm uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                  data-umami-event="cta_contact_us"
                  data-umami-event-location="hero"
                >
                  Contact Us
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <p className="font-mono text-xs text-faint mt-6 leading-relaxed">
                Open source plugin, starter backend, and starter storefront.
                <a
                  href="https://github.com/u11d-com/fluctum_medusa-dynamic-pricing-plugin"
                  target="_blank"
                  rel="noreferrer"
                  className={`${linkAcc} ml-1`}
                  data-umami-event="link_github_plugin"
                  data-umami-event-location="hero"
                >
                  See more
                </a>
              </p>
            </div>

            <div className="lg:col-span-6 panel brk flex flex-col reveal">
              <div className="flex items-center gap-3 px-4 h-10 border-b border-line">
                <span className="w-2 h-2 rounded-full bg-up shadow-[0_0_10px_var(--up)]" />
                <span className="ml-auto flex gap-1.5">
                  <span className="w-2 h-2 bg-line" />
                  <span className="w-2 h-2 bg-line" />
                  <span className="w-2 h-2 bg-line" />
                </span>
              </div>
              <div className="relative flex-1 min-h-72 scan overflow-hidden">
                <CandleChart />
              </div>
            </div>
          </div>
        </section>

        <section id="fluctum" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 panel p-8 md:p-10 reveal">
              <h2 className={`${h2} mb-8`}>What is Fluctum?</h2>
              <p className="text-xl text-muted leading-relaxed mb-6">
                Fluctum is an open-source dynamic pricing plugin for{" "}
                <a
                  href="https://medusajs.com"
                  target="_blank"
                  rel="noreferrer"
                  className={linkAcc}
                >
                  Medusa
                </a>{" "}
                stores. It is built for precious metals and any catalog where
                market prices move constantly. Fluctum ships as three connected
                components:{" "}
                <strong className="text-fg">Medusa{" "}plugin</strong>,{" "}
                <strong className="text-fg">backend{" "}starter</strong>,
                and{" "}
                <strong className="text-fg">
                  storefront{" "}starter
                </strong>
                . Teams can launch quickly, then customize deeply in TypeScript.
              </p>
              <p className="text-lg text-faint leading-relaxed">
                You keep the full Medusa platform benefits: multi-region,
                multi-currency, promotions, customer management, localized
                taxes, shipping, and payments. Fluctum adds real-time SSE price
                updates and checkout price locks validated before order
                completion.
              </p>
            </div>
            <div className="lg:col-span-5 grid gap-6">
              {features.map((item) => (
                <div
                  key={item.title}
                  className="panel brk p-6 flex gap-5 reveal"
                >
                  <item.icon className="w-7 h-7 text-acc shrink-0" />
                  <div>
                    <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                    <p className="text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="customization" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-6">
            <div className="panel p-8 md:p-10 reveal">
              <h2 className={`${h2} mb-6`}>Make It Your Own</h2>
              <p className="text-xl text-muted leading-relaxed mb-8">
                Medusa separates backend from frontend - your storefront can
                look exactly the way you want.
              </p>
              <ul className="space-y-px bg-line border border-line">
                {customizationPoints.map((item) => (
                  <li key={item.text} className="flex gap-4 p-5 bg-panel">
                    <item.icon className="w-5 h-5 text-acc shrink-0 mt-0.5" />
                    <span className="opacity-85">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="brk bg-[#08080b] border border-white/10 text-[#ededf2] flex flex-col reveal">
              <div className="flex items-center h-10 px-4 border-b border-white/10">
                <h4 className="font-mono text-xs uppercase tracking-[.15em] text-[#a78bfa]">
                  Formula Engine
                </h4>
              </div>
              <div className="flex-1 grid grid-cols-[3rem_1fr] font-mono text-base md:text-lg leading-[2.4] py-6">
                <div
                  className="text-right pr-4 text-white/20 select-none"
                  aria-hidden="true"
                >
                  1<br />2<br />3<br />4<br />5
                </div>
                <pre className="pl-4 border-l border-white/10 font-mono whitespace-pre-wrap">
                  <code className="block">
                    <span className="text-[#a78bfa]">const</span>{" "}
                    <span className="text-[#34d399]">final_price</span>{" "}
                    <span className="text-white/40">=</span>
                  </code>
                  <code className="block pl-6">
                    weight <span className="text-[#fbbf24]">×</span>
                  </code>
                  <code className="block pl-6">
                    spot_price <span className="text-[#fbbf24]">×</span>
                  </code>
                  <code className="block pl-6">
                    factor <span className="text-[#fbbf24]">×</span>
                  </code>
                  <code className="block pl-6">
                    fx_rate<span className="text-white/40">;</span>
                    <span className="blink text-[#a78bfa]" aria-hidden="true">
                      ▌
                    </span>
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        <section id="integrations" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-6 items-end mb-10 reveal">
              <h2 className={h2}>Integrations</h2>
              <p className="text-xl text-muted leading-relaxed">
                Since Fluctum is built on Medusa, you inherit the entire Medusa
                ecosystem out of the box.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line mb-8">
              {integrations.map((item) => (
                <div
                  key={item.name}
                  className="bg-panel p-6 flex items-start gap-4 reveal"
                >
                  <div className="w-11 h-11 border border-line flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-acc" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{item.name}</h3>
                    <p className="font-mono text-xs text-faint mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <a
              href="https://medusajs.com/plugins/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-mono text-sm text-muted hover:text-acc transition-colors"
              data-umami-event="link_medusa_plugins"
            >
              ...and hundreds more via Medusa Plugins{" "}
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        <section id="how-it-works" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className={`${h2} mb-10 reveal`}>
              Built for real-time commerce
            </h2>
            <div className="grid md:grid-cols-3 gap-px bg-line border border-line">
              {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                return (
                  <div key={step.title} className="bg-panel p-8 reveal">
                    <div
                      className={`font-mono text-5xl font-bold mb-8 ${isLast ? "text-up" : "text-acc"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-muted leading-relaxed">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="use-cases" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className={`${h2} mb-10 reveal`}>Where Fluctum fits</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {useCases.map((item) => (
                <div
                  key={item.title}
                  className="panel brk p-7 flex flex-col min-h-64 reveal"
                >
                  <item.icon className="w-7 h-7 text-acc" />
                  <h3 className="text-2xl font-bold mt-auto mb-2 pt-10">
                    {item.title}
                  </h3>
                  <p className="text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="deployment" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className={`${h2} mb-10 reveal`}>Deploy your way</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {deployments.map((item) => (
                <a
                  key={item.title}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group panel panel-hover brk p-10 flex flex-col reveal"
                  data-umami-event={item.event}
                >
                  <div className="flex justify-between items-start mb-16">
                    <item.icon className="w-8 h-8 text-acc" />
                    <ArrowUpRight className="w-6 h-6 text-muted group-hover:text-acc transition-colors" />
                  </div>
                  <h3 className="text-3xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted text-lg">{item.desc}</p>
                </a>
              ))}
            </div>
            <p className="font-mono text-sm text-faint mt-8">
              Want a fast implementation path? Start from our
              <a
                href="https://github.com/u11d-com/fluctum_starter"
                target="_blank"
                rel="noreferrer"
                className={`${linkAcc} ml-1`}
                data-umami-event="link_starter"
                data-umami-event-location="deployment"
              >
                backend + storefront starter
              </a>
              .
            </p>
          </div>
        </section>

        <section id="partnership" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <div className="panel p-8 md:p-12 mb-6 reveal">
              <h2 className={`${h2} mb-6 max-w-4xl`}>
                More Than a Plugin: Your Technology Partner
              </h2>
              <p className="text-xl text-muted leading-relaxed max-w-3xl">
                While Fluctum provides a powerful engine for dynamic pricing,
                our real value lies in partnership. We help organizations
                design, build, and integrate complete commerce solutions for
                high-volatility markets.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {partnership.map((item) => (
                <div
                  key={item.title}
                  className="panel brk p-8 reveal"
                >
                  <item.icon className="w-7 h-7 text-acc mb-6" />
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-muted leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            <h2 className={`${h2} lg:col-span-4 lg:sticky lg:top-24 reveal`}>
              Frequently asked questions
            </h2>
            <div className="lg:col-span-8 flex flex-col gap-px bg-line border border-line">
              {faqs.map((faq) => (
                <details key={faq.question} className="faq bg-panel reveal">
                  <summary className="flex items-start gap-4 cursor-pointer p-5 list-none">
                    <span className="font-semibold text-lg flex-1 leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className="faq-sign font-mono text-xl text-acc leading-none w-5 text-center"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="faq-body">
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-muted leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="py-24 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto panel brk grid lg:grid-cols-2 reveal">
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-line">
              <h2 className={`${h2} mb-6`}>Ready to ship live pricing?</h2>
              <p className="text-xl text-muted leading-relaxed">
                Get in touch to discuss end-to-end implementation support or
                reach out at{" "}
                <a
                  href="mailto:hello@u11d.com"
                  className={linkAcc}
                  data-umami-event="link_email_contact"
                >
                  hello@u11d.com
                </a>
                .
              </p>
            </div>

            <div className="p-8 md:p-12 bg-panel-2">
              {formStatus === "success" ? (
                <div className="h-full p-8 border border-up/40 bg-up/10 flex flex-col justify-center text-center">
                  <h3 className="text-2xl font-bold mb-2">Message Received</h3>
                  <p className="text-muted">
                    We&apos;ll get back to you shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block font-mono text-xs uppercase tracking-wider text-muted mb-2"
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="inp"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block font-mono text-xs uppercase tracking-wider text-muted mb-2"
                    >
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      className="inp"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block font-mono text-xs uppercase tracking-wider text-muted mb-2"
                    >
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="inp resize-none"
                    ></textarea>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptPrivacyPolicy"
                      name="acceptPrivacyPolicy"
                      required
                      className="mt-1 h-4 w-4 accent-acc"
                    />
                    <label
                      htmlFor="acceptPrivacyPolicy"
                      className="text-sm text-muted"
                    >
                      I agree that my information may be used to respond to my
                      inquiry. *
                    </label>
                  </div>

                  {formStatus === "error" && (
                    <div className="p-4 border border-down/40 bg-down/10 text-down text-sm">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={formStatus === "submitting"}
                    className="w-full h-14 btn-acc font-mono uppercase tracking-wider font-bold"
                    data-umami-event="form_contact_submit"
                  >
                    {formStatus === "submitting"
                      ? "Sending..."
                      : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-panel">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex justify-center">
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 font-mono text-xs uppercase tracking-wider text-faint">
            {footerLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="hover:text-acc transition-colors"
                data-umami-event="footer_link"
                data-umami-event-name={link.name}
              >
                {link.name}
              </a>
            ))}
          </nav>
        </div>
        <p className="text-center font-mono text-xs text-faint pb-8">
          © {new Date().getFullYear()} Fluctum by{" "}
          <a href="https://u11d.com" target="_blank">
            u11d
          </a>
          . All rights reserved.
        </p>
      </footer>
    </div>
  );
}
