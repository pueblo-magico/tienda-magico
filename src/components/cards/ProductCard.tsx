import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { MediaPlaceholder } from "@/components/media/MediaPlaceholder";
import { cn } from "@/lib/utils/cn";

export type ProductCardProps = {
  href: string;
  title: string;
  price: string;
  imageSrc?: string | null;
  imageAlt?: string;
  noMediaLabel: string;
  badge?: string;
  category?: string;
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
  category,
  imageLoading = "lazy",
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "hover:bg-card-hover group border-border bg-card h-full overflow-hidden rounded-2xl border transition-colors hover:shadow-md",
        className,
      )}
    >
      <Link href={href} className="flex h-full flex-col">
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
        <div className="flex flex-1 flex-col space-y-1 p-2">
          {/* {category ? (
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-forest/55">
              {category}
            </p>
          ) : null} */}
          <h3 className="text-text-primary font-serif text-sm">{title}</h3>
          <p className="text-text-highlight mt-auto text-sm font-bold">
            {price}
          </p>
        </div>
      </Link>
    </article>
  );
}
