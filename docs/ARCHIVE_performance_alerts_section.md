# Archived: Performance Alerts Section

This document contains the code that was removed from the dashboard's performance alerts section on 2025-01-04.

## Files Affected
- `src/pages/Index.tsx` - Import and usage of AnomalyAlertsCard component
- `src/components/AnomalyAlertsCard.tsx` - Complete component (preserved in codebase)

## Removed Code from src/pages/Index.tsx

### Import Statement (Line 21)
```typescript
import { AnomalyAlertsCard } from '@/components/AnomalyAlertsCard';
```

### JSX Usage (Lines 443-444)  
```tsx
{/* CARD DE ALERTAS DE ANOMALIAS */}
<AnomalyAlertsCard />
```

## Notes
- The AnomalyAlertsCard component itself remains intact in the codebase at `src/components/AnomalyAlertsCard.tsx`
- Related hooks and utilities (useAnomalyDetection, etc.) are also preserved
- This section can be restored by simply re-adding the import and JSX usage above
- The component was displaying performance anomaly alerts with severity levels and dismissal functionality

## Related Files (Still Active)
- `src/components/AnomalyAlertsCard.tsx` - Main component
- `src/hooks/useAnomalyDetection.ts` - Anomaly detection hook
- `src/types/anomaly.ts` - Type definitions
- `src/components/AnomalyHistory.tsx` - History component

## Restore Instructions
To restore this functionality:
1. Add back the import: `import { AnomalyAlertsCard } from '@/components/AnomalyAlertsCard';`
2. Add back the JSX after line 441: `<AnomalyAlertsCard />`