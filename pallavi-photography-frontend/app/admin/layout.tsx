import { ReactNode } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const userRole = (session?.user as any)?.role;
  
  if (!session?.user || (userRole !== "admin" && userRole !== "client")) {
    redirect("/");
  }

  const isAdmin = userRole === "admin";

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
                {isAdmin ? "Admin Console" : "Photographer Hub"}
              </span>
            </Link>
          </div>

          <nav className="flex flex-col space-y-2 text-xs uppercase tracking-widest font-light">
            <Link
              href="/admin"
              className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
            >
              Overview
            </Link>
            
            <Link
              href="/admin/galleries"
              className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
            >
              Galleries & Clients
            </Link>

            {isAdmin && (
              <>
                <Link
                  href="/admin/bookings"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Booking Requests
                </Link>
                <Link
                  href="/admin/pricing"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Manage Pricing
                </Link>
                <Link
                  href="/admin/faqs"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Manage FAQs
                </Link>
                <Link
                  href="/admin/contact"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Manage Contact
                </Link>
                <Link
                  href="/admin/blogs"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Blog Journal
                </Link>
                <Link
                  href="/admin/enquiries"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Enquiries Log
                </Link>
                <Link
                  href="/admin/users"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Users & Roles
                </Link>
                <Link
                  href="/admin/analytics"
                  className="px-4 py-3 rounded-sm hover:bg-[#FAF8F5]/5 hover:text-[#C4A484] transition-all"
                >
                  Analytics
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-stone-800 text-[10px] text-stone-500 flex flex-col gap-2">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Public Site
          </Link>
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
