import { Tabs } from "@/components/ui/Tabs";
import { DocsPageHeader } from "@/components/ui-system/DocsPageHeader";
import { DocsSection } from "@/components/ui-system/DocsSection";

export default function TabsPage() {
  return (
    <>
      <DocsPageHeader
        title="Tabs"
        description="Pestañas de línea basadas en shadcn/ui y React Aria. La selección usa un subrayado forest; las etiquetas inactivas conservan el tono secundario, sin fondos ni mayúsculas forzadas."
      />
      <DocsSection
        title="Estados de pedidos · ejemplo visual"
        className="w-full"
      >
        <Tabs
          className="w-full"
          label="Estados de pedidos"
          items={[
            { id: "all", label: "Todos", content: "Todos los pedidos." },
            {
              id: "pending",
              label: "Pendientes de pago",
              content: "Pedidos pendientes de pago.",
            },
            {
              id: "preparing",
              label: "En preparación",
              content: "Ejemplo de pedidos en preparación.",
            },
            {
              id: "shipped",
              label: "Enviados",
              content: "Ejemplo de pedidos enviados.",
            },
            {
              id: "delivered",
              label: "Entregados",
              content: "Ejemplo de pedidos entregados.",
            },
          ]}
        />
      </DocsSection>
      <DocsSection
        title="Selección inicial y estado deshabilitado"
        className="w-full"
      >
        <Tabs
          className="w-full"
          label="Detalle del pedido"
          defaultValue="details"
          items={[
            { id: "summary", label: "Resumen", content: "Resumen del pedido." },
            {
              id: "details",
              label: "Detalle",
              content: "Información del pedido seleccionado.",
            },
            {
              id: "unavailable",
              label: "No disponible",
              content: "",
              disabled: true,
            },
          ]}
        />
      </DocsSection>
      <DocsSection title="Interacción y uso">
        <p>
          El subrayado se desliza entre pestañas y ajusta su ancho. Con
          movimiento reducido, cambia sin animación. Tab entra y sale del
          control; las flechas cambian la selección. Inicio y Fin recorren las
          pestañas habilitadas. En pantallas angostas la fila permite
          desplazamiento horizontal sin desbordar la página. Pasá label
          traducido para nombrar el grupo; value y onValueChange permiten
          selección controlada. Los estados de entrega de este ejemplo no
          agregan capacidades al backend.
        </p>
        <a
          className="text-text-secondary underline"
          href="https://ui.shadcn.com/docs/components/aria/tabs"
        >
          Referencia de shadcn/ui
        </a>
      </DocsSection>
    </>
  );
}
