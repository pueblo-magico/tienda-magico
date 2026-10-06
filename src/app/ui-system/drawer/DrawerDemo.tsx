"use client";

import { useState } from "react";
import { Body, Button, Drawer } from "@pueblo-magico/react-ui";

export function DrawerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onPress={() => setOpen(true)}>Abrir panel</Button>
      <Drawer
        closeLabel="Cerrar panel"
        isOpen={open}
        onOpenChange={setOpen}
        placement="end"
        title="Tu carrito"
      >
        {({ close }) => (
          <div className="space-y-4">
            <Body>
              Los productos aparecen dentro de una región desplazable que
              conserva el foco dentro del panel.
            </Body>
            <Button className="w-full" onPress={close}>
              Continuar
            </Button>
          </div>
        )}
      </Drawer>
    </>
  );
}
