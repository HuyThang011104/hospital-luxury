/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Plus, Calendar, Clock, Users, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '@/utils/backend/client';
import type { IDoctorWorkSchedule } from '@/interfaces/doctor_work_schedule';
import type { ILeaveRequest } from '@/interfaces/leave_request';
import type { IDoctor } from '@/interfaces/doctor';
import type { IRoom } from '@/interfaces/room';
import type { IShift } from '@/interfaces/shift';
import type { WorkScheduleStatus, LeaveRequestStatus } from '@/types';

// Extended interface for schedules with related data
interface IWorkScheduleWithDetails extends IDoctorWorkSchedule {
    doctor: IDoctor;
    shift: IShift;
    room: IRoom;
}

// Extended interface for leave requests with doctor details
interface ILeaveRequestWithDetails extends ILeaveRequest {
    doctor: IDoctor;
}

// Interface cho state của form thêm lịch làm việc
interface NewScheduleState {
    doctor_id: string;
    shift_id: string;
    room_id: string;
    work_date: string;
    status: WorkScheduleStatus;
}

export function Schedules() {
    const [schedules, setSchedules] = useState<IWorkScheduleWithDetails[]>([]);
    const [schedulesLoading, setSchedulesLoading] = useState(true);
    const [leaveRequests, setLeaveRequests] = useState<ILeaveRequestWithDetails[]>([]);
    const [leaveRequestsLoading, setLeaveRequestsLoading] = useState(true);
    const [doctors, setDoctors] = useState<IDoctor[]>([]);
    const [doctorsLoading, setDoctorsLoading] = useState(true);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [roomsLoading, setRoomsLoading] = useState(true);
    const [shifts, setShifts] = useState<IShift[]>([]);
    const [shiftsLoading, setShiftsLoading] = useState(true);

    const [isAssignShiftDialogOpen, setIsAssignShiftDialogOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [addScheduleError, setAddScheduleError] = useState<string | null>(null);
    const [leaveRequestError, setLeaveRequestError] = useState<string | null>(null);

    const [newSchedule, setNewSchedule] = useState<NewScheduleState>({
        doctor_id: '',
        shift_id: '',
        room_id: '',
        work_date: '',
        status: 'Scheduled'
    });

    useEffect(() => {
        fetchSchedules();
        fetchLeaveRequests();
        fetchDoctors();
        fetchRooms();
        fetchShifts();
    }, [selectedDate]);

    // Hàm chung để cập nhật state form lịch làm việc
    const handleScheduleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setNewSchedule(prev => ({
            ...prev,
            [id]: value
        }));
    };

    // Hàm cho Select Component
    const handleScheduleSelectChange = (id: keyof NewScheduleState, value: string) => {
        setNewSchedule(prev => ({ ...prev, [id]: value }));
    };

    const fetchSchedules = async () => {
        setSchedulesLoading(true);
        try {
            const { data, error } = await supabase
                .from('doctor_work_schedule')
                .select(`
                *,
                doctor (*, specialty (*)),
                shift (*),
                room (*, department (*))
                `)
                .eq('work_date', selectedDate);

            if (error) throw error;
            setSchedules(data as unknown as IWorkScheduleWithDetails[]);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        } finally {
            setSchedulesLoading(false);
        }
    };

    const fetchLeaveRequests = async () => {
        setLeaveRequestsLoading(true);
        try {
            const { data, error } = await supabase
                .from('leave_request')
                .select(`
                    id, doctor_id, request_date, start_date, end_date, reason, status,
                    doctor ( id, full_name, username, phone, email, specialty ( id, name ) )
                `)
                .order('request_date', { ascending: false });
            if (error) throw error;
            setLeaveRequests(data as unknown as ILeaveRequestWithDetails[] || []);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
        } finally {
            setLeaveRequestsLoading(false);
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

    const fetchRooms = async () => {
        setRoomsLoading(true);
        try {
            const { data, error } = await supabase
                .from('room')
                .select('*')
                .order('name');
            if (error) throw error;
            setRooms(data || []);
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setRoomsLoading(false);
        }
    };

    const fetchShifts = async () => {
        setShiftsLoading(true);
        try {
            const { data, error } = await supabase
                .from('shift')
                .select('*')
                .order('start_time');
            if (error) throw error;
            setShifts(data || []);
        } catch (error) {
            console.error('Error fetching shifts:', error);
        } finally {
            setShiftsLoading(false);
        }
    };

    const resetNewScheduleState = () => {
        setNewSchedule({
            doctor_id: '',
            shift_id: '',
            room_id: '',
            work_date: '',
            status: 'Scheduled'
        });
        setAddScheduleError(null);
    };

    const handleAssignShift = async () => {
        setAddScheduleError(null);

        // Kiểm tra validation cơ bản
        if (!newSchedule.doctor_id || !newSchedule.shift_id || !newSchedule.room_id || !newSchedule.work_date) {
            setAddScheduleError("Vui lòng điền tất cả các trường bắt buộc.");
            return;
        }

        try {
            const scheduleDataToInsert = {
                doctor_id: parseInt(newSchedule.doctor_id, 10),
                shift_id: parseInt(newSchedule.shift_id, 10),
                room_id: parseInt(newSchedule.room_id, 10),
                work_date: new Date(newSchedule.work_date).toISOString().split('T')[0],
                status: newSchedule.status
            };

            const { data, error } = await supabase
                .from('doctor_work_schedule')
                .insert([scheduleDataToInsert])
                .select(`
                    id, doctor_id, shift_id, room_id, work_date, status,
                    doctor ( id, full_name, username, phone, email, specialty ( id, name ) ),
                    shift ( id, name, start_time, end_time ),
                    room ( id, name, type, floor,
                    department (id, name) )
                `);

            if (error) {
                console.error('Supabase error adding schedule:', error);
                throw new Error(error.message);
            }

            const addedSchedule = data[0] as unknown as IWorkScheduleWithDetails;
            setSchedules(prevSchedules => [...prevSchedules, addedSchedule]);

            // Đóng dialog và reset form
            setIsAssignShiftDialogOpen(false);
            resetNewScheduleState();

            console.log('Schedule added successfully:', addedSchedule);
        } catch (error: any) {
            console.error('Error adding schedule:', error);
            setAddScheduleError(`Phân ca làm việc thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const approveLeave = async (id: number) => {
        setLeaveRequestError(null);
        try {
            const { error } = await supabase
                .from('leave_request')
                .update({ status: 'Approved' })
                .eq('id', id);

            if (error) throw error;

            setLeaveRequests(prevRequests =>
                prevRequests.map(req =>
                    req.id === id ? { ...req, status: 'Approved' } : req
                )
            );

            console.log('Leave request approved:', id);
        } catch (error: any) {
            console.error('Error approving leave request:', error);
            setLeaveRequestError(`Duyệt yêu cầu nghỉ phép thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const rejectLeave = async (id: number) => {
        setLeaveRequestError(null);
        try {
            const { error } = await supabase
                .from('leave_request')
                .update({ status: 'Rejected' })
                .eq('id', id);

            if (error) throw error;

            setLeaveRequests(prevRequests =>
                prevRequests.map(req =>
                    req.id === id ? { ...req, status: 'Rejected' } : req
                )
            );

            console.log('Leave request rejected:', id);
        } catch (error: any) {
            console.error('Error rejecting leave request:', error);
            setLeaveRequestError(`Từ chối yêu cầu nghỉ phép thất bại: ${error.message || 'Lỗi không xác định'}`);
        }
    };

    const getStatusBadge = (status: WorkScheduleStatus) => {
        const variant = status === 'Scheduled' ? 'default' :
            status === 'Completed' ? 'outline' : 'destructive';
        return <Badge variant={variant}>{status.replace('_', ' ')}</Badge>;
    };

    const getLeaveStatusBadge = (status: LeaveRequestStatus) => {
        const variant = status === 'Approved' ? 'default' :
            status === 'Pending' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
    };

    const getShiftColor = (shiftName: string) => {
        return shiftName?.toLowerCase().includes('morning') ? 'text-blue-600' :
            shiftName?.toLowerCase().includes('afternoon') ? 'text-orange-600' :
                shiftName?.toLowerCase().includes('night') ? 'text-purple-600' : 'text-gray-600';
    };

    const calculateDaysBetween = (startDate: string, endDate: string) => {
        if (!startDate || !endDate) return 0;
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays + 1; // Inclusive of both dates
    };

    // Loading state
    const loading = schedulesLoading || leaveRequestsLoading || doctorsLoading || roomsLoading || shiftsLoading;

    if (loading) {
        return <div className="text-center py-10">Đang tải lịch làm việc, yêu cầu nghỉ phép, bác sĩ, phòng và ca làm việc...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1>Lịch làm việc</h1>
                    <p className="text-muted-foreground">
                        Quản lý lịch làm việc và yêu cầu nghỉ phép của bác sĩ
                    </p>
                </div>
                {leaveRequestError && (
                    <div className="text-red-500 text-sm">{leaveRequestError}</div>
                )}
            </div>

            <Tabs defaultValue="schedules" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="schedules" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Lịch làm việc
                    </TabsTrigger>
                    <TabsTrigger value="leave-requests" className="flex items-center">
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Yêu cầu nghỉ phép
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="schedules">
                    <div className="space-y-4">
                        {/* Schedule Controls */}
                        <Card>
                            <CardHeader>
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                    <CardTitle>Tổng quan lịch làm việc</CardTitle>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-40"
                                        />
                                        <Dialog open={isAssignShiftDialogOpen} onOpenChange={(open) => {
                                            setIsAssignShiftDialogOpen(open);
                                            if (!open) resetNewScheduleState();
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Phân ca làm việc
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Phân ca làm việc mới</DialogTitle>
                                                </DialogHeader>
                                                <div className="grid grid-cols-2 gap-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="doctor_id">Bác sĩ</Label>
                                                        <Select
                                                            value={newSchedule.doctor_id}
                                                            onValueChange={(value) => handleScheduleSelectChange('doctor_id', value)}
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
                                                        <Label htmlFor="room_id">Phòng</Label>
                                                        <Select
                                                            value={newSchedule.room_id}
                                                            onValueChange={(value) => handleScheduleSelectChange('room_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn phòng" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {rooms.map(room => (
                                                                    <SelectItem key={room.id} value={room.id.toString()}>
                                                                        {room.name} ({room.type})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="work_date">Ngày</Label>
                                                        <Input
                                                            id="work_date"
                                                            type="date"
                                                            value={newSchedule.work_date}
                                                            onChange={handleScheduleInputChange}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="shift_id">Ca làm việc</Label>
                                                        <Select
                                                            value={newSchedule.shift_id}
                                                            onValueChange={(value) => handleScheduleSelectChange('shift_id', value)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn ca làm việc" />
                                                            </SelectTrigger>
                                                            <SelectContent>
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
                                                            value={newSchedule.status}
                                                            onValueChange={(value) => handleScheduleSelectChange('status', value as WorkScheduleStatus)}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Chọn trạng thái" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Scheduled">Đã lên lịch</SelectItem>
                                                                <SelectItem value="In Progress">Đang làm việc</SelectItem>
                                                                <SelectItem value="Completed">Hoàn thành</SelectItem>
                                                                <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                {addScheduleError && (
                                                    <p className="text-red-500 text-sm mt-2">{addScheduleError}</p>
                                                )}
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setIsAssignShiftDialogOpen(false)}>
                                                        Hủy
                                                    </Button>
                                                    <Button onClick={handleAssignShift}>
                                                        Phân ca làm việc
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Schedule Grid */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    Lịch làm việc cho ngày {new Date(selectedDate).toLocaleDateString()}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Bác sĩ</TableHead>
                                                <TableHead>Phòng</TableHead>
                                                <TableHead>Ca làm việc</TableHead>
                                                <TableHead>Thời gian</TableHead>
                                                <TableHead>Trạng thái</TableHead>
                                                <TableHead>Hành động</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {schedules.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                        Không có lịch làm việc cho ngày này
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                schedules.map((schedule) => (
                                                    <TableRow key={schedule.id}>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                                <span>Dr. {schedule.doctor?.full_name || 'N/A'}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {schedule.room?.name || 'N/A'}
                                                            {schedule.room?.type && (
                                                                <span className="text-muted-foreground ml-1">({schedule.room.type})</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className={getShiftColor(schedule.shift?.name || '')}>
                                                                {schedule.shift?.name || 'Không có ca'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center">
                                                                <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
                                                                {schedule.shift?.start_time || 'N/A'} - {schedule.shift?.end_time || 'N/A'}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                                                        <TableCell>
                                                            <div className="flex space-x-1">
                                                                <Button variant="ghost" size="sm">
                                                                    Chỉnh sửa
                                                                </Button>
                                                                <Button variant="ghost" size="sm">
                                                                    Hủy
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Weekly Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tổng quan tuần</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-7 gap-2">
                                    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                                        <div key={day} className="text-center">
                                            <div className="font-medium text-sm mb-2">{day}</div>
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground">
                                                    {schedules.filter(s => new Date(s.work_date).toLocaleDateString('en-US', { weekday: 'short' }) === day.substring(0, 3)).length} lịch làm việc
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="leave-requests">
                    <Card>
                        <CardHeader>
                            <CardTitle>Yêu cầu nghỉ phép</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bác sĩ</TableHead>
                                            <TableHead>Ngày yêu cầu</TableHead>
                                            <TableHead>Ngày bắt đầu</TableHead>
                                            <TableHead>Ngày kết thúc</TableHead>
                                            <TableHead>Số ngày</TableHead>
                                            <TableHead>Lý do</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {leaveRequests.map((request) => {
                                            const days = calculateDaysBetween(
                                                request.start_date?.toString().split('T')[0] || '',
                                                request.end_date?.toString().split('T')[0] || ''
                                            );
                                            return (
                                                <TableRow key={request.id}>
                                                    <TableCell>Dr. {request.doctor?.full_name || 'N/A'}</TableCell>
                                                    <TableCell>{request.request_date ? new Date(request.request_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                    <TableCell>{request.start_date ? new Date(request.start_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                    <TableCell>{request.end_date ? new Date(request.end_date).toLocaleDateString() : 'N/A'}</TableCell>
                                                    <TableCell>{days} ngày</TableCell>
                                                    <TableCell className="max-w-40 truncate">{request.reason || 'Không có lý do'}</TableCell>
                                                    <TableCell>{getLeaveStatusBadge(request.status)}</TableCell>
                                                    <TableCell>
                                                        {request.status === 'Pending' ? (
                                                            <div className="flex space-x-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-green-600"
                                                                    onClick={() => approveLeave(request.id)}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-600"
                                                                    onClick={() => rejectLeave(request.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">
                                                                {request.status}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {leaveRequests.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                    Không tìm thấy yêu cầu nghỉ phép nào.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
