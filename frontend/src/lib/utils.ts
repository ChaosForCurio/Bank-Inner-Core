import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number | string, currency: string = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: currency,
    }).format(Number(amount))
}

export function formatDate(date: string | Date) {
    return new Date(date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}
