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
        "hover:bg-card-hover group border-border bg-card overflow-hidden rounded-2xl border transition-colors",
        className,
      )}
    >
      <Link href={href} className="block">
        {imageSrc ? (
          <div className="bg-card-hover relative aspect-[16/10] overflow-hidden">
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
            <p className="text-text-highlight text-[11px] font-medium tracking-[0.16em] uppercase">
              {category}
            </p>
          ) : null}
          <h3 className="text-text-secondary font-serif text-xl font-medium group-hover:underline group-hover:underline-offset-4">
            {title}
          </h3>
          <p className="text-text-primary text-sm leading-relaxed">{excerpt}</p>
        </div>
      </Link>
    </article>
  );
}
