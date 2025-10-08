// src/components/AlertNotification.tsx

import React from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

interface AlertProps {
    message: string | null;
    type: 'success' | 'error';
    onClose: () => void;
}

/**
 * Component hiển thị thông báo tùy chỉnh (Alert/Toast)
 * @param message Nội dung thông báo
 * @param type 'success' hoặc 'error'
 * @param onClose Hàm đóng thông báo
 */
const AlertNotification: React.FC<AlertProps> = ({ message, type, onClose }) => {
    // Nếu không có thông báo, không hiển thị gì cả
    if (!message) return null;

    // Định kiểu cơ bản và vị trí cố định
    const baseStyle = "fixed top-5 right-5 p-4 rounded-lg shadow-2xl z-50 flex items-center space-x-3 transform transition-all duration-300 ease-out animate-in fade-in slide-in-from-right-1/2";
    
    // Định kiểu màu sắc và icon dựa trên type
    let typeStyles = "";
    let Icon = XCircle;

    if (type === 'success') {
        typeStyles = "bg-green-600 text-white border-2 border-green-400";
        Icon = CheckCircle;
    } else if (type === 'error') {
        typeStyles = "bg-red-600 text-white border-2 border-red-400";
        Icon = XCircle;
    }

    return (
        <div className={baseStyle + ' ' + typeStyles} role="alert">
            <Icon className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium text-sm">{message}</span>
            <button 
                onClick={onClose} 
                className="ml-4 p-0.5 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
                aria-label="Close"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};

export default AlertNotification;