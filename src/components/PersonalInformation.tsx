import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Save, X, User, Calendar, MapPin, Phone, Mail, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PersonalInformation: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    profile?.date_of_birth ? new Date(profile.date_of_birth) : undefined
  );
  const [address, setAddress] = useState(profile?.address || '');
  const [phone, setPhone] = useState(profile?.contact || '');
  const [phoneError, setPhoneError] = useState('');
  const [saving, setSaving] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (profile) {
      setAvatarUrl(profile.avatar_url || null);
      setAddress(profile.address || '');
      setPhone(profile.contact || '');
      setDateOfBirth(profile?.date_of_birth ? new Date(profile.date_of_birth) : undefined);
    }
  }, [profile]);

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
    ctx.drawImage(video, 0, 0);
    setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.8));
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  }, [stream]);

  const confirmPhoto = useCallback(async () => {
    if (!capturedPhoto || !user) return;
    try {
      const blob = await (await fetch(capturedPhoto)).blob();
      const fileName = `${user.id}/avatar-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, blob, { upsert: true, contentType: 'image/jpeg' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
      await supabase.from('profiles').update({ avatar_url: urlData.publicUrl }).eq('user_id', user.id);
      setAvatarUrl(urlData.publicUrl);
      await refreshProfile();
      toast({ title: 'Photo Updated' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    }
    setCameraOpen(false);
    setCapturedPhoto(null);
  }, [capturedPhoto, user, refreshProfile, toast]);

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
    if (!user || phoneError) return;
    setSaving(true);
    try {
      const updateData: Record<string, any> = {
        address: address || null,
        contact: phone || null,
      };
      if (dateOfBirth) {
        updateData.date_of_birth = format(dateOfBirth, 'yyyy-MM-dd');
      }
      await supabase.from('profiles').update(updateData).eq('user_id', user.id);
      await refreshProfile();
      setIsEditing(false);
      toast({ title: 'Saved', description: 'Your personal information has been updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const closeSheet = () => {
    setIsOpen(false);
    setIsEditing(false);
    stopCamera();
  };

  if (!profile || !user) return null;

  const fullName = `${profile.first_name} ${profile.middle_name || ''} ${profile.last_name}`.replace(/\s+/g, ' ').trim();

  return (
    <>
      {/* Clickable Profile Trigger — avatar + name inline */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-3 cursor-pointer group focus:outline-none"
      >
        <div className="relative w-10 h-10 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0 group-hover:border-primary/50 transition-colors">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <User className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{fullName}</p>
          <p className="text-sm text-muted-foreground">Resident</p>
        </div>
      </button>

      {/* Profile Sidebar Sheet */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Personal Information
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-6 py-6">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/30 overflow-hidden bg-muted flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">{fullName}</h3>
              <Button size="sm" variant="outline" onClick={startCamera}>
                <Camera className="h-4 w-4 mr-2" /> Update Photo
              </Button>
            </div>

            {/* Info Fields */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium text-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 text-sm">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground text-xs">Age</p>
                  <p className="font-medium text-foreground">{profile.age || 'N/A'}</p>
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
                      {profile.date_of_birth ? format(new Date(profile.date_of_birth), 'PPP') : 'Not set'}
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
                    <p className="font-medium text-foreground">{profile.address || 'Not set'}</p>
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
                    <p className="font-medium text-foreground">{profile.contact || 'Not set'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
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
        </SheetContent>
      </Sheet>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
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

export default PersonalInformation;
