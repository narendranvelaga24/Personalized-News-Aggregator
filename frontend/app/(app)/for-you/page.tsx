"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { feedApi, Article } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Sparkles, AlertCircle, RefreshCw, Compass } from "lucide-react";
import Link from "next/link";

function mergeUniqueById(existing: Article[], incoming: Article[]): Article[] {
  const map = new Map<string, Article>();
  for (const article of existing) map.set(article.id, article);
  for (const article of incoming) map.set(article.id, article);
  return Array.from(map.values());
}

export default function ForYouPage() {
  const { isAuthed, isLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const eagerImageIndex = articles.findIndex((a) => {
    const src = a.imageUrl?.trim();
    return !!src && src.toLowerCase() !== "none";
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) {
      router.replace("/latest");
      return;
    }
    feedApi.home(page)
      .then((r) => {
        setArticles((prev) => (page === 1 ? mergeUniqueById([], r.articles) : mergeUniqueById(prev, r.articles)));
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [isAuthed, isLoading, page, router]);

  const refreshForYou = () => {
    setFetching(true);
    setPage(1);
    feedApi.home(1, true)  // ← Now triggers backend to fetch fresh content
      .then((r) => setArticles(mergeUniqueById([], r.articles)))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  };

  return (
    <div>
      <div className="mb-8 reveal rounded-3xl border border-black/15 bg-white/75 backdrop-blur px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.16)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-black">For You</h1>
              <p className="text-sm text-black/60">A signal-ranked briefing tailored to your reading behavior</p>
            </div>
          </div>
          <button
            onClick={refreshForYou}
            disabled={fetching}
            className="btn-ghost border border-black/20 bg-white px-3.5 py-2 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2 text-xs text-black/60">
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-black text-white border border-black px-3">
            <Compass className="w-3.5 h-3.5" />
            Personalized route
          </span>
          <span className="inline-flex h-6 items-center rounded-full bg-white border border-black/15 px-3">
            {articles.length} ranked
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {!isAuthed && !isLoading && (
        <div className="glass rounded-3xl p-8 text-center space-y-4">
          <Sparkles className="w-10 h-10 text-black mx-auto" />
          <h2 className="font-display text-2xl text-black">Get your personalized feed</h2>
          <p className="text-black/65 text-sm">Sign in to see articles scored and ranked just for you.</p>
          <Link href="/login" className="btn-primary inline-block">Sign in</Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fetching
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => (
              <ArticleCard key={`${a.id}-${i}`} article={a} showScore eagerImage={i === eagerImageIndex} />
            ))}
      </div>

      {!fetching && !error && articles.length === 0 && isAuthed && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center space-y-3">
          <p className="font-display text-2xl text-black">No personalized stories yet</p>
          <p className="text-black/55 text-sm">Try refreshing after the next ingest cycle.</p>
        </div>
      )}

      {articles.length > 0 && !fetching && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => {
              setFetching(true);
              setPage((p) => p + 1);
            }}
            className="btn-ghost border border-black/20 bg-white px-6 py-2.5 text-sm"
          >
            Load more
          </button>
        </div>
      )}
      {fetching && articles.length > 0 && (
        <div className="flex justify-center mt-8 text-black/50 text-sm">Loading more…</div>
      )}
    </div>
  );
}
