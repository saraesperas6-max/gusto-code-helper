import React, { useState, useEffect } from 'react';
import { Plus, Eye, Check, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Topbar from '@/components/Topbar';
import { useData } from '@/context/DataContext';
import { CertificateRequest, CertificateType, RequestStatus } from '@/types/barangay';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const CERTIFICATE_TYPES: CertificateType[] = [
  'Barangay Clearance',
  'Certificate of Indigency',
  'Certificate of Residency',
  'Certificate of Low Income',
  'Oath of Undertaking',
  'Business Permit',
];

const RequestsPage: React.FC = () => {
  const { requests, residents, addRequest, updateRequestStatus } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [selectedResident, setSelectedResident] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsApproved, setMarkAsApproved] = useState(true);

  // Auto-open request from notification highlight param
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && requests.length > 0) {
      const req = requests.find(r => r.id === highlightId);
      if (req) {
        setSelectedRequest(req);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, requests, setSearchParams]);

  const filteredRequests = requests.filter(
    (r) =>
      r.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.certificateType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeResidents = residents.filter((r) => r.status === 'Active');

  const handleNewRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const resident = residents.find((r) => r.id === selectedResident);
    if (!resident || !certificateType) return;

    setLoading(true);
    try {
      await addRequest({
        residentId: resident.id,
        residentName: `${resident.firstName} ${resident.middleName || ''} ${resident.lastName}`.trim(),
        certificateType: certificateType as CertificateType,
        purpose,
        notes: notes || undefined,
        status: markAsApproved ? 'Approved' : 'Pending',
      });
      setSelectedResident('');
      setCertificateType('');
      setPurpose('');
      setNotes('');
      setIsNewRequestOpen(false);
      toast({ title: 'Request created successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      await updateRequestStatus(id, status);
      toast({ title: `Request ${status.toLowerCase()}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
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
    <div>
      <Topbar searchPlaceholder="Search requests..." onSearch={setSearchTerm} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Certificate Requests</CardTitle>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Certificate Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Certificate Request (Official)</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleNewRequest} className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-semibold">Requestor Details</h4>
                  <div>
                    <Label>Select Resident</Label>
                    <Select value={selectedResident} onValueChange={setSelectedResident}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a registered resident..." />
                      </SelectTrigger>
                      <SelectContent>
                        {activeResidents.map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.firstName} {r.middleName || ''} {r.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {selectedResident && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name (Auto-filled)</Label>
                        <Input 
                          value={(() => {
                            const r = residents.find((r) => r.id === selectedResident);
                            return r ? `${r.firstName} ${r.middleName || ''} ${r.lastName}` : '';
                          })()}
                          disabled 
                        />
                      </div>
                      <div>
                        <Label>Email (Auto-filled)</Label>
                        <Input 
                          value={residents.find((r) => r.id === selectedResident)?.email || ''}
                          disabled 
                        />
                      </div>
                    </div>
                  )}
                </div>

                <hr />

                <div className="space-y-4">
                  <h4 className="font-semibold">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4">
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
                    <div>
                      <Label>Purpose of Request</Label>
                      <Input 
                        placeholder="e.g., Employment, School Requirement"
                        value={purpose}
                        onChange={(e) => setPurpose(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Additional Notes (Optional)</Label>
                    <Textarea
                      placeholder="Include any specific details..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="markApproved"
                      checked={markAsApproved}
                      onChange={(e) => setMarkAsApproved(e.target.checked)}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="markApproved" className="text-sm">
                      Mark request as Approved immediately
                    </Label>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsNewRequestOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>REQUEST ID</TableHead>
                <TableHead>RESIDENT</TableHead>
                <TableHead>CERTIFICATE TYPE</TableHead>
                <TableHead>DATE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">REQ-{request.id.slice(-4).toUpperCase()}</TableCell>
                  <TableCell>{request.residentName}</TableCell>
                  <TableCell>{request.certificateType}</TableCell>
                  <TableCell>{format(new Date(request.dateRequested), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Request Details</DialogTitle>
                          </DialogHeader>
                          {selectedRequest && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Request ID</p>
                                  <p className="font-medium">REQ-{selectedRequest.id.slice(-4).toUpperCase()}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Resident Name</p>
                                  <p className="font-medium">{selectedRequest.residentName}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Certificate Type</p>
                                  <p className="font-medium">{selectedRequest.certificateType}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Purpose</p>
                                  <p className="font-medium">{selectedRequest.purpose}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date Requested</p>
                                  <p className="font-medium">{format(new Date(selectedRequest.dateRequested), 'MMM dd, yyyy')}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  {getStatusBadge(selectedRequest.status)}
                                </div>
                              </div>
                              {selectedRequest.uploadedPhotos && selectedRequest.uploadedPhotos.length > 0 && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Uploaded Requirements ({selectedRequest.uploadedPhotos.length} file{selectedRequest.uploadedPhotos.length > 1 ? 's' : ''})</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {selectedRequest.uploadedPhotos.map((photo, index) => (
                                      <img 
                                        key={index}
                                        src={photo} 
                                        alt={`Requirement ${index + 1}`} 
                                        className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                        onClick={() => setViewingPhoto(photo)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!selectedRequest.uploadedPhotos && selectedRequest.validIdFile && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Uploaded Documents</p>
                                  <p className="text-sm font-medium">{selectedRequest.validIdFile}</p>
                                </div>
                              )}
                              {selectedRequest.status === 'Pending' && (
                                <div className="flex justify-center gap-4 pt-4">
                                  <Button 
                                    onClick={() => {
                                      handleStatusUpdate(selectedRequest.id, 'Approved');
                                      setSelectedRequest({ ...selectedRequest, status: 'Approved' });
                                    }}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button 
                                    variant="destructive"
                                    onClick={() => {
                                      handleStatusUpdate(selectedRequest.id, 'Denied');
                                      setSelectedRequest({ ...selectedRequest, status: 'Denied' });
                                    }}
                                  >
                                    <X className="mr-2 h-4 w-4" />
                                    Deny
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      {request.status === 'Pending' && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-success hover:bg-success/90"
                            onClick={() => handleStatusUpdate(request.id, 'Approved')}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleStatusUpdate(request.id, 'Denied')}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Photo Viewer Dialog */}
      <Dialog open={!!viewingPhoto} onOpenChange={() => setViewingPhoto(null)}>
        <DialogContent className="max-w-2xl p-2">
          {viewingPhoto && (
            <img src={viewingPhoto} alt="Full view" className="w-full h-auto rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RequestsPage;
