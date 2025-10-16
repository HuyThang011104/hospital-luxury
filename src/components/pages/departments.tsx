/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Plus, Edit, Trash2, Building2, Bed, AlertTriangle, Search } from 'lucide-react';
import { supabase } from '@/utils/backend/client';

// --- GIAO DIỆN (INTERFACES) ---
interface IDepartment {
    id: number;
    name: string;
    description: string | null;
    location: string | null;
}

type RoomType = 'Normal' | 'ICU' | 'Operating' | 'Emergency';
interface IRoom {
    id: number;
    name: string;
    type: RoomType;
    floor: string | null;
    department_id: number;
    capacity: number;
    occupied: number;
    department: Pick<IDepartment, 'id' | 'name'>; // Dữ liệu join
}

type BedStatus = 'Occupied' | 'Available' | 'Maintenance';
interface IBed {
    id: number;
    bed_number: string;
    status: BedStatus;
    room_id: number;
    patient: { name: string } | null; // Giả sử join với bảng bệnh nhân
    room: { // Dữ liệu join
        name: string;
        department: { name: string };
    };
}

// --- TRẠNG THÁI KHỞI TẠO CHO FORM ---
const initialNewDepartmentState = { name: '', description: '', location: '' };
const initialNewRoomState = { name: '', type: 'Normal' as RoomType, floor: '', department_id: 0, capacity: 1 };


export function Departments() {
    // --- QUẢN LÝ STATE ---
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<IDepartment[]>([]);
    const [rooms, setRooms] = useState<IRoom[]>([]);
    const [beds, setBeds] = useState<IBed[]>([]);

    const [isAddDeptDialogOpen, setIsAddDeptDialogOpen] = useState(false);
    const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newDepartment, setNewDepartment] = useState(initialNewDepartmentState);
    const [newRoom, setNewRoom] = useState(initialNewRoomState);

    const [itemToDelete, setItemToDelete] = useState<{ type: 'department' | 'room' | 'bed'; id: number } | null>(null);

    const [roomSearchTerm, setRoomSearchTerm] = useState('');
    const [bedSearchTerm, setBedSearchTerm] = useState('');


    // --- LẤY DỮ LIỆU ---
    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                await Promise.all([fetchDepartments(), fetchRooms(), fetchBeds()]);
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu ban đầu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const fetchDepartments = async () => {
        const { data, error } = await supabase.from('department').select('*');
        if (error) throw error;
        setDepartments(data || []);
    };

    const fetchRooms = async () => {
        const { data, error } = await supabase.from('room').select('*, department (id, name)');
        if (error) throw error;
        setRooms(data as any || []);
    };

    const fetchBeds = async () => {
        const { data, error } = await supabase.from('bed').select('*, room ( name, department ( name ) )');
        if (error) throw error;
        setBeds(data as any || []);
    };


    // --- XỬ LÝ THÊM / XÓA / SỬA ---
    const handleAddDepartment = async () => {
        if (!newDepartment.name) return alert('Tên khoa là bắt buộc.');
        const { data, error } = await supabase.from('department').insert([newDepartment]).select().single();
        if (error) alert(error.message);
        else if (data) {
            setDepartments(prev => [...prev, data]);
            setNewDepartment(initialNewDepartmentState);
            setIsAddDeptDialogOpen(false);
        }
    };

    const handleAddRoom = async () => {
        if (!newRoom.name || !newRoom.department_id) return alert('Tên phòng và khoa là bắt buộc.');
        const { data, error } = await supabase.from('room').insert([{ ...newRoom, occupied: 0 }]).select('*, department (id, name)').single();
        if (error) alert(error.message);
        else if (data) {
            setRooms(prev => [...prev, data as any]);
            setNewRoom(initialNewRoomState);
            setIsAddRoomDialogOpen(false);
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        const { type, id } = itemToDelete;
        const { error } = await supabase.from(type).delete().eq('id', id);
        if (error) alert(error.message);
        else {
            if (type === 'department') setDepartments(prev => prev.filter(item => item.id !== id));
            else if (type === 'room') setRooms(prev => prev.filter(item => item.id !== id));
        }
        setIsDeleteDialogOpen(false);
        setItemToDelete(null);
    };

    // --- XỬ LÝ INPUT FORM ---
    const handleDepartmentInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setNewDepartment(prev => ({ ...prev, [e.target.id]: e.target.value }));
    };

    const handleRoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setNewRoom(prev => ({ ...prev, [id]: id === 'capacity' ? parseInt(value, 10) || 0 : value }));
    };
    const handleRoomSelectChange = (id: 'type' | 'department_id' | 'floor', value: string | number) => {
        setNewRoom(prev => ({ ...prev, [id]: value }));
    };

    // --- DỮ LIỆU ĐÃ LỌC ---
    const filteredRooms = useMemo(() =>
        rooms.filter(room =>
            room.name.toLowerCase().includes(roomSearchTerm.toLowerCase()) ||
            room.department.name.toLowerCase().includes(roomSearchTerm.toLowerCase())
        ), [rooms, roomSearchTerm]);

    const filteredBeds = useMemo(() =>
        beds.filter(bed =>
            bed.bed_number.toLowerCase().includes(bedSearchTerm.toLowerCase()) ||
            (bed.patient?.name && bed.patient.name.toLowerCase().includes(bedSearchTerm.toLowerCase())) ||
            bed.room.name.toLowerCase().includes(bedSearchTerm.toLowerCase())
        ), [beds, bedSearchTerm]);

    // --- HÀM PHỤ ---
    const getBedStatusColor = (status: BedStatus) => {
        // ... (giữ nguyên)
    };

    // --- HIỂN THỊ ---
    if (loading) {
        return <div className="flex justify-center items-center h-64">Đang tải dữ liệu bệnh viện...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Khoa & Phòng</h1>
                    <p className="text-muted-foreground">Quản lý các khoa, phòng và giường bệnh trong bệnh viện</p>
                </div>
            </div>

            <Tabs defaultValue="departments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="departments">Khoa</TabsTrigger>
                    <TabsTrigger value="rooms">Phòng</TabsTrigger>
                    <TabsTrigger value="beds">Giường bệnh</TabsTrigger>
                </TabsList>

                {/* TAB KHOA */}
                <TabsContent value="departments">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Building2 className="mr-2 h-5 w-5" /> Danh sách khoa</CardTitle>
                                <Dialog open={isAddDeptDialogOpen} onOpenChange={setIsAddDeptDialogOpen}>
                                    <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Thêm khoa</Button></DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader><DialogTitle>Thêm khoa mới</DialogTitle></DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="name">Tên khoa</Label>
                                                <Input id="name" value={newDepartment.name} onChange={handleDepartmentInputChange} placeholder="Nhập tên khoa" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Mô tả</Label>
                                                <Textarea id="description" value={newDepartment.description} onChange={handleDepartmentInputChange} placeholder="Nhập mô tả khoa" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="location">Vị trí</Label>
                                                <Input id="location" value={newDepartment.location} onChange={handleDepartmentInputChange} placeholder="Tòa nhà, tầng..." />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsAddDeptDialogOpen(false)}>Hủy</Button>
                                            <Button onClick={handleAddDepartment}>Thêm</Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {departments.map((dept) => (
                                    <Card key={dept.id}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-lg">{dept.name}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">{dept.location || 'Không xác định'}</p>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('department', dept.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent><p className="text-sm">{dept.description || 'Chưa có mô tả.'}</p></CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB PHÒNG */}
                <TabsContent value="rooms">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Danh sách phòng</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <div className="relative w-64">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Tìm theo phòng hoặc khoa..." value={roomSearchTerm} onChange={e => setRoomSearchTerm(e.target.value)} className="pl-8" />
                                    </div>
                                    <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
                                        <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Thêm phòng</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Thêm phòng mới</DialogTitle></DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <Input id="name" value={newRoom.name} onChange={handleRoomInputChange} placeholder="VD: Phòng 101, ICU-01" />
                                                <Select value={String(newRoom.department_id)} onValueChange={(value) => handleRoomSelectChange('department_id', Number(value))}>
                                                    <SelectTrigger><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                                                    <SelectContent>
                                                        {departments.map(dept => (<SelectItem key={dept.id} value={String(dept.id)}>{dept.name}</SelectItem>))}
                                                    </SelectContent>
                                                </Select>
                                                <Input id="capacity" type="number" min="1" value={newRoom.capacity} onChange={handleRoomInputChange} placeholder="Số giường" />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setIsAddRoomDialogOpen(false)}>Hủy</Button>
                                                <Button onClick={handleAddRoom}>Thêm</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Phòng</TableHead><TableHead>Loại</TableHead><TableHead>Khoa</TableHead><TableHead>Sức chứa</TableHead><TableHead>Hành động</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredRooms.map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium">{room.name}</TableCell>
                                            <TableCell><Badge>{room.type}</Badge></TableCell>
                                            <TableCell>{room.department?.name || 'Không xác định'}</TableCell>
                                            <TableCell>{room.occupied}/{room.capacity}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => openDeleteDialog('room', room.id)}><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB GIƯỜNG */}
                <TabsContent value="beds">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle className="flex items-center"><Bed className="mr-2 h-5 w-5" /> Quản lý giường bệnh</CardTitle>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="Tìm giường hoặc bệnh nhân..." value={bedSearchTerm} onChange={e => setBedSearchTerm(e.target.value)} className="pl-8" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Giường</TableHead><TableHead>Phòng</TableHead><TableHead>Khoa</TableHead><TableHead>Trạng thái</TableHead><TableHead>Bệnh nhân</TableHead><TableHead>Hành động</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {filteredBeds.map((bed) => (
                                        <TableRow key={bed.id}>
                                            <TableCell className="font-medium">{bed.bed_number}</TableCell>
                                            <TableCell>{bed.room?.name || 'Không xác định'}</TableCell>
                                            <TableCell>{bed.room?.department?.name || 'Không xác định'}</TableCell>
                                            <TableCell><Badge>{bed.status}</Badge></TableCell>
                                            <TableCell>{bed.patient?.name || '---'}</TableCell>
                                            <TableCell><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="h-4 w-4" /></Button></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* HỘP THOẠI XÁC NHẬN XÓA */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bạn có chắc chắn muốn xóa?</DialogTitle>
                        <DialogDescription>Hành động này không thể hoàn tác. Mục sẽ bị xóa vĩnh viễn.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Xóa</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
