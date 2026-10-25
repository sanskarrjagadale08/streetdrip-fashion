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
TOTAL_FRAMES = 552  # 18.4 seconds @ 30 FPS
SR = 44100
ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

# 1. Load Voice MP3 and convert to WAV
raw_voice_mp3 = 'social-media-kit/audio/natural_voice_17s_clean.mp3'
voice_wav = 'social-media-kit/audio/natural_voice_18s.wav'
subprocess.run([ffmpeg_exe, '-y', '-i', raw_voice_mp3, '-ar', str(SR), '-ac', '1', voice_wav], check=True)

# 2. Synthesize 130 BPM Trap Beat
print("Synthesizing 130 BPM trap beat...")
bpm = 130
beat_len = 60.0 / bpm
sixteenth = beat_len / 4.0
total_dur = TOTAL_FRAMES / float(FPS)
num_samples = int(total_dur * SR)
beat = np.zeros(num_samples, dtype=np.float32)

def make_kick():
    k_len = int(0.32 * SR)
    t = np.linspace(0, 0.32, k_len)
    freq = 135 * np.exp(-t * 22) + 45
    phase = 2 * np.pi * np.cumsum(freq) / SR
    kick = np.sin(phase) * np.exp(-t * 9)
    click = np.random.uniform(-0.15, 0.15, int(0.01 * SR)) * np.exp(-np.linspace(0, 5, int(0.01 * SR)))
    kick[:len(click)] += click
    return kick

def make_hihat():
    h_len = int(0.045 * SR)
    t = np.linspace(0, 0.045, h_len)
    noise = np.random.uniform(-0.3, 0.3, h_len)
    noise[1:] = noise[1:] - 0.7 * noise[:-1]
    return noise * np.exp(-t * 85)

def make_clap():
    c_len = int(0.16 * SR)
    t = np.linspace(0, 0.16, c_len)
    noise = np.random.uniform(-0.4, 0.4, c_len) * np.exp(-t * 28)
    body = np.sin(2 * np.pi * 220 * t) * np.exp(-t * 35) * 0.35
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

    # 808 sub bass notes
    for s_step, freq in [(0, 46.25), (4 * beat_len, 36.7)]:
        idx_sub = int((t_curr + s_step) * SR)
        sub_dur = int(3.5 * beat_len * SR)
        if idx_sub < num_samples:
            end_sub = min(idx_sub + sub_dur, num_samples)
            t_s = np.linspace(0, (end_sub - idx_sub) / SR, end_sub - idx_sub)
            beat[idx_sub:end_sub] += np.sin(2 * np.pi * freq * t_s) * np.exp(-t_s * 0.75) * 0.35

    t_curr += two_bars

# 3. Mix Master Audio with Voiceover Ducking
print("Mixing natural Indian voiceover with trap beat...")
_, voice_raw = wavfile.read(voice_wav)
voice_raw = voice_raw.astype(np.float32) / 32768.0

voice_track = np.zeros(num_samples, dtype=np.float32)
v_start = int(0.2 * SR)
v_len = min(len(voice_raw), num_samples - v_start)
voice_track[v_start:v_start + v_len] = voice_raw[:v_len]

# Compute envelope for sidechain ducking
voice_env = np.abs(voice_track)
w_size = int(0.08 * SR)
voice_env = np.convolve(voice_env, np.ones(w_size) / w_size, mode='same')
gain_duck = 1.0 - np.clip(voice_env * 2.5, 0, 0.45)

mixed = (beat * 0.40 * gain_duck) + (voice_track * 1.30)
peak = np.max(np.abs(mixed))
if peak > 0:
    mixed = mixed / peak * 0.95

# Fade out last 0.3s
fade_len = int(0.3 * SR)
mixed[-fade_len:] *= np.linspace(1, 0, fade_len)

final_audio_path = 'social-media-kit/audio/master_human_voice_18s.wav'
wavfile.write(final_audio_path, SR, np.clip(mixed * 32767, -32767, 32767).astype(np.int16))
print("Master audio prepared!")

# 4. Render Video Frames
print("Rendering 552 video frames at 1080x1920 (30 FPS)...")

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
font_title = ImageFont.truetype(f_impact, 78)
font_subtitle = ImageFont.truetype(f_arial_black, 36)
font_hud = ImageFont.truetype(f_courier, 24)
font_hud_sm = ImageFont.truetype(f_courier, 18)
font_caption = ImageFont.truetype(f_arial_black, 28)
font_cta = ImageFont.truetype(f_arial_black, 36)

temp_video = 'social-media-kit/temp_human_reel.mp4'
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
writer = cv2.VideoWriter(temp_video, fourcc, float(FPS), (W, H))

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
    draw.text((60, 75), "STREETDRIP // NATURAL VOICE EDITION", font=font_hud, fill=(212, 255, 0))
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
    bar_w, bar_h = 980, 88
    bar_x = (W - bar_w) // 2
    bar_y = H - 235
    draw.rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + bar_h], fill=(10, 6, 12, 235), outline=(212, 255, 0), width=2)
    draw.text((W // 2, bar_y + 44), text, font=font_caption, fill=(255, 255, 255), anchor="mm")

for f in range(TOTAL_FRAMES):
    # Scene 1: Frames 0 to 155 (0.0s - 5.2s) - The Conversational Hook
    if f < 155:
        prog = f / 155.0
        frame = base_bg.copy()
        draw = ImageDraw.Draw(frame, "RGBA")
        draw_hud(draw, f)

        # Pulse circle
        r_pulse = int(240 + 60 * math.sin(prog * math.pi * 3))
        draw.ellipse([W//2 - r_pulse, H//2 - r_pulse - 60, W//2 + r_pulse, H//2 + r_pulse - 60], outline=(74, 18, 26, 180), width=3)

        draw.text((W // 2, 450), "STOP WEARING", font=font_huge, fill=(255, 255, 255), anchor="mm")

        # Neon Highlight Box
        b_w = 820
        draw.rectangle([(W - b_w)//2, 520, (W + b_w)//2, 650], fill=(212, 255, 0))
        draw.text((W // 2, 585), "BASIC FITS, BHAI.", font=font_huge, fill=(10, 8, 14), anchor="mm")

        draw.text((W // 2, 770), "INDIA'S NEWEST STREETWEAR ARCHIVE", font=font_subtitle, fill=(234, 219, 206), anchor="mm")
        draw.text((W // 2, 840), "STREETDRIP IS OFFICIALLY LIVE // 2026", font=font_hud, fill=(212, 255, 0), anchor="mm")

        # Floating brand avatar emblem
        av_size = 290
        scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
        frame.paste(scaled_av, ((W - av_size)//2, 930), mask)
        draw.ellipse([(W - av_size)//2 - 10, 930 - 10, (W + av_size)//2 + 10, 930 + av_size + 10], outline=(212, 255, 0, 190), width=2)

        draw_subtitles(draw, '"Stop wearing basic fits, bhai. Streetdrip is live!"')

    # Scene 2: Frames 155 to 295 (5.2s - 9.8s) - Quality & Silhouette Drape
    elif f < 295:
        scene_f = f - 155
        prog = scene_f / 140.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            zoom = 1.0 + prog * 0.16
            zw, zh = int(W * zoom), int(H * zoom)
            scaled = feed_img.resize((zw, zh), Image.Resampling.BILINEAR)
            cx, cy = zw // 2, zh // 2
            frame = scaled.crop((cx - W//2, cy - H//2, cx + W//2, cy + H//2))
            draw = ImageDraw.Draw(frame, "RGBA")

            draw.rectangle([0, 0, W, H], fill=(0, 0, 0, 90))
            draw.rectangle([0, 0, W, 220], fill=(5, 5, 8, 190))
            draw.rectangle([0, H - 320, W, H], fill=(5, 5, 8, 210))
            draw_hud(draw, f)

            # Feature Badge
            draw.rectangle([80, 420, 540, 480], fill=(212, 255, 0))
            draw.text((310, 450), "ARCHITECTURAL QUALITY", font=font_hud_sm, fill=(10, 8, 14), anchor="mm")

            draw.text((80, 540), "HEAVYWEIGHT 280 GSM TEES", font=font_title, fill=(255, 255, 255))
            draw.text((80, 630), "& BAGGY CARPENTER DENIM", font=font_title, fill=(212, 255, 0))

            points = ["• 100% Combed Heavy Cotton", "• Raw Relaxed Silhouette Stacking", "• Tailored for Genuine Volume"]
            for p_idx, pt in enumerate(points):
                draw.text((80, 750 + p_idx * 55), pt, font=font_hud, fill=(234, 219, 206))

            draw_subtitles(draw, '"Get heavy 280 GSM tees and baggy carpenter denim."')

    # Scene 3: Frames 295 to 405 (9.8s - 13.5s) - Interactive 3D Technology
    elif f < 405:
        scene_f = f - 295
        prog = scene_f / 110.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (212, 255, 0))
            draw = ImageDraw.Draw(frame)
        else:
            zoom = 1.05 + prog * 0.14
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
            draw.text((W // 2, 480), "360° DIGITAL SNEAKER & FIT ROTATION", font=font_hud, fill=(212, 255, 0), anchor="mm")

            card_pulse = int(math.sin(prog * math.pi * 3) * 10)
            card_y = 660 + card_pulse
            draw.rectangle([W//2 - 420, card_y, W//2 + 420, card_y + 190], fill=(15, 6, 12, 240), outline=(212, 255, 0), width=3)
            draw.text((W // 2, card_y + 60), "⚡ 360° INTERACTIVE PREVIEW", font=font_subtitle, fill=(212, 255, 0), anchor="mm")
            draw.text((W // 2, card_y + 120), "Inspect textures, fits, and soles before you buy", font=font_hud_sm, fill=(234, 219, 206), anchor="mm")

            draw_subtitles(draw, '"Inspect pieces in interactive 3D."')

    # Scene 4: Frames 405 to 552 (13.5s - 18.4s) - The Vault Open & Direct CTA
    else:
        scene_f = f - 405
        prog = scene_f / 147.0

        if scene_f < 3:
            frame = Image.new('RGB', (W, H), (255, 255, 255))
            draw = ImageDraw.Draw(frame)
        else:
            frame = base_bg.copy()
            draw = ImageDraw.Draw(frame, "RGBA")
            draw_hud(draw, f)

            # Central Hero Avatar
            cx, cy = W // 2, 530
            av_size = 470
            scaled_av, mask = prepare_circular_avatar(avatar_raw, av_size)
            frame.paste(scaled_av, (cx - av_size//2, cy - av_size//2), mask)

            r_halo = av_size // 2 + 15
            draw.ellipse([cx - r_halo, cy - r_halo, cx + r_halo, cy + r_halo], outline=(212, 255, 0, 230), width=4)

            draw.text((W // 2, 880), "DROP 01 IS UNLOCKED.", font=font_huge, fill=(255, 255, 255), anchor="mm")
            draw.text((W // 2, 970), "STREETDRIP // OFFICIAL STORE", font=font_subtitle, fill=(212, 255, 0), anchor="mm")

            # Big Pulsing Button
            btn_pulse = int(math.sin(prog * 12) * 6)
            btn_w, btn_h = 820, 110
            btn_x = (W - btn_w) // 2
            btn_y = 1090 + btn_pulse

            draw.rectangle([btn_x - 3, btn_y - 3, btn_x + btn_w + 3, btn_y + btn_h + 3], outline=(212, 255, 0), width=2)
            draw.rectangle([btn_x, btn_y, btn_x + btn_w, btn_y + btn_h], fill=(212, 255, 0))
            draw.text((W // 2, btn_y + 55), "⚡ TAP LINK IN BIO TO COP ⚡", font=font_cta, fill=(10, 8, 14), anchor="mm")

            draw.text((W // 2, 1250), "STREETDRIP-FASHION.ONRENDER.COM", font=font_hud, fill=(234, 219, 206), anchor="mm")
            draw.text((W // 2, 1300), "ALL-INDIA DISPATCH • LIMITED EDITION DROP", font=font_hud_sm, fill=(212, 255, 0), anchor="mm")

            draw_subtitles(draw, '"Drop 01 is unlocked. Tap the link in bio!"')

    cv_frame = cv2.cvtColor(np.array(frame), cv2.COLOR_RGB2BGR)
    writer.write(cv_frame)

writer.release()
print("Frames rendered.")

# 5. Mux with FFmpeg
final_output = 'social-media-kit/streetdrip_human_voice_reel_18s.mp4'
cmd = [
    ffmpeg_exe, '-y',
    '-i', temp_video,
    '-i', final_audio_path,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    final_output
]

subprocess.run(cmd, check=True)
if os.path.exists(temp_video):
    os.remove(temp_video)

print(f"🎉 MASTER REEL WITH NATURAL HUMAN VOICE READY: {final_output}")
