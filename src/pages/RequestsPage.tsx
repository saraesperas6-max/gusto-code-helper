import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Eye, Check, X, Undo2, FileText, User, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCardList from '@/components/MobileCardList';
import CertificatePreview from '@/components/CertificatePreview';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Topbar from '@/components/Topbar';
import DateFilter from '@/components/DateFilter';
import { useData } from '@/context/DataContext';
import { CertificateRequest, CertificateType, RequestStatus } from '@/types/barangay';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CERTIFICATE_TYPES: CertificateType[] = [
  'Barangay Clearance',
  'Certificate of Indigency',
  'Certificate of Residency',
  'Certificate of Low Income',
  'Oath of Undertaking',
  'Business Permit',
];

const RequestsPage: React.FC = () => {
  const { requests, residents, addRequest, updateRequestStatus, refreshData } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [dateFilters, setDateFilters] = useState<{ month: number | null; date: Date | null }>({ month: null, date: null });
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denyTargetId, setDenyTargetId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [undoDialogOpen, setUndoDialogOpen] = useState(false);
  const [undoTargetId, setUndoTargetId] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [previewRequest, setPreviewRequest] = useState<CertificateRequest | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const REQUESTS_DEFAULT_VISIBLE = 5;
  const statusUpdateLockRef = useRef<Set<string>>(new Set());
  const highlightRowRef = useRef<HTMLTableRowElement | null>(null);

  const [selectedResident, setSelectedResident] = useState('');
  const [certificateType, setCertificateType] = useState<CertificateType | ''>('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [markAsApproved, setMarkAsApproved] = useState(true);

  // Auto-open and scroll to request from notification highlight param
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId && requests.length > 0) {
      const req = requests.find(r => r.id === highlightId);
      if (req) {
        setSelectedRequest(req);
        setHighlightedId(highlightId);
        // Clear highlight after animation
        setTimeout(() => setHighlightedId(null), 3000);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, requests, setSearchParams]);

  // Scroll highlighted row into view
  useEffect(() => {
    if (highlightedId && highlightRowRef.current) {
      highlightRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedId]);

  const filteredRequests = useMemo(() => {
    let result = requests.filter(
      (r) =>
        r.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.certificateType.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (dateFilters.month !== null) {
      result = result.filter(r => new Date(r.dateRequested).getMonth() === dateFilters.month);
    }
    if (dateFilters.date) {
      const d = dateFilters.date;
      result = result.filter(r => {
        const rd = new Date(r.dateRequested);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      });
    }
    return result.sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime());
  }, [requests, searchTerm, dateFilters]);

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

  const sendNotificationEmail = async (requestId: string, status: string, residentEmail: string, residentName: string, certificateType: string, denialReason?: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: { requestId, status, residentEmail, residentName, certificateType, denialReason },
      });
    } catch (err) {
      console.error('Failed to send notification email:', err);
    }
  };

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    const lockKey = `${id}:${status}`;
    if (statusUpdateLockRef.current.has(lockKey)) return;

    statusUpdateLockRef.current.add(lockKey);
    setStatusUpdatingId(id);

    try {
      const request = requests.find(r => r.id === id);
      const resident = request ? residents.find(r => r.id === request.residentId) : null;

      if (status === 'Approved') {
        const claimDeadline = new Date();
        claimDeadline.setDate(claimDeadline.getDate() + 3);
        await supabase.from('certificate_requests').update({
          status: 'Approved' as any,
          date_processed: new Date().toISOString(),
          claim_deadline: claimDeadline.toISOString(),
        }).eq('id', id);
        await refreshData();
      } else {
        await updateRequestStatus(id, status);
      }

      if (request && resident) {
        await sendNotificationEmail(id, status, resident.email, `${resident.firstName} ${resident.lastName}`, request.certificateType);
      }

      toast({ title: `Request ${status.toLowerCase()}` });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      statusUpdateLockRef.current.delete(lockKey);
      setStatusUpdatingId((current) => (current === id ? null : current));
    }
  };

  const openDenyDialog = (id: string) => {
    setDenyTargetId(id);
    setDenialReason('');
    setDenyDialogOpen(true);
  };

  const handleDenyWithReason = async () => {
    if (!denyTargetId || !denialReason.trim()) return;
    try {
      await supabase.from('certificate_requests').update({
        status: 'Denied' as any,
        denial_reason: denialReason.trim(),
        date_processed: new Date().toISOString(),
      }).eq('id', denyTargetId);
      await refreshData();

      // Send denial email notification
      const request = requests.find(r => r.id === denyTargetId);
      const resident = request ? residents.find(r => r.id === request.residentId) : null;
      if (request && resident) {
        await sendNotificationEmail(denyTargetId, 'Denied', resident.email, `${resident.firstName} ${resident.lastName}`, request.certificateType, denialReason.trim());
      }

      if (selectedRequest?.id === denyTargetId) {
        setSelectedRequest({ ...selectedRequest, status: 'Denied' });
      }
      toast({ title: 'Request denied' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setDenyDialogOpen(false);
    setDenyTargetId(null);
    setDenialReason('');
  };

  const openApproveDialog = (id: string) => {
    setApproveTargetId(id);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!approveTargetId) return;
    await handleStatusUpdate(approveTargetId, 'Approved');
    if (selectedRequest?.id === approveTargetId) {
      setSelectedRequest({ ...selectedRequest, status: 'Approved' });
    }
    setApproveDialogOpen(false);
    setApproveTargetId(null);
  };

  const openUndoDialog = (id: string) => {
    setUndoTargetId(id);
    setUndoDialogOpen(true);
  };

  const handleUndo = async () => {
    if (!undoTargetId) return;
    try {
      await supabase.from('certificate_requests').update({
        status: 'Pending' as any,
        denial_reason: null,
        date_processed: null,
      }).eq('id', undoTargetId);
      await refreshData();
      if (selectedRequest?.id === undoTargetId) {
        setSelectedRequest({ ...selectedRequest, status: 'Pending' });
      }
      toast({ title: 'Request reverted to Pending' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setUndoDialogOpen(false);
    setUndoTargetId(null);
  };

  const getStatusBadge = (status: RequestStatus) => {
    const variants: Record<RequestStatus, string> = {
      Pending: 'bg-warning text-warning-foreground',
      Approved: 'bg-success text-success-foreground',
      Denied: 'bg-destructive text-destructive-foreground',
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  // Helper to get denial reason from raw request data
  const getDenialReason = (requestId: string): string | null => {
    // We'll fetch it from the request object if available
    const req = requests.find(r => r.id === requestId);
    return (req as any)?.denialReason || null;
  };

  return (
    <div>
      <Topbar searchPlaceholder="Search requests..." onSearch={setSearchTerm} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 sm:gap-4 p-2 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <CardTitle className="text-xs sm:text-base">Certificate Requests</CardTitle>
            <DateFilter onFilterChange={setDateFilters} />
          </div>
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
        <CardContent className="p-2 sm:p-6">
          {/* Mobile Card Layout */}
          <div className="sm:hidden">
            <MobileCardList
              emptyMessage="No requests found."
              items={(requestsExpanded ? filteredRequests : filteredRequests.slice(0, REQUESTS_DEFAULT_VISIBLE)).map((request) => ({
                key: request.id,
                className: request.id === highlightedId ? 'animate-pulse bg-primary/10 ring-2 ring-primary/30' : '',
                fields: [
                  { label: 'Resident', value: request.residentName },
                  { label: 'Request ID', value: `REQ-${request.id.slice(-4).toUpperCase()}` },
                  { label: 'Status', value: getStatusBadge(request.status) },
                  { label: 'Type', value: request.certificateType },
                  { label: 'Date', value: format(new Date(request.dateRequested), 'MMM dd, yyyy') },
                ],
                actions: (
                  <div className="flex items-center gap-1 flex-wrap">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setSelectedRequest(request)}>
                          <Eye className="h-3 w-3 mr-1" />View
                        </Button>
                      </DialogTrigger>
                    </Dialog>
                    {request.status === 'Pending' && (
                      <>
                        <Button size="sm" className="bg-success hover:bg-success/90 h-7 text-xs" disabled={statusUpdatingId === request.id} onClick={() => openApproveDialog(request.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={() => openDenyDialog(request.id)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {request.status === 'Approved' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setPreviewRequest(request)}>
                        <FileText className="h-3 w-3" />
                      </Button>
                    )}
                    {(request.status === 'Approved' || request.status === 'Denied') && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openUndoDialog(request.id)}>
                        <Undo2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ),
              }))}
            />
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-auto scrollbar-hide">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs px-4">REQUEST ID</TableHead>
                <TableHead className="text-xs px-4">RESIDENT</TableHead>
                <TableHead className="text-xs px-4">TYPE</TableHead>
                <TableHead className="text-xs px-4">DATE</TableHead>
                <TableHead className="text-xs px-4">STATUS</TableHead>
                <TableHead className="text-xs px-4 text-center">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(requestsExpanded ? filteredRequests : filteredRequests.slice(0, REQUESTS_DEFAULT_VISIBLE)).map((request) => (
                <TableRow
                  key={request.id}
                  ref={request.id === highlightedId ? highlightRowRef : undefined}
                  className={request.id === highlightedId ? 'animate-pulse bg-primary/10 ring-2 ring-primary/30 rounded transition-all duration-500' : ''}
                >
                  <TableCell className="font-medium text-sm px-4 py-4">REQ-{request.id.slice(-4).toUpperCase()}</TableCell>
                  <TableCell className="text-sm px-4 py-4">{request.residentName}</TableCell>
                  <TableCell className="text-sm px-4 py-4">{request.certificateType}</TableCell>
                  <TableCell className="text-sm px-4 py-4">{format(new Date(request.dateRequested), 'MMM dd, yyyy')}</TableCell>
                  <TableCell className="px-4 py-4">{getStatusBadge(request.status)}</TableCell>
                  <TableCell className="px-4 py-4">
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
                          {selectedRequest && (() => {
                            const resident = residents.find(r => r.id === selectedRequest.residentId);
                            return (
                            <div className="space-y-4">
                              {resident && (
                                <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                                  <div
                                    className="relative w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
                                    onClick={() => resident.avatarUrl && setViewingPhoto(resident.avatarUrl)}
                                  >
                                    {resident.avatarUrl ? (
                                      <img src={resident.avatarUrl} alt={selectedRequest.residentName} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="h-8 w-8 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <p className="font-semibold text-foreground text-base">{selectedRequest.residentName}</p>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{resident.email}</span>
                                      {resident.contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{resident.contact}</span>}
                                      {resident.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{resident.address}</span>}
                                      {resident.dateOfBirth && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(resident.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                                    </div>
                                  </div>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                <div><p className="text-sm text-muted-foreground">Request ID</p><p className="font-medium">REQ-{selectedRequest.id.slice(-4).toUpperCase()}</p></div>
                                <div><p className="text-sm text-muted-foreground">Certificate Type</p><p className="font-medium">{selectedRequest.certificateType}</p></div>
                                <div><p className="text-sm text-muted-foreground">Purpose</p><p className="font-medium">{selectedRequest.purpose}</p></div>
                                <div><p className="text-sm text-muted-foreground">Date Requested</p><p className="font-medium">{format(new Date(selectedRequest.dateRequested), 'MMM dd, yyyy')}</p></div>
                                <div><p className="text-sm text-muted-foreground">Status</p>{getStatusBadge(selectedRequest.status)}</div>
                              </div>
                              {selectedRequest.status === 'Denied' && (selectedRequest as any).denialReason && (
                                <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                                  <p className="text-sm font-medium text-destructive">Denial Reason</p>
                                  <p className="text-sm mt-1">{(selectedRequest as any).denialReason}</p>
                                </div>
                              )}
                              {selectedRequest.uploadedPhotos && selectedRequest.uploadedPhotos.length > 0 && (
                                <div>
                                  <p className="text-sm text-muted-foreground mb-2">Uploaded Requirements ({selectedRequest.uploadedPhotos.length} file{selectedRequest.uploadedPhotos.length > 1 ? 's' : ''})</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {selectedRequest.uploadedPhotos.map((photo, index) => (
                                      <img key={index} src={photo} alt={`Requirement ${index + 1}`} className="w-full h-32 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewingPhoto(photo)} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              {!selectedRequest.uploadedPhotos && selectedRequest.validIdFile && (
                                <div><p className="text-sm text-muted-foreground mb-2">Uploaded Documents</p><p className="text-sm font-medium">{selectedRequest.validIdFile}</p></div>
                              )}
                              {selectedRequest.status === 'Pending' && (
                                <div className="flex justify-center gap-4 pt-4">
                                  <Button onClick={(e) => { e.stopPropagation(); openApproveDialog(selectedRequest.id); }} disabled={statusUpdatingId === selectedRequest.id} className="bg-success hover:bg-success/90"><Check className="mr-2 h-4 w-4" />Approve</Button>
                                  <Button variant="destructive" onClick={() => openDenyDialog(selectedRequest.id)}><X className="mr-2 h-4 w-4" />Deny</Button>
                                </div>
                              )}
                              {(selectedRequest.status === 'Approved' || selectedRequest.status === 'Denied') && (
                                <div className="flex justify-center pt-4">
                                  <Button variant="outline" onClick={() => openUndoDialog(selectedRequest.id)}><Undo2 className="mr-2 h-4 w-4" />Undo — Revert to Pending</Button>
                                </div>
                              )}
                            </div>
                            );
                          })()}
                        </DialogContent>
                      </Dialog>
                      {request.status === 'Pending' && (
                        <>
                          <Button size="sm" className="bg-success hover:bg-success/90" disabled={statusUpdatingId === request.id} onClick={(e) => { e.stopPropagation(); openApproveDialog(request.id); }}><Check className="h-4 w-4" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => openDenyDialog(request.id)}><X className="h-4 w-4" /></Button>
                        </>
                      )}
                      {(request.status === 'Approved' || request.status === 'Denied') && (
                        <>
                          {request.status === 'Approved' && (
                            <Button size="sm" variant="outline" onClick={() => setPreviewRequest(request)} title="Preview Certificate"><FileText className="h-4 w-4" /></Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openUndoDialog(request.id)} title="Undo — Revert to Pending"><Undo2 className="h-4 w-4" /></Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No requests found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
          {filteredRequests.length > REQUESTS_DEFAULT_VISIBLE && (
            <div className="flex justify-center pt-4">
              <Button variant="ghost" size="sm" onClick={() => setRequestsExpanded(!requestsExpanded)}>
                {requestsExpanded ? 'Show Less' : `View More (${filteredRequests.length - REQUESTS_DEFAULT_VISIBLE} more)`}
              </Button>
            </div>
          )}
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

      {/* Approve Confirmation Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this request? The resident will be notified and given 3 days to claim the certificate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApproveConfirm} className="bg-success hover:bg-success/90">Confirm Approve</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deny Reason Dialog */}
      <Dialog open={denyDialogOpen} onOpenChange={setDenyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deny Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Are you sure you want to deny this request? Please provide a reason below.</p>
            <div>
              <Label>Reason for Denial <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Please specify the reason for denying this request..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDenyWithReason} disabled={!denialReason.trim()}>
              Confirm Deny
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Undo Confirmation Dialog */}
      <AlertDialog open={undoDialogOpen} onOpenChange={setUndoDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Undo Action</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert this request back to Pending? This will undo the current approval or denial.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUndo}>Confirm Undo</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Certificate Preview Dialog */}
      {previewRequest && (
        <CertificatePreview
          request={previewRequest}
          open={!!previewRequest}
          onOpenChange={(open) => { if (!open) setPreviewRequest(null); }}
          residentAddress={residents.find(r => r.id === previewRequest.residentId)?.address}
        />
      )}
    </div>
  );
};

export default RequestsPage;
