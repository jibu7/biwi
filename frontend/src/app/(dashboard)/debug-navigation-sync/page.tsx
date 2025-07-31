'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { logNavigationSync } from '@/utils/verifyNavSync';
import { useEffect } from 'react';

export default function NavigationSyncDebugPage() {
  const { hasPermission } = usePermissions();

  useEffect(() => {
    // Log sync results to console when component loads
    logNavigationSync(hasPermission);
  }, [hasPermission]);

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Navigation Synchronization Debug</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Debug Information:</h3>
          <p className="text-sm text-gray-600">
            Check the browser console for detailed synchronization results between 
            sidebar navigation and dashboard modules.
          </p>
        </div>

        <div className="bg-gray-50 p-4 rounded">
          <h4 className="font-medium mb-2">How to verify synchronization:</h4>
          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-1">
            <li>Open browser developer tools (F12)</li>
            <li>Check the Console tab</li>
            <li>Look for "🔍 Navigation Synchronization Check" output</li>
            <li>Verify that sidebar and dashboard show the same number of modules</li>
            <li>Navigate to /maintenance, /transactions, and /reports to compare</li>
          </ol>
        </div>

        <div>
          <h4 className="font-medium mb-2">Expected Behavior:</h4>
          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
            <li>Sidebar shows only modules the user has permissions for</li>
            <li>Dashboard pages show exactly the same modules as the sidebar</li>
            <li>Module counts and names should match between sidebar and dashboard</li>
            <li>No module should appear in one place but not the other</li>
          </ul>
        </div>

        <button
          onClick={() => logNavigationSync(hasPermission)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Re-run Sync Check
        </button>
      </div>
    </div>
  );
}
