"use client";

import { useState } from "react";
import { Save, X } from "lucide-react";
import { Button, Input, SecteurInput } from "@/components/ui";
import { useCreatePatient, useUpdatePatient } from "@/hooks";
import { Patient } from "@/types";
import { useTabsStore } from "@/stores/tabs-store";

interface PatientFormProps {
  patient?: Patient;
  onSuccess?: (patient: Patient) => void;
  onCancel?: () => void;
}

export function PatientForm({ patient, onSuccess, onCancel }: PatientFormProps) {
  const [formData, setFormData] = useState({
    nom: patient?.nom || "",
    prenom: patient?.prenom || "",
    sexe: patient?.sexe || "",
    date_naissance: patient?.date_naissance || "",
    telephone: patient?.telephone || "",
    email: patient?.email || "",
    adresse: patient?.adresse || "",
    secteur: patient?.secteur || "",
    notes: patient?.notes || "",
  });

  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const { removeTab } = useTabsStore();

  const isEditing = !!patient;
  const isLoading = createPatient.isPending || updatePatient.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let result: Patient;

      if (isEditing) {
        if (!patient?.id) {
          alert("Erreur: Impossible de mettre à jour le patient (ID manquant)");
          return;
        }
        result = await updatePatient.mutateAsync({
          id: patient.id,
          ...formData,
          sexe: formData.sexe as "M" | "F" | "autre" | undefined,
        });
      } else {
        result = await createPatient.mutateAsync({
          ...formData,
          sexe: formData.sexe as "M" | "F" | "autre" | undefined,
        });
      }

      onSuccess?.(result);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      alert("Erreur lors de la sauvegarde: " + (error instanceof Error ? error.message : "Erreur inconnue"));
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Nom"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          required
        />
        <Input
          label="Prenom"
          value={formData.prenom}
          onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Sexe
          </label>
          <select
            value={formData.sexe}
            onChange={(e) => setFormData({ ...formData, sexe: e.target.value })}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Non renseigne</option>
            <option value="M">Masculin</option>
            <option value="F">Feminin</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <Input
          label="Date de naissance"
          type="date"
          value={formData.date_naissance}
          onChange={(e) =>
            setFormData({ ...formData, date_naissance: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Telephone"
          type="tel"
          value={formData.telephone}
          onChange={(e) =>
            setFormData({ ...formData, telephone: e.target.value })
          }
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <Input
        label="Adresse"
        value={formData.adresse}
        onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
      />

      <SecteurInput
        value={formData.secteur}
        onChange={(value) => setFormData({ ...formData, secteur: value })}
      />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={4}
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Notes particulieres sur le patient..."
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
        <Button type="button" variant="secondary" onClick={handleCancel}>
          <X className="mr-2 h-4 w-4" />
          Annuler
        </Button>
        <Button type="submit" isLoading={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isEditing ? "Enregistrer" : "Creer le dossier"}
        </Button>
      </div>
    </form>
  );
}
