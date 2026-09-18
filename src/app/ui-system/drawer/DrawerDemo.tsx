"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Body } from "@/components/typography";

export function DrawerDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open drawer</Button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Your cart"
        footer={
          <div className="space-y-3">
            <Body>
              The drawer body and footer share one continuous scroll area.
            </Body>
            <Button className="w-full">Checkout</Button>
          </div>
        }
      >
        <Body>Cart items will appear here once Shopify is connected.</Body>
      </Drawer>
    </>
  );
}
