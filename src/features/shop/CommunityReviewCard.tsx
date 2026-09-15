import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { InfoCard } from "@/components/cards";

export async function CommunityReviewCard() {
  const t = await getTranslations("shop.supportingCards.review");

  return (
    <InfoCard
      variant="testimonial"
      tone="muted"
      eyebrow="Julieta Castoldi"
      title={`“${t("quote")}”`}
      description={t("role")}
      icon={
        <span className="border-brand-foreground/30 relative block size-24 overflow-hidden rounded-full border">
          <Image
            src="/images/julieta-castoldi.png"
            alt="Julieta Castoldi"
            fill
            sizes="96px"
            className="object-cover"
          />
        </span>
      }
      className="min-h-64"
    />
  );
}
