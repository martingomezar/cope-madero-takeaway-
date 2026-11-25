import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = r"g:\Mi unidad\2026\Cope Madero\pedidos take away"
IMG_DIR = os.path.join(BASE_DIR, "img")

# Fuentes del sistema
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeuib.ttf") else r"C:\Windows\Fonts\arialbd.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf" if os.path.exists(r"C:\Windows\Fonts\segoeui.ttf") else r"C:\Windows\Fonts\arial.ttf"

def get_font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

def create_circular_logo(logo_img, size):
    logo = logo_img.resize((size, size), Image.Resampling.LANCZOS).convert("RGBA")
    mask = Image.new("L", (size, size), 0)
    draw_mask = ImageDraw.Draw(mask)
    draw_mask.ellipse((0, 0, size, size), fill=255)
    
    circular = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circular.paste(logo, (0, 0), mask=mask)
    
    ring_size = size + 12
    ring = Image.new("RGBA", (ring_size, ring_size), (0, 0, 0, 0))
    ring_draw = ImageDraw.Draw(ring)
    ring_draw.ellipse((0, 0, ring_size - 1, ring_size - 1), fill=(0, 71, 187, 255), outline=(255, 184, 0, 255), width=4)
    ring.paste(circular, (6, 6), mask=circular)
    return ring

def create_rounded_flag(flag_path, target_h=44):
    flag = Image.open(flag_path).convert("RGBA")
    w, h = flag.size
    aspect = w / h
    target_w = int(target_h * aspect)
    flag_resized = flag.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    mask = Image.new("L", (target_w, target_h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle((0, 0, target_w, target_h), radius=8, fill=255)
    
    result = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    result.paste(flag_resized, (0, 0), mask=mask)
    return result

def generate_landscape_pc_display():
    w, h = 1920, 1080
    canvas = Image.new("RGBA", (w, h), (7, 13, 31, 255))
    
    # 1. Gradiente de fondo Midnight Blue
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(h):
        r = int(7 + (y / h) * 9)
        g = int(13 + (y / h) * 16)
        b = int(31 + (y / h) * 35)
        g_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    canvas = Image.alpha_composite(canvas, grad)

    # 2. Resplandor Azul Neón Suave
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((1050, -100, 2050, 950), fill=(0, 71, 187, 50))
    glow_draw.ellipse((-150, 550, 650, 1250), fill=(0, 71, 187, 35))
    glow = glow.filter(ImageFilter.GaussianBlur(70))
    canvas = Image.alpha_composite(canvas, glow)

    draw = ImageDraw.Draw(canvas)

    # 3. Logo Oficial Cope Burgers
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        raw_logo = Image.open(logo_path)
        logo_widget = create_circular_logo(raw_logo, 150)
        canvas.paste(logo_widget, (90, 80), mask=logo_widget)

    # Encabezado Marca
    f_brand = get_font(FONT_BOLD, 30)
    f_sub = get_font(FONT_REG, 19)
    draw.text((270, 105), "COPE BURGERS", fill=(255, 255, 255, 255), font=f_brand)
    draw.text((270, 145), "PUERTO MADERO · ESTILO AMERICANO", fill=(255, 184, 0, 255), font=f_sub)
    
    # 4. Badge TAKE AWAY
    badge_x, badge_y = 90, 275
    draw.rounded_rectangle((badge_x, badge_y, badge_x + 310, badge_y + 44), radius=22, fill=(0, 71, 187, 255), outline=(56, 189, 248, 255), width=2)
    f_badge = get_font(FONT_BOLD, 17)
    draw.text((badge_x + 22, badge_y + 11), "•  TAKE AWAY & TIENDA ONLINE  •", fill=(255, 255, 255, 255), font=f_badge)

    # 5. Gran Titular
    f_title = get_font(FONT_BOLD, 56)
    draw.text((90, 345), "¡Hacé tu pedido online", fill=(255, 255, 255, 255), font=f_title)
    draw.text((90, 420), "para retirar en el local!", fill=(56, 189, 248, 255), font=f_title)

    # 6. Aviso Retiro en Local + Pronto Delivery (Píldora destacada)
    notice_x, notice_y = 90, 520
    draw.rounded_rectangle((notice_x, notice_y, notice_x + 850, notice_y + 60), radius=14, fill=(15, 23, 42, 255), outline=(255, 184, 0, 255), width=2)
    f_notice = get_font(FONT_BOLD, 22)
    draw.text((notice_x + 24, notice_y + 16), "¡Retirá en menos de 15 minutos!  ·  ¡Pronto sumaremos delivery!", fill=(255, 255, 255, 255), font=f_notice)

    # 7. Módulo Multilenguaje con Banderas
    lang_x, lang_y = 90, 620
    draw.rounded_rectangle((lang_x, lang_y, lang_x + 850, lang_y + 245), radius=20, fill=(18, 28, 54, 255), outline=(31, 48, 86, 255), width=2)
    
    f_menu_title = get_font(FONT_BOLD, 28)
    draw.text((lang_x + 30, lang_y + 24), "MENÚ MULTILENGUAJE", fill=(255, 184, 0, 255), font=f_menu_title)
    
    f_menu_sub = get_font(FONT_REG, 17)
    draw.text((lang_x + 30, lang_y + 64), "Escaneá el código QR y elegí tu idioma en la barra superior:", fill=(148, 163, 184, 255), font=f_menu_sub)

    # Fila de banderas
    flags_data = [
        ("img/flag-ar.png", "Español", "ES"),
        ("img/flag-us.png", "English", "EN"),
        ("img/flag-br.png", "Português", "PT")
    ]
    
    flag_box_x = lang_x + 30
    for rel_path, lang_name, code in flags_data:
        full_path = os.path.join(BASE_DIR, rel_path)
        card_w, card_h = 245, 96
        card_y = lang_y + 112
        
        draw.rounded_rectangle((flag_box_x, card_y, flag_box_x + card_w, card_y + card_h), radius=12, fill=(10, 16, 36, 255), outline=(56, 189, 248, 255), width=1)
        
        flag_w = 60
        if os.path.exists(full_path):
            flag_img = create_rounded_flag(full_path, target_h=44)
            flag_w = flag_img.size[0]
            canvas.paste(flag_img, (flag_box_x + 14, card_y + 26), mask=flag_img)
            
        f_lname = get_font(FONT_BOLD, 20)
        f_lsub = get_font(FONT_BOLD, 14)
        text_start_x = flag_box_x + 14 + flag_w + 14
        draw.text((text_start_x, card_y + 24), lang_name, fill=(255, 255, 255, 255), font=f_lname)
        draw.text((text_start_x, card_y + 53), code, fill=(56, 189, 248, 255), font=f_lsub)
        
        flag_box_x += card_w + 25

    # 8. Ubicación en Footer
    f_loc = get_font(FONT_REG, 18)
    draw.text((90, 930), "Macacha Güemes 260 · Dique 2 · Puerto Madero, CABA", fill=(148, 163, 184, 255), font=f_loc)
    draw.text((90, 965), "Horarios: Todos los días de 12:00 a 23:00 hs  ·  WhatsApp: +54 9 11 6242-9944", fill=(100, 116, 139, 255), font=f_loc)

    # 9. TARJETA BLANCA ULTRA-NÍTIDA PARA EL CÓDIGO QR (Lado Derecho)
    card_qr_x, card_qr_y = 1080, 80
    card_qr_w, card_qr_h = 740, 920
    
    # Sombra correcta usando capa RGBA completa
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle((card_qr_x - 10, card_qr_y + 10, card_qr_x + card_qr_w + 10, card_qr_y + card_qr_h + 20), radius=36, fill=(0, 0, 0, 150))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(30))
    canvas = Image.alpha_composite(canvas, shadow_layer)
    
    # Tarjeta blanca de fondo
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((card_qr_x, card_qr_y, card_qr_x + card_qr_w, card_qr_y + card_qr_h), radius=32, fill=(255, 255, 255, 255))
    
    # Header de la tarjeta blanca
    pill_w, pill_h = 420, 50
    pill_x = card_qr_x + (card_qr_w - pill_w) // 2
    draw.rounded_rectangle((pill_x, card_qr_y + 40, pill_x + pill_w, card_qr_y + 40 + pill_h), radius=25, fill=(0, 71, 187, 255))
    f_pill = get_font(FONT_BOLD, 19)
    draw.text((pill_x + 55, card_qr_y + 52), "ESCANEÁ CON TU CÁMARA", fill=(255, 255, 255, 255), font=f_pill)
    
    f_qr_header = get_font(FONT_BOLD, 30)
    hdr_txt = "Ingresá al Menú Digital y Pedí:"
    bbox_hdr = draw.textbbox((0, 0), hdr_txt, font=f_qr_header)
    hdr_w = bbox_hdr[2] - bbox_hdr[0]
    draw.text((card_qr_x + (card_qr_w - hdr_w) // 2, card_qr_y + 115), hdr_txt, fill=(15, 23, 42, 255), font=f_qr_header)

    # 10. Código QR
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    if os.path.exists(qr_path):
        qr_img = Image.open(qr_path).convert("RGBA")
        qr_size = 520
        qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        qr_pos_x = card_qr_x + (card_qr_w - qr_size) // 2
        qr_pos_y = card_qr_y + 175
        canvas.paste(qr_resized, (qr_pos_x, qr_pos_y), mask=qr_resized)
        
        # Mini logo Cope en el centro del QR
        if os.path.exists(logo_path):
            mini_size = 94
            mini_logo = raw_logo.resize((mini_size, mini_size), Image.Resampling.LANCZOS).convert("RGBA")
            mini_mask = Image.new("L", (mini_size, mini_size), 0)
            m_draw = ImageDraw.Draw(mini_mask)
            m_draw.ellipse((0, 0, mini_size, mini_size), fill=255)
            
            frame_size = mini_size + 14
            frame = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
            f_draw = ImageDraw.Draw(frame)
            f_draw.ellipse((0, 0, frame_size - 1, frame_size - 1), fill=(255, 255, 255, 255), outline=(0, 71, 187, 255), width=3)
            frame.paste(mini_logo, (7, 7), mask=mini_mask)
            
            center_x = qr_pos_x + (qr_size - frame_size) // 2
            center_y = qr_pos_y + (qr_size - frame_size) // 2
            canvas.paste(frame, (center_x, center_y), mask=frame)

    # 11. URL y Beneficios debajo del QR
    f_url = get_font(FONT_BOLD, 25)
    url_text = "cope-madero-takeaway.vercel.app"
    bbox_url = draw.textbbox((0, 0), url_text, font=f_url)
    url_w = bbox_url[2] - bbox_url[0]
    draw.text((card_qr_x + (card_qr_w - url_w) // 2, card_qr_y + 720), url_text, fill=(0, 71, 187, 255), font=f_url)

    benefits = "Sin filas  ·  Pagá con Mercado Pago  ·  Retirá volando"
    f_ben = get_font(FONT_BOLD, 18)
    bbox_ben = draw.textbbox((0, 0), benefits, font=f_ben)
    ben_w = bbox_ben[2] - bbox_ben[0]
    draw.text((card_qr_x + (card_qr_w - ben_w) // 2, card_qr_y + 775), benefits, fill=(71, 85, 105, 255), font=f_ben)

    # Guardar imagen PC Landscape
    final_canvas = canvas.convert("RGB")
    out_path = os.path.join(BASE_DIR, "display-pc-cope-qr-1920x1080.png")
    final_canvas.save(out_path, quality=95)
    print(f"✅ Generada imagen PC Landscape: {out_path}")

    out_img = os.path.join(IMG_DIR, "display-pc-cope-qr-1920x1080.png")
    final_canvas.save(out_img, quality=95)

def generate_portrait_stand_display():
    w, h = 1080, 1920
    canvas = Image.new("RGBA", (w, h), (7, 13, 31, 255))
    
    # Gradiente vertical
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(h):
        r = int(7 + (y / h) * 10)
        g = int(13 + (y / h) * 18)
        b = int(31 + (y / h) * 40)
        g_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    canvas = Image.alpha_composite(canvas, grad)
        
    # Glows
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((100, 600, 980, 1500), fill=(0, 71, 187, 50))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas = Image.alpha_composite(canvas, glow)
    
    draw = ImageDraw.Draw(canvas)

    # 1. Logo Cope Central
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        raw_logo = Image.open(logo_path)
        logo_widget = create_circular_logo(raw_logo, 200)
        canvas.paste(logo_widget, ((w - 212) // 2, 70), mask=logo_widget)

    # Textos de marca
    f_brand = get_font(FONT_BOLD, 40)
    f_sub = get_font(FONT_REG, 22)
    
    bbox = draw.textbbox((0, 0), "COPE BURGERS", font=f_brand)
    draw.text(((w - (bbox[2] - bbox[0])) // 2, 300), "COPE BURGERS", fill=(255, 255, 255, 255), font=f_brand)
    
    sub_txt = "PUERTO MADERO · EL AUTÉNTICO ESTILO AMERICANO"
    bbox_sub = draw.textbbox((0, 0), sub_txt, font=f_sub)
    draw.text(((w - (bbox_sub[2] - bbox_sub[0])) // 2, 355), sub_txt, fill=(255, 184, 0, 255), font=f_sub)

    # Titular
    f_title1 = get_font(FONT_BOLD, 52)
    f_title2 = get_font(FONT_BOLD, 52)
    t1 = "¡Hacé tu pedido online"
    t2 = "para retirar en el local!"
    b1 = draw.textbbox((0, 0), t1, font=f_title1)
    b2 = draw.textbbox((0, 0), t2, font=f_title2)
    draw.text(((w - (b1[2] - b1[0])) // 2, 420), t1, fill=(255, 255, 255, 255), font=f_title1)
    draw.text(((w - (b2[2] - b2[0])) // 2, 485), t2, fill=(56, 189, 248, 255), font=f_title2)

    # Píldora de aviso
    p_txt = "¡Retirá en menos de 15 minutos!  ·  ¡Pronto sumaremos delivery!"
    f_p = get_font(FONT_BOLD, 22)
    bp = draw.textbbox((0, 0), p_txt, font=f_p)
    pw = bp[2] - bp[0] + 50
    px = (w - pw) // 2
    draw.rounded_rectangle((px, 570, px + pw, 625), radius=16, fill=(15, 23, 42, 255), outline=(255, 184, 0, 255), width=2)
    draw.text((px + 25, 584), p_txt, fill=(255, 255, 255, 255), font=f_p)

    # TARJETA BLANCA QR CENTRADA
    card_w, card_h = 920, 890
    card_x = (w - card_w) // 2
    card_y = 665
    
    # Sombra
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle((card_x - 10, card_y + 10, card_x + card_w + 10, card_y + card_h + 20), radius=38, fill=(0, 0, 0, 160))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(30))
    canvas = Image.alpha_composite(canvas, shadow_layer)
    
    # Tarjeta blanca
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=34, fill=(255, 255, 255, 255))
    
    # Pill "ESCANEÁ CON TU CÁMARA"
    pill_w, pill_h = 460, 54
    pill_x = card_x + (card_w - pill_w) // 2
    draw.rounded_rectangle((pill_x, card_y + 35, pill_x + pill_w, card_y + 35 + pill_h), radius=27, fill=(0, 71, 187, 255))
    f_pill = get_font(FONT_BOLD, 21)
    draw.text((pill_x + 70, card_y + 48), "ESCANEÁ CON TU CÁMARA", fill=(255, 255, 255, 255), font=f_pill)

    # QR
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    if os.path.exists(qr_path):
        qr_img = Image.open(qr_path).convert("RGBA")
        qr_size = 530
        qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        qr_pos_x = card_x + (card_w - qr_size) // 2
        qr_pos_y = card_y + 115
        canvas.paste(qr_resized, (qr_pos_x, qr_pos_y), mask=qr_resized)
        
        # Mini logo en QR
        if os.path.exists(logo_path):
            mini_size = 96
            mini_logo = raw_logo.resize((mini_size, mini_size), Image.Resampling.LANCZOS).convert("RGBA")
            mini_mask = Image.new("L", (mini_size, mini_size), 0)
            m_draw = ImageDraw.Draw(mini_mask)
            m_draw.ellipse((0, 0, mini_size, mini_size), fill=255)
            
            frame_size = mini_size + 14
            frame = Image.new("RGBA", (frame_size, frame_size), (0, 0, 0, 0))
            f_draw = ImageDraw.Draw(frame)
            f_draw.ellipse((0, 0, frame_size - 1, frame_size - 1), fill=(255, 255, 255, 255), outline=(0, 71, 187, 255), width=3)
            frame.paste(mini_logo, (7, 7), mask=mini_mask)
            
            center_x = qr_pos_x + (qr_size - frame_size) // 2
            center_y = qr_pos_y + (qr_size - frame_size) // 2
            canvas.paste(frame, (center_x, center_y), mask=frame)

    # Textos bajo QR en la tarjeta
    f_url = get_font(FONT_BOLD, 28)
    u_txt = "cope-madero-takeaway.vercel.app"
    b_u = draw.textbbox((0, 0), u_txt, font=f_url)
    draw.text((card_x + (card_w - (b_u[2] - b_u[0])) // 2, card_y + 685), u_txt, fill=(0, 71, 187, 255), font=f_url)

    f_sub_qr = get_font(FONT_BOLD, 21)
    b_txt = "Elegí tus burgers, pagá online y retirá sin filas"
    b_b = draw.textbbox((0, 0), b_txt, font=f_sub_qr)
    draw.text((card_x + (card_w - (b_b[2] - b_b[0])) // 2, card_y + 735), b_txt, fill=(71, 85, 105, 255), font=f_sub_qr)

    # Multilenguaje con banderitas
    m_box_w, m_box_h = 920, 185
    m_box_x = (w - m_box_w) // 2
    m_box_y = 1590
    draw.rounded_rectangle((m_box_x, m_box_y, m_box_x + m_box_w, m_box_y + m_box_h), radius=22, fill=(18, 28, 54, 255), outline=(31, 48, 86, 255), width=2)
    
    f_mt = get_font(FONT_BOLD, 23)
    draw.text((m_box_x + 30, m_box_y + 18), "MENÚ DISPONIBLE EN 3 IDIOMAS", fill=(255, 184, 0, 255), font=f_mt)
    
    # 3 banderas en el stand
    flags_data = [
        ("img/flag-ar.png", "Español", "ES"),
        ("img/flag-us.png", "English", "EN"),
        ("img/flag-br.png", "Português", "PT")
    ]
    fb_x = m_box_x + 30
    for rel_path, lname, lcode in flags_data:
        full_path = os.path.join(BASE_DIR, rel_path)
        cw, ch = 265, 85
        cy = m_box_y + 65
        draw.rounded_rectangle((fb_x, cy, fb_x + cw, cy + ch), radius=12, fill=(10, 16, 36, 255), outline=(56, 189, 248, 255), width=1)
        
        flag_w = 55
        if os.path.exists(full_path):
            flag_img = create_rounded_flag(full_path, target_h=40)
            flag_w = flag_img.size[0]
            canvas.paste(flag_img, (fb_x + 14, cy + 22), mask=flag_img)
            
        f_ln = get_font(FONT_BOLD, 19)
        f_ls = get_font(FONT_BOLD, 13)
        t_x = fb_x + 14 + flag_w + 14
        draw.text((t_x, cy + 18), lname, fill=(255, 255, 255, 255), font=f_ln)
        draw.text((t_x, cy + 46), lcode, fill=(56, 189, 248, 255), font=f_ls)
        fb_x += cw + 32

    # Footer
    f_ft = get_font(FONT_REG, 18)
    loc_txt = "Macacha Güemes 260 · Dique 2 · Puerto Madero, CABA"
    b_ft = draw.textbbox((0, 0), loc_txt, font=f_ft)
    draw.text(((w - (b_ft[2] - b_ft[0])) // 2, 1810), loc_txt, fill=(148, 163, 184, 255), font=f_ft)

    final_canvas = canvas.convert("RGB")
    out_path = os.path.join(BASE_DIR, "display-stand-cope-qr-1080x1920.png")
    final_canvas.save(out_path, quality=95)
    print(f"✅ Generada imagen Stand Portrait: {out_path}")

    out_img = os.path.join(IMG_DIR, "display-stand-cope-qr-1080x1920.png")
    final_canvas.save(out_img, quality=95)

if __name__ == "__main__":
    generate_landscape_pc_display()
    generate_portrait_stand_display()
