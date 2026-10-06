"""Preserve source bytes; deterministic contain thumbnails with no codec metadata."""
import io
import struct
import warnings
import xml.etree.ElementTree as ET
import zlib

from PIL import Image

MAX_BYTES = 64 * 1024 * 1024
MAX_PIXELS = 40_000_000
LONG_EDGE = 420
PROFILE = "rgba_contain_lanczos_420_stored_png_v1"


def inspect(data, suffix, *, legacy_svg=False):
    try:
        return _inspect(data, suffix, legacy_svg=legacy_svg)
    except (Image.DecompressionBombError, Image.DecompressionBombWarning, RuntimeError) as error:
        raise ValueError("Image validation failed: " + str(error)) from error


def _inspect(data, suffix, *, legacy_svg=False):
    if not data or len(data) > MAX_BYTES:
        raise ValueError("Source is empty or exceeds the 64 MiB input limit")
    if suffix == ".svg" and legacy_svg:
        if b"<!DOCTYPE" in data.upper() or b"<!ENTITY" in data.upper():
            raise ValueError("SVG external/entity declarations are forbidden")
        svg = ET.fromstring(data)
        if svg.tag.split("}")[-1] != "svg":
            raise ValueError("Invalid legacy SVG root")
        width, height = float(svg.attrib["width"]), float(svg.attrib["height"])
        if not width.is_integer() or not height.is_integer():
            raise ValueError("Legacy SVG dimensions must be integer pixels")
        width, height = int(width), int(height)
        if min(width, height) <= 0 or width * height > MAX_PIXELS:
            raise ValueError("Invalid image dimensions")
        return {"width": width, "height": height, "format": "SVG"}
    expected = {".png": "PNG", ".jpg": "JPEG", ".jpeg": "JPEG"}.get(suffix)
    if expected is None:
        raise ValueError("Supported new sources: PNG/JPEG only; no SVG/WebP/HEIC/GIF conversion")
    with warnings.catch_warnings():
        warnings.simplefilter("error", Image.DecompressionBombWarning)
        with Image.open(io.BytesIO(data)) as image:
            width, height = image.size
            if min(width, height) <= 0 or width * height > MAX_PIXELS:
                raise ValueError("Invalid dimensions or >40 megapixel source")
            if image.format != expected:
                raise ValueError("Image format does not match filename extension")
            if getattr(image, "n_frames", 1) != 1:
                raise ValueError("Animated/multiframe sources are unsupported")
            if image.mode not in ("RGB", "RGBA", "L", "LA", "P"):
                raise ValueError("Unsupported color mode; supply an approved RGB/sRGB artwork")
            image.verify()
        with Image.open(io.BytesIO(data)) as image:
            image.load()  # Reject truncated files, not just corrupt headers.
            if image.getexif().get(274, 1) != 1:
                raise ValueError("EXIF orientation must be normalized intentionally before approval; bytes are never rewritten here")
    return {"width": width, "height": height, "format": expected}


def png_bytes(image):
    """Stored DEFLATE avoids zlib-version-dependent compression output."""
    image = image.convert("RGBA")
    width, height = image.size
    pixels = image.tobytes()
    scanlines = b"".join(b"\0" + pixels[y * width * 4:(y + 1) * width * 4] for y in range(height))
    blocks = []
    for offset in range(0, len(scanlines), 65535):
        block = scanlines[offset:offset + 65535]
        final = offset + len(block) == len(scanlines)
        blocks.append(bytes([int(final)]) + struct.pack("<HH", len(block), len(block) ^ 65535) + block)
    stream = b"\x78\x01" + b"".join(blocks) + struct.pack(">I", zlib.adler32(scanlines) & 0xffffffff)

    def chunk(name, payload):
        return struct.pack(">I", len(payload)) + name + payload + struct.pack(">I", zlib.crc32(name + payload) & 0xffffffff)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)) + chunk(b"IDAT", stream) + chunk(b"IEND", b"")


def thumbnail(data):
    with Image.open(io.BytesIO(data)) as image:
        image = image.convert("RGBA")
        width, height = image.size
        longest = max(width, height)
        if longest > LONG_EDGE:
            # Integer half-up rounding; no architecture-dependent float size.
            size = (max(1, (width * LONG_EDGE + longest // 2) // longest), max(1, (height * LONG_EDGE + longest // 2) // longest))
            image = image.resize(size, Image.Resampling.LANCZOS)
        return png_bytes(image), {"width": image.width, "height": image.height, "format": "PNG"}
