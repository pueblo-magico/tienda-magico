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
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function CardPage() {
  return (
    <>
      <DocsPageHeader
        title="Card"
        description="Primitiva composable de shadcn/ui adaptada a los tokens de Pueblo Mágico. Base para resúmenes y tarjetas de dominio; no reemplaza las variantes editoriales de InfoCard."
      />
      <DocsSection title="Resumen y acciones">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Transferencia pendiente</CardTitle>
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
      <DocsSection title="Uso y migración">
        <p>
          Componé CardHeader, CardTitle, CardDescription, CardContent y
          CardFooter. Usá un encabezado semántico y conservá las reglas de
          negocio fuera de estas primitivas. CopyButton anuncia éxito o error y
          requiere etiquetas localizadas. El portado manual de Card no requiere
          dependencias adicionales.
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
