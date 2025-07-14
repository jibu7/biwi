'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, Building, Settings, Search } from 'lucide-react';
import { platformService, PlatformUser } from '@/services/platformService';
import { UserDialog } from '@/components/platform/UserDialog';
import { UserActions } from '@/components/platform/UserActions';

export default function PlatformUsersPage() {
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [companyFilter, setCompanyFilter] = useState('all');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<PlatformUser | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');

  // Fetch user statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-user-stats'],
    queryFn: platformService.getUserStats,
    refetchInterval: 30000,
  });

  // Fetch users with filters
  const { data: users, isLoading: usersLoading, refetch } = useQuery({
    queryKey: ['platform-users', search, userTypeFilter, companyFilter],
    queryFn: () => platformService.getUsers({
      search: search || undefined,
      user_type: userTypeFilter === 'all' ? undefined : userTypeFilter,
      company_id: companyFilter === 'all' ? undefined : parseInt(companyFilter),
      limit: 100,
    }),
    enabled: true,
  });

  // Fetch companies for filter
  const { data: companies } = useQuery({
    queryKey: ['platform-companies-for-filter'],
    queryFn: () => platformService.getCompanies({ limit: 1000 }),
  });

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setDialogMode('create');
    setUserDialogOpen(true);
  };

  const handleEditUser = (user: PlatformUser) => {
    setSelectedUser(user);
    setDialogMode('edit');
    setUserDialogOpen(true);
  };

  if (statsLoading || usersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="mt-2 text-gray-600">
            Manage users across all tenant companies
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.total_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all companies
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Admins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.platform_admins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Full platform access
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Admins</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.company_admins || 0}</div>
            <p className="text-xs text-muted-foreground">
              Company administrators
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Company Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.company_users || 0}</div>
            <p className="text-xs text-muted-foreground">
              Regular users
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.active_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Users logged in today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={userTypeFilter} onChange={(e) => setUserTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="platform_admin">Platform Admin</option>
          <option value="company_admin">Company Admin</option>
          <option value="company_user">Company User</option>
        </Select>
        <Select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
          <option value="all">All Companies</option>
          {companies?.map((comp) => (
            <option key={comp.company.id} value={comp.company.id.toString()}>
              {comp.company.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">User Type</th>
                  <th className="text-left p-2">Company</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Login</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{user.full_name}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2">
                      <Badge variant={
                        user.user_type === 'platform_admin' ? 'destructive' :
                        user.user_type === 'company_admin' ? 'default' : 'secondary'
                      }>
                        {user.user_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {user.company_name ? (
                        <div>
                          <div className="font-medium">{user.company_name}</div>
                          <div className="text-sm text-gray-500">{user.company_code}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No Company</span>
                      )}
                    </td>
                    <td className="p-2">
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-2">
                      {user.last_login ? (
                        <div className="text-sm">
                          {new Date(user.last_login).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="p-2">
                      <UserActions 
                        user={user} 
                        onEdit={handleEditUser}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* User Dialog */}
      <UserDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={selectedUser}
        companies={companies || []}
        mode={dialogMode}
      />

      <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span>New user registration</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Admin role assigned</span>
                <span className="text-muted-foreground">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>User deactivated</span>
                <span className="text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Bulk user import</span>
                <span className="text-muted-foreground">2 days ago</span>
              </div>          </div>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            User management features will be implemented here. For now, you can access user data through the API endpoints.
          </p>
          <div className="flex gap-2">
            <Button variant="outline">Export User List</Button>
            <Button variant="outline">Import Users</Button>
            <Button variant="outline">User Activity Report</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
