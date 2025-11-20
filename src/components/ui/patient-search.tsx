"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Patient } from "@/types";
import { usePatients } from "@/hooks";

interface PatientSearchProps {
  value?: string;
  onChange: (patientId: string, patient?: Patient) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

// Normalize string: remove accents and convert to lowercase
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function PatientSearch({
  value,
  onChange,
  placeholder = "Rechercher un patient...",
  disabled = false,
  required = false,
}: PatientSearchProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: patients } = usePatients();

  // Update selected patient when value changes externally
  useEffect(() => {
    if (value && patients) {
      const patient = patients.find((p) => p.id === value);
      if (patient) {
        setSelectedPatient(patient);
      }
    } else if (!value) {
      setSelectedPatient(null);
    }
  }, [value, patients]);

  // Filter patients based on search (case and accent insensitive)
  const filteredPatients = patients?.filter((patient) => {
    if (!search) return true;
    const normalizedSearch = normalizeString(search);
    const normalizedNom = normalizeString(patient.nom);
    const normalizedPrenom = normalizeString(patient.prenom);
    const fullName = `${normalizedNom} ${normalizedPrenom}`;
    const reverseName = `${normalizedPrenom} ${normalizedNom}`;

    return (
      normalizedNom.includes(normalizedSearch) ||
      normalizedPrenom.includes(normalizedSearch) ||
      fullName.includes(normalizedSearch) ||
      reverseName.includes(normalizedSearch)
    );
  });

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearch("");
    setIsOpen(false);
    onChange(patient.id, patient);
  };

  const handleClear = () => {
    setSelectedPatient(null);
    setSearch("");
    onChange("", undefined);
  };

  return (
    <div ref={containerRef} className="relative">
      {selectedPatient ? (
        <div className="flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">
          <span>
            {selectedPatient.nom.toUpperCase()} {selectedPatient.prenom}
          </span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            required={required && !selectedPatient}
            className="block w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
          />
        </div>
      )}

      {/* Dropdown */}
      {isOpen && !selectedPatient && filteredPatients && filteredPatients.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          {filteredPatients.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleSelect(patient)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              <span>
                {patient.nom.toUpperCase()} {patient.prenom}
              </span>
              {patient.secteur && (
                <span className="text-xs text-gray-500">{patient.secteur}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !selectedPatient && search && filteredPatients?.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg">
          Aucun patient trouve
        </div>
      )}
    </div>
  );
}
