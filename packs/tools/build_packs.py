#!/usr/bin/env python3
"""Build ClawdCraft resource packs: reskin the allay as Clawd (coral crab palette).

Produces:
  build/clawdcraft-java.zip       Java resource pack (host it; set resource-pack= and
                                 resource-pack-sha1= in server.properties)
  build/clawdcraft-bedrock.mcpack Bedrock pack (drop into plugins/Geyser-Spigot/packs/)

Usage:
  python3 build_packs.py [--mc-version 1.21.11]

The Java allay texture is extracted from the official Mojang client jar (downloaded
once into build/cache/). The Bedrock texture comes from Mojang/bedrock-samples on
GitHub (the two editions use different UV layouts, so each needs its own source).
The pack_format for the Java pack is read from the client jar's version.json, so it
always matches the targeted Minecraft version.
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
CORAL = (240, 80, 64)

MANIFEST_URL = "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
BEDROCK_ALLAY_URL = (
    "https://raw.githubusercontent.com/Mojang/bedrock-samples/main/"
    "resource_pack/textures/entity/allay/allay.png"
)

ROOT = Path(__file__).resolve().parent.parent  # packs/
BUILD = ROOT / "build"
CACHE = BUILD / "cache"


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


def build_java(mc_version: str | None) -> None:
    print("Java pack:")
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

    out = BUILD / "clawdcraft-java.zip"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr(
            "pack.mcmeta",
            json.dumps(
                {"pack": {"pack_format": pack_format, "description": "Clawd! (ClawdCraft allay reskin)"}},
                indent=2,
            ),
        )
        z.writestr("assets/minecraft/textures/entity/allay/allay.png", clawdify(allay))
    sha1 = hashlib.sha1(out.read_bytes()).hexdigest()
    print(f"  wrote {out}")
    print(f"  sha1: {sha1}")
    print("  server.properties:")
    print("    resource-pack=<public URL of clawdcraft-java.zip>")
    print(f"    resource-pack-sha1={sha1}")


def build_bedrock() -> None:
    print("Bedrock pack:")
    allay = fetch(BEDROCK_ALLAY_URL)
    out = BUILD / "clawdcraft-bedrock.mcpack"
    manifest = {
        "format_version": 2,
        "header": {
            "name": "ClawdCraft",
            "description": "Clawd! (allay reskin)",
            "uuid": str(uuid.uuid4()),
            "version": [1, 0, 0],
            "min_engine_version": [1, 20, 0],
        },
        "modules": [
            {"type": "resources", "uuid": str(uuid.uuid4()), "version": [1, 0, 0]}
        ],
    }
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, indent=2))
        z.writestr("textures/entity/allay/allay.png", clawdify(allay))
    print(f"  wrote {out}")
    print("  deploy: copy into plugins/Geyser-Spigot/packs/ and restart the server")


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--mc-version", default=None, help="Java MC version (default: current latest release; pin this to your server's version, e.g. 1.21.11)")
    args = ap.parse_args()
    BUILD.mkdir(parents=True, exist_ok=True)
    build_java(args.mc_version)
    build_bedrock()
    print("done.")
