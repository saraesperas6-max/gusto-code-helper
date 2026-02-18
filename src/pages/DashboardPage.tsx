import React, { useMemo, useState } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Users, 
  Award,
  FileText,
  UserPlus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Topbar from '@/components/Topbar';
import { useData } from '@/context/DataContext';
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
  const { getPendingCount, getTotalResidents, requests, notifications, updateRequestStatus } = useData();
  const navigate = useNavigate();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

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

  // Recent activities derived from requests, sorted by date
  const recentActivities = useMemo(() => {
    return [...requests]
      .sort((a, b) => new Date(b.dateRequested).getTime() - new Date(a.dateRequested).getTime())
      .slice(0, 5)
      .map(r => ({
        id: r.id,
        icon: r.status === 'Approved' ? CheckCircle : r.status === 'Denied' ? ThumbsDown : FileText,
        name: `${r.certificateType} - ${r.status}`,
        description: `${r.residentName} — ${r.purpose}`,
        date: new Date(r.dateRequested).toLocaleDateString(),
        status: r.status,
      }));
  }, [requests]);

  const handleApprove = (id: string) => {
    updateRequestStatus(id, 'Approved');
  };

  const handleDeny = (id: string) => {
    updateRequestStatus(id, 'Denied');
  };

  return (
    <div>
      <Topbar searchPlaceholder="Search..." />
      
      <h2 className="text-2xl font-bold text-foreground mb-6">Dashboard Overview</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
              <Clock className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Requests</p>
              <p className="text-3xl font-bold">{pendingCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Issued Today</p>
              <p className="text-3xl font-bold">{approvedToday}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Residents</p>
              <p className="text-3xl font-bold">{totalResidents}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center">
              <Award className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Certificates</p>
              <p className="text-3xl font-bold">{totalCertificates}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Weekly Request Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="requests" fill="#1a4de8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Certificate Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
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
            <div className="mt-4 space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-sm">
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Monthly Request Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#1a4de8" strokeWidth={2} dot={{ fill: '#1a4de8', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            )}
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-center gap-4 py-4 border-b last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <activity.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{activity.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap">{activity.date}</span>
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
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(activity.id)}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeny(activity.id)}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm text-primary font-medium">Request ID</p>
                    <p className="font-semibold text-foreground">{req.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-primary font-medium">Resident Name</p>
                    <p className="font-semibold text-foreground">{req.residentName}</p>
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
                    <Button className="bg-green-600 hover:bg-green-700 px-6" onClick={() => { handleApprove(req.id); setSelectedRequest(null); }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Approve
                    </Button>
                    <Button variant="destructive" className="px-6" onClick={() => { handleDeny(req.id); setSelectedRequest(null); }}>
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
    </div>
  );
};

export default DashboardPage;
