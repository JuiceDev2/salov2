import { clsx, type ClassValue } from 'clsx'
import { format, isToday, isTomorrow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatPeso(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatFecha(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return `Hoy ${format(date, 'HH:mm')}`
  if (isTomorrow(date)) return `Mañana ${format(date, 'HH:mm')}`
  return format(date, "d 'de' MMMM, HH:mm", { locale: es })
}

export function formatFechaCorta(dateStr: string): string {
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es })
}

export function formatHora(dateStr: string): string {
  return format(parseISO(dateStr), 'HH:mm', { locale: es })
}

export const ESTADO_LABELS: Record<string, string> = {
  confirmada:  'Confirmada',
  en_curso:    'En curso',
  completada:  'Completada',
  cancelada:   'Cancelada',
}

export const ESTADO_COLORS: Record<string, string> = {
  confirmada:  'bg-blue-100 text-blue-800',
  en_curso:    'bg-yellow-100 text-yellow-800',
  completada:  'bg-green-100 text-green-800',
  cancelada:   'bg-red-100 text-red-800',
}

export function telefonoToEmail(telefono: string): string {
  return `${telefono.replace(/\s/g, '')}@salon.interno`
}
