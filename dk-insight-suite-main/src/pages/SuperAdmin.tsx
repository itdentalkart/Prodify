import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Building2, Users, Monitor, Key, Loader2, Edit, Search, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';
import { Navigate } from 'react-router-dom';

interface TenantData {
  id: string;
  name: string;
  domain: string | null;
  created_at: string | null;
  license: {
    total_device_licenses: number;
    used_device_licenses: number;
    status: string;
  } | null;
  user_count: number;
  device_count: number;
}

export default function SuperAdmin() {
  const { isSuperAdmin, loading: roleLoading } = useUserRole();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLicense, setEditingLicense] = useState<TenantData | null>(null);
  const [licenseCount, setLicenseCount] = useState('');
  const [licenseStatus, setLicenseStatus] = useState('active');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchTenants = async () => {
    try {
      setLoading(true);

      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (orgsError) throw orgsError;

      const { data: licenses } = await supabase
        .from('licenses')
        .select('*');

      const { data: profiles } = await supabase
        .from('profiles')
        .select('org_id');

      const { data: devices } = await supabase
        .from('devices')
        .select('org_id');

      const licensesMap = new Map(licenses?.map(l => [l.org_id, l]) || []);

      const userCounts = new Map<string, number>();
      profiles?.forEach(p => {
        if (p.org_id) userCounts.set(p.org_id, (userCounts.get(p.org_id) || 0) + 1);
      });

      const deviceCounts = new Map<string, number>();
      devices?.forEach(d => {
        if (d.org_id) deviceCounts.set(d.org_id, (deviceCounts.get(d.org_id) || 0) + 1);
      });

      const tenantsData: TenantData[] = (orgs || []).map(org => {
        const license = licensesMap.get(org.id);
        return {
          id: org.id,
          name: org.name,
          domain: org.domain,
          created_at: org.created_at,
          license: license ? {
            total_device_licenses: license.total_device_licenses,
            used_device_licenses: license.used_device_licenses,
            status: license.status,
          } : null,
          user_count: userCounts.get(org.id) || 0,
          device_count: deviceCounts.get(org.id) || 0,
        };
      });

      setTenants(tenantsData);
    } catch (error: any) {
      console.error('Error fetching tenants:', error);
      toast({ title: 'Error', description: 'Failed to load tenants', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) fetchTenants();
  }, [isSuperAdmin]);

  const handleSaveLicense = async () => {
    if (!editingLicense) return;
    setSaving(true);

    try {
      const totalLicenses = parseInt(licenseCount) || 0;

      const { data: existing } = await supabase
        .from('licenses')
        .select('id')
        .eq('org_id', editingLicense.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('licenses')
          .update({ total_device_licenses: totalLicenses, status: licenseStatus })
          .eq('org_id', editingLicense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('licenses')
          .insert({ org_id: editingLicense.id, total_device_licenses: totalLicenses, status: licenseStatus });
        if (error) throw error;
      }

      toast({ title: 'Success', description: `License updated for ${editingLicense.name}` });
      setEditingLicense(null);
      fetchTenants();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return (
      <MainLayout title="Super Admin" subtitle="Loading...">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.domain || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOrgs = tenants.length;
  const totalDevices = tenants.reduce((sum, t) => sum + t.device_count, 0);
  const totalUsers = tenants.reduce((sum, t) => sum + t.user_count, 0);
  const totalLicenses = tenants.reduce((sum, t) => sum + (t.license?.total_device_licenses || 0), 0);

  return (
    <MainLayout title="Super Admin Panel" subtitle="Manage all tenants, licenses, and organizations">
      <div className="space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold">{totalOrgs}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{totalUsers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-bold">{totalDevices}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Key className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Licenses</p>
                  <p className="text-2xl font-bold">{totalLicenses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  All Tenants
                </CardTitle>
                <CardDescription>Manage organizations and their device licenses</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No tenants found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Devices</TableHead>
                    <TableHead>Licenses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          {tenant.domain && (
                            <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{tenant.user_count}</TableCell>
                      <TableCell>{tenant.device_count}</TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {tenant.license
                            ? `${tenant.license.used_device_licenses}/${tenant.license.total_device_licenses}`
                            : '0/0'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          tenant.license?.status === 'active' ? 'default' :
                          tenant.license?.status === 'suspended' ? 'destructive' : 'secondary'
                        }>
                          {tenant.license?.status || 'No License'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tenant.created_at ? format(new Date(tenant.created_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingLicense(tenant);
                                setLicenseCount(String(tenant.license?.total_device_licenses || 0));
                                setLicenseStatus(tenant.license?.status || 'active');
                              }}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Manage
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage License — {tenant.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label>Total Device Licenses</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={licenseCount}
                                  onChange={(e) => setLicenseCount(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                  Currently using {tenant.license?.used_device_licenses || 0} devices
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={licenseStatus} onValueChange={setLicenseStatus}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="suspended">Suspended</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={handleSaveLicense} disabled={saving} className="w-full">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Save License
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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
