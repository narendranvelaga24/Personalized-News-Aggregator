"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { feedApi, Article } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Search, AlertCircle } from "lucide-react";
import { Suspense } from "react";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const [query, setQuery] = useState(q);
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState("");
  const eagerImageIndex = articles.findIndex((a) => {
    const src = a.imageUrl?.trim();
    return !!src && src.toLowerCase() !== "none";
  });

  const doSearch = useCallback((term: string) => {
    if (!term.trim()) { setArticles([]); return; }
    setFetching(true);
    setError("");
    feedApi.search(term)
      .then((r) => setArticles(r.articles))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(`/search${query ? `?q=${encodeURIComponent(query)}` : ""}`, { scroll: false });
      doSearch(query);
    }, 400);
    return () => clearTimeout(t);
  }, [query, doSearch, router]);

  return (
    <div>
      <div className="mb-8 reveal rounded-3xl border border-black/15 bg-white/75 backdrop-blur px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.16)]">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-black">Search</h1>
              <p className="text-sm text-black/60">Find articles by keyword, source, or topic</p>
            </div>
          </div>
          <span className="inline-flex h-6 items-center rounded-full bg-white border border-black/15 px-3 text-xs text-black/60">
            Discovery mode
          </span>
        </div>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-black/45" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, topics, sources…"
          className="w-full rounded-2xl border border-black/20 bg-white px-10 py-3 text-base text-black placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-black/20"
          autoFocus
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fetching
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => <ArticleCard key={`${a.id}-${i}`} article={a} eagerImage={i === eagerImageIndex} />)}
      </div>

      {!fetching && query && articles.length === 0 && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center text-black/65 space-y-3">
          <Search className="w-8 h-8 mx-auto mb-3 text-black/45" />
          <p className="font-display text-2xl text-black">No results for &quot;{query}&quot;</p>
          <p className="text-sm mt-1">Try different keywords or check spelling</p>
        </div>
      )}

      {!query && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center text-black/55">
          <p className="text-sm">Type something to search across all articles</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-black/55 text-sm">Loading search…</div>}>
      <SearchContent />
    </Suspense>
  );
}
