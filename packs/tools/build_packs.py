#!/usr/bin/env python3
"""Build ClawdCraft resource packs: make the allay look like Clawd, the coral crab.

Produces:
  build/clawdcraft-java.zip       Java resource pack (host it; set resource-pack= and
                                 resource-pack-sha1= in server.properties)
  build/clawdcraft-bedrock.mcpack Bedrock pack (drop into plugins/Geyser-Spigot/packs/)
  build/preview_front.png         front-view render of the crab spec (sanity check)

Two styles:
  --style crab (default)  True crab-shaped Clawd, matching the mascot art
                          (packs/reference/clawd.webp). Bedrock: custom allay
                          geometry (all allays become crabs). Java: entities
                          can't be remodeled by vanilla packs, so the pack
                          ships a crab *item model* (clawdcraft:clawd) that the
                          bridge mounts on the allay as an item_display
                          (config.json: "avatarModel": "crab"), plus a fully
                          transparent allay texture so the carrier allay is
                          hidden (NB: wild allays turn invisible on Java too).
  --style classic         The original coral *recolor* of the vanilla allay
                          textures, no shape change.

Both editions' crab assets are generated from ONE cube spec below (the code
equivalent of a shared Blockbench project), sharing one painted texture.

Usage:
  python3 build_packs.py [--mc-version 1.21.11] [--style crab|classic]

The Java pack_format (and, for --style classic, the vanilla allay texture) is
read from the official Mojang client jar, downloaded once into build/cache/.
"""

import argparse
import hashlib
import io
import json
import sys
import urllib.request
import uuid
import zipfile
from pathlib import Path

from PIL import Image

# Clawd palette (from the reference mascot art): coral body, black eyes.
CORAL = (240, 80, 64, 255)
BLACK = (24, 20, 20, 255)

MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
BEDROCK_ALLAY_URL = (
    "https://raw.githubusercontent.com/Mojang/bedrock-samples/main/"
    "resource_pack/textures/entity/allay/allay.png"
)

ROOT = Path(__file__).resolve().parent.parent  # packs/
BUILD = ROOT / "build"
CACHE = BUILD / "cache"

# ─── The crab, as boxes ───────────────────────────────────────────────────────
# Proportions traced from packs/reference/clawd.webp (a 400x400 pixel-art crab:
# body with two square eyes, one stubby claw each side, four legs). Coordinates
# are entity-space model pixels (16 px = 1 block, y up, front = north = -z),
# origin at the entity position on the ground.
#
# Each cube: (bedrock bone, origin [x,y,z], size [w,h,d], box-UV corner [u,v]).
# Box-UV footprint is 2*(w+d) wide by (h+d) tall; corners below are packed into
# a 64x64 texture shared verbatim by both editions.
TEX_SIZE = 64
CUBES = [
    ("body",      "body",      (-6, 3, -4),     (12, 9, 8), (0, 0)),
    ("claw_l",    "left_arm",  (6, 6, -1.5),    (3, 3, 3),  (0, 20)),
    ("claw_r",    "right_arm", (-9, 6, -1.5),   (3, 3, 3),  (16, 20)),
    ("leg_1",     "body",      (-6, 0, -1),     (2, 3, 2),  (32, 20)),
    ("leg_2",     "body",      (-3, 0, -1),     (2, 3, 2),  (40, 20)),
    ("leg_3",     "body",      (1, 0, -1),      (2, 3, 2),  (48, 20)),
    ("leg_4",     "body",      (4, 0, -1),      (2, 3, 2),  (56, 20)),
]
# Eyes: 2x2 px, high on the body face, symmetric — painted on BOTH the north
# and south face regions so the crab has a face whichever way a renderer (or
# an item_display billboard) considers "front".
EYES = [(2, 1), (8, 1)]  # body-face-relative (x from face left, y from face top)

# Bedrock rig: mirror the vanilla allay bone tree exactly (names AND parents)
# so vanilla hover/dance/look animations keep working; only the cubes change.
# Wings/look_at/rightItem stay as empty bones; claws live in the arm bones so
# they swing with the vanilla arm animation.
BEDROCK_BONES = [
    ("root", None, [0, 1, 0]),
    ("head", "root", [0, 12, 0]),
    ("look_at", "head", [0, 12, 0]),
    ("body", "root", [0, 3, 0]),
    ("rightItem", "body", [0, 0, -2]),
    ("right_arm", "body", [-6, 9, 0]),
    ("left_arm", "body", [6, 9, 0]),
    ("left_wing", "body", [0.5, 4, 1]),
    ("right_wing", "body", [-0.5, 4, 1]),
]


def box_uv_faces(u0, v0, w, h, d):
    """Face -> (x1, y1, x2, y2) texture rects for a standard box-UV layout."""
    return {
        "up": (u0 + d, v0, u0 + d + w, v0 + d),
        "down": (u0 + d + w, v0, u0 + d + 2 * w, v0 + d),
        "east": (u0, v0 + d, u0 + d, v0 + d + h),
        "north": (u0 + d, v0 + d, u0 + d + w, v0 + d + h),
        "west": (u0 + d + w, v0 + d, u0 + d + w + d, v0 + d + h),
        "south": (u0 + 2 * d + w, v0 + d, u0 + 2 * d + 2 * w, v0 + d + h),
    }


def paint_crab_texture() -> bytes:
    """One 64x64 texture for both editions: coral boxes, black eyes front+back."""
    img = Image.new("RGBA", (TEX_SIZE, TEX_SIZE), (0, 0, 0, 0))
    px = img.load()
    for _, _, _, (w, h, d), (u0, v0) in CUBES:
        w, h, d = int(w), int(h), int(d)
        for face, (x1, y1, x2, y2) in box_uv_faces(u0, v0, w, h, d).items():
            for y in range(y1, y2):
                for x in range(x1, x2):
                    px[x, y] = CORAL
    # Eyes on the body's north and south face regions.
    _, _, _, (bw, bh, bd), (bu, bv) = CUBES[0]
    faces = box_uv_faces(bu, bv, bw, bh, bd)
    for fx1, fy1, _, _ in (faces["north"], faces["south"]):
        for ex, ey in EYES:
            for dy in range(2):
                for dx in range(2):
                    px[fx1 + ex + dx, fy1 + ey + dy] = BLACK
    buf = io.BytesIO()
    img.save(buf, "PNG")
    return buf.getvalue()


def crab_geo_bedrock() -> str:
    """geometry.allay replacement: same rig, crab cubes, 64x64 texture."""
    bones = []
    for name, parent, pivot in BEDROCK_BONES:
        bone = {"name": name, "pivot": pivot}
        if parent:
            bone["parent"] = parent
        cubes = [
            {"origin": list(origin), "size": list(size), "uv": list(uv)}
            for _, b, origin, size, uv in CUBES
            if b == name
        ]
        if cubes:
            bone["cubes"] = cubes
        bones.append(bone)
    return json.dumps(
        {
            "format_version": "1.12.0",
            "minecraft:geometry": [
                {
                    "description": {
                        "identifier": "geometry.allay",
                        "texture_width": TEX_SIZE,
                        "texture_height": TEX_SIZE,
                        "visible_bounds_width": 3,
                        "visible_bounds_height": 2,
                        "visible_bounds_offset": [0, 0.5, 0],
                    },
                    "bones": bones,
                }
            ],
        },
        indent=2,
    )


def crab_java_model() -> str:
    """Free-form Java item model (for the item_display the bridge mounts)."""
    elements = []
    for _, _, (x, y, z), (w, h, d), (u0, v0) in CUBES:
        # entity space -> java model space: center at (8, _, 8), floor at y=2
        # so the crab hangs centered-ish on the display entity's position.
        f = box_uv_faces(u0, v0, int(w), int(h), int(d))
        elements.append(
            {
                "from": [x + 8, y + 2, z + 8],
                "to": [x + w + 8, y + h + 2, z + d + 8],
                "faces": {
                    face: {"uv": list(f[face]), "texture": "#0"}
                    for face in ("north", "south", "east", "west", "up", "down")
                },
            }
        )
    return json.dumps(
        {
            "texture_size": [TEX_SIZE, TEX_SIZE],
            "textures": {"0": "clawdcraft:item/clawd", "particle": "clawdcraft:item/clawd"},
            "elements": elements,
        },
        indent=2,
    )


def transparent_png(size: int) -> bytes:
    buf = io.BytesIO()
    Image.new("RGBA", (size, size), (0, 0, 0, 0)).save(buf, "PNG")
    return buf.getvalue()


def preview_front(scale: int = 12) -> None:
    """Orthographic front view of the cube spec, for eyeballing vs the mascot."""
    xs = [c[2][0] for c in CUBES] + [c[2][0] + c[3][0] for c in CUBES]
    ys = [c[2][1] for c in CUBES] + [c[2][1] + c[3][1] for c in CUBES]
    w, h = (max(xs) - min(xs)), (max(ys) - min(ys))
    img = Image.new("RGBA", (int(w * scale) + 2 * scale, int(h * scale) + 2 * scale), (255, 255, 255, 255))
    px = img.load()

    def rect(x1, y1, x2, y2, color):
        for yy in range(int(y1 * scale), int(y2 * scale)):
            for xx in range(int(x1 * scale), int(x2 * scale)):
                if 0 <= xx < img.width and 0 <= yy < img.height:
                    px[xx, yy] = color

    ox, oy = -min(xs) + 1, max(ys) + 1  # entity -> image coords (y flips)
    for _, _, (x, y, _), (cw, ch, _), _ in CUBES:
        rect(x + ox, oy - y - ch, x + cw + ox, oy - y, CORAL)
    # eyes (body front)
    bx, by = CUBES[0][2][0], CUBES[0][2][1]
    bh = CUBES[0][3][1]
    for ex, ey in EYES:
        rect(bx + ex + ox, oy - (by + bh) + ey, bx + ex + 2 + ox, oy - (by + bh) + ey + 2, BLACK)
    out = BUILD / "preview_front.png"
    img.save(out)
    print(f"  wrote {out} (front-view sanity check)")


def fetch(url: str) -> bytes:
    print(f"  fetching {url.split('/')[-1] or url} ...")
    with urllib.request.urlopen(url, timeout=120) as r:
        return r.read()


def clawdify(png_bytes: bytes) -> bytes:
    """Tint a grayscale-ish allay texture to Clawd coral, keeping dark details dark."""
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    out = img.copy()
    px = out.load()
    for y in range(out.height):
        for x in range(out.width):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            lum = 0.299 * r + 0.587 * g + 0.114 * b
            if lum < 40:  # eyes / dark outlines stay dark
                continue
            f = min(lum / 160.0, 1.4)
            px[x, y] = (
                min(int(CORAL[0] * f), 255),
                min(int(CORAL[1] * f), 255),
                min(int(CORAL[2] * f), 255),
                a,
            )
    buf = io.BytesIO()
    out.save(buf, "PNG")
    return buf.getvalue()


def java_pack_meta(mc_version: str | None) -> tuple[int, bytes]:
    """Returns (pack_format, vanilla allay png) from the official client jar."""
    manifest = json.loads(fetch(MANIFEST_URL))
    if mc_version is None:
        mc_version = manifest["latest"]["release"]
        print(f"  no --mc-version given, using latest release: {mc_version}")
    entry = next((v for v in manifest["versions"] if v["id"] == mc_version), None)
    if entry is None:
        sys.exit(f"ERROR: version {mc_version} not in Mojang manifest")

    jar_path = CACHE / f"client-{mc_version}.jar"
    if not jar_path.exists():
        version_json = json.loads(fetch(entry["url"]))
        CACHE.mkdir(parents=True, exist_ok=True)
        jar_path.write_bytes(fetch(version_json["downloads"]["client"]["url"]))
    else:
        print(f"  using cached {jar_path.name}")

    with zipfile.ZipFile(jar_path) as jar:
        allay = jar.read("assets/minecraft/textures/entity/allay/allay.png")
        pv = json.loads(jar.read("version.json"))["pack_version"]
        # schema drift: {"resource": N} in older versions, {"resource_major": N,
        # "resource_minor": M} in newer ones
        pack_format = pv["resource"] if "resource" in pv else pv["resource_major"]
    print(f"  pack_format {pack_format} (from client version.json)")
    return pack_format, allay


def build_java(mc_version: str | None, style: str) -> None:
    print("Java pack:")
    pack_format, vanilla_allay = java_pack_meta(mc_version)
    out = BUILD / "clawdcraft-java.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(
            "pack.mcmeta",
            json.dumps(
                {"pack": {"pack_format": pack_format, "description": "Clawd! (ClawdCraft)"}},
                indent=2,
            ),
        )
        if style == "crab":
            # Hide the carrier allay; the crab is an item_display the bridge
            # mounts on it ("avatarModel": "crab" in config.json).
            allay_img = Image.open(io.BytesIO(vanilla_allay))
            z.writestr(
                "assets/minecraft/textures/entity/allay/allay.png",
                transparent_png(max(allay_img.size)),
            )
            z.writestr(
                "assets/clawdcraft/items/clawd.json",
                json.dumps({"model": {"type": "minecraft:model", "model": "clawdcraft:item/clawd"}}, indent=2),
            )
            z.writestr("assets/clawdcraft/models/item/clawd.json", crab_java_model())
            z.writestr("assets/clawdcraft/textures/item/clawd.png", paint_crab_texture())
        else:
            z.writestr("assets/minecraft/textures/entity/allay/allay.png", clawdify(vanilla_allay))
    sha1 = hashlib.sha1(out.read_bytes()).hexdigest()
    print(f"  wrote {out}")
    print(f"  sha1: {sha1}")
    print("  server.properties:")
    print("    resource-pack=<public URL of clawdcraft-java.zip>")
    print(f"    resource-pack-sha1={sha1}")


def build_bedrock(style: str) -> None:
    print("Bedrock pack:")
    out = BUILD / "clawdcraft-bedrock.mcpack"
    manifest = {
        "format_version": 2,
        "header": {
            "name": "ClawdCraft",
            "description": "Clawd! (crab allay)" if style == "crab" else "Clawd! (allay reskin)",
            "uuid": str(uuid.uuid4()),
            "version": [2, 0, 0] if style == "crab" else [1, 0, 0],
            "min_engine_version": [1, 20, 0],
        },
        "modules": [
            {"type": "resources", "uuid": str(uuid.uuid4()), "version": [1, 0, 0]}
        ],
    }
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        if style == "crab":
            z.writestr("models/entity/allay.geo.json", crab_geo_bedrock())
            z.writestr("textures/entity/allay/allay.png", paint_crab_texture())
        else:
            z.writestr("textures/entity/allay/allay.png", clawdify(fetch(BEDROCK_ALLAY_URL)))
    print(f"  wrote {out}")
    print("  deploy: copy into plugins/Geyser-Spigot/packs/ and restart the server")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mc-version", default=None, help="Java MC version (default: current latest release; pin this to your server's version, e.g. 1.21.11)")
    ap.add_argument("--style", default="crab", choices=["crab", "classic"], help="crab: true crab shape (default); classic: coral recolor of the vanilla allay")
    args = ap.parse_args()
    BUILD.mkdir(parents=True, exist_ok=True)
    build_java(args.mc_version, args.style)
    build_bedrock(args.style)
    if args.style == "crab":
        preview_front()
    print("done.")
