import struct, zlib

def create_icon(size, filename):
    raw = b''
    center = size // 2
    radius = size * 0.42
    for y in range(size):
        raw += b'\x00'
        for x in range(size):
            dx = x - center
            dy = y - center
            dist = (dx*dx + dy*dy) ** 0.5
            if dist < radius:
                raw += bytes([0, 255, 136])
            else:
                raw += bytes([11, 24, 22])
    
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    idat_data = zlib.compress(raw)
    
    def chunk(ctype, data):
        c = ctype + data
        crc = zlib.crc32(c) & 0xffffffff
        return struct.pack('>I', len(data)) + c + struct.pack('>I', crc)
    
    with open(filename, 'wb') as f:
        f.write(sig)
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', idat_data))
        f.write(chunk(b'IEND', b''))
    print(f"Created {filename}")

create_icon(16, 'icon16.png')
create_icon(48, 'icon48.png')
create_icon(128, 'icon128.png')
print("All icons created!")
