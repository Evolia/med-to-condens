"use client";

import { useSectorTags } from "@/hooks";
import { TagInput } from "./tag-input";

interface SecteurInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SecteurInput({
  value,
  onChange,
  placeholder = "Ex: Maternite, Neonat, Pediatrie...",
}: SecteurInputProps) {
  const { data: sectors = [] } = useSectorTags();

  return (
    <TagInput
      value={value}
      onChange={onChange}
      suggestions={sectors}
      label="Secteur"
      placeholder={placeholder}
      color="blue"
    />
  );
}
