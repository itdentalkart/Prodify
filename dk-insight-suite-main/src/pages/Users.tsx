import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users as UsersIcon, Shield, Wrench, User, Monitor, Loader2 } from 'lucide-react';
import { useUsers } from '@/hooks/useUsers';
import { useUserRole } from '@/hooks/useUserRole';

export default function Users() {
  const { users, loading, updateUserRole } = useUsers();
  const { isAdmin } = useUserRole();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><Shield className="w-3 h-3 mr-1" /> Admin</Badge>;
      case 'it':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Wrench className="w-3 h-3 mr-1" /> IT</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><User className="w-3 h-3 mr-1" /> Employee</Badge>;
    }
  };

  const stats = {
    total: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    it: users.filter(u => u.role === 'it').length,
    employees: users.filter(u => u.role === 'employee').length,
  };

  if (loading) {
    return (
      <MainLayout title="Users" subtitle="Manage users in your organization">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Users" 
      subtitle="Manage users in your organization"
    >
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <UsersIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <Shield className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Admins</p>
                  <p className="text-2xl font-bold">{stats.admins}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Wrench className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">IT Staff</p>
                  <p className="text-2xl font-bold">{stats.it}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-500/10">
                  <User className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Employees</p>
                  <p className="text-2xl font-bold">{stats.employees}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle>Organization Users</CardTitle>
            <CardDescription>
              View and manage user roles in your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No users found in your organization</p>
                <p className="text-sm mt-1">Users will appear here after signing up</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Devices</TableHead>
                    {isAdmin && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => (
                    <TableRow key={userItem.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{userItem.display_name || 'Unnamed User'}</p>
                          <p className="text-sm text-muted-foreground">{userItem.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(userItem.role)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Monitor className="w-4 h-4" />
                          <span>{userItem.device_count}</span>
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Select
                            value={userItem.role}
                            onValueChange={(value: 'admin' | 'it' | 'employee') => 
                              updateUserRole(userItem.user_id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="it">IT</SelectItem>
                              <SelectItem value="employee">Employee</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
