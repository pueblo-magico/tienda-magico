"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@pueblo-magico/react-ui";
import { SearchForm } from "./SearchForm";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const t = useTranslations("shop");

  return (
    <Modal
      isOpen={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title={t("searchDialogTitle")}
      closeLabel={t("searchDialogClose")}
      className="w-[min(calc(100%-2rem),56rem)] max-w-none"
    >
      <SearchForm autoFocus onSubmitted={onClose} />
    </Modal>
  );
}
