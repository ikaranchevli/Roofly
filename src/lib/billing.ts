import { parseISO, eachDayOfInterval, isWithinInterval, startOfDay } from 'date-fns';
import type { Tenant } from '@/types/tenant';

export interface CalculatedSplit {
  tenantId: string;
  amount: number;
  daysStayed: number;
}

/**
 * Calculates how a bill should be split among tenants based on the days they
 * resided at the property during the billing period.
 * 
 * @param amount Total bill amount
 * @param startDate Billing period start date (YYYY-MM-DD)
 * @param endDate Billing period end date (YYYY-MM-DD)
 * @param tenants List of all tenants to consider
 * @returns Array of CalculatedSplit objects
 */
export function calculateBillSplits(
  amount: number,
  startDate: string,
  endDate: string,
  tenants: Tenant[]
): CalculatedSplit[] {
  const start = startOfDay(parseISO(startDate));
  const end = startOfDay(parseISO(endDate));
  
  if (end < start || amount <= 0) {
    return [];
  }

  const daysInPeriod = eachDayOfInterval({ start, end });
  const totalDays = daysInPeriod.length;
  const dailyRate = amount / totalDays;

  // Track each tenant's accumulated amount and days stayed in this period
  const tenantStats = new Map<string, { amount: number; daysStayed: number }>();
  tenants.forEach((t) => tenantStats.set(t.id, { amount: 0, daysStayed: 0 }));

  // Go through each day of the billing period
  daysInPeriod.forEach((day) => {
    // Find tenants active on this specific day
    const activeTenants = tenants.filter((tenant) => {
      const moveIn = startOfDay(parseISO(tenant.move_in_date));
      const moveOut = tenant.move_out_date ? startOfDay(parseISO(tenant.move_out_date)) : null;

      // Active if they moved in on or before this day, AND (haven't moved out OR moved out on or after this day)
      return day >= moveIn && (!moveOut || day <= moveOut);
    });

    if (activeTenants.length > 0) {
      // Split the daily rate among active tenants
      const splitAmount = dailyRate / activeTenants.length;
      
      activeTenants.forEach((tenant) => {
        const stats = tenantStats.get(tenant.id)!;
        stats.amount += splitAmount;
        stats.daysStayed += 1;
      });
    }
  });

  // Convert map to array and filter out tenants with 0 days stayed
  return Array.from(tenantStats.entries())
    .filter(([_, stats]) => stats.daysStayed > 0)
    .map(([tenantId, stats]) => ({
      tenantId,
      amount: Number(stats.amount.toFixed(2)), // Round to 2 decimal places
      daysStayed: stats.daysStayed,
    }));
}
