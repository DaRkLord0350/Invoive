from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    OWNER = "owner"
    STAFF = "staff"
    ADMIN = "admin"

class PaymentStatus(str, Enum):
    PAID = "paid"
    UNPAID = "unpaid"
    PARTIAL = "partial"

class PaymentMethod(str, Enum):
    CASH = "cash"
    UPI = "upi"
    CARD = "card"
    CREDIT = "credit"

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: str

class UserCreate(UserBase):
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    
    @field_validator('password')
    @classmethod
    def validate_password_length(cls, v):
        if v is not None and len(v) < 6:
            raise ValueError('Password must be at least 6 characters')
        return v

class UserResponse(UserBase):
    id: int
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Business Schemas
class BusinessBase(BaseModel):
    business_name: str
    address: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class BusinessCreate(BusinessBase):
    pass

class BusinessUpdate(BaseModel):
    business_name: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_rate: Optional[float] = None

class BusinessResponse(BusinessBase):
    id: int
    owner_id: int
    gst_rate: float
    created_at: datetime

    class Config:
        from_attributes = True

# Product Schemas
class ProductBase(BaseModel):
    product_name: str
    sku: str
    category: Optional[str] = None
    unit: str
    buying_price: float
    selling_price: float
    min_stock_level: Optional[int] = 0
    current_stock: Optional[int] = 0

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    selling_price: Optional[float] = None
    min_stock_level: Optional[int] = None

class ProductResponse(ProductBase):
    id: int
    business_id: int
    current_stock: int
    gst_percentage: float
    created_at: datetime

    class Config:
        from_attributes = True

# Stock History Schemas
class StockHistoryResponse(BaseModel):
    id: int
    product_id: int
    quantity_change: int
    previous_stock: Optional[int]
    new_stock: Optional[int]
    reason: str
    created_at: datetime

    class Config:
        from_attributes = True

# Customer Schemas
class CustomerBase(BaseModel):
    customer_name: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    customer_name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None

class CustomerResponse(CustomerBase):
    id: int
    business_id: int
    total_purchases: float
    total_outstanding: float
    payment_status: PaymentStatus
    invoice_numbers: Optional[List[str]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Invoice Schemas
class InvoiceItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float
    tax_percentage: float = 0

class InvoiceItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float
    tax_percentage: float
    tax_amount: float
    total_amount: float
    product: Optional['ProductResponse'] = None

    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[InvoiceItemCreate]
    discount_amount: float = 0
    payment_method: PaymentMethod
    payment_status: Optional[PaymentStatus] = PaymentStatus.UNPAID
    notes: Optional[str] = None

class InvoiceUpdate(BaseModel):
    payment_status: Optional[PaymentStatus] = None
    notes: Optional[str] = None

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    customer_id: Optional[int]
    customer: Optional['CustomerResponse'] = None
    subtotal: float
    tax_amount: float
    discount_amount: float
    grand_total: float
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    items: List[InvoiceItemResponse]
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Payment Schemas
class PaymentCreate(BaseModel):
    amount: float
    payment_method: PaymentMethod
    reference_number: Optional[str] = None
    notes: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    invoice_id: int
    amount: float
    payment_method: PaymentMethod
    payment_date: datetime

    class Config:
        from_attributes = True

# Auth Schemas
class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# Update forward references for circular dependencies
InvoiceItemResponse.model_rebuild()
InvoiceResponse.model_rebuild()
