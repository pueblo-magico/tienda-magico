"use client";

import { useState, type FormEvent } from "react";
import { MessageCircle } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import { buildWhatsAppUrl } from "./whatsapp";

type ContactLabels = {
  name: string;
  namePlaceholder: string;
  email: string;
  emailPlaceholder: string;
  interest: string;
  interestPlaceholder: string;
  message: string;
  messagePlaceholder: string;
  hint: string;
  submit: string;
  whatsappIntro: string;
  consentPrefix: string;
  consentTerms: string;
  consentConnector: string;
  consentPrivacy: string;
  consentSuffix: string;
};

type ImpactContactFormProps = {
  labels: ContactLabels;
  interests: Array<{ label: string; value: string }>;
  whatsappNumber?: string;
  termsHref: string;
  privacyHref: string;
};

export function ImpactContactForm({
  labels,
  interests,
  whatsappNumber,
  termsHref,
  privacyHref,
}: ImpactContactFormProps) {
  const [hasConsent, setHasConsent] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const interestValue = String(data.get("interest") ?? "");
    const interest =
      interests.find((option) => option.value === interestValue)?.label ??
      interestValue;
    const message = [
      labels.whatsappIntro,
      "",
      `${labels.name}: ${String(data.get("name") ?? "")}`,
      `${labels.email}: ${String(data.get("email") ?? "")}`,
      `${labels.interest}: ${interest}`,
      `${labels.message}: ${String(data.get("message") ?? "")}`,
    ].join("\n");

    window.open(
      buildWhatsAppUrl(whatsappNumber, message),
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card hover:bg-card-hover border-border space-y-5 rounded-2xl border p-6 transition-colors"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="name"
          label={labels.name}
          placeholder={labels.namePlaceholder}
          required
        />
        <Input
          name="email"
          type="email"
          label={labels.email}
          placeholder={labels.emailPlaceholder}
          required
        />
      </div>
      <Select
        name="interest"
        label={labels.interest}
        placeholder={labels.interestPlaceholder}
        defaultValue=""
        options={interests}
        required
      />
      <Textarea
        name="message"
        label={labels.message}
        placeholder={labels.messagePlaceholder}
        hint={labels.hint}
        required
      />
      <label className="text-text-primary flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
        <input
          type="checkbox"
          name="consent"
          checked={hasConsent}
          onChange={(event) => setHasConsent(event.target.checked)}
          required
          className="border-border accent-brand mt-1 size-4 shrink-0 rounded"
        />
        <span>
          {labels.consentPrefix}{" "}
          <a
            href={termsHref}
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary underline underline-offset-2"
          >
            {labels.consentTerms}
          </a>{" "}
          {labels.consentConnector}{" "}
          <a
            href={privacyHref}
            target="_blank"
            rel="noreferrer"
            className="text-text-secondary underline underline-offset-2"
          >
            {labels.consentPrivacy}
          </a>
          . {labels.consentSuffix}
        </span>
      </label>
      <Button type="submit" disabled={!hasConsent}>
        <MessageCircle aria-hidden className="size-4" strokeWidth={2} />
        {labels.submit}
      </Button>
    </form>
  );
}
