#!/usr/bin/env python3
# 한국일보 공식 슬라이드 — 서식 준수 자동 점검
# 사용법: python3 verify.py <파일>.pptx
# 외부 스킬에 의존하지 않는다. 표준 라이브러리만 사용한다.

import sys, os, re, zipfile, tempfile

CANVAS = (10696575, 7562850)          # 11.7" x 8.27"
TOL_EMU = 30000                       # 약 0.03"
FONT_OK = {'Malgun Gothic', 'Courier New'}
PALETTE = {
    '14362D', '215732', 'EEF8E0', 'E8F8F6', 'D3DDD6', '00A650',
    'BFBFBF', '000000', '3F4A44', '5A6660', 'C00000', 'FFFFFF',
    'F5F7F6', '7F7F7F', 'A8C6AF', 'CBD5CC',
}
TITLE_X, TITLE_Y, TITLE_SZ = 439420, 128016, '2475'
RULE_Y = 877824
LOGO_X, LOGO_Y = 9858375, 133350
POS_TOL = 91440                       # 0.1"

fails, warns, notes = [], [], []

def emu2in(v):
    return round(int(v) / 914400, 3)

def main(path):
    if not os.path.isfile(path):
        print('파일을 찾을 수 없습니다: ' + path); return 2
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(path) as z:
        z.extractall(tmp)
    P = os.path.join(tmp, 'ppt')

    # ---- 캔버스 ----
    pres = open(os.path.join(P, 'presentation.xml'), encoding='utf-8').read()
    m = re.search(r'<p:sldSz cx="(\d+)" cy="(\d+)"', pres)
    cx, cy = int(m.group(1)), int(m.group(2))
    if abs(cx - CANVAS[0]) > TOL_EMU or abs(cy - CANVAS[1]) > TOL_EMU:
        fails.append(('전체', '캔버스 크기',
                      '%s" x %s"' % (emu2in(cx), emu2in(cy)), '11.7" x 8.27" (A4 가로)'))

    slide_files = sorted(
        [f for f in os.listdir(os.path.join(P, 'slides')) if f.endswith('.xml')],
        key=lambda f: int(re.search(r'(\d+)', f).group()))
    total = len(slide_files)

    all_xml = ''
    for f in slide_files:
        all_xml += open(os.path.join(P, 'slides', f), encoding='utf-8').read()

    # ---- 폰트 ----
    fonts = set(re.findall(r'typeface="([^"]*)"', all_xml)) - {'', '+mj-lt', '+mn-lt'}
    bad_fonts = fonts - FONT_OK
    if bad_fonts:
        fails.append(('전체', '폰트', ', '.join(sorted(bad_fonts)), 'Malgun Gothic (코드는 Courier New)'))

    # ---- 색상 ----
    colors = {}
    for c in re.findall(r'srgbClr val="([0-9A-Fa-f]{6})"', all_xml):
        c = c.upper()
        colors[c] = colors.get(c, 0) + 1
    for c, n in sorted(colors.items(), key=lambda kv: -kv[1]):
        if c not in PALETTE:
            fails.append(('전체', '팔레트 외 색상', '%s (%d회)' % (c, n), '공식 팔레트 내 색상'))

    # ---- 이미지 (로고) ----
    media = os.path.join(P, 'media')
    n_media = len(os.listdir(media)) if os.path.isdir(media) else 0
    if n_media == 0:
        fails.append(('전체', '로고 이미지', '0개 — 이미지가 전혀 없음',
                      'logo-corner.png 우측 상단 + 표지 로고'))

    # ---- 슬라이드별 ----
    body_like = 0
    for f in slide_files:
        n = int(re.search(r'(\d+)', f).group())
        x = open(os.path.join(P, 'slides', f), encoding='utf-8').read()
        has_pageno = re.search(r'<a:t>%d</a:t>' % n, x) is not None
        has_title = TITLE_SZ in re.findall(r'sz="(\d+)"', x)
        if not (has_title or has_pageno):
            continue                                  # 표지 · 간지 · 엔딩으로 간주
        body_like += 1

        # 제목 위치
        tm = re.search(r'<a:off x="(-?\d+)" y="(-?\d+)"/>\s*<a:ext cx="\d+" cy="\d+"/>'
                       r'(?:(?!</p:sp>).)*?sz="2475"', x, re.S)
        if tm:
            tx, ty = int(tm.group(1)), int(tm.group(2))
            if abs(tx - TITLE_X) > POS_TOL or abs(ty - TITLE_Y) > POS_TOL:
                warns.append((n, '제목 위치', 'x %s" y %s"' % (emu2in(tx), emu2in(ty)),
                              'x 0.48" y 0.14"'))
        else:
            fails.append((n, '제목 크기', '24.75pt 제목 없음', '24.75pt Bold'))

        # 구분선
        if not re.search(r'<a:off x="\d+" y="(8[0-9]\d{4})"', x):
            fails.append((n, '제목 아래 구분선', '없음', 'y 0.96" BFBFBF 0.75pt'))

        # 로고
        if '<p:pic>' not in x:
            fails.append((n, '우상단 로고', '없음', 'x 10.78" y 0.146"'))
        else:
            lm = re.search(r'<p:pic>.*?<a:off x="(\d+)" y="(\d+)"', x, re.S)
            if lm:
                lx, ly = int(lm.group(1)), int(lm.group(2))
                if abs(lx - LOGO_X) > POS_TOL or abs(ly - LOGO_Y) > POS_TOL:
                    warns.append((n, '로고 위치', 'x %s" y %s"' % (emu2in(lx), emu2in(ly)),
                                  'x 10.78" y 0.146"'))

    # ---- placeholder 잔존 ----
    texts = ' '.join(re.findall(r'<a:t>([^<]*)</a:t>', all_xml))
    for pat in ['○○○', 'lorem', 'ipsum', 'TODO', '[insert']:
        if pat.lower() in texts.lower():
            fails.append(('전체', 'placeholder 잔존', pat, '실제 내용으로 교체'))

    # ---- 빨강 남용 ----
    if colors.get('C00000', 0) > 6:
        warns.append(('전체', '빨강 남용', 'C00000 %d회' % colors['C00000'], '핵심 1~2곳만'))

    # ---- 미사용 토큰 ----
    unused = [c for c in ('215732', 'E8F8F6', 'D3DDD6', 'BFBFBF') if c not in colors]
    if unused:
        notes.append(('전체', '미사용 토큰', ', '.join(unused), '소제목 · 표 교차행 · 괘선에 사용'))

    # ---- 출력 ----
    print('=' * 68)
    print('한국일보 공식 슬라이드 — 서식 점검')
    print('대상: %s  (%d장, 본문형 %d장, 이미지 %d개)' % (os.path.basename(path), total, body_like, n_media))
    print('=' * 68)
    for label, rows in (('위반', fails), ('주의', warns), ('참고', notes)):
        if not rows:
            continue
        print('\n[%s] %d건' % (label, len(rows)))
        for r in rows:
            print('  슬라이드 %-4s | %-16s | 발견: %-32s | 기대: %s' % r)
    if not fails and not warns:
        print('\n위반 · 주의 사항 없음. 서식을 지켰습니다.')
    print('\n※ 텍스트 넘침 · 요소 겹침은 XML 로 잡히지 않습니다. 반드시 렌더 이미지를 눈으로 확인하십시오.')
    return 1 if fails else 0

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('사용법: python3 verify.py <파일>.pptx'); sys.exit(2)
    sys.exit(main(sys.argv[1]))
