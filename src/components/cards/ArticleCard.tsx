import Image from "next/image";
import Link from "next/link";
import {
  MediaCard,
  MediaCardContent,
  MediaCardMedia,
} from "@pueblo-magico/react-ui";
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
    <MediaCard className={cn("group", className)}>
      <Link href={href} className="block">
        {imageSrc ? (
          <MediaCardMedia aspect="landscape" motion="zoom">
            <Image
              src={imageSrc}
              alt={imageAlt || title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </MediaCardMedia>
        ) : null}
        <MediaCardContent className="space-y-2 px-4 py-4">
          {category ? (
            <p className="text-text-highlight text-[11px] font-medium tracking-[0.16em] uppercase">
              {category}
            </p>
          ) : null}
          <h3 className="text-text-secondary font-serif text-xl font-normal group-hover:underline group-hover:underline-offset-4">
            {title}
          </h3>
          <p className="text-text-primary text-sm leading-relaxed">{excerpt}</p>
        </MediaCardContent>
      </Link>
    </MediaCard>
  );
}
