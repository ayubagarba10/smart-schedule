import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { NavSidebar } from "@/components/NavSidebar";
import { RoleProvider } from "@/lib/context/RoleContext";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Schedule",
  description: "Employee shift scheduling for recreation centers",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.className} bg-gray-50 antialiased`}>
        <RoleProvider>
          <div className="flex min-h-screen">
            <NavSidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
          <Toaster richColors position="top-right" />
        </RoleProvider>
      </body>
    </html>
  );
}
