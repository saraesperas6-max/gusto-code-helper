import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, X, FileText, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { CertificateType, RequestStatus } from '@/types/barangay';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';

const CERTIFICATE_TYPES: CertificateType[] = [
  'Barangay Clearance',
  'Certificate of Indigency',
  'Certificate of Residency',
  'Certificate of Low Income',
  'Oath of Undertaking',
  'Business Permit',
];

const CERTIFICATE_DESCRIPTIONS: Record<string, string> = {
  'Barangay Clearance': 'Official document certifying that a resident has no derogatory record in the barangay. Commonly used for employment, business, and legal purposes.',
  'Certificate of Indigency': 'Certifies that a resident belongs to an indigent family. Used for medical assistance, scholarship applications, and government aid.',
  'Certificate of Residency': 'Confirms that a person is a bonafide resident of the barangay. Required for enrollment, voter registration, and other transactions.',
  'Certificate of Low Income': 'Certifies that a resident belongs to a low-income household. Used for financial assistance and social welfare programs.',
  'Oath of Undertaking': 'A sworn statement by a resident undertaking responsibility for a specific matter. Used for legal and administrative purposes.',
  'Business Permit': 'Authorization to operate a business within the barangay. Required for new and renewing business establishments.',
};

const ResidentPortal: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { addRequest, getResidentRequests } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [purpose, setPurpose] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!profile || !user) return null;

  const residentName = `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim();
  const myRequests = getResidentRequests(user.id);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setUploadedFiles(prev => [...prev, { file, preview: reader.result as string }]);
        };
        reader.readAsDataURL(file);
      });
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateType) return;

    setSubmitting(true);
    try {
      await addRequest({
        residentId: user.id,
        residentName,
        certificateType: certificateType as CertificateType,
        purpose,
        status: 'Pending',
        validIdFile: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.file.name).join(', ') : undefined,
        uploadedPhotos: uploadedFiles.length > 0 ? uploadedFiles.map(f => f.preview) : undefined,
      });

      setCertificateType('');
      setPurpose('');
      setUploadedFiles([]);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error submitting request:', err);
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants: Record<RequestStatus, string> = {
      Pending: 'bg-warning text-warning-foreground',
      Approved: 'bg-success text-success-foreground',
      Denied: 'bg-destructive text-destructive-foreground',
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-muted/30">
       {/* Navbar */}
       <nav className="bg-card shadow-sm px-8 py-4 flex items-center justify-between">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center">
             <img src={logo} alt="Barangay Logo" className="w-full h-full object-cover" />
           </div>
           <span className="font-semibold text-lg text-primary">Palma-Urbano Portal</span>
         </div>
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="text-right">
            <p className="font-semibold text-foreground">{residentName}</p>
            <p className="text-sm text-muted-foreground">Resident</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-8">
        {/* Pending Approval Notice */}
        {profile.status === 'Pending Approval' && (
          <Card className="mb-6 border-warning">
            <CardContent className="p-6">
              <p className="text-warning font-semibold">Your account is pending approval by a barangay official. Some features may be limited.</p>
            </CardContent>
          </Card>
        )}

        {/* Welcome Card */}
        <Card className="mb-6">
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Welcome, {profile.first_name}!</h1>
              <p className="text-muted-foreground">Manage your certificate requests here.</p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button disabled={profile.status !== 'Active'}>Apply for New Certificate</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Apply for a Certificate</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitRequest} className="space-y-4">
                  <div>
                    <Label>Certificate Type</Label>
                    <Select value={certificateType} onValueChange={(v) => setCertificateType(v as CertificateType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select certificate type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CERTIFICATE_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {certificateType && (
                    <>
                      {/* Certificate Preview Card */}
                      <div
                        className="rounded-lg border bg-muted/50 p-4 flex items-start gap-4 cursor-pointer hover:bg-muted/80 transition-colors"
                        onClick={() => setIsSampleOpen(true)}
                      >
                        <div className="w-16 h-20 rounded-md bg-primary/10 border border-primary/20 flex flex-col items-center justify-center flex-shrink-0">
                          <FileText className="h-8 w-8 text-primary" />
                          <span className="text-[8px] text-primary font-semibold mt-1 text-center leading-tight">SAMPLE</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground">{certificateType}</p>
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {CERTIFICATE_DESCRIPTIONS[certificateType] || 'Official barangay document.'}
                          </p>
                          <p className="text-xs text-primary mt-2 font-medium">Click to view sample →</p>
                        </div>
                      </div>

                      {/* Sample Certificate Modal */}
                      <Dialog open={isSampleOpen} onOpenChange={setIsSampleOpen}>
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle>{certificateType} — Sample Preview</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-full aspect-[8.5/11] rounded-lg border-2 border-primary/20 bg-card p-6 flex flex-col items-center text-center">
                              <div className="w-16 h-16 rounded-full border-2 border-primary/30 overflow-hidden bg-primary/10 flex items-center justify-center mb-3">
                                <img src={logo} alt="Barangay Logo" className="w-full h-full object-cover" />
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Republic of the Philippines</p>
                              <p className="text-[10px] text-muted-foreground">Province / City / Municipality</p>
                              <p className="text-xs font-bold text-primary mt-1">Barangay Palma-Urbano</p>
                              <div className="w-16 border-t border-primary/30 my-3" />
                              <p className="text-sm font-bold text-foreground uppercase tracking-wide">{certificateType}</p>
                              <div className="mt-4 text-left w-full space-y-2 text-xs text-muted-foreground">
                                <p>TO WHOM IT MAY CONCERN:</p>
                                <p className="leading-relaxed">
                                  This is to certify that <span className="font-semibold text-foreground">JUAN DELA CRUZ</span>, of legal age, Filipino, and a resident of Barangay Palma-Urbano...
                                </p>
                                <p className="leading-relaxed">
                                  {CERTIFICATE_DESCRIPTIONS[certificateType] || 'Official barangay document.'}
                                </p>
                              </div>
                              <div className="mt-auto pt-6 w-full flex justify-end">
                                <div className="text-center">
                                  <div className="w-32 border-t border-foreground/50 mb-1" />
                                  <p className="text-[10px] text-muted-foreground">Barangay Captain</p>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground italic">This is a sample preview only. Actual certificate may differ.</p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <hr />
                      <div>
                        <h4 className="font-semibold mb-3">Applicant Details</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Full Name</Label>
                            <Input value={residentName} disabled />
                          </div>
                          <div>
                            <Label>Address</Label>
                            <Input value={profile.address || ''} disabled />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Age</Label>
                              <Input value={profile.age || ''} disabled />
                            </div>
                            <div>
                              <Label>Contact Number</Label>
                              <Input value={profile.contact || ''} disabled />
                            </div>
                          </div>
                        </div>
                      </div>

                      <hr />

                      <div>
                        <h4 className="font-semibold mb-3">Additional Details</h4>
                        <div className="space-y-3">
                          <div>
                            <Label>Purpose</Label>
                            <Textarea
                              placeholder="e.g., For job application, medical assistance, etc."
                              value={purpose}
                              onChange={(e) => setPurpose(e.target.value)}
                              required
                            />
                          </div>
                          <div>
                            <Label>Upload Requirements</Label>
                            {certificateType === 'Business Permit' && (
                              <div className="mt-2 mb-2 p-3 bg-muted/50 rounded-lg border">
                                <p className="text-xs font-semibold text-foreground mb-1">Requirements for Business Permit:</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5">
                                  <li>Proof of Business Registration</li>
                                  <li>Barangay Clearance</li>
                                  <li>Valid ID</li>
                                  <li>Cedula</li>
                                </ul>
                              </div>
                            )}
                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors mt-1">
                              <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                              <span className="text-sm text-muted-foreground">Click to upload photos</span>
                              <span className="text-xs text-muted-foreground">(You can upload multiple files)</span>
                              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFilesChange} />
                            </label>
                            {uploadedFiles.length > 0 && (
                              <div className="mt-2 grid grid-cols-3 gap-2">
                                {uploadedFiles.map((item, index) => (
                                  <div key={index} className="relative group">
                                    <img src={item.preview} alt={`Upload ${index + 1}`} className="w-full h-20 object-cover rounded-lg border" />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={() => removeFile(index)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">{item.file.name}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Request'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>My Certificate Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Certificate Type</TableHead>
                  <TableHead>Date Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Purpose</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myRequests.length > 0 ? (
                  myRequests.map((request, index) => (
                    <TableRow key={request.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{request.certificateType}</TableCell>
                      <TableCell>
                        {format(new Date(request.dateRequested), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{request.purpose}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No requests yet. Apply for a certificate to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResidentPortal;
