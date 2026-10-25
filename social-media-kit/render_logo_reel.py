import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
DURATION_SEC = 8
TOTAL_FRAMES = FPS * DURATION_SEC
OUT_PATH = "social-media-kit/streetdrip_logo_reveal_reel.mp4"

avatar_raw = Image.open('social-media-kit/profile-avatar.jpg').convert('RGB')

# Circular cropped avatar with anti-aliasing
def prepare_circular_avatar(img, size):
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse([0, 0, size, size], fill=255)
    return resized, mask

f_impact = "/System/Library/Fonts/Supplemental/Impact.ttf"
f_arial_black = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
f_courier = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"

font_logo_huge = ImageFont.truetype(f_impact, 110)
font_logo_sub = ImageFont.truetype(f_arial_black, 38)
font_title = ImageFont.truetype(f_impact, 78)
font_hud = ImageFont.truetype(f_courier, 24)
font_hud_small = ImageFont.truetype(f_courier, 18)
font_badge = ImageFont.truetype(f_arial_black, 32)
font_cta = ImageFont.truetype(f_arial_black, 36)

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(OUT_PATH, fourcc, float(FPS), (W, H))

def create_bg(c1, c2):
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        ratio = y / float(H)
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr)

base_bg = create_bg((30, 8, 16), (7, 6, 10))

def draw_tech_hud(draw, frame_idx):
    # Top Bar
    draw.text((60, 75), "STREETDRIP // BRAND IDENTITY", font=font_hud, fill=(212, 255, 0))
    if (frame_idx // 10) % 2 == 0:
        draw.ellipse([W - 170, 80, W - 150, 100], fill=(255, 40, 40))
    draw.text((W - 140, 75), "SYSTEM", font=font_hud, fill=(255, 255, 255))

    # Corner brackets
    L = 35
    acc = (212, 255, 0)
    draw.line([(50, 120), (50 + L, 120)], fill=acc, width=2)
    draw.line([(50, 120), (50, 120 + L)], fill=acc, width=2)

    draw.line([(W - 50, 120), (W - 50 - L, 120)], fill=acc, width=2)
    draw.line([(W - 50, 120), (W - 50, 120 + L)], fill=acc, width=2)

    draw.line([(50, H - 120), (50 + L, H - 120)], fill=acc, width=2)
    draw.line([(50, H - 120), (50, H - 120 - L)], fill=acc, width=2)

    draw.line([(W - 50, H - 120), (W - 50 - L, H - 120)], fill=acc, width=2)
    draw.line([(W - 50, H - 120), (W - 50, H - 120 - L)], fill=acc, width=2)

print("Rendering Logo Reveal Reel (240 frames, 1080x1920, 30fps)...")

for f in range(TOTAL_FRAMES):
    # Phase 1: Emergence & Wireframe (0 to 50)
    if f < 50:
        prog = f / 50.0
        frame = base_bg.copy()
        draw = ImageDraw.Draw(frame, "RGBA")
        draw_tech_hud(draw, f)

        # Rotating dashed outer circle
        angle = prog * math.pi
        cx, cy = W // 2, H // 2 - 40
        r_outer = int(280 + prog * 40)
        draw.ellipse([cx - r_outer, cy - r_outer, cx + r_outer, cy + r_outer], outline=(74, 18, 26, 180), width=4)

        # Growing avatar
        av_size = int(320 + prog * 160)
        scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
        # Apply fade opacity
        frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

        # Ambient glow ring
        r_ring = av_size // 2 + 10
        draw.ellipse([cx - r_ring, cy - r_ring, cx + r_ring, cy + r_ring], outline=(212, 255, 0, int(prog * 200)), width=3)

        # Decrypting Text
        draw.text((W // 2, H - 420), "[ IDENTITY DECRYPTION: SD-01 ]", font=font_hud, fill=(212, 255, 0), anchor="mm")
        draw.text((W // 2, H - 360), "ARCHITECTURAL STREETWEAR", font=font_title, fill=(255, 255, 255), anchor="mm")
        draw.text((W // 2, H - 290), "INITIALIZING WORLDWIDE VAULT...", font=font_hud_small, fill=(234, 219, 206), anchor="mm")

    # Phase 2: Bass Drop & Monumental Monogram (50 to 120)
    elif f < 120:
        scene_f = f - 50
        prog = scene_f / 70.0

        # Strobe on drop (frame 50-52)
        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (212, 255, 0))
            draw = ImageDraw.Draw(frame)
        else:
            frame = base_bg.copy()
            draw = ImageDraw.Draw(frame, "RGBA")
            draw_tech_hud(draw, f)

            # Central Emblem with pulsing breathing
            cx = W // 2
            cy = H // 2 - 80
            pulse = math.sin(prog * math.pi * 4) * 8
            av_size = int(520 + pulse)
            scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
            frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

            # High-tech brackets around avatar
            r_glow = av_size // 2 + 15
            draw.ellipse([cx - r_glow, cy - r_glow, cx + r_glow, cy + r_glow], outline=(212, 255, 0, 240), width=4)
            draw.ellipse([cx - r_glow - 25, cy - r_glow - 25, cx + r_glow + 25, cy + r_glow + 25], outline=(74, 18, 26, 160), width=2)

            # Crosshairs on the emblem
            draw.line([(cx - r_glow - 40, cy), (cx - r_glow + 10, cy)], fill=(212, 255, 0), width=3)
            draw.line([(cx + r_glow - 10, cy), (cx + r_glow + 40, cy)], fill=(212, 255, 0), width=3)

            # Monumental Title
            draw.text((W // 2, 260), "STREETDRIP", font=font_logo_huge, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 335), "ARCHITECTURAL TAILORING // 01", font=font_hud, fill=(212, 255, 0), anchor="mm")

            # Bottom Headline
            draw.text((W // 2, H - 380), "THE NEW ERA HAS ARRIVED.", font=font_title, fill=(234, 219, 206), anchor="mm")
            draw.text((W // 2, H - 300), "BUILT FOR PROPORTIONS & VOLUME", font=font_hud, fill=(212, 255, 0), anchor="mm")

    # Phase 3: Fast-Paced DNA & Pillar Callouts (120 to 180)
    elif f < 180:
        scene_f = f - 120
        step = scene_f // 15  # 4 steps: 0, 1, 2, 3

        pillars = [
            ("01 // 280+ GSM HEAVYWEIGHT", "Dense sculptural cotton that never sags"),
            ("02 // BAGGY CARPENTER DENIM", "Wide silhouette stacking over chunky soles"),
            ("03 // 3D INTERACTIVE VIEWER", "Inspect pieces in 360° before they sell out"),
            ("04 // STREET JOURNAL ARCHIVE", "Editorial style guides & proportion breakdowns")
        ]

        # White flash on each pillar transition
        if scene_f % 15 < 2:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            frame = base_bg.copy()
            draw = ImageDraw.Draw(frame, "RGBA")
            draw_tech_hud(draw, f)

            # Top Title
            draw.text((W // 2, 240), "STREETDRIP", font=font_logo_huge, fill=(255, 255, 255), anchor="mm")

            # Emblem slightly higher
            cx, cy = W // 2, 650
            av_size = 460
            scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
            frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

            r_glow = av_size // 2 + 12
            draw.ellipse([cx - r_glow, cy - r_glow, cx + r_glow, cy + r_glow], outline=(212, 255, 0, 220), width=3)

            # Pillar Feature Box (Changing every 15 frames)
            cur_p = pillars[min(step, 3)]
            box_y = 1040
            draw.rectangle([W//2 - 420, box_y, W//2 + 420, box_y + 160], fill=(15, 6, 12, 240), outline=(212, 255, 0), width=3)
            draw.text((W // 2, box_y + 55), cur_p[0], font=font_title, fill=(212, 255, 0), anchor="mm")
            draw.text((W // 2, box_y + 115), cur_p[1], font=font_hud_small, fill=(234, 219, 206), anchor="mm")

            # Bottom status
            draw.text((W // 2, H - 260), "CURATED DROP 01 LIVE NOW", font=font_hud, fill=(255, 255, 255), anchor="mm")

    # Phase 4: Grand Climax & Website Call to Action (180 to 240)
    else:
        scene_f = f - 180
        prog = scene_f / 60.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (212, 255, 0))
            draw = ImageDraw.Draw(frame)
        else:
            frame = base_bg.copy()
            draw = ImageDraw.Draw(frame, "RGBA")
            draw_tech_hud(draw, f)

            # Central Hero Emblem
            cx, cy = W // 2, 560
            av_size = 480
            scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
            frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

            # Dual rotating pulse rings
            r1 = av_size // 2 + 14
            r2 = av_size // 2 + 35 + int(math.sin(prog * 12) * 8)
            draw.ellipse([cx - r1, cy - r1, cx + r1, cy + r1], outline=(212, 255, 0), width=4)
            draw.ellipse([cx - r2, cy - r2, cx + r2, cy + r2], outline=(74, 18, 26, 180), width=2)

            # Grand Headlines
            draw.text((W // 2, 940), "THE VAULT IS OPEN.", font=font_logo_huge, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 1030), "STREETDRIP // OFFICIAL STORE", font=font_logo_sub, fill=(212, 255, 0), anchor="mm")

            # Pulsing Big Call to Action Button
            btn_pulse = int(math.sin(prog * 14) * 6)
            btn_w, btn_h = 800, 110
            btn_x = (W - btn_w) // 2
            btn_y = 1200 + btn_pulse

            draw.rectangle([btn_x - 4, btn_y - 4, btn_x + btn_w + 4, btn_y + btn_h + 4], outline=(212, 255, 0), width=2)
            draw.rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], fill=(212, 255, 0))

            draw.text((W // 2, btn_y + 55), "⚡ TAP LINK IN BIO TO COP ⚡", font=font_cta, fill=(10, 8, 14), anchor="mm")

            # Direct Website URL & Subtext
            draw.text((W // 2, 1370), "STREETDRIP-FASHION.ONRENDER.COM", font=font_hud, fill=(234, 219, 206), anchor="mm")
            draw.text((W // 2, 1420), "WORLDWIDE DISPATCH • NEW PIECES DROPPING WEEKLY", font=font_hud_small, fill=(212, 255, 0), anchor="mm")

    # Write frame to video
    cv_frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
    writer.write(cv_frame)

writer.release()
print(f"🎉 LOGO REVEAL REEL RENDERED SUCCESSFULLY: {OUT_PATH}")
