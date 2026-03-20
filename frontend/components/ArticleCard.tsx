"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { formatDistanceToNow } from "@/lib/utils";
import { Article } from "@/lib/api";
import ArticleActions from "./ArticleActions";

interface Props {
  article: Article;
  showScore?: boolean;
  eagerImage?: boolean;
}

function toSafeImageSrc(value?: string): string | null {
  if (!value) return null;
  const normalized = value.trim();
  if (!normalized) return null;

  const lower = normalized.toLowerCase();
  if (lower === 'none' || lower === 'null' || lower === 'undefined' || lower === 'nan') {
    return null;
  }

  // Next/Image accepts either absolute http(s) URLs or root-relative paths.
  if (normalized.startsWith('/')) return normalized;
  try {
    const u = new URL(normalized);
    if (u.protocol === 'http:' || u.protocol === 'https:') return normalized;
    return null;
  } catch {
    return null;
  }
}

function toProxyImageSrc(src: string | null): string | null {
  if (!src) return null;
  if (src.startsWith("/")) return src;
  return `/image-proxy?url=${encodeURIComponent(src)}`;
}

function formatSourceName(value?: string): string {
  if (!value) return "Unknown";
  const trimmed = value.trim();
  if (!trimmed) return "Unknown";

  try {
    const url = new URL(trimmed);
    return url.hostname.replace(/^www\./, "");
  } catch {
    // Some providers may send host-like strings without protocol.
    if (/^[\w.-]+\.[a-z]{2,}$/i.test(trimmed)) {
      return trimmed.replace(/^www\./i, "");
    }
    return trimmed;
  }
}

export default function ArticleCard({ article, showScore, eagerImage = false }: Props) {
  const [hideImage, setHideImage] = useState(false);
  const timeAgo = article.publishedAt
    ? formatDistanceToNow(new Date(article.publishedAt))
    : null;
  const safeImageSrc = toSafeImageSrc(article.imageUrl);
  const imageSrc = toProxyImageSrc(safeImageSrc);
  const sourceLabel = formatSourceName(article.source?.name);

  return (
    <article className="glass rounded-xl overflow-hidden card-hover group flex flex-col border border-black/10 bg-white/85">
      {/* Image */}
      {imageSrc && !hideImage && (
        <div className="relative aspect-[16/9] overflow-hidden bg-black/10">
          <Image
            src={imageSrc}
            alt={article.title}
            fill
            unoptimized
            loading={eagerImage ? "eager" : "lazy"}
            onError={() => setHideImage(true)}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {/* Score badge */}
          {showScore && article._score !== undefined && (
            <span className="absolute top-2 right-2 bg-black/90 text-white text-xs font-semibold px-2 py-0.5 rounded-full backdrop-blur">
              {article._score.toFixed(1)}
            </span>
          )}
        </div>
      )}

      {(!safeImageSrc || hideImage) && (
        <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-black/8 to-black/12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 text-black/45">
            <ImageOff className="w-6 h-6" />
            <span className="text-xs">No image preview</span>
          </div>
        </div>
      )}

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Source + time */}
        <div className="flex items-center gap-2 text-xs text-black/55">
          <span className="inline-flex h-6 items-center bg-black/6 border border-black/10 px-2.5 rounded-full font-medium text-black/70 max-w-[13rem] truncate">
            {sourceLabel}
          </span>
          {article.source?.category && (
            <span className="text-black/55">{article.source.category}</span>
          )}
          {timeAgo && <span className="ml-auto">{timeAgo}</span>}
        </div>

        {/* Title */}
        <h2 className="font-semibold text-black leading-[1.34] tracking-[-0.01em] line-clamp-3 text-[0.96rem] group-hover:text-black/75 transition-colors">
          {article.title}
        </h2>

        {/* Description */}
        {article.description && (
          <p className="text-xs text-black/60 leading-[1.5] line-clamp-2">
            {article.description}
          </p>
        )}

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-auto">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] tracking-[0.04em] bg-black/6 border border-black/10 text-black/65 px-2 py-0.5 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions footer */}
        <div className="flex items-center justify-between pt-2 border-t border-black/10">
          <Link
            href={article.canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-black/75 hover:text-black font-medium transition-colors"
          >
            Read article →
          </Link>
          <ArticleActions article={article} />
        </div>
      </div>
    </article>
  );
}
