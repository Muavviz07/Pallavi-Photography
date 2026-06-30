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
  { name: "About Me", href: "/about" },
  { name: "Recognitions & Awards", href: "/about?section=awards" }
];

const PRICING_ITEMS = [
  { name: "NewBorn", href: "/pricing/newborn" },
  { name: "Children", href: "/pricing/children" },
  { name: "Family", href: "/pricing/family" },
  { name: "Maternity", href: "/pricing/maternity" },
  { name: "Fine Art", href: "/pricing/fine-art" },
  { name: "Nature Photostock", href: "/pricing/nature" },
  { name: "FAQs", href: "/pricing/faqs" }
];

const GALLERY_ITEMS = [
  { name: "NewBorn", href: "/our-gallery/newborn" },
  { name: "Children", href: "/our-gallery/children" },
  { name: "Family", href: "/our-gallery/family" },
  { name: "Maternity", href: "/our-gallery/maternity" },
  { name: "Fine Art", href: "/our-gallery/fine-art" },
  { name: "Nature", href: "/our-gallery/nature" }
];

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
  }, []);

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "FR" : "EN";
    setLanguage(nextLang);
    localStorage.setItem("lang", nextLang);
    window.dispatchEvent(new Event("languagechange"));
  };

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
      <header className="sticky top-0 left-0 right-0 z-40 bg-white border-b border-brand-border pt-2 pb-0.5 shadow-xs select-none">
        <div className="max-w-[1450px] mx-auto px-6 md:px-10 grid grid-cols-2 lg:grid-cols-3 items-center">
          
          {/* Left Column: Logo */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center animate-fade-in">
              <img
                src="/Pallavi-Logo-V1.webp"
                alt="Pallavi Photography Logo"
                className="h-28 w-auto object-contain brightness-0"
              />
            </Link>
          </div>

          {/* Center Column: Navigation Menu */}
          <div className="hidden lg:flex justify-center">
            <nav className="flex items-center space-x-9 xl:space-x-13 text-[10px] font-medium tracking-[0.25em] text-brand-dark whitespace-nowrap">
              <Link
                href="/"
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 ${
                  pathname === "/" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                HOME
              </Link>

              {/* ABOUT Dropdown */}
              <div
                className="relative py-2 group"
                onMouseEnter={() => setActiveDropdown("about")}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button className="flex items-center space-x-1 hover:text-brand-dark cursor-pointer transition-colors duration-200 uppercase text-brand-muted pb-2 border-b-2 border-transparent">
                  <span>ABOUT</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === "about" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[200px] z-50">
                    <div className="w-max bg-white border border-brand-border shadow-md py-4 px-2 text-left animate-fade-in rounded-xs">
                      {ABOUT_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2 text-[10px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150"
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
                  <span>PRICING</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === "pricing" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[200px] z-50">
                    <div className="w-max bg-white border border-brand-border shadow-md py-4 px-2 text-left animate-fade-in rounded-xs">
                      {PRICING_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2.5 text-[10px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150"
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
                <button className="flex items-center space-x-1 hover:text-brand-dark cursor-pointer transition-colors duration-200 uppercase text-brand-muted pb-2 border-b-2 border-transparent">
                  <span>OUR GALLERY</span>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                {activeDropdown === "gallery" && (
                  <div className="absolute left-0 top-full pt-3 min-w-[200px] z-50">
                    <div className="w-max bg-white border border-brand-border shadow-md py-4 px-2 text-left animate-fade-in rounded-xs">
                      {GALLERY_ITEMS.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block px-4 py-2.5 text-[10px] tracking-wider font-serif italic text-brand-dark hover:text-brand-sage hover:bg-brand-bg transition-colors duration-150"
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
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 ${
                  pathname === "/client-portal" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                CLIENT GALLERY
              </Link>

              <Link
                href="/our-blogs"
                className={`hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 ${
                  pathname === "/our-blogs" ? "border-brand-dark text-brand-dark font-semibold" : "border-transparent text-brand-muted"
                }`}
              >
                BLOGS
              </Link>

              <Link
                href="/#contact"
                className="hover:text-brand-dark transition-all duration-200 uppercase pb-2 border-b-2 border-transparent text-brand-muted"
              >
                CONTACT
              </Link>
            </nav>
          </div>

          {/* Right Column: INFO Trigger Menu */}
          <div className="flex justify-end">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="hidden lg:flex items-center space-x-3 text-brand-muted hover:text-brand-dark transition-colors duration-250 cursor-pointer pb-2 border-b-2 border-transparent text-[10px] uppercase tracking-[0.25em]"
            >
              <span className="font-semibold">INFO</span>
              <div className="flex flex-col space-y-[4.5px]">
                <div className="w-7 h-[1.5px] bg-current"></div>
                <div className="w-7 h-[1.5px] bg-current"></div>
              </div>
            </button>

            {/* Mobile Menu & Sidebar Buttons */}
            <div className="flex items-center space-x-3 lg:hidden z-50">
              <button
                onClick={toggleLanguage}
                className="text-xs text-brand-dark hover:text-brand-sage px-2 py-1"
              >
                {language}
              </button>
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-brand-dark hover:text-brand-sage p-2"
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
              className="absolute top-6 right-6 text-white hover:text-brand-sage"
            >
              <X className="w-7 h-7" />
            </button>
            
            <div className="flex flex-col space-y-4 text-center font-serif text-xl tracking-wider">
              <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors">
                HOME
              </Link>
              
              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">ABOUT</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {ABOUT_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">PRICING</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {PRICING_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-brand-sage text-[10px] tracking-widest block uppercase font-sans font-semibold">OUR PORTFOLIO</span>
                <div className="flex flex-col space-y-2 text-sm font-sans tracking-wide">
                  {GALLERY_ITEMS.map((item) => (
                    <Link key={item.name} href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-coral">
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <Link href="/client-portal" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors">
                CLIENT GALLERY
              </Link>

              <Link href="/our-blogs" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors">
                BLOGS
              </Link>

              <Link href="/#contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-brand-sage transition-colors">
                CONTACT
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Info Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end transition-opacity duration-300">
          <div
            ref={sidebarRef}
            className="w-full max-w-[450px] h-full bg-[#3A3A3A] text-white p-8 md:p-12 relative flex flex-col justify-between overflow-y-auto z-50 animate-slide-in shadow-2xl"
          >
            {/* Top Close text & icon */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="flex items-center space-x-2 text-[10px] uppercase tracking-[0.25em] text-white/70 hover:text-white transition-colors cursor-pointer"
              >
                <span>CLOSE</span>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mid logo & content */}
            <div className="my-auto py-12 flex flex-col items-center text-center space-y-8">
              <img
                src="/Pallavi-Logo-V1.webp"
                alt="Pallavi Photography Logo"
                className="h-20 w-auto object-contain brightness-0 invert"
              />
              <p className="text-xs md:text-sm font-light leading-relaxed text-white/80 max-w-sm">
                I believe that photography is a gentle art. It is about documenting real, unscripted love, natural connections, and quiet moments. Based in Switzerland, I specialize in fine art newborn setups, maternity storytelling, and outdoor family collections using soft textures and natural illumination.
              </p>
              
              <div className="w-8 h-[1px] bg-white/20"></div>

              <div className="space-y-4">
                <span className="text-[10px] uppercase tracking-[0.25em] text-brand-sage block font-semibold">INSTAGRAM</span>
                <a
                  href="https://instagram.com/Pallavivishk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-serif italic text-white/90 hover:text-brand-sage transition-colors"
                >
                  @Pallavivishk
                </a>
              </div>
            </div>

            {/* Bottom follow us & WhatsApp */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="space-y-1.5 text-left">
                <span className="text-[9px] uppercase tracking-widest text-white/50 block font-light">FOLLOW US</span>
                <div className="flex space-x-3 text-white/80">
                  <a href="#" className="hover:text-brand-sage transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="https://instagram.com/Pallavivishk" target="_blank" rel="noopener noreferrer" className="hover:text-brand-sage transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                </div>
              </div>

              {/* Sidebar bottom WhatsApp */}
              <a
                href="https://wa.me/41789077644"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white hover:scale-105 hover:bg-green-600 transition-all duration-300"
                title="Chat on WhatsApp"
              >
                <MessageSquare className="w-5 h-5 fill-white text-green-500" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
