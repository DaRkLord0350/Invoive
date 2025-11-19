# Invoice Management System - Complete Guide

A comprehensive **Billing & Inventory Management System** built with React.js and FastAPI. This system helps shop owners and employees manage products, inventory, billing, customers, and sales reports with ease. 2

## 📋 Features Overview

### User Features
- ✅ **Authentication**: Signup/Login with role-based access (Owner, Staff, Admin)
- ✅ **Dashboard**: Real-time sales summary, low stock alerts, quick actions
- ✅ **Product Management**: Add, edit, delete products with SKU tracking
- ✅ **Inventory Tracking**: Stock history, low stock alerts, inventory value reports
- ✅ **Billing System**: Create invoices, select customers, apply discounts, generate PDFs
- ✅ **Customer Management**: Maintain customer database, track payments, send reminders
- ✅ **Sales Reports**: Daily/Weekly/Monthly reports, profitability analysis
- ✅ **Dark/Light Mode**: Fully themed UI support

### Technical Stack
- **Frontend**: React 18 + Tailwind CSS + Vite
- **Backend**: FastAPI + PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Deployment**: Render/Railway/AWS

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 16+ and npm/yarn
- Python 3.8+
- PostgreSQL 12+
- Git

### 1️⃣ Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env
# Edit .env with your PostgreSQL credentials

# Run migrations and create tables
python main.py

# Start the server
uvicorn main:app --reload
```

**Backend will be available at**: `http://localhost:8000`
**API Documentation**: `http://localhost:8000/docs`

### 2️⃣ Frontend Setup (React)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env file (optional)
# VITE_API_URL=http://localhost:8000/api

# Start development server
npm run dev
```

**Frontend will be available at**: `http://localhost:3000`

---

## 📁 Project Structure

### Backend Structure
```
backend/
├── main.py                 # FastAPI app entry point
├── config.py              # Configuration settings
├── database.py            # Database connection
├── models.py              # SQLAlchemy models
├── schemas.py             # Pydantic schemas
├── auth.py                # Authentication logic
├── routes/
│   ├── auth.py           # Authentication endpoints
│   ├── products.py       # Product management
│   ├── customers.py      # Customer management
│   ├── invoices.py       # Invoice/billing
│   ├── reports.py        # Reports & analytics
│   └── businesses.py     # Business settings
├── requirements.txt       # Dependencies
└── .env.example          # Environment variables template
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx          # Entry point
│   ├── App.jsx           # Main app component
│   ├── api/
│   │   ├── client.js     # API client setup
│   │   └── index.js      # API endpoints
│   ├── store/
│   │   └── index.js      # Zustand stores (auth, cart, theme)
│   ├── components/
│   │   ├── Navbar.jsx    # Top navigation
│   │   └── Sidebar.jsx   # Side menu
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── ProductsPage.jsx
│   │   ├── BillingPage.jsx
│   │   ├── CustomersPage.jsx
│   │   ├── ReportsPage.jsx
│   │   └── SettingsPage.jsx
│   └── styles/
│       └── globals.css   # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── index.html
```

---

## 🔐 Database Schema

### Tables
1. **users** - User accounts with roles
2. **businesses** - Business information per user
3. **products** - Product catalog
4. **stock_histories** - Stock movement tracking
5. **customers** - Customer information
6. **invoices** - Invoice records
7. **invoice_items** - Line items in invoices
8. **payments** - Payment tracking

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/signup              # Register user
POST   /api/auth/login               # Login user
GET    /api/auth/me                  # Get current user
POST   /api/auth/forgot-password     # Request password reset
POST   /api/auth/reset-password      # Reset password
```

### Products
```
GET    /api/products/                # List products (with filters)
GET    /api/products/{id}            # Get product details
POST   /api/products/                # Create product
PUT    /api/products/{id}            # Update product
POST   /api/products/{id}/add-stock  # Add stock
GET    /api/products/{id}/stock-history  # Stock history
GET    /api/products/low-stock/{business_id}  # Low stock items
```

### Customers
```
GET    /api/customers/               # List customers
GET    /api/customers/{id}           # Get customer details
POST   /api/customers/               # Create customer
PUT    /api/customers/{id}           # Update customer
POST   /api/customers/{id}/block     # Block customer
POST   /api/customers/{id}/unblock   # Unblock customer
GET    /api/customers/{id}/invoices  # Customer invoices
```

### Invoices
```
GET    /api/invoices/                # List invoices (with filters)
GET    /api/invoices/{id}            # Get invoice details
POST   /api/invoices/                # Create invoice
PUT    /api/invoices/{id}            # Update invoice
POST   /api/invoices/{id}/payment    # Record payment
GET    /api/invoices/{id}/payments   # Get invoice payments
```

### Reports
```
GET    /api/reports/sales/summary              # Sales summary
GET    /api/reports/inventory/value            # Inventory value
GET    /api/reports/products/bestsellers       # Best selling items
GET    /api/reports/customers/top              # Top customers
GET    /api/reports/payments/outstanding      # Outstanding payments
GET    /api/reports/tax/summary                # Tax collection
```

### Business
```
GET    /api/businesses/               # List businesses
GET    /api/businesses/{id}           # Get business details
POST   /api/businesses/               # Create business
PUT    /api/businesses/{id}           # Update business
```

---

## 🎨 UI Responsive Design

### Mobile View (< 768px)
- Bottom navigation bar with 4 tabs
- Full-width cards and buttons
- Native-style Material Design components
- Touch-friendly interface

### Desktop View (≥ 768px)
- Sidebar navigation
- Professional navbar
- Grid layouts (3-4 columns)
- Optimized spacing and typography

### Dark/Light Mode
- Toggle available in navbar
- Persisted in localStorage
- All components fully themed

---

## 📊 Sample Data

### Demo Credentials
```
Email: demo@example.com
Password: demo123
Role: Owner
```

### Sample Business
- Name: ABC Shop
- GSTIN: 27XXXX1234H1Z5
- GST Rate: 18%

---

## 🛠️ Development

### Running Tests
```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Building for Production
```bash
# Backend
# No build needed, deploy directly to Render/Railway

# Frontend
cd frontend
npm run build
# Output in dist/ directory
```

---

## 📝 Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
CORS_ORIGINS=["http://localhost:3000", "http://localhost:5173"]
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:8000/api
```

---

## 🚀 Deployment

### Deploy Backend to Render
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard
4. Deploy

### Deploy Frontend to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set VITE_API_URL to your backend URL
4. Deploy

---

## 📞 Support & Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend is running
- Check CORS_ORIGINS in .env

**Database Connection Failed**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env

**Token Expired**
- Clear localStorage and re-login

---

## 📄 License

This project is open source and available under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📮 Contact

For questions or support, please reach out to: support@invoicemanager.com

**Happy Invoicing!** 📊💼
