import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, Profile } from '@/context/AuthContext';
import { Resident, CertificateRequest, Notification, ResidentStatus, RequestStatus, CertificateType } from '@/types/barangay';

interface DataContextType {
  residents: Resident[];
  trashedResidents: Resident[];
  requests: CertificateRequest[];
  trashedRequests: CertificateRequest[];
  notifications: Notification[];
  addResident: (resident: { lastName: string; firstName: string; middleName?: string; age: number; address: string; contact: string; email: string; password: string; status: ResidentStatus }) => Promise<void>;
  updateResident: (id: string, data: Partial<Resident>) => Promise<void>;
  deleteResident: (id: string) => Promise<void>;
  softDeleteResident: (id: string) => Promise<void>;
  restoreResident: (id: string) => Promise<void>;
  permanentlyDeleteResident: (id: string) => Promise<void>;
  approveResident: (id: string) => Promise<void>;
  addRequest: (request: Omit<CertificateRequest, 'id' | 'dateRequested'>) => Promise<void>;
  updateRequest: (id: string, data: { purpose?: string; notes?: string }) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;
  softDeleteRequest: (id: string) => Promise<void>;
  restoreRequest: (id: string) => Promise<void>;
  permanentlyDeleteRequest: (id: string) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  getResidentRequests: (residentId: string) => CertificateRequest[];
  getTrashedRequests: (residentId: string) => CertificateRequest[];
  getPendingCount: () => number;
  getTotalResidents: () => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const mapProfileToResident = (p: Profile): Resident => ({
  id: p.user_id,
  lastName: p.last_name,
  firstName: p.first_name,
  middleName: p.middle_name || undefined,
  age: p.age || 0,
  address: p.address || '',
  contact: p.contact || '',
  email: p.email,
  password: '',
  status: p.status as ResidentStatus,
  createdAt: new Date(p.created_at),
  avatarUrl: p.avatar_url || undefined,
  dateOfBirth: p.date_of_birth || undefined,
});

const mapDbRequest = (r: any, profileMap: Record<string, Profile>): CertificateRequest & { denialReason?: string } => {
  const profile = profileMap[r.resident_id];
  const name = profile
    ? `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim()
    : 'Unknown';
  return {
    id: r.id,
    residentId: r.resident_id,
    residentName: name,
    certificateType: r.certificate_type as CertificateType,
    purpose: r.purpose,
    notes: r.notes || undefined,
    status: r.status as RequestStatus,
    dateRequested: new Date(r.date_requested),
    dateProcessed: r.date_processed ? new Date(r.date_processed) : undefined,
    validIdFile: r.valid_id_file || undefined,
    uploadedPhotos: r.documents && Array.isArray(r.documents) && r.documents.length > 0 ? r.documents as string[] : undefined,
    denialReason: r.denial_reason || undefined,
  };
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, userRole } = useAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [trashedResidents, setTrashedResidents] = useState<Resident[]>([]);
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [trashedRequests, setTrashedRequests] = useState<CertificateRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const readNotificationIdsRef = useRef<Set<string>>(new Set());
  const profileMapRef = useRef<Record<string, Profile>>({});
  const realtimeRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Build notifications from current data without triggering refetch
  const buildNotifications = useCallback(
    (
      mappedRequests: CertificateRequest[],
      activeProfiles: Profile[],
      options?: { includeResidentNotifications?: boolean }
    ) => {
      const readIds = readNotificationIdsRef.current;

      const requestNotifications: Notification[] = mappedRequests.slice(0, 10).map((r: CertificateRequest) => {
        let title = 'Request Update';
        let description = `${r.residentName} — ${r.certificateType}`;

        if (r.status === 'Pending') {
          title = 'New Request';
        } else if (r.status === 'Approved') {
          title = 'Certificate Approved';
          description = `${r.residentName} — ${r.certificateType}. Please claim within 3 days.`;
        } else if (r.status === 'Denied') {
          title = 'Request Denied';
          description = `${r.residentName} — ${r.certificateType}${(r as any).denialReason ? `. Reason: ${(r as any).denialReason}` : ''}`;
        }

        return {
          id: r.id,
          title,
          description,
          type:
            r.status === 'Pending'
              ? ('pending' as const)
              : r.status === 'Approved'
                ? ('approved' as const)
                : r.status === 'Denied'
                  ? ('denied' as const)
                  : ('info' as const),
          time: r.dateRequested.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          read: readIds.has(r.id),
          requestId: r.id,
        };
      });

      if (!options?.includeResidentNotifications) {
        return requestNotifications;
      }

      const pendingResidents = activeProfiles.filter((p) => p.status === 'Pending Approval');
      const residentNotifications: Notification[] = pendingResidents.map((p) => ({
        id: `resident-${p.user_id}`,
        title: 'New Resident Registration',
        description: `${p.first_name} ${p.last_name} has registered and is awaiting approval.`,
        type: 'pending' as const,
        time: new Date(p.created_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }),
        read: readIds.has(`resident-${p.user_id}`),
      }));

      return [...residentNotifications, ...requestNotifications];
    },
    []
  );

  const fetchData = useCallback(async () => {
    if (!user || !userRole) return;

    try {
      const isResident = userRole === 'resident';

      const profilesQuery = isResident
        ? supabase.from('profiles').select('*').eq('user_id', user.id).is('deleted_at', null)
        : supabase.from('profiles').select('*');

      let activeReqQuery = supabase
        .from('certificate_requests')
        .select('*')
        .is('deleted_at', null)
        .order('date_requested', { ascending: false });

      let trashedReqQuery = supabase
        .from('certificate_requests')
        .select('*')
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (isResident) {
        activeReqQuery = activeReqQuery.eq('resident_id', user.id);
        trashedReqQuery = trashedReqQuery.eq('resident_id', user.id);
      }

      const [profilesResult, requestsResult, trashedResult] = await Promise.all([
        profilesQuery,
        activeReqQuery,
        trashedReqQuery,
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (requestsResult.error) throw requestsResult.error;
      if (trashedResult.error) throw trashedResult.error;

      const profiles = (profilesResult.data || []) as unknown as Profile[];
      const profileMap: Record<string, Profile> = {};
      profiles.forEach((p) => {
        profileMap[p.user_id] = p;
      });
      profileMapRef.current = profileMap;

      const activeProfiles = profiles.filter((p) => !(p as any).deleted_at);
      const deletedProfiles = profiles.filter((p) => !!(p as any).deleted_at);
      setResidents(activeProfiles.map(mapProfileToResident));
      setTrashedResidents(deletedProfiles.map(mapProfileToResident));

      const mappedRequests = (requestsResult.data || []).map((r: any) => mapDbRequest(r, profileMap));
      setRequests(mappedRequests);
      setTrashedRequests((trashedResult.data || []).map((r: any) => mapDbRequest(r, profileMap)));

      setNotifications(
        buildNotifications(mappedRequests, activeProfiles, {
          includeResidentNotifications: !isResident,
        })
      );
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  }, [user, userRole, buildNotifications]);

  useEffect(() => {
    if (user && userRole) {
      fetchData();
    } else {
      setResidents([]);
      setTrashedResidents([]);
      setRequests([]);
      setTrashedRequests([]);
      setNotifications([]);
    }
  }, [user, userRole, fetchData]);

  // Realtime subscriptions for live updates
  useEffect(() => {
    if (!user || !userRole) return;

    const handleRealtimeChange = () => {
      if (realtimeRefreshTimerRef.current) {
        clearTimeout(realtimeRefreshTimerRef.current);
      }
      realtimeRefreshTimerRef.current = setTimeout(() => {
        fetchData();
        realtimeRefreshTimerRef.current = null;
      }, 250);
    };

    const channel = supabase
      .channel('data-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, handleRealtimeChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'certificate_requests' }, handleRealtimeChange)
      .subscribe();

    return () => {
      if (realtimeRefreshTimerRef.current) {
        clearTimeout(realtimeRefreshTimerRef.current);
        realtimeRefreshTimerRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [user, userRole, fetchData]);

  const addResident = async (residentData: { lastName: string; firstName: string; middleName?: string; age: number; address: string; contact: string; email: string; password: string; status: ResidentStatus }) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: {
        action: 'create',
        email: residentData.email,
        password: residentData.password,
        firstName: residentData.firstName,
        lastName: residentData.lastName,
        middleName: residentData.middleName,
        age: residentData.age,
        address: residentData.address,
        contact: residentData.contact,
      },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    await fetchData();
  };

  const updateResident = async (userId: string, data: Partial<Resident>) => {
    const updateData: any = {};
    if (data.firstName !== undefined) updateData.first_name = data.firstName;
    if (data.lastName !== undefined) updateData.last_name = data.lastName;
    if (data.middleName !== undefined) updateData.middle_name = data.middleName || null;
    if (data.age !== undefined) updateData.age = data.age;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.contact !== undefined) updateData.contact = data.contact;

    await supabase.from('profiles').update(updateData).eq('user_id', userId);
    await fetchData();
  };

  const deleteResident = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    await fetchData();
  };

  const softDeleteResident = async (userId: string) => {
    await supabase.from('profiles').update({ deleted_at: new Date().toISOString() } as any).eq('user_id', userId);
    await fetchData();
  };

  const restoreResident = async (userId: string) => {
    await supabase.from('profiles').update({ deleted_at: null } as any).eq('user_id', userId);
    await fetchData();
  };

  const permanentlyDeleteResident = async (userId: string) => {
    const { data, error } = await supabase.functions.invoke('admin-users', {
      body: { action: 'delete', userId },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    await fetchData();
  };

  const approveResident = async (userId: string) => {
    // Get resident profile for email
    const { data: profile } = await supabase.from('profiles').select('email, first_name, last_name').eq('user_id', userId).single();
    
    await supabase.from('profiles').update({ status: 'Active' }).eq('user_id', userId);

    // Send approval email notification
    if (profile?.email) {
      try {
        await supabase.functions.invoke('send-notification', {
          body: {
            type: 'resident-approved',
            residentEmail: profile.email,
            residentName: `${profile.first_name} ${profile.last_name}`.trim(),
          },
        });
      } catch (emailErr) {
        console.error('Failed to send approval email:', emailErr);
      }
    }

    await fetchData();
  };

  const addRequest = async (requestData: Omit<CertificateRequest, 'id' | 'dateRequested'>) => {
    const insertData: any = {
      resident_id: requestData.residentId,
      certificate_type: requestData.certificateType,
      purpose: requestData.purpose,
      notes: requestData.notes || null,
      status: requestData.status || 'Pending',
      valid_id_file: requestData.validIdFile || null,
      documents: requestData.uploadedPhotos || [],
    };

    await supabase.from('certificate_requests').insert(insertData);
    await fetchData();
  };

  const updateRequestStatus = async (id: string, status: RequestStatus) => {
    await supabase.from('certificate_requests').update({
      status,
      date_processed: new Date().toISOString(),
    }).eq('id', id);
    await fetchData();
  };

  const updateRequest = async (id: string, data: { purpose?: string; notes?: string }) => {
    const updateData: any = {};
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    await supabase.from('certificate_requests').update(updateData).eq('id', id);
    await fetchData();
  };

  const deleteRequest = async (id: string) => {
    await supabase.from('certificate_requests').delete().eq('id', id);
    await fetchData();
  };

  const softDeleteRequest = async (id: string) => {
    await supabase.from('certificate_requests').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    await fetchData();
  };

  const restoreRequest = async (id: string) => {
    await supabase.from('certificate_requests').update({ deleted_at: null }).eq('id', id);
    await fetchData();
  };

  const permanentlyDeleteRequest = async (id: string) => {
    await supabase.from('certificate_requests').delete().eq('id', id);
    await fetchData();
  };

  const getResidentRequests = (residentId: string) => {
    return requests.filter((r) => r.residentId === residentId);
  };

  const getTrashedRequests = (residentId: string) => {
    return trashedRequests.filter((r) => r.residentId === residentId);
  };

  const getPendingCount = () => {
    return requests.filter((r) => r.status === 'Pending').length;
  };

  const getTotalResidents = () => {
    return residents.filter((r) => r.status === 'Active').length;
  };

  const markNotificationRead = (id: string) => {
    readNotificationIdsRef.current.add(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    notifications.forEach((n) => readNotificationIdsRef.current.add(n.id));
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider value={{
      residents,
      trashedResidents,
      requests,
      trashedRequests,
      notifications,
      addResident,
      updateResident,
      deleteResident,
      softDeleteResident,
      restoreResident,
      permanentlyDeleteResident,
      approveResident,
      addRequest,
      updateRequest,
      deleteRequest,
      softDeleteRequest,
      restoreRequest,
      permanentlyDeleteRequest,
      updateRequestStatus,
      getResidentRequests,
      getTrashedRequests,
      getPendingCount,
      getTotalResidents,
      markNotificationRead,
      markAllNotificationsRead,
      refreshData: fetchData,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
