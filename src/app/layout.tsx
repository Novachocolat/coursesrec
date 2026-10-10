import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const serif = Source_Serif_4({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CoursesRec",
  description: "Enregistre un cours ou une réunion, obtiens des notes structurées.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-4">
            <Link href="/" className="font-serif text-lg font-semibold tracking-tight">
              CoursesRec
            </Link>
            <Link
              href="/new"
              className="rounded-full bg-foreground px-4 py-1.5 text-sm font-medium text-background transition-opacity hover:opacity-85"
            >
              Nouvelle session
            </Link>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</main>
        <footer className="border-t border-line">
          <p className="mx-auto w-full max-w-3xl px-4 py-4 text-xs text-muted">
            CoursesRec v{process.env.NEXT_PUBLIC_APP_VERSION}
          </p>
        </footer>
      </body>
    </html>
  );
}
