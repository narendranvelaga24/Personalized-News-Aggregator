"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { prefsApi, feedApi, Preferences, Source } from "@/lib/api";
import { Settings, Loader2, Check, AlertCircle } from "lucide-react";
import clsx from "clsx";

const CATEGORIES = [
  "technology", "science", "business", "world", "politics",
  "health", "sports", "entertainment", "gaming", "ai",
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "zh", name: "Chinese" },
  { code: "nl", name: "Dutch" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "id", name: "Indonesian" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "es", name: "Spanish" },
  { code: "sv", name: "Swedish" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
];

const COUNTRIES = [
  { code: "ar", name: "Argentina" },
  { code: "au", name: "Australia" },
  { code: "at", name: "Austria" },
  { code: "bd", name: "Bangladesh" },
  { code: "be", name: "Belgium" },
  { code: "br", name: "Brazil" },
  { code: "bg", name: "Bulgaria" },
  { code: "ca", name: "Canada" },
  { code: "cl", name: "Chile" },
  { code: "cn", name: "China" },
  { code: "co", name: "Colombia" },
  { code: "cz", name: "Czechia" },
  { code: "eg", name: "Egypt" },
  { code: "fi", name: "Finland" },
  { code: "fr", name: "France" },
  { code: "de", name: "Germany" },
  { code: "gr", name: "Greece" },
  { code: "hk", name: "Hong Kong" },
  { code: "hu", name: "Hungary" },
  { code: "in", name: "India" },
  { code: "id", name: "Indonesia" },
  { code: "ie", name: "Ireland" },
  { code: "il", name: "Israel" },
  { code: "it", name: "Italy" },
  { code: "jp", name: "Japan" },
  { code: "kr", name: "South Korea" },
  { code: "mx", name: "Mexico" },
  { code: "my", name: "Malaysia" },
  { code: "nl", name: "Netherlands" },
  { code: "nz", name: "New Zealand" },
  { code: "no", name: "Norway" },
  { code: "pk", name: "Pakistan" },
  { code: "ph", name: "Philippines" },
  { code: "pl", name: "Poland" },
  { code: "pt", name: "Portugal" },
  { code: "ro", name: "Romania" },
  { code: "ru", name: "Russia" },
  { code: "sa", name: "Saudi Arabia" },
  { code: "sg", name: "Singapore" },
  { code: "sk", name: "Slovakia" },
  { code: "za", name: "South Africa" },
  { code: "es", name: "Spain" },
  { code: "se", name: "Sweden" },
  { code: "ch", name: "Switzerland" },
  { code: "tw", name: "Taiwan" },
  { code: "th", name: "Thailand" },
  { code: "tr", name: "Turkey" },
  { code: "ua", name: "Ukraine" },
  { code: "ae", name: "United Arab Emirates" },
  { code: "gb", name: "United Kingdom" },
  { code: "us", name: "United States" },
  { code: "vn", name: "Vietnam" },
];

interface TagPickerProps {
  label: string;
  allOptions: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  allowCustom?: boolean;
}

function TagPicker({ label, allOptions, selected, onChange, allowCustom }: TagPickerProps) {
  const [custom, setCustom] = useState("");
  const toggle = (v: string) =>
    selected.includes(v) ? onChange(selected.filter((s) => s !== v)) : onChange([...selected, v]);
  const addCustom = () => {
    const t = custom.trim().toLowerCase();
    if (t && !selected.includes(t)) { onChange([...selected, t]); setCustom(""); }
  };
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-black/55 uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-2">
        {allOptions.map((o) => (
          <button key={o} onClick={() => toggle(o)}
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              selected.includes(o)
                ? "bg-black border-black text-white"
                : "bg-white border-black/20 text-black/65 hover:border-black/40 hover:text-black"
            )}>
            {o}
          </button>
        ))}
        {selected.filter((s) => !allOptions.includes(s)).map((s) => (
          <button key={s} onClick={() => toggle(s)}
            className="px-3 py-1.5 rounded-full text-xs font-medium bg-black border-black border text-white">
            {s} ✕
          </button>
        ))}
      </div>
      {allowCustom && (
        <div className="flex gap-2 mt-1">
          <input value={custom} onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add custom…" className="w-full rounded-2xl border border-black/20 bg-white px-3 py-2 text-xs text-black placeholder:text-black/45 focus:outline-none focus:ring-2 focus:ring-black/20" />
          <button onClick={addCustom} className="btn-ghost text-xs px-3 border border-black/20 bg-white">Add</button>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { isAuthed, isLoading } = useAuth();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [sources, setSources] = useState<Source[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSavedState] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthed) { router.replace("/login"); return; }
    Promise.all([prefsApi.get(), feedApi.sources()])
      .then(([p, s]) => { setPrefs(p); setSources(s.sources); })
      .catch((e) => setError(e.message));
  }, [isAuthed, isLoading, router]);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) =>
    setPrefs((p) => p ? { ...p, [key]: value } : p);

  const handleSave = async () => {
    if (!prefs) return;
    setSaving(true);
    setError("");
    try {
      await prefsApi.update({
        preferredCategories: prefs.preferredCategories,
        preferredKeywords: prefs.preferredKeywords,
        preferredSources: prefs.preferredSources,
        blockedKeywords: prefs.blockedKeywords,
        preferredLanguages: prefs.preferredLanguages,
        country: prefs.country,
      });
      setSavedState(true);
      setTimeout(() => setSavedState(false), 2500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8 reveal rounded-3xl border border-black/15 bg-white/75 backdrop-blur px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[0_10px_20px_rgba(0,0,0,0.16)]">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display text-3xl text-black">Settings</h1>
              <p className="text-sm text-black/60">Tune your personalized feed</p>
            </div>
          </div>
          <span className="inline-flex h-6 items-center rounded-full bg-white border border-black/15 px-3 text-xs text-black/60">
            Profile controls
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" /> <p className="text-sm">{error}</p>
        </div>
      )}

      {!prefs && !error && (
        <div className="glass rounded-3xl mt-8 min-h-[224px] px-6 py-12 flex flex-col items-center justify-center text-center space-y-3 text-black/55">
          <Loader2 className="w-5 h-5 animate-spin" />
          <p className="text-sm">Loading preferences…</p>
        </div>
      )}

      {prefs && (
        <div className="space-y-8">
          {/* Categories */}
          <section className="glass rounded-3xl p-6">
            <TagPicker
              label="Preferred Categories"
              allOptions={CATEGORIES}
              selected={prefs.preferredCategories}
              onChange={(v) => update("preferredCategories", v)}
            />
          </section>

          {/* Keywords */}
          <section className="glass rounded-3xl p-6 space-y-5">
            <TagPicker
              label="Preferred Keywords"
              allOptions={[]}
              selected={prefs.preferredKeywords}
              onChange={(v) => update("preferredKeywords", v)}
              allowCustom
            />
            <TagPicker
              label="Blocked Keywords"
              allOptions={[]}
              selected={prefs.blockedKeywords}
              onChange={(v) => update("blockedKeywords", v)}
              allowCustom
            />
          </section>

          {/* Sources */}
          {sources.length > 0 && (
            <section className="glass rounded-3xl p-6">
              <label className="text-xs font-semibold text-black/55 uppercase tracking-wider block mb-3">
                Preferred Sources
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {sources.map((s) => {
                  const sel = prefs.preferredSources.includes(s.id);
                  return (
                    <button key={s.id} onClick={() =>
                      update("preferredSources",
                        sel ? prefs.preferredSources.filter((x) => x !== s.id)
                            : [...prefs.preferredSources, s.id]
                      )}
                      className={clsx(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors text-left",
                        sel ? "bg-black/8 text-black" : "text-black/65 hover:bg-black/5"
                      )}>
                      <div className={clsx("w-4 h-4 rounded border flex items-center justify-center", sel ? "bg-black border-black" : "border-black/25")}>
                        {sel && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {s.name}
                      {s.category && <span className="ml-auto text-xs text-black/45">{s.category}</span>}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* Language + Country */}
          <section className="glass rounded-3xl p-6 space-y-6">
            {/* Languages */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/55 uppercase tracking-wider">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(({ code, name }) => (
                  <button
                    key={code}
                    onClick={() => {
                      const langs = prefs.preferredLanguages;
                      const updated = langs.includes(code)
                        ? langs.filter((l) => l !== code)
                        : [...langs, code];
                      update("preferredLanguages", updated);
                    }}
                    className={clsx(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                      prefs.preferredLanguages.includes(code)
                        ? "bg-black border-black text-white"
                        : "bg-white border-black/20 text-black/65 hover:border-black/40 hover:text-black"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {/* Country Dropdown */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-black/55 uppercase tracking-wider">Country</label>
              <select
                value={prefs.country || ""}
                onChange={(e) => update("country", e.target.value)}
                className="w-full sm:w-48 rounded-2xl border border-black/20 bg-white px-3 py-2.5 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black/20 appearance-none"
              >
                <option value="">Select a country</option>
                {COUNTRIES.map(({ code, name }) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Save */}
          <button onClick={handleSave} disabled={saving}
            className="btn-primary flex items-center gap-2 px-8 py-3">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Saved!" : "Save preferences"}
          </button>
        </div>
      )}
    </div>
  );
}
