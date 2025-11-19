import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(price);
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getFirstAndLastName(fullName?: string | null): string {
  if (!fullName) return 'Usuário';

  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) return parts[0]; // só um nome

  const first = parts[0];
  const last = parts[parts.length - 1];

  return `${first} ${last}`;
}