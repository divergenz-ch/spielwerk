"""Generate editable, single-contour SVG logo studies. Python standard library only."""
from pathlib import Path
from math import sin, cos, radians
from html import escape

OUT = Path(__file__).resolve().parent
INK, PAPER, MUTED, RULE = '#161616', '#f5f3ed', '#79776f', '#d4d1c8'

def num(x):
    return f'{x:.2f}'.rstrip('0').rstrip('.')

def pt(p):
    return f'{num(p[0])} {num(p[1])}'

def add(a, b, s=1):
    return (a[0] + b[0]*s, a[1] + b[1]*s)

def branch(root, angle, length, shaft=32, head=64, depth=38, upper=True):
    a = radians(angle)
    v = (-cos(a), -sin(a))
    n = (-v[1], v[0])
    if not upper:
        n = (-n[0], -n[1])
    tip = add(root, v, length)
    base = add(tip, v, -depth)
    return dict(tip=tip, outer=add(base,n,head/2), outer_shaft=add(base,n,shaft/2),
                inner_shaft=add(base,n,-shaft/2), inner=add(base,n,-head/2), v=v)

def cross(a,b):
    return a[0]*b[1]-a[1]*b[0]

def intersect(p,v,q,w):
    return add(p,v,cross((q[0]-p[0],q[1]-p[1]),w)/cross(v,w))

def at_y(b,y):
    p,v=b['outer_shaft'],b['v']
    if abs(v[1]) < 1e-6:
        assert abs(p[1]-y)<1e-6
        return p
    return add(p,v,(y-p[1])/v[1])

def silhouette(upper, lower, cx=180, cy=96, r=32):
    top, bottom = at_y(upper,cy-r), at_y(lower,cy+r)
    notch = intersect(upper['inner_shaft'],upper['v'],lower['inner_shaft'],lower['v'])
    assert notch[0] < cx
    points=[upper['tip'],upper['outer'],upper['outer_shaft'],top,(cx,cy-r)]
    d='M '+pt(points[0])+' '+' '.join('L '+pt(p) for p in points[1:])
    # Two exact cubic quarter-circle approximations; no masks or overlapping parts.
    k=r*0.5522847498
    d+=f' C {pt((cx+k,cy-r))} {pt((cx+r,cy-k))} {pt((cx+r,cy))}'
    d+=f' C {pt((cx+r,cy+k))} {pt((cx+k,cy+r))} {pt((cx,cy+r))}'
    tail=[bottom,lower['outer_shaft'],lower['outer'],lower['tip'],lower['inner'],
          lower['inner_shaft'],notch,upper['inner_shaft'],upper['inner']]
    d+=' '+' '.join('L '+pt(p) for p in tail)+' Z'
    bounds=points+tail+[(cx+r,cy)]
    x0=min(p[0] for p in bounds); y0=min(p[1] for p in bounds)
    x1=max(p[0] for p in bounds); y1=max(p[1] for p in bounds)
    return d,(x0,y0,x1-x0,y1-y0)

def symmetric(angle,length,root=132,cx=180,shaft=32,head=64,depth=38):
    return silhouette(branch((root,96),angle,length,shaft,head,depth),
                      branch((root,96),-angle,length,shaft,head,depth,False),cx=cx)

studies=[
    ('A01','Open split','Two equal arrows / 60-degree spread',symmetric(30,132)),
    ('A02','Compact split','Steeper branches / shorter rounded body',symmetric(45,116,128,164)),
    ('A03','Quiet fork','Arrow shoulders removed / silhouette first',symmetric(30,132,head=32,depth=24)),
    ('B01','Departure','One straight route / one 45-degree exit',silhouette(
        branch((136,104),45,130),branch((136,120),0,124,upper=False),cy=104)),
    ('B02','Unequal paths','Steeper exit / dominant horizontal route',silhouette(
        branch((136,104),60,112,shaft=28,head=50,depth=32),
        branch((136,120),0,128,upper=False),cy=104)),
    ('B03','Open incision','Deep diagonal opening / reduced upper tip',silhouette(
        branch((154,104),30,160,shaft=28,head=28,depth=24),
        branch((136,120),0,128,head=56,depth=32,upper=False),cy=104)),
]

def mark(d,b,x,y,width=None,height=None,fill=INK):
    x0,y0,w,h=b
    s=(width/w) if width is not None else (height/h)
    return f'<path fill="{fill}" d="{d}" transform="translate({num(x-x0*s)} {num(y-y0*s)}) scale({s:.6f})"/>'

def text(x,y,value,size=12,fill=INK,extra=''):
    return f'<text x="{x}" y="{y}" font-family="Helvetica, Arial, sans-serif" font-size="{size}" fill="{fill}" {extra}>{escape(value)}</text>'

def line(x1,y1,x2,y2):
    return f'<path d="M{x1} {y1}H{x2}" stroke="{RULE}"/>' if y1==y2 else f'<path d="M{x1} {y1}L{x2} {y2}" stroke="{RULE}"/>'

for code,title,note,(d,b) in studies:
    x,y,w,h=b
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{num(w+16)}" height="{num(h+16)}" viewBox="{num(x-8)} {num(y-8)} {num(w+16)} {num(h+16)}" role="img" aria-labelledby="title desc">
  <title id="title">Divergenz — {code}: {title}</title>
  <desc id="desc">{escape(note)}. One continuous editable silhouette with a rounded right-hand body and an open branching counter. Exploration, not a final logo.</desc>
  <path id="{code.lower()}-symbol" fill="{INK}" d="{d}"/>
</svg>'''
    (OUT/f'{code.lower()}-{title.lower().replace(" ","-")}.svg').write_text(svg)

W,H=1440,1240
parts=[f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
       '<title>Divergenz — split, not return / six logo studies</title>',
       f'<rect width="{W}" height="{H}" fill="{PAPER}"/>',
       text(48,45,'DIVERGENZ / SYMBOL EXPLORATION',13,extra='letter-spacing="1.4"'),
       text(1392,45,'01 — SIX STUDIES',12,extra='text-anchor="end"'),
       text(48,107,'Split, not return.',48,extra='letter-spacing="-1.8"'),
       text(48,139,'One shared body. Two directions. The D remains a secondary reading.',15,MUTED),
       line(48,166,1392,166)]

for row,section in enumerate(['A / SYMMETRICAL — EQUAL POSSIBILITIES','B / ASYMMETRICAL — DEPART FROM THE EXPECTED']):
    y=199+row*490
    parts.append(text(48,y,section,12,extra='letter-spacing="1"'))
    for col in range(3):
        code,title,note,(d,b)=studies[row*3+col]
        x=48+col*456
        parts.append(f'<g id="study-{code.lower()}">')
        parts.append(text(x,y+38,code,13,MUTED))
        parts.append(text(x+42,y+38,title,20,extra='font-weight="500"'))
        # Equal symbol height makes the branch-angle comparison legible.
        display_h=142
        display_w=b[2]/b[3]*display_h
        parts.append(mark(d,b,x+(432-display_w)/2,y+77,height=display_h))
        parts.append(text(x,y+254,note,12,MUTED))
        parts.append(line(x,y+277,x+432,y+277))
        parts.append(mark(d,b,x,y+303,height=32))
        lockup_w=b[2]/b[3]*32
        parts.append(text(round(x+lockup_w+15,2),y+329,'Divergenz',28,extra='font-style="italic" letter-spacing="-0.8"'))
        parts.append(text(x,y+379,'24 / 16 px high',10,MUTED))
        parts.append(mark(d,b,x+97,y+359,height=24))
        parts.append(mark(d,b,x+154,y+367,height=16))
        parts.append(f'<rect x="{x+244}" y="{y+298}" width="188" height="103" fill="{INK}"/>')
        reverse_h=49; reverse_w=b[2]/b[3]*reverse_h
        parts.append(mark(d,b,x+244+(188-reverse_w)/2,y+325,height=reverse_h,fill=PAPER))
        parts.append('</g>')

parts += [line(48,1148,1392,1148),
          text(48,1180,'READING TEST',11,extra='letter-spacing="1"'),
          text(185,1180,'Do you see branching before reversal? Compare B01 with A03 first.',14),
          text(48,1210,'Single filled contours · No hairline counters · No masks · Editable SVG paths',11,MUTED),
          text(1392,1210,'Explorations, not final artwork',11,MUTED,extra='text-anchor="end"'),'</svg>']
(OUT/'divergenz-iterations.svg').write_text('\n'.join(parts))
print(f'Wrote six symbols and comparison sheet to {OUT}')
