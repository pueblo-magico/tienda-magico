import { Globe2, Heart, Mountain, Truck, Sprout } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function ImpactFooter() {
  const t = await getTranslations("shop.impactFooter");
  const items = [
    { Icon: Sprout, label: t("ethicalIngredients") },
    { Icon: Heart, label: t("localCommunities") },
    { Icon: Mountain, label: t("regenerativeDesign") },
    { Icon: Truck, label: t("consciousShipping") },
    { Icon: Globe2, label: t("humanConnection") },
  ];

  return (
    <>
      <section
        aria-label={t("label")}
        className="bg-background px-5 pt-6 sm:pt-12 pb-8 sm:pb-12"
      >
        <div className="border-border border-t mx-16 mb-12" />
        <span className="border-border bg-background py-6 grid gap-y-5 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ Icon, label }) => (
            <div
              key={label}
              className="border-border flex items-center gap-3 sm:even:border-l sm:even:pl-5 lg:border-l lg:pl-5 lg:first:border-l-0 lg:first:pl-0"
            >
              <span className="border-border text-text-secondary flex size-12 shrink-0 items-center justify-center rounded-full border">
                <Icon aria-hidden className="size-6" strokeWidth={1.5} />
              </span>
              <span className="text-text-primary text-sm leading-snug">
                {label}
              </span>
            </div>
          ))}
        </span>
      </section>
    </>
  );
}
