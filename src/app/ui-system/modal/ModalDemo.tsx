"use client";

import { useState } from "react";
import { Button } from "@pueblo-magico/react-ui";
import { Modal } from "@pueblo-magico/react-ui";
import { Body } from "@pueblo-magico/react-ui";
import { Rating } from "@/components/ui/Rating";

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [locked, setLocked] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Button onPress={() => setLocked(true)}>
        Ver operación no descartable
      </Button>
      <Modal
        isOpen={locked}
        onOpenChange={setLocked}
        title="Operación en curso"
        closeLabel="Cerrar operación"
        size="wide"
        isDismissable={false}
      >
        <p>Durante un cobro, Escape y el cierre no interrumpen la operación.</p>
        <Button onPress={() => setLocked(false)}>Finalizar ejemplo</Button>
      </Modal>
      <Button onPress={() => setCelebrating(true)}>Ver agradecimiento</Button>
      <Modal
        isOpen={celebrating}
        onOpenChange={setCelebrating}
        title="Gracias por tu opinión"
        closeLabel="Cerrar agradecimiento"
        variant="celebration"
      >
        <div className="space-y-5">
          <p className="text-text-secondary font-serif text-3xl">
            Gracias por tu opinión
          </p>
          <Rating
            value={3}
            size="lg"
            label="3 de 5 estrellas"
            className="justify-center"
          />
          <Button className="w-full" onPress={() => setCelebrating(false)}>
            Continuar
          </Button>
        </div>
      </Modal>
      <Modal
        isOpen={open}
        onOpenChange={setOpen}
        title="Newsletter"
        closeLabel="Cerrar newsletter"
      >
        <Body>
          Join our community for mountain rituals, regenerative stories, and new
          drops.
        </Body>
        <div className="mt-4">
          <Button onClick={() => setOpen(false)}>Close</Button>
        </div>
      </Modal>
    </>
  );
}
