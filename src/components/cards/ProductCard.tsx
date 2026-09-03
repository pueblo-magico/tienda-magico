import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

export type ProductCardProps = {
  href: string;
  title: string;
  price: string;
  imageSrc: string;
  imageAlt?: string;
  badge?: string;
  className?: string;
};

export function ProductCard({
  href,
  title,
  price,
  imageSrc,
  imageAlt = "",
  badge,
  className,
}: ProductCardProps) {
  return (
    <article
      className={cn(
        "hover:bg-card-hover group border-border bg-card overflow-hidden rounded-2xl border transition-colors hover:shadow-md",
        className,
      )}
    >
      <Link href={href} className="block">
        <div className="bg-card-hover relative aspect-[4/5] overflow-hidden">
          <Image
            src={imageSrc}
            alt={imageAlt || title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
          {badge ? (
            <Badge className="absolute top-3 left-3" variant="forest">
              {badge}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-1 px-4 py-3">
          <h3 className="text-text-secondary text-sm font-medium">{title}</h3>
          <p className="text-text-primary text-sm">{price}</p>
        </div>
      </Link>
    </article>
  );
}
