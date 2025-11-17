from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
import models
from schemas import ProductCreate, ProductResponse, ProductUpdate, StockHistoryResponse
from auth import get_current_active_user

router = APIRouter(prefix="/api/products", tags=["Products"])

@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List all products with optional filters - optimized query"""
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
    
    query = db.query(models.Product).filter(models.Product.business_id == business.id)
    
    if search:
        query = query.filter(
            (models.Product.product_name.ilike(f"%{search}%")) |
            (models.Product.sku.ilike(f"%{search}%"))
        )
    
    if category:
        query = query.filter(models.Product.category == category)
    
    if min_price is not None:
        query = query.filter(models.Product.selling_price >= min_price)
    
    if max_price is not None:
        query = query.filter(models.Product.selling_price <= max_price)
    
    if low_stock:
        query = query.filter(models.Product.current_stock <= models.Product.min_stock_level)
    
    products = query.order_by(models.Product.created_at.desc()).offset(skip).limit(limit).all()
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get product details"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new product"""
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
    
    # Check if SKU already exists
    existing = db.query(models.Product).filter(
        models.Product.sku == product.sku,
        models.Product.business_id == business.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="SKU already exists")
    
    db_product = models.Product(
        **product.dict(),
        business_id=business.id
    )
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update product"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a product"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Product deleted successfully", "product_id": product_id}

@router.post("/{product_id}/add-stock")
def add_stock(
    product_id: int,
    quantity: int,
    reason: str = "purchase",
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add stock to product"""
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    previous_stock = product.current_stock
    product.current_stock += quantity
    
    # Create stock history record
    stock_history = models.StockHistory(
        product_id=product_id,
        quantity_change=quantity,
        previous_stock=previous_stock,
        new_stock=product.current_stock,
        reason=reason,
        notes=notes
    )
    
    db.add(stock_history)
    db.commit()
    db.refresh(product)
    
    return {
        "message": "Stock added successfully",
        "product_id": product_id,
        "previous_stock": previous_stock,
        "new_stock": product.current_stock
    }

@router.get("/{product_id}/stock-history", response_model=List[StockHistoryResponse])
def get_stock_history(
    product_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get stock history for a product"""
    histories = db.query(models.StockHistory).filter(
        models.StockHistory.product_id == product_id
    ).order_by(models.StockHistory.created_at.desc()).offset(skip).limit(limit).all()
    
    return histories

@router.get("/low-stock/{business_id}")
def get_low_stock_products(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get products below minimum stock level - optimized with limit"""
    products = db.query(models.Product).filter(
        models.Product.business_id == business_id,
        models.Product.current_stock <= models.Product.min_stock_level
    ).limit(10).all()
    
    return {
        "count": len(products),
        "products": products
    }
