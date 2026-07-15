"use client";

import React from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BreadcrumbsBanner from "@/components/common/BreadcrumbsBanner";
import { useTranslation } from "@/components/LanguageProvider";

export default function PrivacyPolicyPage() {
  const { t, lang } = useTranslation("privacy");

  const renderBullet = (bulletKey: string, fallback: string) => {
    const text = t(bulletKey, fallback);
    const colonIdx = text.indexOf(":");
    if (colonIdx !== -1) {
      const boldPart = text.substring(0, colonIdx + 1);
      const regularPart = text.substring(colonIdx + 1);
      return (
        <li>
          <strong className="font-medium text-stone-700">{boldPart}</strong>
          {regularPart}
        </li>
      );
    }
    return <li>{text}</li>;
  };

  return (
    <>
      <Header />

      {/* Standardized Breadcrumbs Banner */}
      <BreadcrumbsBanner
        title={t("title", "Privacy Policy")}
        paths={[
          { label: lang === "FR" ? "Accueil" : "Home", href: "/" },
          { label: t("title", "Privacy Policy") }
        ]}
      />

      <main className="min-h-screen bg-[#FCFAF7] pt-12 pb-24">
        <div className="max-w-3xl mx-auto px-6 md:px-8 text-left text-[#2C2623] font-sans font-light text-sm leading-relaxed space-y-8">
          <h2 className="text-xl md:text-2xl tracking-[0.2em] font-serif uppercase font-light text-center border-b border-stone-200 pb-6 mb-8">
            {t("title", "PRIVACY POLICY")}
          </h2>

          {/* Section 1 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec1Title", "1. INTRODUCTION")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec1Text", "At Pallavi Photography, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.")}
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec2Title", "2. INFORMATION WE COLLECT")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec2Text", "We may collect information about you in a variety of ways. The information we may collect on the Site includes:")}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              {renderBullet("sec2Bullet1", "Name and Email Address: When you request a quote or booking, we collect your name and email address.")}
              {renderBullet("sec2Bullet2", "Phone Number: For booking inquiries and consultations.")}
              {renderBullet("sec2Bullet3", "Session Details: Information about your photography session preferences, dates, and location.")}
              {renderBullet("sec2Bullet4", "Payment Information: When you make a purchase, we collect payment details through our secure payment processor (we do not store credit card information directly).")}
              {renderBullet("sec2Bullet5", "Website Usage Data: We may collect information about how you interact with our website, including pages visited, time spent, and links clicked.")}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec3Title", "3. HOW WE USE YOUR INFORMATION")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec3Text", "We use the information we collect for the following purposes:")}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              <li>{t("sec3Bullet1", "To fulfill your booking requests and provide photography services")}</li>
              <li>{t("sec3Bullet2", "To send you booking confirmations and updates")}</li>
              <li>{t("sec3Bullet3", "To communicate with you about your session")}</li>
              <li>{t("sec3Bullet4", "To process payments")}</li>
              <li>{t("sec3Bullet5", "To improve our website and services")}</li>
              <li>{t("sec3Bullet6", "To send you promotional emails (only if you've opted in)")}</li>
              <li>{t("sec3Bullet7", "To comply with legal obligations")}</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec4Title", "4. SHARING YOUR INFORMATION")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec4Text", "We do not sell, trade, or rent your personal information to third parties. However, we may share your information with:")}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              <li>{t("sec4Bullet1", "Service providers who assist us in operating our website and conducting our business (e.g., payment processors, email service providers)")}</li>
              <li>{t("sec4Bullet2", "Legal authorities when required by law")}</li>
              <li>{t("sec4Bullet3", "With your consent, we may share session photos with third-party platforms (e.g., portfolio sites, social media) for promotional purposes")}</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec5Title", "5. SECURITY OF YOUR INFORMATION")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec5Text", "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, please note that no method of transmission over the Internet or electronic storage is completely secure.")}
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec6Title", "6. COOKIES AND TRACKING TECHNOLOGIES")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec6Text", "Our website may use cookies and similar tracking technologies to enhance your browsing experience. You can control cookie settings through your browser preferences. We use cookies to:")}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              <li>{t("sec6Bullet1", "Remember your preferences")}</li>
              <li>{t("sec6Bullet2", "Understand how you use our site")}</li>
              <li>{t("sec6Bullet3", "Improve site functionality")}</li>
            </ul>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec7Title", "7. YOUR RIGHTS")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec7Text", "Depending on your location, you may have certain rights regarding your personal information, including:")}
            </p>
            <ul className="list-disc pl-5 space-y-2 text-stone-600">
              <li>{t("sec7Bullet1", "The right to access your personal data")}</li>
              <li>{t("sec7Bullet2", "The right to request deletion of your data")}</li>
              <li>{t("sec7Bullet3", "The right to opt-out of marketing communications")}</li>
              <li>{t("sec7Bullet4", "The right to data portability (in certain jurisdictions)")}</li>
            </ul>
            <p className="text-stone-600 text-justify">
              {t("sec7Contact", "To exercise these rights, please contact us at")} <a href="mailto:privacy@pallaviphoto.com" className="text-[#C4A484] hover:underline">privacy@pallaviphoto.com</a>.
            </p>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec8Title", "8. THIRD-PARTY LINKS")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec8Text", "Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review the privacy policies of any third-party sites before providing personal information.")}
            </p>
          </section>

          {/* Section 9 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec9Title", "9. CHILDREN'S PRIVACY")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec9Text", "Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will delete such information promptly.")}
            </p>
          </section>

          {/* Section 10 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec10Title", "10. CHANGES TO THIS PRIVACY POLICY")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec10Text", "We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by updating the \"Last Updated\" date on this page. Your continued use of the website following the posting of changes constitutes your acceptance of such changes.")}
            </p>
          </section>

          {/* Section 11 */}
          <section className="space-y-3">
            <h3 className="font-semibold text-stone-800 tracking-wide uppercase text-xs">
              {t("sec11Title", "11. CONTACT US")}
            </h3>
            <p className="text-stone-600 text-justify">
              {t("sec11Text", "If you have any questions about this Privacy Policy or our privacy practices, please contact us at:")}
            </p>
            <div className="bg-stone-50 border border-stone-200/50 p-5 rounded-xs space-y-1.5 text-stone-600 text-xs">
              <p className="font-medium text-stone-800">Pallavi Photography</p>
              <p>Email: <a href="mailto:pallaviphoto@example.com" className="text-[#C4A484] hover:underline">pallaviphoto@example.com</a></p>
              <p>Phone: +41 21 123 45 67</p>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
