from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime, timedelta
from database import get_db
import models
from schemas import InvoiceCreate, InvoiceResponse, InvoiceUpdate, PaymentCreate, PaymentResponse
from auth import get_current_active_user
from pdf_generator import generate_invoice_pdf

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])

def generate_invoice_number(business_id: int, db: Session) -> str:
    """Generate unique invoice number"""
    latest = db.query(models.Invoice).filter(
        models.Invoice.business_id == business_id
    ).order_by(models.Invoice.id.desc()).first()
    
    if latest:
        number = int(latest.invoice_number.split("-")[-1]) + 1
    else:
        number = 1
    
    return f"INV-{business_id}-{number:06d}"

def calculate_customer_payment_status(customer_id: int, db: Session):
    """Calculate customer's overall payment status based on all invoices"""
    invoices = db.query(models.Invoice).filter(
        models.Invoice.customer_id == customer_id
    ).all()
    
    if not invoices:
        return models.PaymentStatus.UNPAID
    
    # Convert all to string for comparison
    invoice_statuses = [str(inv.payment_status).lower() if inv.payment_status else "unpaid" for inv in invoices]
    
    # Check if all invoices are paid
    if all(status == "paid" for status in invoice_statuses):
        return models.PaymentStatus.PAID
    
    # Check if any invoice is partial
    if any(status == "partial" for status in invoice_statuses):
        return models.PaymentStatus.PARTIAL
    
    # Otherwise unpaid
    return models.PaymentStatus.UNPAID

@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    customer_id: Optional[int] = None,
    payment_status: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List invoices with filters for current user's business"""
    # Get or create user's business
    business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
    if not business:
        # Auto-create a default business for the user
        business = models.Business(
            owner_id=current_user.id,
            business_name=f"{current_user.username}'s Business"
        )
        db.add(business)
        db.commit()
        db.refresh(business)
    
    query = db.query(models.Invoice).filter(models.Invoice.business_id == business.id)
    
    if customer_id:
        query = query.filter(models.Invoice.customer_id == customer_id)
    
    if payment_status:
        query = query.filter(models.Invoice.payment_status == payment_status)
    
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(models.Invoice.created_at >= start)
    
    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.filter(models.Invoice.created_at <= end)
    
    # Eagerly load customer and items with products
    query = query.options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
    )
    
    invoices = query.order_by(models.Invoice.created_at.desc()).offset(skip).limit(limit).all()
    return invoices

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get invoice details"""
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
    ).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice: InvoiceCreate,
    business_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create new invoice"""
    # Get or create user's business
    if not business_id:
        business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
        if not business:
            business = models.Business(
                owner_id=current_user.id,
                business_name=f"{current_user.username}'s Business"
            )
            db.add(business)
            db.commit()
            db.refresh(business)
        business_id = business.id
    else:
        # Get business
        business = db.query(models.Business).filter(models.Business.id == business_id).first()
        if not business:
            raise HTTPException(status_code=404, detail="Business not found")
    
    # Calculate totals
    subtotal = 0
    tax_amount = 0
    invoice_items = []
    
    for item in invoice.items:
        # Get product
        product = db.query(models.Product).filter(models.Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        # Check stock
        if product.current_stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.product_name}")
        
        # Calculate item total
        item_total = item.quantity * item.unit_price
        item_tax = (item_total * item.tax_percentage) / 100
        
        subtotal += item_total
        tax_amount += item_tax
        
        # Create invoice item
        invoice_item = models.InvoiceItem(
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=item.unit_price,
            tax_percentage=item.tax_percentage,
            tax_amount=item_tax,
            total_amount=item_total + item_tax
        )
        invoice_items.append(invoice_item)
        
        # Update product stock
        product.current_stock -= item.quantity
        
        # Create stock history
        stock_history = models.StockHistory(
            product_id=product.id,
            quantity_change=-item.quantity,
            previous_stock=product.current_stock + item.quantity,
            new_stock=product.current_stock,
            reason="sale",
            notes=f"Invoice sale"
        )
        db.add(stock_history)
    
    # Calculate grand total
    grand_total = subtotal + tax_amount - invoice.discount_amount
    
    # Generate invoice number
    invoice_number = generate_invoice_number(business_id, db)
    
    # If no customer provided, create a walk-in customer
    customer_id = invoice.customer_id
    if not customer_id:
        # Create a walk-in customer with invoice number as identifier
        walk_in_customer = models.Customer(
            business_id=business_id,
            customer_name="Walk-in",
            phone="N/A",
            email=None,
            address=None,
            payment_status=models.PaymentStatus.UNPAID
        )
        db.add(walk_in_customer)
        db.flush()  # Get the ID without committing
        customer_id = walk_in_customer.id
    
    # Create invoice
    db_invoice = models.Invoice(
        business_id=business_id,
        customer_id=customer_id,
        invoice_number=invoice_number,
        subtotal=subtotal,
        tax_amount=tax_amount,
        discount_amount=invoice.discount_amount,
        grand_total=grand_total,
        payment_method=invoice.payment_method,
        payment_status=invoice.payment_status,
        notes=invoice.notes,
        created_by_id=current_user.id,
        items=invoice_items
    )
    
    db.add(db_invoice)
    db.commit()
    db.refresh(db_invoice)
    
    # Update customer totals
    customer = db.query(models.Customer).filter(models.Customer.id == customer_id).first()
    if customer:
        customer.total_purchases += grand_total
        
        # Update payment status based on all customer invoices
        if invoice.payment_status == models.PaymentStatus.UNPAID:
            customer.total_outstanding += grand_total
        
        # Recalculate customer's overall payment status
        customer.payment_status = calculate_customer_payment_status(customer_id, db)
        
        db.commit()
    
    return db_invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    invoice_update: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update invoice"""
    invoice = db.query(models.Invoice).options(
        joinedload(models.Invoice.customer),
        joinedload(models.Invoice.items).joinedload(models.InvoiceItem.product)
    ).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    update_data = invoice_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(invoice, key, value)
    
    # If payment_status is being updated and customer exists, recalculate customer's payment_status
    if 'payment_status' in update_data and invoice.customer:
        invoice.customer.payment_status = calculate_customer_payment_status(invoice.customer_id, db)
    
    db.commit()
    db.refresh(invoice)
    return invoice

@router.post("/{invoice_id}/payment", response_model=PaymentResponse)
def add_payment(
    invoice_id: int,
    payment: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add payment to invoice"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    db_payment = models.Payment(
        invoice_id=invoice_id,
        amount=payment.amount,
        payment_method=payment.payment_method,
        reference_number=payment.reference_number,
        notes=payment.notes
    )
    
    # Calculate total paid
    total_paid = db.query(models.Payment).filter(
        models.Payment.invoice_id == invoice_id
    ).with_entities(models.Payment.amount).all()
    
    total_paid_amount = sum([p[0] for p in total_paid]) + payment.amount
    
    # Update payment status
    if total_paid_amount >= invoice.grand_total:
        invoice.payment_status = models.PaymentStatus.PAID
    elif total_paid_amount > 0:
        invoice.payment_status = models.PaymentStatus.PARTIAL
    
    # Update customer outstanding
    if invoice.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
        if customer:
            customer.total_outstanding -= payment.amount
            if total_paid_amount >= invoice.grand_total:
                customer.payment_status = models.PaymentStatus.PAID
            else:
                customer.payment_status = models.PaymentStatus.PARTIAL
    
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment

@router.get("/{invoice_id}/payments", response_model=List[PaymentResponse])
def get_invoice_payments(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all payments for an invoice"""
    payments = db.query(models.Payment).filter(
        models.Payment.invoice_id == invoice_id
    ).all()
    return payments

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Download invoice as PDF"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Get business and customer
    business = db.query(models.Business).filter(models.Business.id == invoice.business_id).first()
    customer = None
    if invoice.customer_id:
        customer = db.query(models.Customer).filter(models.Customer.id == invoice.customer_id).first()
    
    # Generate PDF
    pdf_buffer = generate_invoice_pdf(invoice, business, customer)
    
    # Return as streaming response
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{invoice.invoice_number}.pdf"}
    )

@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete an invoice"""
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Delete related invoice items
    db.query(models.InvoiceItem).filter(models.InvoiceItem.invoice_id == invoice_id).delete()
    
    # Delete the invoice
    db.delete(invoice)
    db.commit()
    
    return {"message": "Invoice deleted successfully", "invoice_id": invoice_id}

