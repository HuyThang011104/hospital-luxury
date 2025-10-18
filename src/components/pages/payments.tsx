/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/backend/client'; // Đảm bảo đường dẫn này chính xác

// --- NHẬP KHẨU CÁC COMPONENT GIAO DIỆN ---
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Label } from '../ui/label';
import { PlusCircle, Search, Filter, Download, Edit, Trash2, DollarSign, CreditCard, Shield, AlertTriangle } from 'lucide-react';

// --- CÁC KIỂU DỮ LIỆU (TYPESCRIPT) ---
type PaymentStatus = 'Paid' | 'Pending' | 'Cancelled';
type PaymentMethod = 'Card' | 'Cash' | 'Insurance';

interface IPatient {
    id: number;
    full_name: string;
}

interface IPayment {
    id: number;
    patient_id: number;
    amount: number;
    method: PaymentMethod;
    status: PaymentStatus;
    payment_date: string;
    invoice_id: string;
    patient: IPatient | null;
}

interface PaymentFormState {
    patient_id: string;
    amount: string;
    method: PaymentMethod | '';
    status: PaymentStatus | '';
    payment_date: string;
}

export function Payments() {
    // --- KHAI BÁO STATE ---
    const [payments, setPayments] = useState<IPayment[]>([]);
    const [patients, setPatients] = useState<IPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [methodFilter, setMethodFilter] = useState('All');
    const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
    const [currentPayment, setCurrentPayment] = useState<IPayment | null>(null);
    const initialFormState: PaymentFormState = {
        patient_id: '',
        amount: '',
        method: '',
        status: '',
        payment_date: new Date().toISOString().split('T')[0],
    };
    const [formPayment, setFormPayment] = useState<PaymentFormState>(initialFormState);
    const [formError, setFormError] = useState<string | null>(null);

    // --- TẢI DỮ LIỆU TỪ DATABASE ---
    useEffect(() => {
        const initialFetch = async () => {
            setLoading(true);
            await Promise.all([fetchPatients(), fetchPayments()]);
            setLoading(false);
        };
        initialFetch();
    }, []);

    const fetchPayments = async () => {
        try {
            const { data, error } = await supabase.from('payment').select('*, patient:patient_id(id, full_name)').order('id', { ascending: false });
            if (error) throw error;
            setPayments(data as IPayment[]);
        } catch (error) {
            console.error('Lỗi tải dữ liệu thanh toán:', error);
            alert('Không thể tải dữ liệu thanh toán.');
        }
    };

    const fetchPatients = async () => {
        try {
            const { data, error } = await supabase.from('patient').select('id, full_name');
            if (error) throw error;
            setPatients(data as IPatient[]);
        } catch (error) {
            console.error('Lỗi tải danh sách bệnh nhân:', error);
        }
    };

    // --- CÁC HÀM XỬ LÝ FORM VÀ CRUD ---
    const handleFormChange = (field: keyof PaymentFormState, value: string) => {
        setFormPayment(prev => ({ ...prev, [field]: value }));
    };

    const openAddDialog = () => {
        setDialogMode('add');
        setCurrentPayment(null);
        setFormPayment(initialFormState);
        setFormError(null);
        setIsAddEditDialogOpen(true);
    };

    const openEditDialog = (payment: IPayment) => {
        setDialogMode('edit');
        setCurrentPayment(payment);
        setFormPayment({
            patient_id: String(payment.patient_id),
            amount: String(payment.amount),
            method: payment.method,
            status: payment.status,
            payment_date: payment.payment_date.split('T')[0],
        });
        setFormError(null);
        setIsAddEditDialogOpen(true);
    };

    const openDeleteDialog = (payment: IPayment) => {
        setCurrentPayment(payment);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = () => {
        if (dialogMode === 'add') {
            handleAddInvoice();
        } else {
            handleEditInvoice();
        }
    };

    const handleAddInvoice = async () => {
        setFormError(null);
        if (!formPayment.patient_id || !formPayment.amount || !formPayment.method || !formPayment.status) {
            setFormError("Vui lòng điền đầy đủ thông tin.");
            return;
        }
        setIsSaving(true);
        try {
            const dataToInsert = { patient_id: parseInt(formPayment.patient_id), amount: parseFloat(formPayment.amount), method: formPayment.method, status: formPayment.status, payment_date: formPayment.payment_date, invoice_id: `HD${Date.now()}` };
            const { error } = await supabase.from('payment').insert([dataToInsert]);
            if (error) throw error;
            alert('Thêm hóa đơn thành công!');
            setIsAddEditDialogOpen(false);
            await fetchPayments();
        } catch (error: any) {
            setFormError(`Lỗi: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditInvoice = async () => {
        if (!currentPayment) return;
        setFormError(null);
        if (!formPayment.patient_id || !formPayment.amount || !formPayment.method || !formPayment.status) {
            setFormError("Vui lòng điền đầy đủ thông tin.");
            return;
        }
        setIsSaving(true);
        try {
            const dataToUpdate = { patient_id: parseInt(formPayment.patient_id), amount: parseFloat(formPayment.amount), method: formPayment.method, status: formPayment.status, payment_date: formPayment.payment_date };
            const { error } = await supabase.from('payment').update(dataToUpdate).eq('id', currentPayment.id);
            if (error) throw error;
            alert('Cập nhật hóa đơn thành công!');
            setIsAddEditDialogOpen(false);
            await fetchPayments();
        } catch (error: any) {
            setFormError(`Lỗi: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInvoice = async () => {
        if (!currentPayment) return;
        setIsSaving(true);
        try {
            const { error } = await supabase.from('payment').delete().eq('id', currentPayment.id);
            if (error) throw error;
            alert('Đã xóa hóa đơn.');
            setIsDeleteDialogOpen(false);
            await fetchPayments();
        } catch (error: any) {
            alert(`Lỗi khi xóa: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        const patientName = payment.patient?.full_name || '';
        const invoiceId = payment.invoice_id || '';
        const matchesSearch = searchTerm === '' || patientName.toLowerCase().includes(searchTerm.toLowerCase()) || invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
        const matchesMethod = methodFilter === 'All' || payment.method === methodFilter;
        return matchesSearch && matchesStatus && matchesMethod;
    });

    const handleExport = () => {
        if (filteredPayments.length === 0) {
            alert('Không có dữ liệu để xuất.');
            return;
        }
        const header = ['ID', 'Bệnh nhân', 'Số tiền (VND)', 'Phương thức', 'Trạng thái', 'Ngày thanh toán', 'Mã hóa đơn'];
        const csvContent = filteredPayments.map(p => [p.id, `"${p.patient?.full_name || 'N/A'}"`, p.amount, p.method, p.status, p.payment_date, `"${p.invoice_id}"`].join(',')).join('\n');
        const csv = [header.join(','), csvContent].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `thanh_toan_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- RENDER ---
    if (loading) {
        return <div className="text-center py-10">Đang tải dữ liệu...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Thanh toán & Bảo hiểm</h1>
                    <p className="text-muted-foreground">Quản lý thanh toán bệnh nhân, hóa đơn và yêu cầu bảo hiểm</p>
                </div>
            </div>

            <Tabs defaultValue="payments" className="space-y-4">
                <div className="flex justify-between items-center">
                    <TabsList>
                        <TabsTrigger value="payments"><DollarSign className="mr-2 h-4 w-4" />Thanh toán</TabsTrigger>
                        <TabsTrigger value="insurance"><Shield className="mr-2 h-4 w-4" />Bảo hiểm</TabsTrigger>
                    </TabsList>
                    <Button onClick={openAddDialog}>
                        <PlusCircle className="mr-2 h-4 w-4" />Thêm hóa đơn
                    </Button>
                </div>

                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle>Ghi nhận thanh toán ({filteredPayments.length})</CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Tìm kiếm bệnh nhân, hóa đơn..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 w-full sm:w-64" />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full sm:w-40"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="Tất cả trạng thái" /></SelectTrigger>
                                        <SelectContent><SelectItem value="All">Tất cả trạng thái</SelectItem><SelectItem value="Paid">Đã trả</SelectItem><SelectItem value="Pending">Chờ xử lý</SelectItem><SelectItem value="Cancelled">Đã hủy</SelectItem></SelectContent>
                                    </Select>
                                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                                        <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Tất cả phương thức" /></SelectTrigger>
                                        <SelectContent><SelectItem value="All">Tất cả phương thức</SelectItem><SelectItem value="Card">Thẻ</SelectItem><SelectItem value="Cash">Tiền mặt</SelectItem><SelectItem value="Insurance">Bảo hiểm</SelectItem></SelectContent>
                                    </Select>
                                    <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" />Xuất tập tin</Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bệnh nhân</TableHead><TableHead>Số tiền</TableHead><TableHead>Phương thức</TableHead><TableHead>Trạng thái</TableHead><TableHead>Ngày</TableHead><TableHead>Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPayments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">{payment.patient?.full_name || 'Bệnh nhân không xác định'}</TableCell>
                                            <TableCell>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount)}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell><Badge variant={payment.status === 'Paid' ? 'default' : 'secondary'}>{payment.status === 'Paid' ? 'Đã trả' : payment.status === 'Pending' ? 'Chờ xử lý' : 'Đã hủy'}</Badge></TableCell>
                                            <TableCell>{new Date(payment.payment_date).toLocaleDateString('vi-VN')}</TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment)}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(payment)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredPayments.length === 0 && (
                                        <TableRow><TableCell colSpan={6} className="text-center py-4 text-muted-foreground">Không tìm thấy bất kỳ hóa đơn nào.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="insurance"><p>Phần quản lý bảo hiểm sẽ được phát triển ở đây.</p></TabsContent>
            </Tabs>

            <Dialog open={isAddEditDialogOpen} onOpenChange={setIsAddEditDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader><DialogTitle>{dialogMode === 'add' ? 'Thêm Hóa Đơn Mới' : 'Chỉnh Sửa Hóa Đơn'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="patient" className="text-right">Bệnh nhân</Label><Select value={formPayment.patient_id} onValueChange={(value) => handleFormChange('patient_id', value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Chọn bệnh nhân" /></SelectTrigger><SelectContent>{patients.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.full_name}</SelectItem>)}</SelectContent></Select></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="amount" className="text-right">Số tiền</Label><Input id="amount" type="number" value={formPayment.amount} onChange={(e) => handleFormChange('amount', e.target.value)} className="col-span-3" /></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="method" className="text-right">Phương thức</Label><Select value={formPayment.method} onValueChange={(value) => handleFormChange('method', value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Chọn phương thức" /></SelectTrigger><SelectContent><SelectItem value="Card">Thẻ</SelectItem><SelectItem value="Cash">Tiền mặt</SelectItem><SelectItem value="Insurance">Bảo hiểm</SelectItem></SelectContent></Select></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="status" className="text-right">Trạng thái</Label><Select value={formPayment.status} onValueChange={(value) => handleFormChange('status', value)}><SelectTrigger className="col-span-3"><SelectValue placeholder="Chọn trạng thái" /></SelectTrigger><SelectContent><SelectItem value="Paid">Đã trả</SelectItem><SelectItem value="Pending">Chờ xử lý</SelectItem><SelectItem value="Cancelled">Đã hủy</SelectItem></SelectContent></Select></div>
                        <div className="grid grid-cols-4 items-center gap-4"><Label htmlFor="date" className="text-right">Ngày</Label><Input id="date" type="date" value={formPayment.payment_date} onChange={(e) => handleFormChange('payment_date', e.target.value)} className="col-span-3" /></div>
                    </div>
                    {formError && <p className="text-red-500 text-sm">{formError}</p>}
                    <DialogFooter><Button variant="outline" onClick={() => setIsAddEditDialogOpen(false)}>Hủy</Button><Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Đang lưu...' : (dialogMode === 'add' ? 'Thêm hóa đơn' : 'Lưu thay đổi')}</Button></DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent><DialogHeader><DialogTitle className="flex items-center"><AlertTriangle className="mr-2 text-red-500" />Xác Nhận Xóa</DialogTitle><DialogDescription>Bạn có chắc chắn muốn xóa hóa đơn của bệnh nhân <strong>{currentPayment?.patient?.full_name}</strong> không? Hành động này không thể hoàn tác.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button><Button variant="destructive" onClick={handleDeleteInvoice} disabled={isSaving}>{isSaving ? 'Đang xóa...' : 'Xóa'}</Button></DialogFooter></DialogContent>
            </Dialog>
        </div>
    );
}