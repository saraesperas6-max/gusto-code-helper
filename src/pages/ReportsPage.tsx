import React, { useState, useMemo } from 'react';
import ReportsLogContent from '@/components/ReportsLogContent';
import AdminActivityLog from '@/components/AdminActivityLog';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Topbar from '@/components/Topbar';
import DateFilter from '@/components/DateFilter';
import { useData } from '@/context/DataContext';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilters, setDateFilters] = useState<{ month: number | null; date: Date | null }>({ month: null, date: null });
  
  const approvedRequests = requests.filter(r => r.status === 'Approved');
  const requestsYTD = approvedRequests.length;
  const totalResidents = residents.filter(r => r.status === 'Active').length;

  const filteredApprovedRequests = useMemo(() => {
    let result = approvedRequests;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.residentName.toLowerCase().includes(q) ||
        r.certificateType.toLowerCase().includes(q) ||
        r.purpose.toLowerCase().includes(q)
      );
    }
    if (dateFilters.month !== null) {
      result = result.filter(r => {
        const d = r.dateProcessed ? new Date(r.dateProcessed) : new Date(r.dateRequested);
        return d.getMonth() === dateFilters.month;
      });
    }
    if (dateFilters.date) {
      const fd = dateFilters.date;
      result = result.filter(r => {
        const d = r.dateProcessed ? new Date(r.dateProcessed) : new Date(r.dateRequested);
        return d.getFullYear() === fd.getFullYear() && d.getMonth() === fd.getMonth() && d.getDate() === fd.getDate();
      });
    }
    return result.sort((a, b) => {
      const dateA = a.dateProcessed ? new Date(a.dateProcessed).getTime() : new Date(a.dateRequested).getTime();
      const dateB = b.dateProcessed ? new Date(b.dateProcessed).getTime() : new Date(b.dateRequested).getTime();
      return dateB - dateA;
    });
  }, [approvedRequests, searchQuery, dateFilters]);

  // Monthly data derived from actual requests
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts: Record<string, number> = {};
    months.forEach(m => { counts[m] = 0; });
    approvedRequests.forEach(r => {
      const date = r.dateProcessed ? new Date(r.dateProcessed) : new Date(r.dateRequested);
      const monthName = months[date.getMonth()];
      counts[monthName]++;
    });
    return months.map(name => ({ name, certificates: counts[name] }));
  }, [approvedRequests]);

  // Pie chart data derived from actual requests
  const certificateTypeData = useMemo(() => {
    const colors = ['#3b82f6', '#22c55e', '#eab308', '#ef4444', '#8b5cf6', '#ec4899'];
    const typeCounts: Record<string, number> = {};
    approvedRequests.forEach(r => {
      typeCounts[r.certificateType] = (typeCounts[r.certificateType] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([name, value], i) => ({
      name, value, color: colors[i % colors.length],
    }));
  }, [approvedRequests]);

  return (
    <div>
      <Topbar searchPlaceholder="Search Reports..." onSearch={setSearchQuery} />
      
      <h2 className="text-lg sm:text-2xl font-bold text-foreground mb-3 sm:mb-4">Barangay Reports and Summaries</h2>
      <div className="mb-4 sm:mb-6">
        <DateFilter onFilterChange={setDateFilters} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-success flex items-center justify-center shrink-0">
              <Calendar className="h-4 w-4 sm:h-6 sm:w-6 text-success-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Requests Issued (YTD)</p>
              <p className="text-xl sm:text-3xl font-bold">{requestsYTD}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-2 sm:gap-4 p-3 sm:p-6">
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-warning flex items-center justify-center shrink-0">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-warning-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-sm text-muted-foreground truncate">Population Count</p>
              <p className="text-xl sm:text-3xl font-bold">{totalResidents}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
            <CardTitle className="text-sm sm:text-base font-semibold">Monthly Certificate Issuance</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-48 sm:h-64">
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

        {/* Pie Chart */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
            <CardTitle className="text-sm sm:text-base font-semibold">Certificate Types Distribution</CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="h-48 sm:h-64 flex items-center justify-center">
              {certificateTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={certificateTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
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
              ) : (
                <p className="text-muted-foreground text-sm">No data yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Certificate Log */}
      <Card>
        <CardHeader className="p-3 sm:p-6 pb-0 sm:pb-0">
          <CardTitle className="text-sm sm:text-base font-semibold">Certificate Issuance Log</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <ReportsLogContent requests={filteredApprovedRequests} searchQuery={searchQuery} />
        </CardContent>
      </Card>

      {/* Admin Activity Log */}
      <div className="mt-4 sm:mt-6">
        <AdminActivityLog searchQuery={searchQuery} dateFilters={dateFilters} />
      </div>
    </div>
  );
};

export default ReportsPage;
