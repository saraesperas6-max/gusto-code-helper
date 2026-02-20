import React, { useState } from 'react';
import { Plus, Edit, Trash2, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Topbar from '@/components/Topbar';
import { useData } from '@/context/DataContext';
import { Resident } from '@/types/barangay';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const ResidentsPage: React.FC = () => {
  const { residents, addResident, updateResident, deleteResident, approveResident } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  
  const [formData, setFormData] = useState({
    lastName: '', firstName: '', middleName: '', age: '', address: '', contact: '', email: '', password: '',
  });

  const filteredResidents = residents.filter(
    (r) =>
      r.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resident?')) return;
    try {
      await deleteResident(id);
      toast({ title: 'Resident deleted' });
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

  return (
    <div>
      <Topbar searchPlaceholder="Search residents..." onSearch={setSearchTerm} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Registered Residents & Signups</CardTitle>
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
                  className={cn(
                    resident.status === 'Pending Approval' && 'bg-warning/10 border-l-4 border-l-warning'
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(resident.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default ResidentsPage;
