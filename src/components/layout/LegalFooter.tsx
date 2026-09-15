import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { legalLinks } from "@/config/navigation";
import { Container } from "./Container";

const arcaQrUrl = "https://experienciamagico.com/uploads/qr-arca.png";

export async function LegalFooter() {
  const t = await getTranslations();

  return (
    <div className="border-border border-t">
      <Container className="py-8 sm:py-10">
        <p className="text-text-secondary mx-auto max-w-5xl text-center text-xs leading-relaxed sm:text-sm">
          <strong className="text-text-primary font-bold">
            {t("footer.legalEntity")}
          </strong>{" "}
          · {t("footer.legalDetails")}
        </p>

        <a
          href={"https://www.afip.gob.ar/fe/qr/conceptos-generales.asp"}
          target="_blank"
          rel="noreferrer"
          className="focus-visible:ring-forest mx-auto mt-6 block w-fit rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          aria-label={t("footer.qrLinkLabel")}
        >
          <Image
            src={arcaQrUrl}
            alt={t("footer.qrAlt")}
            width={112}
            height={112}
            className="border-border size-28 border"
          />
        </a>

        <div className="border-border text-text-secondary mt-8 grid gap-4 border-t pt-5 text-xs leading-relaxed lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-center">
          <p>
            {t("footer.legalCopyright", { year: new Date().getFullYear() })}
          </p>
          <a
            href={legalLinks.terms}
            className="hover:text-text-primary focus-visible:ring-forest w-fit underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("nav.terms")}
          </a>
          <a
            href={legalLinks.privacy}
            className="hover:text-text-primary focus-visible:ring-forest w-fit underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            {t("nav.privacy")}
          </a>
          <p className="text-text-primary italic">{t("footer.rights")}</p>
        </div>
      </Container>
    </div>
  );
}
