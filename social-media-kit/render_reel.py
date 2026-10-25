import os
import math
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
DURATION_SEC = 9
TOTAL_FRAMES = FPS * DURATION_SEC
OUT_PATH = "social-media-kit/streetdrip_launch_reel.mp4"

feed_img = Image.open('social-media-kit/launch-feed-post.jpg').convert('RGB')
story_img = Image.open('social-media-kit/launch-story.jpg').convert('RGB')
avatar_img = Image.open('social-media-kit/profile-avatar.jpg').convert('RGB')

# Load Fonts
f_impact = "/System/Library/Fonts/Supplemental/Impact.ttf"
f_arial_black = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
f_courier = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"

font_title_large = ImageFont.truetype(f_impact, 88)
font_title_huge = ImageFont.truetype(f_impact, 108)
font_subtitle = ImageFont.truetype(f_arial_black, 36)
font_hud = ImageFont.truetype(f_courier, 26)
font_hud_small = ImageFont.truetype(f_courier, 20)
font_cta = ImageFont.truetype(f_arial_black, 38)

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(OUT_PATH, fourcc, float(FPS), (W, H))

def create_gradient_bg(c1, c2):
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        ratio = y / float(H)
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr)

def draw_hud(draw, frame_idx):
    # Top HUD
    draw.text((60, 80), "STREETDRIP // VAULT ARCHIVE", font=font_hud, fill=(212, 255, 0))
    # Blinking REC dot
    if (frame_idx // 12) % 2 == 0:
        draw.ellipse([W - 170, 85, W - 150, 105], fill=(255, 50, 50))
    draw.text((W - 140, 80), "LIVE", font=font_hud, fill=(255, 255, 255))

    # Corner crosshairs
    acc_color = (212, 255, 0)
    L = 35
    # Top Left
    draw.line([(50, 130), (50 + L, 130)], fill=acc_color, width=2)
    draw.line([(50, 130), (50, 130 + L)], fill=acc_color, width=2)
    # Top Right
    draw.line([(W - 50, 130), (W - 50 - L, 130)], fill=acc_color, width=2)
    draw.line([(W - 50, 130), (W - 50, 130 + L)], fill=acc_color, width=2)
    # Bottom Left
    draw.line([(50, H - 130), (50 + L, H - 130)], fill=acc_color, width=2)
    draw.line([(50, H - 130), (50, H - 130 - L)], fill=acc_color, width=2)
    # Bottom Right
    draw.line([(W - 50, H - 130), (W - 50 - L, H - 130)], fill=acc_color, width=2)
    draw.line([(W - 50, H - 130), (W - 50, H - 130 - L)], fill=acc_color, width=2)

def draw_bottom_cta(draw, frame_idx):
    pulse = math.sin(frame_idx * 0.25) * 8
    btn_w, btn_h = 760, 96
    btn_x = (W - btn_w) // 2
    btn_y = H - 240 + int(pulse)
    
    # Glow border
    draw.rectangle([btn_x - 3, btn_y - 3, btn_x + btn_w + 3, btn_y + btn_h + 3], outline=(212, 255, 0), width=2)
    draw.rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], fill=(212, 255, 0))
    
    cta_text = "TAP LINK IN BIO ⚡ COP DROP 01"
    draw.text((W // 2, btn_y + 48), cta_text, font=font_cta, fill=(10, 10, 14), anchor="mm")
    
    draw.text((W // 2, H - 110), "STREETDRIP-FASHION.ONRENDER.COM", font=font_hud_small, fill=(234, 219, 206), anchor="mm")

base_grad = create_gradient_bg((25, 8, 14), (8, 8, 11))

print("Rendering 270 frames at 1080x1920 (30fps)...")

for f in range(TOTAL_FRAMES):
    # Scene 1: Frames 0 to 65 (The Hook)
    if f < 65:
        progress = f / 65.0
        frame = base_grad.copy()
        draw = ImageDraw.Draw(frame)
        
        # Subtle glowing circles
        r_glow = int(250 + 80 * math.sin(progress * math.pi))
        draw.ellipse([W//2 - r_glow, H//2 - r_glow - 50, W//2 + r_glow, H//2 + r_glow - 50], outline=(74, 18, 26), width=3)
        
        draw_hud(draw, f)
        
        # Giant hook text
        draw.text((W // 2, 600), "STOP WEARING", font=font_title_large, fill=(255, 255, 255), anchor="mm")
        
        # Neon highlight box
        box_w = 680
        draw.rectangle([(W - box_w)//2, 700, (W + box_w)//2, 840], fill=(212, 255, 0))
        draw.text((W // 2, 770), "BASIC FITS.", font=font_title_huge, fill=(10, 10, 14), anchor="mm")
        
        draw.text((W // 2, 940), "ARCHITECTURAL STREETWEAR", font=font_subtitle, fill=(234, 219, 206), anchor="mm")
        draw.text((W // 2, 1010), "THE NEW ERA IS LIVE", font=font_hud, fill=(212, 255, 0), anchor="mm")
        
        draw_bottom_cta(draw, f)

    # Scene 2: Frames 65 to 135 (Editorial Silhouette Reveal)
    elif f < 135:
        scene_f = f - 65
        progress = scene_f / 70.0
        
        # White flash on frame 65-66
        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            # Ken Burns zoom on feed_img
            zoom = 1.0 + progress * 0.15
            zw = int(W * zoom)
            zh = int(H * zoom)
            scaled = feed_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx, cy = zw // 2, zh // 2
            cropped = scaled.crop((cx - W//2, cy - H//2, cx + W//2, cy + H//2))
            frame = cropped
            
            # Dark overlay for text readability
            draw = ImageDraw.Draw(frame, "RGBA")
            draw.rectangle([0, 0, W, H], fill=(0, 0, 0, 90))
            draw.rectangle([0, 0, W, 220], fill=(5, 5, 8, 180))
            draw.rectangle([0, H - 360, W, H], fill=(5, 5, 8, 200))
            
            draw_hud(draw, f)
            
            # Badge
            draw.rectangle([100, 420, 480, 480], fill=(212, 255, 0))
            draw.text((290, 450), "DROP 01 // ARCHITECTURE", font=font_hud_small, fill=(10, 10, 14), anchor="mm")
            
            draw.text((100, 560), "BAGGY DENIM &", font=font_title_large, fill=(255, 255, 255))
            draw.text((100, 660), "BOXY CUTS.", font=font_title_huge, fill=(212, 255, 0))
            
            draw.text((100, 780), "• 280+ GSM Heavyweight Cotton", font=font_hud, fill=(234, 219, 206))
            draw.text((100, 830), "• Industrial Carpenter Details", font=font_hud, fill=(234, 219, 206))
            draw.text((100, 880), "• Relaxed Runway Drape", font=font_hud, fill=(234, 219, 206))
            
            draw_bottom_cta(draw, f)

    # Scene 3: Frames 135 to 205 (6 Pillars & 3D Interactive)
    elif f < 205:
        scene_f = f - 135
        progress = scene_f / 70.0
        
        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (212, 255, 0))
            draw = ImageDraw.Draw(frame)
        else:
            zoom = 1.05 + progress * 0.12
            zw = int(W * zoom)
            zh = int(H * zoom)
            scaled = story_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx, cy = zw // 2, zh // 2
            cropped = scaled.crop((cx - W//2, cy - H//2, cx + W//2, cy + H//2))
            frame = cropped
            
            draw = ImageDraw.Draw(frame, "RGBA")
            draw.rectangle([0, 0, W, H], fill=(0, 0, 0, 100))
            draw.rectangle([0, 0, W, 220], fill=(5, 5, 8, 180))
            draw.rectangle([0, H - 360, W, H], fill=(5, 5, 8, 200))
            
            draw_hud(draw, f)
            
            draw.text((W // 2, 430), "THE 6 PILLARS", font=font_title_large, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 510), "LOWERS • SHIRTS • TEES • JACKETS • SHOES • SHADES", font=font_hud, fill=(212, 255, 0), anchor="mm")
            
            # Interactive 3D highlight pill
            pill_y = 700 + int(math.sin(progress * math.pi * 2) * 15)
            draw.rectangle([W//2 - 380, pill_y, W//2 + 380, pill_y + 110], fill=(15, 10, 18, 220), outline=(212, 255, 0), width=2)
            draw.text((W // 2, pill_y + 40), "⚡ INTERACTIVE 3D VIEWER", font=font_subtitle, fill=(212, 255, 0), anchor="mm")
            draw.text((W // 2, pill_y + 80), "Inspect sneakers & accessories in 360°", font=font_hud_small, fill=(234, 219, 206), anchor="mm")
            
            draw_bottom_cta(draw, f)

    # Scene 4: Frames 205 to 270 (The Climax & Bio CTA)
    else:
        scene_f = f - 205
        progress = scene_f / 65.0
        
        frame = base_grad.copy()
        draw = ImageDraw.Draw(frame, "RGBA")
        
        draw_hud(draw, f)
        
        # Scaling Circular Avatar Emblem
        av_scale = min(1.0, 0.7 + progress * 0.4)
        av_size = int(380 * av_scale)
        scaled_av = avatar_img.resize((av_size, av_size), Image.Resampling.BILINEAR)
        
        # Circular mask
        mask = Image.new('L', (av_size, av_size), 0)
        draw_mask = ImageDraw.Draw(mask)
        draw_mask.ellipse([0, 0, av_size, av_size], fill=255)
        
        # Paste centered
        av_x = (W - av_size) // 2
        av_y = 480
        frame.paste(scaled_av, (av_x, av_y), mask)
        
        # Animated pulse ring around avatar
        r_pulse = av_size // 2 + int(15 + 10 * math.sin(progress * 10))
        draw.ellipse([W//2 - r_pulse, av_y + av_size//2 - r_pulse, W//2 + r_pulse, av_y + av_size//2 + r_pulse], outline=(212, 255, 0), width=3)
        
        draw.text((W // 2, 980), "THE VAULT IS OPEN.", font=font_title_large, fill=(255, 255, 255), anchor="mm")
        draw.text((W // 2, 1070), "STREETDRIP // DROP 01", font=font_subtitle, fill=(212, 255, 0), anchor="mm")
        draw.text((W // 2, 1140), "Curated Baggy Denim • Heavyweight Tees • 3D Models", font=font_hud_small, fill=(234, 219, 206), anchor="mm")
        
        draw_bottom_cta(draw, f)

    # Convert PIL Image (RGB) to OpenCV format (BGR)
    cv_frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
    writer.write(cv_frame)

writer.release()
print(f"🎉 REEL SUCCESSFULLY RENDERED: {OUT_PATH}")
