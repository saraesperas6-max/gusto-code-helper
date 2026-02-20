import React, { useState } from 'react';
import { User, Phone, MapPin, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import logo from '@/assets/logo.png';

const CompleteProfilePage: React.FC = () => {
  const { profile, refreshProfile, logout } = useAuth();

  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [middleName, setMiddleName] = useState(profile?.middle_name || '');
  const [age, setAge] = useState(profile?.age?.toString() || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [contact, setContact] = useState(profile?.contact || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !age.trim() || !address.trim() || !contact.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 150) {
      setError('Please enter a valid age.');
      return;
    }

    if (!/^\d{10,11}$/.test(contact)) {
      setError('Please enter a valid contact number (10-11 digits).');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        middle_name: middleName.trim() || null,
        age: ageNum,
        address: address.trim(),
        contact: contact.trim(),
      })
      .eq('user_id', profile!.user_id);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    await refreshProfile();
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/30">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center pb-2">
          <img src={logo} alt="Barangay Logo" className="w-20 h-20 mx-auto mb-4 rounded-full object-cover" />
          <h1 className="text-xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="text-muted-foreground text-sm">Please fill in the required information to continue.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="firstName">First Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="firstName" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="middleName">Middle Name</Label>
              <Input id="middleName" placeholder="Middle name (optional)" value={middleName} onChange={(e) => setMiddleName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="age">Age *</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="age" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="Age" value={age} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setAge(v); }} className="pl-10" required />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="contact">Contact # *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="contact" type="text" inputMode="numeric" pattern="[0-9]*" placeholder="09XX..." value={contact} onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setContact(v); }} className="pl-10" required />
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="address">Address *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input id="address" placeholder="Complete address" value={address} onChange={(e) => setAddress(e.target.value)} className="pl-10" required />
              </div>
            </div>

            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Continue'}
            </Button>

            <p className="text-center text-xs text-muted-foreground pt-2">
              <button type="button" className="text-primary hover:underline" onClick={logout}>Sign out instead</button>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteProfilePage;
