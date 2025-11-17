from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models
from schemas import BusinessCreate, BusinessResponse, BusinessUpdate
from auth import get_current_active_user

router = APIRouter(prefix="/api/businesses", tags=["Business"])

@router.get("/", response_model=List[BusinessResponse])
def list_businesses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """List all businesses owned by current user"""
    businesses = db.query(models.Business).filter(
        models.Business.owner_id == current_user.id
    ).all()
    return businesses

@router.get("/{business_id}", response_model=BusinessResponse)
def get_business(
    business_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get business details"""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business

@router.post("/", response_model=BusinessResponse)
def create_business(
    business: BusinessCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create new business"""
    db_business = models.Business(
        **business.dict(),
        owner_id=current_user.id
    )
    db.add(db_business)
    db.commit()
    db.refresh(db_business)
    return db_business

@router.put("/{business_id}", response_model=BusinessResponse)
def update_business(
    business_id: int,
    business_update: BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update business"""
    business = db.query(models.Business).filter(
        models.Business.id == business_id,
        models.Business.owner_id == current_user.id
    ).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    update_data = business_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(business, key, value)
    
    db.commit()
    db.refresh(business)
    return business
