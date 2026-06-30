// app/admin/layout.tsx

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();

  if (!session?.user || (session.user as { role?: string }).role !== "admin") {
    redirect("/");
  }

  return <>{children}</>;
}
