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
    ring_draw.ellipse((0, 0, ring_size - 1, ring_size - 1), fill=(0, 71, 187, 255), outline=(50, 188, 173, 255), width=4)
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

def generate_landscape_pc_pix_display():
    w, h = 1920, 1080
    canvas = Image.new("RGBA", (w, h), (7, 14, 28, 255))
    
    # 1. Gradiente de fondo con tonos Azul Profundo y Teal PIX (#32BCAD)
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(h):
        r = int(6 + (y / h) * 6)
        g = int(14 + (y / h) * 18)
        b = int(28 + (y / h) * 32)
        g_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    canvas = Image.alpha_composite(canvas, grad)

    # 2. Resplandor Teal PIX (#32BCAD) suave
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((200, 200, 1100, 800), fill=(50, 188, 173, 40))
    glow_draw.ellipse((1200, 100, 2000, 950), fill=(0, 71, 187, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas = Image.alpha_composite(canvas, glow)

    draw = ImageDraw.Draw(canvas)

    # 3. Logo Oficial Cope Burgers
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        raw_logo = Image.open(logo_path)
        logo_widget = create_circular_logo(raw_logo, 140)
        canvas.paste(logo_widget, (90, 75), mask=logo_widget)

    # Encabezado Marca
    f_brand = get_font(FONT_BOLD, 28)
    f_sub = get_font(FONT_REG, 18)
    draw.text((255, 100), "COPE BURGERS", fill=(255, 255, 255, 255), font=f_brand)
    draw.text((255, 138), "PUERTO MADERO · BUENOS AIRES", fill=(148, 163, 184, 255), font=f_sub)

    # 4. Badge "BEM-VINDOS TURISTAS DO BRASIL" con bandera de Brasil
    badge_x, badge_y = 90, 245
    draw.rounded_rectangle((badge_x, badge_y, badge_x + 460, badge_y + 44), radius=22, fill=(15, 30, 48, 255), outline=(50, 188, 173, 255), width=2)
    
    flag_br_path = os.path.join(IMG_DIR, "flag-br.png")
    if os.path.exists(flag_br_path):
        br_flag = create_rounded_flag(flag_br_path, target_h=28)
        canvas.paste(br_flag, (badge_x + 12, badge_y + 8), mask=br_flag)
        
    f_badge = get_font(FONT_BOLD, 16)
    draw.text((badge_x + 60, badge_y + 11), "BEM-VINDOS · CARDÁPIO EM PORTUGUÊS", fill=(255, 255, 255, 255), font=f_badge)

    # 5. GRAN CAJA PIX DESTACADA (LOGO OFICIAL PIX + TEXTO)
    pix_box_x, pix_box_y = 90, 315
    pix_box_w, pix_box_h = 860, 240
    
    # Caja oscura con borde verde/teal PIX
    draw.rounded_rectangle((pix_box_x, pix_box_y, pix_box_x + pix_box_w, pix_box_y + pix_box_h), radius=24, fill=(12, 24, 40, 255), outline=(50, 188, 173, 255), width=3)
    
    # Logo Oficial PIX
    pix_logo_path = os.path.join(IMG_DIR, "pix-logo.png")
    if os.path.exists(pix_logo_path):
        pix_logo = Image.open(pix_logo_path).convert("RGBA")
        # Mantener proporción (w: 1920, h: 681 => ratio 2.81)
        pix_target_h = 80
        pix_target_w = int(pix_target_h * (pix_logo.size[0] / pix_logo.size[1]))
        pix_resized = pix_logo.resize((pix_target_w, pix_target_h), Image.Resampling.LANCZOS)
        canvas.paste(pix_resized, (pix_box_x + 36, pix_box_y + 30), mask=pix_resized)

    # Titular "ACEITAMOS PIX"
    f_pix_title = get_font(FONT_BOLD, 52)
    draw.text((pix_box_x + 290, pix_box_y + 40), "ACEITAMOS PIX!", fill=(50, 188, 173, 255), font=f_pix_title)
    
    f_pix_sub = get_font(FONT_BOLD, 22)
    draw.text((pix_box_x + 36, pix_box_y + 130), "Pague em Reais (R$) de forma rápida, segura e sem burocracia.", fill=(255, 255, 255, 255), font=f_pix_sub)
    
    f_pix_desc = get_font(FONT_REG, 18)
    draw.text((pix_box_x + 36, pix_box_y + 172), "Conversão instantânea · Sem taxas de cartão internacional · Direto do seu app de banco", fill=(148, 163, 184, 255), font=f_pix_desc)

    # 6. INSTRUCCIONES EN PORTUGUÉS PARA EL PEDIDO
    step_y = 585
    f_step_title = get_font(FONT_BOLD, 28)
    draw.text((90, step_y), "COMO FAZER SEU PEDIDO:", fill=(255, 255, 255, 255), font=f_step_title)

    steps_data = [
        ("1", "Aponte a câmera", "Escaneie o QR Code ao lado para abrir o cardápio no seu celular."),
        ("2", "Monte seu burger", "Escolha suas opções favoritas. O cardápio está 100% em português!"),
        ("3", "Pague e Retire", "Selecione PIX ou cartão, confirme o pedido e retire no balcão sem filas.")
    ]

    card_step_y = step_y + 45
    for num, stitle, sdesc in steps_data:
        # Píldora de paso
        draw.rounded_rectangle((90, card_step_y, 90 + 860, card_step_y + 70), radius=14, fill=(16, 28, 48, 255), outline=(30, 48, 76, 255), width=1)
        
        # Círculo numérico
        draw.ellipse((105, card_step_y + 12, 105 + 46, card_step_y + 12 + 46), fill=(50, 188, 173, 255))
        f_num = get_font(FONT_BOLD, 24)
        draw.text((120, card_step_y + 20), num, fill=(7, 14, 28, 255), font=f_num)
        
        f_st = get_font(FONT_BOLD, 19)
        f_sd = get_font(FONT_REG, 16)
        draw.text((170, card_step_y + 14), stitle, fill=(255, 255, 255, 255), font=f_st)
        draw.text((170, card_step_y + 38), sdesc, fill=(148, 163, 184, 255), font=f_sd)
        
        card_step_y += 82

    # 7. Ubicación y Footer
    f_loc = get_font(FONT_REG, 18)
    draw.text((90, 940), "Macacha Güemes 260 · Dique 2 · Puerto Madero, Buenos Aires", fill=(148, 163, 184, 255), font=f_loc)
    draw.text((90, 972), "Atendimento todos os dias das 12:00 às 23:30 hs  ·  Wi-Fi disponível", fill=(100, 116, 139, 255), font=f_loc)

    # 8. TARJETA BLANCA ULTRA-NÍTIDA PARA EL CÓDIGO QR (Lado Derecho)
    card_qr_x, card_qr_y = 1080, 80
    card_qr_w, card_qr_h = 740, 920
    
    # Sombra con capa RGBA
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle((card_qr_x - 10, card_qr_y + 10, card_qr_x + card_qr_w + 10, card_qr_y + card_qr_h + 20), radius=36, fill=(0, 0, 0, 150))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(30))
    canvas = Image.alpha_composite(canvas, shadow_layer)
    
    # Tarjeta blanca de fondo
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((card_qr_x, card_qr_y, card_qr_x + card_qr_w, card_qr_y + card_qr_h), radius=32, fill=(255, 255, 255, 255))
    
    # Pill "ESCANEIE COM A CÂMERA" en color Teal PIX
    pill_w, pill_h = 440, 52
    pill_x = card_qr_x + (card_qr_w - pill_w) // 2
    draw.rounded_rectangle((pill_x, card_qr_y + 36, pill_x + pill_w, card_qr_y + 36 + pill_h), radius=26, fill=(50, 188, 173, 255))
    f_pill = get_font(FONT_BOLD, 20)
    draw.text((pill_x + 52, card_qr_y + 49), "ESCANEIE COM A CÂMERA", fill=(7, 14, 28, 255), font=f_pill)
    
    f_qr_header = get_font(FONT_BOLD, 30)
    hdr_txt = "Abra o Cardápio & Peça Aqui:"
    bbox_hdr = draw.textbbox((0, 0), hdr_txt, font=f_qr_header)
    hdr_w = bbox_hdr[2] - bbox_hdr[0]
    draw.text((card_qr_x + (card_qr_w - hdr_w) // 2, card_qr_y + 112), hdr_txt, fill=(15, 23, 42, 255), font=f_qr_header)

    # 9. Código QR
    qr_path = os.path.join(IMG_DIR, "qr-cope-takeaway.png")
    if os.path.exists(qr_path):
        qr_img = Image.open(qr_path).convert("RGBA")
        qr_size = 520
        qr_resized = qr_img.resize((qr_size, qr_size), Image.Resampling.LANCZOS)
        qr_pos_x = card_qr_x + (card_qr_w - qr_size) // 2
        qr_pos_y = card_qr_y + 172
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
            f_draw.ellipse((0, 0, frame_size - 1, frame_size - 1), fill=(255, 255, 255, 255), outline=(50, 188, 173, 255), width=3)
            frame.paste(mini_logo, (7, 7), mask=mini_mask)
            
            center_x = qr_pos_x + (qr_size - frame_size) // 2
            center_y = qr_pos_y + (qr_size - frame_size) // 2
            canvas.paste(frame, (center_x, center_y), mask=frame)

    # 10. URL y Beneficios debajo del QR
    f_url = get_font(FONT_BOLD, 25)
    url_text = "cope-madero-takeaway.vercel.app"
    bbox_url = draw.textbbox((0, 0), url_text, font=f_url)
    url_w = bbox_url[2] - bbox_url[0]
    draw.text((card_qr_x + (card_qr_w - url_w) // 2, card_qr_y + 715), url_text, fill=(0, 71, 187, 255), font=f_url)

    benefits = "Aceitamos PIX  ·  Sem filas  ·  Retirada no Balcão"
    f_ben = get_font(FONT_BOLD, 18)
    bbox_ben = draw.textbbox((0, 0), benefits, font=f_ben)
    ben_w = bbox_ben[2] - bbox_ben[0]
    draw.text((card_qr_x + (card_qr_w - ben_w) // 2, card_qr_y + 768), benefits, fill=(50, 188, 173, 255), font=f_ben)
    
    sub_ben = "Atendimento e opções em Português no site"
    f_sben = get_font(FONT_REG, 16)
    bbox_s = draw.textbbox((0, 0), sub_ben, font=f_sben)
    draw.text((card_qr_x + (card_qr_w - (bbox_s[2] - bbox_s[0])) // 2, card_qr_y + 805), sub_ben, fill=(100, 116, 139, 255), font=f_sben)

    # Guardar imagen PC Landscape
    final_canvas = canvas.convert("RGB")
    out_path = os.path.join(BASE_DIR, "display-pc-cope-pix-1920x1080.png")
    final_canvas.save(out_path, quality=95)
    print(f"✅ Generada placa PC Landscape PIX: {out_path}")

    out_img = os.path.join(IMG_DIR, "display-pc-cope-pix-1920x1080.png")
    final_canvas.save(out_img, quality=95)

def generate_portrait_stand_pix_display():
    w, h = 1080, 1920
    canvas = Image.new("RGBA", (w, h), (7, 14, 28, 255))
    
    # Gradiente vertical
    grad = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(grad)
    for y in range(h):
        r = int(6 + (y / h) * 6)
        g = int(14 + (y / h) * 18)
        b = int(28 + (y / h) * 32)
        g_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    canvas = Image.alpha_composite(canvas, grad)
        
    # Glows
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((100, 300, 980, 1100), fill=(50, 188, 173, 40))
    glow_draw.ellipse((200, 1100, 900, 1800), fill=(0, 71, 187, 45))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas = Image.alpha_composite(canvas, glow)
    
    draw = ImageDraw.Draw(canvas)

    # 1. Logo Cope Central
    logo_path = os.path.join(IMG_DIR, "logo.jpg")
    if os.path.exists(logo_path):
        raw_logo = Image.open(logo_path)
        logo_widget = create_circular_logo(raw_logo, 170)
        canvas.paste(logo_widget, ((w - 182) // 2, 50), mask=logo_widget)

    # Marca
    f_brand = get_font(FONT_BOLD, 36)
    f_sub = get_font(FONT_REG, 20)
    
    bbox = draw.textbbox((0, 0), "COPE BURGERS", font=f_brand)
    draw.text(((w - (bbox[2] - bbox[0])) // 2, 245), "COPE BURGERS", fill=(255, 255, 255, 255), font=f_brand)
    
    sub_txt = "PUERTO MADERO · BUENOS AIRES"
    bbox_sub = draw.textbbox((0, 0), sub_txt, font=f_sub)
    draw.text(((w - (bbox_sub[2] - bbox_sub[0])) // 2, 295), sub_txt, fill=(148, 163, 184, 255), font=f_sub)

    # 2. CAJA DESTACADA "ACEITAMOS PIX"
    box_w, box_h = 920, 200
    box_x = (w - box_w) // 2
    box_y = 350
    draw.rounded_rectangle((box_x, box_y, box_x + box_w, box_y + box_h), radius=22, fill=(12, 24, 40, 255), outline=(50, 188, 173, 255), width=3)

    # Logo PIX
    pix_logo_path = os.path.join(IMG_DIR, "pix-logo.png")
    if os.path.exists(pix_logo_path):
        pix_logo = Image.open(pix_logo_path).convert("RGBA")
        pix_h = 75
        pix_w = int(pix_h * (pix_logo.size[0] / pix_logo.size[1]))
        pix_resized = pix_logo.resize((pix_w, pix_h), Image.Resampling.LANCZOS)
        canvas.paste(pix_resized, (box_x + 35, box_y + 25), mask=pix_resized)

    f_phead = get_font(FONT_BOLD, 48)
    draw.text((box_x + 280, box_y + 35), "ACEITAMOS PIX!", fill=(50, 188, 173, 255), font=f_phead)
    
    f_pdesc = get_font(FONT_BOLD, 22)
    p_desc = "Pague em Reais (R$) de forma rápida, segura e sem IOF!"
    draw.text((box_x + 35, box_y + 120), p_desc, fill=(255, 255, 255, 255), font=f_pdesc)
    
    f_pdesc2 = get_font(FONT_REG, 17)
    p_desc2 = "Faça seu pedido online em Português e retire no balcão sem filas."
    draw.text((box_x + 35, box_y + 155), p_desc2, fill=(148, 163, 184, 255), font=f_pdesc2)

    # 3. TARJETA BLANCA QR CENTRADA
    card_w, card_h = 920, 890
    card_x = (w - card_w) // 2
    card_y = 585
    
    # Sombra
    shadow_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow_layer)
    s_draw.rounded_rectangle((card_x - 10, card_y + 10, card_x + card_w + 10, card_y + card_h + 20), radius=38, fill=(0, 0, 0, 160))
    shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(30))
    canvas = Image.alpha_composite(canvas, shadow_layer)
    
    # Tarjeta blanca
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((card_x, card_y, card_x + card_w, card_y + card_h), radius=34, fill=(255, 255, 255, 255))
    
    # Pill "ESCANEIE COM A CÂMERA"
    pill_w, pill_h = 460, 54
    pill_x = card_x + (card_w - pill_w) // 2
    draw.rounded_rectangle((pill_x, card_y + 35, pill_x + pill_w, card_y + 35 + pill_h), radius=27, fill=(50, 188, 173, 255))
    f_pill = get_font(FONT_BOLD, 21)
    draw.text((pill_x + 65, card_y + 48), "ESCANEIE COM A CÂMERA", fill=(7, 14, 28, 255), font=f_pill)

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
            f_draw.ellipse((0, 0, frame_size - 1, frame_size - 1), fill=(255, 255, 255, 255), outline=(50, 188, 173, 255), width=3)
            frame.paste(mini_logo, (7, 7), mask=mini_mask)
            
            center_x = qr_pos_x + (qr_size - frame_size) // 2
            center_y = qr_pos_y + (qr_size - frame_size) // 2
            canvas.paste(frame, (center_x, center_y), mask=frame)

    # Textos bajo QR en la tarjeta
    f_url = get_font(FONT_BOLD, 28)
    u_txt = "cope-madero-takeaway.vercel.app"
    b_u = draw.textbbox((0, 0), u_txt, font=f_url)
    draw.text((card_x + (card_w - (b_u[2] - b_u[0])) // 2, card_y + 685), u_txt, fill=(0, 71, 187, 255), font=f_url)

    f_sub_qr = get_font(FONT_BOLD, 22)
    b_txt = "Pague com PIX  ·  Sem filas  ·  Retirada no Balcão"
    b_b = draw.textbbox((0, 0), b_txt, font=f_sub_qr)
    draw.text((card_x + (card_w - (b_b[2] - b_b[0])) // 2, card_y + 735), b_txt, fill=(50, 188, 173, 255), font=f_sub_qr)

    f_sub2 = get_font(FONT_REG, 18)
    b2_txt = "Escolha suas burgers e monte seu pedido direto pelo celular"
    b2_b = draw.textbbox((0, 0), b2_txt, font=f_sub2)
    draw.text((card_x + (card_w - (b2_b[2] - b2_b[0])) // 2, card_y + 775), b2_txt, fill=(100, 116, 139, 255), font=f_sub2)

    # 4. PASO A PASO EN LA PARTE INFERIOR
    step_box_y = 1515
    f_inst_title = get_font(FONT_BOLD, 24)
    draw.text((card_x, step_box_y), "COMO PEDIR E PAGAR COM PIX:", fill=(255, 255, 255, 255), font=f_inst_title)

    step_items = [
        ("1", "Escaneie o QR Code e monte seu pedido no site"),
        ("2", "Selecione PIX ou transferência na forma de pagamento"),
        ("3", "Envie o comprovante pelo WhatsApp ou mostre ao retirar")
    ]

    s_curr_y = step_box_y + 45
    for s_n, s_text in step_items:
        draw.rounded_rectangle((card_x, s_curr_y, card_x + card_w, s_curr_y + 60), radius=12, fill=(16, 28, 48, 255), outline=(30, 48, 76, 255), width=1)
        draw.ellipse((card_x + 14, s_curr_y + 11, card_x + 14 + 38, s_curr_y + 11 + 38), fill=(50, 188, 173, 255))
        f_sn = get_font(FONT_BOLD, 20)
        draw.text((card_x + 27, s_curr_y + 18), s_n, fill=(7, 14, 28, 255), font=f_sn)
        
        f_st = get_font(FONT_BOLD, 18)
        draw.text((card_x + 68, s_curr_y + 19), s_text, fill=(255, 255, 255, 255), font=f_st)
        s_curr_y += 72

    # Footer
    f_ft = get_font(FONT_REG, 18)
    loc_txt = "Macacha Güemes 260 · Dique 2 · Puerto Madero, Buenos Aires"
    b_ft = draw.textbbox((0, 0), loc_txt, font=f_ft)
    draw.text(((w - (b_ft[2] - b_ft[0])) // 2, 1830), loc_txt, fill=(148, 163, 184, 255), font=f_ft)

    final_canvas = canvas.convert("RGB")
    out_path = os.path.join(BASE_DIR, "display-stand-cope-pix-1080x1920.png")
    final_canvas.save(out_path, quality=95)
    print(f"✅ Generada placa Stand Portrait PIX: {out_path}")

    out_img = os.path.join(IMG_DIR, "display-stand-cope-pix-1080x1920.png")
    final_canvas.save(out_img, quality=95)

if __name__ == "__main__":
    generate_landscape_pc_pix_display()
    generate_portrait_stand_pix_display()
