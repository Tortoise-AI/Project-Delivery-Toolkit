import { useState } from 'react';
import { SUGGEST_FORM_URL } from '../constants';

const WEBSITE = 'https://tortoiseai.co.uk';
const GITHUB_URL = 'https://github.com/Tortoise-AI/Project-Delivery-Toolkit';

const companyLinks = [
  { href: `${WEBSITE}/about`, label: 'About Us' },
  { href: `${WEBSITE}/solutions`, label: 'Solutions' },
  { href: `${WEBSITE}/careers`, label: 'Careers' },
  { href: `${WEBSITE}/contact`, label: 'Contact' },
];

export default function Footer() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="bg-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

            {/* Brand */}
            <div className="lg:col-span-2">
              <a href={WEBSITE} className="inline-flex items-center space-x-2 mb-4 group">
                <img src="/images/logo.png" alt="TortoiseAI Logo" className="h-8 w-auto" />
                <span className="text-xl font-bold text-white">TortoiseAI</span>
              </a>
              <p className="text-white/80 max-w-md leading-relaxed">
                Production-ready AI for high-stakes environments
              </p>
            </div>

            {/* Company links */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-white">Company</h3>
              <ul className="space-y-2">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-white/80 hover:text-primary transition-colors duration-tortoise"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contribute */}
            <div>
              <h3 className="font-semibold text-lg mb-4 text-white">Contribute</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href={SUGGEST_FORM_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 hover:text-primary transition-colors duration-tortoise"
                  >
                    Suggest a Resource
                  </a>
                </li>
                <li>
                  <a
                    href={GITHUB_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/80 hover:text-primary transition-colors duration-tortoise"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-white/60 text-sm">
                &copy; {currentYear} TortoiseAI. All rights reserved.
              </p>
              <div className="flex flex-wrap items-center gap-6">
                <button
                  onClick={() => setShowDisclaimer(true)}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-tortoise"
                >
                  Disclaimer
                </button>
                <a
                  href={`${WEBSITE}/charity`}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-tortoise"
                >
                  TortoiseAI for Charities
                </a>
                <a
                  href={`${WEBSITE}/privacy`}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-tortoise"
                >
                  Privacy Policy
                </a>
                <a
                  href={`${WEBSITE}/terms`}
                  className="text-white/60 hover:text-white text-sm transition-colors duration-tortoise"
                >
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]"
          onClick={() => setShowDisclaimer(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-secondary">Disclaimer</h2>
              <button
                onClick={() => setShowDisclaimer(false)}
                className="text-secondary/40 hover:text-secondary transition-colors duration-tortoise text-3xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="text-base md:text-lg text-secondary/80 leading-relaxed space-y-4">
              <p>
                This toolkit is provided for general guidance only and does not constitute legal or professional advice.
                Use of the Toolkit does not create any legal obligations or guarantees of compliance, approval, or
                funding. Users are responsible for ensuring their practices meet applicable laws, regulations, and
                contractual requirements. No liability is accepted for any loss or damage resulting from its use.
                The content may be updated periodically. Users should refer to the latest version and seek independent
                advice where needed.
              </p>
            </div>
            <div className="mt-8 text-right">
              <button
                onClick={() => setShowDisclaimer(false)}
                className="font-medium rounded-lg px-6 py-3 bg-primary text-white hover:scale-[1.02] active:scale-[0.98] transition-transform duration-tortoise shadow-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
