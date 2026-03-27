import struct, zlib, os

def make_png(w, h, pattern):
    def pixel(x, y):
        if pattern == 'trapez':
            s = x % 8
            bright = 40 if s < 2 else (-20 if s > 6 else 0)
            return (min(255, max(0, 190 + bright)), min(255, max(0, 195 + bright)), min(255, max(0, 200 + bright)))
        elif pattern == 'blachodachowka':
            tx, ty = x % 16, y % 12
            edge = int(tx < 1 or ty < 1 or tx > 14 or ty > 10)
            return (max(0, 170 - 30 * edge), max(0, 140 - 30 * edge), max(0, 120 - 30 * edge))
        else:  # rabek
            s = x % 12
            seam = int(s < 2)
            return (min(255, 180 + 60 * seam), min(255, 185 + 60 * seam), min(255, 190 + 60 * seam))

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

for name, pat in [('trapez', 'trapez'), ('blachodachowka', 'blachodachowka'), ('rabek', 'rabek')]:
    data = make_png(64, 64, pat)
    path = os.path.join(base, name + '.png')
    with open(path, 'wb') as f:
        f.write(data)
    print(f'Created {name}.png ({len(data)} bytes)')
