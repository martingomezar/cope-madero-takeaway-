import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
ARTIFACTS_DIR = r"C:\Users\magak\.gemini\antigravity\brain\cc8295bc-ccc8-461c-875a-f3fa08cb9a7f"

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeuib.ttf") else r"C:\Windows\Fonts\arialbd.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeui.ttf") else r"C:\Windows\Fonts\arial.ttf"


def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def make_qr_card(qr_size=185):
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    qr_img = Image.open(qr_path).convert("RGBA").resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    card_w = qr_size + 32
    card_h = qr_size + 68
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=20, fill=(255, 255, 255, 250), outline=(245, 194, 75, 255), width=3)
    card.paste(qr_img, (16, 14), mask=qr_img)

    # Mini logo Cope en el centro del QR
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        mini_size = 38
        mini_logo = Image.open(logo_path).resize((mini_size, mini_size), Image.Resampling.LANCZOS).convert("RGBA")
        mini_mask = Image.new("L", (mini_size, mini_size), 0)
        ImageDraw.Draw(mini_mask).ellipse((0, 0, mini_size, mini_size), fill=255)
        frame = Image.new("RGBA", (mini_size + 8, mini_size + 8), (0, 0, 0, 0))
        ImageDraw.Draw(frame).ellipse((0, 0, mini_size + 7, mini_size + 7), fill=(255, 255, 255, 255), outline=(0, 71, 187, 255), width=2)
        frame.paste(mini_logo, (4, 4), mask=mini_mask)
        card.paste(frame, (16 + (qr_size - frame.width) // 2, 14 + (qr_size - frame.height) // 2), mask=frame)

    d.text((card_w // 2, qr_size + 31), "ESCANEÁ Y PEDÍ", fill=(15, 23, 42, 255), font=get_font(FONT_BOLD, 16), anchor="mm")
    d.text((card_w // 2, qr_size + 51), "Take Away · Cope", fill=(0, 71, 187, 255), font=get_font(FONT_BOLD, 13), anchor="mm")
    return card


def composite_poster(src_path, out_filename):
    bg = Image.open(src_path).convert("RGBA").resize((1920, 1080), Image.Resampling.LANCZOS)
    qr_card = make_qr_card(qr_size=185)

    # Sombra suave detrás del QR
    shadow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    qr_x = 1920 - qr_card.width - 42
    qr_y = 1080 - qr_card.height - 36
    ImageDraw.Draw(shadow).rounded_rectangle(
        (qr_x - 6, qr_y + 4, qr_x + qr_card.width + 6, qr_y + qr_card.height + 10),
        radius=24,
        fill=(0, 0, 0, 175)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    bg = Image.alpha_composite(bg, shadow)
    bg.paste(qr_card, (qr_x, qr_y), mask=qr_card)

    final = bg.convert("RGB")
    out_repo = os.path.join(BASE_DIR, out_filename)
    out_art = os.path.join(ARTIFACTS_DIR, out_filename)
    final.save(out_repo, format="PNG", quality=95)
    final.save(out_art, format="PNG", quality=95)
    print("Saved:", out_repo)


if __name__ == "__main__":
    composite_poster(
        os.path.join(ARTIFACTS_DIR, "cope_burgers_promo_almuerzo_clean_1795710051247.jpg"),
        "display-promo-cheeseburger-1920x1080.png"
    )
    composite_poster(
        os.path.join(ARTIFACTS_DIR, "cope_after_office_poster_v2_1795710059319.jpg"),
        "display-promo-cervezas-1920x1080.png"
    )
