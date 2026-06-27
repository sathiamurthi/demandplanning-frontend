// src/components/inventory/StatusBadge.tsx
import { Badge } from '@/components/ui/Badge';
import type { StockStatus, ExpiryStatus } from './../types/medicine';

interface StatusBadgeProps {
  status: StockStatus;
}

interface ExpiryBadgeProps {
  status: ExpiryStatus;
}

export function StockStatusBadge({ status }: StatusBadgeProps) {
  if (status === 'ok') {
    return <Badge variant="success">OK</Badge>;
  }
  return <Badge variant="warning">Low</Badge>;
}

export function ExpiryStatusBadge({ status }: ExpiryBadgeProps) {
  if (status === 'ok') {
    return null;
  }
  return <Badge variant="error">Expiring</Badge>;
}
