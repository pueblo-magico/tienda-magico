import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export type ArticleCardProps = {
  href: string;
  title: string;
  excerpt: string;
  category?: string;
  imageSrc?: string;
  imageAlt?: string;
  className?: string;
};

export function ArticleCard({
  href,
  title,
  excerpt,
  category,
  imageSrc,
  imageAlt = "",
  className,
}: ArticleCardProps) {
  return (
    <article
      className={cn(
        "group overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <Link href={href} className="block">
        {imageSrc ? (
          <div className="relative aspect-[16/10] overflow-hidden bg-muted">
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        ) : null}
        <div className="space-y-2 px-4 py-4">
          {category ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-forest/50">
              {category}
            </p>
          ) : null}
          <h3 className="font-serif text-xl font-medium text-forest group-hover:underline group-hover:underline-offset-4">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-forest/70">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
