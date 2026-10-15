"use client";

import { useState } from "react";
import { Button } from "@pueblo-magico/react-ui";
import { Input } from "@pueblo-magico/react-ui";
import { Container } from "@pueblo-magico/react-ui";
import { Section } from "@pueblo-magico/react-ui";
import { Body, Eyebrow, SectionTitle } from "@pueblo-magico/react-ui";
import type { NewsletterBlockData } from "@/lib/cms";

export function NewsletterBlockView({ block }: { block: NewsletterBlockData }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <Section spacing="md">
      <Container>
        <div className="border-border bg-card rounded-3xl border px-6 py-10 sm:px-10">
          <div className="mx-auto flex max-w-xl flex-col gap-4">
            {block.eyebrow ? <Eyebrow>{block.eyebrow}</Eyebrow> : null}
            <SectionTitle>{block.title}</SectionTitle>
            {block.description ? <Body>{block.description}</Body> : null}

            {submitted ? (
              <p className="text-forest text-sm">
                {block.successMessage || "Thanks for subscribing."}
              </p>
            ) : (
              <form
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                onSubmit={(event) => {
                  event.preventDefault();
                  // Provider integration later (formId). Optimistic UI for now.
                  setSubmitted(true);
                }}
              >
                <Input
                  type="email"
                  name="email"
                  isRequired
                  autoComplete="email"
                  label={undefined}
                  placeholder={block.placeholder || "you@example.com"}
                  value={email}
                  onChange={setEmail}
                  className="sm:flex-1"
                  aria-label="Email"
                />
                <Button type="submit" className="sm:w-auto">
                  {block.buttonLabel || "Subscribe"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}
