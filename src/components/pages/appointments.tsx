/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Label } from '../ui/label';
import { Calendar } from '../ui/calendar';
import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, Edit } from 'lucide-react';
import { supabase } from '@/utils/backend/client';
import { Button } from '../ui/button';
import type { IAppointment } from '@/interfaces/appointment';
import type { IPatient } from '@/interfaces/patient';
import type { IDoctor } from '@/interfaces/doctor';
import type { IShift } from '@/interfaces/shift';
import type { AppointmentStatus } from '@/types';

// Extended interface for appointments with related data
interface IAppointmentWithDetails extends IAppointment {
    patient: IPatient;
    doctor: IDoctor;
    shift: IShift | null;
}

// Interface cho state của form thêm cuộc hẹn
interface NewAppointmentState {
    patient_id: string;
    doctor_id: string;
    appointment_date: string;
    shift_id: string;
    status: AppointmentStatus;
    notes: string;
}

// const timeSlots = [
//     '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
//     '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM'
// ];

export function Appointments() {
    const [appointments, setAppointments] = useState<IAppointmentWithDetails[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(true);
    const [patients, setPatients] = useState<IPatient[]>([]);
    const [patientsLoading, setPatientsLoading] = useState(true);
    const [doctors, setDoctors] = useState<IDoctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [shifts, setShifts] = useState<IShift[]>([]);
    const [shiftsLoading, setShiftsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [doctorFilter, setDoctorFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('All');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [viewMode, setViewMode] = useState<'calendar' | 'table'>('table');
    const [addAppointmentError, setAddAppointmentError] = useState<string | null>(null);
    const [newAppointment, setNewAppointment] = useState<NewAppointmentState>({
        patient_id: '',
        doctor_id: '',
        appointment_date: '',
        shift_id: '',
        status: 'Pending',
        notes: ''
    });

    useEffect(() => {
        fetchAppointments();
        fetchPatients();
        fetchDoctors();
        fetchShifts();
    }, []);

    // Hàm chung để cập nhật state form
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewAppointment(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component
    const handleSelectChange = (id: keyof NewAppointmentState, value: string) => {
        setNewAppointment(prev => ({ ...prev, [id]: value }));
    };

    const fetchAppointments = async () => {
        setAppointmentsLoading(true);
        try {
            const { data, error } = await supabase
                .from('appointment')
                .select(`
                    id, patient_id, doctor_id, appointment_date, shift_id, status, notes,
                    patient ( id, full_name, phone, email ),
                    doctor ( id, full_name, username, phone, email, specialty ( id, name ) ),
                    shift ( id, name, start_time, end_time )
                `);
            if (error) throw error;
            setAppointments(data as unknown as IAppointmentWithDetails[] || []);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const fetchPatients = async () => {
        setPatientsLoading(true);
        try {
            const { data, error } = await supabase
                .from('patient')
                .select('*')
                .eq('status', 'Active');
            if (error) throw error;
            setPatients(data || []);
        } catch (error) {
            console.error('Error fetching patients:', error);
        } finally {
            setPatientsLoading(false);
        }
    };

    const fetchDoctors = async () => {
        setDoctorsLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctor')
                .select(`
                    id, full_name, username, phone, email, status,
                    specialty ( id, name, description )
                `)
                .eq('status', 'Active');
            if (error) throw error;
            setDoctors(data as unknown as IDoctor[] || []);
        } catch (error) {
            console.error('Error fetching doctors:', error);
        } finally {
            setDoctorsLoading(false);
        }
    };

    const fetchShifts = async () => {
        setShiftsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shift')
                .select('*');
            if (error) throw error;
            setShifts(data || []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setShiftsLoading(false);
        }
    };

    const resetNewAppointmentState = () => {
        setNewAppointment({
            patient_id: '',
            doctor_id: '',
            appointment_date: '',
            shift_id: '',
            status: 'Pending',
            notes: ''
        });
        setAddAppointmentError(null);
    };

    const handleAddAppointment = async () => {
        setAddAppointmentError(null);

        // Kiểm tra validation cơ bản
        if (!newAppointment.patient_id || !newAppointment.doctor_id || !newAppointment.appointment_date) {
            setAddAppointmentError("Vui lòng điền tất cả các trường bắt buộc (Bệnh nhân, Bác sĩ, Ngày).");
            return;
        }

        try {
            // 1. Chuẩn bị dữ liệu để chèn
            const appointmentDataToInsert = {
                patient_id: parseInt(newAppointment.patient_id, 10),
                doctor_id: parseInt(newAppointment.doctor_id, 10),
                appointment_date: newAppointment.appointment_date,
                shift_id: newAppointment.shift_id ? parseInt(newAppointment.shift_id, 10) : null,
                status: newAppointment.status,
                notes: newAppointment.notes || null
            };

            const { data, error } = await supabase
                .from('appointment')
                .insert([appointmentDataToInsert])
                .select(`
                    id, patient_id, doctor_id, appointment_date, shift_id, status, notes,
                    patient ( id, full_name, phone, email ),
                    doctor ( id, full_name, username, phone, email, specialty ( id, name ) ),
                    shift ( id, name, start_time, end_time )
                `);

            if (error) {
                console.error('Supabase error adding appointment:', error);
                throw new Error(error.message);
            }

            const addedAppointment = data[0] as unknown as IAppointmentWithDetails;
            setAppointments(prevAppointments => [...prevAppointments, addedAppointment]);

            // Đóng dialog và reset form
            setIsAddDialogOpen(false);
            resetNewAppointmentState();

            console.log('Appointment added successfully:', addedAppointment);
        } catch (error: any) {
            console.error('Error adding appointment:', error);
            setAddAppointmentError(`Thêm cuộc hẹn thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const filteredAppointments = appointments.filter(appointment => {
        if (!appointment || typeof appointment !== 'object') return false;

        const patientName = appointment.patient?.full_name || '';
        const doctorName = appointment.doctor?.full_name || '';
        const notes = appointment.notes || '';
        const status = appointment.status || '';
        const date = appointment.appointment_date ? new Date(appointment.appointment_date).toISOString().split('T')[0] : '';

        const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notes.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || status === statusFilter;
        const matchesDoctor = doctorFilter === 'All' || appointment.doctor_id?.toString() === doctorFilter;
        const matchesDate = dateFilter === 'All' || date === dateFilter;

        return matchesSearch && matchesStatus && matchesDoctor && matchesDate;
    });

    const getStatusBadge = (status: AppointmentStatus) => {
        const variant = status === 'Pending' ? 'secondary' :
            status === 'Completed' ? 'outline' : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
    };

    const getShiftColor = (shiftName: string) => {
        return shiftName?.toLowerCase().includes('morning') ? 'text-blue-600' :
            shiftName?.toLowerCase().includes('afternoon') ? 'text-orange-600' :
                shiftName?.toLowerCase().includes('evening') ? 'text-purple-600' : 'text-gray-600';
    };

    // Calendar view data
    const getAppointmentsForDate = (date: Date) => {
        const dateString = date.toISOString().split('T')[0];
        return appointments.filter(apt => {
            const aptDate = apt?.appointment_date ? new Date(apt.appointment_date).toISOString().split('T')[0] : '';
            return apt && aptDate === dateString;
        });
    };

    // Loading state
    const loading = appointmentsLoading || patientsLoading || doctorsLoading || shiftsLoading;

    if (loading) {
        return <div className="text-center py-10">Đang tải cuộc hẹn, bệnh nhân, bác sĩ và ca làm việc...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Lịch hẹn</h1>
                    <p className="text-muted-foreground">
                        Quản lý lịch hẹn và lịch trình của bệnh nhân
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <div className="flex rounded-lg border">
                        <Button
                            variant={viewMode === 'table' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className="rounded-r-none"
                        >
                            Bảng
                        </Button>
                        <Button
                            variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('calendar')}
                            className="rounded-l-none"
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Lịch
                        </Button>
                    </div>

                    <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                        setIsAddDialogOpen(open);
                        if (!open) resetNewAppointmentState();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Tạo lịch hẹn mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Tạo lịch hẹn mới</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="patient_id">Bệnh nhân</Label>
                                    <Select
                                        value={newAppointment.patient_id}
                                        onValueChange={(val) => handleSelectChange('patient_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn bệnh nhân" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map(patient => (
                                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                                    {patient.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="doctor_id">Bác sĩ</Label>
                                    <Select
                                        value={newAppointment.doctor_id}
                                        onValueChange={(val) => handleSelectChange('doctor_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn bác sĩ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(doctor => (
                                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                    Dr. {doctor.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="appointment_date">Ngày</Label>
                                    <Input
                                        id="appointment_date"
                                        type="date"
                                        value={newAppointment.appointment_date}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="shift_id">Ca làm việc</Label>
                                    <Select
                                        value={newAppointment.shift_id}
                                        onValueChange={(val) => handleSelectChange('shift_id', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn ca làm việc (tùy chọn)" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Không có ca</SelectItem>
                                            {shifts.map(shift => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                                    {shift.name} ({shift.start_time} - {shift.end_time})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Trạng thái</Label>
                                    <Select
                                        value={newAppointment.status}
                                        onValueChange={(val) => handleSelectChange('status', val as AppointmentStatus)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                            <SelectItem value="Completed">Hoàn thành</SelectItem>
                                            <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <Label htmlFor="notes">Ghi chú</Label>
                                    <Input
                                        id="notes"
                                        placeholder="Ghi chú hoặc lý do cuộc hẹn"
                                        value={newAppointment.notes}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                            {addAppointmentError && (
                                <p className="text-red-500 text-sm mt-2">{addAppointmentError}</p>
                            )}
                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                                    Hủy
                                </Button>
                                <Button onClick={handleAddAppointment}>
                                    Tạo lịch hẹn
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {viewMode === 'table' ? (
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                            <CardTitle>Tất cả lịch hẹn</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Tìm kiếm lịch hẹn..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-8 w-64"
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-32">
                                        <Filter className="mr-2 h-4 w-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">Tất cả trạng thái</SelectItem>
                                        <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                        <SelectItem value="Completed">Hoàn thành</SelectItem>
                                        <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="All">Tất cả bác sĩ</SelectItem>
                                        {doctors.map(doctor => (
                                            <SelectItem key={doctor.id} value={doctor.id.toString()}>Dr. {doctor.full_name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input
                                    type="date"
                                    value={dateFilter === 'All' ? '' : dateFilter}
                                    onChange={(e) => setDateFilter(e.target.value || 'All')}
                                    className="w-40"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bệnh nhân</TableHead>
                                        <TableHead>Bác sĩ</TableHead>
                                        <TableHead>Ngày</TableHead>
                                        <TableHead>Thời gian</TableHead>
                                        <TableHead>Ca làm việc</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Ghi chú</TableHead>
                                        {/* <TableHead>Actions</TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAppointments.map((appointment) => (
                                        <TableRow key={appointment.id}>
                                            <TableCell>{appointment.patient?.full_name || 'N/A'}</TableCell>
                                            <TableCell>Dr. {appointment.doctor?.full_name || 'N/A'}</TableCell>
                                            <TableCell>{appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleDateString() : 'N/A'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center">
                                                    <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                                                    {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={getShiftColor(appointment.shift?.name || '')}>
                                                    {appointment.shift?.name || 'Không có ca'}
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                                            <TableCell className="max-w-40 truncate">{appointment.notes || '—'}</TableCell>
                                            {/* <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell> */}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Lịch</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="rounded-md"
                            />
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>
                                Lịch hẹn cho ngày {selectedDate?.toLocaleDateString()}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedDate && (
                                <div className="space-y-3">
                                    {getAppointmentsForDate(selectedDate).length === 0 ? (
                                        <p className="text-muted-foreground text-center py-8">
                                            Không có lịch hẹn nào được lên lịch cho ngày này
                                        </p>
                                    ) : (
                                        getAppointmentsForDate(selectedDate).map((appointment) => (
                                            <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-lg">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">{appointment.patient?.full_name || 'N/A'}</span>
                                                        <span className="text-muted-foreground">•</span>
                                                        <span className="text-muted-foreground">Dr. {appointment.doctor?.full_name || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {appointment.appointment_date ? new Date(appointment.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                        </span>
                                                        <span className={`text-sm ${getShiftColor(appointment.shift?.name || '')}`}>
                                                            {appointment.shift?.name || 'Không có ca'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{appointment.notes || 'Không có ghi chú'}</p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(appointment.status)}
                                                    <div className="flex space-x-1">
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
