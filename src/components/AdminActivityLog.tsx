import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import MobileCardList from '@/components/MobileCardList';
import PaginationControls from '@/components/PaginationControls';
import { usePagination } from '@/hooks/use-pagination';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ClipboardList } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  created_at: string;
}

interface AdminProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AdminActivityLogProps {
  searchQuery: string;
  dateFilters: { month: number | null; date: Date | null };
}

const getActionBadge = (action: string) => {
  if (action.startsWith('Approved')) return <Badge className="bg-success text-success-foreground text-[10px]">Approved</Badge>;
  if (action.startsWith('Denied')) return <Badge variant="destructive" className="text-[10px]">Denied</Badge>;
  if (action.startsWith('Registered')) return <Badge className="bg-primary text-primary-foreground text-[10px]">Registered</Badge>;
  if (action.startsWith('Edited')) return <Badge variant="secondary" className="text-[10px]">Edited</Badge>;
  if (action.startsWith('Moved') || action.startsWith('Permanently')) return <Badge variant="outline" className="text-[10px] text-destructive border-destructive">Deleted</Badge>;
  if (action.startsWith('Restored')) return <Badge variant="outline" className="text-[10px]">Restored</Badge>;
  if (action.startsWith('Created')) return <Badge className="bg-primary text-primary-foreground text-[10px]">Created</Badge>;
  if (action === 'login' || action === 'logout') return null;
  return <Badge variant="secondary" className="text-[10px]">Action</Badge>;
};

/** Extract the resident/entity name from the action string (after the colon) */
const extractResidentName = (action: string): string => {
  const colonIndex = action.indexOf(':');
  if (colonIndex !== -1) {
    return action.substring(colonIndex + 1).trim();
  }
  return '—';
};

const AdminActivityLog: React.FC<AdminActivityLogProps> = ({ searchQuery, dateFilters }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [adminProfiles, setAdminProfiles] = useState<Record<string, AdminProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });
      const adminLogs = (data || []).filter(
        (log: ActivityLog) => log.action !== 'login' && log.action !== 'logout'
      );
      setLogs(adminLogs);

      // Fetch admin profiles for performed-by column
      const uniqueUserIds = [...new Set(adminLogs.map(l => l.user_id))];
      if (uniqueUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', uniqueUserIds);
        const profileMap: Record<string, AdminProfile> = {};
        (profiles || []).forEach(p => { profileMap[p.user_id] = p; });
        setAdminProfiles(profileMap);
      }
      setLoading(false);
    };
    fetchLogs();

    const channel = supabase
      .channel('admin-activity-logs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_logs' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getAdminName = (userId: string) => {
    const p = adminProfiles[userId];
    return p ? `${p.first_name} ${p.last_name}`.trim() || p.email : '—';
  };

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => log.action.toLowerCase().includes(q));
    }
    if (dateFilters.month !== null) {
      result = result.filter(log => new Date(log.created_at).getMonth() === dateFilters.month);
    }
    if (dateFilters.date) {
      const fd = dateFilters.date;
      result = result.filter(log => {
        const d = new Date(log.created_at);
        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate();
      });
    }
    return result;
  }, [logs, searchQuery, dateFilters]);

  const { paginatedItems, currentPage, totalPages, goToPage, startIndex, endIndex, totalItems } = usePagination(filteredLogs);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground text-sm">Loading admin activity...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
        <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2">
          <ClipboardList className="h-4 w-4" />
          Admin Activity Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Mobile */}
        <div className="sm:hidden">
          <MobileCardList
            emptyMessage="No admin activity recorded yet."
            items={paginatedItems.map((log) => ({
              key: log.id,
              fields: [
                { label: 'Type', value: getActionBadge(log.action) || 'Action' },
                { label: 'Resident/Entity', value: extractResidentName(log.action) },
                { label: 'Action', value: log.action },
                { label: 'Performed By', value: getAdminName(log.user_id) },
                { label: 'Date & Time', value: format(new Date(log.created_at), 'MMM dd, yyyy hh:mm a') },
              ],
            }))}
          />
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs px-4">DATE & TIME</TableHead>
                <TableHead className="text-xs px-4">TYPE</TableHead>
                <TableHead className="text-xs px-4">RESIDENT / ENTITY</TableHead>
                <TableHead className="text-xs px-4">ACTION</TableHead>
                <TableHead className="text-xs px-4">PERFORMED BY</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="text-sm px-4 py-4 whitespace-nowrap">
                    {format(new Date(log.created_at), 'MMM dd, yyyy hh:mm a')}
                  </TableCell>
                  <TableCell className="px-4 py-4">{getActionBadge(log.action)}</TableCell>
                  <TableCell className="text-sm px-4 py-4 font-medium">{extractResidentName(log.action)}</TableCell>
                  <TableCell className="text-sm px-4 py-4">{log.action}</TableCell>
                  <TableCell className="text-sm px-4 py-4 text-muted-foreground">{getAdminName(log.user_id)}</TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8 text-sm">
                    No admin activity recorded yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          startIndex={startIndex}
          endIndex={endIndex}
          totalItems={totalItems}
        />
      </CardContent>
    </Card>
  );
};

export default AdminActivityLog;
