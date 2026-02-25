export type UserRole = 'official' | 'resident';

export type RequestStatus = 'Pending' | 'Approved' | 'Denied';

export type ResidentStatus = 'Pending Approval' | 'Active';

export type CertificateType = 
  | 'Barangay Clearance'
  | 'Certificate of Indigency'
  | 'Certificate of Residency'
  | 'Certificate of Low Income'
  | 'Oath of Undertaking'
  | 'Business Permit';

export interface Resident {
  id: string;
  lastName: string;
  firstName: string;
  middleName?: string;
  age: number;
  address: string;
  contact: string;
  email: string;
  password: string;
  status: ResidentStatus;
  avatarUrl?: string;
  createdAt: Date;
}

export interface CertificateRequest {
  id: string;
  residentId: string;
  residentName: string;
  certificateType: CertificateType;
  purpose: string;
  notes?: string;
  status: RequestStatus;
  dateRequested: Date;
  dateProcessed?: Date;
  validIdFile?: string; // filename of uploaded valid ID
  uploadedPhotos?: string[]; // data URLs of uploaded requirement photos
}

export interface Official {
  id: string;
  name: string;
  email: string;
  password: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'pending' | 'approved' | 'info';
  time: string;
  read: boolean;
  requestId?: string;
}
