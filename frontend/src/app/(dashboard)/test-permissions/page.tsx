'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/store/authStore';

export default function TestPermissionsPage() {
  const { user } = useAuth();
  const { permissions, roles, hasPermission, hasAnyPermission } = usePermissions();

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Permission Debug / Test Page</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Current User Info</h2>
        <div className="space-y-2">
          <p><strong>User ID:</strong> {user?.id}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Full Name:</strong> {user?.full_name}</p>
          <p><strong>Is Superuser:</strong> {user?.is_superuser ? 'Yes' : 'No'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">User Roles (from JWT Token)</h2>
        {roles.length > 0 ? (
          <ul className="space-y-2">
            {roles.map((role) => (
              <li key={role.id} className="bg-blue-50 p-2 rounded">
                <strong>ID:</strong> {role.id}, <strong>Name:</strong> {role.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No roles assigned</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">User Permissions (from JWT Token)</h2>
        {permissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {permissions.map((permission) => (
              <div key={permission} className="bg-green-50 p-2 rounded border">
                {permission}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No permissions found</p>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Permission Tests</h2>
        <div className="space-y-2">
          <p><strong>Can manage currencies:</strong> {hasPermission('currency.manage') ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Can read users:</strong> {hasPermission('user.read') ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Can access any inventory permission:</strong> {hasAnyPermission(['inventory.read', 'inventory.create', 'inventory.update']) ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Can access branches:</strong> {hasPermission('branch.read') ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-lg font-semibold mb-2 text-yellow-800">Security Note</h2>
        <p className="text-yellow-700">
          🔒 This page shows permissions loaded from the JWT token payload - this is the <strong>secure approach</strong> for ERP systems. 
          Permissions are embedded in the authentication token and don't require separate API calls that could expose system information.
        </p>
      </div>
    </div>
  );
}
