import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
ARTIFACTS_DIR = r"C:\Users\magak\.gemini\antigravity\brain\cc8295bc-ccc8-461c-875a-f3fa08cb9a7f"


def remove_white_bg(img_path, thresh=14, clean_bottom=True):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
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


def build_doble_plus_papas(burger_file, out_name):
    burger = remove_white_bg(os.path.join(IMG_DIR, burger_file), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Papas atrás-derecha con logo COPE bien visible, burger adelante-izquierda
    canvas = paste_with_studio_shadow(canvas, fries, x=405, y=135, target_h=375, shadow_alpha=45)
    canvas = paste_with_studio_shadow(canvas, burger, x=45, y=260, target_h=305, shadow_alpha=60)
    save_all(canvas, out_name)


def build_sampler_sin_bebida():
    cheese = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    cb = remove_white_bg(os.path.join(IMG_DIR, "cheesebacon-simple.jpeg"), thresh=14)
    clasica = remove_white_bg(os.path.join(IMG_DIR, "clasica-simple.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    # Papas centradas atrás
    canvas = paste_with_studio_shadow(canvas, fries, x=235, y=95, target_h=320, shadow_alpha=42)
    # 3 Simples (Cheese izq, Clásica der, Cheese & Bacon adelante centro)
    canvas = paste_with_studio_shadow(canvas, cheese, x=28, y=260, target_h=200, shadow_alpha=50)
    canvas = paste_with_studio_shadow(canvas, clasica, x=425, y=265, target_h=200, shadow_alpha=50)
    canvas = paste_with_studio_shadow(canvas, cb, x=215, y=385, target_h=220, shadow_alpha=62)

    save_all(canvas, "sampler-sin-bebida-720x720.jpg")
    save_all(canvas, "combo-3-simples-papas-720x720.jpg")


def build_4_cheese_2_papas():
    cheese = remove_white_bg(os.path.join(IMG_DIR, "cheeseburger.jpeg"), thresh=14)
    fries = remove_white_bg(os.path.join(IMG_DIR, "papas-fritas.jpeg"), thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))
    canvas = paste_with_studio_shadow(canvas, fries, x=115, y=105, target_h=285, shadow_alpha=40)
    canvas = paste_with_studio_shadow(canvas, fries, x=395, y=105, target_h=285, shadow_alpha=40)
    canvas = paste_with_studio_shadow(canvas, cheese, x=25, y=260, target_h=190, shadow_alpha=48)
    canvas = paste_with_studio_shadow(canvas, cheese, x=440, y=260, target_h=190, shadow_alpha=48)
    canvas = paste_with_studio_shadow(canvas, cheese, x=130, y=385, target_h=205, shadow_alpha=58)
    canvas = paste_with_studio_shadow(canvas, cheese, x=350, y=385, target_h=205, shadow_alpha=58)
    save_all(canvas, "combo-4-cheese-2-papas-720x720.jpg")


if __name__ == "__main__":
    build_doble_plus_papas("cheeseburger-doble.jpeg", "combo-cheeseburger-doble-papas-720x720.jpg")
    build_doble_plus_papas("cheesebacon-doble.jpeg", "combo-cheesebacon-doble-papas-720x720.jpg")
    build_doble_plus_papas("grancope-doble.jpeg", "combo-grancope-doble-papas-720x720.jpg")
    build_sampler_sin_bebida()
    build_4_cheese_2_papas()
