# Quick Start Guide - Invoice Management System

## ⚡ Quick Setup (5 minutes)

### Option 1: Using Docker (Recommended)

```bash
# 1. Start the entire system with one command
docker-compose up -d

# 2. Wait for services to be healthy (about 30 seconds)

# 3. Access the application
Frontend:  http://localhost:3000
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs
```

### Option 2: Manual Setup

#### Backend Setup
```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file
copy .env.example .env

# 6. Update .env with your PostgreSQL credentials
# DATABASE_URL=postgresql://user:password@localhost:5432/invoice_db

# 7. Start the server
uvicorn main:app --reload

# Backend runs on http://localhost:8000
```

#### Frontend Setup (in new terminal)
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Frontend runs on http://localhost:3000
```

---

## 🔑 Default Login Credentials

```
Email:    demo@example.com
Password: demo123
```

---

## 📱 First Steps

1. **Sign Up/Login**: Create your account or use demo credentials
2. **Create Business**: Add your business information (name, GSTIN, GST rate)
3. **Add Products**: Create product catalog with prices and stock
4. **Add Customers**: Build your customer database
5. **Create Bills**: Start creating invoices
6. **View Reports**: Monitor sales and inventory

---

## 🐛 Troubleshooting

### Docker Issues
```bash
# Stop all containers
docker-compose down

# Remove all containers and volumes
docker-compose down -v

# Rebuild and start fresh
docker-compose up --build
```

### Database Connection Error
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check if port 5432 is not already in use

### Frontend Won't Load
- Clear browser cache (Ctrl+Shift+Del)
- Check if backend is running (http://localhost:8000/health)
- Verify VITE_API_URL environment variable

---

## 📊 Key Features

### Dashboard
- Today's sales summary
- Low stock alerts
- Quick action buttons

### Products
- Add/edit/delete products
- Track stock levels
- View stock history

### Billing
- Create invoices
- Apply discounts
- Calculate taxes automatically
- Select customers
- Choose payment methods

### Customers
- Maintain customer database
- Track purchases
- Monitor outstanding payments

### Reports
- Sales reports (daily/weekly/monthly)
- Inventory analysis
- Customer insights
- Tax collection summary

---

## 🛠️ Common Tasks

### Add a Product
1. Go to Products page
2. Click "Add Product"
3. Fill in details (name, SKU, prices, stock)
4. Click Save

### Create an Invoice
1. Go to Billing page
2. Search and add products to cart
3. Adjust quantities
4. Select customer
5. Choose payment method
6. Click "Generate Invoice"

### View Reports
1. Go to Reports page
2. Select time period (daily/weekly/monthly/yearly)
3. View statistics
4. Download CSV/PDF

---

## 📞 Support

For issues or questions:
- Check README.md for detailed documentation
- Review API documentation at http://localhost:8000/docs
- Check browser console for error messages

---

## 🎯 Next Steps

1. **Customize**: Update business settings and invoice template
2. **Integrate**: Add payment gateway (UPI, Stripe, etc.)
3. **Export**: Generate PDF and Excel reports
4. **Scale**: Deploy to production (Render/Railway/AWS)

---

**Happy Invoicing!** 📊💼
