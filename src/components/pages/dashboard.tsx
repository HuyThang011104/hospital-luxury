import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Users, UserCheck, Bed, Calendar, DollarSign, Database } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ResponsiveContainer } from 'recharts';
import { supabase } from '@/utils/backend/client';
import type { IPatient } from '@/interfaces/patient';
import type { IDoctor } from '@/interfaces/doctor';
import type { IAppointment } from '@/interfaces/appointment';
import type { IDepartment } from '@/interfaces/department';
import type { IBed } from '@/interfaces/bed';
import type { IMedicalRecord } from '@/interfaces/medical_record';
import type { Gender, AppointmentStatus, BedStatus } from '@/types';

// Interface cho dashboard statistics
interface DashboardStats {
    totalPatients: number;
    activeDoctors: number;
    todayAppointments: number;
    totalRecords: number;
    availableBeds: number;
    pendingPayments: number;
}

// Interface cho appointment với thông tin liên quan
interface IAppointmentWithDetails extends IAppointment {
    patient: { full_name: string } | null;
    doctor: { full_name: string } | null;
    department: { name: string } | null;
}

// Interface cho bed với thông tin phòng
interface IBedWithRoom extends IBed {
    room: {
        department: { name: string } | null;
    } | null;
}

// Interface cho dữ liệu biểu đồ
interface GenderData {
    name: string;
    value: number;
    color: string;
}

interface DepartmentData {
    department: string;
    appointments: number;
}

interface RegistrationData {
    month: string;
    patients: number;
}

export function Dashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [genderData, setGenderData] = useState<GenderData[]>([
        { name: 'Nam', value: 0, color: '#3b82f6' },
        { name: 'Nữ', value: 0, color: '#ec4899' }
    ]);
    const [departmentData, setDepartmentData] = useState<DepartmentData[]>([
        { department: 'Tim mạch', appointments: 0 },
        { department: 'Thần kinh', appointments: 0 },
        { department: 'Cơ xương khớp', appointments: 0 },
        { department: 'Nhi', appointments: 0 },
        { department: 'Cấp cứu', appointments: 0 },
        { department: 'Phẫu thuật', appointments: 0 }
    ]);
    const [registrationData, setRegistrationData] = useState<RegistrationData[]>([
        { month: 'Tháng 1', patients: 0 },
        { month: 'Tháng 2', patients: 0 },
        { month: 'Tháng 3', patients: 0 },
        { month: 'Tháng 4', patients: 0 },
        { month: 'Tháng 5', patients: 0 },
        { month: 'Tháng 6', patients: 0 }
    ]);
    const [recentAppointments, setRecentAppointments] = useState<IAppointmentWithDetails[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Fetch all data in parallel
            const [patientsRes, doctorsRes, appointmentsRes, departmentsRes, bedsRes, medicalRecordsRes] = await Promise.all([
                supabase.from('patient').select('*'),
                supabase.from('doctor').select('*').eq('status', 'Active'),
                supabase.from('appointment').select(`*, patient(full_name), doctor(full_name), department(name)`),
                supabase.from('department').select('*'),
                supabase.from('bed').select('*, room(department(name))'),
                supabase.from('medical_record').select('*')
            ]);

            const patients: IPatient[] = patientsRes.data || [];
            const doctors: IDoctor[] = doctorsRes.data || [];
            const appointments: IAppointmentWithDetails[] = appointmentsRes.data || [];
            const departments: IDepartment[] = departmentsRes.data || [];
            const beds: IBedWithRoom[] = bedsRes.data || [];
            const medicalRecords: IMedicalRecord[] = medicalRecordsRes.data || [];

            // Department appointment statistics - merge with real departments
            const deptStats: Record<string, number> = {};
            if (departments) {
                departments.forEach(dept => {
                    deptStats[dept.name] = 0;
                });
            }
            appointments.forEach(apt => {
                const deptName = apt.department?.name || 'Other';
                deptStats[deptName] = (deptStats[deptName] || 0) + 1;
            });

            // Calculate statistics
            const today = new Date().toISOString().split('T')[0];
            const todayAppointments = appointments.filter(apt => apt.appointment_date?.startsWith(today));
            const availableBeds = beds.filter(bed => bed.status === 'Available' as BedStatus).length;

            // Recent appointments (last 5)
            const recent = appointments
                .sort((a, b) => new Date(b.appointment_date || 0).getTime() - new Date(a.appointment_date || 0).getTime())
                .slice(0, 5);

            // Gender statistics
            const maleCount = patients.filter(p => p.gender === 'Male' as Gender).length;
            const femaleCount = patients.filter(p => p.gender === 'Female' as Gender).length;



            // Monthly registration data (last 6 months)
            const months = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
            const currentMonth = new Date().getMonth();
            const monthlyData = months.map((month, index) => {
                const monthIndex = (currentMonth - 5 + index + 12) % 12;
                const yearOffset = currentMonth - 5 + index < 0 ? -1 : 0;
                const targetDate = new Date(new Date().getFullYear() + yearOffset, monthIndex, 1);
                const monthPatients = patients.filter(p => {
                    const joinDate = new Date(p.join_date);
                    return joinDate.getMonth() === monthIndex &&
                        joinDate.getFullYear() === targetDate.getFullYear();
                }).length;
                return { month, patients: monthPatients };
            });

            // Set all states
            setStats({
                totalPatients: patients.length,
                activeDoctors: doctors.length,
                todayAppointments: todayAppointments.length,
                totalRecords: medicalRecords.length,
                availableBeds: availableBeds,
                pendingPayments: 45230, // This would need payment table integration
            } as DashboardStats);

            setGenderData([
                { name: 'Nam', value: maleCount, color: '#3b82f6' },
                { name: 'Nữ', value: femaleCount, color: '#ec4899' }
            ]);

            setDepartmentData(Object.entries(deptStats).map(([dept, count]) => ({ department: dept, appointments: count })));
            setRegistrationData(monthlyData);
            setRecentAppointments(recent);

        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Set default stats on error
            setStats({
                totalPatients: 0,
                activeDoctors: 0,
                todayAppointments: 0,
                totalRecords: 0,
                availableBeds: 0,
                pendingPayments: 0,
            } as DashboardStats);
        } finally {
            setLoading(false);
        }
    };

    const summaryData = stats ? [
        {
            title: 'Tổng số bệnh nhân',
            value: stats.totalPatients.toString(),
            change: '+12%',
            trend: 'up',
            icon: Users,
            color: 'text-blue-600'
        },
        {
            title: 'Bác sĩ đang làm việc',
            value: stats.activeDoctors.toString(),
            change: '+3%',
            trend: 'up',
            icon: UserCheck,
            color: 'text-green-600'
        },
        {
            title: 'Giường trống',
            value: stats.availableBeds.toString(),
            change: '-5%',
            trend: 'down',
            icon: Bed,
            color: 'text-orange-600'
        },
        {
            title: 'Lịch hẹn hôm nay',
            value: stats.todayAppointments.toString(),
            change: '+8%',
            trend: 'up',
            icon: Calendar,
            color: 'text-purple-600'
        },
        {
            title: 'Thanh toán chờ xử lý',
            value: `${stats.pendingPayments.toLocaleString()}đ`,
            change: '-2%',
            trend: 'down',
            icon: DollarSign,
            color: 'text-red-600'
        }
    ] : [];

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1>Tổng quan</h1>
                    <p className="text-muted-foreground">
                        Đang tải tổng quan bệnh viện và các chỉ số chính...
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Card key={index}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <div className="h-4 w-20 bg-muted rounded animate-pulse"></div>
                                <div className="h-4 w-4 bg-muted rounded animate-pulse"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-8 w-16 bg-muted rounded animate-pulse mb-2"></div>
                                <div className="h-5 w-24 bg-muted rounded animate-pulse"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Tổng quan</h1>
                    <p className="text-muted-foreground">
                        Tổng quan bệnh viện và các chỉ số chính
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {summaryData.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Card key={item.title}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">
                                    {item.title}
                                </CardTitle>
                                <Icon className={`h-4 w-4 ${item.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{item.value}</div>
                                <Badge
                                    variant={item.trend === 'up' ? 'default' : 'destructive'}
                                    className="text-xs mt-1"
                                >
                                    {item.change} so với tháng trước
                                </Badge>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patients by Gender */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bệnh nhân theo giới tính</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Appointments by Department */}
                <Card>
                    <CardHeader>
                        <CardTitle>Lịch hẹn theo khoa</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={departmentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="appointments" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Patient Registrations */}
                <Card>
                    <CardHeader>
                        <CardTitle>Đăng ký bệnh nhân</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={200}>
                            <LineChart data={registrationData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="patients" stroke="#10b981" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Lịch hẹn gần đây</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentAppointments.length > 0 ? (
                                recentAppointments.map((appointment) => (
                                    <div key={appointment.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{appointment.patient?.full_name || 'Bệnh nhân không xác định'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                BS. {appointment.doctor?.full_name || 'Bác sĩ không xác định'} •
                                                {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                appointment.status === 'Completed' as AppointmentStatus ? 'default' :
                                                    appointment.status === 'Pending' as AppointmentStatus ? 'secondary' : 'destructive'
                                            }
                                        >
                                            {appointment.status === 'Completed' ? 'Hoàn thành' :
                                              appointment.status === 'Pending' ? 'Chờ xử lý' :
                                              appointment.status === 'Cancelled' ? 'Đã hủy' :
                                              'Không xác định'}
                                        </Badge>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-4">Không có lịch hẹn gần đây</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Cảnh báo quan trọng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[
                                { message: 'Giường ICU #12 cần chú ý ngay lập tức', priority: 'high', time: '5 phút trước' },
                                { message: 'Tồn kho thuốc sắp hết: Amoxicillin', priority: 'medium', time: '15 phút trước' },
                                { message: 'Bảo trì thiết bị đến hạn: Máy MRI #2', priority: 'medium', time: '1 giờ trước' },
                                { message: 'Bệnh nhân mới nhập viện tại Cấp cứu', priority: 'low', time: '2 giờ trước' }
                            ].map((alert, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className={`w-2 h-2 rounded-full mt-2 ${alert.priority === 'high' ? 'bg-red-500' :
                                        alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                                        }`} />
                                    <div className="flex-1">
                                        <p className="text-sm">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground">{alert.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}