/* ============================================================
 * 场景组 B · 五毛特效预演器
 * 提供 window.SCENES_B：slowmo / duel / doom / slam / flee / hero
 * 统一接口 { id, label, duration, mount(stage, idea), cleanup() }
 * ============================================================ */
(function () {
  'use strict';
  if (window.SCENES_B) return;

  /* ---------- 通用工具 ---------- */

  function injectStyle() {
    if (document.getElementById('style-scenes-b')) return;
    var css = [
      /* ---- 7. 慢动作奔跑 ---- */
      '.scn-b-slowmo{background:linear-gradient(#1a1a24 0%,#0c0c14 42%,#05050a 100%);' +
        'animation:scn-b-sway 1.4s ease-in-out infinite;}',
      '@keyframes scn-b-sway{0%,100%{transform:translateX(0)}50%{transform:translateX(-6px)}}',
      '.scn-b-slowmo .sun{position:absolute;left:50%;top:22%;width:34vmin;height:34vmin;' +
        'margin-left:-17vmin;border-radius:50%;' +
        'background:radial-gradient(circle,#ffe9a8 0%,rgba(255,180,60,.45) 46%,transparent 70%);opacity:.8;}',
      '.scn-b-slowmo .ground{position:absolute;left:0;right:0;bottom:0;height:34%;background:#07070b;' +
        'border-top:2px solid rgba(255,226,61,.22);}',
      '.scn-b-slowmo .runner{position:absolute;bottom:32%;left:-14vw;' +
        'font-size:clamp(54px,12vw,140px);line-height:1;' +
        'filter:drop-shadow(0 8px 0 rgba(0,0,0,.7)) drop-shadow(0 0 26px rgba(255,226,61,.35));' +
        'animation:scn-b-run 8.6s linear forwards;}',
      '@keyframes scn-b-run{0%{transform:translateX(0) rotate(-2deg)}100%{transform:translateX(136vw) rotate(2deg)}}',
      '.scn-b-line{position:absolute;height:3px;border-radius:3px;' +
        'background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.85));' +
        'animation:scn-b-line 1.4s linear infinite;animation-delay:var(--d,0s);opacity:.55;}',
      '@keyframes scn-b-line{0%{transform:translateX(38vw) scaleX(.4)}100%{transform:translateX(-62vw) scaleX(1.6)}}',
      '.scn-b-debris{position:absolute;width:1vmin;height:1vmin;background:rgba(255,226,61,.55);' +
        'animation:scn-b-debris 2.4s linear infinite;animation-delay:var(--d,0s);}',
      '@keyframes scn-b-debris{0%{transform:translate(0,0) rotate(0);opacity:0}' +
        '20%{opacity:.9}100%{transform:translate(-16vw,-24vh) rotate(300deg);opacity:0}}',

      /* ---- 8. 激光大战 ---- */
      '.scn-b-duel{background:radial-gradient(circle at 50% 50%,#061426 0%,#020711 62%,#000 100%);}',
      '.scn-b-duel .grid{position:absolute;inset:-10%;opacity:.2;' +
        'background-image:linear-gradient(rgba(34,230,255,.6) 1px,transparent 1px),' +
        'linear-gradient(90deg,rgba(34,230,255,.6) 1px,transparent 1px);background-size:7vw 7vw;' +
        'transform:perspective(420px) rotateX(46deg);transform-origin:50% 100%;}',
      '.scn-b-shot{position:absolute;left:50%;top:50%;width:52vw;height:5px;margin-top:-2.5px;' +
        'transform-origin:left center;border-radius:4px;opacity:0;' +
        'animation:scn-b-shot 0.9s steps(2) infinite;animation-delay:var(--d,0s);}',
      '.scn-b-shot.red{background:linear-gradient(90deg,#fff,#ff3b30 22%,rgba(255,59,48,.1));' +
        'box-shadow:0 0 16px #ff3b30,0 0 34px rgba(255,59,48,.6);}',
      '.scn-b-shot.green{background:linear-gradient(90deg,#fff,#35ff8a 22%,rgba(53,255,138,.1));' +
        'box-shadow:0 0 16px #35ff8a,0 0 34px rgba(53,255,138,.6);}',
      '@keyframes scn-b-shot{0%{opacity:0;transform:rotate(var(--r,0deg)) scaleX(.1)}' +
        '18%{opacity:1;transform:rotate(var(--r,0deg)) scaleX(1)}' +
        '42%{opacity:.15}58%{opacity:1}100%{opacity:0;transform:rotate(var(--r,0deg)) scaleX(1)}}',
      '.scn-b-spark{position:absolute;left:50%;top:50%;width:1.2vmin;height:1.2vmin;background:#ffe23d;' +
        'animation:scn-b-spark .8s ease-out infinite;animation-delay:var(--d,0s);}',
      '@keyframes scn-b-spark{0%{transform:translate(-50%,-50%) scale(1.6);opacity:1}' +
        '100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.2);opacity:0}}',
      '.scn-b-duel .flashcore{position:absolute;left:50%;top:50%;width:18vmin;height:18vmin;' +
        'margin:-9vmin 0 0 -9vmin;border-radius:50%;' +
        'background:radial-gradient(circle,#fff 0%,rgba(255,226,61,.5) 34%,transparent 68%);' +
        'animation:scn-b-corepulse .5s steps(2) infinite;}',
      '@keyframes scn-b-corepulse{50%{opacity:.35}}',

      /* ---- 9. 地球毁灭 ---- */
      '.scn-b-doom{background:radial-gradient(circle at 50% 50%,#0a1630 0%,#04070f 60%,#000 100%);overflow:hidden}',
      '.scn-b-doom .earth{position:absolute;left:50%;top:46%;transform:translate(-50%,-50%);' +
        'font-size:clamp(88px,26vw,300px);line-height:1;' +
        'filter:drop-shadow(0 0 34px rgba(34,230,255,.55));' +
        'animation:scn-b-earth 2.9s cubic-bezier(.55,0,.9,.65) forwards;}',
      '@keyframes scn-b-earth{0%{transform:translate(-50%,-50%) scale(.9)}100%{transform:translate(-50%,-50%) scale(2.7)}}',
      '.scn-b-doom .ring{position:absolute;left:50%;top:46%;width:20vmin;height:20vmin;' +
        'margin:-10vmin 0 0 -10vmin;border-radius:50%;border:1vmin solid #ffe23d;' +
        'opacity:0;animation:scn-b-dring 1.1s ease-out 2.35s forwards;animation-delay:calc(2.35s + var(--d,0s));}',
      '.scn-b-doom .ring:nth-child(3){border-color:#ff3b30}',
      '.scn-b-doom .ring:nth-child(4){border-color:#22e6ff}',
      '@keyframes scn-b-dring{0%{transform:scale(.3);opacity:1}100%{transform:scale(7);opacity:0;border-width:2px}}',
      '.scn-b-chunk{position:absolute;left:50%;top:46%;width:2vmin;height:2vmin;background:#ff8a3d;' +
        'box-shadow:0 0 12px rgba(255,90,0,.7);opacity:0;' +
        'animation:scn-b-chunk 1.3s ease-out forwards;animation-delay:calc(2.4s + var(--d,0s));}',
      '@keyframes scn-b-chunk{0%{transform:translate(-50%,-50%) scale(1);opacity:1}' +
        '100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) rotate(var(--rot)) scale(.5);opacity:0}}',
      '.scn-b-veil{position:absolute;inset:0;background:radial-gradient(circle,rgba(255,40,20,0) 30%,rgba(70,0,0,.9) 100%);' +
        'opacity:0;animation:scn-b-veil .9s ease-out 2.5s forwards;}',
      '@keyframes scn-b-veil{to{opacity:1}}',

      /* ---- 10. 字幕杀 ---- */
      '.scn-b-slam{background:#000;overflow:hidden}',
      '.scn-b-slam .flash{position:absolute;inset:0;background:#fff;opacity:0;' +
        'animation:scn-b-slamflash .3s ease-out forwards;}',
      '@keyframes scn-b-slamflash{0%{opacity:.9}100%{opacity:0}}',
      '.scn-b-slam .line{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%);' +
        'font-family:"Impact","Arial Black","SimHei",sans-serif;white-space:nowrap;' +
        'font-size:clamp(30px,8.4vw,96px);color:#fff;letter-spacing:.06em;' +
        'text-shadow:4px 4px 0 #ff3b30,-4px -4px 0 #22e6ff,0 0 30px rgba(255,226,61,.55);' +
        'animation:scn-b-slam1 .42s cubic-bezier(.2,1.5,.4,1) both;}',
      '@keyframes scn-b-slam1{0%{transform:translate(-50%,-50%) scale(3.4);opacity:0;filter:blur(4px)}' +
        '60%{transform:translate(-50%,-50%) scale(.94);opacity:1;filter:blur(0)}100%{transform:translate(-50%,-50%) scale(1)}}',
      '.scn-b-slam .line2{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);' +
        'font-size:clamp(16px,3.6vw,36px);color:#ffe23d;white-space:nowrap;max-width:94vw;' +
        'text-shadow:2px 2px 0 #000,0 0 18px rgba(255,226,61,.5);opacity:0;' +
        'animation:scn-b-slam2 .4s cubic-bezier(.2,1.4,.4,1) 1.1s forwards;}',
      '@keyframes scn-b-slam2{0%{opacity:0;transform:translate(-50%,-50%) scale(1.8)}' +
        '100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}',
      '.scn-b-slam .jitter{animation:scn-b-jitter .18s steps(2) infinite;}',
      '@keyframes scn-b-jitter{50%{translate:1px -1px}}',

      /* ---- 11. 人群逃亡 ---- */
      '.scn-b-flee{background:linear-gradient(#0b0608 0%,#12070a 55%,#000 100%);' +
        'animation:scn-b-flee-shake .28s steps(2) infinite;}',
      '@keyframes scn-b-flee-shake{0%,100%{transform:translate(0,0)}50%{transform:translate(-5px,3px)}}',
      '.scn-b-flee .city{position:absolute;left:-6%;right:-6%;bottom:0;height:58%;' +
        'background:#050307;transform:rotate(-4deg);transform-origin:50% 100%;' +
        'clip-path:polygon(0 30%,7% 18%,14% 34%,22% 12%,30% 38%,38% 20%,47% 42%,55% 16%,64% 36%,72% 8%,80% 30%,88% 14%,95% 32%,100% 20%,100% 100%,0 100%);}',
      '.scn-b-flee .window{position:absolute;width:1.6vmin;height:2.2vmin;background:rgba(255,226,61,.45);}',
      '.scn-b-flee .runner{position:absolute;bottom:30%;line-height:1;white-space:nowrap;' +
        'font-size:clamp(34px,7.4vw,86px);filter:drop-shadow(0 6px 0 rgba(0,0,0,.8));' +
        'animation:scn-b-flee-run 5.2s linear forwards;animation-delay:var(--d,0s);}',
      '@keyframes scn-b-flee-run{0%{transform:translateX(0)}100%{transform:translateX(132vw)}}',
      '.scn-b-flee .dust{position:absolute;bottom:24%;width:4vmin;height:3vmin;border-radius:50%;' +
        'background:rgba(255,226,61,.22);filter:blur(3px);' +
        'animation:scn-b-dust 1.8s linear infinite;animation-delay:var(--d,0s);}',
      '@keyframes scn-b-dust{0%{transform:translate(0,0) scale(.4);opacity:0}' +
        '30%{opacity:.9}100%{transform:translate(-22vw,-8vh) scale(1.8);opacity:0}}',

      /* ---- 12. 英雄登场 ---- */
      '.scn-b-hero{background:radial-gradient(circle at 50% 62%,#3a2a05 0%,#150d02 42%,#000 78%);overflow:hidden}',
      '.scn-b-hero .rays{position:absolute;left:50%;top:58%;width:180vmax;height:180vmax;' +
        'transform:translate(-50%,-50%);opacity:.5;' +
        'background:repeating-conic-gradient(from 0deg at 50% 50%,' +
        'rgba(255,226,61,.22) 0deg 4deg,transparent 4deg 14deg);' +
        'animation:scn-b-rays 12s linear infinite;' +
        '-webkit-mask-image:radial-gradient(circle,#000 12%,transparent 62%);' +
        'mask-image:radial-gradient(circle,#000 12%,transparent 62%);}',
      '@keyframes scn-b-rays{to{transform:translate(-50%,-50%) rotate(360deg)}}',
      '.scn-b-hero .cape{position:absolute;left:50%;bottom:14%;width:34vw;height:56vh;max-width:420px;' +
        'transform:translateX(-50%);background:linear-gradient(#2a0000,#000 80%);' +
        'clip-path:polygon(50% 0%,86% 34%,96% 82%,74% 100%,50% 88%,26% 100%,4% 82%,14% 34%);' +
        'filter:blur(.5px);animation:scn-b-cape 1.1s ease-in-out infinite alternate;transform-origin:50% 0;}',
      '@keyframes scn-b-cape{0%{transform:translateX(-50%) skewX(-4deg) scaleY(1)}' +
        '100%{transform:translateX(-50%) skewX(6deg) scaleY(1.04)}}',
      '.scn-b-hero .body{position:absolute;left:50%;bottom:18%;width:15vw;height:44vh;max-width:210px;' +
        'transform:translateX(-50%);background:linear-gradient(#141414,#000);' +
        'clip-path:polygon(44% 0%,56% 0%,58% 9%,55% 15%,68% 20%,74% 29%,71% 60%,65% 100%,57% 100%,' +
        '55% 66%,45% 66%,43% 100%,35% 100%,29% 60%,26% 29%,32% 20%,45% 15%,42% 9%);' +
        'animation:scn-b-heroPose 1.5s ease-in-out infinite;transform-origin:50% 100%;}',
      '@keyframes scn-b-heroPose{0%,100%{transform:translateX(-50%) rotate(0)}' +
        '35%{transform:translateX(-50%) rotate(-1.4deg)}70%{transform:translateX(-50%) rotate(1.4deg)}}',
      '.scn-b-hero .rim{position:absolute;left:50%;bottom:18%;width:15vw;height:44vh;max-width:210px;' +
        'transform:translateX(-50%) scale(1.09);background:#ffe9a0;opacity:.22;filter:blur(6px);' +
        'clip-path:polygon(44% 0%,56% 0%,58% 9%,55% 15%,68% 20%,74% 29%,71% 60%,65% 100%,57% 100%,' +
        '55% 66%,45% 66%,43% 100%,35% 100%,29% 60%,26% 29%,32% 20%,45% 15%,42% 9%);}',
      '.scn-b-hero .dust{position:absolute;bottom:0;left:0;right:0;height:22%;' +
        'background:radial-gradient(ellipse at 50% 100%,rgba(255,226,61,.34),transparent 70%);' +
        'animation:scn-b-hero-dust 1.6s ease-out infinite;}',
      '@keyframes scn-b-hero-dust{0%{opacity:.3;transform:translateY(6px)}100%{opacity:1;transform:translateY(0)}}'
    ].join('');

    var style = document.createElement('style');
    style.id = 'style-scenes-b';
    style.textContent = css;
    document.head.appendChild(style);
  }

  var active = null;

  function schedule(ctx, fn, delay) {
    var id = setTimeout(function () {
      var i = ctx.timers.indexOf(id);
      if (i >= 0) ctx.timers.splice(i, 1);
      fn();
    }, delay);
    ctx.timers.push(id);
    return id;
  }

  function sfx(ctx, delay, name) {
    schedule(ctx, function () {
      if (window.AUDIO) {
        try { window.AUDIO.play(name); } catch (e) { /* 忽略音频异常 */ }
      }
    }, delay);
  }

  function shakeAt(ctx, stage, delay) {
    schedule(ctx, function () {
      if (!stage) return;
      stage.classList.add('shake');
      schedule(ctx, function () { stage.classList.remove('shake'); }, 400);
    }, delay);
  }

  function add(parent, cls, styleText) {
    var d = document.createElement('div');
    if (cls) d.className = cls;
    if (styleText) d.setAttribute('style', styleText);
    parent.appendChild(d);
    return d;
  }

  function defineScene(id, label, duration, build) {
    return {
      id: id,
      label: label,
      duration: duration,
      mount: function (stage, idea, hints) {
        if (!stage) return;
        injectStyle();
        var ctx = {
          timers: [],
          layer: document.createElement('div')
        };
        ctx.layer.className = 'scene-layer scn-b-' + id;
        stage.appendChild(ctx.layer);
        active = ctx;
        try {
          build(ctx, ctx.layer, stage, idea, hints);
        } catch (e) {
          if (window.console) console.warn('[scenes-b]', id, e);
        }
      },
      cleanup: function () {
        if (!active) return;
        active.timers.forEach(function (t) { clearTimeout(t); });
        active.timers.length = 0;
        if (active.layer && active.layer.parentNode) {
          active.layer.parentNode.removeChild(active.layer);
        }
        active = null;
      }
    };
  }

  /* ============================================================
   * 场景 7：慢动作奔跑
   * ============================================================ */
  var slowmo = defineScene('slowmo', '慢动作奔跑', 3600, function (ctx, layer, stage, idea, hints) {
    add(layer, 'sun');
    add(layer, 'ground');

    // 速度线
    for (var i = 0; i < 9; i++) {
      var line = add(layer, 'scn-b-line');
      line.style.top = (18 + Math.random() * 54).toFixed(1) + '%';
      line.style.width = (12 + Math.random() * 24).toFixed(1) + 'vw';
      line.style.setProperty('--d', (-Math.random() * 1.4).toFixed(2) + 's');
    }

    // 飘浮碎屑
    for (var j = 0; j < 14; j++) {
      var deb = add(layer, 'scn-b-debris');
      deb.style.left = (10 + Math.random() * 80).toFixed(1) + '%';
      deb.style.top = (46 + Math.random() * 34).toFixed(1) + '%';
      deb.style.setProperty('--d', (-Math.random() * 2.4).toFixed(2) + 's');
      if (j % 4 === 0) deb.style.background = 'rgba(255,255,255,.4)';
    }

    var runner = add(layer, 'runner');
    runner.textContent = (hints && hints.hero) || '🏃';

    sfx(ctx, 100, 'sting');
    sfx(ctx, 900, 'whoosh');
    sfx(ctx, 2400, 'riser');
  });

  /* ============================================================
   * 场景 8：激光大战
   * ============================================================ */
  var duel = defineScene('duel', '激光大战', 3200, function (ctx, layer) {
    add(layer, 'grid');
    add(layer, 'flashcore');

    // 交叉光束：左右两侧、上下不同角度
    var shots = [
      { r: 12, c: 'red', d: 0.0 },
      { r: -18, c: 'green', d: 0.12 },
      { r: 168, c: 'green', d: 0.26 },
      { r: 196, c: 'red', d: 0.38 },
      { r: 44, c: 'green', d: 0.5 },
      { r: -48, c: 'red', d: 0.62 }
    ];
    shots.forEach(function (s) {
      var shot = add(layer, 'scn-b-shot ' + s.c);
      shot.style.setProperty('--r', s.r + 'deg');
      shot.style.setProperty('--d', s.d + 's');
    });

    // 命中火花
    for (var i = 0; i < 16; i++) {
      var sp = add(layer, 'scn-b-spark');
      var a = Math.PI * 2 * Math.random();
      var dist = 8 + Math.random() * 24;
      sp.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'vw');
      sp.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'vh');
      sp.style.setProperty('--d', (Math.random() * 0.9).toFixed(2) + 's');
      if (i % 3 === 0) sp.style.background = '#35ff8a';
    }

    for (var k = 0; k < 7; k++) sfx(ctx, 180 + k * 330, 'pew');
    sfx(ctx, 600, 'laser');
    shakeAt(ctx, layer.parentNode, 1800);
  });

  /* ============================================================
   * 场景 9：地球毁灭
   * ============================================================ */
  var doom = defineScene('doom', '地球毁灭', 4000, function (ctx, layer) {
    add(layer, 'earth');

    for (var i = 0; i < 3; i++) {
      var ring = add(layer, 'ring');
      ring.style.setProperty('--d', (i * 0.16) + 's');
    }

    for (var j = 0; j < 20; j++) {
      var chunk = add(layer, 'scn-b-chunk');
      var a = Math.PI * 2 * j / 20;
      var dist = 20 + Math.random() * 26;
      chunk.style.setProperty('--dx', (Math.cos(a) * dist).toFixed(1) + 'vw');
      chunk.style.setProperty('--dy', (Math.sin(a) * dist).toFixed(1) + 'vh');
      chunk.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      chunk.style.setProperty('--d', (Math.random() * 0.2).toFixed(2) + 's');
    }

    add(layer, 'veil');

    sfx(ctx, 100, 'epic');
    sfx(ctx, 2350, 'bigboom');
    sfx(ctx, 2700, 'thunder');
    shakeAt(ctx, layer.parentNode, 2400);
  });

  /* ============================================================
   * 场景 10：字幕杀
   * ============================================================ */
  var slam = defineScene('slam', '字幕杀', 2600, function (ctx, layer, stage, idea) {
    add(layer, 'flash');

    var line = add(layer, 'line jitter');
    line.textContent = '就在这时——';

    var text = (idea && String(idea).trim()) ? String(idea).trim() : '这个脑洞';
    if (text.length > 16) text = text.slice(0, 16) + '……';
    var line2 = add(layer, 'line2');
    line2.textContent = text + '，发生了';

    sfx(ctx, 60, 'slam');
    sfx(ctx, 120, 'sting');
    sfx(ctx, 1200, 'glitch');
  });

  /* ============================================================
   * 场景 11：人群逃亡
   * ============================================================ */
  var flee = defineScene('flee', '人群逃亡', 3000, function (ctx, layer, stage, idea, hints) {
    var city = add(layer, 'city');
    // 楼里零星窗灯
    for (var w = 0; w < 14; w++) {
      var win = document.createElement('div');
      win.className = 'scn-b-flee window';
      win.style.left = (6 + Math.random() * 88).toFixed(1) + '%';
      win.style.top = (46 + Math.random() * 48).toFixed(1) + '%';
      win.style.opacity = (0.2 + Math.random() * 0.6).toFixed(2);
      city.appendChild(win);
    }

    // 不同速度的逃跑人群（第一个换成脑洞里的主角）
    var chars = ['🏃', '🏃‍♀️', '💼', '🏃', '🧍', '🏃', '🏃‍♂️'];
    if (hints && hints.hero) chars[0] = hints.hero;
    chars.forEach(function (ch, i) {
      var r = add(layer, 'runner');
      r.textContent = ch;
      r.style.bottom = (22 + (i % 3) * 7) + '%';
      r.style.setProperty('--d', (-i * 0.55).toFixed(2) + 's');
      r.style.fontSize = 'clamp(28px,' + (5.6 + (i % 3) * 1.2) + 'vw,80px)';
    });

    // 尘土
    for (var d = 0; d < 8; d++) {
      var dust = add(layer, 'dust');
      dust.style.left = (10 + Math.random() * 80).toFixed(1) + '%';
      dust.style.setProperty('--d', (-Math.random() * 1.8).toFixed(2) + 's');
    }

    sfx(ctx, 80, 'crowd');
    sfx(ctx, 700, 'whoosh');
    sfx(ctx, 1800, 'crowd');
    shakeAt(ctx, layer.parentNode, 100);
  });

  /* ============================================================
   * 场景 12：英雄登场
   * ============================================================ */
  var hero = defineScene('hero', '英雄登场', 3400, function (ctx, layer) {
    add(layer, 'rays');
    add(layer, 'cape');
    add(layer, 'rim');
    add(layer, 'body');
    add(layer, 'dust');

    sfx(ctx, 120, 'riser');
    sfx(ctx, 900, 'epic');
    sfx(ctx, 1100, 'gong');
    schedule(ctx, function () {
      if (window.AUDIO) { try { window.AUDIO.play('boom'); } catch (e) {} }
    }, 1700);
  });

  window.SCENES_B = [slowmo, duel, doom, slam, flee, hero];
})();
