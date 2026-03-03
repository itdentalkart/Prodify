import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Copy, Trash2, Key, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface EnrollmentToken {
  id: string;
  token: string;
  org_id: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  used_by_device_id: string | null;
}

export default function EnrollmentTokens() {
  const [tokens, setTokens] = useState<EnrollmentToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expiryHours, setExpiryHours] = useState('24');
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollment_tokens')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      console.error('Error fetching tokens:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enrollment tokens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const generateToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let token = 'DK-';
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) token += '-';
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const createToken = async () => {
    if (!user) return;

    setCreating(true);
    try {
      // First get the user's org_id from their profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) throw profileError;
      
      if (!profile?.org_id) {
        toast({
          title: 'Organization Required',
          description: 'Please contact an administrator to set up your organization.',
          variant: 'destructive',
        });
        setCreating(false);
        return;
      }

      const token = generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + parseInt(expiryHours));

      const { error } = await supabase
        .from('enrollment_tokens')
        .insert({
          token,
          org_id: profile!.org_id,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: 'Token Created',
        description: 'New enrollment token has been generated.',
      });

      fetchTokens();
    } catch (error: any) {
      console.error('Error creating token:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create enrollment token',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteToken = async (id: string) => {
    try {
      const { error } = await supabase
        .from('enrollment_tokens')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Token Deleted',
        description: 'Enrollment token has been removed.',
      });

      setTokens(tokens.filter(t => t.id !== id));
    } catch (error: any) {
      console.error('Error deleting token:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete token',
        variant: 'destructive',
      });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    toast({
      title: 'Copied!',
      description: 'Token copied to clipboard.',
    });
  };

  const getTokenStatus = (token: EnrollmentToken) => {
    if (token.used_at) {
      return { status: 'used', label: 'Used', variant: 'secondary' as const };
    }
    if (new Date(token.expires_at) < new Date()) {
      return { status: 'expired', label: 'Expired', variant: 'destructive' as const };
    }
    return { status: 'active', label: 'Active', variant: 'default' as const };
  };

  return (
    <MainLayout title="Enrollment Tokens" subtitle="Generate and manage device enrollment tokens">
      <div className="space-y-6">
        {/* Create Token Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Generate New Token
            </CardTitle>
            <CardDescription>
              Create a one-time enrollment token for new device registration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label className="text-sm font-medium mb-2 block">Token Expiry</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="720"
                    value={expiryHours}
                    onChange={(e) => setExpiryHours(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">hours</span>
                </div>
              </div>
              <Button onClick={createToken} disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Generate Token
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tokens List */}
        <Card>
          <CardHeader>
            <CardTitle>Enrollment Tokens</CardTitle>
            <CardDescription>
              {tokens.length} token{tokens.length !== 1 ? 's' : ''} generated
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tokens.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No enrollment tokens yet</p>
                <p className="text-sm">Generate a token to enroll new devices</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => {
                    const { status, label, variant } = getTokenStatus(token);
                    return (
                      <TableRow key={token.id}>
                        <TableCell>
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                            {token.token}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={variant} className="gap-1">
                            {status === 'active' && <CheckCircle className="h-3 w-3" />}
                            {status === 'used' && <CheckCircle className="h-3 w-3" />}
                            {status === 'expired' && <XCircle className="h-3 w-3" />}
                            {label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(token.created_at), 'MMM d, yyyy HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(token.expires_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => copyToken(token.token)}
                              disabled={status !== 'active'}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteToken(token.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
