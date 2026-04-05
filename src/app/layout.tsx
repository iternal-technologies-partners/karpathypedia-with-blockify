import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { getAllArticles, getCategories } from "@/lib/wiki";
import { getIdeaBlockStats } from "@/lib/ideablocks";

export const metadata: Metadata = {
  title: "Karpathypedia",
  description: "Blockify Powered Knowledge Base with Blockify IdeaBlocks",
  icons: {
    icon: [
      { url: "https://edu.iternal.ai/favicon.ico" },
      {
        url: "https://edu.iternal.ai/static/images/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
      },
      {
        url: "https://edu.iternal.ai/static/images/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "https://edu.iternal.ai/static/images/apple-touch-icon.png",
        sizes: "180x180",
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch sidebar data — gracefully handle missing data
  let stats = { articles: 0, ideablocks: 0, categories: 0 };
  let categories: { name: string; slug: string; articleCount: number }[] = [];

  try {
    const [articles, cats, blockStats] = await Promise.all([
      getAllArticles(),
      getCategories(),
      getIdeaBlockStats(),
    ]);

    stats = {
      articles: articles.length,
      ideablocks: blockStats.total,
      categories: cats.length,
    };

    categories = cats.map((c) => ({
      name: c.name,
      slug: c.slug,
      articleCount: c.articleCount,
    }));
  } catch {
    // Data layer not ready yet — continue with empty defaults
  }

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Header />
        <div className="flex flex-1 mx-auto w-full max-w-7xl px-4">
          {/* Sidebar — hidden on mobile, visible on md+ */}
          <aside className="hidden md:block w-64 shrink-0 pt-4 pr-4 border-r border-wiki-border">
            <Sidebar stats={stats} categories={categories} />
          </aside>
          {/* Main content area */}
          <main className="flex-1 min-w-0 max-w-4xl py-4 px-0 md:px-6">
            {children}
          </main>
        </div>
        <Footer />
      </body>
    </html>
  );
}
