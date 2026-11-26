import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
STORE_URL = "https://cope-madero-takeaway.vercel.app/"

FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeuib.ttf") else r"C:\Windows\Fonts\arialbd.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeui.ttf") else r"C:\Windows\Fonts\arial.ttf"


def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def create_circular_logo(logo_img, size):
    logo = logo_img.resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size, size), fill=255)
    circular = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular.paste(logo, (0, 0), mask=mask)

    ring_size = size + 12
    ring = Image.new("RGBA", (ring_size, ring_size), (0, 0, 0, 0))
    ImageDraw.Draw(ring).ellipse((0, 0, ring_size - 1, ring_size - 1), fill=(0, 71, 187, 255), outline=(255, 184, 0, 255), width=4)
    ring.paste(circular, (6, 6), mask=circular)
    return ring


def make_rounded_photo(photo_path, target_w, target_h, radius=32):
    img = Image.open(photo_path).convert("RGBA")
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    dst_ratio = target_w / target_h
    if src_ratio > dst_ratio:
        new_h = target_h
        new_w = int(target_h * src_ratio)
    else:
        new_w = target_w
        new_h = int(target_w / src_ratio)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))

    mask = Image.new("L", (target_w, target_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, target_w, target_h), radius=radius, fill=255)
    out = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask=mask)
    return out


def make_qr_card(url, qr_size=210):
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    qr_img = Image.open(qr_path).convert("RGBA").resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    card_w = qr_size + 36
    card_h = qr_size + 78
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    d = ImageDraw.Draw(card)
    d.rounded_rectangle((0, 0, card_w - 1, card_h - 1), radius=22, fill=(255, 255, 255, 255), outline=(255, 184, 0, 255), width=4)
    card.paste(qr_img, (18, 16), mask=qr_img)

    f_qr = get_font(FONT_BOLD, 17)
    f_sub = get_font(FONT_REG, 13)
    d.text((card_w // 2, qr_size + 34), "ESCANEÁ Y PEDÍ", fill=(7, 13, 31, 255), font=f_qr, anchor="mm")
    d.text((card_w // 2, qr_size + 57), "Take Away · Puerto Madero", fill=(0, 71, 187, 255), font=f_sub, anchor="mm")
    return card


def generate_promo_plate(cfg):
    w, h = 1920, 1080
    canvas = Image.new("RGBA", (w, h), (7, 13, 31, 255))

    # Fondo degradado oscuro
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(h):
        r = int(7 + (y / h) * 10)
        g = int(13 + (y / h) * 14)
        b = int(31 + (y / h) * 28)
        g_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    canvas = Image.alpha_composite(canvas, grad)

    # Resplandor cálido/azul
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((980, -80, 2020, 1020), fill=cfg["glow_color"])
    gd.ellipse((-120, 580, 620, 1220), fill=(0, 71, 187, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(75))
    canvas = Image.alpha_composite(canvas, glow)

    draw = ImageDraw.Draw(canvas)

    # Logo Cope Burgers
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        logo_widget = create_circular_logo(Image.open(logo_path), 130)
        canvas.paste(logo_widget, (85, 70), mask=logo_widget)

    draw.text((242, 95), "COPE BURGERS", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 30))
    draw.text((242, 134), "PUERTO MADERO · MACACHA GÜEMES 260", fill=(255, 184, 0, 255), font=get_font(FONT_BOLD, 18))

    # Badge de Promo
    badge_x, badge_y = 85, 245
    draw.rounded_rectangle((badge_x, badge_y, badge_x + 410, badge_y + 48), radius=24, fill=cfg["badge_bg"], outline=cfg["badge_border"], width=2)
    draw.text((badge_x + 24, badge_y + 12), cfg["badge_text"], fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 19))

    # Título grande
    f_title = get_font(FONT_BOLD, 64)
    draw.text((85, 325), cfg["title_line1"], fill=(255, 255, 255, 255), font=f_title)
    draw.text((85, 402), cfg["title_line2"], fill=(255, 184, 0, 255), font=f_title)

    # Descripción clara de qué incluye
    f_desc = get_font(FONT_REG, 27)
    y_desc = 505
    for line in cfg["desc_lines"]:
        draw.text((85, y_desc), line, fill=(226, 232, 240, 255), font=f_desc)
        y_desc += 38

    # Caja destacada de HORARIO
    sched_y = 635
    draw.rounded_rectangle((85, sched_y, 940, sched_y + 115), radius=20, fill=(15, 23, 42, 245), outline=(255, 184, 0, 255), width=3)
    draw.text((115, sched_y + 18), "HORARIO DE LA PROMOCIÓN", fill=(255, 184, 0, 255), font=get_font(FONT_BOLD, 20))
    draw.text((115, sched_y + 52), cfg["schedule_big"], fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 38))

    # Precio gigante + Modalidad
    price_y = 795
    draw.rounded_rectangle((85, price_y, 440, price_y + 115), radius=22, fill=(22, 163, 74, 255), outline=(74, 222, 128, 255), width=3)
    draw.text((262, price_y + 24), "PRECIO PROMO", fill=(220, 252, 231, 255), font=get_font(FONT_BOLD, 17), anchor="mm")
    draw.text((262, price_y + 68), cfg["price_text"], fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 54), anchor="mm")

    draw.rounded_rectangle((465, price_y, 940, price_y + 115), radius=22, fill=(18, 28, 54, 255), outline=(56, 189, 248, 255), width=2)
    draw.text((495, price_y + 24), "EXCLUSIVO", fill=(56, 189, 248, 255), font=get_font(FONT_BOLD, 18))
    draw.text((495, price_y + 56), "Local o Take Away", fill=(255, 255, 255, 255), font=get_font(FONT_BOLD, 28))

    # Foto derecha de producto
    photo_x, photo_y, photo_w, photo_h = 1000, 75, 845, 860
    draw.rounded_rectangle((photo_x - 5, photo_y - 5, photo_x + photo_w + 5, photo_y + photo_h + 5), radius=36, fill=(255, 184, 0, 255))
    photo = make_rounded_photo(os.path.join(IMG_DIR, cfg["photo"]), photo_w, photo_h, radius=32)
    canvas.paste(photo, (photo_x, photo_y), mask=photo)

    # QR ABAJO A LA DERECHA (sobre la esquina inferior derecha)
    qr_card = make_qr_card(STORE_URL, qr_size=210)
    qr_x = w - qr_card.width - 42
    qr_y = h - qr_card.height - 38
    canvas.paste(qr_card, (qr_x, qr_y), mask=qr_card)

    # Footer izquierda
    draw.text((85, 985), "Cope Burgers Puerto Madero · Macacha Güemes 260 · Retirá sin filas", fill=(148, 163, 184, 255), font=get_font(FONT_REG, 22))

    out_path = os.path.join(BASE_DIR, cfg["output"])
    canvas.convert("RGB").save(out_path, format="PNG", quality=95)
    print("Generated:", out_path)


if __name__ == "__main__":
    promos = [
        {
            "output": "display-promo-cheeseburger-1920x1080.png",
            "photo": "promo-cheeseburger-papas.jpeg",
            "glow_color": (217, 119, 6, 65),
            "badge_bg": (180, 83, 9, 255),
            "badge_border": (251, 191, 36, 255),
            "badge_text": "•  PROMO ALMUERZO COPE  •",
            "title_line1": "CHEESEBURGER",
            "title_line2": "+ PAPAS FRITAS",
            "desc_lines": [
                "Cheese Burger Simple (110g) con cheddar fundido y mayo de la casa",
                "en pan de papa tostado + Porción de Papas Fritas Cope."
            ],
            "schedule_big": "LUNES A VIERNES · 12:00 A 18:00 HS",
            "price_text": "$10.900"
        },
        {
            "output": "display-promo-cervezas-1920x1080.png",
            "photo": "promo-cervezas-papas.jpeg",
            "glow_color": (0, 71, 187, 70),
            "badge_bg": (0, 71, 187, 255),
            "badge_border": (56, 189, 248, 255),
            "badge_text": "•  PROMO AFTER OFFICE  •",
            "title_line1": "2 CERVEZAS",
            "title_line2": "+ PAPAS FRITAS",
            "desc_lines": [
                "2 Cervezas Quilmes heladas (tirada/lata) bien refrescantes",
                "+ Porción de Papas Fritas Cope para compartir."
            ],
            "schedule_big": "LUNES A VIERNES · 18:00 A 20:00 HS",
            "price_text": "$10.000"
        }
    ]
    for p in promos:
        generate_promo_plate(p)
