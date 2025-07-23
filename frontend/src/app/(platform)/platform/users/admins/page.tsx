'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  UserPlus, 
  Search, 
  Crown, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Key,
  Settings,
  Edit2,
  Eye,
  Trash2
} from 'lucide-react';
import { platformService, PlatformUser } from '@/services/platformService';
import { UserDialog } from '@/components/platform/UserDialog';
import { toast } from 'sonner';

export default function PlatformAdminsPage() {
  const [search, setSearch] = useState('');
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<PlatformUser | undefined>();
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const queryClient = useQueryClient();

  // Fetch platform admin statistics
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['platform-user-stats'],
    queryFn: () => platformService.getDashboardStats(),
    refetchInterval: 30000,
  });

  // Fetch platform admins only
  const { data: admins, isLoading: adminsLoading, refetch } = useQuery({
    queryKey: ['platform-admins', search],
    queryFn: () => platformService.getUsers({
      search: search || undefined,
      user_type: 'platform_admin',
      limit: 100,
    }),
    enabled: true,
  });

  // Delete admin mutation
  const deleteAdminMutation = useMutation({
    mutationFn: (userId: number) => platformService.deleteUser(userId),
    onSuccess: () => {
      toast.success('Platform admin deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
      queryClient.invalidateQueries({ queryKey: ['platform-user-stats'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete admin');
    },
  });

  // Toggle admin status mutation
  const toggleAdminStatusMutation = useMutation({
    mutationFn: (data: { userId: number; is_active: boolean }) => 
      platformService.updateUser(data.userId, { is_active: data.is_active }),
    onSuccess: (_, variables) => {
      toast.success(`Admin ${variables.is_active ? 'activated' : 'deactivated'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['platform-admins'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update admin status');
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleCreateAdmin = () => {
    setSelectedAdmin(undefined);
    setDialogMode('create');
    setUserDialogOpen(true);
  };

  const handleEditAdmin = (admin: PlatformUser) => {
    setSelectedAdmin(admin);
    setDialogMode('edit');
    setUserDialogOpen(true);
  };

  const handleDeleteAdmin = (admin: PlatformUser) => {
    if (window.confirm(`Are you sure you want to delete platform admin "${admin.full_name || admin.email}"? This action cannot be undone.`)) {
      deleteAdminMutation.mutate(admin.id);
    }
  };

  const handleToggleStatus = (admin: PlatformUser) => {
    const newStatus = !admin.is_active;
    if (window.confirm(`Are you sure you want to ${newStatus ? 'activate' : 'deactivate'} this platform admin?`)) {
      toggleAdminStatusMutation.mutate({ userId: admin.id, is_active: newStatus });
    }
  };

  if (statsLoading || adminsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-slate-600 animate-pulse">Loading platform administrators...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-900 to-red-700 bg-clip-text text-transparent">
              Platform Administration
            </h1>
            <p className="text-slate-600 mt-2">
              Manage platform administrators with full system access and control
            </p>
          </div>
          <Button onClick={handleCreateAdmin} className="gap-2 bg-red-600 hover:bg-red-700">
            <UserPlus className="h-4 w-4" />
            Add Platform Admin
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Total Admins
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 mb-2">
                {userStats?.platform_admins || 0}
              </div>
              <div className="text-sm text-slate-600">
                Platform administrators
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Active Admins
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                {admins?.filter((admin: any) => admin.is_active).length || 0}
              </div>
              <div className="text-sm text-slate-600">
                Currently active
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Inactive Admins
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {admins?.filter((admin: any) => !admin.is_active).length || 0}
              </div>
              <div className="text-sm text-slate-600">
                Deactivated accounts
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg font-semibold text-slate-800">
                    Recent Logins
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {admins?.filter((admin: any) => {
                  if (!admin.last_login) return false;
                  const lastLogin = new Date(admin.last_login);
                  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                  return lastLogin > dayAgo;
                }).length || 0}
              </div>
              <div className="text-sm text-slate-600">
                Last 24 hours
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Controls */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search platform administrators..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Shield className="h-4 w-4" />
                {admins?.length || 0} administrators
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Admins Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {admins?.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-600 mb-2">No Platform Administrators Found</h3>
              <p className="text-slate-500 mb-4">
                {search ? 'No administrators match your search criteria.' : 'There are no platform administrators yet.'}
              </p>
              <Button onClick={handleCreateAdmin} className="bg-red-600 hover:bg-red-700">
                <UserPlus className="h-4 w-4 mr-2" />
                Add First Admin
              </Button>
            </div>
          ) : (
            admins?.map((admin: any) => (
              <Card 
                key={admin.id} 
                className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 ${
                  admin.is_active ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl shadow-sm ${
                        admin.is_active 
                          ? 'bg-gradient-to-br from-red-500 to-red-600' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-500'
                      }`}>
                        <Crown className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {admin.full_name || 'Unnamed Admin'}
                        </h3>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                    <Badge 
                      className={`text-xs ${
                        admin.is_active 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}
                    >
                      {admin.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Admin Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Role</span>
                      <div className="flex items-center gap-1 text-red-600 font-medium">
                        <Shield className="h-3 w-3" />
                        Platform Administrator
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Last Login</span>
                      <span className="text-slate-900 font-medium">
                        {admin.last_login ? (
                          new Date(admin.last_login).toLocaleDateString()
                        ) : (
                          'Never'
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Created</span>
                      <span className="text-slate-900 font-medium">
                        {admin.created_at ? (
                          new Date(admin.created_at).toLocaleDateString()
                        ) : (
                          'Unknown'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => handleEditAdmin(admin)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 text-xs"
                      onClick={() => handleToggleStatus(admin)}
                      disabled={toggleAdminStatusMutation.isPending}
                    >
                      {admin.is_active ? (
                        <>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteAdmin(admin)}
                      disabled={deleteAdminMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Security Notice */}
        <Card className="border border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Security Notice</h3>
                <p className="text-sm text-orange-800 mb-3">
                  Platform administrators have full access to all system resources, including the ability to manage companies, users, and system settings. 
                  Only grant platform administrator privileges to trusted individuals.
                </p>
                <div className="flex flex-wrap gap-4 text-xs text-orange-700">
                  <div className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Full system access
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    User management
                  </div>
                  <div className="flex items-center gap-1">
                    <Settings className="h-3 w-3" />
                    System configuration
                  </div>
                  <div className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Security controls
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Dialog */}
        <UserDialog
          open={userDialogOpen}
          onOpenChange={setUserDialogOpen}
          user={selectedAdmin}
          companies={[]} // Platform admins don't belong to companies
          mode={dialogMode}
          defaultUserType="platform_admin"
        />
      </div>
    </div>
  );
}