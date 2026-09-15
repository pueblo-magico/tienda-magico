"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { SearchForm } from "./SearchForm";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const t = useTranslations("shop");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("searchDialogTitle")}
      className="w-[min(calc(100%-2rem),56rem)] max-w-none"
    >
      <SearchForm autoFocus onSubmitted={onClose} />
    </Modal>
  );
}
