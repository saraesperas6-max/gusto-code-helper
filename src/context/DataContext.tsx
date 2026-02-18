import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Resident, CertificateRequest, Notification, ResidentStatus, RequestStatus, CertificateType } from '@/types/barangay';

interface DataContextType {
  residents: Resident[];
  requests: CertificateRequest[];
  notifications: Notification[];
  addResident: (resident: Omit<Resident, 'id' | 'createdAt'>) => void;
  updateResident: (id: string, data: Partial<Resident>) => void;
  deleteResident: (id: string) => void;
  approveResident: (id: string) => void;
  addRequest: (request: Omit<CertificateRequest, 'id' | 'dateRequested'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  getResidentRequests: (residentId: string) => CertificateRequest[];
  getPendingCount: () => number;
  getTotalResidents: () => number;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialResidents: Resident[] = [
  {
    id: '1',
    lastName: 'Dela Cruz',
    firstName: 'Juan',
    middleName: 'Perez',
    age: 30,
    address: '123 Rizal St, Palma-Urbano',
    contact: '09171234567',
    email: 'juan@email.com',
    password: 'password123',
    status: 'Active',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    lastName: 'Santos',
    firstName: 'Maria',
    middleName: 'Garcia',
    age: 25,
    address: '456 Mabini St, Palma-Urbano',
    contact: '09189876543',
    email: 'maria@email.com',
    password: 'password123',
    status: 'Active',
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    lastName: 'Reyes',
    firstName: 'Pedro',
    age: 45,
    address: '789 Luna St, Palma-Urbano',
    contact: '09201234567',
    email: 'pedro@email.com',
    password: 'password123',
    status: 'Pending Approval',
    createdAt: new Date('2024-03-01'),
  },
];

const initialRequests: CertificateRequest[] = [
  {
    id: '1',
    residentId: '1',
    residentName: 'Juan Perez Dela Cruz',
    certificateType: 'Barangay Clearance',
    purpose: 'For job application',
    status: 'Pending',
    dateRequested: new Date('2024-03-10'),
  },
  {
    id: '2',
    residentId: '2',
    residentName: 'Maria Garcia Santos',
    certificateType: 'Certificate of Indigency',
    purpose: 'For medical assistance',
    status: 'Approved',
    dateRequested: new Date('2024-03-08'),
    dateProcessed: new Date('2024-03-09'),
  },
];

const initialNotifications: Notification[] = [
  {
    id: '1',
    title: 'New Request',
    description: 'Juan Dela Cruz requested a Barangay Clearance',
    type: 'pending',
    time: '2 hours ago',
    read: false,
    requestId: '1',
  },
  {
    id: '2',
    title: 'Certificate Approved',
    description: 'Certificate of Indigency for Maria Santos has been approved',
    type: 'approved',
    time: '1 day ago',
    read: false,
    requestId: '2',
  },
  {
    id: '3',
    title: 'New Resident Signup',
    description: 'Pedro Reyes signed up and is pending approval',
    type: 'info',
    time: '2 days ago',
    read: false,
  },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [requests, setRequests] = useState<CertificateRequest[]>(initialRequests);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const addResident = (residentData: Omit<Resident, 'id' | 'createdAt'>) => {
    const newResident: Resident = {
      ...residentData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setResidents([...residents, newResident]);
  };

  const updateResident = (id: string, data: Partial<Resident>) => {
    setResidents(residents.map((r) => (r.id === id ? { ...r, ...data } : r)));
  };

  const deleteResident = (id: string) => {
    setResidents(residents.filter((r) => r.id !== id));
  };

  const approveResident = (id: string) => {
    setResidents(residents.map((r) => 
      r.id === id ? { ...r, status: 'Active' as ResidentStatus } : r
    ));
  };

  const addRequest = (requestData: Omit<CertificateRequest, 'id' | 'dateRequested'>) => {
    const newRequest: CertificateRequest = {
      ...requestData,
      id: Date.now().toString(),
      dateRequested: new Date(),
    };
    setRequests([...requests, newRequest]);
    
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'New Certificate Request',
      description: `${requestData.residentName} requested a ${requestData.certificateType}`,
      type: 'pending',
      time: 'Just now',
      read: false,
      requestId: newRequest.id,
    };
    setNotifications([newNotification, ...notifications]);
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    setRequests(requests.map((r) => 
      r.id === id ? { ...r, status, dateProcessed: new Date() } : r
    ));
  };

  const getResidentRequests = (residentId: string) => {
    return requests.filter((r) => r.residentId === residentId);
  };

  const getPendingCount = () => {
    return requests.filter((r) => r.status === 'Pending').length;
  };

  const getTotalResidents = () => {
    return residents.filter((r) => r.status === 'Active').length;
  };

  const markNotificationRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <DataContext.Provider value={{
      residents,
      requests,
      notifications,
      addResident,
      updateResident,
      deleteResident,
      approveResident,
      addRequest,
      updateRequestStatus,
      getResidentRequests,
      getPendingCount,
      getTotalResidents,
      markNotificationRead,
      markAllNotificationsRead,
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
