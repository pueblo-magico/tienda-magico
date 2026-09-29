import { UserRound } from "lucide-react";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function DropdownMenuPage() {
  return (
    <>
      <DocsPageHeader
        title="Menú desplegable"
        description="Menú accesible compuesto con React Aria, como las primitivas existentes. Foco por teclado, flechas y cierre con Escape."
      />
      <DocsSection
        title="Cuenta"
        description="El control mantiene un nombre accesible aunque muestre solamente un icono."
      >
        <DropdownMenu
          label="Mi cuenta"
          icon={<UserRound aria-hidden strokeWidth={2} />}
          items={[
            { id: "orders", label: "Mis pedidos", href: "/es/mis-pedidos" },
            { id: "login", label: "Iniciar sesión", href: "/es/mi-cuenta" },
          ]}
        />
      </DocsSection>
    </>
  );
}
