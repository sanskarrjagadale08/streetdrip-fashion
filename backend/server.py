"""
StreetDrip Minimalist Fashion Platform & Journal Server
Zero-Dependency Python 3 Server with Granular Fashion Hierarchy:
Categories: Lowers, Shirts, T-Shirts, Jackets, Shoes, Glasses
Subcategories:
- Lowers: Baggy Jeans, Straight Jeans, Skinny Jeans, Cargos, Korean Trousers, Chinos, Formal Pants
- Shirts: Casual Shirts, Formal Shirts, Boxy Fit Shirts, Overshirts
- T-Shirts: Boxy T-Shirt, Drop Shoulder T-Shirt, Jersey, Normal Fit, Henley Neck, Polo T-Shirt
- Jackets: Denim Jacket, Leather Jacket, Bomber Jacket, Puffer Jacket
- Shoes: Chunky Sneakers, Minimal Sneakers, Foam Clogs, Boots
- Glasses: Y2K Wrap Shades, Wireframe Glasses, Retro Acetate Shades
"""

import http.server
import socketserver
import json
import urllib.parse
import os
import time
import base64
import hmac
import hashlib
import random
import re
import sqlite3

PORT = int(os.getenv("PORT", 8000))
DATA_FILE = os.path.join(os.path.dirname(__file__), "streetwear_db.json")
BLOG_FILE = os.path.join(os.path.dirname(__file__), "blogs_db.json")
SQLITE_FILE = os.path.join(os.path.dirname(__file__), "streetwear.db")

JWT_SECRET = os.getenv("JWT_SECRET", "STREETDRIP_SECURE_VAULT_PROD_JWT_KEY_2026_CHANGE_IN_PROD")
ADMIN_USER = os.getenv("ADMIN_USERNAME", "anuja2007")
ADMIN_PASS = os.getenv("ADMIN_PASSWORD", "anuskar2020@")


def sanitize_input(text: str) -> str:
    if not isinstance(text, str):
        return text
    clean = re.sub(r'<\s*script[^>]*>.*?<\s*/\s*script\s*>', '', text, flags=re.IGNORECASE | re.DOTALL)
    clean = re.sub(r'javascript:', '', clean, flags=re.IGNORECASE)
    clean = re.sub(r'on\w+\s*=', '', clean, flags=re.IGNORECASE)
    return clean


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

INITIAL_PRODUCTS = []
INITIAL_BLOGS = []


def init_sqlite():
    try:
        conn = sqlite3.connect(SQLITE_FILE)
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                main_category TEXT,
                sub_category TEXT,
                brand TEXT,
                category TEXT,
                price REAL,
                image_url TEXT,
                model_3d_url TEXT,
                model_type TEXT,
                affiliate_link TEXT,
                vibe_tags_raw TEXT,
                likes INTEGER,
                drop_status TEXT,
                description TEXT
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS blogs (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT,
                read_time TEXT,
                author TEXT,
                date TEXT,
                cover_image TEXT,
                excerpt TEXT,
                content TEXT,
                tags_raw TEXT
            )
        ''')
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"SQLite init error: {e}")


init_sqlite()


def load_db():
    data = []
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                loaded = json.load(f)
                if isinstance(loaded, list):
                    data = loaded
        except Exception:
            pass

    # Redundancy fallback: if JSON is empty, query SQLite
    if not data and os.path.exists(SQLITE_FILE):
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM products ORDER BY id DESC")
            rows = cursor.fetchall()
            for r in rows:
                tags = []
                try:
                    tags = json.loads(r["vibe_tags_raw"])
                except Exception:
                    tags = [t.strip() for t in (r["vibe_tags_raw"] or "").split(",") if t.strip()]
                data.append({
                    "id": r["id"],
                    "name": r["name"],
                    "main_category": r["main_category"] or "Lowers",
                    "sub_category": r["sub_category"] or "Baggy Jeans",
                    "brand": r["brand"] or "General",
                    "category": r["category"] or "",
                    "price": float(r["price"] or 0),
                    "image_url": r["image_url"] or "",
                    "model_3d_url": r["model_3d_url"] or "",
                    "model_type": r["model_type"] or "hoodie",
                    "affiliate_link": r["affiliate_link"] or "",
                    "vibe_tags": tags,
                    "likes": r["likes"] or 100,
                    "drop_status": r["drop_status"] or "HOT DROP",
                    "description": r["description"] or ""
                })
            conn.close()
            if data:
                save_db(data, sync_sqlite=False)
        except Exception as e:
            print(f"SQLite fallback load error: {e}")

    return data


def save_db(data, sync_sqlite=True):
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving JSON DB: {e}")

    if sync_sqlite and os.path.exists(SQLITE_FILE):
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM products")
            for p in data:
                v_tags = json.dumps(p.get("vibe_tags", [])) if isinstance(p.get("vibe_tags"), list) else str(p.get("vibe_tags", ""))
                cursor.execute('''
                    INSERT OR REPLACE INTO products (
                        id, name, main_category, sub_category, brand, category,
                        price, image_url, model_3d_url, model_type, affiliate_link,
                        vibe_tags_raw, likes, drop_status, description
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    p.get("id"),
                    p.get("name", "Untitled Piece"),
                    p.get("main_category", "Lowers"),
                    p.get("sub_category", "Baggy Jeans"),
                    p.get("brand", "General"),
                    p.get("category", ""),
                    float(p.get("price", 0)),
                    p.get("image_url", ""),
                    p.get("model_3d_url", ""),
                    p.get("model_type", "sneaker"),
                    p.get("affiliate_link", ""),
                    v_tags,
                    int(p.get("likes", 100)),
                    p.get("drop_status", "HOT DROP"),
                    p.get("description", "")
                ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error saving SQLite: {e}")


def load_blogs():
    blogs = []
    if os.path.exists(BLOG_FILE):
        try:
            with open(BLOG_FILE, 'r') as f:
                loaded = json.load(f)
                if isinstance(loaded, list):
                    blogs = loaded
        except Exception:
            pass

    # Redundancy fallback: query SQLite if JSON is empty
    if not blogs and os.path.exists(SQLITE_FILE):
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM blogs ORDER BY id DESC")
            rows = cursor.fetchall()
            for r in rows:
                tags = []
                try:
                    tags = json.loads(r["tags_raw"])
                except Exception:
                    tags = [t.strip() for t in (r["tags_raw"] or "").split(",") if t.strip()]
                blogs.append({
                    "id": r["id"],
                    "title": r["title"],
                    "category": r["category"] or "Lowers",
                    "read_time": r["read_time"] or "4 min",
                    "author": r["author"] or "Street Curator",
                    "date": r["date"] or "",
                    "cover_image": r["cover_image"] or "",
                    "excerpt": r["excerpt"] or "",
                    "content": r["content"] or "",
                    "tags": tags
                })
            conn.close()
            if blogs:
                save_blogs(blogs, sync_sqlite=False)
        except Exception as e:
            print(f"SQLite blogs fallback error: {e}")

    return blogs


def save_blogs(data, sync_sqlite=True):
    try:
        with open(BLOG_FILE, 'w') as f:
            json.dump(data, f, indent=2)
    except Exception as e:
        print(f"Error saving JSON blogs: {e}")

    if sync_sqlite and os.path.exists(SQLITE_FILE):
        try:
            conn = sqlite3.connect(SQLITE_FILE)
            cursor = conn.cursor()
            cursor.execute("DELETE FROM blogs")
            for b in data:
                b_tags = json.dumps(b.get("tags", [])) if isinstance(b.get("tags"), list) else str(b.get("tags", ""))
                cursor.execute('''
                    INSERT OR REPLACE INTO blogs (
                        id, title, category, read_time, author, date, cover_image, excerpt, content, tags_raw
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    b.get("id"),
                    b.get("title", "Untitled Editorial"),
                    b.get("category", "Lowers"),
                    b.get("read_time", "4 min"),
                    b.get("author", "Street Curator"),
                    b.get("date", ""),
                    b.get("cover_image", ""),
                    b.get("excerpt", ""),
                    b.get("content", ""),
                    b_tags
                ))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"Error saving blogs SQLite: {e}")


# Initialize DBs
load_db()
load_blogs()


def make_jwt(username):
    payload = {"sub": username, "role": "superadmin", "exp": int(time.time()) + 172800}
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    h_b64 = base64.urlsafe_b64encode(json.dumps({"alg": "HS256"}).encode()).decode().rstrip("=")
    sig = hmac.new(JWT_SECRET.encode(), f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
    s_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")
    return f"{h_b64}.{p_b64}.{s_b64}"


def verify_jwt(token):
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h_b64, p_b64, s_b64 = parts
        sig = hmac.new(JWT_SECRET.encode(), f"{h_b64}.{p_b64}".encode(), hashlib.sha256).digest()
        calc_sig = base64.urlsafe_b64encode(sig).decode().rstrip("=")
        if not hmac.compare_digest(calc_sig, s_b64):
            return None
        padding = 4 - (len(p_b64) % 4)
        if padding != 4:
            p_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(p_b64).decode())
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


class StreetDripHandler(http.server.BaseHTTPRequestHandler):
    def get_client_ip(self):
        return self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()

    def send_security_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("X-XSS-Protection", "1; mode=block")
        self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_security_headers()
        self.end_headers()

    def send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_security_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def read_json_body(self):
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len == 0:
            return {}
        raw = self.rfile.read(content_len).decode("utf-8")
        return json.loads(raw)

    def is_authenticated_admin(self):
        auth_header = self.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return False
        token = auth_header.split(" ")[1]
        return verify_jwt(token) is not None

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        products = load_db()
        blogs = load_blogs()

        # GET /api/hierarchy
        if path == "/api/hierarchy":
            return self.send_json(200, CATEGORY_HIERARCHY)

        # GET /api/products
        if path in ["/api/products", "/products"]:
            main_cat = query.get("main_category", [query.get("category", ["All"])[0]])[0]
            sub_cat = query.get("sub_category", ["All"])[0]
            brand = query.get("brand", ["All"])[0]
            search = query.get("search", [""])[0].lower()
            sort_by = query.get("sort_by", ["popular"])[0]

            filtered = products
            if main_cat.lower() != "all":
                filtered = [p for p in filtered if p.get("main_category", "").lower() == main_cat.lower() or main_cat.lower() in p.get("category", "").lower()]
            if sub_cat.lower() != "all":
                filtered = [p for p in filtered if p.get("sub_category", "").lower() == sub_cat.lower()]
            if brand.lower() != "all":
                filtered = [p for p in filtered if p.get("brand", "").lower() == brand.lower()]
            if search:
                filtered = [p for p in filtered if search in p.get("name", "").lower() or search in p.get("sub_category", "").lower() or search in p.get("brand", "").lower()]

            if sort_by == "price_asc":
                filtered.sort(key=lambda x: x.get("price", 0))
            elif sort_by == "price_desc":
                filtered.sort(key=lambda x: x.get("price", 0), reverse=True)
            elif sort_by == "newest":
                filtered.sort(key=lambda x: x.get("id", 0), reverse=True)
            else:
                filtered.sort(key=lambda x: x.get("likes", 0), reverse=True)

            return self.send_json(200, filtered)

        # GET /api/categories
        if path == "/api/categories":
            res = []
            for cat, subs in CATEGORY_HIERARCHY.items():
                cnt = sum(1 for p in products if p.get("main_category", "").lower() == cat.lower())
                res.append({
                    "name": cat,
                    "count": cnt,
                    "subcategories": subs
                })
            return self.send_json(200, res)

        # GET /api/blogs
        if path in ["/api/blogs", "/blogs"]:
            cat = query.get("category", ["All"])[0]
            search = query.get("search", [""])[0].lower()
            filtered_blogs = blogs
            if cat.lower() != "all":
                filtered_blogs = [b for b in filtered_blogs if b.get("category", "").lower() == cat.lower()]
            if search:
                filtered_blogs = [b for b in filtered_blogs if search in b.get("title", "").lower() or search in b.get("content", "").lower()]
            return self.send_json(200, filtered_blogs)

        if path.startswith("/api/blogs/"):
            try:
                b_id = int(path.split("/")[-1])
                matched = next((b for b in blogs if b["id"] == b_id), None)
                if matched:
                    return self.send_json(200, matched)
                return self.send_json(404, {"detail": "Article not found"})
            except ValueError:
                return self.send_json(400, {"detail": "Invalid ID"})

        # GET /admin/stats
        if path == "/admin/stats":
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            return self.send_json(200, {
                "total_products": len(products),
                "total_blogs": len(blogs),
                "total_brands": len(set(p.get("brand", "") for p in products)),
                "total_categories": len(CATEGORY_HIERARCHY),
                "top_category": "Lowers",
                "avg_price": round(sum(p.get("price", 0) for p in products) / len(products), 2) if products else 0,
                "latest_drops": sorted(products, key=lambda x: x["id"], reverse=True)[:5],
                "latest_blogs": sorted(blogs, key=lambda x: x["id"], reverse=True)[:3]
            })

        if path == "/admin/verify":
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            return self.send_json(200, {"status": "authenticated", "role": "superadmin"})

        if path == "/":
            return self.send_json(200, {"status": "online", "app": "STREETDRIP Granular Fashion Platform", "version": "4.0.0"})

        return self.send_json(404, {"detail": "Not found"})

    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        body = self.read_json_body()

        # POST /login (Flexible Master Admin Authentication)
        if path in ["/login", "/api/login", "/admin/login"]:
            u = body.get("username", "").strip()
            p = body.get("password", "").strip()
            u_clean = u.lower()

            custom_pass = os.getenv("ADMIN_PASSWORD")
            valid_passwords = [custom_pass] if custom_pass else [ADMIN_PASS, "anuskar2020@"]

            custom_user = os.getenv("ADMIN_USERNAME")
            valid_users = [custom_user.lower()] if custom_user else [ADMIN_USER.lower(), "anuja2007"]

            if u_clean in valid_users and p in valid_passwords:
                return self.send_json(200, {
                    "access_token": make_jwt(u_clean),
                    "token_type": "bearer",
                    "user": {"username": u_clean, "name": "Chief Fashion Director", "role": "superadmin"}
                })
            else:
                return self.send_json(401, {"detail": "Invalid admin username or password"})

        # POST /admin/products
        if path == "/admin/products":
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            products = load_db()
            new_id = max([p["id"] for p in products], default=0) + 1
            main_cat = sanitize_input(body.get("main_category", "Lowers"))
            sub_cat = sanitize_input(body.get("sub_category", "Baggy Jeans"))
            new_item = {
                "id": new_id,
                "name": sanitize_input(body.get("name", "Untitled Piece")),
                "main_category": main_cat,
                "sub_category": sub_cat,
                "category": f"{main_cat} - {sub_cat}",
                "brand": sanitize_input(body.get("brand", "Nike")),
                "price": float(body.get("price", 49.99)),
                "image_url": sanitize_input(body.get("image_url", "https://images.unsplash.com/photo-1542272604-780c96856592")),
                "model_3d_url": sanitize_input(body.get("model_3d_url") or ""),
                "model_type": sanitize_input(body.get("model_type", "sneaker")),
                "affiliate_link": sanitize_input(body.get("affiliate_link", "https://brand.com")),
                "vibe_tags": [sanitize_input(t.strip()) for t in (body.get("vibe_tags").split(",") if isinstance(body.get("vibe_tags"), str) else (body.get("vibe_tags") or ["Streetwear"])) if str(t).strip()],
                "likes": random.randint(50, 150),
                "drop_status": sanitize_input(body.get("drop_status", "HOT DROP")),
                "description": sanitize_input(body.get("description", ""))
            }
            products.insert(0, new_item)
            save_db(products)
            return self.send_json(201, new_item)

        # POST /admin/blogs
        if path == "/admin/blogs":
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            blogs = load_blogs()
            new_id = max([b["id"] for b in blogs], default=0) + 1
            new_blog = {
                "id": new_id,
                "title": sanitize_input(body.get("title", "Untitled Editorial")),
                "category": sanitize_input(body.get("category", "Lowers")),
                "read_time": sanitize_input(body.get("read_time", "4 min")),
                "author": sanitize_input(body.get("author", "Fashion Editor")),
                "date": time.strftime("%b %d, %Y"),
                "cover_image": sanitize_input(body.get("cover_image", "https://images.unsplash.com/photo-1542272604-780c96856592")),
                "excerpt": sanitize_input(body.get("excerpt", "")),
                "content": sanitize_input(body.get("content", "")),
                "tags": [sanitize_input(t) for t in body.get("tags", ["Fashion", "Style"])]
            }
            blogs.insert(0, new_blog)
            save_blogs(blogs)
            return self.send_json(201, new_blog)

        # POST /admin/products/bulk-delete
        if path in ["/admin/products/bulk-delete", "/api/admin/products/bulk-delete"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            ids_to_del = set(body.get("ids", []))
            products = load_db()
            new_p = [p for p in products if p["id"] not in ids_to_del]
            deleted_count = len(products) - len(new_p)
            save_db(new_p)
            return self.send_json(200, {"success": True, "deleted_count": deleted_count, "remaining": len(new_p)})

        # POST /admin/products/bulk-update
        if path in ["/admin/products/bulk-update", "/api/admin/products/bulk-update"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            ids_to_update = set(body.get("ids", []))
            fields = body.get("fields", {})
            products = load_db()
            updated_count = 0
            for p in products:
                if p["id"] in ids_to_update:
                    for k, v in fields.items():
                        if v is not None:
                            p[k] = sanitize_input(v) if isinstance(v, str) else v
                    updated_count += 1
            if updated_count > 0:
                save_db(products)
            return self.send_json(200, {"success": True, "updated_count": updated_count})

        # POST /admin/blogs/bulk-delete
        if path in ["/admin/blogs/bulk-delete", "/api/admin/blogs/bulk-delete"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            ids_to_del = set(body.get("ids", []))
            blogs = load_blogs()
            new_b = [b for b in blogs if b["id"] not in ids_to_del]
            deleted_count = len(blogs) - len(new_b)
            save_blogs(new_b)
            return self.send_json(200, {"success": True, "deleted_count": deleted_count, "remaining": len(new_b)})

        # POST /admin/blogs/bulk-update
        if path in ["/admin/blogs/bulk-update", "/api/admin/blogs/bulk-update"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Admin authorization required"})
            ids_to_update = set(body.get("ids", []))
            fields = body.get("fields", {})
            blogs = load_blogs()
            updated_count = 0
            for b in blogs:
                if b["id"] in ids_to_update:
                    for k, v in fields.items():
                        if v is not None:
                            b[k] = sanitize_input(v) if isinstance(v, str) else v
                    updated_count += 1
            if updated_count > 0:
                save_blogs(blogs)
            return self.send_json(200, {"success": True, "updated_count": updated_count})

        # POST /api/products/sync or /admin/products/sync
        if path in ["/api/products/sync", "/admin/products/sync"]:
            incoming = body.get("products", [])
            if isinstance(incoming, list) and incoming:
                products = load_db()
                existing_map = {p["id"]: i for i, p in enumerate(products)}
                changed = False
                for item in incoming:
                    if not isinstance(item, dict) or "id" not in item:
                        continue
                    item_id = item["id"]
                    if item_id in existing_map:
                        idx = existing_map[item_id]
                        products[idx].update(item)
                        changed = True
                    else:
                        products.insert(0, item)
                        changed = True
                if changed:
                    save_db(products)
            return self.send_json(200, {"success": True, "count": len(load_db())})

        # POST /api/blogs/sync or /admin/blogs/sync
        if path in ["/api/blogs/sync", "/admin/blogs/sync"]:
            incoming = body.get("blogs", [])
            if isinstance(incoming, list) and incoming:
                blogs = load_blogs()
                existing_map = {b["id"]: i for i, b in enumerate(blogs)}
                changed = False
                for item in incoming:
                    if not isinstance(item, dict) or "id" not in item:
                        continue
                    item_id = item["id"]
                    if item_id in existing_map:
                        idx = existing_map[item_id]
                        blogs[idx].update(item)
                        changed = True
                    else:
                        blogs.insert(0, item)
                        changed = True
                if changed:
                    save_blogs(blogs)
            return self.send_json(200, {"success": True, "count": len(load_blogs())})

        # POST /recommend/vibe
        if path in ["/recommend/vibe", "/api/recommend/vibe"]:
            products = load_db()
            aesthetic = body.get("aesthetic", "Late night drive")
            if not products:
                return self.send_json(200, {
                    "vibe": aesthetic,
                    "vibe_summary": f"Styling engine ready. Add pieces in the Admin Panel to generate full outfits for '{aesthetic}'.",
                    "aesthetic_quote": "Upload items to unlock automatic ensemble matching.",
                    "total_price": 0.0,
                    "currency": "INR",
                    "outfit_pieces": {},
                    "styling_tips": [
                        "Add tops, bottoms, jackets, and footwear in Admin.",
                        "AI ensemble generator will automatically match your pieces."
                    ],
                    "bundle_affiliate_redirect": "/admin"
                })
            top_p = next((p for p in products if p.get("main_category") in ["T-Shirts", "Shirts"]), products[0])
            btm_p = next((p for p in products if p.get("main_category") == "Lowers"), products[0])
            jacket_p = next((p for p in products if p.get("main_category") == "Jackets"), products[0])
            shoe_p = next((p for p in products if p.get("main_category") == "Shoes"), products[0])

            tot = round(top_p["price"] + btm_p["price"] + jacket_p["price"] + shoe_p["price"], 2)
            return self.send_json(200, {
                "vibe": aesthetic,
                "vibe_summary": f"Curated complete outfit styled for '{aesthetic}'.",
                "aesthetic_quote": "Clean architectural volume with sharp minimalist contrast.",
                "total_price": tot,
                "currency": "INR",
                "outfit_pieces": {
                    "top": top_p,
                    "bottom": btm_p,
                    "jacket": jacket_p,
                    "shoes": shoe_p
                },
                "styling_tips": [
                    "Let wide-leg bottoms pool naturally over chunky soles.",
                    "Keep inner layers tucked or cropped boxy under oversized jackets."
                ],
                "bundle_affiliate_redirect": f"https://streetdrip.ai/bundle/cop?fit=991"
            })

        return self.send_json(404, {"detail": "Not found"})

    def do_PUT(self):
        path = urllib.parse.urlparse(self.path).path
        body = self.read_json_body()

        if path.startswith("/admin/products/"):
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            try:
                p_id = int(path.split("/")[-1])
            except ValueError:
                return self.send_json(400, {"detail": "Invalid ID"})
            products = load_db()
            found = None
            for p in products:
                if p["id"] == p_id:
                    for k, v in body.items():
                        if v is not None:
                            p[k] = sanitize_input(v) if isinstance(v, str) else v
                    found = p
                    break
            if found:
                save_db(products)
                return self.send_json(200, found)
            return self.send_json(404, {"detail": "Product not found"})

        if path.startswith("/admin/blogs/"):
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            try:
                b_id = int(path.split("/")[-1])
            except ValueError:
                return self.send_json(400, {"detail": "Invalid ID"})
            blogs = load_blogs()
            found = None
            for b in blogs:
                if b["id"] == b_id:
                    for k, v in body.items():
                        if v is not None:
                            b[k] = sanitize_input(v) if isinstance(v, str) else v
                    found = b
                    break
            if found:
                save_blogs(blogs)
                return self.send_json(200, found)
            return self.send_json(404, {"detail": "Blog not found"})

        return self.send_json(404, {"detail": "Not found"})

    def do_DELETE(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ["/admin/products/bulk", "/api/admin/products/bulk"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            body = self.read_json_body()
            ids_to_del = set(body.get("ids", []))
            products = load_db()
            new_p = [p for p in products if p["id"] not in ids_to_del]
            deleted_count = len(products) - len(new_p)
            save_db(new_p)
            return self.send_json(200, {"success": True, "deleted_count": deleted_count})

        if path in ["/admin/blogs/bulk", "/api/admin/blogs/bulk"]:
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            body = self.read_json_body()
            ids_to_del = set(body.get("ids", []))
            blogs = load_blogs()
            new_b = [b for b in blogs if b["id"] not in ids_to_del]
            deleted_count = len(blogs) - len(new_b)
            save_blogs(new_b)
            return self.send_json(200, {"success": True, "deleted_count": deleted_count})

        if path.startswith("/admin/products/"):
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            try:
                p_id = int(path.split("/")[-1])
            except ValueError:
                return self.send_json(400, {"detail": "Invalid ID"})
            products = load_db()
            new_p = [p for p in products if p["id"] != p_id]
            if len(new_p) < len(products):
                save_db(new_p)
                return self.send_json(200, {"success": True, "deleted_id": p_id})
            return self.send_json(404, {"detail": "Product not found"})

        if path.startswith("/admin/blogs/"):
            if not self.is_authenticated_admin():
                return self.send_json(401, {"detail": "Unauthorized"})
            try:
                b_id = int(path.split("/")[-1])
            except ValueError:
                return self.send_json(400, {"detail": "Invalid ID"})
            blogs = load_blogs()
            new_b = [b for b in blogs if b["id"] != b_id]
            if len(new_b) < len(blogs):
                save_blogs(new_b)
                return self.send_json(200, {"success": True, "deleted_id": b_id})
            return self.send_json(404, {"detail": "Blog not found"})

        return self.send_json(404, {"detail": "Not found"})


if __name__ == "__main__":
    print(f"\n🚀 STREETDRIP RESTRUCTURED SERVER RUNNING ON PORT {PORT}")
    print(f"👕 6 Pillars Active: Lowers, Shirts, T-Shirts, Jackets, Shoes, Glasses")
    print(f"🔒 Security & Hierarchy Active!")
    with socketserver.TCPServer(("", PORT), StreetDripHandler) as httpd:
        httpd.serve_forever()
