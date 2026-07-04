import { ReactNode } from "react";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

interface SidebarSettings {
  galleries: boolean;
  bookings: boolean;
  pricing: boolean;
  faqs: boolean;
  contact: boolean;
  blogs: boolean;
  enquiries: boolean;
  users: boolean;
  analytics: boolean;
}

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  const token = (session as any)?.accessToken;
  const hasSessionError = (session as any)?.error === "RefreshAccessTokenError";
  
  if (!session?.user || hasSessionError || (userRole !== "admin" && userRole !== "super_admin" && userRole !== "client")) {
    redirect("/login");
  }

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;
  const permissions: string[] = (session?.user as any)?.permissions || [];

  const settings: SidebarSettings = {
    galleries: isSuperAdmin || permissions.includes("galleries") || userRole === "client",
    bookings: isSuperAdmin || permissions.includes("bookings"),
    pricing: isSuperAdmin || permissions.includes("pricing"),
    faqs: isSuperAdmin || permissions.includes("faqs"),
    contact: isSuperAdmin || permissions.includes("contact"),
    blogs: isSuperAdmin || permissions.includes("blogs"),
    enquiries: isSuperAdmin || permissions.includes("enquiries"),
    users: isSuperAdmin || permissions.includes("users"),
    analytics: isSuperAdmin || permissions.includes("analytics")
  };

  return (
    <div className="min-h-screen flex bg-[#FCFAF7]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2C2623] text-stone-200 flex flex-col justify-between p-6 border-r border-[#DCD0C0]/15 select-none shrink-0">
        <div className="space-y-8">
          <div>
            <Link href="/" className="block group">
              <h1 className="text-xl font-light tracking-[0.25em] text-white uppercase font-serif group-hover:text-[#C4A484] transition-colors">
                PALLAVI
              </h1>
              <span className="block text-[8px] tracking-[0.4em] text-[#C4A484] uppercase font-sans -mt-0.5">
                {isSuperAdmin ? "Super Admin Console" : isAdmin ? "Admin Console" : "Photographer Hub"}
              </span>
            </Link>
          </div>

          <nav className="flex flex-col space-y-1.5 text-[10px] uppercase tracking-[0.2em] font-medium text-stone-300">
            <Link
              href="/delq-portal"
              className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
            >
              Overview
            </Link>
            
            {/* Super Admin Control Page */}
            {isSuperAdmin && (
              <Link
                href="/delq-portal/super-admin"
                className="px-4 py-2.5 rounded-sm text-[#C4A484] border border-[#C4A484]/35 bg-[#C4A484]/5 font-semibold transition-all hover:bg-[#C4A484]/15"
              >
                Super Admin Panel
              </Link>
            )}

            {/* Portfolio Gallery */}
            {(isSuperAdmin || (isAdmin && settings.galleries)) && (
              <Link
                href="/delq-portal/portfolio"
                className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
              >
                Portfolio Gallery
              </Link>
            )}

            {/* Client Galleries */}
            {(isSuperAdmin || (isAdmin && settings.galleries) || userRole === "client") && (
              <Link
                href="/delq-portal/galleries"
                className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
              >
                Client Galleries
              </Link>
            )}

            {isAdmin && (
              <>
                {/* Booking Requests */}
                {(isSuperAdmin || settings.bookings) && (
                  <Link
                    href="/delq-portal/bookings"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Booking Requests
                  </Link>
                )}

                {/* Manage Pricing */}
                {(isSuperAdmin || settings.pricing) && (
                  <Link
                    href="/delq-portal/pricing"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Manage Pricing
                  </Link>
                )}

                {/* Manage FAQs */}
                {(isSuperAdmin || settings.faqs) && (
                  <Link
                    href="/delq-portal/faqs"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Manage FAQs
                  </Link>
                )}

                {/* Manage Contact */}
                {(isSuperAdmin || settings.contact) && (
                  <Link
                    href="/delq-portal/contact"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Manage Contact
                  </Link>
                )}

                {/* Blog Journal */}
                {(isSuperAdmin || settings.blogs) && (
                  <Link
                    href="/delq-portal/blogs"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Blog Journal
                  </Link>
                )}

                {/* Enquiries Log */}
                {(isSuperAdmin || settings.enquiries) && (
                  <Link
                    href="/delq-portal/enquiries"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Enquiries Log
                  </Link>
                )}

                {/* Users & Roles */}
                {(isSuperAdmin || settings.users) && (
                  <Link
                    href="/delq-portal/users"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Users & Roles
                  </Link>
                )}

                {/* Analytics */}
                {(isSuperAdmin || settings.analytics) && (
                  <Link
                    href="/delq-portal/analytics"
                    className="px-4 py-2.5 rounded-sm hover:bg-stone-800 hover:text-white transition-all duration-200"
                  >
                    Analytics
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-stone-800 flex flex-col gap-4">
          <Link 
            href="/" 
            className="text-[10px] text-stone-400 hover:text-[#C4A484] uppercase tracking-widest font-light transition-colors duration-200"
            aria-label="Back to Public Website"
          >
            ← Back to Public Site
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-950/20 text-red-300 hover:bg-red-900/30 hover:text-red-200 border border-red-900/35 hover:border-red-500/30 rounded-sm text-xs uppercase tracking-widest font-semibold transition-all duration-300 shadow-sm cursor-pointer"
              aria-label="Log Out of Admin Panel"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.0}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Log Out
            </button>
          </form>
          <p className="text-[9px] text-stone-600 font-light select-none">
            © {new Date().getFullYear()} Pallavi Photography Switzerland
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
