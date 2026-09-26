"""Generates every logo, icon and splash image from the vector mark.

Run: python3 scripts/generate-logo-assets.py (needs Google Chrome, used
headless to render the SVGs to PNG).
"""
import os, subprocess, tempfile
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "images")

def mark(pin, bear, feature, muzzle):
    # 512x512 artboard: map pin with a rounded bear head inside.
    return f'''
  <path d="M256 492 C 256 492 76 322 76 214 A 180 180 0 0 1 436 214 C 436 322 256 492 256 492 Z" fill="{pin}"/>
  <circle cx="178" cy="142" r="40" fill="{bear}"/>
  <circle cx="334" cy="142" r="40" fill="{bear}"/>
  <circle cx="256" cy="222" r="104" fill="{bear}"/>
  <ellipse cx="256" cy="262" rx="50" ry="38" fill="{muzzle}"/>
  <circle cx="218" cy="208" r="12" fill="{feature}"/>
  <circle cx="294" cy="208" r="12" fill="{feature}"/>
  <ellipse cx="256" cy="248" rx="19" ry="13" fill="{feature}"/>'''

LIGHT=dict(pin="#2d4a34", bear="#fff8f4", feature="#2d4a34", muzzle="#eee2d6")
DARK=dict(pin="#a9c9ae", bear="#161a17", feature="#a9c9ae", muzzle="#1f2420")
def mono_mark():
    # Monochrome (Android themed icons): one colour. The bear head is cut
    # out of the pin with a mask (painting it transparent wouldn't remove
    # the pin underneath); eyes and nose stay solid inside the cut-out.
    return '''
  <defs><mask id="bear-cutout">
    <rect width="512" height="512" fill="white"/>
    <circle cx="178" cy="142" r="40" fill="black"/>
    <circle cx="334" cy="142" r="40" fill="black"/>
    <circle cx="256" cy="222" r="104" fill="black"/>
  </mask></defs>
  <path d="M256 492 C 256 492 76 322 76 214 A 180 180 0 0 1 436 214 C 436 322 256 492 256 492 Z" fill="#ffffff" mask="url(#bear-cutout)"/>
  <circle cx="218" cy="208" r="12" fill="#ffffff"/>
  <circle cx="294" cy="208" r="12" fill="#ffffff"/>
  <ellipse cx="256" cy="248" rx="19" ry="13" fill="#ffffff"/>'''

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
# Native splash: Android 12+ crops the splash icon to a circle, so the
# mark sits well inside the canvas.
render('splash-icon.png', svg(1024,LIGHT,0.62), 1024)
render('splash-icon-dark.png', svg(1024,DARK,0.62), 1024)
# Launcher icon (iOS/web/legacy): oat square with the mark.
render('icon.png', svg(1024,LIGHT,0.72,'#fff8f4'), 1024)
# Android adaptive icon: foreground inside the ~66% safe zone, oat
# background, monochrome for themed icons.
render('android-icon-foreground.png', svg(1024,LIGHT,0.56), 1024)
render('android-icon-background.png', f'<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="#fff8f4"/></svg>', 1024)
render('android-icon-monochrome.png', svg(1024,None,0.56), 1024)
print('done')
