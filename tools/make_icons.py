"""Erzeugt die App-Icons (Richtungspfeil, Variante B) als PNG.

Aufruf im Projektordner:  python3 tools/make_icons.py
Zeichnet dieselbe Form wie icons/icon.svg, damit keine Zusatzsoftware nötig ist.
"""
from pathlib import Path

from PIL import Image, ImageDraw

HINTERGRUND = "#1A1A2E"  # Midnight Ink
PFEIL = "#7F77DD"  # Signal Purple
ORDNER = Path(__file__).resolve().parent.parent / "icons"
UEBERABTASTUNG = 4  # erst größer zeichnen, dann verkleinern: glatte Kanten


def bezier(p0, p1, p2, schritte=24):
    punkte = []
    for i in range(schritte + 1):
        t = i / schritte
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1]
        punkte.append((x, y))
    return punkte


# Koordinaten im 100er-Raster wie in icon.svg
SCHAFT = [(24, 70), (24, 52)] + bezier((24, 52), (24, 36), (40, 36))[1:] + [(66, 36)]
SPITZE = [(58, 26), (70, 36), (58, 46)]


def zeichne(groesse, rand=0.0):
    """rand: Anteil, um den der Pfeil nach innen rückt (für maskable Icons)."""
    g = groesse * UEBERABTASTUNG
    bild = Image.new("RGB", (g, g), HINTERGRUND)
    stift = ImageDraw.Draw(bild)
    skala = g * (1 - 2 * rand) / 100
    versatz = g * rand
    breite = round(9 * skala)
    radius = breite / 2
    for linie in (SCHAFT, SPITZE):
        punkte = [(versatz + x * skala, versatz + y * skala) for x, y in linie]
        stift.line(punkte, fill=PFEIL, width=breite, joint="curve")
        for x, y in punkte:  # runde Enden und Ecken
            stift.ellipse((x - radius, y - radius, x + radius, y + radius), fill=PFEIL)
    return bild.resize((groesse, groesse), Image.LANCZOS)


def main():
    ORDNER.mkdir(exist_ok=True)
    ziele = {
        "icon-192.png": (192, 0.0),
        "icon-512.png": (512, 0.0),
        "icon-maskable-512.png": (512, 0.12),
        "apple-touch-icon.png": (180, 0.0),
    }
    for name, (groesse, rand) in ziele.items():
        zeichne(groesse, rand).save(ORDNER / name, optimize=True)
        print(f"erstellt: icons/{name} ({groesse}×{groesse})")


if __name__ == "__main__":
    main()
