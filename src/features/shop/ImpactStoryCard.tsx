import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/Button";
import { localizePath } from "@/config/navigation";

type ImpactStoryCardProps = {
  locale: string;
  imageUrl?: string | null;
};

export async function ImpactStoryCard({
  locale,
  imageUrl,
}: ImpactStoryCardProps) {
  const t = await getTranslations("shop.supportingCards.impact");

  return (
    <article className="bg-forest text-card relative flex min-h-64 overflow-hidden rounded-xl">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
      ) : null}
      <div className="bg-forest/70 absolute inset-0" />
      <div className="relative z-10 ml-auto flex w-full max-w-sm flex-col items-start justify-center p-7">
        <h3 className="font-serif text-2xl leading-tight">{t("title")}</h3>
        <p className="text-card/85 mt-3 text-sm leading-relaxed">
          {t("description")}
        </p>
        <Button
          href={localizePath(locale, "/impact")}
          variant="secondary"
          size="sm"
          className="border-card/70 text-card hover:bg-card/10 mt-5"
        >
          {t("cta")}
        </Button>
      </div>
    </article>
  );
}
