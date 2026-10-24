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

PORT = int(os.getenv("PORT", 8000))
DATA_FILE = os.path.join(os.path.dirname(__file__), "streetwear_db.json")
BLOG_FILE = os.path.join(os.path.dirname(__file__), "blogs_db.json")

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

INITIAL_PRODUCTS = [
    # LOWERS - JEANS
    {
        "id": 1,
        "name": "Levi's 568 Loose Straight Carpenter Denim",
        "main_category": "Lowers",
        "sub_category": "Baggy Jeans",
        "brand": "Levi's",
        "price": 89.50,
        "image_url": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://levi.com/affiliate/568-loose?ref=streetdrip",
        "vibe_tags": ["Baggy", "Skater", "90s Retro"],
        "likes": 1280,
        "drop_status": "HOT DROP",
        "description": "Heavyweight vintage washed indigo denim with authentic loose skate drape."
    },
    {
        "id": 2,
        "name": "Zara Classic Raw Hem Straight Leg Jeans",
        "main_category": "Lowers",
        "sub_category": "Straight Fit Jeans",
        "brand": "Zara",
        "price": 59.90,
        "image_url": "https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/straight-jeans?ref=streetdrip",
        "vibe_tags": ["Minimalist", "Everyday Fit", "Clean"],
        "likes": 840,
        "drop_status": "ESSENTIAL",
        "description": "Clean silhouette non-stretch denim tailored straight from hip to hem."
    },
    {
        "id": 3,
        "name": "H&M Stretch Tapered Skinny Fit Denim",
        "main_category": "Lowers",
        "sub_category": "Skinny Fit Jeans",
        "brand": "H&M",
        "price": 39.99,
        "image_url": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://hm.com/affiliate/skinny-jeans?ref=streetdrip",
        "vibe_tags": ["Rock Grunge", "Fitted"],
        "likes": 420,
        "drop_status": "RESTOCKED",
        "description": "Form-fitting cotton denim with 2% elastane for maximum comfort and flex."
    },
    # LOWERS - CARGOS & KOREAN & CHINOS
    {
        "id": 4,
        "name": "Zara Parachute Multi-Pocket Ripstop Cargos",
        "main_category": "Lowers",
        "sub_category": "Cargo Pants",
        "brand": "Zara",
        "price": 69.90,
        "image_url": "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/parachute-cargos?ref=streetdrip",
        "vibe_tags": ["Techwear", "Tokyo Drip", "Late night drive"],
        "likes": 1690,
        "drop_status": "HOT DROP",
        "description": "8-pocket tactical bellows construction with adjustable hem bungee cords."
    },
    {
        "id": 5,
        "name": "Seoul Minimalist Wide-Leg Pleated Korean Trousers",
        "main_category": "Lowers",
        "sub_category": "Korean Trousers",
        "brand": "Zara",
        "price": 79.90,
        "image_url": "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/korean-slacks?ref=streetdrip",
        "vibe_tags": ["Korean Aesthetic", "Minimalist", "Oversized Drape"],
        "likes": 2150,
        "drop_status": "HOT DROP",
        "description": "Double front pleats with flowing drape fabric engineered for effortless volume."
    },
    {
        "id": 6,
        "name": "Bewakoof Urban Relaxed Heavy Twill Chinos",
        "main_category": "Lowers",
        "sub_category": "Chinos",
        "brand": "Bewakoof",
        "price": 34.00,
        "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://bewakoof.com/affiliate/relaxed-chinos?ref=streetdrip",
        "vibe_tags": ["Casual", "College fest", "Smart Street"],
        "likes": 560,
        "drop_status": "IN STOCK",
        "description": "Earth tone relaxed cotton twill chinos tailored for everyday rotation."
    },
    {
        "id": 7,
        "name": "H&M Tailored Wool-Blend Formal Trousers",
        "main_category": "Lowers",
        "sub_category": "Formal Pants",
        "brand": "H&M",
        "price": 49.99,
        "image_url": "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://hm.com/affiliate/formal-slacks?ref=streetdrip",
        "vibe_tags": ["Formal", "Old Money", "Office"],
        "likes": 670,
        "drop_status": "CLASSIC",
        "description": "Creased pressed leg, tailored waist tabs, and premium drape blend."
    },

    # SHIRTS
    {
        "id": 8,
        "name": "Zara Boxy Camp Collar Heavy Linen Shirt",
        "main_category": "Shirts",
        "sub_category": "Boxy Fit Shirts",
        "brand": "Zara",
        "price": 55.90,
        "image_url": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/boxy-camp-shirt?ref=streetdrip",
        "vibe_tags": ["Summer Drip", "Boxy", "Minimalist"],
        "likes": 1120,
        "drop_status": "HOT DROP",
        "description": "Squared hem, relaxed open camp collar, and premium structured breathable weave."
    },
    {
        "id": 9,
        "name": "Levi's Classic Plaid Heavy Flannel Casual Shirt",
        "main_category": "Shirts",
        "sub_category": "Casual Shirts",
        "brand": "Levi's",
        "price": 68.00,
        "image_url": "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://levi.com/affiliate/plaid-flannel?ref=streetdrip",
        "vibe_tags": ["Grunge", "College fest", "Layering"],
        "likes": 890,
        "drop_status": "BESTSELLER",
        "description": "Brushed double cotton flannel with twin chest pockets and horn buttons."
    },
    {
        "id": 10,
        "name": "Zara Crisp Oxford Cotton Formal Shirt",
        "main_category": "Shirts",
        "sub_category": "Formal Shirts",
        "brand": "Zara",
        "price": 49.90,
        "image_url": "https://images.unsplash.com/photo-1620012253295-c15c429fccf8?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/oxford-shirt?ref=streetdrip",
        "vibe_tags": ["Formal", "Minimalist", "Old Money"],
        "likes": 530,
        "drop_status": "ESSENTIAL",
        "description": "Pure combed cotton with spread collar and clean seamless French placket."
    },
    {
        "id": 11,
        "name": "Bewakoof Heavy Canvas Utility Overshirt",
        "main_category": "Shirts",
        "sub_category": "Overshirts",
        "brand": "Bewakoof",
        "price": 42.00,
        "image_url": "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://bewakoof.com/affiliate/utility-overshirt?ref=streetdrip",
        "vibe_tags": ["Workwear", "Layering", "Streetwear"],
        "likes": 780,
        "drop_status": "HOT DROP",
        "description": "Heavyweight 320 GSM cotton twill designed to be worn over tees and hoodies."
    },

    # T-SHIRTS
    {
        "id": 12,
        "name": "Bewakoof 280 GSM Heavyweight Boxy Cut Tee",
        "main_category": "T-Shirts",
        "sub_category": "Boxy Fit T-Shirt",
        "brand": "Bewakoof",
        "price": 28.00,
        "image_url": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://bewakoof.com/affiliate/heavy-boxy-tee?ref=streetdrip",
        "vibe_tags": ["Boxy", "Minimalist", "Everyday fit"],
        "likes": 1840,
        "drop_status": "HOT DROP",
        "description": "Thick rib crewneck collar, squared sleeves, and heavyweight structured cotton."
    },
    {
        "id": 13,
        "name": "Zara Washed Raw Drop Shoulder Graphic Tee",
        "main_category": "T-Shirts",
        "sub_category": "Drop Shoulder T-Shirt",
        "brand": "Zara",
        "price": 35.90,
        "image_url": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/drop-shoulder-tee?ref=streetdrip",
        "vibe_tags": ["Late night drive", "Tokyo Drip", "Cyberpunk"],
        "likes": 1420,
        "drop_status": "LIMITED",
        "description": "Relaxed dropped shoulder seams with vintage stone-wash treatment."
    },
    {
        "id": 14,
        "name": "Nike Club Motors & Soccer Street Jersey",
        "main_category": "T-Shirts",
        "sub_category": "Jersey",
        "brand": "Nike",
        "price": 65.00,
        "image_url": "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://nike.com/affiliate/street-jersey?ref=streetdrip",
        "vibe_tags": ["Blokecore", "College fest", "Sports Lux"],
        "likes": 2100,
        "drop_status": "HOT DROP",
        "description": "Breathable jacquard mesh fabric with embroidered sponsor badges and racing stripes."
    },
    {
        "id": 15,
        "name": "H&M Essential Regular Combed Cotton T-Shirt",
        "main_category": "T-Shirts",
        "sub_category": "Normal Fit T-Shirt",
        "brand": "H&M",
        "price": 14.99,
        "image_url": "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://hm.com/affiliate/normal-tee?ref=streetdrip",
        "vibe_tags": ["Basics", "Everyday fit"],
        "likes": 510,
        "drop_status": "ESSENTIAL",
        "description": "Standard fit organic cotton basic tee designed for clean layering."
    },
    {
        "id": 16,
        "name": "Levi's Waffle Knit Long-Sleeve Henley Tee",
        "main_category": "T-Shirts",
        "sub_category": "Henley Neck T-Shirt",
        "brand": "Levi's",
        "price": 38.00,
        "image_url": "https://images.unsplash.com/photo-1618354691792-d1d42acfd860?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://levi.com/affiliate/waffle-henley?ref=streetdrip",
        "vibe_tags": ["Rugged", "Minimalist", "Vintage"],
        "likes": 730,
        "drop_status": "IN STOCK",
        "description": "Thermal waffle knit fabric with 3-button placket and rib-knit cuffs."
    },
    {
        "id": 17,
        "name": "Zara Retro Knitted Contrast Collar Polo Shirt",
        "main_category": "T-Shirts",
        "sub_category": "Polo T-Shirt",
        "brand": "Zara",
        "price": 45.90,
        "image_url": "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/knit-polo?ref=streetdrip",
        "vibe_tags": ["Old Money", "Retro", "Smart Street"],
        "likes": 980,
        "drop_status": "BESTSELLER",
        "description": "Open-knit textured weave with contrasting collar piping and buttonless notch."
    },

    # JACKETS
    {
        "id": 18,
        "name": "Levi's Vintage Raw Trucker Denim Jacket",
        "main_category": "Jackets",
        "sub_category": "Denim Jacket",
        "brand": "Levi's",
        "price": 118.00,
        "image_url": "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://levi.com/affiliate/trucker-jacket?ref=streetdrip",
        "vibe_tags": ["Heritage", "Skater Grunge", "Everyday fit"],
        "likes": 1940,
        "drop_status": "HOT DROP",
        "description": "The quintessential denim silhouette. Rigid non-stretch denim with branded metal shanks."
    },
    {
        "id": 19,
        "name": "Zara Distressed Biker Leather Jacket",
        "main_category": "Jackets",
        "sub_category": "Leather Jacket",
        "brand": "Zara",
        "price": 149.00,
        "image_url": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/biker-leather-jacket?ref=streetdrip",
        "vibe_tags": ["Late night drive", "Punk Rock", "Nocturnal"],
        "likes": 2350,
        "drop_status": "HOT DROP",
        "description": "Supple distressed faux-leather with asymmetric chrome zipper and snap notch lapels."
    },
    {
        "id": 20,
        "name": "Nike MA-1 Flight Insulated Bomber Jacket",
        "main_category": "Jackets",
        "sub_category": "Bomber Jacket",
        "brand": "Nike",
        "price": 130.00,
        "image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://nike.com/affiliate/flight-bomber?ref=streetdrip",
        "vibe_tags": ["Military", "Tokyo Drip", "Winter"],
        "likes": 1580,
        "drop_status": "LIMITED",
        "description": "Water-repellent satin nylon outer, reversible orange lining, and arm utility pocket."
    },
    {
        "id": 21,
        "name": "Zara Oversized Quilted Down Puffer Jacket",
        "main_category": "Jackets",
        "sub_category": "Puffer Jacket",
        "brand": "Zara",
        "price": 119.00,
        "image_url": "https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "hoodie",
        "affiliate_link": "https://zara.com/affiliate/quilted-puffer?ref=streetdrip",
        "vibe_tags": ["Winter Drip", "Oversized", "Cozy"],
        "likes": 1240,
        "drop_status": "HOT DROP",
        "description": "High collar thermal baffle insulation with interior harness straps."
    },

    # SHOES
    {
        "id": 22,
        "name": "Nike Air Max Plus Drift 'Acid Neon'",
        "main_category": "Shoes",
        "sub_category": "Chunky Sneakers",
        "brand": "Nike",
        "price": 185.00,
        "image_url": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/sneaker_cyber_drift.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://nike.com/affiliate/air-max-plus-drift?ref=streetdrip",
        "vibe_tags": ["Late night drive", "Tokyo Drip", "Cyberpunk rave"],
        "likes": 2840,
        "drop_status": "HOT DROP",
        "description": "Cage TPU overlay with dual-pressure Tuned Air cushioning."
    },
    {
        "id": 23,
        "name": "Nike Dunk Low Retro Monochrome 'Panda'",
        "main_category": "Shoes",
        "sub_category": "Minimal Court Sneakers",
        "brand": "Nike",
        "price": 115.00,
        "image_url": "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/nike_dunk_low.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://nike.com/affiliate/dunk-low-panda?ref=streetdrip",
        "vibe_tags": ["Everyday fit", "College fest", "Skater"],
        "likes": 3400,
        "drop_status": "BESTSELLER",
        "description": "Two-tone leather court classic with padded collar and durable cupsole."
    },
    {
        "id": 24,
        "name": "Crocs Echo Clog 'Stucco & Slate'",
        "main_category": "Shoes",
        "sub_category": "Foam Clogs",
        "brand": "Crocs",
        "price": 69.99,
        "image_url": "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/crocs_echo_clog.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://crocs.com/affiliate/echo-clog?ref=streetdrip",
        "vibe_tags": ["Chill weekend", "Airport drip", "Comfort"],
        "likes": 1820,
        "drop_status": "RESTOCKED",
        "description": "Sculpted exoskeleton foam construction with dual-density LiteRide drop-in footbed."
    },

    # GLASSES
    {
        "id": 25,
        "name": "CyberShield Y2K Matrix Aerodynamic Wrap Shades",
        "main_category": "Glasses",
        "sub_category": "Y2K Wrap Shades",
        "brand": "Zara",
        "price": 32.90,
        "image_url": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/shades_matrix_y2k.gltf",
        "model_type": "glasses",
        "affiliate_link": "https://zara.com/affiliate/cybershield-shades?ref=streetdrip",
        "vibe_tags": ["Late night drive", "Tokyo Drip", "Cyberpunk"],
        "likes": 2150,
        "drop_status": "HOT DROP",
        "description": "Continuous contour shield lens with iridescent UV400 mirror coating."
    },
    {
        "id": 26,
        "name": "Zara Minimalist Octagon Wireframe Glasses",
        "main_category": "Glasses",
        "sub_category": "Minimalist Wireframe",
        "brand": "Zara",
        "price": 29.90,
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": None,
        "model_type": "glasses",
        "affiliate_link": "https://zara.com/affiliate/wireframe-glasses?ref=streetdrip",
        "vibe_tags": ["Minimalist", "Old Money", "Intellectual"],
        "likes": 980,
        "drop_status": "CLASSIC",
        "description": "Ultralight stainless steel wire frame with anti-glare blue-light filtering lenses."
    },
    {
        "id": 27,
        "name": "Dr. Martens 1461 Quad Chunky Platform Derby",
        "main_category": "Shoes",
        "sub_category": "Boots & Derbies",
        "brand": "Zara",
        "price": 170.00,
        "image_url": "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/sneaker_cyber_drift.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://zara.com/affiliate/1461-derby?ref=streetdrip",
        "vibe_tags": ["Grunge", "Korean Aesthetic", "Formal Street"],
        "likes": 1650,
        "drop_status": "ESSENTIAL",
        "description": "Heavyweight smooth polished leather with 1.5-inch Quad platform lug sole and signature welt stitching."
    },
    {
        "id": 28,
        "name": "New Balance 1906R 'Refined Future' Protection Pack",
        "main_category": "Shoes",
        "sub_category": "Chunky Sneakers",
        "brand": "Nike",
        "price": 160.00,
        "image_url": "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/nike_dunk_low.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://nike.com/affiliate/1906r-protection?ref=streetdrip",
        "vibe_tags": ["Gorpcore", "Everyday fit", "Late night drive"],
        "likes": 2980,
        "drop_status": "GRAIL DROP",
        "description": "Deconstructed suede overlays with N-ergy cushioning and Stability Web arch support."
    },
    {
        "id": 29,
        "name": "Salehe Bembury x Crocs The Pollex Clog 'Horchata'",
        "main_category": "Shoes",
        "sub_category": "Foam Clogs",
        "brand": "Crocs",
        "price": 85.00,
        "image_url": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/crocs_echo_clog.gltf",
        "model_type": "sneaker",
        "affiliate_link": "https://crocs.com/affiliate/pollex-horchata?ref=streetdrip",
        "vibe_tags": ["Sculptural", "Chill weekend", "Airport drip"],
        "likes": 3200,
        "drop_status": "LIMITED",
        "description": "Distinctive organic concave ridges modeled after 3 of Salehe Bembury's fingerprints."
    },
    {
        "id": 30,
        "name": "Retro Thick Black Acetate Oval Sunglasses",
        "main_category": "Glasses",
        "sub_category": "Retro Acetate Shades",
        "brand": "Bewakoof",
        "price": 24.99,
        "image_url": "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80",
        "model_3d_url": "/models/shades_matrix_y2k.gltf",
        "model_type": "glasses",
        "affiliate_link": "https://bewakoof.com/affiliate/retro-acetate-shades?ref=streetdrip",
        "vibe_tags": ["90s Hip Hop", "Vintage", "Minimalist"],
        "likes": 1420,
        "drop_status": "BESTSELLER",
        "description": "Handcrafted 8mm glossy black acetate frame with smoke tint UV400 lenses."
    }
]

INITIAL_BLOGS = [
    {
        "id": 1,
        "title": "Lowers Architecture: Why Baggy, Korean Slacks and Cargos Took Over Men's Fashion",
        "category": "Lowers",
        "read_time": "4 min",
        "author": "Drip Editorial",
        "date": "Oct 24, 2026",
        "cover_image": "https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "A deep dive into how trousers evolved from constricting slim cuts to wide Korean pleats, parachute nylon, and carpenter denim.",
        "content": "The bottom half of an outfit establishes its foundation. When you switch from slim jeans to wide-leg Korean trousers or baggy carpenter denim, the entire silhouette feels grounded and relaxed.\n\n### The Proportions Breakdown\n- **Baggy Jeans**: Best paired with cropped or boxy tops so the waistline is clearly defined.\n- **Korean Pleated Slacks**: Combine tailored formal elegance with a flowing drape over chunky loafers or sneakers.\n- **Parachute Cargos**: Add tactile industrial texture with 3D pockets and adjustable bungee ankles.",
        "tags": ["Lowers", "Jeans", "Cargos", "KoreanFashion"]
    },
    {
        "id": 2,
        "title": "The Shirt Hierarchy: When to Choose Boxy Camp Collars vs Formal Poplin vs Overshirts",
        "category": "Shirts",
        "read_time": "5 min",
        "author": "Tailoring Lead",
        "date": "Oct 22, 2026",
        "cover_image": "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "How to style boxy camp shirts, casual flannels, and formal poplin without looking stiff or underdressed.",
        "content": "The shirt is the most versatile piece in modern men's wardrobes. Moving beyond basic button-downs, boxy camp collar shirts provide a relaxed retro drape, while heavy canvas overshirts serve as lightweight jackets.\n\n### Styling Rules\n1. Leave boxy camp shirts unbuttoned with a ribbed tank top underneath.\n2. Layer heavy cotton flannels over vintage graphic tees.\n3. Tuck formal poplin shirts into wide Korean trousers for an effortless runway proportion.",
        "tags": ["Shirts", "BoxyFit", "Overshirts", "Layering"]
    },
    {
        "id": 3,
        "title": "T-Shirt Anatomy: Boxy Cuts vs Drop Shoulders vs Henleys & Heavyweight GSM",
        "category": "T-Shirts",
        "read_time": "4 min",
        "author": "Fabric Specialist",
        "date": "Oct 20, 2026",
        "cover_image": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "Why 280 GSM combed jersey changed everyday t-shirts, and which neckline (crew, henley, or polo) matches your build.",
        "content": "A high-quality T-shirt is defined by GSM (Grams per Square Meter). Flimsy 140 GSM tees cling to the body, whereas 280 GSM heavyweight cotton holds a boxy, sculptural shape that flatters all shoulder widths.\n\n### Neckline Comparison\n- **Boxy Crewneck**: The streetwear standard. Tight 1-inch rib collar that never sags.\n- **Drop Shoulder**: Sloped seam construction giving effortless relaxed volume.\n- **Henley Placket**: Adds rugged vintage character to layering.",
        "tags": ["TShirts", "GSM", "BoxyTee", "Henley"]
    },
    {
        "id": 4,
        "title": "Outerwear Grails: The Eternal Rivalry Between Leather Bikers and Denim Truckers",
        "category": "Jackets",
        "read_time": "6 min",
        "author": "Archive Collector",
        "date": "Oct 18, 2026",
        "cover_image": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "Analyzing the enduring cultural status of distressed biker leather, raw denim truckers, and military MA-1 bombers.",
        "content": "Jackets are investment pieces. A heavy distressed leather jacket breaks in with time, moulding to its wearer. Meanwhile, a raw trucker denim jacket develops personalized fades and honeycomb creasing unique to your lifestyle.",
        "tags": ["Jackets", "Leather", "DenimTrucker", "Outerwear"]
    },
    {
        "id": 5,
        "title": "Footwear Silhouettes: Why Bulky Caged Runners and Foam Clogs Dominate",
        "category": "Shoes",
        "read_time": "4 min",
        "author": "Sole Analyst",
        "date": "Oct 15, 2026",
        "cover_image": "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "How wide pant leg stacking made chunky soles, Tuned Air units, and recovery clogs a necessity.",
        "content": "As trousers became baggier, thin canvas sneakers started getting swallowed by wide hems. Enter chunky silhouette runners with prominent heel bumpers and exaggerated platform clogs that hold trouser pools cleanly off the pavement.",
        "tags": ["Shoes", "ChunkySneakers", "Crocs", "Footwear"]
    },
    {
        "id": 6,
        "title": "Face Framing: How Y2K Shield Shades & Minimalist Wireframes Elevate Every Fit",
        "category": "Glasses",
        "read_time": "3 min",
        "author": "Optic Curator",
        "date": "Oct 12, 2026",
        "cover_image": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=1200&q=80",
        "excerpt": "Selecting the right eyewear shape for your outfit frequency: aggressive wrap lenses vs subtle architectural wireframes.",
        "content": "Eyewear is the punctuation mark of an outfit. Aerodynamic wrap-around mirror lenses inject instantaneous cyber energy into a dark hoodie, while geometric wireframe glasses add intellectual luxury to tailored trousers.",
        "tags": ["Glasses", "Y2KShades", "Wireframe", "Accessories"]
    }
]


def load_db():
    if not os.path.exists(DATA_FILE):
        save_db(INITIAL_PRODUCTS)
        return INITIAL_PRODUCTS
    try:
        with open(DATA_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return INITIAL_PRODUCTS


def save_db(data):
    with open(DATA_FILE, "w") as f:
        json.dump(data, f, indent=2)


def load_blogs():
    if not os.path.exists(BLOG_FILE):
        save_blogs(INITIAL_BLOGS)
        return INITIAL_BLOGS
    try:
        with open(BLOG_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return INITIAL_BLOGS


def save_blogs(data):
    with open(BLOG_FILE, "w") as f:
        json.dump(data, f, indent=2)


# Reset DB if needed
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
                "vibe_tags": [sanitize_input(t) for t in body.get("vibe_tags", ["Streetwear"])],
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

        # POST /recommend/vibe
        if path in ["/recommend/vibe", "/api/recommend/vibe"]:
            products = load_db()
            aesthetic = body.get("aesthetic", "Late night drive")
            top_p = next((p for p in products if p.get("main_category") in ["T-Shirts", "Shirts"]), products[0])
            btm_p = next((p for p in products if p.get("main_category") == "Lowers"), products[1])
            jacket_p = next((p for p in products if p.get("main_category") == "Jackets"), products[2])
            shoe_p = next((p for p in products if p.get("main_category") == "Shoes"), products[3])

            tot = round(top_p["price"] + btm_p["price"] + jacket_p["price"] + shoe_p["price"], 2)
            return self.send_json(200, {
                "vibe": aesthetic,
                "vibe_summary": f"Curated complete outfit styled for '{aesthetic}'.",
                "aesthetic_quote": "Clean architectural volume with sharp minimalist contrast.",
                "total_price": tot,
                "currency": "USD",
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
