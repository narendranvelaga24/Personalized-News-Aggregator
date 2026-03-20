"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, EyeOff, Check } from "lucide-react";
import { Article, articleApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import clsx from "clsx";

interface Props {
  article: Article;
  initialSaved?: boolean;
  onHide?: (id: string) => void;
}

export default function ArticleActions({ article, initialSaved = false, onHide }: Props) {
  const { isAuthed } = useAuth();
  const [saved, setSaved] = useState(initialSaved);
  const [read, setRead] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  if (!isAuthed) return null;
  if (hidden) return null;

  const handle = async (action: "save" | "read" | "hide") => {
    setLoading(action);
    try {
      if (action === "save") {
        if (saved) {
          await articleApi.unsave(article.id);
          setSaved(false);
        } else {
          await articleApi.save(article.id);
          setSaved(true);
        }
      } else if (action === "read") {
        await articleApi.markRead(article.id);
        setRead(true);
      } else if (action === "hide") {
        await articleApi.hide(article.id);
        setHidden(true);
        onHide?.(article.id);
      }
    } catch {
      // silent — UX optimistic
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-1">
      {/* Mark read */}
      <button
        onClick={() => handle("read")}
        disabled={read || loading === "read"}
        title={read ? "Marked as read" : "Mark as read"}
        className={clsx(
          "p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          read
            ? "text-green-700 bg-green-500/12"
            : "text-black/50 hover:text-green-700 hover:bg-green-500/12"
        )}
      >
        <Check className="w-3.5 h-3.5" />
      </button>

      {/* Save */}
      <button
        onClick={() => handle("save")}
        disabled={loading === "save"}
        title={saved ? "Unsave" : "Save article"}
        className={clsx(
          "p-1.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
          saved
            ? "text-black bg-black/10"
            : "text-black/50 hover:text-black hover:bg-black/10"
        )}
      >
        {saved ? (
          <BookmarkCheck className="w-3.5 h-3.5" />
        ) : (
          <Bookmark className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Hide */}
      <button
        onClick={() => handle("hide")}
        disabled={loading === "hide"}
        title="Hide article"
        className="p-1.5 rounded-md text-black/45 hover:text-black/70 hover:bg-black/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <EyeOff className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
