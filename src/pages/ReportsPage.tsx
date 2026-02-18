import React from 'react';
import { Home, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Topbar from '@/components/Topbar';
import { useData } from '@/context/DataContext';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

const ReportsPage: React.FC = () => {
  const { requests, residents } = useData();
  
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const totalHouseholds = Math.ceil(residents.filter(r => r.status === 'Active').length / 2); // Estimate
  const requestsYTD = approvedRequests.length;
  const totalResidents = residents.filter(r => r.status === 'Active').length;

  // Monthly data for charts
  const monthlyData = [
    { name: 'Jan', certificates: 5, residents: 45 },
    { name: 'Feb', certificates: 8, residents: 48 },
    { name: 'Mar', certificates: 12, residents: 52 },
    { name: 'Apr', certificates: 7, residents: 55 },
    { name: 'May', certificates: 10, residents: 58 },
    { name: 'Jun', certificates: 6, residents: 60 },
  ];

  // Pie chart data for certificate types
  const certificateTypeData = [
    { name: 'Barangay Clearance', value: 35, color: '#3b82f6' },
    { name: 'Certificate of Residency', value: 25, color: '#22c55e' },
    { name: 'Certificate of Indigency', value: 20, color: '#eab308' },
    { name: 'Business Permit', value: 15, color: '#ef4444' },
    { name: 'Others', value: 5, color: '#8b5cf6' },
  ];

  return (
    <div>
      <Topbar searchPlaceholder="Search Reports..." />
      
      <h2 className="text-2xl font-bold text-foreground mb-6">Barangay Reports and Summaries</h2>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <Home className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Households</p>
              <p className="text-3xl font-bold">{totalHouseholds}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center">
              <Calendar className="h-6 w-6 text-success-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Requests Issued (YTD)</p>
              <p className="text-3xl font-bold">{requestsYTD}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-warning flex items-center justify-center">
              <Users className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Population Count</p>
              <p className="text-3xl font-bold">{totalResidents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Certificate Issuance (Bar Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="certificates" fill="hsl(170, 50%, 40%)" radius={[4, 4, 0, 0]} name="Certificates" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Population Growth Trend (Line Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="residents" 
                    stroke="hsl(220, 70%, 50%)" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(220, 70%, 50%)', strokeWidth: 2, r: 5 }}
                    name="Residents"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="certificates" 
                    stroke="hsl(145, 55%, 42%)" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(145, 55%, 42%)', strokeWidth: 2, r: 4 }}
                    name="Certificates"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Certificate Types Distribution (Pie Chart)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={certificateTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={true}
                  >
                    {certificateTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Log */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Detailed Certificate Issuance Log</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATE ISSUED</TableHead>
                <TableHead>CERTIFICATE TYPE</TableHead>
                <TableHead>RESIDENT</TableHead>
                <TableHead>PURPOSE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvedRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.dateProcessed 
                      ? format(new Date(request.dateProcessed), 'MMM dd, yyyy')
                      : format(new Date(request.dateRequested), 'MMM dd, yyyy')
                    }
                  </TableCell>
                  <TableCell>{request.certificateType}</TableCell>
                  <TableCell>{request.residentName}</TableCell>
                  <TableCell>{request.purpose}</TableCell>
                </TableRow>
              ))}
              {approvedRequests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No certificates issued yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
