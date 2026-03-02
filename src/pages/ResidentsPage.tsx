import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Check, RotateCcw, Users } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileCardList from '@/components/MobileCardList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Topbar from '@/components/Topbar';
import DateFilter from '@/components/DateFilter';
import AdminResidentProfile from '@/components/AdminResidentProfile';
import { useData } from '@/context/DataContext';
import { supabase } from '@/integrations/supabase/client'; // kept for potential future use
import { Resident } from '@/types/barangay';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

const ResidentsPage: React.FC = () => {
  const { residents, trashedResidents, addResident, updateResident, softDeleteResident, restoreResident, permanentlyDeleteResident, approveResident } = useData();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [dateFilters, setDateFilters] = useState<{ month: number | null; date: Date | null }>({ month: null, date: null });
  const [highlightedResidentId, setHighlightedResidentId] = useState<string | null>(null);
  const highlightRef = useRef<HTMLTableRowElement>(null);
  const [residentsExpanded, setResidentsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('active');
  const RESIDENTS_DEFAULT_VISIBLE = 5;

  const [notificationResidentId, setNotificationResidentId] = useState<string | null>(null);

  // Handle highlight from notification click
  useEffect(() => {
    const residentId = searchParams.get('highlightResident');
    const openProfile = searchParams.get('openProfile');
    if (residentId) {
      setHighlightedResidentId(residentId);
      if (openProfile === 'true') {
        setNotificationResidentId(residentId);
        setActiveTab('profiles');
      }
      setSearchParams({}, { replace: true });
      // Clear highlight after animation
      const timer = setTimeout(() => setHighlightedResidentId(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  // Scroll to highlighted resident
  useEffect(() => {
    if (highlightedResidentId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedResidentId]);

  // Full profiles for admin profile viewer — use residents from context instead of redundant query
  const fullProfiles = useMemo(() => {
    return residents.map(r => ({
      user_id: r.id,
      first_name: r.firstName,
      last_name: r.lastName,
      middle_name: r.middleName || null,
      age: r.age,
      address: r.address,
      contact: r.contact,
      email: r.email,
      status: r.status,
      avatar_url: r.avatarUrl || null,
      date_of_birth: r.dateOfBirth || null,
      created_at: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    }));
  }, [residents]);
  
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', middleName: '', age: '', address: '', contact: '', email: '', password: '',
  });

  const filteredResidents = useMemo(() => {
    let result = residents.filter(
      (r) =>
        r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (dateFilters.month !== null) {
      result = result.filter(r => new Date(r.createdAt).getMonth() === dateFilters.month);
    }
    if (dateFilters.date) {
      const d = dateFilters.date;
      result = result.filter(r => {
        const rd = new Date(r.createdAt);
        return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth() && rd.getDate() === d.getDate();
      });
    }
    // Sort newest first by registration date
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [residents, searchTerm, dateFilters]);

  const filteredTrashedResidents = useMemo(() => {
    let result = trashedResidents.filter(
      (r) =>
        r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return result.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
  }, [trashedResidents, searchTerm]);

  const resetForm = () => {
    setFormData({ lastName: '', firstName: '', middleName: '', age: '', address: '', contact: '', email: '', password: '' });
    setFormError('');
  };

  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError('');
    try {
      await addResident({
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        age: parseInt(formData.age),
        address: formData.address,
        contact: formData.contact,
        email: formData.email,
        password: formData.password,
        status: 'Active',
      });
      resetForm();
      setIsAddModalOpen(false);
      toast({ title: 'Resident added successfully' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to add resident');
    }
    setLoading(false);
  };

  const handleEditResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResident) return;
    setLoading(true);
    try {
      await updateResident(editingResident.id, {
        lastName: formData.lastName,
        firstName: formData.firstName,
        middleName: formData.middleName || undefined,
        age: parseInt(formData.age),
        address: formData.address,
        contact: formData.contact,
      });
      resetForm();
      setEditingResident(null);
      toast({ title: 'Resident updated successfully' });
    } catch (err: any) {
      setFormError(err.message || 'Failed to update resident');
    }
    setLoading(false);
  };

  const handleSoftDelete = async (id: string) => {
    try {
      await softDeleteResident(id);
      toast({ title: 'Resident moved to Trash Bin' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreResident(id);
      toast({ title: 'Resident restored successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handlePermanentDelete = async (id: string) => {
    try {
      await permanentlyDeleteResident(id);
      toast({ title: 'Resident permanently deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveResident(id);
      toast({ title: 'Resident approved successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleSoftDeleteWithUndo = async (resident: Resident) => {
    try {
      await softDeleteResident(resident.id);
      toast({
        title: 'Resident moved to Trash Bin',
        description: `${resident.firstName} ${resident.lastName} was moved to trash.`,
        action: (
          <ToastAction altText="Undo" onClick={() => handleRestore(resident.id)}>
            <RotateCcw className="h-3 w-3 mr-1" /> Undo
          </ToastAction>
        ),
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const openEditModal = (resident: Resident) => {
    setFormData({
      lastName: resident.lastName,
      firstName: resident.firstName,
      middleName: resident.middleName || '',
      age: resident.age.toString(),
      address: resident.address,
      contact: resident.contact,
      email: resident.email,
      password: '',
    });
    setFormError('');
    setEditingResident(resident);
  };

  const renderEditDialog = (resident: Resident) => (
    <Dialog open={editingResident?.id === resident.id} onOpenChange={(open) => !open && setEditingResident(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={() => openEditModal(resident)}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Resident</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleEditResident} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Last Name</Label>
              <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
            </div>
            <div>
              <Label>First Name</Label>
              <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Middle Name (Optional)</Label>
            <Input value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Age</Label>
              <Input type="number" min="1" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} required />
            </div>
            <div>
              <Label>Contact Number</Label>
              <Input value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Address</Label>
            <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
          </div>
          <div>
            <Label>Email (Cannot be changed)</Label>
            <Input value={formData.email} disabled />
          </div>
          {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditingResident(null)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Updating...' : 'Update Resident'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div>
      <Topbar searchPlaceholder="Search residents..." onSearch={setSearchTerm} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2 sm:gap-4 p-2 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <CardTitle className="text-xs sm:text-base">Registered Residents & Signups</CardTitle>
            <DateFilter onFilterChange={setDateFilters} />
          </div>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Resident
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Resident</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddResident} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Last Name</Label>
                    <Input placeholder="Dela Cruz" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} required />
                  </div>
                  <div>
                    <Label>First Name</Label>
                    <Input placeholder="Juan" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label>Middle Name (Optional)</Label>
                  <Input placeholder="Perez" value={formData.middleName} onChange={(e) => setFormData({ ...formData, middleName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input type="number" placeholder="30" min="1" max="120" value={formData.age} onChange={(e) => setFormData({ ...formData, age: e.target.value })} required />
                  </div>
                  <div>
                    <Label>Contact Number</Label>
                    <Input placeholder="09171234567" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Input placeholder="123 Rizal St" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
                </div>
                <hr />
                <h4 className="font-semibold">Account Credentials</h4>
                <div>
                  <Label>Email</Label>
                  <Input type="email" placeholder="juan@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div>
                  <Label>Password (min. 6 characters)</Label>
                  <Input type="password" placeholder="Enter password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
                {formError && <Alert variant="destructive"><AlertDescription>{formError}</AlertDescription></Alert>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Resident'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-2 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-3 sm:mb-4">
              <TabsTrigger value="active" className="text-[10px] sm:text-sm px-2 sm:px-3">Active Residents</TabsTrigger>
              <TabsTrigger value="profiles" className="text-[10px] sm:text-sm px-2 sm:px-3">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                Profiles
              </TabsTrigger>
              <TabsTrigger value="trash" className="text-[10px] sm:text-sm px-2 sm:px-3">
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" />
                Trash ({trashedResidents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              {/* Mobile Card Layout */}
              <div className="sm:hidden">
                <MobileCardList
                  emptyMessage="No residents found."
                  items={(residentsExpanded ? filteredResidents : filteredResidents.slice(0, RESIDENTS_DEFAULT_VISIBLE)).map((resident) => ({
                    key: resident.id,
                    className: cn(
                      resident.status === 'Pending Approval' && 'border-l-4 border-l-warning bg-warning/10',
                      highlightedResidentId === resident.id && 'animate-pulse ring-2 ring-primary'
                    ),
                    fields: [
                      { label: 'Name', value: `${resident.firstName} ${resident.middleName || ''} ${resident.lastName}` },
                      { label: 'Age', value: resident.age },
                      { label: 'Email', value: resident.email },
                      { label: 'Contact', value: resident.contact },
                      { label: 'Address', value: resident.address },
                    ],
                    actions: (
                      <div className="flex items-center gap-1 flex-wrap">
                        {resident.status === 'Pending Approval' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="bg-success hover:bg-success/90 h-7 text-xs">
                                <Check className="h-3 w-3 mr-1" />Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Resident?</AlertDialogTitle>
                                <AlertDialogDescription>Approve <strong>{resident.firstName} {resident.lastName}</strong>? They will gain portal access and receive an email notification.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => handleApprove(resident.id)}>Approve</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openEditModal(resident)}>
                          <Edit className="h-3 w-3 mr-1" />Edit
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
                              <Trash2 className="h-3 w-3 mr-1" />Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Move to Trash Bin?</AlertDialogTitle>
                              <AlertDialogDescription>This will move <strong>{resident.firstName} {resident.lastName}</strong> to the Trash Bin.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleSoftDeleteWithUndo(resident)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                    <TableHead className="text-xs px-4">NAME</TableHead>
                    <TableHead className="text-xs px-4">AGE</TableHead>
                    <TableHead className="text-xs px-4 hidden md:table-cell">ADDRESS</TableHead>
                    <TableHead className="text-xs px-4">CONTACT</TableHead>
                    <TableHead className="text-xs px-4">EMAIL</TableHead>
                    <TableHead className="text-xs px-4 text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(residentsExpanded ? filteredResidents : filteredResidents.slice(0, RESIDENTS_DEFAULT_VISIBLE)).map((resident) => (
                    <TableRow 
                      key={resident.id}
                      ref={highlightedResidentId === resident.id ? highlightRef : undefined}
                      className={cn(
                        resident.status === 'Pending Approval' && 'bg-warning/10 border-l-4 border-l-warning',
                        highlightedResidentId === resident.id && 'animate-pulse ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <TableCell className="font-medium text-sm px-4 py-4">
                        {resident.firstName} {resident.middleName || ''} {resident.lastName}
                      </TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.age}</TableCell>
                      <TableCell className="text-sm px-4 py-4 hidden md:table-cell">{resident.address}</TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.contact}</TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.email}</TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {resident.status === 'Pending Approval' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" className="bg-success hover:bg-success/90" title="Approve">
                                  <Check className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve Resident?</AlertDialogTitle>
                                  <AlertDialogDescription>This will approve <strong>{resident.firstName} {resident.lastName}</strong> and grant them access to the resident portal. An email notification will be sent.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction className="bg-success text-primary-foreground hover:bg-success/90" onClick={() => handleApprove(resident.id)}>Approve</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {renderEditDialog(resident)}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Move to Trash">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Move to Trash Bin?</AlertDialogTitle>
                                <AlertDialogDescription>This will move <strong>{resident.firstName} {resident.lastName}</strong> to the Trash Bin. You can restore this record later.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handleSoftDeleteWithUndo(resident)}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredResidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No residents found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
              {filteredResidents.length > RESIDENTS_DEFAULT_VISIBLE && (
                <div className="flex justify-center pt-4">
                  <Button variant="ghost" size="sm" onClick={() => setResidentsExpanded(!residentsExpanded)}>
                    {residentsExpanded ? 'Show Less' : `View More (${filteredResidents.length - RESIDENTS_DEFAULT_VISIBLE} more)`}
                  </Button>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <span>Showing {residentsExpanded ? filteredResidents.length : Math.min(RESIDENTS_DEFAULT_VISIBLE, filteredResidents.length)} of {residents.length} Results</span>
              </div>
            </TabsContent>

            <TabsContent value="trash">
              {/* Mobile Card Layout */}
              <div className="sm:hidden">
                <MobileCardList
                  emptyMessage="Trash Bin is empty."
                  items={filteredTrashedResidents.map((resident) => ({
                    key: resident.id,
                    className: 'opacity-70',
                    fields: [
                      { label: 'Name', value: `${resident.firstName} ${resident.middleName || ''} ${resident.lastName}` },
                      { label: 'Age', value: resident.age },
                      { label: 'Email', value: resident.email },
                      { label: 'Contact', value: resident.contact },
                    ],
                    actions: (
                      <div className="flex items-center gap-1 flex-wrap">
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleRestore(resident.id)}>
                          <RotateCcw className="h-3 w-3 mr-1" />Restore
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 text-xs">
                              <Trash2 className="h-3 w-3 mr-1" />Delete Forever
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                              <AlertDialogDescription>This will permanently delete <strong>{resident.firstName} {resident.lastName}</strong> and their account.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handlePermanentDelete(resident.id)}>Delete Forever</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
                    <TableHead className="text-xs px-4">NAME</TableHead>
                    <TableHead className="text-xs px-4">AGE</TableHead>
                    <TableHead className="text-xs px-4 hidden md:table-cell">ADDRESS</TableHead>
                    <TableHead className="text-xs px-4">CONTACT</TableHead>
                    <TableHead className="text-xs px-4">EMAIL</TableHead>
                    <TableHead className="text-xs px-4 text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrashedResidents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium text-sm px-4 py-4">{resident.firstName} {resident.middleName || ''} {resident.lastName}</TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.age}</TableCell>
                      <TableCell className="text-sm px-4 py-4 hidden md:table-cell">{resident.address}</TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.contact}</TableCell>
                      <TableCell className="text-sm px-4 py-4">{resident.email}</TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleRestore(resident.id)}><RotateCcw className="h-4 w-4 mr-1" />Restore</Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4 mr-1" />Delete Forever</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete <strong>{resident.firstName} {resident.lastName}</strong> and their account. This action cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => handlePermanentDelete(resident.id)}>Delete Forever</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTrashedResidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">Trash Bin is empty.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </TabsContent>

            <TabsContent value="profiles">
              <AdminResidentProfile
                residents={fullProfiles}
                onProfileUpdated={() => { /* data refreshes via realtime */ }}
                autoOpenResidentId={notificationResidentId}
                onAutoOpenHandled={() => setNotificationResidentId(null)}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentsPage;
