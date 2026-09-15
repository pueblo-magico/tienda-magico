"use client";

import { Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { localizePath, type Locale } from "@/config/navigation";
import { cn } from "@/lib/utils/cn";

type SearchFormProps = {
  initialQuery?: string;
  autoFocus?: boolean;
  className?: string;
  onSubmitted?: () => void;
};

export function SearchForm({
  initialQuery = "",
  autoFocus = false,
  className,
  onSubmitted,
}: SearchFormProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("shop");
  const [query, setQuery] = useState(initialQuery);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  return (
    <form
      className={cn(
        "border-border bg-card focus-within:border-brand flex items-center gap-3 rounded-xl border px-4 py-3",
        className,
      )}
      onSubmit={(event) => {
        event.preventDefault();
        const searchQuery = query.trim();
        if (!searchQuery) return;
        const params = new URLSearchParams({ q: searchQuery });
        onSubmitted?.();
        router.push(localizePath(locale, `/shop?${params.toString()}`));
      }}
    >
      <Search
        aria-hidden
        className="text-text-secondary size-5 shrink-0"
        strokeWidth={2}
      />
      <input
        autoFocus={autoFocus}
        type="search"
        name="q"
        required
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className="text-text-black placeholder:text-text-secondary min-w-0 flex-1 bg-transparent text-base outline-none"
      />
      {query ? (
        <button
          type="button"
          aria-label={t("clear")}
          className="text-text-secondary hover:text-text-black rounded-full p-1 transition-colors"
          onClick={() => {
            setQuery("");
            onSubmitted?.();
            router.push(localizePath(locale, "/shop"));
          }}
        >
          <X aria-hidden className="size-4" strokeWidth={2} />
        </button>
      ) : null}
      <button
        type="submit"
        className="bg-brand text-brand-foreground hover:bg-brand-hover rounded-full px-5 py-2 text-sm font-bold transition-colors"
      >
        {t("search")}
      </button>
    </form>
  );
}
