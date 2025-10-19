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
import { Search, Filter, Download, Eye, DollarSign, CreditCard, Shield, FileText } from 'lucide-react';

import { supabase } from '@/utils/backend/client';


interface IPatient {
    id: number;
    full_name: string;

}


interface IPayment {
    id: number;
    patient_id: number;
    amount: number;
    method: 'Insurance' | 'Card' | 'Cash';
    status: 'Paid' | 'Pending' | 'Cancelled';
    payment_date: string;
    invoice_id: string;
    patient?: IPatient;
    appointment?: {
        id: number;
        appointment_date: Date;
        medical_record?: {
            id: number;
            examinations: Array<{
                id: number;
                examination_type: string;
                details: string | null;
                examination_date: Date;
                lab_tests: Array<{
                    id: number;
                    test_type: string;
                    result: string | null;
                    test_date: Date | null;
                    price: number;
                }>;
            }>;
        };
    };

    services?: { name: string; amount: number }[];
}


interface IInsurancePolicy {
    id: number;
    patient_id: number; // Foreign key
    provider_name: string;
    policy_number: string;
    valid_from: string;
    valid_to: string;
    coverage: number;
    status: 'Active' | 'Expiring Soon' | 'Expired';
    patient: IPatient;
}

export function Payments() {

    const [payments, setPayments] = useState<IPayment[]>([]);
    const [insurancePolicies, setInsurancePolicies] = useState<IInsurancePolicy[]>([]);
    const [loading, setLoading] = useState(true);


    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [methodFilter, setMethodFilter] = useState('All');
    const [selectedPayment, setSelectedPayment] = useState<number | null>(null);
    const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'Card' | 'Insurance'>('Cash');
    const [processingPayment, setProcessingPayment] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);


    useEffect(() => {

        fetchPayments();
        fetchInsurancePolicies();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            // Lấy payments với patient
            const { data: paymentsData, error: paymentsError } = await supabase
                .from('payment')
                .select(`
                    *,
                    patient:patient_id ( id, full_name )
                `);

            if (paymentsError) throw paymentsError;

            // Với mỗi payment, lấy medical records của patient đó
            const paymentsWithMedicalData = await Promise.all(
                paymentsData.map(async (payment) => {
                    // Lấy medical records của patient
                    const { data: medicalRecords, error: medicalError } = await supabase
                        .from('medical_record')
                        .select(`
                            id,
                            patient_id,
                            doctor_id,
                            diagnosis,
                            treatment,
                            record_date,
                            examination:examination!medical_record_id (
                                id,
                                examination_type,
                                details,
                                examination_date,
                                lab_test:lab_test!examination_id (
                                    id,
                                    test_type,
                                    result,
                                    test_date,
                                    price
                                )
                            )
                        `)
                        .eq('patient_id', payment.patient_id);
                    if (medicalError) {
                        console.warn('Error fetching medical records for payment:', payment.id, medicalError);
                        return payment;
                    }
                    console.log('Dữ liệu medical records:', medicalRecords);

                    // Tạo appointment object với medical record data
                    const appointmentData = medicalRecords && medicalRecords.length > 0 ? {
                        id: medicalRecords[0].id,
                        appointment_date: null,
                        medical_record: medicalRecords[0]
                    } : null;

                    return {
                        ...payment,
                        appointment: appointmentData
                    };
                })
            );

            console.log('Dữ liệu payment với medical record data:', paymentsWithMedicalData);
            setPayments(paymentsWithMedicalData as IPayment[]);
        } catch (error) {
            console.error('Error fetching payments:', error);
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
    const filteredPayments = payments.filter(payment => {
        const patientName = payment.patient?.full_name || '';
        const invoiceId = payment.invoice_id || '';
        const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || payment.status === statusFilter;
        const matchesMethod = methodFilter === 'All' || payment.method === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
    });

    const getStatusBadge = (status: string) => {
        const variant = status === 'Paid' ? 'default' :
            status === 'Pending' ? 'secondary' : 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
    };

    const getMethodIcon = (method: string) => {
        switch (method) {
            case 'Cash': return <DollarSign className="h-4 w-4" />;
            case 'Card': return <CreditCard className="h-4 w-4" />;
            case 'Insurance': return <Shield className="h-4 w-4" />;
            default: return <DollarSign className="h-4 w-4" />;
        }
    };

    const calculateTotalFromLabTests = (payment: IPayment): number => {
        const medicalRecord = payment.appointment?.medical_record;
        if (!medicalRecord?.examinations) return payment.amount;

        let total = 0;
        medicalRecord.examinations.forEach(examination => {
            if (examination.lab_tests) {
                examination.lab_tests.forEach(labTest => {
                    total += labTest.price;
                });
            }
        });
        return total;
    };

    const openInvoiceDetail = (paymentId: number) => {
        setSelectedPayment(paymentId);
        setIsInvoiceDialogOpen(true);
    };

    const openPaymentDialog = (paymentId: number) => {
        setSelectedPayment(paymentId);
        setSelectedMethod('Cash'); // Reset về mặc định
        setIsPaymentDialogOpen(true);
    };

    const processPayment = async () => {
        if (!selectedPayment) return;

        setProcessingPayment(true);
        try {
            // Tính toán tổng số tiền từ các lab tests
            const paymentData = payments.find(p => p.id === selectedPayment);
            const totalAmount = paymentData ? calculateTotalFromLabTests(paymentData) : 0;

            const { error } = await supabase
                .from('payment')
                .update({
                    method: selectedMethod,
                    status: 'Paid',
                    payment_date: new Date().toISOString(),
                    amount: totalAmount
                })
                .eq('id', selectedPayment)
                .select()
                .single();

            if (error) throw error;

            // Cập nhật lại dữ liệu payments
            await fetchPayments();

            // Đóng dialog
            setIsPaymentDialogOpen(false);
            setSelectedPayment(null);

            // Hiển thị thông báo thành công
            setNotification({
                type: 'success',
                message: `Thanh toán thành công ${totalAmount.toLocaleString('vi-VN')} VNĐ bằng phương thức ${selectedMethod === 'Cash' ? 'Tiền mặt' : selectedMethod === 'Card' ? 'Thẻ' : 'Bảo hiểm'}`
            });

            // Tự động ẩn thông báo sau 3 giây
            setTimeout(() => setNotification(null), 3000);

        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            setNotification({
                type: 'error',
                message: 'Thanh toán thất bại. Vui lòng thử lại.'
            });

            // Tự động ẩn thông báo sau 3 giây
            setTimeout(() => setNotification(null), 3000);
        } finally {
            setProcessingPayment(false);
        }
    };

    const selectedPaymentData = selectedPayment ? payments.find(p => p.id === selectedPayment) : null;

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
                                <CardTitle>Ghi nhận thanh toán ({filteredPayments.length})</CardTitle>
                                {/* ... Phần filter inputs giữ nguyên ... */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Tìm kiếm theo bệnh nhân hoặc hóa đơn..."
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
                                            <SelectItem value="All">Tất cả trạng thái</SelectItem>
                                            <SelectItem value="Paid">Đã thanh toán</SelectItem>
                                            <SelectItem value="Pending">Chờ xử lý</SelectItem>
                                            <SelectItem value="Cancelled">Đã hủy</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Phương thức" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">Tất cả phương thức</SelectItem>
                                            <SelectItem value="Cash">Tiền mặt</SelectItem>
                                            <SelectItem value="Card">Thẻ</SelectItem>
                                            <SelectItem value="Insurance">Bảo hiểm</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Xuất file
                                    </Button>
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
                                            <TableHead>Phương thức</TableHead>
                                            <TableHead>Trạng thái</TableHead>
                                            <TableHead>Ngày thanh toán</TableHead>
                                            <TableHead className="text-right">Hành động</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.map((payment) => (
                                            <TableRow key={payment.id} className={payment.status === 'Paid' ? 'bg-gray-50' : payment.status === 'Cancelled' ? 'bg-red-50' : ''}>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <span className="text-xs font-medium text-blue-600">
                                                                {payment.patient?.full_name?.charAt(0) || 'N/A'}
                                                            </span>
                                                        </div>
                                                        <span className="font-medium">{payment.patient?.full_name || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-black">
                                                        {calculateTotalFromLabTests(payment).toLocaleString('vi-VN')} VNĐ
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getMethodIcon(payment.method)}
                                                        <span className="font-medium">{payment.method}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(payment.status)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-gray-600">
                                                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('vi-VN') : 'Chưa thanh toán'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end space-x-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openInvoiceDetail(payment.id)}
                                                            className="hover:bg-blue-50"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        {payment.status === 'Pending' && (
                                                            <Button
                                                                variant="default"
                                                                size="sm"
                                                                onClick={() => openPaymentDialog(payment.id)}
                                                                className="bg-black hover:bg-gray-800"
                                                            >
                                                                <DollarSign className="h-4 w-4 mr-1" />
                                                                Thanh toán
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
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
                                    <p className="text-sm text-muted-foreground">Hóa đơn #{selectedPaymentData.invoice_id}</p>
                                    <p className="text-sm text-muted-foreground">Ngày: {new Date(selectedPaymentData.payment_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Bệnh nhân:</p>
                                    <p className="font-medium">{selectedPaymentData.patient?.full_name || 'N/A'}</p>
                                    <div className="mt-2">
                                        {getStatusBadge(selectedPaymentData.status)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div>
                                <h4 className="font-medium mb-3">Dịch vụ & Phí</h4>
                                {selectedPaymentData.appointment?.medical_record?.examinations?.map((examination) => (
                                    examination.lab_tests?.map((labTest) => (
                                        <div key={labTest.id} className="flex justify-between py-2 border-b">
                                            <div>
                                                <p className="font-medium">{labTest.test_type}</p>
                                                <p className="text-sm text-muted-foreground">{examination.examination_type}</p>
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
                                    ))
                                ))}
                            </div>

                            <Separator />

                            {/* Payment Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Tổng cộng:</span>
                                    <span>{calculateTotalFromLabTests(selectedPaymentData).toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span>Phương thức thanh toán:</span>
                                    <div className="flex items-center space-x-2">
                                        {getMethodIcon(selectedPaymentData.method)}
                                        <span>{selectedPaymentData.method}</span>
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
                                <p className="text-sm text-muted-foreground">Hóa đơn</p>
                                <p className="font-medium">#{selectedPaymentData.invoice_id}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Bệnh nhân</p>
                                <p className="font-medium">{selectedPaymentData.patient?.full_name || 'N/A'}</p>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-sm text-muted-foreground">Số tiền thanh toán</p>
                                <p className="text-xl font-bold text-black">
                                    {calculateTotalFromLabTests(selectedPaymentData).toLocaleString('vi-VN')} VNĐ
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