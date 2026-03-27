import struct, zlib, os

def make_png(w, h, pattern):
    def pixel(x, y):
        if pattern == 'trapez':
            s = x % 8
            bright = 40 if s < 2 else (-20 if s > 6 else 0)
            return (min(255, max(0, 190 + bright)), min(255, max(0, 195 + bright)), min(255, max(0, 200 + bright)))
        elif pattern == 'blachodachowka':
            # Tile grid – each tile is 32×26 px; bell-curve highlight + 2 px seam shadow
            tw, th = 32, 26
            tx, ty = x % tw, y % th
            # Quadratic bell: 0 at edges → 1 at centre
            cx = 4.0 * tx * (tw - 1 - tx) / float((tw - 1) ** 2)
            cy = 4.0 * ty * (th - 1 - ty) / float((th - 1) ** 2)
            seam = tx < 2 or ty < 2
            base = 207
            highlight = int(28 * cx + 18 * cy)
            shadow = 62 if seam else 0
            v = max(0, min(255, base + highlight - shadow))
            # Cool steel-blue tint
            return (max(0, v - 7), max(0, v - 4), v)
        elif pattern == 'rabek':
            s = x % 12
            seam = int(s < 2)
            return (min(255, 180 + 60 * seam), min(255, 185 + 60 * seam), min(255, 190 + 60 * seam))
        else:  # grass — muted, natural tones
            noise = ((x * 31 + y * 17) ^ (x * 7 + y * 3)) % 18
            r = min(255, max(0, 55 + noise))
            g = min(255, max(0, 80 + noise))
            b = min(255, max(0, 38 + noise // 2))
            blade = (x * 13 + y * 7) % 7
            if blade == 0:
                r, g, b = max(0, r - 10), max(0, g - 12), max(0, b - 6)
            elif blade == 1:
                r, g, b = min(255, r + 7), min(255, g + 10), min(255, b + 4)
            return (r, g, b)

    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            r, g, b = pixel(x, y)
            raw += bytes([r, g, b, 255])

    compressed = zlib.compress(raw, 9)

    def chunk(t, d):
        c = zlib.crc32(t + d) & 0xffffffff
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', c)

    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

base = os.path.join(os.path.dirname(__file__), '..', 'public', 'textures')
os.makedirs(base, exist_ok=True)

sizes = {'trapez': (64, 64), 'blachodachowka': (128, 128), 'rabek': (64, 64), 'grass': (64, 64)}
for name, pat in [('trapez', 'trapez'), ('blachodachowka', 'blachodachowka'), ('rabek', 'rabek'), ('grass', 'grass')]:
    w, h = sizes[name]
    data = make_png(w, h, pat)
    path = os.path.join(base, name + '.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {name}.png ({len(data)} bytes)')
