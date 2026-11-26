import os
from PIL import Image, ImageDraw, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")
ARTIFACTS_DIR = r"C:\Users\magak\.gemini\antigravity\brain\cc8295bc-ccc8-461c-875a-f3fa08cb9a7f"
UPLOADED_DIR = os.path.join(ARTIFACTS_DIR, ".user_uploaded")


def remove_white_bg(img_path, thresh=14):
    img = Image.open(img_path).convert("RGBA")
    w, h = img.size
    sentinel = (255, 0, 255, 0)
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        try:
            ImageDraw.floodfill(img, corner, sentinel, thresh=thresh)
        except Exception:
            pass

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


def paste_with_studio_shadow(canvas, obj_rgba, x, y, target_h, shadow_alpha=45):
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


def main():
    burger_path = os.path.join(UPLOADED_DIR, "media_1795710876375_97630a98.jpg")
    fries_path = os.path.join(UPLOADED_DIR, "media_1795710884630_1819e0b5.jpg")

    burger = remove_white_bg(burger_path, thresh=14)
    fries = remove_white_bg(fries_path, thresh=12)

    canvas = Image.new("RGBA", (720, 720), (250, 250, 250, 255))

    # 2 Papas Fritas atrás
    canvas = paste_with_studio_shadow(canvas, fries, x=115, y=105, target_h=285, shadow_alpha=40)
    canvas = paste_with_studio_shadow(canvas, fries, x=395, y=105, target_h=285, shadow_alpha=40)

    # 2 Cheeseburgers fila media
    canvas = paste_with_studio_shadow(canvas, burger, x=25, y=260, target_h=190, shadow_alpha=48)
    canvas = paste_with_studio_shadow(canvas, burger, x=440, y=260, target_h=190, shadow_alpha=48)

    # 2 Cheeseburgers adelante
    canvas = paste_with_studio_shadow(canvas, burger, x=130, y=385, target_h=205, shadow_alpha=58)
    canvas = paste_with_studio_shadow(canvas, burger, x=350, y=385, target_h=205, shadow_alpha=58)

    final = canvas.convert("RGB")
    out_repo = os.path.join(BASE_DIR, "promo-4-cheeseburgers-2-papas-720x720.jpg")
    out_img = os.path.join(IMG_DIR, "promo-4-cheeseburgers-2-papas-720x720.jpg")
    out_art = os.path.join(ARTIFACTS_DIR, "promo-4-cheeseburgers-2-papas-720x720.jpg")
    for dst in [out_repo, out_img, out_art]:
        final.save(dst, format="JPEG", quality=95)
    print("Generated 4x2 720x720:", out_repo)


if __name__ == "__main__":
    main()
