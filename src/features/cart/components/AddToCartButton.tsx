"use client";

import { LoaderCircle, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/features/cart/CartProvider";

type Props = {
  merchandiseId: string;
};

export function AddToCartButton({ merchandiseId }: Props) {
  const t = useTranslations("product");
  const { addItem, configured } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const label = isAdding ? t("adding") : t("addToCart");

  const [isHovering, setIsHovering] = useState(false);

  const handleAdd = async () => {
    setIsAdding(true);
    try {
      await addItem({ merchandiseId, quantity: 1 });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onMouseOver={() => setIsHovering(true)}
      onMouseOut={() => setIsHovering(false)}
      type="button"
      size="icon-sm"
      shape="rounded"
      aria-label={label}
      title={label}
      disabled={!configured || isAdding}
      onClick={() => void handleAdd()}
      className="shrink-0"
    >
      {isAdding ? (
        <LoaderCircle
          aria-hidden
          className="size-4 animate-spin"
          strokeWidth={2}
        />
      ) : (
        <ShoppingCart aria-hidden className={`size-4 ease-in-out duration-200 ${isHovering && "-mt-1"}`} strokeWidth={2} />
      )}
    </Button>
  );
}
