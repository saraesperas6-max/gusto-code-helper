import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Upload, X, FileText, Sun, Moon, Eye, Pencil, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useTheme } from '@/context/ThemeContext';
import { CertificateRequest, CertificateType, RequestStatus } from '@/types/barangay';
import { format } from 'date-fns';
import logo from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const { addRequest, getResidentRequests, updateRequest, deleteRequest } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [purpose, setPurpose] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; preview: string }[]>([]);
  const [businessPermitFiles, setBusinessPermitFiles] = useState<Record<string, { file: File; preview: string } | null>>({});
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fileError, setFileError] = useState('');
  const [validatingFile, setValidatingFile] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<CertificateRequest | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<CertificateRequest | null>(null);
  const [editPurpose, setEditPurpose] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [cancellingRequestId, setCancellingRequestId] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const { toast } = useToast();

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (!profile || !user) return null;

  const residentName = `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.trim();
  const myRequests = getResidentRequests(user.id);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const validateIdWithAI = async (base64: string): Promise<{ valid: boolean; reason?: string; idType?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('validate-id', {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('ID validation error:', err);
      return { valid: false, reason: 'Could not verify document. Please try again.' };
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFileError('');
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" is not a valid image. Accepted: JPG, PNG, WEBP, GIF.`);
        e.target.value = '';
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" exceeds the 5MB file size limit.`);
        e.target.value = '';
        return;
      }
    }

    for (const file of Array.from(files)) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      const currentIndex = uploadedFiles.length;
      if (currentIndex === 0) {
        setValidatingFile(true);
        setFileError('');
        const result = await validateIdWithAI(base64);
        setValidatingFile(false);

        if (!result.valid) {
          setFileError(
            `"${file.name}" is not a valid government-issued ID. ${result.reason || ''} Accepted IDs: National ID, Philippine Passport, Driver's License, SSS Card, UMID Card, Postal ID, Senior Citizen's ID Card.`
          );
          toast({
            title: 'Invalid ID',
            description: result.reason || 'Please upload a valid government-issued ID.',
            variant: 'destructive',
          });
          e.target.value = '';
          return;
        }

        toast({
          title: 'ID Verified',
          description: `${result.idType || 'Government ID'} detected and accepted.`,
        });
      }

      setUploadedFiles(prev => [...prev, { file, preview: base64 }]);
    }

    e.target.value = '';
  };

  const handleBusinessPermitFileChange = async (docName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(`"${file.name}" is not a valid image. Accepted: JPG, PNG, WEBP, GIF.`);
      e.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError(`"${file.name}" exceeds the 5MB file size limit.`);
      e.target.value = '';
      return;
    }

    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });

    // Validate government ID slot
    if (docName === 'Valid Government-Issued ID') {
      setValidatingFile(true);
      const result = await validateIdWithAI(base64);
      setValidatingFile(false);

      if (!result.valid) {
        setFileError(
          `"${file.name}" is not a valid government-issued ID. ${result.reason || ''} Accepted IDs: National ID, Philippine Passport, Driver's License, SSS Card, UMID Card, Postal ID, Senior Citizen's ID Card.`
        );
        toast({
          title: 'Invalid ID',
          description: result.reason || 'Please upload a valid government-issued ID.',
          variant: 'destructive',
        });
        e.target.value = '';
        return;
      }

      toast({
        title: 'ID Verified',
        description: `${result.idType || 'Government ID'} detected and accepted.`,
      });
    }

    setBusinessPermitFiles(prev => ({ ...prev, [docName]: { file, preview: base64 } }));
    e.target.value = '';
  };

  const removeBusinessPermitFile = (docName: string) => {
    setBusinessPermitFiles(prev => ({ ...prev, [docName]: null }));
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getRequiredDocuments = (type: CertificateType | ''): string[] => {
    const docs = ['Valid Government-Issued ID'];
    if (type === 'Business Permit') {
      docs.push('Proof of Business Registration', 'Barangay Clearance', 'Cedula');
    }
    return docs;
  };

  const requiredDocs = getRequiredDocuments(certificateType);
  const isBusinessPermit = certificateType === 'Business Permit';
  const businessPermitUploaded = isBusinessPermit ? requiredDocs.every(doc => !!businessPermitFiles[doc]) : false;
  const missingUploads = certificateType && (isBusinessPermit ? !businessPermitUploaded : uploadedFiles.length < requiredDocs.length);

  const getAllUploadedFiles = () => {
    if (isBusinessPermit) {
      return requiredDocs
        .map(doc => businessPermitFiles[doc])
        .filter((f): f is { file: File; preview: string } => !!f);
    }
    return uploadedFiles;
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certificateType) return;

    const allFiles = getAllUploadedFiles();

    if (allFiles.length === 0) {
      setFileError('Please upload all required documents before submitting.');
      return;
    }
    if (isBusinessPermit && !businessPermitUploaded) {
      const missing = requiredDocs.filter(doc => !businessPermitFiles[doc]);
      setFileError(`Missing: ${missing.join(', ')}.`);
      return;
    }
    if (!isBusinessPermit && uploadedFiles.length < requiredDocs.length) {
      setFileError(`Please upload at least ${requiredDocs.length} document(s): ${requiredDocs.join(', ')}.`);
      return;
    }

    setSubmitting(true);
    try {
      await addRequest({
        residentId: user.id,
        residentName,
        certificateType: certificateType as CertificateType,
        purpose,
        status: 'Pending',
        validIdFile: allFiles.map(f => f.file.name).join(', '),
        uploadedPhotos: allFiles.map(f => f.preview),
      });

      setCertificateType('');
      setPurpose('');
      setUploadedFiles([]);
      setBusinessPermitFiles({});
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
                    <Select value={certificateType} onValueChange={(v) => { setCertificateType(v as CertificateType); setUploadedFiles([]); setBusinessPermitFiles({}); setFileError(''); }}>
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
                            <div className="mt-2 mb-2 p-3 bg-muted/50 rounded-lg border">
                              <p className="text-xs font-semibold text-foreground mb-1">Required Documents for {certificateType}:</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                Accepted: JPG, PNG, WEBP, GIF · Max 5MB per file
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                <span className="font-semibold">Accepted Gov't IDs:</span> National ID, Philippine Passport, Driver's License, SSS Card, UMID Card, Postal ID, Senior Citizen's ID Card
                              </p>
                            </div>

                            {isBusinessPermit ? (
                              <div className="space-y-3 mt-2">
                                {requiredDocs.map((doc) => {
                                  const uploaded = businessPermitFiles[doc];
                                  return (
                                    <div key={doc} className="border rounded-lg p-3 bg-card">
                                      <p className="text-xs font-semibold text-foreground mb-2">
                                        {doc} {uploaded ? <span className="text-success">✓</span> : <span className="text-destructive">(required)</span>}
                                      </p>
                                      {uploaded ? (
                                        <div className="relative group inline-block">
                                          <img src={uploaded.preview} alt={doc} className="w-24 h-16 object-cover rounded-lg border" />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => removeBusinessPermitFile(doc)}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                          <p className="text-[10px] text-muted-foreground truncate mt-0.5 max-w-[96px]">{uploaded.file.name}</p>
                                        </div>
                                      ) : (
                                        <label className={`flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validatingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                          {validatingFile && doc === 'Valid Government-Issued ID' ? (
                                            <>
                                              <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                                              <span className="text-xs text-muted-foreground">Verifying ID...</span>
                                            </>
                                          ) : (
                                            <>
                                              <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                                              <span className="text-xs text-muted-foreground">Upload {doc}</span>
                                            </>
                                          )}
                                          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleBusinessPermitFileChange(doc, e)} disabled={validatingFile} />
                                        </label>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <>
                                <ul className="text-xs text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                  {requiredDocs.map((doc, i) => (
                                    <li key={doc} className={uploadedFiles.length > i ? 'text-success font-medium' : ''}>
                                      {doc} {uploadedFiles.length > i ? '✓' : '(required)'}
                                    </li>
                                  ))}
                                </ul>
                                <p className="text-[10px] text-muted-foreground mb-2">
                                  Uploaded: {uploadedFiles.length} / {requiredDocs.length} required
                                </p>
                                <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${validatingFile ? 'opacity-50 pointer-events-none' : ''}`}>
                                  {validatingFile ? (
                                    <>
                                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-1" />
                                      <span className="text-sm text-muted-foreground">Verifying document with AI...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                                      <span className="text-sm text-muted-foreground">Click to upload photos</span>
                                      <span className="text-xs text-muted-foreground">(You can upload multiple files · Max 5MB each)</span>
                                    </>
                                  )}
                                  <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handleFilesChange} disabled={validatingFile} />
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
                              </>
                            )}

                            {fileError && (
                              <p className="text-xs text-destructive mt-1">{fileError}</p>
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
                    <Button type="submit" disabled={submitting || !certificateType || !!missingUploads}>
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
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
                  <TableHead className="text-center">Action</TableHead>
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
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setViewingRequest(request)} title="View submitted form">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'Pending' && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => { setEditingRequest(request); setEditPurpose(request.purpose); setEditNotes(request.notes || ''); }} title="Edit request">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setCancellingRequestId(request.id)} title="Cancel request" className="text-destructive hover:text-destructive">
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No requests yet. Apply for a certificate to get started!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* View Submitted Request Dialog */}
            <Dialog open={!!viewingRequest} onOpenChange={(open) => { if (!open) setViewingRequest(null); }}>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Submitted Request Details</DialogTitle>
                </DialogHeader>
                {viewingRequest && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Certificate Type</Label>
                        <p className="font-medium text-sm">{viewingRequest.certificateType}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Status</Label>
                        <div className="mt-0.5">{getStatusBadge(viewingRequest.status)}</div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Date Requested</Label>
                        <p className="font-medium text-sm">{format(new Date(viewingRequest.dateRequested), 'MMM dd, yyyy')}</p>
                      </div>
                      {viewingRequest.dateProcessed && (
                        <div>
                          <Label className="text-muted-foreground text-xs">Date Processed</Label>
                          <p className="font-medium text-sm">{format(new Date(viewingRequest.dateProcessed), 'MMM dd, yyyy')}</p>
                        </div>
                      )}
                    </div>

                    <hr />

                    <div>
                      <Label className="text-muted-foreground text-xs">Applicant</Label>
                      <p className="font-medium text-sm">{viewingRequest.residentName}</p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground text-xs">Address</Label>
                      <p className="font-medium text-sm">{profile.address || 'N/A'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">Age</Label>
                        <p className="font-medium text-sm">{profile.age || 'N/A'}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">Contact</Label>
                        <p className="font-medium text-sm">{profile.contact || 'N/A'}</p>
                      </div>
                    </div>

                    <hr />

                    <div>
                      <Label className="text-muted-foreground text-xs">Purpose</Label>
                      <p className="font-medium text-sm">{viewingRequest.purpose}</p>
                    </div>

                    {viewingRequest.notes && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Notes</Label>
                        <p className="font-medium text-sm">{viewingRequest.notes}</p>
                      </div>
                    )}

                    {viewingRequest.uploadedPhotos && viewingRequest.uploadedPhotos.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground text-xs">Uploaded Photos</Label>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          {viewingRequest.uploadedPhotos.map((photo, i) => (
                            <img key={i} src={photo} alt={`Document ${i + 1}`} className="w-full h-20 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewingPhoto(photo)} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-2xl p-2">
          {viewingPhoto && (
            <img src={viewingPhoto} alt="Full view" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={!!editingRequest} onOpenChange={(open) => { if (!open) setEditingRequest(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
          </DialogHeader>
          {editingRequest && (
            <div className="space-y-4">
              <div>
                <Label>Purpose</Label>
                <Textarea value={editPurpose} onChange={(e) => setEditPurpose(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRequest(null)}>Cancel</Button>
            <Button disabled={savingEdit || !editPurpose.trim()} onClick={async () => {
              setSavingEdit(true);
              try {
                await updateRequest(editingRequest!.id, { purpose: editPurpose.trim(), notes: editNotes.trim() });
                toast({ title: 'Request updated successfully' });
                setEditingRequest(null);
              } catch {
                toast({ title: 'Failed to update request', variant: 'destructive' });
              } finally {
                setSavingEdit(false);
              }
            }}>
              {savingEdit ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Request Alert */}
      <AlertDialog open={!!cancellingRequestId} onOpenChange={(open) => { if (!open) setCancellingRequestId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this request? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={async () => {
              try {
                await deleteRequest(cancellingRequestId!);
                toast({ title: 'Request cancelled successfully' });
              } catch {
                toast({ title: 'Failed to cancel request', variant: 'destructive' });
              } finally {
                setCancellingRequestId(null);
              }
            }}>
              Yes, cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResidentPortal;
