/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator } from '../ui/separator';
import { Search, Filter, Eye, DollarSign, CreditCard, Shield, FileText } from 'lucide-react';

import { supabase } from '@/utils/backend/client';
import type { Examination } from '@/interfaces/examination';
import type { IMedicalRecord } from '@/interfaces/medical_record';
import type { ILabTest } from '@/interfaces/lab_test';

interface IPatient {
    id: number;
    full_name: string;
}

interface IExaminationWithLabs extends Examination {
    medical_record: IMedicalRecord & {
        patient: IPatient;
    };
    lab_tests: ILabTest[];
    total_amount?: number;
    payment_status: 'Paid' | 'Pending';
    payment_method?: 'Insurance' | 'Card' | 'Cash';
    payment_date?: string | null;
}

interface IInsurancePolicy {
    id: number;
    patient_id: number;
    provider_name: string;
    policy_number: string;
    valid_from: string;
    valid_to: string;
    coverage: number;
    status: 'Active' | 'Expiring Soon' | 'Expired';
    patient: IPatient;
}

export function Payments() {

    const [examinations, setExaminations] = useState<IExaminationWithLabs[]>([]);
    const [insurancePolicies, setInsurancePolicies] = useState<IInsurancePolicy[]>([]);
    const [loading, setLoading] = useState(true);


    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'Card' | 'Insurance'>('Cash');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


    useEffect(() => {
        fetchExaminationsWithLabs();
        fetchInsurancePolicies();
    }, []);

    const fetchExaminationsWithLabs = async () => {
        setLoading(true);
        try {
            // Lấy examinations với lab_tests và patient info
            const { data: examinationsData, error: examinationsError } = await supabase
                .from('examination')
                .select(`
                    *,
                    medical_record:medical_record_id (
                    id,
                    patient_id,
                    doctor_id,
                    diagnosis,
                    treatment,
                    record_date,
                    patient:patient_id (
                        id,
                        full_name
                    )
                    ),
                    lab_test:lab_test!examination_id (
                    id,
                    test_type,
                    result,
                    test_date,
                    price
                    )
                `)
                .order('examination_date', { ascending: false });

            if (examinationsError) throw examinationsError;

            // Calculate total amount for each examination
            const examinationsWithTotals = examinationsData?.map(exam => {
                console.log('Raw exam data:', { id: exam.id, status: exam.status, statusType: typeof exam.status });

                const mappedExam = {
                    ...exam,
                    total_amount: exam.lab_test?.reduce((sum: number, test: ILabTest) => sum + test.price, 0) || 0,
                    payment_status: exam.status === 'Pending' || exam.status === 'Paid' ? exam.status as 'Pending' | 'Paid' : 'Pending',
                    payment_method: undefined,
                    payment_date: exam.status === 'Paid' ? new Date().toISOString() : null
                };

                console.log('Mapped exam:', { id: mappedExam.id, payment_status: mappedExam.payment_status });
                return mappedExam;
            }) || [];

            setExaminations(examinationsWithTotals as IExaminationWithLabs[]);
        } catch (error) {
            console.error('Error fetching examinations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchInsurancePolicies = async () => {
        try {
            const { data, error } = await supabase
                .from('insurance')
                .select(`
                    *,
                    patient:patient_id ( id, full_name )
                `);
            console.log('Dữ liệu insurance thực tế trả về:', data);

            if (error) throw error;
            setInsurancePolicies(data as any);
        } catch (error) {
            console.error('Error fetching insurance policies:', error);
        }
    };

    // Filter functions
    const filteredExaminations = examinations.filter(examination => {
        const patientName = examination.medical_record?.patient?.full_name || '';
        const examinationType = examination.examination_type || '';

        // Search filter
        const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            examinationType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            examination.id.toString().includes(searchTerm);

        // Status filter
        const matchesStatus = statusFilter === 'All' || examination.payment_status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const variant = status === 'Paid' ? 'default' : 'secondary';
        const label = status === 'Paid' ? 'Đã thanh toán' : 'Chờ thanh toán';
        return <Badge variant={variant}>{label}</Badge>;
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <DollarSign className="h-4 w-4" />;
            case 'Card': return <CreditCard className="h-4 w-4" />;
            case 'Insurance': return <Shield className="h-4 w-4" />;
            default: return <DollarSign className="h-4 w-4" />;
        }
    };

    const calculateTotalFromLabTests = (examination: IExaminationWithLabs): number => {
        return examination.total_amount || 0;
    };

    const openInvoiceDetail = (examinationId: number) => {
        setSelectedPayment(examinationId);
        setIsInvoiceDialogOpen(true);
    };

    const openPaymentDialog = (examinationId: number) => {
        setSelectedPayment(examinationId);
        setSelectedMethod('Cash');
        setIsPaymentDialogOpen(true);
    };

    const processPayment = async () => {
        if (!selectedPayment) return;

        setProcessingPayment(true);
        try {
            // Tính toán tổng số tiền từ các lab tests
            const examinationData = examinations.find(e => e.id === selectedPayment);
            const totalAmount = examinationData ? calculateTotalFromLabTests(examinationData) : 0;

            // Update examination status in database
            const { error: updateError } = await supabase
                .from('examination')
                .update({
                    status: 'Paid'
                })
                .eq('id', selectedPayment);

            if (updateError) {
                throw new Error(`Cập nhật trạng thái thất bại: ${updateError.message}`);
            }

            // Create payment record
            const { error: paymentError } = await supabase
                .from('payment')
                .insert({
                    patient_id: examinationData?.medical_record?.patient?.id,
                    amount: totalAmount,
                    payment_date: new Date().toISOString(),
                    method: selectedMethod,
                    status: 'Paid'
                });

            if (paymentError) {
                console.warn('Lưu payment record thất bại:', paymentError.message);
            }

            // Update local state
            const updatedExaminations = examinations.map(exam => {
                if (exam.id === selectedPayment) {
                    return {
                        ...exam,
                        payment_status: 'Paid' as const,
                        payment_method: selectedMethod,
                        payment_date: new Date().toISOString()
                    };
                }
                return exam;
            });

            setExaminations(updatedExaminations);

            // Đóng dialog
            setIsPaymentDialogOpen(false);
            setSelectedPayment(null);

            // Hiển thị thông báo thành công
            setNotification({
                type: 'success',
                message: `Thanh toán thành công ${totalAmount.toLocaleString('vi-VN')} VNĐ bằng phương thức ${selectedMethod === 'Cash' ? 'Tiền mặt' : selectedMethod === 'Card' ? 'Thẻ' : 'Bảo hiểm'}`
            });

            setTimeout(() => setNotification(null), 3000);

        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            setNotification({
                type: 'error',
                message: error instanceof Error ? error.message : 'Thanh toán thất bại. Vui lòng thử lại.'
            });

            setTimeout(() => setNotification(null), 3000);
        } finally {
            setProcessingPayment(false);
        }
    };

    const selectedPaymentData = selectedPayment ? examinations.find(e => e.id === selectedPayment) : null;

    if (loading) {
        return <div className="text-center py-10">Đang tải ghi nhận thanh toán...</div>;
    }



    return (
        <div className="space-y-6">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${notification.type === 'success'
                    ? 'bg-gray-900 text-white'
                    : 'bg-red-500 text-white'
                    }`}>
                    <div className="flex items-center">
                        {notification.type === 'success' ? (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        {notification.message}
                    </div>
                </div>
            )}
            {/* ... Phần JSX Header giữ nguyên ... */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Thanh toán & Bảo hiểm</h1>
                    <p className="text-muted-foreground">
                        Quản lý thanh toán bệnh nhân, hóa đơn và yêu cầu bảo hiểm
                    </p>
                </div>
            </div>

            <Tabs defaultValue="payments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="payments" className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Thanh toán
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Bảo hiểm
                    </TabsTrigger>
                </TabsList>

                {/* --- PAYMENTS TAB --- */}
                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle>Ghi nhận thanh toán ({filteredExaminations.length})</CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm theo tên bệnh nhân..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">Tất cả</SelectItem>
                                            <SelectItem value="Paid">Đã thanh toán</SelectItem>
                                            <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Bệnh nhân</TableHead>
                                            <TableHead>Số tiền</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày thanh toán</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredExaminations.map((examination) => {
                                            const isPaid = examination.payment_status === 'Paid';
                                            const shouldShowPaymentButton = !isPaid; // Hiển thị nếu KHÔNG phải là 'Paid'

                                            console.log(`Exam ${examination.id}:`, {
                                                payment_status: examination.payment_status,
                                                shouldShowPaymentButton
                                            });

                                            return (
                                                <TableRow
                                                    key={examination.id}
                                                    className={isPaid ? 'bg-gray-50' : ''} // Dùng isPaid
                                                >
                                                    {/* Cột Tên bệnh nhân */}
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                                <span className="text-xs font-medium text-blue-600">
                                                                    {examination.medical_record?.patient?.full_name?.charAt(0) || 'N/A'}
                                                                </span>
                                                            </div>
                                                            <span className="font-medium">{examination.medical_record?.patient?.full_name || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>

                                                    {/* Cột Tổng tiền và Loại khám */}
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <span className="font-semibold text-black">
                                                                {calculateTotalFromLabTests(examination).toLocaleString('vi-VN')} VNĐ
                                                            </span>
                                                            <div className="text-xs text-gray-500">
                                                                {examination.examination_type}
                                                            </div>
                                                        </div>
                                                    </TableCell>

                                                    {/* Cột Trạng thái thanh toán (Status Badge) */}
                                                    <TableCell>
                                                        {getStatusBadge(examination.payment_status)}
                                                    </TableCell>

                                                    {/* Cột Ngày thanh toán (Cải tiến 2: Dùng payment_date nếu có) */}
                                                    <TableCell>
                                                        <span className="text-sm text-gray-600">
                                                            {/* Hiển thị ngày thanh toán nếu đã có, ngược lại hiển thị "Chưa thanh toán" */}
                                                            {examination.payment_date
                                                                ? new Date(examination.payment_date).toLocaleDateString('vi-VN')
                                                                : 'Chưa thanh toán'
                                                            }
                                                        </span>
                                                    </TableCell>

                                                    {/* Cột Hành động (Actions) */}
                                                    <TableCell>
                                                        <div className="flex justify-end space-x-2">
                                                            {/* Nút Xem chi tiết */}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openInvoiceDetail(examination.id)}
                                                                className="hover:bg-blue-50"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>

                                                            {/* Nút Thanh toán (chỉ hiển thị nếu shouldShowPaymentButton là true) */}
                                                            {shouldShowPaymentButton && (
                                                                <Button
                                                                    variant="default"
                                                                    size="sm"
                                                                    onClick={() => openPaymentDialog(examination.id)}
                                                                    className="bg-black hover:bg-gray-800"
                                                                >
                                                                    <DollarSign className="h-4 w-4 mr-1" />
                                                                    Thanh toán
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- INSURANCE TAB --- */}
                <TabsContent value="insurance">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Shield className="mr-2 h-5 w-5" />
                                Chính sách bảo hiểm ({insurancePolicies.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        {/* ... Header của bảng insurance ... */}
                                        <TableRow>
                                            <TableHead>Bệnh nhân</TableHead>
                                            <TableHead>Nhà cung cấp</TableHead>
                                            <TableHead>Số chính sách</TableHead>
                                            <TableHead>Hiệu lực từ</TableHead>
                                            <TableHead>Hiệu lực đến</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {/* CHANGE: map qua state 'insurancePolicies' */}
                                        {insurancePolicies.map((policy) => (
                                            <TableRow key={policy.id}>
                                                <TableCell>{policy.patient.full_name}</TableCell>
                                                <TableCell>{policy.provider_name}</TableCell>
                                                <TableCell className="font-mono">{policy.policy_number}</TableCell>
                                                <TableCell>{new Date(policy.valid_from).toLocaleDateString()}</TableCell>
                                                <TableCell>{new Date(policy.valid_to).toLocaleDateString()}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Invoice Detail Dialog (Giả định services lấy từ đâu đó khác hoặc tạm thời bỏ qua) */}
            <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" />
                            Chi tiết hóa đơn
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPaymentData && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">Bệnh viện Y tế HealthCare</h3>
                                    <p className="text-sm text-muted-foreground">Hóa đơn #{selectedPaymentData?.id || 'N/A'}</p>
                                    <p className="text-sm text-muted-foreground">Ngày: {selectedPaymentData.payment_date ? new Date(selectedPaymentData.payment_date).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Bệnh nhân:</p>
                                    <p className="font-medium">{selectedPaymentData?.medical_record?.patient?.full_name || 'N/A'}</p>
                                    <div className="mt-2">
                                        {getStatusBadge(selectedPaymentData.payment_status)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-medium mb-3">Dịch vụ & Phí</h4>
                                {selectedPaymentData?.lab_tests?.map((labTest) => (
                                    <div key={labTest.id} className="flex justify-between py-2 border-b">
                                        <div>
                                            <p className="font-medium">{labTest.test_type}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedPaymentData?.examination_type}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">{labTest.price.toLocaleString('vi-VN')} VNĐ</p>
                                            {labTest.test_date && (
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(labTest.test_date).toLocaleDateString('vi-VN')}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator />

                            {/* Payment Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Tổng cộng:</span>
                                    <span>{selectedPaymentData ? calculateTotalFromLabTests(selectedPaymentData).toLocaleString('vi-VN') : 0} VNĐ</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span>Phương thức thanh toán:</span>
                                    <div className="flex items-center space-x-2">
                                        {selectedPaymentData?.payment_method && getMethodIcon(selectedPaymentData.payment_method)}
                                        <span>Chưa thanh toán</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Payment Processing Dialog */}
            <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center">
                            <DollarSign className="mr-2 h-5 w-5" />
                            Xác nhận thanh toán
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPaymentData && (
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Mã xét nghiệm</p>
                                <p className="font-medium">#{selectedPaymentData?.id || 'N/A'}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Bệnh nhân</p>
                                <p className="font-medium">{selectedPaymentData?.medical_record?.patient?.full_name || 'N/A'}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Số tiền thanh toán</p>
                                <p className="text-xl font-bold text-black">
                                    {selectedPaymentData ? calculateTotalFromLabTests(selectedPaymentData).toLocaleString('vi-VN') : 0} VNĐ
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Phương thức thanh toán</label>
                                <Select value={selectedMethod} onValueChange={(value: 'Cash' | 'Card' | 'Insurance') => setSelectedMethod(value)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">
                                            <div className="flex items-center">
                                                <DollarSign className="mr-2 h-4 w-4" />
                                                Tiền mặt
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Card">
                                            <div className="flex items-center">
                                                <CreditCard className="mr-2 h-4 w-4" />
                                                Thẻ ngân hàng
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Insurance">
                                            <div className="flex items-center">
                                                <Shield className="mr-2 h-4 w-4" />
                                                Bảo hiểm
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPaymentDialogOpen(false)}
                                    disabled={processingPayment}
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={processPayment}
                                    disabled={processingPayment}
                                    className="bg-black hover:bg-gray-800"
                                >
                                    {processingPayment ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}