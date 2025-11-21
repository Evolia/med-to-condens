"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { useSectors } from "@/hooks";

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
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: sectors = [] } = useSectors();

  // Parse value into array of tags
  const selectedTags = value ? value.split(",").map(t => t.trim()).filter(Boolean) : [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter sectors based on input and exclude already selected tags
  const filteredSectors = sectors.filter((sector) =>
    sector.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.includes(sector)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSelectSector = (sector: string) => {
    // Add tag if not already present
    if (!selectedTags.includes(sector)) {
      const newTags = [...selectedTags, sector];
      onChange(newTags.join(", "));
    }
    setInputValue("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter(t => t !== tagToRemove);
    onChange(newTags.join(", "));
  };

  const handleClearAll = () => {
    onChange("");
    setInputValue("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredSectors.length > 0) {
        handleSelectSector(filteredSectors[0]);
      } else if (inputValue) {
        // Create new sector tag
        handleSelectSector(inputValue);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        Secteur
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 pr-16 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
          {(inputValue || selectedTags.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setInputValue("");
                if (selectedTags.length > 0) {
                  handleClearAll();
                }
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
              title={selectedTags.length > 0 ? "Effacer tous les tags" : "Effacer"}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </div>

      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (filteredSectors.length > 0 || (sectors.length > 0 && !inputValue)) && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {filteredSectors.length > 0 ? (
            filteredSectors.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => handleSelectSector(sector)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-900"
              >
                {sector}
              </button>
            ))
          ) : inputValue ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Appuyez sur Entree pour creer &quot;{inputValue}&quot;
            </div>
          ) : (
            sectors
              .filter(s => !selectedTags.includes(s))
              .map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => handleSelectSector(sector)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-900"
                >
                  {sector}
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
}
