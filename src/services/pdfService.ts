import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFGenerationOptions {
  filename?: string;
  quality?: number;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
}

class PDFService {
  private static instance: PDFService;

  public static getInstance(): PDFService {
    if (!PDFService.instance) {
      PDFService.instance = new PDFService();
    }
    return PDFService.instance;
  }

  /**
   * Generate PDF from HTML element
   */
  async generatePDF(
    element: HTMLElement, 
    options: PDFGenerationOptions = {}
  ): Promise<void> {
    const {
      filename = 'document.pdf',
      quality = 1,
      format = 'a4',
      orientation = 'portrait',
      margin = 10
    } = options;

    try {
      // Show loading state
      this.showLoadingIndicator();

      // Configure html2canvas options
      const canvas = await html2canvas(element, {
        scale: 2, // Higher scale for better quality
        quality: quality,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      // Calculate PDF dimensions
      const imgData = canvas.toDataURL('image/png', quality);
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: format,
        compress: true
      });

      // Get PDF dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions with margins
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      // Calculate scaling to fit the page while maintaining aspect ratio
      const imgAspectRatio = canvas.width / canvas.height;
      const pageAspectRatio = availableWidth / availableHeight;
      
      let imgWidth = availableWidth;
      let imgHeight = availableWidth / imgAspectRatio;
      
      // If image height exceeds available height, scale down
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = availableHeight * imgAspectRatio;
      }
      
      // Center the image on the page
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = margin;

      // Check if content fits on one page
      const contentHeight = (canvas.height * imgWidth) / canvas.width;
      
      if (contentHeight <= availableHeight) {
        // Single page
        pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      } else {
        // Multiple pages needed
        await this.addMultiplePages(pdf, canvas, imgData, {
          pdfWidth,
          pdfHeight,
          availableWidth,
          availableHeight,
          margin,
          xOffset
        });
      }

      // Save the PDF
      pdf.save(filename);
      
      // Hide loading state
      this.hideLoadingIndicator();
      
      // Show success message
      this.showSuccessMessage('PDF downloaded successfully!');

    } catch (error) {
      console.error('Error generating PDF:', error);
      this.hideLoadingIndicator();
      this.showErrorMessage('Failed to generate PDF. Please try again.');
      throw error;
    }
  }

  /**
   * Handle multi-page PDF generation
   */
  private async addMultiplePages(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    imgData: string,
    dimensions: {
      pdfWidth: number;
      pdfHeight: number;
      availableWidth: number;
      availableHeight: number;
      margin: number;
      xOffset: number;
    }
  ): Promise<void> {
    const { pdfWidth, pdfHeight, availableWidth, availableHeight, margin, xOffset } = dimensions;
    
    // Calculate how many pages we need
    const pageHeight = (canvas.height * availableWidth) / canvas.width;
    const totalPages = Math.ceil(pageHeight / availableHeight);
    
    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage();
      }
      
      // Calculate the portion of the image for this page
      const sourceY = (canvas.height / totalPages) * page;
      const sourceHeight = Math.min(canvas.height / totalPages, canvas.height - sourceY);
      
      // Create a temporary canvas for this page section
      const pageCanvas = document.createElement('canvas');
      const pageCtx = pageCanvas.getContext('2d')!;
      
      pageCanvas.width = canvas.width;
      pageCanvas.height = (canvas.height / totalPages);
      
      // Draw the section of the original canvas
      pageCtx.drawImage(
        canvas,
        0, sourceY, canvas.width, sourceHeight,
        0, 0, canvas.width, pageCanvas.height
      );
      
      const pageImgData = pageCanvas.toDataURL('image/png', 1);
      
      // Calculate dimensions for this page
      const imgHeight = availableHeight;
      const imgWidth = (pageCanvas.width * imgHeight) / pageCanvas.height;
      
      pdf.addImage(pageImgData, 'PNG', xOffset, margin, imgWidth, imgHeight);
    }
  }

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePDF(
    applicantData: any,
    programData?: any,
    cohortData?: any
  ): Promise<void> {
    const filename = `Invoice-${applicantData.applicationNumber || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create a temporary container with the Invoice component
    const container = await this.createTemporaryComponent('invoice', {
      applicantData,
      programData,
      cohortData
    });
    
    try {
      await this.generatePDF(container, {
        filename,
        quality: 0.98,
        format: 'a4',
        orientation: 'portrait',
        margin: 10
      });
    } finally {
      // Clean up temporary container
      document.body.removeChild(container);
    }
  }

  /**
   * Generate Receipt PDF
   */
  async generateReceiptPDF(
    paymentData: any,
    programData?: any
  ): Promise<void> {
    const filename = `Receipt-${paymentData.applicationNumber || 'KSS'}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Create a temporary container with the Receipt component
    const container = await this.createTemporaryComponent('receipt', {
      paymentData,
      programData
    });
    
    try {
      await this.generatePDF(container, {
        filename,
        quality: 0.98,
        format: 'a4',
        orientation: 'portrait',
        margin: 10
      });
    } finally {
      // Clean up temporary container
      document.body.removeChild(container);
    }
  }

  /**
   * Create temporary container for PDF generation
   */
  private async createTemporaryComponent(
    type: 'invoice' | 'receipt',
    props: any
  ): Promise<HTMLElement> {
    return new Promise((resolve) => {
      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '210mm'; // A4 width
      container.style.backgroundColor = 'white';
      container.style.fontFamily = 'Arial, sans-serif';
      
      document.body.appendChild(container);
      
      // This would need to be implemented with React.render in a real scenario
      // For now, we'll create a placeholder that can be replaced with actual component rendering
      container.innerHTML = this.generateStaticHTML(type, props);
      
      // Wait for fonts and images to load
      setTimeout(() => {
        resolve(container);
      }, 500);
    });
  }

  /**
   * Generate static HTML for PDF (simplified version)
   * In a real implementation, this would use React.render to render the actual components
   */
  private generateStaticHTML(type: 'invoice' | 'receipt', props: any): string {
    if (type === 'invoice') {
      return this.generateInvoiceHTML(props);
    } else {
      return this.generateReceiptHTML(props);
    }
  }

  private generateInvoiceHTML(props: any): string {
    const { applicantData, programData } = props;
    const BASE_PROGRAM_FEE = 5000;
    const VAT_AMOUNT = BASE_PROGRAM_FEE * 0.16;
    const TOTAL_PROGRAM_FEE = BASE_PROGRAM_FEE + VAT_AMOUNT;
    const balanceDue = Math.max(0, TOTAL_PROGRAM_FEE - (applicantData.amountPaid || 0));
    
    return `
      <div style="padding: 32px; max-width: 800px; margin: 0 auto; background: white;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
          <div>
            <img src="/logo.png" alt="KSS Logo" style="height: 64px; width: 64px; object-fit: contain;">
            <h3 style="margin: 8px 0 4px 0; font-size: 18px; color: #1F2937;">Kenya School of Sales</h3>
            <p style="margin: 0; font-size: 12px; color: #6B7280;">Powered by Commercial Club of Africa & Yusudi</p>
          </div>
          <div style="text-align: right;">
            <h1 style="font-size: 32px; font-weight: bold; color: #03557f; margin-bottom: 8px;">INVOICE</h1>
            <p style="margin: 2px 0; font-size: 14px; color: #6B7280;"><strong>Invoice #:</strong> INV-${applicantData.applicationNumber || '001'}</p>
            <p style="margin: 2px 0; font-size: 14px; color: #6B7280;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">From</h3>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 8px;">
              <p style="font-weight: 600; color: #1F2937; margin: 0 0 4px 0;">Kenya School of Sales</p>
              <p style="margin: 2px 0; font-size: 14px; color: #6B7280;">Commercial Club of Africa</p>
              <p style="margin: 2px 0; font-size: 14px; color: #6B7280;">Nairobi, Kenya</p>
              <p style="margin: 2px 0; font-size: 14px; color: #6B7280;">Email: info@kenyaschoolofsales.com</p>
            </div>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Bill To</h3>
            <div style="background: #EBF8FF; padding: 16px; border-radius: 8px;">
              <p style="font-weight: 600; color: #1F2937; margin: 0 0 4px 0;">${applicantData.firstName} ${applicantData.lastName}</p>
              <p style="margin: 2px 0; font-size: 14px; color: #6B7280;">${applicantData.email}</p>
              <p style="margin: 2px 0; font-size: 14px; color: #6B7280;">${applicantData.phoneNumber}</p>
              <p style="margin: 8px 0 2px 0; font-size: 14px; color: #6B7280;"><strong>Application #:</strong> ${applicantData.applicationNumber}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #03557f; color: white;">
                <th style="text-align: left; padding: 16px; font-weight: 600;">Description</th>
                <th style="text-align: center; padding: 16px; font-weight: 600;">Quantity</th>
                <th style="text-align: right; padding: 16px; font-weight: 600;">Unit Price</th>
                <th style="text-align: right; padding: 16px; font-weight: 600;">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 16px;">
                  <p style="font-weight: 500; color: #1F2937; margin: 0 0 4px 0;">${programData?.programName || 'Sales Training Program'}</p>
                  <p style="font-size: 14px; color: #6B7280; margin: 0;">Professional sales training and certification</p>
                </td>
                <td style="text-align: center; padding: 16px; color: #374151;">1</td>
                <td style="text-align: right; padding: 16px; color: #374151;">KES ${BASE_PROGRAM_FEE.toLocaleString()}.00</td>
                <td style="text-align: right; padding: 16px; color: #374151;">KES ${BASE_PROGRAM_FEE.toLocaleString()}.00</td>
              </tr>
              <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 16px;">
                  <p style="font-weight: 500; color: #1F2937; margin: 0 0 4px 0;">VAT (16%)</p>
                  <p style="font-size: 14px; color: #6B7280; margin: 0;">Value Added Tax</p>
                </td>
                <td style="text-align: center; padding: 16px; color: #374151;">1</td>
                <td style="text-align: right; padding: 16px; color: #374151;">KES ${VAT_AMOUNT.toLocaleString()}.00</td>
                <td style="text-align: right; padding: 16px; color: #374151;">KES ${VAT_AMOUNT.toLocaleString()}.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Payment Information</h3>
            <div style="background: #F9FAFB; padding: 16px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">Payment Method:</span>
                <span style="color: #1F2937; font-weight: 500; text-transform: capitalize;">${applicantData.paymentMethod?.replace('_', ' ')}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">Confirmation Code:</span>
                <span style="color: #1F2937; font-weight: 500;">${applicantData.confirmationCode || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Payment Summary</h3>
            <div style="background: #EBF8FF; padding: 16px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">Subtotal:</span>
                <span style="color: #1F2937;">KES ${BASE_PROGRAM_FEE.toLocaleString()}.00</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #6B7280;">VAT (16%):</span>
                <span style="color: #1F2937;">KES ${VAT_AMOUNT.toLocaleString()}.00</span>
              </div>
              <div style="border-top: 1px solid #BEE3F8; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600; font-size: 18px;">
                  <span style="color: #1F2937;">Total:</span>
                  <span style="color: #03557f;">KES ${TOTAL_PROGRAM_FEE.toLocaleString()}.00</span>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 8px;">
                <span style="color: #6B7280;">Amount Paid:</span>
                <span style="color: #059669; font-weight: 500;">KES ${(applicantData.amountPaid || 0).toLocaleString()}.00</span>
              </div>
              <div style="border-top: 1px solid #BEE3F8; padding-top: 8px; margin-top: 8px;">
                <div style="display: flex; justify-content: space-between; font-weight: 600;">
                  <span style="color: #1F2937;">Balance Due:</span>
                  <span style="color: ${balanceDue <= 0 ? '#059669' : '#DC2626'}; font-weight: bold;">KES ${balanceDue.toLocaleString()}.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="color: #6B7280; font-size: 14px; margin: 0 0 4px 0;">
            <strong>Kenya School of Sales</strong> - Building bold commercial talent for Africa
          </p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 0;">
            Powered by Commercial Club of Africa (CCA) and Yusudi
          </p>
        </div>
      </div>
    `;
  }

  private generateReceiptHTML(props: any): string {
    const { paymentData, programData } = props;
    const TOTAL_PROGRAM_FEE = 5800; // 5000 + VAT
    const remainingBalance = Math.max(0, TOTAL_PROGRAM_FEE - paymentData.amountPaid);
    
    return `
      <div style="padding: 32px; max-width: 600px; margin: 0 auto; background: white;">
        <div style="text-align: center; margin-bottom: 32px;">
          <img src="/logo.png" alt="KSS Logo" style="height: 64px; width: 64px; object-fit: contain; margin-bottom: 16px;">
          <div style="background: #D1FAE5; border: 1px solid #6EE7B7; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #065F46; margin: 0 0 8px 0;">PAYMENT RECEIPT</h1>
            <p style="color: #059669; font-weight: 500; margin: 0;">Payment Successful</p>
          </div>
        </div>

        <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
          <h2 style="font-size: 24px; font-weight: bold; color: #065F46; margin-bottom: 8px;">Payment Confirmed</h2>
          <p style="color: #059669; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">
            KES ${paymentData.amountPaid.toLocaleString()}.00
          </p>
          <p style="color: #6B7280; font-size: 14px; margin: 0;">
            Your payment has been successfully processed
          </p>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Customer Information</h3>
          <div style="background: #EBF8FF; padding: 16px; border-radius: 8px;">
            <p style="font-weight: 600; color: #1F2937; margin: 0 0 8px 0;">${paymentData.firstName} ${paymentData.lastName}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">${paymentData.email}</p>
            <p style="margin: 4px 0; font-size: 14px; color: #6B7280;">${paymentData.phoneNumber}</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #6B7280;"><strong>Application #:</strong> ${paymentData.applicationNumber}</p>
          </div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #1F2937; margin-bottom: 12px;">Payment Breakdown</h3>
          <div style="background: white; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
            <div style="padding: 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Amount Paid:</span>
              <span style="font-weight: 600; color: #059669;">KES ${paymentData.amountPaid.toLocaleString()}.00</span>
            </div>
            <div style="padding: 16px; border-bottom: 1px solid #E5E7EB; display: flex; justify-content: space-between;">
              <span style="color: #6B7280;">Total Program Fee:</span>
              <span style="color: #1F2937;">KES ${TOTAL_PROGRAM_FEE.toLocaleString()}.00</span>
            </div>
            <div style="padding: 16px; background: #F9FAFB; display: flex; justify-content: space-between;">
              <span style="font-weight: 500; color: #1F2937;">Remaining Balance:</span>
              <span style="font-weight: bold; color: ${remainingBalance <= 0 ? '#059669' : '#D97706'};">KES ${remainingBalance.toLocaleString()}.00</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
          <p style="font-weight: 500; color: #1F2937; margin: 0 0 8px 0;">Questions about your payment?</p>
          <p style="color: #6B7280; font-size: 14px; margin: 2px 0;">Email: info@kenyaschoolofsales.com</p>
          <p style="color: #6B7280; font-size: 14px; margin: 2px 0;">Phone: +254 700 000 000</p>
          <p style="color: #9CA3AF; font-size: 12px; margin: 8px 0 0 0;">
            Kenya School of Sales - Powered by Commercial Club of Africa & Yusudi
          </p>
        </div>
      </div>
    `;
  }

  /**
   * UI Helper Methods
   */
  private showLoadingIndicator(): void {
    const loader = document.createElement('div');
    loader.id = 'pdf-loader';
    loader.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
        <div style="background: white; padding: 24px; border-radius: 8px; text-align: center;">
          <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
          <p style="margin: 0; color: #333;">Generating PDF...</p>
        </div>
      </div>
      <style>
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loader);
  }

  private hideLoadingIndicator(): void {
    const loader = document.getElementById('pdf-loader');
    if (loader) {
      document.body.removeChild(loader);
    }
  }

  private showSuccessMessage(message: string): void {
    this.showToast(message, 'success');
  }

  private showErrorMessage(message: string): void {
    this.showToast(message, 'error');
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10B981' : '#EF4444'};
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10000;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        document.body.removeChild(toast);
      }
      if (style.parentNode) {
        document.head.removeChild(style);
      }
    }, 3000);
  }
}

export default PDFService.getInstance(); 