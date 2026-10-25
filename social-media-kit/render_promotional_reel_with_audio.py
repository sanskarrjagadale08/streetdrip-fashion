import os
import math
import subprocess
import cv2
import numpy as np
import scipy.io.wavfile as wavfile
from PIL import Image, ImageDraw, ImageFont
import imageio_ffmpeg

W, H = 1080, 1920
FPS = 30
TOTAL_FRAMES = 555  # 18.5 seconds @ 30 FPS
SR = 44100

os.makedirs('social-media-kit/audio', exist_ok=True)

# 1. Synthesize Audio
print("1. Synthesizing voiceover with Indian accent (Rishi en_IN)...")
script_parts = [
    ("Stop wearing basic fits. India's top streetwear platform, Streetdrip, is live.", 225),
    ("Get 280 GSM heavyweight tees, baggy carpenter denim, and Korean slacks.", 220),
    ("Inspect every outfit in 360-degree interactive 3D before buying.", 225),
    ("Drop 01 is unlocked. Tap the link in bio to cop yours now.", 220)
]

for i, (text, rate) in enumerate(script_parts):
    wav_path = f'social-media-kit/audio/part_{i+1}.wav'
    subprocess.run(['say', '-v', 'Rishi', '-r', str(rate), text, '-o', wav_path, '--data-format=LEI16@44100'], check=True)

# 2. Synthesize Trap Beat
print("2. Synthesizing background trap beat at 130 BPM...")
bpm = 130
beat_len = 60.0 / bpm
sixteenth = beat_len / 4.0
total_dur = TOTAL_FRAMES / float(FPS)
num_samples = int(total_dur * SR)
beat = np.zeros(num_samples, dtype=np.float32)

def make_kick():
    k_len = int(0.35 * SR)
    t = np.linspace(0, 0.35, k_len)
    freq = 140 * np.exp(-t * 22) + 45
    phase = 2 * np.pi * np.cumsum(freq) / SR
    kick = np.sin(phase) * np.exp(-t * 9)
    click = np.random.uniform(-0.15, 0.15, int(0.01 * SR)) * np.exp(-np.linspace(0, 5, int(0.01 * SR)))
    kick[:len(click)] += click
    return kick

def make_hihat():
    h_len = int(0.05 * SR)
    t = np.linspace(0, 0.05, h_len)
    noise = np.random.uniform(-0.3, 0.3, h_len)
    noise[1:] = noise[1:] - 0.7 * noise[:-1]
    return noise * np.exp(-t * 80)

def make_clap():
    c_len = int(0.18 * SR)
    t = np.linspace(0, 0.18, c_len)
    noise = np.random.uniform(-0.4, 0.4, c_len) * np.exp(-t * 25)
    body = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 35) * 0.4
    return noise + body

kick = make_kick()
hihat = make_hihat()
clap = make_clap()

two_bars = 8 * beat_len
t_curr = 0.0
while t_curr < total_dur:
    for b in range(8):
        t_beat = t_curr + b * beat_len
        idx = int(t_beat * SR)
        if idx < num_samples:
            if b in [0, 4]:
                end = min(idx + len(kick), num_samples)
                beat[idx:end] += kick[:end-idx] * 0.7
        if b in [2, 6]:
            idx_clap = int(t_beat * SR)
            if idx_clap < num_samples:
                end = min(idx_clap + len(clap), num_samples)
                beat[idx_clap:end] += clap[:end-idx_clap] * 0.55
        for s in range(4):
            idx_hat = int((t_beat + s * sixteenth) * SR)
            if idx_hat < num_samples:
                end = min(idx_hat + len(hihat), num_samples)
                vol = 0.35 if s == 0 else 0.2
                beat[idx_hat:end] += hihat[:end-idx_hat] * vol

    # 808 sub bass
    for s_step, freq in [(0, 46.25), (4 * beat_len, 36.7)]:
        idx_sub = int((t_curr + s_step) * SR)
        sub_dur = int(3.5 * beat_len * SR)
        if idx_sub < num_samples:
            end_sub = min(idx_sub + sub_dur, num_samples)
            t_s = np.linspace(0, (end_sub - idx_sub) / SR, end_sub - idx_sub)
            beat[idx_sub:end_sub] += np.sin(2 * np.pi * freq * t_s) * np.exp(-t_s * 0.8) * 0.35

    t_curr += two_bars

# 3. Mix Voiceover + Beat with Ducking
print("3. Mixing voiceover and beat with sidechain ducking...")
voices = []
for i in range(1, 5):
    _, v = wavfile.read(f'social-media-kit/audio/part_{i}.wav')
    if len(v.shape) > 1:
        v = np.mean(v, axis=1)
    voices.append(v.astype(np.float32) / 32768.0)

# Precise start times (in seconds)
# Part 1: 0.2s - 4.8s
# Part 2: 5.0s - 10.2s
# Part 3: 10.4s - 14.8s
# Part 4: 15.0s - 18.3s
offsets = [0.2, 4.9, 10.3, 14.9]
voice_track = np.zeros(num_samples, dtype=np.float32)

for i in range(4):
    start_idx = int(offsets[i] * SR)
    v_data = voices[i]
    end_idx = min(start_idx + len(v_data), num_samples)
    voice_track[start_idx:end_idx] = v_data[:end_idx - start_idx]

# Sidechain ducking
voice_env = np.abs(voice_track)
w_size = int(0.08 * SR)
voice_env = np.convolve(voice_env, np.ones(w_size) / w_size, mode='same')
gain_duck = 1.0 - np.clip(voice_env * 2.8, 0, 0.5)

mixed = (beat * 0.42 * gain_duck) + (voice_track * 1.25)
peak = np.max(np.abs(mixed))
if peak > 0:
    mixed = mixed / peak * 0.95

# Fade out last 0.3s
fade_len = int(0.3 * SR)
mixed[-fade_len:] *= np.linspace(1, 0, fade_len)

final_wav_path = 'social-media-kit/audio/promo_audio_18s.wav'
wavfile.write(final_wav_path, SR, np.clip(mixed * 32767, -32767, 32767).astype(np.int16))
print(f"Master audio saved to {final_wav_path}")

# 4. Render Video Frames
print("4. Rendering 555 video frames at 1080x1920 (30 FPS)...")

feed_img = Image.open('social-media-kit/launch-feed-post.jpg').convert('RGB')
story_img = Image.open('social-media-kit/launch-story.jpg').convert('RGB')
avatar_raw = Image.open('social-media-kit/profile-avatar.jpg').convert('RGB')

def prepare_circular_avatar(img, size):
    resized = img.resize((size, size), Image.Resampling.LANCZOS)
    mask = Image.new('L', (size, size), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse([0, 0, size, size], fill=255)
    return resized, mask

f_impact = "/System/Library/Fonts/Supplemental/Impact.ttf"
f_arial_black = "/System/Library/Fonts/Supplemental/Arial Black.ttf"
f_courier = "/System/Library/Fonts/Supplemental/Courier New Bold.ttf"

font_huge = ImageFont.truetype(f_impact, 92)
font_title = ImageFont.truetype(f_impact, 76)
font_subtitle = ImageFont.truetype(f_arial_black, 34)
font_hud = ImageFont.truetype(f_courier, 24)
font_hud_sm = ImageFont.truetype(f_courier, 18)
font_caption = ImageFont.truetype(f_arial_black, 26)
font_cta = ImageFont.truetype(f_arial_black, 36)

temp_video_path = 'social-media-kit/temp_video.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(temp_video_path, fourcc, float(FPS), (W, H))

def create_gradient(c1, c2):
    arr = np.zeros((H, W, 3), dtype=np.uint8)
    for y in range(H):
        ratio = y / float(H)
        r = int(c1[0] * (1 - ratio) + c2[0] * ratio)
        g = int(c1[1] * (1 - ratio) + c2[1] * ratio)
        b = int(c1[2] * (1 - ratio) + c2[2] * ratio)
        arr[y, :] = [r, g, b]
    return Image.fromarray(arr)

base_bg = create_gradient((28, 8, 15), (7, 6, 10))

def draw_hud(draw, f_idx):
    draw.text((60, 75), "STREETDRIP // PROMO EDITION", font=font_hud, fill=(212, 255, 0))
    if (f_idx // 10) % 2 == 0:
        draw.ellipse([W - 170, 80, W - 150, 100], fill=(255, 40, 40))
    draw.text((W - 140, 75), "LIVE", font=font_hud, fill=(255, 255, 255))

    L = 30
    acc = (212, 255, 0)
    draw.line([(50, 120), (50 + L, 120)], fill=acc, width=2)
    draw.line([(50, 120), (50, 120 + L)], fill=acc, width=2)
    draw.line([(W - 50, 120), (W - 50 - L, 120)], fill=acc, width=2)
    draw.line([(W - 50, 120), (W - 50, 120 + L)], fill=acc, width=2)
    draw.line([(50, H - 120), (50 + L, H - 120)], fill=acc, width=2)
    draw.line([(50, H - 120), (50, H - 120 - L)], fill=acc, width=2)
    draw.line([(W - 50, H - 120), (W - 50 - L, H - 120)], fill=acc, width=2)
    draw.line([(W - 50, H - 120), (W - 50, H - 120 - L)], fill=acc, width=2)

def draw_subtitles(draw, text):
    # Burned-in kinetic subtitle bar
    bar_w, bar_h = 960, 84
    bar_x = (W - bar_w) // 2
    bar_y = H - 230
    draw.rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], fill=(10, 6, 12, 230), outline=(212, 255, 0), width=2)
    draw.text((W // 2, bar_y + 42), text, font=font_caption, fill=(255, 255, 255), anchor="mm")

for f in range(TOTAL_FRAMES):
    # Scene 1: Frames 0 to 145 (0.0s - 4.8s) - The Hook
    if f < 145:
        prog = f / 145.0
        frame = base_bg.copy()
        draw = ImageDraw.Draw(frame, "RGBA")
        draw_hud(draw, f)

        # Pulse circle
        r_pulse = int(240 + 60 * math.sin(prog * math.pi * 3))
        draw.ellipse([W//2 - r_pulse, H//2 - r_pulse - 60, W//2 + r_pulse, H//2 + r_pulse - 60], outline=(74, 18, 26, 180), width=3)

        draw.text((W // 2, 460), "STOP WEARING", font=font_huge, fill=(255, 255, 255), anchor="mm")

        # Neon Banner
        b_w = 780
        draw.rectangle([(W - b_w)//2, 530, (W + b_w)//2, 660], fill=(212, 255, 0))
        draw.text((W // 2, 595), "BASIC FITS.", font=font_huge, fill=(10, 8, 14), anchor="mm")

        draw.text((W // 2, 780), "INDIA'S NEWEST STREETWEAR ARCHIVE", font=font_subtitle, fill=(234, 219, 206), anchor="mm")
        draw.text((W // 2, 850), "OFFICIALLY UNLOCKED // 2026", font=font_hud, fill=(212, 255, 0), anchor="mm")

        # Floating brand emblem
        av_size = 280
        scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
        frame.paste(scaled_av, ((W - av_size)//2, 940), mask)
        draw.ellipse([(W - av_size)//2 - 10, 940 - 10, (W + av_size)//2 + 10, 940 + av_size + 10], outline=(212, 255, 0, 180), width=2)

        draw_subtitles(draw, '"Stop wearing basic fits. India\'s top streetwear platform, Streetdrip, is live."')

    # Scene 2: Frames 145 to 305 (4.8s - 10.2s) - Quality & Silhouettes
    elif f < 305:
        scene_f = f - 145
        prog = scene_f / 160.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            # Zoom into feed_img
            zoom = 1.0 + prog * 0.18
            zw, zh = int(W * zoom), int(H * zoom)
            scaled = feed_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx, cy = zw // 2, zh // 2
            frame = scaled.crop((cx - W//2, cy - H//2, cx + W//2, cy + H//2))
            draw = ImageDraw.Draw(frame, "RGBA")

            draw.rectangle([0, 0, W, H], fill=(0, 0, 0, 90))
            draw.rectangle([0, 0, W, 220], fill=(5, 5, 8, 190))
            draw.rectangle([0, H - 320, W, H], fill=(5, 5, 8, 210))
            draw_hud(draw, f)

            # Feature Cards
            draw.rectangle([80, 420, 520, 480], fill=(212, 255, 0))
            draw.text((300, 450), "ARCHITECTURAL QUALITY", font=font_hud_sm, fill=(10, 8, 14), anchor="mm")

            draw.text((80, 540), "HEAVYWEIGHT 280 GSM", font=font_title, fill=(255, 255, 255))
            draw.text((80, 630), "BAGGY CARPENTER DENIM", font=font_title, fill=(212, 255, 0))
            draw.text((80, 720), "& KOREAN SLACKS.", font=font_title, fill=(255, 255, 255))

            # Feature points
            points = ["• True Oversized Silhouette Drape", "• 3-D Pocket Tactical Styling", "• Tailored for Real Proportions"]
            for p_idx, pt in enumerate(points):
                draw.text((80, 830 + p_idx * 55), pt, font=font_hud, fill=(234, 219, 206))

            draw_subtitles(draw, '"Get 280 GSM heavyweight tees, baggy carpenter denim, and Korean slacks."')

    # Scene 3: Frames 305 to 440 (10.2s - 14.7s) - 3D Interactive Feature
    elif f < 440:
        scene_f = f - 305
        prog = scene_f / 135.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (212, 255, 0))
            draw = ImageDraw.Draw(frame)
        else:
            zoom = 1.05 + prog * 0.15
            zw, zh = int(W * zoom), int(H * zoom)
            scaled = story_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx, cy = zw // 2, zh // 2
            frame = scaled.crop((cx - W//2, cy - H//2, cx + W//2, cy + H//2))
            draw = ImageDraw.Draw(frame, "RGBA")

            draw.rectangle([0, 0, W, H], fill=(0, 0, 0, 100))
            draw.rectangle([0, 0, W, 220], fill=(5, 5, 8, 190))
            draw.rectangle([0, H - 320, W, H], fill=(5, 5, 8, 210))
            draw_hud(draw, f)

            draw.text((W // 2, 400), "INSPECT IN 3D", font=font_huge, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 480), "360° INTERACTIVE DIGITAL VAULT", font=font_hud, fill=(212, 255, 0), anchor="mm")

            # 3D interactive highlight box
            box_pulse = int(math.sin(prog * math.pi * 3) * 12)
            card_y = 660 + box_pulse
            draw.rectangle([W//2 - 420, card_y, W//2 + 420, card_y + 190], fill=(15, 6, 12, 240), outline=(212, 255, 0), width=3)
            draw.text((W // 2, card_y + 60), "⚡ ROTATE SNEAKERS & FITS IN 360°", font=font_subtitle, fill=(212, 255, 0), anchor="mm")
            draw.text((W // 2, card_y + 120), "Zoom fabric textures and silhouettes before you buy", font=font_hud_sm, fill=(234, 219, 206), anchor="mm")

            draw_subtitles(draw, '"Inspect every outfit in 360-degree interactive 3D before buying."')

    # Scene 4: Frames 440 to 555 (14.7s - 18.5s) - Grand Call To Action
    else:
        scene_f = f - 440
        prog = scene_f / 115.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            frame = base_bg.copy()
            draw = ImageDraw.Draw(frame, "RGBA")
            draw_hud(draw, f)

            # Hero Avatar with rotating pulse
            cx, cy = W // 2, 530
            av_size = 460
            scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
            frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

            r_halo = av_size // 2 + 15
            draw.ellipse([cx - r_halo, cy - r_halo, cx + r_halo, cy + r_halo], outline=(212, 255, 0, 230), width=4)

            draw.text((W // 2, 880), "DROP 01 IS UNLOCKED.", font=font_huge, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 970), "STREETDRIP // OFFICIAL STORE", font=font_subtitle, fill=(212, 255, 0), anchor="mm")

            # Big Pulsing CTA Button
            btn_pulse = int(math.sin(prog * 12) * 6)
            btn_w, btn_h = 820, 110
            btn_x = (W - btn_w) // 2
            btn_y = 1100 + btn_pulse

            draw.rectangle([btn_x - 3, btn_y - 3, btn_x + btn_w + 3, btn_y + btn_h + 3], outline=(212, 255, 0), width=2)
            draw.rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], fill=(212, 255, 0))
            draw.text((W // 2, btn_y + 55), "⚡ TAP LINK IN BIO TO COP ⚡", font=font_cta, fill=(10, 8, 14), anchor="mm")

            draw.text((W // 2, 1260), "STREETDRIP-FASHION.ONRENDER.COM", font=font_hud, fill=(234, 219, 206), anchor="mm")
            draw.text((W // 2, 1310), "WORLDWIDE DISPATCH • ADMIN CURATION ACTIVE", font=font_hud_sm, fill=(212, 255, 0), anchor="mm")

            draw_subtitles(draw, '"Drop 01 is unlocked. Tap the link in bio to cop yours now."')

    # Convert to OpenCV frame
    cv_frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
    writer.write(cv_frame)

writer.release()
print("Video frames rendered successfully.")

# 5. Mux Video + Audio with FFmpeg
print("5. Muxing video and audio with FFmpeg into final reel...")
final_output = 'social-media-kit/streetdrip_promotional_reel_18s.mp4'
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

cmd = [
    ffmpeg_exe, '-y',
    '-i', temp_video_path,
    '-i', final_wav_path,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    final_output
]

subprocess.run(cmd, check=True)
if os.path.exists(temp_video_path):
    os.remove(temp_video_path)

print(f"🎉 FINAL PROMOTIONAL REEL READY: {final_output}")
