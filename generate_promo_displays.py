import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
ARTIFACTS_DIR = r"C:\Users\magak\.gemini\antigravity\brain\cc8295bc-ccc8-461c-875a-f3fa08cb9a7f"
UPLOADED_DIR = os.path.join(ARTIFACTS_DIR, ".user_uploaded")

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeuib.ttf") else r"C:\Windows\Fonts\arialbd.ttf"


def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def remove_white_bg(img_path, thresh=14, clean_bottom_shadow=False):
    """Elimina el fondo blanco de estudio desde las 4 esquinas usando floodfill nativo de Pillow."""
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    sentinel = (255, 0, 255, 0)
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(img, corner, sentinel, thresh=thresh)
        except Exception:
            pass

    if clean_bottom_shadow:
        # Limpiar islas de sombra gris clara debajo del producto (parte inferior)
        px = img.load()
        y_start = int(h * 0.72)
        for y in range(y_start, h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a > 0 and r > 215 and g > 215 and b > 215 and (max(r, g, b) - min(r, g, b)) < 16:
                    px[x, y] = (0, 0, 0, 0)

    r, g, b, a = img.split()
    a = a.filter(ImageFilter.MinFilter(3))
    a = a.filter(ImageFilter.GaussianBlur(1.2))
    clean = Image.merge("RGBA", (r, g, b, a))

    bbox = clean.getbbox()
    if bbox:
        clean = clean.crop(bbox)
    return clean


def paste_with_contact_shadow(canvas, obj_rgba, x, y, target_h, shadow_strength=185):
    scale = target_h / obj_rgba.height
    target_w = int(obj_rgba.width * scale)
    obj = obj_rgba.resize((target_w, target_h), Image.Resampling.LANCZOS)

    # Leve calidez ambiental para integrar con la luz de barra
    obj = ImageEnhance.Color(obj).enhance(1.04)

    # Sombra de contacto ovalada en la base del objeto sobre la mesa
    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    pad_x = int(target_w * 0.08)
    base_y = y + target_h
    sd.ellipse(
        (x - pad_x, base_y - int(target_h * 0.07), x + target_w + pad_x, base_y + int(target_h * 0.06)),
        fill=(0, 0, 0, shadow_strength)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(obj, (x, y), mask=obj)
    return canvas


def make_qr_card(qr_size=175):
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    qr_img = Image.open(qr_path).convert("RGBA").resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    card_w = qr_size + 30
    card_h = qr_size + 64
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=20, fill=(255, 255, 255, 250), outline=(245, 194, 75, 255), width=3)
    card.paste(qr_img, (15, 13), mask=qr_img)

    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        mini_size = 36
        mini_logo = Image.open(logo_path).resize((mini_size, mini_size), Image.Resampling.LANCZOS).convert("RGBA")
        mini_mask = Image.new("L", (mini_size, mini_size), 0)
        ImageDraw.Draw(mini_mask).ellipse((0, 0, mini_size, mini_size), fill=255)
        frame = Image.new("RGBA", (mini_size + 8, mini_size + 8), (0, 0, 0, 0))
        ImageDraw.Draw(frame).ellipse((0, 0, mini_size + 7, mini_size + 7), fill=(255, 255, 255, 255), outline=(0, 71, 187, 255), width=2)
        frame.paste(mini_logo, (4, 4), mask=mini_mask)
        card.paste(frame, (15 + (qr_size - frame.width) // 2, 13 + (qr_size - frame.height) // 2), mask=frame)

    d.text((card_w // 2, qr_size + 29), "ESCANEÁ Y PEDÍ", fill=(15, 23, 42, 255), font=get_font(FONT_BOLD, 15), anchor="mm")
    d.text((card_w // 2, qr_size + 48), "Take Away · Cope", fill=(0, 71, 187, 255), font=get_font(FONT_BOLD, 13), anchor="mm")
    return card


def add_qr_bottom_right(canvas):
    qr_card = make_qr_card(qr_size=175)
    qr_x = 1920 - qr_card.width - 36
    qr_y = 1080 - qr_card.height - 32
    shadow = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (qr_x - 6, qr_y + 4, qr_x + qr_card.width + 6, qr_y + qr_card.height + 10),
        radius=24,
        fill=(0, 0, 0, 185)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(14))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(qr_card, (qr_x, qr_y), mask=qr_card)
    return canvas


def build_cheeseburger_poster():
    bg_path = os.path.join(ARTIFACTS_DIR, "cope_burgers_promo_almuerzo_bg_final_1795711243480.jpg")
    burger_path = os.path.join(UPLOADED_DIR, "media_1795710876375_97630a98.jpg")
    fries_path = os.path.join(UPLOADED_DIR, "media_1795710884630_1819e0b5.jpg")

    canvas = Image.open(bg_path).convert("RGBA").resize((1920, 1080), Image.Resampling.LANCZOS)
    burger = remove_white_bg(burger_path, thresh=14, clean_bottom_shadow=True)
    fries = remove_white_bg(fries_path, thresh=12, clean_bottom_shadow=True)

    # Posicionar Papas Cope reales atrás a la derecha y Cheeseburger real adelante
    canvas = paste_with_contact_shadow(canvas, fries, x=1380, y=245, target_h=500, shadow_strength=175)
    canvas = paste_with_contact_shadow(canvas, burger, x=910, y=385, target_h=385, shadow_strength=200)
    canvas = add_qr_bottom_right(canvas)

    final = canvas.convert("RGB")
    for dst in [
        os.path.join(BASE_DIR, "display-promo-cheeseburger-1920x1080.png"),
        os.path.join(ARTIFACTS_DIR, "display-promo-cheeseburger-1920x1080.png")
    ]:
        final.save(dst, format="PNG", quality=95)
    print("Saved Cheeseburger poster with real photos")


def build_cervezas_poster():
    bg_path = os.path.join(ARTIFACTS_DIR, "after_office_bar_poster_bg_v2_1795711222273.jpg")
    beers_path = os.path.join(ARTIFACTS_DIR, "beers_only_1795573574397.jpg")
    fries_path = os.path.join(UPLOADED_DIR, "media_1795710884630_1819e0b5.jpg")

    canvas = Image.open(bg_path).convert("RGBA").resize((1920, 1080), Image.Resampling.LANCZOS)
    beers = remove_white_bg(beers_path, thresh=8, clean_bottom_shadow=True)
    fries = remove_white_bg(fries_path, thresh=12, clean_bottom_shadow=True)

    # Posicionar las 2 cervezas reales y las Papas Cope reales sobre la barra de pizarra
    canvas = paste_with_contact_shadow(canvas, beers, x=940, y=190, target_h=515, shadow_strength=185)
    canvas = paste_with_contact_shadow(canvas, fries, x=1420, y=260, target_h=455, shadow_strength=195)
    canvas = add_qr_bottom_right(canvas)

    final = canvas.convert("RGB")
    for dst in [
        os.path.join(BASE_DIR, "display-promo-cervezas-1920x1080.png"),
        os.path.join(ARTIFACTS_DIR, "display-promo-cervezas-1920x1080.png")
    ]:
        final.save(dst, format="PNG", quality=95)
    print("Saved Cervezas poster with real photos")


if __name__ == "__main__":
    build_cheeseburger_poster()
    build_cervezas_poster()
