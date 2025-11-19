from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from config import settings
from database import Base, engine
from routes import auth, products, customers, invoices, reports, businesses
import os
#app = FastAPI()

# Create tables
Base.metadata.create_all(bind=engine)

#get routes
@app.get("/__routes__")
def list_routes():
    return [{"path": r.path, "methods": list(r.methods)} for r in app.routes]

# Initialize FastAPI app
app = FastAPI(
    title="Billing & Inventory Management System",
    description="A complete billing and inventory management system for businesses",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Add CORS middleware
#app.add_middleware(
#    CORSMiddleware,
#    allow_origins=settings.CORS_ORIGINS,
#    allow_credentials=True,
#    allow_methods=["*"],
#    allow_headers=["*"],
#)
# Add GZIP middleware for response compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(invoices.router)
app.include_router(reports.router)
app.include_router(businesses.router)

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "Invoice Management API"}

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Welcome to Billing & Inventory Management System",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
