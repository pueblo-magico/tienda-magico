"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Body } from "@/components/typography";
import { Rating } from "@/components/ui/Rating";

export function ModalDemo() {
  const [open, setOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Button onPress={() => setCelebrating(true)}>Ver agradecimiento</Button>
      <Modal
        open={celebrating}
        onClose={() => setCelebrating(false)}
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
      <Modal open={open} onClose={() => setOpen(false)} title="Newsletter">
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
