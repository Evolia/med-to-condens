"use client";

import { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

export interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  label?: string;
  placeholder?: string;
  color?: "blue" | "purple" | "green" | "gray";
  showLabel?: boolean;
  className?: string;
}

const colorClasses = {
  blue: {
    tag: "bg-blue-100 text-blue-800",
    tagHover: "hover:text-blue-600",
  },
  purple: {
    tag: "bg-purple-100 text-purple-800",
    tagHover: "hover:text-purple-600",
  },
  green: {
    tag: "bg-green-100 text-green-800",
    tagHover: "hover:text-green-600",
  },
  gray: {
    tag: "bg-gray-100 text-gray-800",
    tagHover: "hover:text-gray-600",
  },
};

export function TagInput({
  value,
  onChange,
  suggestions = [],
  label,
  placeholder = "Ajouter des tags...",
  color = "blue",
  showLabel = true,
  className = "",
}: TagInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Filter suggestions based on input and exclude already selected tags
  const filteredSuggestions = suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
    !selectedTags.some(tag => tag.toLowerCase() === suggestion.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
  };

  const handleSelectTag = (tag: string) => {
    // Add tag if not already present (case-insensitive check)
    if (!selectedTags.some(t => t.toLowerCase() === tag.toLowerCase())) {
      const newTags = [...selectedTags, tag];
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
      if (filteredSuggestions.length > 0) {
        handleSelectTag(filteredSuggestions[0]);
      } else if (inputValue.trim()) {
        // Create new tag
        handleSelectTag(inputValue.trim());
      }
    } else if (e.key === "Backspace" && !inputValue && selectedTags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      handleRemoveTag(selectedTags[selectedTags.length - 1]);
    }
  };

  const colors = colorClasses[color];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {showLabel && label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={selectedTags.length === 0 ? placeholder : ""}
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
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm ${colors.tag}`}
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className={`ml-1 ${colors.tagHover}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (filteredSuggestions.length > 0 || (suggestions.length > 0 && !inputValue)) && (
        <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
          {filteredSuggestions.length > 0 ? (
            filteredSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => handleSelectTag(suggestion)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-900"
              >
                {suggestion}
              </button>
            ))
          ) : inputValue ? (
            <div className="px-3 py-2 text-sm text-gray-500">
              Appuyez sur Entree pour creer &quot;{inputValue}&quot;
            </div>
          ) : (
            suggestions
              .filter(s => !selectedTags.some(t => t.toLowerCase() === s.toLowerCase()))
              .map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSelectTag(suggestion)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-gray-900"
                >
                  {suggestion}
                </button>
              ))
          )}
        </div>
      )}
    </div>
  );
}
