import React, { useState, useEffect } from 'react';
import Invoice from './Invoice';
import Navbar from './navBar';
import { toast } from 'react-toastify';
import '../css/InvoiceGenerator.css';
import api from '../api';

const InvoiceGenerator = () => {
  const token = localStorage.getItem('token');
  const [invoiceData, setInvoiceData] = useState({
    type: 'customer',
    invoiceNumber: new Date().getTime().toString().slice(-4),
    date: new Date().toISOString().split('T')[0],
    customerInfo: {
      user_id: token,
      name: '',
      address: '',
      phone: '',
      businessName: '',
      gst: '',
      pan: '',
      email: '',
      logo: null
    },
    items: [],
    subtotal: 0,
    tax: 5,
    discount: 0,
    total: 0
  });

  const [errors, setErrors] = useState({
    customerInfo: {
      name: '',
      phone: '',
      email: '',
      gst: '',
      pan: ''
    },
    items: []
  });

  const validateForm = () => {
    let newErrors = {
      customerInfo: {
        name: '',
        phone: '',
        email: '',
        gst: '',
        pan: ''
      },
      items: []
    };
    let isValid = true;

    // Validate customer info
    if (!invoiceData.customerInfo.name.trim()) {
      newErrors.customerInfo.name = 'Name is required';
      isValid = false;
    }

    if (invoiceData.customerInfo.phone && !/^\d{10}$/.test(invoiceData.customerInfo.phone)) {
      newErrors.customerInfo.phone = 'Phone number must be 10 digits';
      isValid = false;
    }

    if (invoiceData.customerInfo.email && !/\S+@\S+\.\S+/.test(invoiceData.customerInfo.email)) {
      newErrors.customerInfo.email = 'Invalid email format';
      isValid = false;
    }

    if (invoiceData.type === 'wholesaler') {
      if (invoiceData.customerInfo.gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}\d[Z]{1}[A-Z\d]{1}$/.test(invoiceData.customerInfo.gst)) {
        newErrors.customerInfo.gst = 'Invalid GST format';
        isValid = false;
      }
      if (invoiceData.customerInfo.pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(invoiceData.customerInfo.pan)) {
        newErrors.customerInfo.pan = 'Invalid PAN format';
        isValid = false;
      }
    }

    // Validate items
    if (invoiceData.items.length === 0) {
      newErrors.items = ['At least one item is required'];
      isValid = false;
    } else {
      invoiceData.items.forEach((item, index) => {
        const itemErrors = [];
        if (!item.name) itemErrors.push('Item name is required');
        if (!item.quantity || item.quantity <= 0) itemErrors.push('Valid quantity is required');
        if (!item.price || item.price <= 0) itemErrors.push('Valid price is required');
        newErrors.items[index] = itemErrors;
        if (itemErrors.length > 0) isValid = false;
      });
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    calculateTotals();
  }, [invoiceData.items, invoiceData.tax, invoiceData.discount]);

  const handleCustomerInfoChange = (e) => {
    const { name, value } = e.target;
    setInvoiceData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [name]: value
      }
    }));
    
    // Validate on change
    setTimeout(() => validateForm(), 100);
  };

  const addItem = () => {
    setInvoiceData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: '', price: '', total: 0 }]
    }));
  };

  const removeItem = (index) => {
    setInvoiceData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceData(prev => {
      const newItems = [...prev.items];
      const numValue = field === 'quantity' || field === 'price' ? 
        value === '' ? '' : Number(value) : value;

      newItems[index] = {
        ...newItems[index],
        [field]: numValue
      };

      if ((field === 'quantity' || field === 'price') && 
          newItems[index].quantity !== '' && 
          newItems[index].price !== '') {
        newItems[index].total = newItems[index].quantity * newItems[index].price;
      } else {
        newItems[index].total = 0;
      }

      return {
        ...prev,
        items: newItems
      };
    });
    
    // Validate on change
    setTimeout(() => validateForm(), 100);
  };

  const calculateTotals = () => {
    setInvoiceData(prev => {
      const subtotal = prev.items.reduce((sum, item) => {
        const itemTotal = (item.quantity !== '' && item.price !== '') ? 
          item.quantity * item.price : 0;
        return sum + itemTotal;
      }, 0);
      
      const discountAmount = prev.discount === 0 ? 0 : (subtotal * prev.discount) / 100;
      const taxAmount = (subtotal * prev.tax) / 100;
      const total = subtotal + taxAmount - discountAmount;

      return {
        ...prev,
        subtotal: Number(subtotal.toFixed(2)),
        total: Number(total.toFixed(2))
      };
    });
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value;
    if (value === '' || (Number(value) >= 0 && Number(value) <= 100)) {
      setInvoiceData(prev => ({
        ...prev,
        discount: value
      }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 500KB)
      if (file.size > 500000) {
        alert('Please upload an image smaller than 500KB');
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          if (img.width > 200 || img.height > 200) {
            alert('Please upload an image no larger than 200x200 pixels');
            e.target.value = '';
            return;
          }
          setInvoiceData(prev => ({
            ...prev,
            customerInfo: {
              ...prev.customerInfo,
              logo: reader.result
            }
          }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setInvoiceData(prev => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        logo: null
      }
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const saveInvoice = async () => {
    if (!validateForm()) return;
    try {
      const response = await api.post('/api/save-invoice', invoiceData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('Invoice saved successfully:', response.data);
      toast.success('Invoice saved successfully');

      setInvoiceData({
        type: 'customer',
        invoiceNumber: new Date().getTime().toString().slice(-4),
        date: new Date().toISOString().split('T')[0],
        customerInfo: {
          user_id: token,
          name: '',
          address: '',
          phone: '',
          businessName: '',
          gst: '',
          pan: '',
          email: '',
          logo: null
        },
        items: [],
        subtotal: 0,
        tax: 5,
        discount: 0,
        total: 0
      });

    } catch (error) {
      console.error('Error saving invoice:', error);
      toast.error('Failed to save invoice. Please try again.',{
        position: "bottom-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  return (
    <div>
      <Navbar />
      <div className="invoice-generator-container">
        <div className="form-section">
          <h2>Generate Invoice</h2>
          
          <div className="invoice-type-selector">
            <select
              className="form-control"
              value={invoiceData.type}
              onChange={(e) => setInvoiceData(prev => ({ ...prev, type: e.target.value }))}
            >
              <option value="customer">Customer Invoice</option>
              <option value="wholesaler">Wholesaler Invoice</option>
            </select>
          </div>

          <div className="customer-info-section">
            <h3>{invoiceData.type === 'wholesaler' ? 'Business Information' : 'Customer Information'}</h3>
            
            <div className="form-group logo-upload">
              <label>
                Company Logo:
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="form-control"
                  placeholder="Upload passport size image (max 200x200px)"
                />
                <small className="logo-hint">Please upload a passport-size image (max 200x200 pixels, 500KB)</small>
              </label>
              {invoiceData.customerInfo.logo && (
                <div className="logo-preview">
                  <img 
                    src={invoiceData.customerInfo.logo} 
                    alt="Company Logo" 
                    className="preview-image"
                    required
                  />
                  <button 
                    type="button" 
                    onClick={removeLogo}
                    className="remove-logo-btn"
                  >
                    Remove Logo
                  </button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>
                {invoiceData.type === 'wholesaler' ? 'Contact Person Name:' : 'Customer Name:'}
                <input
                  type="text"
                  name="name"
                  placeholder={invoiceData.type === 'wholesaler' ? 'Contact Person Name' : 'Customer Name'}
                  value={invoiceData.customerInfo.name}
                  onChange={handleCustomerInfoChange}
                  className={`form-control ${errors.customerInfo.name ? 'error' : ''}`}
                  required
                />
              </label>
              {errors.customerInfo.name && <div className="error-message">{errors.customerInfo.name}</div>}
            </div>
            {invoiceData.type === 'wholesaler' && (
              <div className="form-group">
                <label>
                  Business Name:
                  <input
                    type="text"
                    name="businessName"
                    placeholder="Business Name"
                    value={invoiceData.customerInfo.businessName}
                    onChange={handleCustomerInfoChange}
                    className="form-control"
                    required
                  />
                </label>
              </div>
            )}
            <div className="form-group">
              <label>
                Address:
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={invoiceData.customerInfo.address}
                  onChange={handleCustomerInfoChange}
                  className="form-control"
                  required
                />
              </label>
            </div>
            <div className="form-group">
              <label>
                Phone Number:
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  value={invoiceData.customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  className={`form-control ${errors.customerInfo.phone ? 'error' : ''}`}
                />
              </label>
              {errors.customerInfo.phone && <div className="error-message">{errors.customerInfo.phone}</div>}
            </div>
            <div className="form-group">
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={invoiceData.customerInfo.email}
                  onChange={handleCustomerInfoChange}
                  className={`form-control ${errors.customerInfo.email ? 'error' : ''}`}
                />
              </label>
              {errors.customerInfo.email && <div className="error-message">{errors.customerInfo.email}</div>}
            </div>
            {invoiceData.type === 'wholesaler' && (
              <>
                <div className="form-group">
                  <label>
                    GST Number:
                    <input
                      type="text"
                      name="gst"
                      placeholder="GST Number"
                      value={invoiceData.customerInfo.gst}
                      onChange={handleCustomerInfoChange}
                      className={`form-control ${errors.customerInfo.gst ? 'error' : ''}`}
                    />
                  </label>
                  {errors.customerInfo.gst && <div className="error-message">{errors.customerInfo.gst}</div>}
                </div>

                <div className="form-group">
                  <label>
                    PAN Number:
                    <input
                      type="text"
                      name="pan"
                      placeholder="PAN Number"
                      value={invoiceData.customerInfo.pan}
                      onChange={handleCustomerInfoChange}
                      className={`form-control ${errors.customerInfo.pan ? 'error' : ''}`}
                    />
                  </label>
                  {errors.customerInfo.pan && <div className="error-message">{errors.customerInfo.pan}</div>}
                </div>
              </>
            )}
          </div>

          <div className="items-section">
            <h3>Items</h3>
            {errors.items.length === 1 && typeof errors.items[0] === 'string' && (
              <div className="error-message">{errors.items[0]}</div>
            )}
            
            <div className="items-header">
              <span>Item Name</span>
              <span>Quantity</span>
              <span>Price (₹)</span>
              <span>Total</span>
              <span></span>
            </div>

            {invoiceData.items.map((item, index) => (
              <div key={index} className="item-row">
                <input
                  type="text"
                  placeholder="Item name"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  className={`form-control ${errors.items[index]?.includes('Item name is required') ? 'error' : ''}`}
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  className={`form-control ${errors.items[index]?.includes('Valid quantity is required') ? 'error' : ''}`}
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={item.price}
                  onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                  className={`form-control ${errors.items[index]?.includes('Valid price is required') ? 'error' : ''}`}
                />
                <div className="item-total">{formatCurrency(item.total || 0)}</div>
                <button 
                  type="button" 
                  onClick={() => removeItem(index)} 
                  className="remove-item-btn"
                  title="Remove Item"
                >
                  ×
                </button>
                {Array.isArray(errors.items[index]) && errors.items[index].map((error, errorIndex) => (
                  <div key={errorIndex} className="error-message">{error}</div>
                ))}
              </div>
            ))}
            <button
              type="button"
              onClick={addItem}
              className="add-item-btn"
            >
              + Add Item
            </button>
          </div>

          <div className="invoice-summary-section">
            <div className="form-group">
              <label>
                Discount (%):
                <input
                  type="number"
                  value={invoiceData.discount === 0 ? '' : invoiceData.discount}
                  onChange={handleDiscountChange}
                  min="0"
                  max="100"
                  placeholder="Enter discount"
                  className="form-control"
                />
              </label>
            </div>
            
            <div className="summary-details">
              <p>Subtotal: {formatCurrency(invoiceData.subtotal)}</p>
              <p>Tax ({invoiceData.tax}%): {formatCurrency((invoiceData.subtotal * invoiceData.tax) / 100)}</p>
              <p>Discount ({invoiceData.discount}%): {formatCurrency((invoiceData.subtotal * invoiceData.discount) / 100)}</p>
              <p className="total">Total: {formatCurrency(invoiceData.total)}</p>
            </div>
          </div>
          <div className="invoice-actions">
          <button
            type="button"
            onClick={saveInvoice}
            className="save-invoice-btn"
          >
            Save Invoice
          </button>
        </div>
        </div>


        <div className="invoice-preview">
          <h2>Invoice Preview</h2>
          <Invoice invoiceData={invoiceData} />
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;