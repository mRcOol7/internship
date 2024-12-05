import React, { useState, useEffect } from 'react';
import Invoice from './Invoice';
import axios from 'axios';
import Navbar from './navBar';
import { toast } from 'react-toastify';
import '../css/InvoiceGenerator.css';

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
    try {
      if (!invoiceData.customerInfo.name || !invoiceData.items.length) {
        console.error('Missing required fields');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/save-invoice', invoiceData, {
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
                  className="form-control"
                  required
                />
              </label>
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
                  type="text"
                  name="phone"
                  placeholder="Phone Number"
                  value={invoiceData.customerInfo.phone}
                  onChange={handleCustomerInfoChange}
                  className="form-control"
                  required
                />
              </label>
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
                      className="form-control"
                    />
                  </label>
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
                      className="form-control"
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Email:
                    <input
                      type="email"
                      name="email"
                      placeholder="Business Email"
                      value={invoiceData.customerInfo.email}
                      onChange={handleCustomerInfoChange}
                      className="form-control"
                    />
                  </label>
                </div>
              </>
            )}
          </div>

          <div className="items-section">
            <h3>Items</h3>
            <div className="item-header item-row">
              <div>Item Name</div>
              <div>Quantity</div>
              <div>Price (₹)</div>
              <div>Total</div>
              <div></div>
            </div>
            {invoiceData.items.map((item, index) => (
              <div key={index} className="item-row">
                <div className="form-group">
                  <label>
                    Item Name:
                    <input
                      type="text"
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                      className="form-control"
                      required
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Quantity:
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity === 0 ? '' : item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="form-control"
                      required
                    />
                  </label>
                </div>
                <div className="form-group">
                  <label>
                    Price:
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price === 0 ? '' : item.price}
                      onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                      className="form-control"
                      required
                    />
                  </label>
                </div>
                <div className="item-total">
                  {formatCurrency(item.quantity * item.price)}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="remove-item-btn"
                  title="Remove Item"
                >
                  ×
                </button>
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