import { useState, useEffect, useRef, useCallback } from 'react';

const WEBSITE = 'https://tortoiseai.co.uk';

const aboutSubmenu = [
  { href: `${WEBSITE}/about`, label: 'About Us' },
  { href: `${WEBSITE}/careers`, label: 'Careers' },
  { href: `${WEBSITE}/insights`, label: 'Insights' },
  { href: `${WEBSITE}/resources`, label: 'Resources' },
];

const solutionsSubmenu = [
  { href: `${WEBSITE}/vt-subtitle-generator`, label: 'VT Subtitle Generator' },
  { href: `${WEBSITE}/armm`, label: 'Agent Reliability Maturity Model' },
];

const ChevronDown = ({ open }) => (
  <svg
    className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);
  const [isMobileAboutOpen, setIsMobileAboutOpen] = useState(false);
  const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false);

  const headerRef = useRef(null);
  const aboutRef = useRef(null);
  const solutionsRef = useRef(null);

  // Set --hdr CSS variable so main content can offset correctly
  const syncHdr = useCallback(() => {
    const h = headerRef.current?.offsetHeight || 0;
    document.documentElement.style.setProperty('--hdr', h + 'px');
  }, []);

  useEffect(() => {
    syncHdr();
    window.addEventListener('resize', syncHdr);
    return () => window.removeEventListener('resize', syncHdr);
  }, [syncHdr]);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (aboutRef.current && !aboutRef.current.contains(e.target)) setIsAboutOpen(false);
      if (solutionsRef.current && !solutionsRef.current.contains(e.target)) setIsSolutionsOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header
      ref={headerRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-tortoise ease-tortoise ${
        isScrolled ? 'bg-white shadow-md' : 'bg-white/95 backdrop-blur-sm'
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4" aria-label="Main navigation">
        <div className="flex items-center justify-between">

          {/* Logo */}
          <a href={WEBSITE} className="flex items-center space-x-2 group">
            <img src="/images/logo.png" alt="TortoiseAI Logo" className="h-8 w-auto" />
            <div className="flex flex-col">
              <span className="text-xl font-bold text-secondary leading-tight">TortoiseAI</span>
              <span className="text-xs text-secondary/60 leading-tight">Project Delivery Toolkit</span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <ul className="flex items-center space-x-8">

              <li>
                <a
                  href={WEBSITE}
                  className="text-secondary hover:text-primary transition-colors duration-tortoise font-medium"
                >
                  Home
                </a>
              </li>

              {/* About dropdown */}
              <li className="relative" ref={aboutRef}>
                <button
                  onMouseEnter={() => setIsAboutOpen(true)}
                  onMouseLeave={() => setIsAboutOpen(false)}
                  onClick={() => setIsAboutOpen((v) => !v)}
                  className="flex items-center space-x-1 text-secondary hover:text-primary transition-colors duration-tortoise font-medium"
                  aria-expanded={isAboutOpen}
                  aria-haspopup="true"
                >
                  <span>About</span>
                  <ChevronDown open={isAboutOpen} />
                </button>
                {isAboutOpen && (
                  <div
                    onMouseEnter={() => setIsAboutOpen(true)}
                    onMouseLeave={() => setIsAboutOpen(false)}
                    className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                  >
                    {aboutSubmenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-secondary hover:bg-primary/10 hover:text-primary transition-colors duration-tortoise"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>

              {/* Solutions dropdown */}
              <li className="relative" ref={solutionsRef}>
                <button
                  onMouseEnter={() => setIsSolutionsOpen(true)}
                  onMouseLeave={() => setIsSolutionsOpen(false)}
                  onClick={() => setIsSolutionsOpen((v) => !v)}
                  className="flex items-center space-x-1 text-secondary hover:text-primary transition-colors duration-tortoise font-medium"
                  aria-expanded={isSolutionsOpen}
                  aria-haspopup="true"
                >
                  <span>Solutions</span>
                  <ChevronDown open={isSolutionsOpen} />
                </button>
                {isSolutionsOpen && (
                  <div
                    onMouseEnter={() => setIsSolutionsOpen(true)}
                    onMouseLeave={() => setIsSolutionsOpen(false)}
                    className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50"
                  >
                    {solutionsSubmenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2 text-secondary hover:bg-primary/10 hover:text-primary transition-colors duration-tortoise"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>

            </ul>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsMobileMenuOpen((v) => !v)}
            className="md:hidden p-2 text-secondary hover:text-primary transition-colors duration-tortoise"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen
                ? <path d="M6 18L18 6M6 6l12 12" />
                : <path d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden overflow-hidden">
            <ul className="pt-4 pb-2 space-y-2">

              <li>
                <a
                  href={WEBSITE}
                  className="block py-2 px-4 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-tortoise font-medium"
                >
                  Home
                </a>
              </li>

              {/* Mobile About */}
              <li>
                <button
                  onClick={() => setIsMobileAboutOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-2 px-4 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-tortoise font-medium"
                >
                  <span>About</span>
                  <ChevronDown open={isMobileAboutOpen} />
                </button>
                {isMobileAboutOpen && (
                  <div className="pl-4 pt-2 space-y-2">
                    {aboutSubmenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block py-2 px-4 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-tortoise"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>

              {/* Mobile Solutions */}
              <li>
                <button
                  onClick={() => setIsMobileSolutionsOpen((v) => !v)}
                  className="w-full flex items-center justify-between py-2 px-4 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-tortoise font-medium"
                >
                  <span>Solutions</span>
                  <ChevronDown open={isMobileSolutionsOpen} />
                </button>
                {isMobileSolutionsOpen && (
                  <div className="pl-4 pt-2 space-y-2">
                    {solutionsSubmenu.map((item) => (
                      <a
                        key={item.href}
                        href={item.href}
                        className="block py-2 px-4 rounded-lg text-secondary hover:bg-primary/10 hover:text-primary transition-all duration-tortoise"
                      >
                        {item.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>

            </ul>
          </div>
        )}
      </nav>
    </header>
  );
}
