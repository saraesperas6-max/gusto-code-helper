import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Check, RotateCcw, Users } from 'lucide-react';
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

  // Handle highlight from notification click
  useEffect(() => {
    const residentId = searchParams.get('highlightResident');
    if (residentId) {
      setHighlightedResidentId(residentId);
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
    return result.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
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
      toast({ title: 'Resident approved' });
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
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <CardTitle>Registered Residents & Signups</CardTitle>
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
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active Residents</TabsTrigger>
              <TabsTrigger value="profiles">
                <Users className="h-4 w-4 mr-1" />
                Profiles
              </TabsTrigger>
              <TabsTrigger value="trash">
                <Trash2 className="h-4 w-4 mr-1" />
                Trash Bin ({trashedResidents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>AGE</TableHead>
                    <TableHead>ADDRESS</TableHead>
                    <TableHead>CONTACT</TableHead>
                    <TableHead>EMAIL</TableHead>
                    <TableHead className="text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredResidents.map((resident) => (
                    <TableRow 
                      key={resident.id}
                      ref={highlightedResidentId === resident.id ? highlightRef : undefined}
                      className={cn(
                        resident.status === 'Pending Approval' && 'bg-warning/10 border-l-4 border-l-warning',
                        highlightedResidentId === resident.id && 'animate-pulse ring-2 ring-primary ring-offset-2'
                      )}
                    >
                      <TableCell className="font-medium">
                        {resident.firstName} {resident.middleName || ''} {resident.lastName}
                      </TableCell>
                      <TableCell>{resident.age}</TableCell>
                      <TableCell>{resident.address}</TableCell>
                      <TableCell>{resident.contact}</TableCell>
                      <TableCell>{resident.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {resident.status === 'Pending Approval' && (
                            <Button 
                              size="sm" 
                              className="bg-success hover:bg-success/90"
                              onClick={() => handleApprove(resident.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {renderEditDialog(resident)}
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Move to Trash Bin?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will move <strong>{resident.firstName} {resident.lastName}</strong> to the Trash Bin. You can restore this record later.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleSoftDelete(resident.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredResidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No residents found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="flex justify-between items-center mt-4 text-sm text-muted-foreground">
                <span>Showing {filteredResidents.length} of {residents.length} Results</span>
              </div>
            </TabsContent>

            <TabsContent value="trash">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>NAME</TableHead>
                    <TableHead>AGE</TableHead>
                    <TableHead>ADDRESS</TableHead>
                    <TableHead>CONTACT</TableHead>
                    <TableHead>EMAIL</TableHead>
                    <TableHead className="text-center">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTrashedResidents.map((resident) => (
                    <TableRow key={resident.id}>
                      <TableCell className="font-medium">
                        {resident.firstName} {resident.middleName || ''} {resident.lastName}
                      </TableCell>
                      <TableCell>{resident.age}</TableCell>
                      <TableCell>{resident.address}</TableCell>
                      <TableCell>{resident.contact}</TableCell>
                      <TableCell>{resident.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleRestore(resident.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Restore
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete Forever
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Permanently Delete?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete <strong>{resident.firstName} {resident.lastName}</strong> and their account. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handlePermanentDelete(resident.id)}
                                >
                                  Delete Forever
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredTrashedResidents.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Trash Bin is empty.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="profiles">
              <AdminResidentProfile
                residents={fullProfiles}
                onProfileUpdated={() => { /* data refreshes via realtime */ }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentsPage;
