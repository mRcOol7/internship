import React, { useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import '../css/Invoice.css';

const Invoice = ({ invoiceData }) => {
  const componentRef = useRef(null);

  const handlePrint = async () => {
    const element = componentRef.current;
    
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true,
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      width: element.scrollWidth,
      height: element.scrollHeight,
      backgroundColor: '#ffffff',
      allowTaintedImages: false
    });
    
    const imgData = canvas.toDataURL('image/png', 1.0); 
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
      compress: true,
      allowTaintedImages: false
    });
    
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    let remainingHeight = pdfHeight;
    let position = 0;
    
    while (remainingHeight > 0) {
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, '', 'FAST');
      remainingHeight -= pdf.internal.pageSize.getHeight();
      position -= pdf.internal.pageSize.getHeight();
      
      if (remainingHeight > 0) {
        pdf.addPage();
      }
    }
    
    const date = new Date().toISOString().split('T')[0];
    pdf.save(`Invoice-${invoiceData.invoiceNumber}-${date}.pdf`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  return (
    <div className="invoice-container">
      <div className="invoice-actions">
        <button className="print-button" onClick={handlePrint}>
          <i className="fas fa-print"></i> Print / Download PDF
        </button>
      </div>
      
      <div className="invoice" ref={componentRef}>
        <div className="invoice-header">
          <div className="company-info">
            {invoiceData.customerInfo.logo ? (
              <div className="company-logo">
                <img 
                  src={invoiceData.customerInfo.logo} 
                  alt={`${invoiceData.customerInfo.businessName || invoiceData.customerInfo.name} Logo`}
                  className="uploaded-logo"
                />
              </div>
            ) : (
              <div className="company-logo default-logo">
                ESG
              </div>
            )}
            <div className="company-details">
              <h2>{invoiceData.type === 'wholesaler' ? invoiceData.customerInfo.businessName : 'ESG'}</h2>
              <p>Vadodara</p>
              <p>Gujarat, India</p>
              <p>Phone: +91 123 456 789</p>
              <p>Email: contact@esgcompany.com</p>
              <p className="gst-number">GST: 12ABCDE3456F7Z8</p>
            </div>
          </div>
          <div className="invoice-details">
            <div className="detail-group">
              <h2 className="invoice-title">Invoice</h2>
              <p><strong>Invoice No:</strong> INV-{invoiceData.invoiceNumber}</p>
              <p><strong>Date:</strong> {formatDate(invoiceData.date)}</p>
            </div>
          </div>
        </div>

        <div className="billing-details">
          <div className="customer-info">
            <h3>{invoiceData.type === 'wholesaler' ? 'Business Details' : 'Bill To'}:</h3>
            <div className="customer-details">
              {invoiceData.type === 'wholesaler' && (
                <>
                  <h4 className="business-name">{invoiceData.customerInfo.businessName || 'N/A'}</h4>
                  <p><strong>Contact Person:</strong> {invoiceData.customerInfo.name || 'N/A'}</p>
                  <p><strong>GST:</strong> {invoiceData.customerInfo.gst || 'N/A'}</p>
                  <p><strong>PAN:</strong> {invoiceData.customerInfo.pan || 'N/A'}</p>
                  <p><strong>Email:</strong> {invoiceData.customerInfo.email || 'N/A'}</p>
                </>
              )}
              {invoiceData.type === 'customer' && (
                <h4>{invoiceData.customerInfo.name || 'N/A'}</h4>
              )}
              <p>{invoiceData.customerInfo.address || 'N/A'}</p>
              <p>Phone: {invoiceData.customerInfo.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="invoice-items">
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Item Description</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoiceData.items.length > 0 ? (
                invoiceData.items.map((item, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>{item.name || 'N/A'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatCurrency(item.price)}</td>
                    <td>{formatCurrency(item.quantity * item.price)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-items">No items added</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-items">
            <div className="summary-item">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoiceData.subtotal)}</span>
            </div>
            <div className="summary-item">
              <span>Tax ({invoiceData.tax}%):</span>
              <span>{formatCurrency((invoiceData.subtotal * invoiceData.tax) / 100)}</span>
            </div>
            {invoiceData.discount > 0 && (
              <div className="summary-item discount">
                <span>Discount ({invoiceData.discount}%):</span>
                <span>-{formatCurrency((invoiceData.subtotal * invoiceData.discount) / 100)}</span>
              </div>
            )}
            <div className="summary-item total">
              <span>Total Amount:</span>
              <span>{formatCurrency(invoiceData.total)}</span>
            </div>
          </div>
        </div>

        <div className="invoice-footer">
          <div className="terms-conditions">
            <h4>Terms & Conditions:</h4>
            <ol>
              <li>Payment is due within 30 days</li>
              <li>Please include invoice number on your payment</li>
              <li>Make all cheques payable to ESG</li>
            </ol>
          </div>
          <div className="bank-details">
            <h4>Bank Details:</h4>
            <p><strong>Bank Name:</strong> State Bank of India</p>
            <p><strong>Account No:</strong> XXXXXXXXXXXX</p>
            <p><strong>IFSC Code:</strong> SBIN0000XXX</p>
          </div>
          <div className="signature-section">
            <div className="signature">
              <div className="signature-line"></div>
              <p>Authorized Signature</p>
            </div>
          </div>
          <div className="footer-note" style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #ddd', paddingTop: '1rem' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: '500', color: '#000', margin: '0.5rem 0' }}>Thank you for your business!</p>
            <p style={{ fontSize: '0.9rem', color: '#444', margin: '0.5rem 0' }}>This is a computer-generated invoice, no signature required.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;