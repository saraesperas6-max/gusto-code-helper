import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Resident, Official, UserRole } from '@/types/barangay';

interface AuthContextType {
  currentUser: Resident | Official | null;
  userRole: UserRole | null;
  login: (email: string, password: string, role: UserRole) => boolean;
  logout: () => void;
  registerResident: (resident: Omit<Resident, 'id' | 'status' | 'createdAt'>) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockOfficials: Official[] = [
  { id: '1', name: 'Rose', email: 'rose@barangay.gov', password: 'admin123' },
  { id: '2', name: 'Admin', email: 'admin@barangay.gov', password: 'admin123' },
];

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
    status: 'Active',
    createdAt: new Date('2024-03-01'),
  },
];

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Resident | Official | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [residents, setResidents] = useState<Resident[]>(initialResidents);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('brgy_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setCurrentUser(session.user);
        setUserRole(session.role);
      } catch {
        localStorage.removeItem('brgy_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string, role: UserRole): boolean => {
    if (role === 'official') {
      const official = mockOfficials.find(
        (o) => o.email.toLowerCase() === email.toLowerCase() && o.password === password
      );
      if (official) {
        setCurrentUser(official);
        setUserRole('official');
        localStorage.setItem('brgy_session', JSON.stringify({ user: official, role: 'official' }));
        return true;
      }
    } else {
      const resident = residents.find(
        (r) => r.email.toLowerCase() === email.toLowerCase() && r.password === password && r.status === 'Active'
      );
      if (resident) {
        setCurrentUser(resident);
        setUserRole('resident');
        localStorage.setItem('brgy_session', JSON.stringify({ user: resident, role: 'resident' }));
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRole(null);
    localStorage.removeItem('brgy_session');
  };

  const registerResident = (residentData: Omit<Resident, 'id' | 'status' | 'createdAt'>): boolean => {
    const exists = residents.some(
      (r) => r.email.toLowerCase() === residentData.email.toLowerCase()
    );
    if (exists) return false;

    const newResident: Resident = {
      ...residentData,
      id: Date.now().toString(),
      status: 'Active',
      createdAt: new Date(),
    };
    setResidents([...residents, newResident]);
    return true;
  };

  return (
    <AuthContext.Provider value={{ currentUser, userRole, login, logout, registerResident, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { initialResidents };
