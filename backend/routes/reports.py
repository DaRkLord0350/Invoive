from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta, timezone
from database import get_db
import models
from auth import get_current_active_user
from sqlalchemy import func

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/sales/summary")
def get_sales_summary(
    business_id: Optional[int] = None,
    period: str = Query("daily", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get sales summary for specified period"""
    
    # If no business_id provided, get the user's business
    if not business_id:
        business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
        if not business:
            # Create a default business for the user
            business = models.Business(
                owner_id=current_user.id,
                business_name=f"{current_user.username}'s Business"
            )
            db.add(business)
            db.commit()
            db.refresh(business)
        business_id = business.id
    
    # Determine date range
    IST = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(IST)

    if period == "daily":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
    elif period == "weekly":
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=7)
    elif period == "monthly":
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        if now.month == 12:
            end_date = start_date.replace(year=now.year + 1, month=1)
        else:
            end_date = start_date.replace(month=now.month + 1)
    else:  # yearly
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date.replace(year=now.year + 1)
    
    # Get invoices for period
    invoices = db.query(models.Invoice).filter(
        models.Invoice.business_id == business_id,
        models.Invoice.created_at >= start_date,
        models.Invoice.created_at < end_date
    ).all()
    
    total_revenue = sum([inv.grand_total for inv in invoices])
    total_orders = len(invoices)
    
    # Calculate profit
    total_cost = 0
    for invoice in invoices:
        for item in invoice.items:
            total_cost += item.quantity * item.product.buying_price
    
    total_profit = total_revenue - total_cost
    
    return {
        "period": period,
        "start_date": start_date,
        "end_date": end_date,
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "total_profit": total_profit,
        "average_order_value": total_revenue / total_orders if total_orders > 0 else 0
    }

@router.get("/inventory/value")
def get_inventory_value(
    business_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get total inventory value"""
    
    # If no business_id provided, get the user's business
    if not business_id:
        business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
        if not business:
            return {"total_items": 0, "total_stock": 0, "total_capital_value": 0}
        business_id = business.id
    
    products = db.query(models.Product).filter(
        models.Product.business_id == business_id
    ).all()
    
    total_value = sum([product.current_stock * product.buying_price for product in products])
    
    return {
        "total_items": len(products),
        "total_stock": sum([p.current_stock for p in products]),
        "total_capital_value": float(total_value)
    }

@router.get("/products/bestsellers")
def get_bestsellers(
    business_id: Optional[int] = None,
    limit: int = Query(10, le=100),
    period: str = Query("monthly", regex="^(daily|weekly|monthly|yearly)$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get bestselling products"""
    
    # If no business_id provided, get the user's business
    if not business_id:
        business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
        if not business:
            return {"period": period, "bestsellers": []}
        business_id = business.id
    
    # Determine date range
    IST = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(IST)
    if period == "daily":
        start_date = now - timedelta(days=1)
    elif period == "weekly":
        start_date = now - timedelta(days=7)
    elif period == "monthly":
        start_date = now - timedelta(days=30)
    else:  # yearly
        start_date = now - timedelta(days=365)
    
    # Get top selling products
    results = db.query(
        models.Product,
        func.sum(models.InvoiceItem.quantity).label("total_quantity"),
        func.sum(models.InvoiceItem.total_amount).label("total_sales")
    ).join(models.InvoiceItem).join(models.Invoice).filter(
        models.Product.business_id == business_id,
        models.Invoice.created_at >= start_date
    ).group_by(models.Product.id).order_by(
        func.sum(models.InvoiceItem.quantity).desc()
    ).limit(limit).all()
    
    return {
        "period": period,
        "bestsellers": [
            {
                "product_id": r[0].id,
                "product_name": r[0].product_name,
                "quantity_sold": r[1] or 0,
                "total_sales": float(r[2] or 0)
            }
            for r in results
        ]
    }

@router.get("/customers/top")
def get_top_customers(
    business_id: Optional[int] = None,
    limit: int = Query(10, le=50),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get top customers by purchases"""
    
    # If no business_id provided, get the user's business
    if not business_id:
        business = db.query(models.Business).filter(models.Business.owner_id == current_user.id).first()
        if not business:
            return {"top_customers": []}
        business_id = business.id
    
    customers = db.query(models.Customer).filter(
        models.Customer.business_id == business_id
    ).order_by(models.Customer.total_purchases.desc()).limit(limit).all()
    
    return {
        "top_customers": [
            {
                "customer_id": c.id,
                "customer_name": c.customer_name,
                "email": c.email,
                "phone": c.phone,
                "total_purchases": float(c.total_purchases or 0)
            }
            for c in customers
        ]
    }

@router.get("/payments/outstanding")
def get_outstanding_payments(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all outstanding payments"""
    invoices = db.query(models.Invoice).filter(
        models.Invoice.business_id == business_id,
        models.Invoice.payment_status != models.PaymentStatus.PAID
    ).all()
    
    total_outstanding = 0
    invoice_list = []
    for inv in invoices:
        outstanding = inv.grand_total - sum([p.amount for p in inv.payments])
        total_outstanding += outstanding
        invoice_list.append({
            "invoice_id": inv.id,
            "invoice_number": inv.invoice_number,
            "customer_name": inv.customer.customer_name if inv.customer else "Unknown",
            "amount": inv.grand_total,
            "outstanding": outstanding,
            "payment_status": str(inv.payment_status)
        })
    
    return {
        "total_outstanding_invoices": len(invoices),
        "total_outstanding_amount": total_outstanding,
        "invoices": invoice_list
    }

@router.get("/tax/summary")
def get_tax_summary(
    business_id: int,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get tax collection summary"""
    
    query = db.query(models.Invoice).filter(models.Invoice.business_id == business_id)
    
    if start_date:
        start = datetime.fromisoformat(start_date)
        query = query.filter(models.Invoice.created_at >= start)
    
    if end_date:
        end = datetime.fromisoformat(end_date)
        query = query.filter(models.Invoice.created_at <= end)
    
    invoices = query.all()
    
    total_tax = sum([inv.tax_amount for inv in invoices])
    business = db.query(models.Business).filter(models.Business.id == business_id).first()
    
    return {
        "total_tax_collected": total_tax,
        "cgst": total_tax * (business.cgst_rate / (business.cgst_rate + business.sgst_rate)) if business.cgst_rate + business.sgst_rate > 0 else 0,
        "sgst": total_tax * (business.sgst_rate / (business.cgst_rate + business.sgst_rate)) if business.cgst_rate + business.sgst_rate > 0 else 0,
        "number_of_invoices": len(invoices)
    }
