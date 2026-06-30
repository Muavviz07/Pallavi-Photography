"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User, Globe } from "lucide-react";

const CATEGORIES = [
  { name: "Newborn", slug: "newborn" },
  { name: "Maternity", slug: "maternity" },
  { name: "Family", slug: "family" },
  { name: "Fine Art", slug: "fine-art" },
  { name: "Nature", slug: "nature" },
];

export default function Header() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [language, setLanguage] = useState("EN"); // EN | DE

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [pathname]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "EN" ? "DE" : "EN"));
  };

  const isHome = pathname === "/";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "glassmorphism shadow-xs py-3"
          : isHome
          ? "bg-transparent py-5 text-white"
          : "bg-[#FCFAF7] border-b border-[#DCD0C0]/20 py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left Links (Desktop) */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-light uppercase tracking-widest">
          <Link
            href="/"
            className={`hover:text-[#C4A484] transition-colors duration-200 ${
              pathname === "/" ? "text-[#C4A484] font-medium" : ""
            }`}
          >
            Home
          </Link>
          
          {/* Portfolio Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              onMouseEnter={() => setIsDropdownOpen(true)}
              className="flex items-center space-x-1 hover:text-[#C4A484] cursor-pointer transition-colors duration-200 uppercase tracking-widest text-sm font-light"
            >
              <span>Portfolio</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {isDropdownOpen && (
              <div
                onMouseLeave={() => setIsDropdownOpen(false)}
                className="absolute left-0 mt-2 w-48 bg-[#FCFAF7] border border-[#DCD0C0]/30 shadow-md rounded-md py-2 text-left z-50 animate-fade-in"
              >
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/our-gallery/${cat.slug}`}
                    className="block px-4 py-2 text-xs uppercase tracking-wider text-[#2C2623] hover:bg-[#F5EFEB] hover:text-[#C4A484] transition-colors duration-155"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link
            href="/#about"
            className="hover:text-[#C4A484] transition-colors duration-200"
          >
            About
          </Link>
        </nav>

        {/* Center Logo */}
        <Link href="/" className="text-center group">
          <h1 className="text-xl md:text-2xl font-light tracking-[0.25em] uppercase font-serif transition-colors duration-300 group-hover:text-[#C4A484]">
            PALLAVI
          </h1>
          <span className={`block text-[8px] tracking-[0.4em] uppercase font-sans font-light -mt-1 ${
            isScrolled ? "text-[#6E635F]" : isHome ? "text-stone-300" : "text-[#6E635F]"
          }`}>
            Photography
          </span>
        </Link>

        {/* Right Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-6">
          <Link
            href="/#contact"
            className="text-xs uppercase tracking-wider border border-[#C4A484]/40 hover:border-[#C4A484] px-4 py-2 transition-all duration-300 text-sm font-light rounded-sm"
          >
            Get In Touch
          </Link>

          <Link
            href="/client-portal"
            className="hover:text-[#C4A484] transition-colors duration-200 flex items-center space-x-1"
            title="Client Portal"
          >
            <User className="w-4 h-4" />
            <span className="text-xs uppercase tracking-wider font-light">Portal</span>
          </Link>
          {/* Admin Dashboard Link */}
          {(() => {
            const { data: session } = useSession();
            if (session?.user?.role === "admin") {
              return (
                <Link
                  href="/admin"
                  className="hover:text-[#C4A484] transition-colors duration-200 flex items-center space-x-1"
                >
                  <span className="text-xs uppercase tracking-wider font-light">Admin</span>
                </Link>
              );
            }
            return null;
          })()}

          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-xs hover:text-[#C4A484] transition-colors cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="font-medium">{language}</span>
          </button>
        </div>

        {/* Mobile Menu Icon */}
        <div className="flex items-center space-x-4 md:hidden">
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1 text-xs hover:text-[#C4A484] transition-colors cursor-pointer"
          >
            <span className="font-medium">{language}</span>
          </button>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="hover:text-[#C4A484] transition-colors focus:outline-hidden"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#FCFAF7] border-b border-[#DCD0C0]/35 text-[#2C2623] py-6 px-6 space-y-4 animate-fade-in absolute top-[100%] left-0 right-0 shadow-lg">
          <div className="flex flex-col space-y-3 font-light uppercase tracking-wider text-sm">
            <Link
              href="/"
              className="py-1 border-b border-stone-100 hover:text-[#C4A484]"
            >
              Home
            </Link>
            
            <div className="py-1">
              <span className="text-stone-400 text-xs block mb-1">Portfolio</span>
              <div className="grid grid-cols-2 gap-2 pl-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/our-gallery/${cat.slug}`}
                    className="py-1 text-xs hover:text-[#C4A484]"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            </div>
            
            <Link
              href="/#about"
              className="py-1 border-b border-stone-100 hover:text-[#C4A484]"
            >
              About
            </Link>
            <Link
              href="/#contact"
              className="py-1 border-b border-stone-100 hover:text-[#C4A484]"
            >
              Contact
            </Link>
            <Link
              href="/client-portal"
              className="py-1 flex items-center space-x-2 text-[#C4A484]"
            >
              <User className="w-4 h-4" />
              <span>Client Portal</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
