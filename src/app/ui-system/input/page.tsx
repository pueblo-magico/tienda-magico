import { Input } from "@/components/ui/Input";
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
          hint="We'll never share your email."
        />
        <Input
          label="Email"
          name="email-error"
          defaultValue="bad@"
          error="Enter a valid email address."
        />
      </DocsSection>
      <DocsSection
        title="Importes en pesos ARS"
        className="w-full max-w-md flex-col items-stretch"
      >
        <Input
          format="ars-pesos"
          label="Importe recibido (ARS)"
          name="ars-example"
          defaultValue="20000"
          hint="Pesos enteros: 20000 se muestra como 20.000. El contrato de pagos conserva centavos."
        />
        <Input
          format="ars-pesos"
          label="Importe inválido"
          name="ars-error"
          defaultValue="20,50"
          error="Ingresá pesos enteros, sin centavos."
        />
        <Input
          format="ars-pesos"
          label="Importe deshabilitado"
          name="ars-disabled"
          defaultValue="20000"
          disabled
        />
      </DocsSection>
    </>
  );
}
