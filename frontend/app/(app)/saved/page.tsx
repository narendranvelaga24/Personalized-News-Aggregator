"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { articleApi, Article } from "@/lib/api";
import ArticleCard from "@/components/ArticleCard";
import SkeletonCard from "@/components/SkeletonCard";
import { Bookmark, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SavedPage() {
  const { isAuthed, isLoading } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const eagerImageIndex = articles.findIndex((a) => {
    const src = a.imageUrl?.trim();
    return !!src && src.toLowerCase() !== "none";
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) { router.replace("/login"); return; }
    articleApi.saved()
      .then((r) => setArticles(r.articles))
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, [isAuthed, isLoading, router]);

  return (
    <div>
      <div className="mb-8 reveal rounded-3xl border border-black/15 bg-white/75 backdrop-blur px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.16)]">
              <Bookmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-black">Saved</h1>
              <p className="text-sm text-black/60">Your bookmarked articles</p>
            </div>
          </div>
          <span className="inline-flex h-6 items-center rounded-full bg-white border border-black/15 px-3 text-xs text-black/60">
            {articles.length} saved
          </span>
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
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : articles.map((a, i) => (
              <ArticleCard key={`${a.id}-${i}`} article={a} eagerImage={i === eagerImageIndex} />
            ))}
      </div>

      {!fetching && articles.length === 0 && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center space-y-3">
          <Bookmark className="w-10 h-10 text-black/45 mx-auto" />
          <h2 className="font-display text-2xl text-black">No saved articles yet</h2>
          <p className="text-black/55 text-sm">
            Browse your{" "}
            <Link href="/for-you" className="text-black underline-offset-2 hover:underline">feed</Link>{" "}
            and save articles to read later.
          </p>
        </div>
      )}
    </div>
  );
}
