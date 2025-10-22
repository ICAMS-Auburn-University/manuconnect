export function formatOrderId(
  orderId: string | number | null | undefined
): string {
  if (orderId === null || orderId === undefined) {
    return 'N/A';
  }

  if (typeof orderId === 'number') {
    if (!Number.isFinite(orderId)) {
      return 'N/A';
    }
    return orderId.toLocaleString('en-US', {
      minimumIntegerDigits: 6,
      useGrouping: false,
    });
  }

  const sanitized = orderId.replace(/[^a-zA-Z0-9]/g, '');
  if (!sanitized) {
    return orderId;
  }

  return sanitized.slice(0, 6).toUpperCase();
}
