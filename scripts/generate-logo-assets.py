"""Generates every logo, icon and splash image from the vector mark (a
silhouette traced from the user's hand photo).

Run: python3 scripts/generate-logo-assets.py (needs Google Chrome, used
headless to render the SVGs to PNG).
"""
import os, subprocess, tempfile
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "images")

# The mark: a flat silhouette of the user's hand photo (fingers curled,
# thumb out to the side, wrist cut at the bottom), traced in the photo's
# 2048px space and fitted into the 512 artboard.
HAND_OUTLINE = (
    "M 250 1650 "
    "C 300 1500 350 1420 360 1340 "  # forearm left edge up to the wrist
    "C 348 1150 340 960 350 760 "  # left edge of the palm
    "C 352 600 350 520 360 480 "
    # four curled fingers, rounded tops left to right
    "C 380 420 500 410 525 470 "
    "C 540 395 690 370 715 440 "
    "C 740 360 915 355 935 430 "
    "C 960 375 1140 380 1165 480 "
    "C 1180 560 1175 700 1160 860 "  # right side of the fingers down to the thumb
    # thumb: top edge out to the rounded tip, then the underside back in
    "C 1330 845 1520 832 1690 848 "
    "C 1790 858 1800 975 1700 985 "
    "C 1540 1005 1400 1075 1270 1185 "
    "C 1150 1290 1020 1380 900 1430 "  # into the wrist
    "C 880 1500 850 1580 830 1650 "  # forearm right edge
    "Z"
)
# Gaps between the curled fingers and the line where the fingertips meet
# the palm: drawn in the background colour so the fingers read clearly.
HAND_DETAILS = [
    "M 525 470 C 530 600 540 700 560 790",
    "M 715 440 C 712 580 720 700 740 820",
    "M 935 430 C 930 570 925 690 930 815",
    "M 440 800 C 650 860 900 870 1120 845",
]
# Fit the traced shape (x 250..1775, y 355..1650) into the 512 artboard.
_SCALE = 440 / 1525
_TX = (512 - 1525 * _SCALE) / 2 - 250 * _SCALE
_TY = (512 - 1295 * _SCALE) / 2 - 355 * _SCALE
_FIT = f"translate({_TX:.2f} {_TY:.2f}) scale({_SCALE:.5f})"

def mark(fill, detail):
    lines = "".join(
        f'<path d="{d}" fill="none" stroke="{detail}" stroke-width="30" stroke-linecap="round"/>'
        for d in HAND_DETAILS
    )
    return f'<g transform="{_FIT}"><path d="{HAND_OUTLINE}" fill="{fill}"/>{lines}</g>'

LIGHT=dict(fill="#2d4a34", detail="#fff8f4")
DARK=dict(fill="#a9c9ae", detail="#161a17")
def mono_mark():
    # Monochrome (Android themed icons): one colour, with the finger gaps
    # cut out through a mask (painting them transparent wouldn't cut).
    lines = "".join(
        f'<path d="{d}" fill="none" stroke="black" stroke-width="30" stroke-linecap="round"/>'
        for d in HAND_DETAILS
    )
    return f'''<defs><mask id="gaps" maskUnits="userSpaceOnUse" x="0" y="0" width="2048" height="2048">
    <rect width="2048" height="2048" fill="white"/>{lines}</mask></defs>
  <g transform="{_FIT}"><path d="{HAND_OUTLINE}" fill="#ffffff" mask="url(#gaps)"/></g>'''

def svg(size, colors, scale=1.0, bg=None):
    # scale: share of the canvas the 512 artboard occupies, centred.
    # colors=None draws the monochrome mark.
    s=size*scale/512; off=(size-512*s)/2
    back=f'<rect width="{size}" height="{size}" fill="{bg}"/>' if bg else ''
    body=mono_mark() if colors is None else mark(**colors)
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">{back}
<g transform="translate({off} {off}) scale({s})">{body}</g></svg>'''

def render(name, content, size):
    html=f'<html><body style="margin:0;background:transparent">{content}</body></html>'
    path=os.path.join(tempfile.gettempdir(), name+'.html'); open(path,'w').write(html)
    subprocess.run([CHROME,'--headless','--disable-gpu','--hide-scrollbars','--default-background-color=00000000',
        f'--window-size={size},{size}',f'--screenshot={os.path.join(OUT,name)}','file://'+path],
        check=True,capture_output=True)

# Source vector, kept in the repo.
open(os.path.join(OUT,'logo.svg'),'w').write(svg(512,LIGHT))
open(os.path.join(OUT,'logo-dark.svg'),'w').write(svg(512,DARK))
# In-app logo (sign-in screen, in-app splash).
render('logo.png', svg(1024,LIGHT), 1024)
render('logo-dark.png', svg(1024,DARK), 1024)
# Native splash: Android 12+ crops the splash icon to a circle (radius a
# third of the canvas), so the mark's corners must stay inside it: at 0.56
# the farthest corner is 0.316 from the centre.
render('splash-icon.png', svg(1024,LIGHT,0.56), 1024)
render('splash-icon-dark.png', svg(1024,DARK,0.56), 1024)
# Launcher icon (iOS/web/legacy): oat square with the mark.
render('icon.png', svg(1024,LIGHT,0.72,'#fff8f4'), 1024)
# Android adaptive icon: foreground inside the ~66% safe zone, oat
# background, monochrome for themed icons.
render('android-icon-foreground.png', svg(1024,LIGHT,0.56), 1024)
render('android-icon-background.png', f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#fff8f4"/></svg>', 1024)
render('android-icon-monochrome.png', svg(1024,None,0.56), 1024)
print('done')
