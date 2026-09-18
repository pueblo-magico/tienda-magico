import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/Card";
import { CopyButton } from "@/components/ui/CopyButton";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";
import { StepsCard } from "@/components/cards/StepsCard";
import { FileText, Store, Banknote } from "lucide-react";

export default function CardPage() {
  return (
    <>
      <DocsPageHeader
        title="Card"
        description="Primitiva composable de shadcn/ui adaptada a los tokens de Pueblo Mágico. Base para resúmenes y tarjetas de dominio; no reemplaza las variantes editoriales de InfoCard."
      />
      <DocsSection title="Resumen y acciones">
        <StepsCard
          title="Qué hacer ahora"
          description="Tarjeta de pasos numerados, adaptable a móvil. Composición de Card; los textos se localizan en cada consumidor."
          steps={[
            {
              id: "reference",
              icon: <FileText className="size-9" strokeWidth={1.5} />,
              title: "Guardá la referencia",
              description: "Copiá la referencia para identificar el pedido.",
            },
            {
              id: "collection",
              icon: <Store className="size-9" strokeWidth={1.5} />,
              title: "Coordiná el retiro",
              description: "Contactá a la tienda antes de acercarte.",
            },
            {
              id: "payment",
              icon: <Banknote className="size-9" strokeWidth={1.5} />,
              title: "Pagá al retirar",
              description: "El personal confirma el pago recibido.",
            },
          ]}
        />
        <Card className="max-w-xl">
          <CardHeader layout="split">
            <CardTitle variant="editorial">Transferencia pendiente</CardTitle>
            <CardDescription>
              El aviso de transferencia no confirma el pago.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt>Referencia de ejemplo</dt>
                <dd className="flex items-center">
                  pedido-demo
                  <CopyButton
                    value="pedido-demo"
                    label="Copiar referencia"
                    copiedLabel="Referencia copiada"
                    errorLabel="No se pudo copiar"
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter>
            <Button href="/es/mis-pedidos" size="sm">
              Mis pedidos
            </Button>
            <Button disabled size="sm" variant="secondary">
              Verificando
            </Button>
          </CardFooter>
        </Card>
      </DocsSection>
      <DocsSection title="Acceso privado de caja">
        <Card className="w-full max-w-xl">
          <CardHeader>
            <CardTitle>Caja · confirmar efectivo</CardTitle>
            <CardDescription>
              Acceso del personal con contraseña. La autorización se verifica en
              el servidor, no en esta tarjeta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              name="cash-password-example"
              type="password"
              label="Contraseña del personal"
              autoComplete="off"
            />
          </CardContent>
          <CardFooter>
            <Button disabled>Ingresar (ejemplo)</Button>
          </CardFooter>
        </Card>
      </DocsSection>
      <DocsSection title="Uso y migración">
        <p>
          Componé CardHeader, CardTitle, CardDescription, CardContent y
          CardFooter. Usá un encabezado semántico y conservá las reglas de
          negocio fuera de estas primitivas. CopyButton anuncia éxito o error y
          requiere etiquetas localizadas. El portado manual de Card no requiere
          dependencias adicionales. CardHeader admite la distribución split para
          separar título y referencia; CardTitle admite la variante editorial
          para títulos serif sin clases tipográficas incompatibles. Para
          referencias con texto forest, usá bg-warm en lugar del fondo forest de
          bg-background-secondary.
        </p>
        <a
          href="https://ui.shadcn.com/docs/components/card"
          className="text-text-secondary underline"
        >
          Documentación de shadcn/ui
        </a>
      </DocsSection>
    </>
  );
}
