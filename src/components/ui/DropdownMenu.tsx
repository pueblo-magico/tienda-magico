"use client";
import {
  MenuTrigger,
  Menu,
  MenuItem,
  Popover,
  Button,
} from "react-aria-components";
import type { ReactNode } from "react";

export function DropdownMenu({
  label,
  icon,
  items,
}: {
  label: string;
  icon: ReactNode;
  items: { id: string; label: string; href?: string; onAction?: () => void }[];
}) {
  return (
    <MenuTrigger>
      <Button
        aria-label={label}
        className="text-text-black hover:bg-card-hover focus-visible:outline-forest flex size-10 items-center justify-center rounded-full"
      >
        {icon}
      </Button>
      <Popover
        placement="bottom end"
        className="bg-card border-border z-50 rounded-xl border p-2 shadow-lg"
      >
        <Menu
          aria-label={label}
          className="flex min-w-48 flex-col outline-none"
        >
          {items.map((item) => (
            <MenuItem
              key={item.id}
              id={item.id}
              href={item.href}
              onAction={item.onAction}
              className="text-text-black data-[focused]:bg-warm cursor-pointer rounded-lg px-4 py-2 outline-none"
            >
              {item.label}
            </MenuItem>
          ))}
        </Menu>
      </Popover>
    </MenuTrigger>
  );
}
