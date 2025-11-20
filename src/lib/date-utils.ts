import {
  format,
  formatDistance,
  differenceInDays,
  differenceInYears,
  differenceInMonths,
  parseISO,
  isValid,
} from "date-fns";
import { fr } from "date-fns/locale";

export function formatDate(date: string | Date, formatStr: string = "dd/MM/yyyy"): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "";
  return format(parsedDate, formatStr, { locale: fr });
}

export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function formatRelative(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsedDate)) return "";
  return formatDistance(parsedDate, new Date(), { addSuffix: true, locale: fr });
}

export function calculateAge(birthDate: string | Date): string {
  const parsedDate = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  if (!isValid(parsedDate)) return "";

  const now = new Date();
  const years = differenceInYears(now, parsedDate);
  const months = differenceInMonths(now, parsedDate) % 12;
  const days = differenceInDays(now, parsedDate);

  if (years >= 2) {
    return `${years} ans`;
  } else if (months >= 1) {
    return `${months} mois`;
  } else {
    return `${days} jours`;
  }
}

export function calculateAgeInDays(birthDate: string | Date): number {
  const parsedDate = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  if (!isValid(parsedDate)) return 0;
  return differenceInDays(new Date(), parsedDate);
}

export function formatAgeAtDate(birthDate: string | Date, atDate: string | Date): string {
  const birth = typeof birthDate === "string" ? parseISO(birthDate) : birthDate;
  const at = typeof atDate === "string" ? parseISO(atDate) : atDate;

  if (!isValid(birth) || !isValid(at)) return "";

  const years = differenceInYears(at, birth);
  const months = differenceInMonths(at, birth) % 12;
  const days = differenceInDays(at, birth);

  if (years >= 2) {
    return `${years} ans`;
  } else if (months >= 1) {
    return `${months} mois`;
  } else {
    return `${days} jours`;
  }
}
