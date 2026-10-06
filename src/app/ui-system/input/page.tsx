"use client";

import { Input } from "@pueblo-magico/react-ui";
import { ArsInput } from "@/components/ui/ArsInput";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function InputPage() {
  return (
    <>
      <DocsPageHeader
        title="Input"
        description="Rounded text fields with optional label, hint, and error states."
      />
      <DocsSection
        title="Examples"
        className="w-full max-w-md flex-col items-stretch"
      >
        <Input
          label="Email"
          name="email"
          placeholder="you@example.com"
          description="Nunca compartimos tu correo."
        />
        <Input
          label="Email"
          name="email-error"
          defaultValue="bad@"
          isInvalid
          errorMessage="Ingresá una dirección de correo válida."
        />
      </DocsSection>
      <DocsSection
        title="Importes en pesos ARS"
        className="w-full max-w-md flex-col items-stretch"
      >
        <ArsInput
          label="Importe recibido (ARS)"
          name="ars-example"
          defaultValue="20000"
          description="Pesos enteros: 20000 se muestra como 20.000. El contrato de pagos conserva centavos."
        />
        <ArsInput
          label="Importe inválido"
          name="ars-error"
          defaultValue="20,50"
          isInvalid
          errorMessage="Ingresá pesos enteros, sin centavos."
        />
        <ArsInput
          label="Importe deshabilitado"
          name="ars-disabled"
          defaultValue="20000"
          isDisabled
        />
      </DocsSection>
    </>
  );
}
