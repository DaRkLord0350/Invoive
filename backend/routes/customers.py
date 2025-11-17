from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from schemas import CustomerCreate, CustomerResponse, CustomerUpdate
from auth import get_current_active_user

router = APIRouter(prefix="/api/customers", tags=["Customers"])

def calculate_customer_payment_status(customer_id: int, db: Session):
    """Calculate customer's overall payment status based on all invoices"""
    invoices = db.query(models.Invoice).filter(
        models.Invoice.customer_id == customer_id
    ).all()
    
    if not invoices:
        return "partial"
    
    # Extract the value from enum and convert to lowercase for comparison
    invoice_statuses = []
    for inv in invoices:
        if inv.payment_status:
            # Get the value of the enum (e.g., "paid" from PaymentStatus.PAID)
            status_value = inv.payment_status.value if hasattr(inv.payment_status, 'value') else str(inv.payment_status).lower()
            invoice_statuses.append(status_value.lower())
        else:
            invoice_statuses.append("unpaid")
    
    # Check if all invoices are paid
    if all(status == "paid" for status in invoice_statuses):
        return "paid"
    
    # Check if any invoice is partial
    if any(status == "partial" for status in invoice_statuses):
        return "partial"
    
    # Otherwise unpaid
    return "unpaid"

@router.get("/", response_model=List[CustomerResponse])
def list_customers(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, le=1000),
    search: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List all customers for current user's business"""
    # Get or create user's business
    business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
    if not business:
        business = models.Business(
            owner_id=current_user.id,
            business_name=f"{current_user.username}'s Business"
        )
        db.add(business)
        db.commit()
        db.refresh(business)
    
    query = db.query(models.Customer).filter(models.Customer.business_id == business.id)
    
    if search:
        query = query.filter(
            (models.Customer.customer_name.ilike(f"%{search}%")) |
            (models.Customer.phone.ilike(f"%{search}%"))
        )
    
    customers = query.offset(skip).limit(limit).all()
    
    # Recalculate payment status for each customer and persist it
    for customer in customers:
        calculated_status_str = calculate_customer_payment_status(customer.id, db)
        # Convert string to enum for comparison and storage
        calculated_status_enum = models.PaymentStatus(calculated_status_str)
        if customer.payment_status != calculated_status_enum:
            customer.payment_status = calculated_status_enum
            db.add(customer)
        
        # Get invoice numbers for this customer
        invoices = db.query(models.Invoice).filter(
            models.Invoice.customer_id == customer.id
        ).order_by(models.Invoice.created_at.desc()).all()
        customer.invoice_numbers = [inv.invoice_number for inv in invoices]
    
    db.commit()
    
    # Apply filter after recalculation
    if payment_status:
        # Extract the value from enum properly for comparison
        customers = [c for c in customers if c.payment_status.value.lower() == payment_status.lower()]
    
    return customers

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get customer details"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Recalculate payment status based on all invoices
    calculated_status_str = calculate_customer_payment_status(customer.id, db)
    calculated_status_enum = models.PaymentStatus(calculated_status_str)
    if customer.payment_status != calculated_status_enum:
        customer.payment_status = calculated_status_enum
        db.add(customer)
        db.commit()
    
    return customer

@router.post("/", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create new customer for current user's business"""
    # Get or create user's business
    business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
    if not business:
        business = models.Business(
            owner_id=current_user.id,
            business_name=f"{current_user.username}'s Business"
        )
        db.add(business)
        db.commit()
        db.refresh(business)
    
    db_customer = models.Customer(
        **customer.dict(),
        business_id=business.id
    )
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update customer"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    update_data = customer_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(customer, key, value)
    
    db.commit()
    db.refresh(customer)
    return customer

@router.post("/{customer_id}/block")
def block_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Block a customer"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.is_blocked = True
    db.commit()
    return {"message": "Customer blocked successfully"}

@router.post("/{customer_id}/unblock")
def unblock_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Unblock a customer"""
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    customer.is_blocked = False
    db.commit()
    return {"message": "Customer unblocked successfully"}

@router.get("/{customer_id}/invoices")
def get_customer_invoices(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all invoices for a customer"""
    from sqlalchemy.orm import joinedload
    
    invoices = db.query(models.Invoice).options(
        joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
    ).filter(
        models.Invoice.customer_id == customer_id
    ).order_by(models.Invoice.created_at.desc()).all()
    
    return {
        "customer_id": customer_id,
        "total_invoices": len(invoices),
        "invoices": invoices
    }
