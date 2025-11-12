'use client';

/**
 * Queue Management Page
 * Advanced queue management interface
 */

import QueueManager from '@/components/offline/QueueManager';

export default function QueueManagementPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <QueueManager />
      </div>
    </div>
  );
}
