'use client';


import { useAuth } from '@/store/authStore';
import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';

export default function DebugUserPermissions() {
  const { user } = useAuth();

  const { data: userRoles, error: userRolesError, isLoading: userRolesLoading } = useQuery({
    queryKey: ['debugUserRoles', user?.id],
    queryFn: () => userService.getUserRoles(user?.id || 0),
    enabled: !!user?.id,
  });

  const { data: allRoles, error: allRolesError } = useQuery({
    queryKey: ['debugAllRoles'],
    queryFn: () => roleService.getRoles(),
    enabled: !!user,
  });

  if (!user) {
    return <div className="p-6">Please log in to view debug info</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-lg font-bold mb-4">Debug: User Permissions</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Current User:</h3>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div>
          <h3 className="font-semibold">User Roles API Call:</h3>
          {userRolesLoading && <p>Loading user roles...</p>}
          {userRolesError && (
            <div className="text-red-600">
              <p>Error: {typeof userRolesError === 'object' && userRolesError !== null && 'message' in userRolesError ? (userRolesError as { message?: string }).message : String(userRolesError)}</p>
              <pre className="text-xs bg-red-50 p-2 rounded mt-2">
                {JSON.stringify(userRolesError, null, 2)}
              </pre>
            </div>
          )}
          {userRoles && (
            <pre className="text-sm bg-green-50 p-2 rounded">
              {JSON.stringify(userRoles, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <h3 className="font-semibold">All Available Roles:</h3>
          {allRolesError && (
            <div className="text-red-600">
              <p>Error: {typeof allRolesError === 'object' && allRolesError !== null && 'message' in allRolesError ? (allRolesError as { message?: string }).message : String(allRolesError)}</p>
            </div>
          )}
          {allRoles && (
            <pre className="text-sm bg-blue-50 p-2 rounded">
              {JSON.stringify(allRoles, null, 2)}
            </pre>
          )}
        </div>

        <div>
          <h3 className="font-semibold">Expected Permissions:</h3>
          <p>User should have: <code>common:setup_currencies</code></p>
          <p>User should see: Currencies option in System &amp; Company</p>
        </div>
      </div>
    </div>
  );
}
