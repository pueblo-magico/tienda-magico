import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { Rating } from "@/components/ui/Rating";
import { cn } from "@/lib/utils/cn";

export type ProductCardProps = {
  href: string;
  title: string;
  price: string;
  imageSrc?: string | null;
  imageAlt?: string;
  noMediaLabel: string;
  badge?: string;
  rating?: number;
  ratingLabel?: string;
  reviewCount?: string;
  action?: ReactNode;
  imageLoading?: "eager" | "lazy";
  className?: string;
};

export function ProductCard({
  href,
  title,
  price,
  imageSrc,
  imageAlt = "",
  noMediaLabel,
  badge,
  rating,
  ratingLabel,
  reviewCount,
  action,
  imageLoading = "lazy",
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "hover:bg-card-hover group border-border bg-card flex h-full flex-col overflow-hidden rounded-2xl border transition-colors hover:shadow-md",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="bg-card-hover relative aspect-square overflow-hidden">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              fill
              className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              loading={imageLoading}
            />
          ) : (
            <MediaPlaceholder label={noMediaLabel} />
          )}
          {badge ? (
            <Badge className="absolute top-3 left-3" variant="forest">
              {badge}
            </Badge>
          ) : null}
        </div>
      </Link>
      <div className="flex flex-1 flex-col space-y-1 p-2">
        <Link href={href} className="block">
          <h3 className="text-text-primary font-serif text-sm">{title}</h3>
        </Link>
        <div className="flex h-full items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-text-highlight text-sm font-bold">{price}</p>
            {rating !== undefined && ratingLabel ? (
              <Rating
                value={rating}
                label={ratingLabel}
                reviewCount={reviewCount}
              />
            ) : null}
          </div>
          <span className="self-end">{action}</span>
        </div>
      </div>
    </article>
  );
}
