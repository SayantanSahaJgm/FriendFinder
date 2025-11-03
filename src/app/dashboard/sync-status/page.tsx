'use client';

/**
 * Sync Status Page
 * Real-time monitoring of offline sync operations
 */

import SyncDashboard from '@/components/offline/SyncDashboard';

export default function SyncStatusPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SyncDashboard />
      </div>
    </div>
  );
}
