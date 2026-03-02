import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Save, X, User, Calendar, MapPin, Phone, Mail, Hash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ResidentProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  middle_name: string | null;
  age: number | null;
  email: string;
  address: string | null;
  contact: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  status: string;
  created_at: string;
}

interface AdminResidentProfileProps {
  residents: ResidentProfile[];
  onProfileUpdated: () => void;
  autoOpenResidentId?: string | null;
  onAutoOpenHandled?: () => void;
}

const AdminResidentProfile: React.FC<AdminResidentProfileProps> = ({ residents, onProfileUpdated, autoOpenResidentId, onAutoOpenHandled }) => {
  const { toast } = useToast();
  const [selectedResident, setSelectedResident] = useState<ResidentProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable fields
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>();
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const openProfile = (resident: ResidentProfile) => {
    setSelectedResident(resident);
    setDateOfBirth(resident.date_of_birth ? new Date(resident.date_of_birth) : undefined);
    setAddress(resident.address || '');
    setPhone(resident.contact || '');
    setPhoneError('');
    setIsEditing(false);
  };

  // Auto-open resident from notification click
  useEffect(() => {
    if (autoOpenResidentId && residents.length > 0) {
      const target = residents.find(r => r.user_id === autoOpenResidentId);
      if (target) {
        openProfile(target);
        onAutoOpenHandled?.();
      }
    }
  }, [autoOpenResidentId, residents]);

  const closeProfile = () => {
    setSelectedResident(null);
    setIsEditing(false);
    stopCamera();
  };

  // Camera logic
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      setCapturedPhoto(null);
      setCameraOpen(true);
    } catch {
      toast({ title: 'Camera Error', description: 'Unable to access camera.', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, cameraOpen]);

  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
    setCameraOpen(false);
    setCapturedPhoto(null);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedPhoto || !selectedResident) return;
    try {
      const blob = await (await fetch(capturedPhoto)).blob();
      const fileName = `${selectedResident.user_id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', selectedResident.user_id);
      setSelectedResident(prev => prev ? { ...prev, avatar_url: urlData.publicUrl } : null);
      onProfileUpdated();
      toast({ title: 'Photo Updated' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    }
    setCameraOpen(false);
    setCapturedPhoto(null);
  }, [capturedPhoto, selectedResident, onProfileUpdated, toast]);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
    if (cleaned && !/^(\+63|0)\d{10}$/.test(cleaned)) {
      setPhoneError('Enter a valid PH mobile number (e.g. 09171234567)');
    } else {
      setPhoneError('');
    }
  };

  const handleSave = async () => {
    if (!selectedResident || phoneError) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        address: address || null,
        contact: phone || null,
      };
      if (dateOfBirth) {
        updateData.date_of_birth = format(dateOfBirth, 'yyyy-MM-dd');
      }
      await supabase.from('profiles').update(updateData).eq('user_id', selectedResident.user_id);
      setSelectedResident(prev => prev ? { ...prev, address: address || null, contact: phone || null, date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null } : null);
      onProfileUpdated();
      setIsEditing(false);
      toast({ title: 'Profile Updated' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const fullName = (r: ResidentProfile) =>
    `${r.first_name} ${r.middle_name || ''} ${r.last_name}`.replace(/\s+/g, ' ').trim();

  return (
    <>
      {/* Resident Avatar Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {residents.map((resident) => (
          <button
            key={resident.user_id}
            onClick={() => openProfile(resident)}
            className="group flex flex-col items-center gap-2 p-4 rounded-xl border bg-card hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer"
          >
            <div className="relative w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center group-hover:border-primary/50 transition-colors">
              {resident.avatar_url ? (
                <img src={resident.avatar_url} alt={fullName(resident)} className="w-full h-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <p className="text-xs font-medium text-foreground text-center leading-tight truncate w-full">
              {resident.first_name} {resident.last_name}
            </p>
          </button>
        ))}
        {residents.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground py-8">No residents found.</p>
        )}
      </div>

      {/* Profile Detail Modal */}
      <Dialog open={!!selectedResident} onOpenChange={(open) => !open && closeProfile()}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Resident Profile
            </DialogTitle>
          </DialogHeader>

          {selectedResident && (
            <div className="space-y-5">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative w-24 h-24 rounded-full border-2 border-primary/30 overflow-hidden bg-muted flex items-center justify-center">
                  {selectedResident.avatar_url ? (
                    <img src={selectedResident.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{fullName(selectedResident)}</h3>
                <Button size="sm" variant="outline" onClick={startCamera}>
                  <Camera className="h-4 w-4 mr-2" /> Update Photo
                </Button>
              </div>

              {/* Info Fields */}
              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium text-foreground">{selectedResident.email}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-muted-foreground text-xs">Age</p>
                    <p className="font-medium text-foreground">{selectedResident.age || 'N/A'}</p>
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="flex items-start gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Date of Birth</p>
                    {isEditing ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn('w-full justify-start text-left font-normal mt-1', !dateOfBirth && 'text-muted-foreground')}
                          >
                            {dateOfBirth ? format(dateOfBirth, 'PPP') : 'Select date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={dateOfBirth}
                            onSelect={setDateOfBirth}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            className={cn('p-3 pointer-events-auto')}
                            captionLayout="dropdown-buttons"
                            fromYear={1930}
                            toYear={new Date().getFullYear()}
                          />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <p className="font-medium text-foreground">
                        {selectedResident.date_of_birth
                          ? format(new Date(selectedResident.date_of_birth), 'PPP')
                          : 'Not set'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Current Address</p>
                    {isEditing ? (
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        maxLength={500}
                        className="mt-1"
                      />
                    ) : (
                      <p className="font-medium text-foreground">{selectedResident.address || 'Not set'}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Phone Number</p>
                    {isEditing ? (
                      <>
                        <Input
                          value={phone}
                          onChange={(e) => validatePhone(e.target.value)}
                          maxLength={13}
                          placeholder="09171234567"
                          className="mt-1"
                        />
                        {phoneError && <p className="text-xs text-destructive mt-1">{phoneError}</p>}
                      </>
                    ) : (
                      <p className="font-medium text-foreground">{selectedResident.contact || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                {isEditing ? (
                  <>
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving || !!phoneError}>
                      <Save className="h-4 w-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button size="sm" onClick={() => setIsEditing(true)}>Edit Details</Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>Capture Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            {!capturedPhoto ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border bg-black aspect-[4/3] object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                <Button onClick={capturePhoto}>
                  <Camera className="h-4 w-4 mr-2" /> Capture
                </Button>
              </>
            ) : (
              <>
                <img src={capturedPhoto} alt="Captured" className="w-full rounded-lg border aspect-[4/3] object-cover" />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => { setCapturedPhoto(null); startCamera(); }}>
                    <X className="h-4 w-4 mr-1" /> Retake
                  </Button>
                  <Button onClick={confirmPhoto}>
                    <Save className="h-4 w-4 mr-1" /> Use Photo
                  </Button>
                </div>
              </>
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminResidentProfile;
