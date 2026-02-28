import React, { useMemo, useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Users, 
  Award,
  FileText,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X,
  LogIn,
  LogOut,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Topbar from '@/components/Topbar';
import { useData } from '@/context/DataContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const CERT_COLORS: Record<string, string> = {
  'Barangay Clearance': '#1a4de8',
  'Certificate of Indigency': '#0ab59e',
  'Certificate of Residency': '#ffc107',
  'Certificate of Low Income': '#ff6b35',
  'Oath of Undertaking': '#e91e63',
  'Business Permit': '#6f42c1',
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DashboardPage: React.FC = () => {
  const { getPendingCount, getTotalResidents, requests, notifications, updateRequestStatus, residents } = useData();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [approveTargetId, setApproveTargetId] = useState<string | null>(null);
  const [denyDialogOpen, setDenyDialogOpen] = useState(false);
  const [denyTargetId, setDenyTargetId] = useState<string | null>(null);
  const [denialReason, setDenialReason] = useState('');

  const pendingCount = getPendingCount();
  const totalResidents = getTotalResidents();
  const approvedToday = requests.filter(r => 
    r.status === 'Approved' && 
    r.dateProcessed && 
    new Date(r.dateProcessed).toDateString() === new Date().toDateString()
  ).length;
  const totalCertificates = requests.filter(r => r.status === 'Approved').length;

  // Derive weekly data from requests
  const weeklyData = useMemo(() => {
    const counts = new Array(7).fill(0);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    requests.forEach(r => {
      const date = new Date(r.dateRequested);
      if (date >= startOfWeek) {
        counts[date.getDay()]++;
      }
    });

    return DAY_NAMES.map((name, i) => ({ name, requests: counts[i] }));
  }, [requests]);

  // Derive pie chart data from requests
  const pieData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    requests.forEach(r => {
      typeCounts[r.certificateType] = (typeCounts[r.certificateType] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value]) => ({
      name,
      value,
      color: CERT_COLORS[name] || '#999',
    }));
  }, [requests]);

  // Derive monthly data from requests
  const monthlyData = useMemo(() => {
    const counts = new Array(12).fill(0);
    const currentYear = new Date().getFullYear();
    requests.forEach(r => {
      const date = new Date(r.dateRequested);
      if (date.getFullYear() === currentYear) {
        counts[date.getMonth()]++;
      }
    });
    return MONTH_NAMES.map((name, i) => ({ name, requests: counts[i] }));
  }, [requests]);

  // Fetch activity logs (login/logout)
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      setActivityLogs(data || []);
    };
    fetchLogs();
  }, []);

  // Combine request activities + login/logout logs
  const [activityExpanded, setActivityExpanded] = useState(false);
  const DEFAULT_VISIBLE = 5;

  const recentActivities = useMemo(() => {
    const requestActivities = requests.slice(0, 5).map(r => ({
      id: r.id,
      icon: r.status === 'Approved' ? CheckCircle : r.status === 'Denied' ? ThumbsDown : FileText,
      name: `${r.certificateType} - ${r.status}`,
      description: `${r.residentName} — ${r.purpose}`,
      date: new Date(r.dateRequested).toLocaleDateString(),
      time: new Date(r.dateRequested).getTime(),
      status: r.status,
      type: 'request' as const,
    }));

    const profileMap: Record<string, string> = {};
    residents.forEach(r => { profileMap[r.id] = `${r.firstName} ${r.lastName}`; });

    const authActivities = activityLogs.map(log => ({
      id: log.id,
      icon: log.action === 'login' ? LogIn : LogOut,
      name: log.action === 'login' ? 'User Logged In' : 'User Logged Out',
      description: profileMap[log.user_id] || log.user_id.slice(0, 8),
      date: new Date(log.created_at).toLocaleDateString(),
      time: new Date(log.created_at).getTime(),
      status: 'info' as const,
      type: 'auth' as const,
    }));

    return [...requestActivities, ...authActivities]
      .sort((a, b) => b.time - a.time);
  }, [requests, activityLogs, residents]);

  const visibleActivities = activityExpanded ? recentActivities : recentActivities.slice(0, DEFAULT_VISIBLE);

  const openApproveDialog = (id: string) => {
    setApproveTargetId(id);
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = () => {
    if (!approveTargetId) return;
    updateRequestStatus(approveTargetId, 'Approved');
    setApproveDialogOpen(false);
    setApproveTargetId(null);
    setSelectedRequest(null);
  };

  const openDenyDialog = (id: string) => {
    setDenyTargetId(id);
    setDenialReason('');
    setDenyDialogOpen(true);
  };

  const handleDenyConfirm = async () => {
    if (!denyTargetId || !denialReason.trim()) return;
    await supabase.from('certificate_requests').update({ denial_reason: denialReason.trim() }).eq('id', denyTargetId);
    await updateRequestStatus(denyTargetId, 'Denied');
    setDenyDialogOpen(false);
    setDenyTargetId(null);
    setDenialReason('');
    setSelectedRequest(null);
  };

  return (
    <div>
      <Topbar hideSearch />
      
      <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-warning flex items-center justify-center shrink-0">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-warning-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Pending Requests</p>
              <p className="text-xl sm:text-3xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-success flex items-center justify-center shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-success-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Issued Today</p>
              <p className="text-xl sm:text-3xl font-bold">{approvedToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Total Residents</p>
              <p className="text-xl sm:text-3xl font-bold">{totalResidents}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
              <Award className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Total Certificates</p>
              <p className="text-xl sm:text-3xl font-bold">{totalCertificates}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-4 sm:mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
            <CardTitle className="text-sm sm:text-base font-semibold">Weekly Request Volume</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-40 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#1a4de8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
            <CardTitle className="text-sm sm:text-base font-semibold">Certificate Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-36 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs sm:text-sm">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Line Graph */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
          <CardTitle className="text-sm sm:text-base font-semibold">Monthly Request Trend</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="h-40 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#6b7280" allowDecimals={false} tick={{ fontSize: 11 }} width={30} />
                  <Tooltip />
                  <Line type="monotone" dataKey="requests" stroke="#1a4de8" strokeWidth={2} dot={{ fill: '#1a4de8', r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
          <CardTitle className="text-sm sm:text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
            {visibleActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-2 sm:gap-4 py-2.5 sm:py-4 border-b last:border-0"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <activity.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-xs sm:text-sm">{activity.name}</p>
                  <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">{activity.date}</span>
                {activity.type === 'request' && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRequest(activity.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {activity.status === 'Pending' && (
                      <>
                         <Button
                          size="sm"
                          variant="default"
                          className="bg-success hover:bg-success/90"
                          onClick={() => openApproveDialog(activity.id)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openDenyDialog(activity.id)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {recentActivities.length > DEFAULT_VISIBLE && (
            <div className="flex justify-center pt-4">
              <Button variant="ghost" size="sm" onClick={() => setActivityExpanded(!activityExpanded)}>
                {activityExpanded ? 'Show Less' : `View More (${recentActivities.length - DEFAULT_VISIBLE} more)`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Detail Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {(() => {
            const req = requests.find(r => r.id === selectedRequest);
            if (!req) return <p className="text-muted-foreground">Request not found.</p>;
            return (
              <div className="space-y-5">
                {/* Resident Profile Section */}
                {(() => {
                  const resident = residents.find(r => r.id === req.residentId);
                  if (!resident) return null;
                  return (
                    <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border">
                      <div
                        className="relative w-16 h-16 rounded-full border-2 border-primary/20 overflow-hidden bg-muted flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors flex-shrink-0"
                        onClick={() => resident.avatarUrl && setViewingPhoto(resident.avatarUrl)}
                      >
                        {resident.avatarUrl ? (
                          <img src={resident.avatarUrl} alt={req.residentName} className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="font-semibold text-foreground text-base">{req.residentName}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{resident.email}</span>
                          {resident.contact && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{resident.contact}</span>}
                          {resident.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{resident.address}</span>}
                          {resident.dateOfBirth && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(resident.dateOfBirth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm text-primary font-medium">Request ID</p>
                    <p className="font-semibold text-foreground">{req.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Certificate Type</p>
                    <p className="font-semibold text-foreground">{req.certificateType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Purpose</p>
                    <p className="font-semibold text-foreground">{req.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Date Requested</p>
                    <p className="font-semibold text-foreground">{new Date(req.dateRequested).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Status</p>
                    <Badge className={req.status === 'Approved' ? 'bg-green-600' : req.status === 'Denied' ? 'bg-destructive' : 'bg-yellow-500 text-black'}>
                      {req.status}
                    </Badge>
                  </div>
                  {req.dateProcessed && (
                    <>
                      <div className="col-span-2">
                        <p className="text-sm text-primary font-medium">Date Processed</p>
                        <p className="font-semibold text-foreground">{new Date(req.dateProcessed).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </>
                  )}
                  {req.notes && (
                    <div className="col-span-2">
                      <p className="text-sm text-primary font-medium">Notes / Requirements</p>
                      <p className="font-semibold text-foreground">{req.notes}</p>
                    </div>
                  )}
                </div>
                {req.uploadedPhotos && req.uploadedPhotos.length > 0 && (
                  <div>
                    <p className="text-sm text-primary font-medium mb-2">Uploaded Requirements ({req.uploadedPhotos.length} file{req.uploadedPhotos.length > 1 ? 's' : ''})</p>
                    <div className="grid grid-cols-2 gap-2">
                      {req.uploadedPhotos.map((photo, index) => (
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
                {!req.uploadedPhotos && req.validIdFile && (
                  <div>
                    <p className="text-sm text-primary font-medium mb-2">Uploaded Documents</p>
                    <p className="font-semibold text-foreground">{req.validIdFile}</p>
                  </div>
                )}
                {req.status === 'Pending' && (
                  <div className="flex justify-center gap-3 pt-2">
                    <Button className="bg-green-600 hover:bg-green-700 px-6" onClick={() => openApproveDialog(req.id)}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" className="px-6" onClick={() => openDenyDialog(req.id)}>
                      <X className="h-4 w-4 mr-1" /> Deny
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
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
                placeholder="Enter reason for denial..."
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDenyDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDenyConfirm} disabled={!denialReason.trim()}>Confirm Deny</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPage;
