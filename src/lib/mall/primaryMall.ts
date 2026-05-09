const CUSTOMER_PRIMARY_MALLS: Record<string, string[]> = {
  'realidea-oy': ['realidea-sello', 'realidea-tripla'],
};

type MallLike = {
  mallId: string;
  name?: string | null;
};

export function choosePrimaryMallId(
  mallIds: string[],
  customerId?: string | null,
): string {
  const preferred = customerId ? CUSTOMER_PRIMARY_MALLS[customerId] ?? [] : [];
  return preferred.find((mallId) => mallIds.includes(mallId)) ?? mallIds[0] ?? '';
}

export function sortCustomerMalls<T extends MallLike>(
  malls: T[],
  customerId?: string | null,
): T[] {
  const preferred = customerId ? CUSTOMER_PRIMARY_MALLS[customerId] ?? [] : [];
  return [...malls].sort((a, b) => {
    const priorityA = preferred.indexOf(a.mallId);
    const priorityB = preferred.indexOf(b.mallId);
    const rankA = priorityA === -1 ? Number.MAX_SAFE_INTEGER : priorityA;
    const rankB = priorityB === -1 ? Number.MAX_SAFE_INTEGER : priorityB;
    if (rankA !== rankB) return rankA - rankB;
    return (a.name ?? a.mallId).localeCompare(b.name ?? b.mallId);
  });
}
