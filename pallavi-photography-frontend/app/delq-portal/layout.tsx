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
  
  if (!session?.user || (userRole !== "admin" && userRole !== "super_admin" && userRole !== "client")) {
    redirect("/");
  }

  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;

  let settings: SidebarSettings = {
    galleries: false,
    bookings: true,
    pricing: false,
    faqs: false,
    contact: false,
    blogs: false,
    enquiries: true,
    users: false,
    analytics: true
  };

  if (userRole === "admin" && token) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/admin/settings`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        next: { revalidate: 0 }
      });
      if (response.ok) {
        settings = await response.json();
      }
    } catch (e) {
      console.error("Failed to fetch sidebar settings in layout", e);
    }
  }

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
              <span className="block text-[8px] tracking-[0.4em] text-stone-400 uppercase font-sans -mt-0.5">
                {isSuperAdmin ? "Super Admin Console" : isAdmin ? "Admin Console" : "Photographer Hub"}
              </span>
            </Link>
          </div>

          <nav className="flex flex-col space-y-2 text-xs uppercase tracking-widest font-light">
            <Link
              href="/delq-portal"
              className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
            >
              Overview
            </Link>
            
            {/* Super Admin Control Page */}
            {isSuperAdmin && (
              <Link
                href="/delq-portal/super-admin"
                className="px-4 py-3 rounded-sm text-[#C4A484] border border-[#C4A484]/35 bg-[#C4A484]/5 font-medium transition-all hover:bg-[#C4A484]/10"
              >
                Super Admin Panel
              </Link>
            )}

            {/* Galleries & Clients */}
            {(isSuperAdmin || (isAdmin && settings.galleries) || userRole === "client") && (
              <Link
                href="/delq-portal/galleries"
                className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
              >
                Galleries & Clients
              </Link>
            )}

            {isAdmin && (
              <>
                {/* Booking Requests */}
                {(isSuperAdmin || settings.bookings) && (
                  <Link
                    href="/delq-portal/bookings"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Booking Requests
                  </Link>
                )}

                {/* Manage Pricing */}
                {(isSuperAdmin || settings.pricing) && (
                  <Link
                    href="/delq-portal/pricing"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Manage Pricing
                  </Link>
                )}

                {/* Manage FAQs */}
                {(isSuperAdmin || settings.faqs) && (
                  <Link
                    href="/delq-portal/faqs"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Manage FAQs
                  </Link>
                )}

                {/* Manage Contact */}
                {(isSuperAdmin || settings.contact) && (
                  <Link
                    href="/delq-portal/contact"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Manage Contact
                  </Link>
                )}

                {/* Blog Journal */}
                {(isSuperAdmin || settings.blogs) && (
                  <Link
                    href="/delq-portal/blogs"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Blog Journal
                  </Link>
                )}

                {/* Enquiries Log */}
                {(isSuperAdmin || settings.enquiries) && (
                  <Link
                    href="/delq-portal/enquiries"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Enquiries Log
                  </Link>
                )}

                {/* Users & Roles */}
                {(isSuperAdmin || settings.users) && (
                  <Link
                    href="/delq-portal/users"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Users & Roles
                  </Link>
                )}

                {/* Analytics */}
                {(isSuperAdmin || settings.analytics) && (
                  <Link
                    href="/delq-portal/analytics"
                    className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                  >
                    Analytics
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-stone-800 text-[10px] text-stone-500 flex flex-col gap-3">
          <Link href="/" className="hover:text-white transition-colors">
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
              className="text-stone-500 hover:text-red-400 transition-colors text-[10px] uppercase tracking-wider font-light flex items-center gap-1.5 w-full text-left"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-3.5 h-3.5"
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
          <p>© {new Date().getFullYear()} Pallavi Photography</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-10 overflow-y-auto max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
}
