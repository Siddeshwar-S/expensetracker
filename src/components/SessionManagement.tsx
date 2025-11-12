import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Activity, 
  Clock, 
  User, 
  Monitor, 
  RefreshCw, 
  XCircle,
  AlertCircle 
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ActiveSession {
  session_id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  user_is_active: boolean;
  session_started: string;
  last_activity: string;
  expires_at: string;
  hours_until_expiry: number;
  status: string;
}

interface SessionStats {
  total_active_sessions: number;
  unique_active_users: number;
  sessions_expiring_soon: number;
  avg_session_age_hours: number;
}

export const SessionManagement = () => {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Load active sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('active_user_sessions')
        .select('*')
        .order('session_started', { ascending: false });

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);

      // Load session stats
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_session_stats');

      if (statsError) {
        console.error('Error loading stats:', statsError);
      } else if (statsData && statsData.length > 0) {
        setStats(statsData[0]);
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load sessions. Make sure you have run the session tracking SQL migration.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleRevokeClick = (userId: string) => {
    setSelectedUserId(userId);
    setShowRevokeDialog(true);
  };

  const handleRevokeSessions = async () => {
    if (!selectedUserId) return;

    try {
      setRevoking(selectedUserId);
      
      const { data, error } = await supabase.rpc('admin_revoke_user_sessions', {
        target_user_id: selectedUserId
      });

      if (error) throw error;

      toast({
        title: 'Sessions Revoked',
        description: `Successfully revoked ${data} session(s)`,
      });

      // Reload sessions
      await loadSessions();
    } catch (error) {
      console.error('Error revoking sessions:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to revoke sessions',
      });
    } finally {
      setRevoking(null);
      setShowRevokeDialog(false);
      setSelectedUserId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                <span className="text-2xl font-bold">{stats.total_active_sessions}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-600" />
                <span className="text-2xl font-bold">{stats.unique_active_users}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="text-2xl font-bold">{stats.sessions_expiring_soon}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Avg Session Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-2xl font-bold">
                  {formatDuration(stats.avg_session_age_hours)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sessions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Active Sessions
              </CardTitle>
              <CardDescription>
                View and manage all active user sessions
              </CardDescription>
            </div>
            <Button
              onClick={loadSessions}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Monitor className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Expires In</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.session_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          {session.full_name || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>{session.email}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(session.session_started)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(session.last_activity)}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 text-sm ${
                            session.hours_until_expiry < 1
                              ? 'text-red-600'
                              : session.hours_until_expiry < 2
                              ? 'text-orange-600'
                              : 'text-gray-600'
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {formatDuration(session.hours_until_expiry)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            session.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {session.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleRevokeClick(session.user_id)}
                          variant="ghost"
                          size="sm"
                          disabled={revoking === session.user_id}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          {revoking === session.user_id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Revoke
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke User Sessions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out the user from all devices and invalidate all their active sessions.
              They will need to sign in again to access the application.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSessions}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Sessions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
