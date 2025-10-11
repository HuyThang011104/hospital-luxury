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
    patient: IPatient;

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


    useEffect(() => {

        fetchPayments();
        fetchInsurancePolicies();
    }, []);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payment')
                .select(`
                    *,
                    patient:patient_id ( id, full_name )
                `);

            if (error) throw error;
            console.log('Dữ liệu payment thực tế trả về:', data);
            setPayments(data as IPayment[]);
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
        const matchesSearch = payment.patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.invoice_id.toLowerCase().includes(searchTerm.toLowerCase());
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

    const openInvoiceDetail = (paymentId: number) => {
        setSelectedPayment(paymentId);
        setIsInvoiceDialogOpen(true);
    };

    const selectedPaymentData = selectedPayment ? payments.find(p => p.id === selectedPayment) : null;

    if (loading) {
        return <div className="text-center py-10">Loading payment records...</div>;
    }

    return (
        <div className="space-y-6">
            {/* ... Phần JSX Header giữ nguyên ... */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Payments & Insurance</h1>
                    <p className="text-muted-foreground">
                        Manage patient payments, invoices, and insurance claims
                    </p>
                </div>
            </div>

            <Tabs defaultValue="payments" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="payments" className="flex items-center">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Payments
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        Insurance
                    </TabsTrigger>
                </TabsList>

                {/* --- PAYMENTS TAB --- */}
                <TabsContent value="payments">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
                                <CardTitle>Payment Records ({filteredPayments.length})</CardTitle>
                                {/* ... Phần filter inputs giữ nguyên ... */}
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by patient or invoice..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8 w-64"
                                        />
                                    </div>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-32">
                                            <Filter className="mr-2 h-4 w-4" />
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Status</SelectItem>
                                            <SelectItem value="Paid">Paid</SelectItem>
                                            <SelectItem value="Pending">Pending</SelectItem>
                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All">All Methods</SelectItem>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Card">Card</SelectItem>
                                            <SelectItem value="Insurance">Insurance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline">
                                        <Download className="mr-2 h-4 w-4" />
                                        Export
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Method</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPayments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                {/* CHANGE: Lấy tên patient từ object */}
                                                <TableCell>{payment.patient.full_name}</TableCell>
                                                {/* CHANGE: invoiceId -> invoice_id */}
                                                <TableCell>{payment.amount} VNĐ</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center space-x-2">
                                                        {getMethodIcon(payment.method)}
                                                        <span>{payment.method}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                                <TableCell>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('vi-VN') : 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openInvoiceDetail(payment.id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
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
                                Insurance Policies ({insurancePolicies.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        {/* ... Header của bảng insurance ... */}
                                        <TableRow>
                                            <TableHead>Patient</TableHead>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Policy Number</TableHead>
                                            <TableHead>Valid From</TableHead>
                                            <TableHead>Valid To</TableHead>
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
                            Invoice Details
                        </DialogTitle>
                    </DialogHeader>

                    {selectedPaymentData && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-semibold">HealthCare Hospital</h3>
                                    <p className="text-sm text-muted-foreground">Invoice #{selectedPaymentData.invoice_id}</p>
                                    <p className="text-sm text-muted-foreground">Date: {new Date(selectedPaymentData.payment_date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Patient:</p>
                                    <p className="font-medium">{selectedPaymentData.patient.full_name}</p>
                                    <div className="mt-2">
                                        {getStatusBadge(selectedPaymentData.status)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Tạm thời comment out phần services vì chưa fetch */}
                            <div>
                                <h4 className="font-medium mb-3">Services & Charges</h4>
                                <p className="text-sm text-muted-foreground">Detailed service breakdown not available.</p>
                                {/* Nếu bạn có dữ liệu services, hãy hiển thị ở đây */}
                            </div>

                            <Separator />

                            {/* Payment Summary */}
                            <div className="space-y-2">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total:</span>
                                    <span>${selectedPaymentData.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center pt-2">
                                    <span>Payment Method:</span>
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
        </div>
    );
}