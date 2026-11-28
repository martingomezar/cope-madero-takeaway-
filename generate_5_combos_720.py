import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
ARTIFACTS_DIR = r"C:\Users\magak\.gemini\antigravity\brain\cc8295bc-ccc8-461c-875a-f3fa08cb9a7f"


def remove_white_bg(img_path, thresh=14, clean_bottom=True):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    # Recortar 8px de borde por si la foto original tiene marco lateral (ej. 7up.webp)
    if w > 40 and h > 40:
        img = img.crop((8, 8, w - 8, h - 8))
        w, h = img.size
    sentinel = (255, 0, 255, 0)
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(img, corner, sentinel, thresh=thresh)
        except Exception:
            pass

    if clean_bottom:
        px = img.load()
        for y in range(int(h * 0.72), h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a > 0 and r > 215 and g > 215 and b > 215 and (max(r, g, b) - min(r, g, b)) < 16:
                    px[x, y] = (0, 0, 0, 0)

    r, g, b, a = img.split()
    a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.0))
    clean = Image.merge("RGBA", (r, g, b, a))
    bbox = clean.getbbox()
    return clean.crop(bbox) if bbox else clean


def paste_with_studio_shadow(canvas, obj_rgba, x, y, target_h, shadow_alpha=50):
    scale = target_h / obj_rgba.height
    target_w = int(obj_rgba.width * scale)
    obj = obj_rgba.resize((target_w, target_h), Image.Resampling.LANCZOS)

    shadow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    pad_x = int(target_w * 0.04)
    base_y = y + target_h
    sd.ellipse(
        (x - pad_x, base_y - int(target_h * 0.05), x + target_w + pad_x, base_y + int(target_h * 0.05)),
        fill=(40, 35, 30, shadow_alpha)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    canvas = Image.alpha_composite(canvas, shadow)
    canvas.paste(obj, (x, y), mask=obj)
    return canvas


def save_all(canvas, filename):
    final = canvas.convert("RGB")
    for dst in [
        os.path.join(BASE_DIR, filename),
        os.path.join(IMG_DIR, filename),
        os.path.join(ARTIFACTS_DIR, filename),
    ]:
        final.save(dst, format="JPEG", quality=95)
    print("Generated:", filename)


def build_single_combo(burger_file, drink_file, out_name):
    burger = remove_white_bg(os.path.join(IMG_DIR, burger_file), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)
    drink = remove_white_bg(os.path.join(IMG_DIR, drink_file), thresh=16)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Lata atrás-derecha, Papas atrás-centro-derecha, Burger adelante-izquierda
    canvas = paste_with_studio_shadow(canvas, drink, x=520, y=195, target_h=305, shadow_alpha=40)
    canvas = paste_with_studio_shadow(canvas, fries, x=320, y=155, target_h=355, shadow_alpha=45)
    canvas = paste_with_studio_shadow(canvas, burger, x=35, y=280, target_h=285, shadow_alpha=60)
    save_all(canvas, out_name)


def build_2_simples_papas():
    burger = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    canvas = paste_with_studio_shadow(canvas, fries, x=435, y=135, target_h=345, shadow_alpha=42)
    canvas = paste_with_studio_shadow(canvas, burger, x=35, y=250, target_h=225, shadow_alpha=50)
    canvas = paste_with_studio_shadow(canvas, burger, x=155, y=335, target_h=245, shadow_alpha=60)
    save_all(canvas, "combo-2-cheeseburger-simple-papas-720x720.jpg")


def build_3_simples_combo():
    cheese = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    cb = remove_white_bg(os.path.join(IMG_DIR, "cheesebacon-simple.jpeg"), thresh=14)
    clasica = remove_white_bg(os.path.join(IMG_DIR, "clasica-simple.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)
    drink = remove_white_bg(os.path.join(IMG_DIR, "pepsi-lata.jpg"), thresh=16)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Atrás: Lata + Papas
    canvas = paste_with_studio_shadow(canvas, drink, x=530, y=135, target_h=265, shadow_alpha=38)
    canvas = paste_with_studio_shadow(canvas, fries, x=290, y=110, target_h=305, shadow_alpha=42)
    # Fila media: Cheese Simple (izq) + Clásica Simple (der)
    canvas = paste_with_studio_shadow(canvas, cheese, x=25, y=255, target_h=195, shadow_alpha=50)
    canvas = paste_with_studio_shadow(canvas, clasica, x=420, y=260, target_h=195, shadow_alpha=50)
    # Adelante centro: Cheese & Bacon Simple
    canvas = paste_with_studio_shadow(canvas, cb, x=215, y=380, target_h=215, shadow_alpha=62)
    save_all(canvas, "combo-3-simples-papas-bebida-720x720.jpg")


def build_4_cheese_2_papas_4_bebidas():
    cheese = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)
    pepsi = remove_white_bg(os.path.join(IMG_DIR, "pepsi-lata.jpg"), thresh=16)
    sevenup = remove_white_bg(os.path.join(IMG_DIR, "7up.webp"), thresh=16)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Fila trasera: 4 latas (2 izq, 2 der) + 2 Papas Cope al centro
    canvas = paste_with_studio_shadow(canvas, pepsi, x=22, y=105, target_h=225, shadow_alpha=36)
    canvas = paste_with_studio_shadow(canvas, sevenup, x=92, y=115, target_h=225, shadow_alpha=36)
    canvas = paste_with_studio_shadow(canvas, sevenup, x=520, y=115, target_h=225, shadow_alpha=36)
    canvas = paste_with_studio_shadow(canvas, pepsi, x=590, y=105, target_h=225, shadow_alpha=36)

    canvas = paste_with_studio_shadow(canvas, fries, x=175, y=95, target_h=265, shadow_alpha=42)
    canvas = paste_with_studio_shadow(canvas, fries, x=375, y=95, target_h=265, shadow_alpha=42)

    # Fila media: 2 Cheese Simple
    canvas = paste_with_studio_shadow(canvas, cheese, x=28, y=265, target_h=185, shadow_alpha=50)
    canvas = paste_with_studio_shadow(canvas, cheese, x=440, y=265, target_h=185, shadow_alpha=50)

    # Fila delantera: 2 Cheese Simple
    canvas = paste_with_studio_shadow(canvas, cheese, x=130, y=390, target_h=200, shadow_alpha=62)
    canvas = paste_with_studio_shadow(canvas, cheese, x=350, y=390, target_h=200, shadow_alpha=62)

    save_all(canvas, "combo-4-cheese-2-papas-4-bebidas-720x720.jpg")


def build_cheese_doble_cb_doble_papas_2_bebidas():
    cheese_doble = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger-doble.jpeg"), thresh=14)
    cb_doble = remove_white_bg(os.path.join(IMG_DIR, "cheesebacon-doble.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)
    pepsi = remove_white_bg(os.path.join(IMG_DIR, "pepsi-lata.jpg"), thresh=16)
    sevenup = remove_white_bg(os.path.join(IMG_DIR, "7up.webp"), thresh=16)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Atrás: 1 Papas Cope (izq-centro) + 2 Bebidas (Pepsi y 7up a la derecha)
    canvas = paste_with_studio_shadow(canvas, fries, x=155, y=100, target_h=300, shadow_alpha=42)
    canvas = paste_with_studio_shadow(canvas, pepsi, x=415, y=115, target_h=255, shadow_alpha=38)
    canvas = paste_with_studio_shadow(canvas, sevenup, x=530, y=125, target_h=255, shadow_alpha=38)

    # Adelante: 1 Cheese Doble (izq) + 1 C&B Doble (der)
    canvas = paste_with_studio_shadow(canvas, cheese_doble, x=30, y=315, target_h=245, shadow_alpha=58)
    canvas = paste_with_studio_shadow(canvas, cb_doble, x=355, y=325, target_h=245, shadow_alpha=58)

    save_all(canvas, "combo-cheese-doble-cb-doble-papas-2-bebidas-720x720.jpg")


def build_2cs_cd_cbd_2papas_sin_bebida():
    cheese_s = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    cheese_d = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger-doble.jpeg"), thresh=14)
    cb_d = remove_white_bg(os.path.join(IMG_DIR, "cheesebacon-doble.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Atrás: 2 Papas Cope
    canvas = paste_with_studio_shadow(canvas, fries, x=115, y=95, target_h=285, shadow_alpha=40)
    canvas = paste_with_studio_shadow(canvas, fries, x=395, y=95, target_h=285, shadow_alpha=40)

    # Fila media: 2 Cheese Simple
    canvas = paste_with_studio_shadow(canvas, cheese_s, x=25, y=250, target_h=185, shadow_alpha=48)
    canvas = paste_with_studio_shadow(canvas, cheese_s, x=445, y=250, target_h=185, shadow_alpha=48)

    # Adelante: 1 Cheese Doble + 1 C&B Doble
    canvas = paste_with_studio_shadow(canvas, cheese_d, x=55, y=380, target_h=225, shadow_alpha=60)
    canvas = paste_with_studio_shadow(canvas, cb_d, x=360, y=385, target_h=225, shadow_alpha=60)

    save_all(canvas, "combo-2cs-1cd-1cbd-2papas-sin-bebida-720x720.jpg")


if __name__ == "__main__":
    build_single_combo("cheeseburger-doble.jpeg", "pepsi-lata.jpg", "combo-cheeseburger-doble-papas-bebida-720x720.jpg")
    build_single_combo("cheesebacon-doble.jpeg", "7up.webp", "combo-cheesebacon-doble-papas-bebida-720x720.jpg")
    build_single_combo("grancope-doble.jpeg", "pepsi-lata.jpg", "combo-grancope-doble-papas-bebida-720x720.jpg")
    build_2_simples_papas()
    build_3_simples_combo()
    build_4_cheese_2_papas_4_bebidas()
    build_cheese_doble_cb_doble_papas_2_bebidas()
    build_2cs_cd_cbd_2papas_sin_bebida()
