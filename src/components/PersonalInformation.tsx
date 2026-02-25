import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Save, X, User, Calendar, MapPin, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useAuth, Profile } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PersonalInformation: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { toast } = useToast();

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

  // Sync profile changes
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
      toast({ title: 'Camera Error', description: 'Unable to access camera. Please allow camera permissions.', variant: 'destructive' });
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
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedPhoto(dataUrl);
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
      const publicUrl = urlData.publicUrl;
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      setAvatarUrl(publicUrl);
      await refreshProfile();
      toast({ title: 'Photo Updated', description: 'Your profile picture has been saved.' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message || 'Could not upload photo.', variant: 'destructive' });
    }
    setCameraOpen(false);
    setCapturedPhoto(null);
  }, [capturedPhoto, user, refreshProfile, toast]);

  const validatePhone = (value: string) => {
    const cleaned = value.replace(/[^\d+]/g, '');
    setPhone(cleaned);
    if (cleaned && !/^(\+63|0)\d{10}$/.test(cleaned)) {
      setPhoneError('Enter a valid PH mobile number (e.g. 09171234567 or +639171234567)');
    } else {
      setPhoneError('');
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (phoneError) return;
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
      toast({ title: 'Saved', description: 'Your personal information has been updated.' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Could not save.', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (!profile || !user) return null;

  return (
    <>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative w-20 h-20 rounded-full border-2 border-primary/30 overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Profile Picture</p>
              <p className="text-xs text-muted-foreground mb-2">Take a photo using your camera</p>
              <Button size="sm" variant="outline" onClick={startCamera}>
                <Camera className="h-4 w-4 mr-2" /> Capture Photo
              </Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date of Birth */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Date of Birth
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn('w-full justify-start text-left font-normal', !dateOfBirth && 'text-muted-foreground')}
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
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
              </Label>
              <Input
                placeholder="09171234567"
                value={phone}
                onChange={(e) => validatePhone(e.target.value)}
                maxLength={13}
              />
              {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-muted-foreground" /> Current Address
            </Label>
            <Textarea
              placeholder="Enter your full current address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <Button onClick={handleSave} disabled={saving || !!phoneError}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onOpenChange={(open) => { if (!open) stopCamera(); }}>
        <DialogContent className="max-w-md">
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
