"use client";

import { useEffect, useState } from "react";
import { feedApi, Article } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import { TrendingUp, AlertCircle, RefreshCw } from "lucide-react";

function mergeUniqueById(existing: Article[], incoming: Article[]): Article[] {
  const map = new Map<string, Article>();
  for (const article of existing) map.set(article.id, article);
  for (const article of incoming) map.set(article.id, article);
  return Array.from(map.values());
}

export default function TrendingPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const eagerImageIndex = articles.findIndex((a) => {
    const src = a.imageUrl?.trim();
    return !!src && src.toLowerCase() !== "none";
  });

  useEffect(() => {
    feedApi.trending(1)
      .then((r) => setArticles(mergeUniqueById([], r.articles)))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  const refreshTrending = () => {
    setFetching(true);
    setPage(1);
    feedApi.trending(1)
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
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-black">Trending</h1>
              <p className="text-sm text-black/60">The web&apos;s current velocity, ranked by collective engagement</p>
            </div>
          </div>
          <button
            onClick={refreshTrending}
            disabled={fetching}
            className="btn-ghost border border-black/20 bg-white px-3.5 py-2 text-xs sm:text-sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${fetching ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {fetching
          ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => <ArticleCard key={`${a.id}-${i}`} article={a} eagerImage={i === eagerImageIndex} />)}
      </div>

      {!fetching && !error && articles.length === 0 && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center space-y-3">
          <p className="font-display text-2xl text-black">No trending stories available</p>
          <p className="text-black/55 text-sm">Refresh once more or check again soon.</p>
        </div>
      )}

      {articles.length > 0 && !fetching && (
        <div className="flex justify-center mt-10">
          <button
            onClick={() => {
              const nextPage = page + 1;
              setFetching(true);
              setPage(nextPage);
              feedApi.trending(nextPage)
                .then((r) => setArticles((prev) => mergeUniqueById(prev, r.articles)))
                .catch((e) => setError(e.message))
                .finally(() => setFetching(false));
            }}
            className="btn-ghost border border-black/20 bg-white px-6 py-2.5 text-sm"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
