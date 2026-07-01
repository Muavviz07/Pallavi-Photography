"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User, Globe, MessageSquare, Search } from "lucide-react";
import { translations, Language } from "@/lib/translations";

const Instagram = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const Facebook = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const ABOUT_ITEMS = [
  { name: "About Me", href: "/about-me" },
  { name: "Recognitions & Awards", href: "/about-me?section=awards" }
];

const PRICING_ITEMS = [
  { name: "NewBorn", href: "/newborn" },
  { name: "Children", href: "/children" },
  { name: "Family", href: "/family" },
  { name: "Maternity", href: "/maternity" },
  { name: "Fine Art", href: "/fine-art" },
  { name: "Nature Photostock", href: "/nature" },
  { name: "FAQs", href: "/faqs" }
];

const GALLERY_ITEMS = [
  { name: "NewBorn", href: "/our-gallery/newborn" },
  { name: "Children", href: "/our-gallery/children" },
  { name: "Family", href: "/our-gallery/family" },
  { name: "Maternity", href: "/our-gallery/maternity" },
  { name: "Fine Art", href: "/our-gallery/fine-art" },
  { name: "Nature", href: "/our-gallery/nature" }
];

const navTranslations: Record<string, Record<string, string>> = {
  EN: {
    home: "HOME",
    about: "ABOUT",
    aboutMe: "About Me",
    awards: "Recognitions & Awards",
    pricing: "PRICING",
    gallery: "OUR GALLERY",
    clientGallery: "CLIENT GALLERY",
    blogs: "BLOGS",
    contact: "CONTACT",
    info: "INFO",
    newborn: "NewBorn",
    children: "Children",
    family: "Family",
    maternity: "Maternity",
    fineArt: "Fine Art",
    nature: "Nature",
    naturePhotostock: "Nature Photostock",
    faqs: "FAQs"
  },
  FR: {
    home: "ACCUEIL",
    about: "À PROPOS",
    aboutMe: "À Propos de Moi",
    awards: "Distinctions & Prix",
    pricing: "TARIFS",
    gallery: "GALERIE",
    clientGallery: "GALERIE CLIENT",
    blogs: "BLOGS",
    contact: "CONTACT",
    info: "INFO",
    newborn: "Nouveau-Né",
    children: "Enfants",
    family: "Famille",
    maternity: "Maternité",
    fineArt: "Fine Art",
    nature: "Nature",
    naturePhotostock: "Photostock Nature",
    faqs: "FAQ"
  }
};

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [language, setLanguage] = useState("EN");
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem("lang") || "EN";
    setLanguage(storedLang);

    const handleLangChange = () => {
      setLanguage(localStorage.getItem("lang") || "EN");
    };

    window.addEventListener("languagechange", handleLangChange);
    return () => window.removeEventListener("languagechange", handleLangChange);
  }, []);

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "FR" : "EN";
    setLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
    window.dispatchEvent(new Event("languagechange"));
  };

  const t = navTranslations[language] || navTranslations.EN;

  const ABOUT_ITEMS = [
    { name: t.aboutMe, href: "/about-me" },
    { name: t.awards, href: "/about-me?section=awards" }
  ];

  const PRICING_ITEMS = [
    { name: t.newborn, href: "/newborn" },
    { name: t.children, href: "/children" },
    { name: t.family, href: "/family" },
    { name: t.maternity, href: "/maternity" },
    { name: t.fineArt, href: "/fine-art" },
    { name: t.naturePhotostock, href: "/nature" },
    { name: t.faqs, href: "/faqs" }
  ];

  const GALLERY_ITEMS = [
    { name: t.newborn, href: "/our-gallery/newborn" },
    { name: t.children, href: "/our-gallery/children" },
    { name: t.family, href: "/our-gallery/family" },
    { name: t.maternity, href: "/our-gallery/maternity" },
    { name: t.fineArt, href: "/our-gallery/fine-art" },
    { name: t.nature, href: "/our-gallery/nature" }
  ];

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveDropdown(null);
  }, [pathname]);

  // Close sidebar on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
    }
    if (isSidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const { data: session } = useSession();

  return (
    <>
      <header className="relative z-40 bg-white border-b border-brand-border pt-2 pb-0.5 shadow-xs select-none">
        <div className="max-w-[1450px] mx-auto px-6 md:px-10 flex items-center justify-between">
          
          {/* Left Column: Logo Container */}
          <div className="flex-1 flex justify-start">
            <Link href="/" className="flex items-center animate-fade-in cursor-pointer">
              <img
                src="/Pallavi-Logo-V1.webp"
                alt="Pallavi Photography Logo"
                className="h-28 w-auto object-contain"
              />
            </Link>
          </div>

          {/* Center Column: Navigation Menu (Centering layout with flex-1/flex-initial boundary) */}
          <div className="hidden lg:flex flex-shrink-0 justify-center">
            <nav className="flex items-center space-x-9 xl:space-x-13 text-[11px] font-medium tracking-[0.25em] text-brand-dark whitespace-nowrap">
              <Link
                href="/"
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 cursor-pointer ${
                  pathname === "/" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                {t.home}
              </Link>

              {/* ABOUT Dropdown */}
              <div
                className="relative py-2 group"
                onMouseEnter={() => setActiveDropdown("about")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/about-me"
                  className="flex items-center space-x-1 hover:text-brand-dark cursor-pointer transition-colors duration-200 uppercase text-brand-muted pb-2 border-b-2 border-transparent"
                >
                  <span>{t.about}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Link>
                {activeDropdown === "about" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[240px] z-50">
                    <div className="w-full bg-white border border-brand-border shadow-md py-5 px-6 text-left animate-fade-in rounded-xs space-y-1.5">
                      {ABOUT_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-3 py-1.5 text-[11px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150 rounded-sm cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRICING Dropdown */}
              <div
                className="relative py-2 group"
                onMouseEnter={() => setActiveDropdown("pricing")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 hover:text-brand-dark cursor-pointer transition-colors duration-200 uppercase text-brand-muted pb-2 border-b-2 border-transparent">
                  <span>{t.pricing}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === "pricing" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[240px] z-50">
                    <div className="w-full bg-white border border-brand-border shadow-md py-5 px-6 text-left animate-fade-in rounded-xs space-y-1.5">
                      {PRICING_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-3 py-1.5 text-[11px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150 rounded-sm cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* OUR GALLERY Dropdown */}
              <div
                className="relative py-2 group"
                onMouseEnter={() => setActiveDropdown("gallery")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href="/our-gallery"
                  className="flex items-center space-x-1 hover:text-brand-dark cursor-pointer transition-colors duration-200 uppercase text-brand-muted pb-2 border-b-2 border-transparent"
                >
                  <span>{t.gallery}</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </Link>
                {activeDropdown === "gallery" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[240px] z-50">
                    <div className="w-full bg-white border border-brand-border shadow-md py-5 px-6 text-left animate-fade-in rounded-xs space-y-1.5">
                      {GALLERY_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-3 py-1.5 text-[11px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150 rounded-sm cursor-pointer"
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/client-portal"
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 cursor-pointer ${
                  pathname === "/client-portal" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                {t.clientGallery}
              </Link>

              <Link
                href="/our-blogs"
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 cursor-pointer ${
                  pathname === "/our-blogs" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                {t.blogs}
              </Link>

              <Link
                href="/contact"
                className="hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 border-transparent text-brand-muted cursor-pointer"
              >
                {t.contact}
              </Link>
            </nav>
          </div>

          {/* Right Column: INFO Trigger Container */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex items-center space-x-3 text-brand-muted hover:text-brand-dark transition-colors duration-250 cursor-pointer pb-2 border-b-2 border-transparent text-[11px] uppercase tracking-[0.25em]"
            >
              <span className="font-semibold">{t.info}</span>
              <div className="flex flex-col space-y-[4.5px]">
                <div className="w-7 h-[1.5px] bg-current"></div>
                <div className="w-7 h-[1.5px] bg-current"></div>
              </div>
            </button>

            {/* Mobile Menu & Sidebar Buttons */}
            <div className="flex items-center space-x-3 lg:hidden z-50">
              <button
                onClick={toggleLanguage}
                className="text-xs text-brand-dark hover:text-brand-sage px-2 py-1 cursor-pointer"
              >
                {language}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-brand-dark hover:text-brand-sage p-2 cursor-pointer"
                aria-label="Toggle Mobile Menu"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Full-Screen Overlay */}
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-[#1A1A1A]/95 text-white flex flex-col justify-center px-8 py-16 space-y-6 animate-fade-in lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-6 right-6 text-white hover:text-brand-sage cursor-pointer"
            >
              <X className="w-7 h-7" />
            </button>
            
            <div className="flex flex-col space-y-4 text-center font-serif text-xl tracking-wider">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors cursor-pointer">
                {t.home}
              </Link>
              
              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">{t.about}</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {ABOUT_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral cursor-pointer">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">{t.pricing}</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {PRICING_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral cursor-pointer">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">{t.gallery}</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {GALLERY_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral cursor-pointer">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/client-portal" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors cursor-pointer">
                {t.clientGallery}
              </Link>

              <Link href="/our-blogs" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors cursor-pointer">
                {t.blogs}
              </Link>

              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors cursor-pointer">
                {t.contact}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Info Sidebar Overlay with smooth hardware slide transition */}
      <div 
        className={`fixed inset-0 z-50 bg-black/40 flex justify-end transition-opacity duration-500 ${
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          ref={sidebarRef}
          className={`w-full max-w-[450px] h-full bg-[#4D514A] text-white p-8 md:p-12 relative flex flex-col justify-between overflow-y-auto shadow-2xl transform transition-transform duration-500 ease-out ${
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Top Panel: Close trigger only */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:text-white transition-colors cursor-pointer"
            >
              <span>{t.close || "CLOSE"}</span>
              <X className="w-5 h-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Center Logo & Bio content */}
          <div className="my-auto py-10 flex flex-col items-center text-center space-y-6">
            <img
              src="/Pallavi-Logo-V1.webp"
              alt="Pallavi Photography Logo"
              className="h-36 w-auto object-contain mx-auto"
              style={{ filter: "invert(1) hue-rotate(180deg)" }}
            />
            <p className="text-xs md:text-sm font-light leading-relaxed text-white/80 max-w-sm mx-auto font-sans">
              {t.sidebarBio || "In the gentle rustle of leaves and the golden glow of light, nature whispers it’s timeless story..."}
            </p>
          </div>

          {/* Bottom Socials, Email & Privacy Link */}
          <div className="space-y-8 text-center pt-6 border-t border-white/10">
            {/* INSTAGRAM Header */}
            <div className="space-y-1">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/60 block font-semibold">INSTAGRAM</span>
              <a
                href="https://instagram.com/Pallavivishk"
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-serif italic text-white/90 hover:text-brand-sage transition-colors block cursor-pointer"
              >
                @ Pallavivishk
              </a>
            </div>

            {/* FOLLOW US Row */}
            <div className="space-y-3">
              <span className="text-[9px] uppercase tracking-[0.3em] text-white/60 block font-semibold">FOLLOW US</span>
              <div className="flex items-center justify-center space-x-4 text-white/80">
                <a href="#" className="hover:text-brand-sage transition-colors cursor-pointer">
                  <Facebook className="w-4 h-4" />
                </a>
                <span className="w-12 h-[1px] bg-white/20"></span>
                <a href="https://instagram.com/Pallavivishk" target="_blank" rel="noopener noreferrer" className="hover:text-brand-sage transition-colors cursor-pointer">
                  <Instagram className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Email link */}
            <div>
              <a
                href="mailto:Pallavi.Vishk@Gmail.Com"
                className="text-base font-serif italic text-white/95 hover:text-brand-sage transition-colors block cursor-pointer"
              >
                Pallavi.Vishk@Gmail.Com
              </a>
            </div>

            {/* Privacy Policy */}
            <div className="pt-2">
              <Link
                href="/privacy-policy"
                onClick={() => setIsSidebarOpen(false)}
                className="text-[11px] font-serif italic text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
