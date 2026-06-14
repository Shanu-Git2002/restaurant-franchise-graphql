import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-IN').format(num);
}

export function formatDate(date: string | Date, opts?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-IN', opts ?? { dateStyle: 'medium' }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function getRatingColor(rating: number): string {
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-yellow-600';
  return 'text-red-600';
}

export function getSentimentColor(sentiment: string): string {
  const map: Record<string, string> = {
    POSITIVE: 'text-green-600 bg-green-50',
    NEUTRAL: 'text-yellow-600 bg-yellow-50',
    NEGATIVE: 'text-red-600 bg-red-50',
  };
  return map[sentiment] ?? 'text-gray-600 bg-gray-50';
}
