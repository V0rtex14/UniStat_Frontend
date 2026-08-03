export function formatKGS(amount: number): string {
  // Format with space as thousands separator
  return `${Math.round(amount).toLocaleString("ru-RU").replace(/,/g, " ")} сом`
}

export const DEFAULT_TARIFF_KGS = 1.68 // Default electricity tariff in KGS per kWh
