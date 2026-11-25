"""
Streetwear Vibe API - FastAPI Backend (Hardened with Blog Editorial & Security)
"""

from typing import List, Optional, Dict, Any
import json
import random
import time
import hmac
import hashlib
import base64
import os
import re
from datetime import datetime, timedelta

from fastapi import FastAPI, Query, HTTPException, Depends, status, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session



DB_PATH = os.path.join(os.path.dirname(__file__), "streetwear.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ProductModel(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    main_category = Column(String, default="Lowers", index=True)
    sub_category = Column(String, default="Baggy Jeans", index=True)
    brand = Column(String, index=True, nullable=False)
    category = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    image_url = Column(String, nullable=False)
    model_3d_url = Column(String, nullable=True)
    model_type = Column(String, default="sneaker")
    affiliate_link = Column(String, nullable=False)
    vibe_tags_raw = Column(Text, nullable=False)
    likes = Column(Integer, default=120)
    drop_status = Column(String, default="HOT DROP")
    description = Column(Text, nullable=True)

    @property
    def vibe_tags(self) -> List[str]:
        try:
            return json.loads(self.vibe_tags_raw)
        except Exception:
            return [t.strip() for t in self.vibe_tags_raw.split(",") if t.strip()]


class BlogModel(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, index=True, nullable=False)
    read_time = Column(String, default="4 min")
    author = Column(String, default="Chief Curator")
    date = Column(String, nullable=False)
    cover_image = Column(String, nullable=False)
    excerpt = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    tags_raw = Column(Text, nullable=False)

    @property
    def tags(self) -> List[str]:
        try:
            return json.loads(self.tags_raw)
        except Exception:
            return [t.strip() for t in self.tags_raw.split(",") if t.strip()]


class AdminUserModel(Base):
    __tablename__ = "admin_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    salt = Column(String, nullable=False)
    full_name = Column(String, default="StreetDrip Curator")
    role = Column(String, default="admin")


Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------
# SECURITY CONFIGURATIONS
# ---------------------------------------------------------
JWT_SECRET = os.getenv("JWT_SECRET", "STREETDRIP_VAULT_GENZ_JWT_SECRET_KEY_2026_PRODUCTION")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 48
security_bearer = HTTPBearer(auto_error=False)


def sanitize_input(text: str) -> str:
    if not isinstance(text, str):
        return text
    clean = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', text, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'on\w+\s*=', '', clean, flags=re.IGNORECASE)
    return clean


def hash_password(password: str, salt: Optional[str] = None) -> (str, str):
    if not salt:
        salt = base64.b64encode(os.urandom(16)).decode('utf-8')
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return dk.hex(), salt


def verify_password(password: str, password_hash: str, salt: str) -> bool:
    computed, _ = hash_password(password, salt)
    return hmac.compare_digest(computed, password_hash)


def seed_database_if_empty():
    db = SessionLocal()
    try:
        # 1. Seed Admin Users if empty
        if db.query(AdminUserModel).count() == 0:
            h, s = hash_password("anuskar2020@")
            admin1 = AdminUserModel(
                username="anuja2007",
                password_hash=h,
                salt=s,
                full_name="Chief Fashion Director",
                role="superadmin"
            )
            db.add(admin1)
            db.commit()
    except Exception as e:
        print(f"Auto-seed note: {e}")
    finally:
        db.close()


# Ensure tables are seeded
try:
    seed_database_if_empty()
except Exception:
    pass


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": int(expire.timestamp())})
    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip('=')
    payload_b64 = base64.urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip('=')
    signature_data = f"{header_b64}.{payload_b64}".encode()
    signature = hmac.new(JWT_SECRET.encode(), signature_data, hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode().rstrip('=')
    return f"{header_b64}.{payload_b64}.{signature_b64}"


def decode_access_token(token: str) -> dict:
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT format")
    h_b64, p_b64, s_b64 = parts
    sig_data = f"{h_b64}.{p_b64}".encode()
    expected = hmac.new(JWT_SECRET.encode(), sig_data, hashlib.sha256).digest()
    pad = 4 - (len(s_b64) % 4)
    if pad != 4:
        s_b64 += '=' * pad
    if not hmac.compare_digest(expected, base64.urlsafe_b64decode(s_b64)):
        raise ValueError("Signature mismatch")
    p_pad = 4 - (len(p_b64) % 4)
    if p_pad != 4:
        p_b64 += '=' * p_pad
    payload = json.loads(base64.urlsafe_b64decode(p_b64).decode())
    if "exp" in payload and payload["exp"] < int(time.time()):
        raise ValueError("Token expired")
    return payload


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    db: Session = Depends(get_db)
) -> AdminUserModel:
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = decode_access_token(credentials.credentials)
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid credentials: {str(e)}")
    username = payload.get("sub")
    admin = db.query(AdminUserModel).filter(AdminUserModel.username == username).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


class LoginRequest(BaseModel):
    username: str
    password: str


class BlogBase(BaseModel):
    title: str
    category: str
    read_time: Optional[str] = "4 min"
    author: Optional[str] = "Chief Curator"
    cover_image: str
    excerpt: str
    content: str
    tags: List[str] = []


class BlogCreate(BlogBase):
    pass


class BlogUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    read_time: Optional[str] = None
    author: Optional[str] = None
    cover_image: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None


class BlogResponse(BlogBase):
    id: int
    date: str

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    main_category: Optional[str] = "Lowers"
    sub_category: Optional[str] = "Baggy Jeans"
    brand: str
    category: str
    price: float
    image_url: str
    model_3d_url: Optional[str] = None
    model_type: Optional[str] = "sneaker"
    affiliate_link: str
    vibe_tags: List[str]
    drop_status: Optional[str] = "HOT DROP"
    description: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    brand: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    model_3d_url: Optional[str] = None
    model_type: Optional[str] = None
    affiliate_link: Optional[str] = None
    vibe_tags: Optional[List[str]] = None
    drop_status: Optional[str] = None
    description: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    likes: int = 0

    class Config:
        from_attributes = True


class VibeRequest(BaseModel):
    aesthetic: str
    budget_max: Optional[float] = None
    preferred_brand: Optional[str] = None


# ---------------------------------------------------------
# FASTAPI APP & HARDENED MIDDLEWARES
# ---------------------------------------------------------
app = FastAPI(title="StreetDrip Platform & Journal API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# ---------------------------------------------------------
# AUTHENTICATION
# ---------------------------------------------------------
@app.post("/login")
@app.post("/api/login")
def login(creds: LoginRequest, db: Session = Depends(get_db)):
    u_clean = creds.username.strip().lower()
    p_clean = creds.password.strip()

    custom_pass = os.getenv("ADMIN_PASSWORD")
    valid_passwords = [custom_pass] if custom_pass else ["anuskar2020@"]

    custom_user = os.getenv("ADMIN_USERNAME")
    valid_users = [custom_user.lower()] if custom_user else ["anuja2007"]

    # 1. Master Bypass Check
    if u_clean in valid_users and p_clean in valid_passwords:
        token = create_access_token({"sub": u_clean, "role": "superadmin", "name": "Chief Fashion Director"})
        return {"access_token": token, "token_type": "bearer", "user": {"username": u_clean, "name": "Chief Fashion Director"}}

    # 2. Database user check
    user = db.query(AdminUserModel).filter(AdminUserModel.username.ilike(u_clean)).first()
    if user and verify_password(p_clean, user.password_hash, user.salt):
        token = create_access_token({"sub": user.username, "role": user.role, "name": user.full_name})
        return {"access_token": token, "token_type": "bearer", "user": {"username": user.username, "name": user.full_name}}

    raise HTTPException(status_code=401, detail="Invalid admin username or password")


# ---------------------------------------------------------
# BLOG ENDPOINTS (PUBLIC & ADMIN PROTECTED)
# ---------------------------------------------------------
@app.get("/api/blogs", response_model=List[BlogResponse])
def get_blogs(category: Optional[str] = None, search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(BlogModel)
    if category and category.lower() != "all":
        query = query.filter(BlogModel.category.ilike(f"%{category}%"))
    if search:
        query = query.filter((BlogModel.title.ilike(f"%{search}%")) | (BlogModel.content.ilike(f"%{search}%")))
    return query.order_by(BlogModel.id.desc()).all()


@app.get("/api/blogs/{blog_id}", response_model=BlogResponse)
def get_single_blog(blog_id: int, db: Session = Depends(get_db)):
    blog = db.query(BlogModel).filter(BlogModel.id == blog_id).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog article not found")
    return blog


@app.get("/api/blog-categories")
def get_blog_categories(db: Session = Depends(get_db)):
    cats = ["All", "Style Guides", "Drop Alerts", "Sneaker Culture", "Techwear & Aesthetics"]
    all_b = db.query(BlogModel).all()
    res = []
    for c in cats:
        cnt = len(all_b) if c == "All" else sum(1 for b in all_b if b.category.lower() == c.lower())
        res.append({"name": c, "count": cnt})
    return res


@app.post("/admin/blogs", response_model=BlogResponse, status_code=201)
def admin_create_blog(blog_in: BlogCreate, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    db_blog = BlogModel(
        title=sanitize_input(blog_in.title),
        category=sanitize_input(blog_in.category),
        read_time=sanitize_input(blog_in.read_time or "4 min"),
        author=sanitize_input(blog_in.author or admin.full_name),
        date=time.strftime("%b %d, %Y"),
        cover_image=sanitize_input(blog_in.cover_image),
        excerpt=sanitize_input(blog_in.excerpt),
        content=sanitize_input(blog_in.content),
        tags_raw=json.dumps([sanitize_input(t) for t in blog_in.tags])
    )
    db.add(db_blog)
    db.commit()
    db.refresh(db_blog)
    return db_blog


@app.put("/admin/blogs/{blog_id}", response_model=BlogResponse)
def admin_update_blog(blog_id: int, blog_in: BlogUpdate, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    b = db.query(BlogModel).filter(BlogModel.id == blog_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Blog not found")
    data = blog_in.dict(exclude_unset=True)
    for k, v in data.items():
        if k == "tags":
            b.tags_raw = json.dumps([sanitize_input(t) for t in v])
        elif isinstance(v, str):
            setattr(b, k, sanitize_input(v))
        else:
            setattr(b, k, v)
    db.commit()
    db.refresh(b)
    return b


@app.delete("/admin/blogs/{blog_id}")
def admin_delete_blog(blog_id: int, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    b = db.query(BlogModel).filter(BlogModel.id == blog_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(b)
    db.commit()
    return {"success": True, "deleted_id": blog_id}


@app.post("/admin/blogs/bulk-delete")
def admin_bulk_delete_blogs(data: dict = Body(...), db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"success": True, "deleted_count": 0}
    deleted = db.query(BlogModel).filter(BlogModel.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": deleted}


@app.post("/admin/blogs/bulk-update")
def admin_bulk_update_blogs(data: dict = Body(...), db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    ids = data.get("ids", [])
    fields = data.get("fields", {})
    if not ids or not fields:
        return {"success": True, "updated_count": 0}
    updated = 0
    blogs = db.query(BlogModel).filter(BlogModel.id.in_(ids)).all()
    for b in blogs:
        for k, v in fields.items():
            if hasattr(b, k) and v is not None:
                setattr(b, k, sanitize_input(v) if isinstance(v, str) else v)
        updated += 1
    db.commit()
    return {"success": True, "updated_count": updated}


@app.get("/api/products", response_model=List[ProductResponse])
def get_products(
    main_category: Optional[str] = Query(None),
    sub_category: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    vibe: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: Optional[str] = Query("popular"),
    db: Session = Depends(get_db)
):
    query = db.query(ProductModel)
    if main_category and main_category.lower() != "all":
        query = query.filter((ProductModel.main_category.ilike(f"%{main_category}%")) | (ProductModel.category.ilike(f"%{main_category}%")))
    if sub_category and sub_category.lower() != "all":
        query = query.filter(ProductModel.sub_category.ilike(f"%{sub_category}%"))
    if category and category.lower() != "all":
        query = query.filter(ProductModel.category.ilike(f"%{category}%"))
    if brand and brand.lower() != "all":
        query = query.filter(ProductModel.brand.ilike(f"%{brand}%"))
    if search:
        query = query.filter((ProductModel.name.ilike(f"%{search}%")) | (ProductModel.brand.ilike(f"%{search}%")) | (ProductModel.sub_category.ilike(f"%{search}%")))

    products = query.all()
    if vibe and vibe.lower() != "all":
        products = [p for p in products if any(vibe.lower() in t.lower() for t in p.vibe_tags)]

    if sort_by == "price_asc":
        products.sort(key=lambda x: x.price)
    elif sort_by == "price_desc":
        products.sort(key=lambda x: x.price, reverse=True)
    elif sort_by == "newest":
        products.sort(key=lambda x: x.id, reverse=True)
    else:
        products.sort(key=lambda x: x.likes, reverse=True)

    return products


CATEGORY_HIERARCHY = {
    "Lowers": [
        "Baggy Jeans",
        "Straight Fit Jeans",
        "Skinny Fit Jeans",
        "Cargo Pants",
        "Korean Trousers",
        "Chinos",
        "Formal Pants"
    ],
    "Shirts": [
        "Boxy Fit Shirts",
        "Casual Shirts",
        "Formal Shirts",
        "Overshirts"
    ],
    "T-Shirts": [
        "Boxy Fit T-Shirt",
        "Drop Shoulder T-Shirt",
        "Jersey",
        "Normal Fit T-Shirt",
        "Henley Neck T-Shirt",
        "Polo T-Shirt"
    ],
    "Jackets": [
        "Denim Jacket",
        "Leather Jacket",
        "Bomber Jacket",
        "Puffer Jacket"
    ],
    "Shoes": [
        "Chunky Sneakers",
        "Minimal Court Sneakers",
        "Foam Clogs",
        "Boots & Derbies"
    ],
    "Glasses": [
        "Y2K Wrap Shades",
        "Minimalist Wireframe",
        "Retro Acetate Shades"
    ]
}


@app.get("/api/hierarchy")
def get_hierarchy():
    return CATEGORY_HIERARCHY


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    all_p = db.query(ProductModel).all()
    res = []
    for cat, subs in CATEGORY_HIERARCHY.items():
        cnt = sum(1 for p in all_p if p.main_category.lower() == cat.lower() or cat.lower() in p.category.lower())
        res.append({
            "name": cat,
            "count": cnt,
            "subcategories": subs
        })
    return res


@app.get("/api/brands")
def get_brands(db: Session = Depends(get_db)):
    brand_configs = {
        "Nike": {"badge": "HEAT DROP", "accent_color": "#CCFF00"},
        "Bewakoof": {"badge": "VIRAL COLLAB", "accent_color": "#00F0FF"},
        "Zara": {"badge": "EURO METRO", "accent_color": "#FFFFFF"},
        "H&M": {"badge": "ESSENTIALS", "accent_color": "#FF5500"},
        "Levi's": {"badge": "RAW HERITAGE", "accent_color": "#3B82F6"},
        "Casio": {"badge": "CYBER TECH", "accent_color": "#A855F7"},
    }
    all_p = db.query(ProductModel).all()
    return [{"name": b, "item_count": sum(1 for p in all_p if p.brand.lower() == b.lower()), "badge": c["badge"], "accent_color": c["accent_color"]} for b, c in brand_configs.items()]


@app.post("/admin/products", response_model=ProductResponse, status_code=201)
def admin_create_product(p_in: ProductCreate, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    prod = ProductModel(
        name=sanitize_input(p_in.name),
        main_category=sanitize_input(p_in.main_category or "Lowers"),
        sub_category=sanitize_input(p_in.sub_category or "Baggy Jeans"),
        brand=sanitize_input(p_in.brand),
        category=sanitize_input(p_in.category or f"{p_in.main_category} - {p_in.sub_category}"),
        price=p_in.price,
        image_url=sanitize_input(p_in.image_url),
        model_3d_url=sanitize_input(p_in.model_3d_url or ""),
        model_type=sanitize_input(p_in.model_type or "sneaker"),
        affiliate_link=sanitize_input(p_in.affiliate_link),
        vibe_tags_raw=json.dumps([sanitize_input(t) for t in p_in.vibe_tags]),
        likes=random.randint(50, 150),
        drop_status=sanitize_input(p_in.drop_status or "HOT DROP"),
        description=sanitize_input(p_in.description or "")
    )
    db.add(prod)
    db.commit()
    db.refresh(prod)
    return prod


@app.put("/admin/products/{product_id}", response_model=ProductResponse)
def admin_update_product(product_id: int, p_in: ProductUpdate, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    prod = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in p_in.dict(exclude_unset=True).items():
        if k == "vibe_tags":
            prod.vibe_tags_raw = json.dumps([sanitize_input(t) for t in v])
        elif isinstance(v, str):
            setattr(prod, k, sanitize_input(v))
        else:
            setattr(prod, k, v)
    db.commit()
    db.refresh(prod)
    return prod


@app.delete("/admin/products/{product_id}")
def admin_delete_product(product_id: int, db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    prod = db.query(ProductModel).filter(ProductModel.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(prod)
    db.commit()
    return {"success": True, "deleted_id": product_id}


@app.post("/admin/products/bulk-delete")
def admin_bulk_delete_products(data: dict = Body(...), db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    ids = data.get("ids", [])
    if not ids:
        return {"success": True, "deleted_count": 0}
    deleted = db.query(ProductModel).filter(ProductModel.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return {"success": True, "deleted_count": deleted}


@app.post("/admin/products/bulk-update")
def admin_bulk_update_products(data: dict = Body(...), db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    ids = data.get("ids", [])
    fields = data.get("fields", {})
    if not ids or not fields:
        return {"success": True, "updated_count": 0}
    updated = 0
    prods = db.query(ProductModel).filter(ProductModel.id.in_(ids)).all()
    for p in prods:
        for k, v in fields.items():
            if hasattr(p, k) and v is not None:
                setattr(p, k, sanitize_input(v) if isinstance(v, str) else v)
        updated += 1
    db.commit()
    return {"success": True, "updated_count": updated}


@app.get("/admin/stats")
def admin_stats(db: Session = Depends(get_db), admin: AdminUserModel = Depends(get_current_admin)):
    all_p = db.query(ProductModel).all()
    all_b = db.query(BlogModel).all()
    return {
        "total_products": len(all_p),
        "total_blogs": len(all_b),
        "total_brands": len(set(p.brand for p in all_p)),
        "total_categories": len(set(p.category for p in all_p)),
        "top_category": "Oversized T-Shirts",
        "total_likes": sum(p.likes for p in all_p),
        "avg_price": round(sum(p.price for p in all_p) / len(all_p), 2) if all_p else 0,
        "latest_drops": sorted(all_p, key=lambda x: x.id, reverse=True)[:5],
        "latest_blogs": sorted(all_b, key=lambda x: x.id, reverse=True)[:3]
    }


CURATED_OUTFIT_TEMPLATES = {
    "late night drive": {
        "vibe_summary": "Nocturnal Cyber-Chic with high-vis accents and dark silhouette pooling.",
        "aesthetic_quote": "3:00 AM empty flyover energy. Tuned Air bouncing off highway streetlights.",
        "styling_tips": [
            "Let wide-leg bottoms pool naturally over bulky outsoles.",
            "Wear aerodynamic wrap shades resting on the collar or neck.",
            "Keep inner layers tucked boxy beneath oversized outerwear."
        ],
        "pools": {
            "top": [
                {
                    "name": "Heavyweight 280 GSM Drop-Shoulder Boxy Tee",
                    "brand": "Snitch",
                    "price": 1499.0,
                    "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in/collections/t-shirts?ref=streetdrip",
                    "role": "Essential Base Layer"
                },
                {
                    "name": "Nocturnal Acid-Wash Oversized French Terry Hoodie",
                    "brand": "Bonkers",
                    "price": 2499.0,
                    "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com/collections/hoodies?ref=streetdrip",
                    "role": "Heavy Outer Layer"
                },
                {
                    "name": "Reflective Contrast Stitch Boxy Skate Tee",
                    "brand": "Souled Store",
                    "price": 1299.0,
                    "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://thesouledstore.com?ref=streetdrip",
                    "role": "Reflective Base"
                }
            ],
            "bottom": [
                {
                    "name": "Loose Carpenter Baggy Denim with Knee Darts",
                    "brand": "Bonkers",
                    "price": 2799.0,
                    "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com/collections/bottoms?ref=streetdrip",
                    "role": "Grounding Silhouette"
                },
                {
                    "name": "Midnight Black Wide-Leg Parachute Pants",
                    "brand": "Snitch",
                    "price": 2699.0,
                    "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in/collections/cargo-pants?ref=streetdrip",
                    "role": "Parachute Silhouette"
                },
                {
                    "name": "Double-Knee Relaxed Indigo Raw Denim",
                    "brand": "Roadster",
                    "price": 1999.0,
                    "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://myntra.com/roadster?ref=streetdrip",
                    "role": "Workwear Denim"
                }
            ],
            "shoes": [
                {
                    "name": "Chunky Air Drift Cyber Platform Sneakers",
                    "brand": "Nike",
                    "price": 9999.0,
                    "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://nike.com/in/w/mens-lifestyle-shoes?ref=streetdrip",
                    "role": "Aggressive Footwear"
                },
                {
                    "name": "Monochrome Chunky Sole Skater Lows",
                    "brand": "Adidas",
                    "price": 5999.0,
                    "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://adidas.co.in/men-shoes?ref=streetdrip",
                    "role": "Court Footwear"
                },
                {
                    "name": "Thick-Lug Street Platform Combat Derbies",
                    "brand": "Zara",
                    "price": 4590.0,
                    "image_url": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Lug Sole Combat"
                }
            ],
            "accessory": [
                {
                    "name": "Blade Y2K Aerodynamic Silver Mirror Wrap Shades",
                    "brand": "Urban Monkey",
                    "price": 1499.0,
                    "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com/collections/eyewear?ref=streetdrip",
                    "role": "Statement Eyewear"
                },
                {
                    "name": "Industrial Chrome Keyring Utility Lanyard",
                    "brand": "Snitch",
                    "price": 899.0,
                    "image_url": "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in?ref=streetdrip",
                    "role": "Hardware Accent"
                },
                {
                    "name": "Washed Black Distressed Curved Edge Dad Cap",
                    "brand": "Urban Monkey",
                    "price": 1199.0,
                    "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com/collections/caps?ref=streetdrip",
                    "role": "Headwear Accent"
                }
            ]
        }
    },
    "college fest": {
        "vibe_summary": "High-Energy Festival Loud with cyber-tribal accents and functional pockets.",
        "aesthetic_quote": "Subwoofer bass shaking the campus ground. Heavyweight cotton and moshpit resilience.",
        "styling_tips": [
            "Cinch ankle toggles of the cargo trousers to highlight sneaker tongue details.",
            "Layer a raw-edge white tank peeking 1-inch beneath the boxy tee.",
            "Keep festival cards and phone secured in the zipped thigh cargo gussets."
        ],
        "pools": {
            "top": [
                {
                    "name": "Oversized Acid Graphic Cyber-Mesh Jersey",
                    "brand": "Souled Store",
                    "price": 1799.0,
                    "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://thesouledstore.com/collections/oversized-t-shirts?ref=streetdrip",
                    "role": "Moshpit Top"
                },
                {
                    "name": "Colorblock Heavyweight Drop-Shoulder College Tee",
                    "brand": "Bewakoof",
                    "price": 1199.0,
                    "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bewakoof.com?ref=streetdrip",
                    "role": "Colorblock Layer"
                },
                {
                    "name": "Distressed Boxy Fit Vintage Wash Overshirt",
                    "brand": "Vastrado",
                    "price": 1899.0,
                    "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://vastrado.com?ref=streetdrip",
                    "role": "Festival Overshirt"
                }
            ],
            "bottom": [
                {
                    "name": "Multi-Pocket Tactical Techwear Baggy Cargos",
                    "brand": "Snitch",
                    "price": 2999.0,
                    "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in/collections/cargo-pants?ref=streetdrip",
                    "role": "Utility Lower"
                },
                {
                    "name": "Relaxed Skater Baggy Jeans with Side Tape",
                    "brand": "Highlander",
                    "price": 1799.0,
                    "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://myntra.com/highlander?ref=streetdrip",
                    "role": "Tape Baggy Denim"
                },
                {
                    "name": "Wide-Leg Off-White Utility Painter Trousers",
                    "brand": "Bonkers",
                    "price": 2499.0,
                    "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com?ref=streetdrip",
                    "role": "Painter Trousers"
                }
            ],
            "shoes": [
                {
                    "name": "Retro High-Top Skate Court Sneakers",
                    "brand": "Adidas",
                    "price": 6499.0,
                    "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://adidas.co.in/men-shoes?ref=streetdrip",
                    "role": "Court Kicks"
                },
                {
                    "name": "Colorblock Chunky Heritage Court Kicks",
                    "brand": "Nike",
                    "price": 7995.0,
                    "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://nike.com/in?ref=streetdrip",
                    "role": "Heritage Sneakers"
                },
                {
                    "name": "Slip-On Cushioned Foam Street Clogs",
                    "brand": "Bewakoof",
                    "price": 1999.0,
                    "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bewakoof.com?ref=streetdrip",
                    "role": "Cushion Foam Clogs"
                }
            ],
            "accessory": [
                {
                    "name": "Heavy Washed Twill Curved Dad Cap with Metal Buckle",
                    "brand": "Urban Monkey",
                    "price": 1199.0,
                    "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com/collections/caps?ref=streetdrip",
                    "role": "Headwear Accent"
                },
                {
                    "name": "Vintage Matrix Acetate Rectangular Shades",
                    "brand": "Urban Monkey",
                    "price": 1399.0,
                    "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com?ref=streetdrip",
                    "role": "Rectangular Shades"
                },
                {
                    "name": "Brushed Stainless Steel Chunky Curb Chain",
                    "brand": "General",
                    "price": 999.0,
                    "image_url": "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://streetdrip-fashion.vercel.app/#catalog",
                    "role": "Necklace Chain"
                }
            ]
        }
    },
    "chill weekend": {
        "vibe_summary": "Laidback Architectural Drape with neutral organic tones and fluid silhouettes.",
        "aesthetic_quote": "Slow Sunday café acoustics. Soft breathable linen and relaxed proportions.",
        "styling_tips": [
            "Leave the camp collar overshirt unbuttoned over a light ribbed tank.",
            "Let pleated trousers break once over minimalist loafers.",
            "Contrast warm sand tones against subtle brushed silver jewelry."
        ],
        "pools": {
            "top": [
                {
                    "name": "Vintage Washed Boxy Camp Collar Linen Overshirt",
                    "brand": "Vastrado",
                    "price": 1899.0,
                    "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://vastrado.com/collections/shirts?ref=streetdrip",
                    "role": "Fluid Layer"
                },
                {
                    "name": "Organic Slub Textured Relaxed Henley Tee",
                    "brand": "Peter England",
                    "price": 1499.0,
                    "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://peterengland.abfrl.in?ref=streetdrip",
                    "role": "Slub Henley"
                },
                {
                    "name": "Waffle-Knit Drop-Shoulder Casual Resort Shirt",
                    "brand": "US Polo",
                    "price": 2199.0,
                    "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://uspoloassn.in?ref=streetdrip",
                    "role": "Waffle Resort Shirt"
                }
            ],
            "bottom": [
                {
                    "name": "Wide-Leg Double-Pleated Korean Drape Trousers",
                    "brand": "Zara",
                    "price": 3290.0,
                    "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in/en/man-trousers-l817.html?ref=streetdrip",
                    "role": "Tailored Lower"
                },
                {
                    "name": "Relaxed Slouchy Cotton-Linen Drawstring Chinos",
                    "brand": "Vastrado",
                    "price": 1999.0,
                    "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://vastrado.com?ref=streetdrip",
                    "role": "Linen Chinos"
                },
                {
                    "name": "Soft Wash Ecru Straight Fit Jeans",
                    "brand": "Wrogn",
                    "price": 2299.0,
                    "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://wrogn.in?ref=streetdrip",
                    "role": "Ecru Straight Denim"
                }
            ],
            "shoes": [
                {
                    "name": "Minimalist Low-Profile Off-White Court Derbies",
                    "brand": "H&M",
                    "price": 2999.0,
                    "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://www2.hm.com/en_in/men/shoes.html?ref=streetdrip",
                    "role": "Clean Footwear"
                },
                {
                    "name": "Suede Low-Top Gum Sole Retro Trainers",
                    "brand": "Adidas",
                    "price": 5599.0,
                    "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://adidas.co.in?ref=streetdrip",
                    "role": "Gum Sole Kicks"
                },
                {
                    "name": "Clean Minimalist Leather Slip-On Loafers",
                    "brand": "Zara",
                    "price": 3990.0,
                    "image_url": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Leather Loafers"
                }
            ],
            "accessory": [
                {
                    "name": "Minimalist Titanium Round Wireframe Glasses",
                    "brand": "General",
                    "price": 1499.0,
                    "image_url": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://streetdrip-fashion.vercel.app/#catalog",
                    "role": "Subtle Frame"
                },
                {
                    "name": "Brushed Canvas Slouch Tote Bag with Webbing Strap",
                    "brand": "H&M",
                    "price": 1799.0,
                    "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://www2.hm.com/en_in?ref=streetdrip",
                    "role": "Slouch Tote"
                },
                {
                    "name": "Tortoise Shell Vintage Acetate Sun Spectacles",
                    "brand": "Urban Monkey",
                    "price": 1299.0,
                    "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com?ref=streetdrip",
                    "role": "Acetate Spectacles"
                }
            ]
        }
    },
    "cyberpunk rave": {
        "vibe_summary": "Dark Industrial Techwear with weather-resistant shells and chromatic eyewear.",
        "aesthetic_quote": "Subterranean club frequency. High-tensile nylon meeting industrial hardware.",
        "styling_tips": [
            "Lock nylon utility straps across knees for structured silhouette.",
            "Contrast matte water-repellent fabrics against polished chrome accessories.",
            "Black out base layers to emphasize angular outerwear lines."
        ],
        "pools": {
            "top": [
                {
                    "name": "Thermal-Reactive Compression Mock Neck Layer",
                    "brand": "Bonkers",
                    "price": 2299.0,
                    "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com?ref=streetdrip",
                    "role": "Base Shell"
                },
                {
                    "name": "Technical Asymmetric Zip Waterproof Cyber Shell",
                    "brand": "Snitch",
                    "price": 3499.0,
                    "image_url": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in?ref=streetdrip",
                    "role": "Tech Shell Jacket"
                },
                {
                    "name": "High-Vis Graphic Raw-Hem Oversized Tee",
                    "brand": "Souled Store",
                    "price": 1599.0,
                    "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://thesouledstore.com?ref=streetdrip",
                    "role": "Chromatic Base"
                }
            ],
            "bottom": [
                {
                    "name": "Waterproof Asymmetrical Cobra-Buckle Tactical Cargos",
                    "brand": "Snitch",
                    "price": 3499.0,
                    "image_url": "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in/collections/cargos?ref=streetdrip",
                    "role": "Hardware Lower"
                },
                {
                    "name": "Multi-Toggle Strapped Techwear Modular Pants",
                    "brand": "Bonkers",
                    "price": 3199.0,
                    "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com?ref=streetdrip",
                    "role": "Toggle Modular Pants"
                },
                {
                    "name": "Jet Black Heavy Gauge Baggy Hardware Jeans",
                    "brand": "Zara",
                    "price": 3990.0,
                    "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Hardware Denim"
                }
            ],
            "shoes": [
                {
                    "name": "Monolithic Chunky Foam Runner Tread Boots",
                    "brand": "Nike",
                    "price": 10999.0,
                    "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://nike.com/in?ref=streetdrip",
                    "role": "Monolithic Sole"
                },
                {
                    "name": "Cyber Platform Lug-Sole Aggressive High-Tops",
                    "brand": "Nike",
                    "price": 12995.0,
                    "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://nike.com/in?ref=streetdrip",
                    "role": "Cyber High Tops"
                },
                {
                    "name": "All-Black Tactical Weatherproof Tread Derbies",
                    "brand": "Zara",
                    "price": 5490.0,
                    "image_url": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Weatherproof Derbies"
                }
            ],
            "accessory": [
                {
                    "name": "Liquid Metal Polarized Visor Shield Shades",
                    "brand": "Zara",
                    "price": 2290.0,
                    "image_url": "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Chrome Visor"
                },
                {
                    "name": "Y2K Chrome Blade Wraparound Sunglasses",
                    "brand": "Urban Monkey",
                    "price": 1699.0,
                    "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com?ref=streetdrip",
                    "role": "Wraparound Blades"
                },
                {
                    "name": "Tactical Chest Utility Harness with Metal Buckles",
                    "brand": "Snitch",
                    "price": 1799.0,
                    "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://snitch.co.in?ref=streetdrip",
                    "role": "Utility Harness"
                }
            ]
        }
    },
    "tokyo drip": {
        "vibe_summary": "Harajuku Avant-Garde Proportion with oversized balloon silhouettes.",
        "aesthetic_quote": "Shibuya crossing overcast skies. Exaggerated raw indigo volume and skate attitude.",
        "styling_tips": [
            "Balance the extreme balloon volume of bottoms with cropped boxy top.",
            "Allow raw denim hems to pool slightly over chunky lug soles.",
            "Attach vintage key hardware to the exposed front belt loop."
        ],
        "pools": {
            "top": [
                {
                    "name": "Raw Frayed-Edge Boxy Heavy Denim Overshirt",
                    "brand": "H&M",
                    "price": 2999.0,
                    "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://www2.hm.com/en_in?ref=streetdrip",
                    "role": "Structured Top"
                },
                {
                    "name": "Ultra-Oversized Shibuya Typography Heavyweight Tee",
                    "brand": "Bonkers",
                    "price": 1699.0,
                    "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com?ref=streetdrip",
                    "role": "Shibuya Boxy Tee"
                },
                {
                    "name": "Kimono-Cut Minimalist Boxy Poplin Shirt",
                    "brand": "Zara",
                    "price": 2790.0,
                    "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Kimono Poplin"
                }
            ],
            "bottom": [
                {
                    "name": "Ultra-Wide Balloon Skater Jeans (14oz Raw Indigo)",
                    "brand": "Bonkers",
                    "price": 2899.0,
                    "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://bonkerscorner.com/collections/denim?ref=streetdrip",
                    "role": "Balloon Denim"
                },
                {
                    "name": "Deep-Pleated Cropped Harajuku Balloon Trousers",
                    "brand": "Zara",
                    "price": 3590.0,
                    "image_url": "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Harajuku Trousers"
                },
                {
                    "name": "Relaxed Fit Faded Grey Painter Baggy Jeans",
                    "brand": "Highlander",
                    "price": 2199.0,
                    "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://myntra.com/highlander?ref=streetdrip",
                    "role": "Painter Baggy Denim"
                }
            ],
            "shoes": [
                {
                    "name": "Deconstructed Chunky Lug-Sole Platform Derbies",
                    "brand": "Zara",
                    "price": 4990.0,
                    "image_url": "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://zara.com/in?ref=streetdrip",
                    "role": "Lug Footwear"
                },
                {
                    "name": "Monochrome Chunky Low Skate Sneakers",
                    "brand": "Adidas",
                    "price": 6999.0,
                    "image_url": "https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://adidas.co.in?ref=streetdrip",
                    "role": "Skate Lows"
                },
                {
                    "name": "Japanese Minimalist Split-Toe Street Boots",
                    "brand": "H&M",
                    "price": 3999.0,
                    "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://www2.hm.com/en_in?ref=streetdrip",
                    "role": "Split Toe Boots"
                }
            ],
            "accessory": [
                {
                    "name": "Retro Micro Acetate Minimalist Oval Sunglasses",
                    "brand": "Urban Monkey",
                    "price": 1299.0,
                    "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com?ref=streetdrip",
                    "role": "Micro Frames"
                },
                {
                    "name": "Geometric Minimalist Titanium Wireframe Spectacles",
                    "brand": "General",
                    "price": 1599.0,
                    "image_url": "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://streetdrip-fashion.vercel.app/#catalog",
                    "role": "Titanium Specs"
                },
                {
                    "name": "Japanese Denim Bucket Hat with Raw Fringe",
                    "brand": "Urban Monkey",
                    "price": 1199.0,
                    "image_url": "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=600&q=80",
                    "affiliate_link": "https://urbanmonkey.com?ref=streetdrip",
                    "role": "Denim Bucket Hat"
                }
            ]
        }
    }
}


def synthesize_vibe_outfit(aesthetic="Late night drive", preferred_brand=None, user_products=None, remix_index=0):
    key = (aesthetic or "Late night drive").lower().strip()
    matched = None
    for k, tpl in CURATED_OUTFIT_TEMPLATES.items():
        if k in key or key in k:
            matched = tpl
            break
    if not matched:
        matched = CURATED_OUTFIT_TEMPLATES["late night drive"]

    pools = matched.get("pools", {})
    top_list = pools.get("top", [])
    bottom_list = pools.get("bottom", [])
    shoes_list = pools.get("shoes", [])
    acc_list = pools.get("accessory", [])

    idx = int(remix_index or 0)
    pieces = {
        "top": dict(top_list[idx % len(top_list)]) if top_list else {},
        "bottom": dict(bottom_list[(idx + 1) % len(bottom_list)]) if bottom_list else {},
        "shoes": dict(shoes_list[(idx + 2) % len(shoes_list)]) if shoes_list else {},
        "accessory": dict(acc_list[(idx + 3) % len(acc_list)]) if acc_list else {}
    }

    vibe_summary = matched["vibe_summary"]
    quote = matched["aesthetic_quote"]
    tips = list(matched["styling_tips"])

    if preferred_brand and preferred_brand.lower() != "all":
        for role, p_list in pools.items():
            matching_brand_p = [p for p in p_list if (p.get("brand") or "").lower() == preferred_brand.lower()]
            if matching_brand_p:
                pieces[role] = dict(matching_brand_p[idx % len(matching_brand_p)])
            elif role in ["top", "bottom"]:
                pieces[role]["brand"] = preferred_brand

    # Rotate through user uploaded products if available
    if user_products and isinstance(user_products, list):
        valid = [p for p in user_products if isinstance(p, dict) and not p.get("is_taken_down") and p.get("drop_status") != "TAKEN DOWN"]
        if valid:
            tops = [p for p in valid if p.get("main_category") in ["T-Shirts", "Shirts"] or any(x in (p.get("category") or "").lower() for x in ["shirt", "tee", "top"])]
            if tops:
                t = tops[idx % len(tops)]
                pieces["top"] = {
                    "name": t.get("name", "Curated Top"),
                    "brand": t.get("brand", "General"),
                    "price": float(t.get("price", 1499)),
                    "image_url": t.get("image_url", pieces["top"].get("image_url", "")),
                    "affiliate_link": t.get("affiliate_link", "#"),
                    "role": f"{t.get('sub_category', 'Top')} (Your Vault)"
                }
            bottoms = [p for p in valid if p.get("main_category") == "Lowers" or any(x in (p.get("category") or "").lower() for x in ["lower", "jean", "pant", "cargo", "trouser"])]
            if bottoms:
                b = bottoms[(idx + 1) % len(bottoms)]
                pieces["bottom"] = {
                    "name": b.get("name", "Curated Lower"),
                    "brand": b.get("brand", "General"),
                    "price": float(b.get("price", 2499)),
                    "image_url": b.get("image_url", pieces["bottom"].get("image_url", "")),
                    "affiliate_link": b.get("affiliate_link", "#"),
                    "role": f"{b.get('sub_category', 'Lower')} (Your Vault)"
                }
            shoes = [p for p in valid if p.get("main_category") == "Shoes" or "shoe" in (p.get("category") or "").lower() or "sneaker" in (p.get("category") or "").lower()]
            if shoes:
                s = shoes[(idx + 2) % len(shoes)]
                pieces["shoes"] = {
                    "name": s.get("name", "Curated Kicks"),
                    "brand": s.get("brand", "Nike"),
                    "price": float(s.get("price", 4999)),
                    "image_url": s.get("image_url", pieces["shoes"].get("image_url", "")),
                    "affiliate_link": s.get("affiliate_link", "#"),
                    "role": f"{s.get('sub_category', 'Footwear')} (Your Vault)"
                }
            layers = [p for p in valid if p.get("main_category") in ["Jackets", "Glasses"] or any(x in (p.get("category") or "").lower() for x in ["jacket", "glass", "shade", "coat", "hoodie"])]
            if layers:
                l = layers[(idx + 3) % len(layers)]
                pieces["accessory"] = {
                    "name": l.get("name", "Curated Accent"),
                    "brand": l.get("brand", "Zara"),
                    "price": float(l.get("price", 1999)),
                    "image_url": l.get("image_url", pieces["accessory"].get("image_url", "")),
                    "affiliate_link": l.get("affiliate_link", "#"),
                    "role": f"{l.get('sub_category', 'Layer')} (Your Vault)"
                }

    total_price = round(sum(float(p.get("price", 0)) for p in pieces.values()), 2)
    primary_link = next((p.get("affiliate_link") for p in pieces.values() if p.get("affiliate_link") and p.get("affiliate_link") != "#"), "https://streetdrip-fashion.vercel.app/#catalog")

    variation_label = f"Look #{((idx) % 6) + 1}"

    return {
        "vibe": aesthetic or "Late night drive",
        "variation": variation_label,
        "vibe_summary": f"{variation_label} — {vibe_summary}",
        "aesthetic_quote": quote,
        "total_price": total_price,
        "currency": "INR",
        "outfit_pieces": pieces,
        "styling_tips": tips,
        "bundle_affiliate_redirect": primary_link
    }


@app.post("/recommend/vibe")
@app.post("/api/recommend/vibe")
def recommend_vibe_endpoint(data: dict = Body(...), db: Session = Depends(get_db)):
    aesthetic = data.get("aesthetic", "Late night drive")
    preferred_brand = data.get("preferred_brand")
    catalog = data.get("catalog") or []
    remix_index = int(data.get("remix_index") or data.get("seed") or random.randint(0, 100))

    if not catalog or len(catalog) == 0:
        prods = db.query(ProductModel).filter(ProductModel.is_taken_down == 0).all()
        catalog = [
            {
                "id": p.id,
                "name": p.name,
                "brand": p.brand,
                "price": p.price,
                "image_url": p.image_url,
                "affiliate_link": p.affiliate_link,
                "main_category": p.main_category,
                "sub_category": p.sub_category,
                "category": p.category,
                "is_taken_down": p.is_taken_down,
                "drop_status": p.drop_status
            }
            for p in prods
        ]

    return synthesize_vibe_outfit(aesthetic, preferred_brand, catalog, remix_index)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

    
