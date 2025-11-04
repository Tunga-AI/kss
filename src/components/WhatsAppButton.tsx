import React, { useState } from 'react';
import { MessageCircle, Phone } from 'lucide-react';
import WhatsAppChat from '../Portal/pages/WhatsApp/WhatsAppChat';

interface WhatsAppButtonProps {
  customerId?: string;
  customerPhone: string;
  customerName: string;
  variant?: 'button' | 'icon' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  customerId,
  customerPhone,
  customerName,
  variant = 'button',
  size = 'md',
  className = '',
  disabled = false
}) => {
  const [showChat, setShowChat] = useState(false);

  // Clean phone number (remove non-digits except +)
  const cleanPhone = customerPhone.replace(/[^\d+]/g, '');
  
  // Check if phone number is valid
  const isValidPhone = cleanPhone.length >= 10 && (cleanPhone.startsWith('+') || cleanPhone.length <= 15);

  const handleOpenChat = () => {
    if (!isValidPhone || disabled) return;
    setShowChat(true);
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'sm':
        return 'h-3 w-3';
      case 'lg':
        return 'h-6 w-6';
      default:
        return 'h-4 w-4';
    }
  };

  if (!isValidPhone) {
    return null; // Don't render if phone number is invalid
  }

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md cursor-pointer'}
    ${className}
  `;

  if (variant === 'icon') {
    return (
      <>
        <button
          onClick={handleOpenChat}
          disabled={disabled}
          className={`
            ${baseClasses}
            ${getSizeClasses()}
            bg-green-500 text-white hover:bg-green-600
            aspect-square rounded-full
          `}
          title={`Send WhatsApp message to ${customerName}`}
        >
          <MessageCircle className={getIconSize()} />
        </button>

        <WhatsAppChat
          customerId={customerId}
          customerPhone={cleanPhone}
          customerName={customerName}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </>
    );
  }

  if (variant === 'minimal') {
    return (
      <>
        <button
          onClick={handleOpenChat}
          disabled={disabled}
          className={`
            ${baseClasses}
            ${getSizeClasses()}
            text-green-600 hover:text-green-700 hover:bg-green-50
            border border-green-200 hover:border-green-300
          `}
          title={`Send WhatsApp message to ${customerName}`}
        >
          <MessageCircle className={`${getIconSize()} mr-1`} />
          WhatsApp
        </button>

        <WhatsAppChat
          customerId={customerId}
          customerPhone={cleanPhone}
          customerName={customerName}
          isOpen={showChat}
          onClose={() => setShowChat(false)}
        />
      </>
    );
  }

  // Default button variant
  return (
    <>
      <button
        onClick={handleOpenChat}
        disabled={disabled}
        className={`
          ${baseClasses}
          ${getSizeClasses()}
          bg-green-500 text-white hover:bg-green-600
          shadow-sm hover:shadow-md
        `}
      >
        <MessageCircle className={`${getIconSize()} mr-2`} />
        <span>WhatsApp</span>
        <Phone className={`${getIconSize()} ml-1 opacity-75`} />
      </button>

      <WhatsAppChat
        customerId={customerId}
        customerPhone={cleanPhone}
        customerName={customerName}
        isOpen={showChat}
        onClose={() => setShowChat(false)}
      />
    </>
  );
};

export default WhatsAppButton; 