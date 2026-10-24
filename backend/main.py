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

from fastapi import FastAPI, Query, HTTPException, Depends, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from sqlalchemy import create_engine, Column, Integer, String, Float, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# ---------------------------------------------------------
# DATABASE CONFIGURATION
# ---------------------------------------------------------
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

        # 2. Seed Products if empty
        if db.query(ProductModel).count() == 0:
            json_file = os.path.join(os.path.dirname(__file__), "streetwear_db.json")
            if os.path.exists(json_file):
                with open(json_file, "r") as f:
                    products_data = json.load(f)
                for p in products_data:
                    prod = ProductModel(
                        id=p["id"],
                        name=p["name"],
                        main_category=p.get("main_category", "Lowers"),
                        sub_category=p.get("sub_category", "Baggy Jeans"),
                        brand=p["brand"],
                        category=p.get("category", f"{p.get('main_category', 'Lowers')} - {p.get('sub_category', 'Baggy Jeans')}"),
                        price=p["price"],
                        image_url=p["image_url"],
                        model_3d_url=p.get("model_3d_url"),
                        model_type=p.get("model_type", "sneaker"),
                        affiliate_link=p["affiliate_link"],
                        vibe_tags_raw=json.dumps(p.get("vibe_tags", [])),
                        likes=p.get("likes", 100),
                        drop_status=p.get("drop_status", "HOT DROP"),
                        description=p.get("description", "")
                    )
                    db.add(prod)
                db.commit()

        # 3. Seed Blogs if empty
        if db.query(BlogModel).count() == 0:
            blog_file = os.path.join(os.path.dirname(__file__), "blogs_db.json")
            if os.path.exists(blog_file):
                with open(blog_file, "r") as f:
                    blogs_data = json.load(f)
                for b in blogs_data:
                    blg = BlogModel(
                        id=b["id"],
                        title=b["title"],
                        category=b.get("category", "Lowers"),
                        read_time=b.get("read_time", "4 min"),
                        author=b.get("author", "Drip Editorial"),
                        date=b.get("date", "Oct 24, 2026"),
                        cover_image=b.get("cover_image", ""),
                        excerpt=b.get("excerpt", ""),
                        content=b.get("content", ""),
                        tags_raw=json.dumps(b.get("tags", []))
                    )
                    db.add(blg)
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


# ---------------------------------------------------------
# PYDANTIC SCHEMAS
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# PRODUCT ENDPOINTS (PUBLIC & ADMIN PROTECTED)
# ---------------------------------------------------------
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
