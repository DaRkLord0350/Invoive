from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import enum

# Enums
class UserRole(str, enum.Enum):
    OWNER = "owner"
    STAFF = "staff"
    ADMIN = "admin"
    CASHIER = "cashier"
    INVENTORY_MANAGER = "inventory_manager"

class PaymentStatus(str, enum.Enum):
    PAID = "paid"
    UNPAID = "unpaid"
    PARTIAL = "partial"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    UPI = "upi"
    CARD = "card"
    CREDIT = "credit"

# User Model
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    username = Column(String(255), unique=True, index=True)
    full_name = Column(String(255))
    hashed_password = Column(String(255))
    role = Column(SQLEnum(UserRole), default=UserRole.STAFF)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    businesses = relationship("Business", back_populates="owner")
    invoices = relationship("Invoice", back_populates="created_by_user")

# Business Model
class Business(Base):
    __tablename__ = "businesses"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    business_name = Column(String(255), nullable=False)
    address = Column(Text)
    gstin = Column(String(20))
    phone = Column(String(20))
    email = Column(String(255))
    logo_url = Column(String(500))
    gst_rate = Column(Float, default=18.0)
    cgst_rate = Column(Float, default=9.0)
    sgst_rate = Column(Float, default=9.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", back_populates="businesses")
    products = relationship("Product", back_populates="business")
    customers = relationship("Customer", back_populates="business")
    invoices = relationship("Invoice", back_populates="business")

# Product/Item Model
class Product(Base):
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False, index=True)
    category = Column(String(100))
    unit = Column(String(50))  # kg, pieces, litre, box, etc.
    buying_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    gst_percentage = Column(Float, default=18.0)
    current_stock = Column(Integer, default=0)
    min_stock_level = Column(Integer, default=0)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business", back_populates="products")
    stock_histories = relationship("StockHistory", back_populates="product")
    invoice_items = relationship("InvoiceItem", back_populates="product")

# Stock History Model
class StockHistory(Base):
    __tablename__ = "stock_histories"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_change = Column(Integer, nullable=False)
    previous_stock = Column(Integer)
    new_stock = Column(Integer)
    reason = Column(String(255))  # purchase, sale, adjustment, damage, etc.
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    product = relationship("Product", back_populates="stock_histories")

# Customer Model
class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    customer_name = Column(String(255), nullable=False)
    phone = Column(String(20), index=True)
    email = Column(String(255))
    address = Column(Text)
    city = Column(String(100))
    state = Column(String(100))
    pincode = Column(String(10))
    total_purchases = Column(Float, default=0)
    total_outstanding = Column(Float, default=0)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.UNPAID)
    is_blocked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business", back_populates="customers")
    invoices = relationship("Invoice", back_populates="customer")

# Invoice Model
class Invoice(Base):
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    subtotal = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    discount_amount = Column(Float, default=0)
    grand_total = Column(Float, default=0)
    payment_method = Column(SQLEnum(PaymentMethod))
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.UNPAID)
    notes = Column(Text)
    created_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    business = relationship("Business", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    created_by_user = relationship("User", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

# Invoice Item Model
class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    tax_percentage = Column(Float, default=0)
    tax_amount = Column(Float, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="invoice_items")

# Payment Model
class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod))
    payment_date = Column(DateTime, default=datetime.utcnow)
    reference_number = Column(String(100))
    notes = Column(Text)
    
    # Relationships
    invoice = relationship("Invoice", back_populates="payments")
