/* ============================================================
 * 场景组 A · 五毛特效预演器
 * 提供 window.SCENES_A：ufo / boom / beam / kaiju / meteor / storm
 * 统一接口 { id, label, duration, mount(stage, idea), cleanup() }
 * ============================================================ */
(function () {
  'use strict';
  if (window.SCENES_A) return;

  /* ---------- 通用工具 ---------- */

  function injectStyle() {
    if (document.getElementById('style-scenes-a')) return;
    var css = [
      /* ---- 通用：主角 emoji 摇摆 ---- */
      '.idea-bob{animation:idea-bob .92s ease-in-out infinite;transform-origin:50% 100%}',
      '@keyframes idea-bob{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-9%) rotate(4deg)}}',
      /* ---- 1. 飞碟来袭 ---- */
      '.scn-a-ufo{background:radial-gradient(circle at 50% 26%, #0c1c30 0%, #030711 62%, #000 100%)}',
      '.scn-a-ufo .stars{position:absolute;inset:0;opacity:.85;background-image:' +
        'radial-gradient(1.5px 1.5px at 12% 18%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 28% 42%, #cfe9ff, transparent),' +
        'radial-gradient(2px 2px at 46% 12%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 63% 33%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 79% 20%, #d8f6ff, transparent),' +
        'radial-gradient(2px 2px at 88% 52%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 35% 72%, #fff, transparent),' +
        'radial-gradient(1.5px 1.5px at 71% 78%, #cfe9ff, transparent);' +
        'animation:scn-a-twinkle 1.6s steps(2) infinite;}',
      '@keyframes scn-a-twinkle{0%,100%{opacity:.85}50%{opacity:.45}}',
      '.scn-a-ufo .horizon{position:absolute;left:0;right:0;bottom:0;height:22%;' +
        'background:linear-gradient(#000,rgba(10,30,18,.9));' +
        'box-shadow:0 -2px 0 rgba(53,255,138,.25);}',
      '.scn-a-saucer{position:absolute;top:22%;left:-30vw;width:30vw;max-width:300px;' +
        'aspect-ratio:2.4/1;animation:scn-a-ufo-fly 3.2s linear forwards;}',
      '.scn-a-saucer .body{position:absolute;inset:0;border-radius:50%;' +
        'background:linear-gradient(180deg,#e6f2ff 0%,#9db3cc 46%,#40536b 100%);' +
        'box-shadow:0 0 0 3px #000,0 0 34px rgba(53,255,138,.45);}',
      '.scn-a-saucer .dome{position:absolute;left:50%;top:-40%;transform:translateX(-50%);' +
        'width:46%;height:62%;border-radius:50% 50% 8% 8%/100% 100% 0 0;' +
        'background:radial-gradient(circle at 50% 82%,#8ffcff 0%,#1d8fa8 62%,#072b38 100%);' +
        'box-shadow:0 0 0 3px #000,0 0 22px rgba(34,230,255,.75);}',
      '.scn-a-saucer .dome::after{content:"";position:absolute;left:22%;top:18%;width:22%;height:30%;' +
        'border-radius:50%;background:rgba(255,255,255,.75);filter:blur(1px);}',
      '.scn-a-saucer .lamp{position:absolute;bottom:-2px;left:50%;transform:translateX(-50%);' +
        'width:70%;height:12%;border-radius:50%;background:#35ff8a;' +
        'box-shadow:0 0 18px 6px rgba(53,255,138,.65);animation:scn-a-lamp 0.3s steps(2) infinite;}',
      '@keyframes scn-a-lamp{50%{opacity:.35}}',
      '.scn-a-saucer .ray{position:absolute;left:50%;top:88%;transform:translateX(-50%);' +
        'width:58%;height:46vh;clip-path:polygon(36% 0,64% 0,100% 100%,0 100%);' +
        'background:linear-gradient(180deg,rgba(53,255,138,.72),rgba(53,255,138,0));' +
        'mix-blend-mode:screen;animation:scn-a-ray 0.42s steps(2) infinite;filter:blur(1px);}',
      '@keyframes scn-a-ray{0%,100%{opacity:.2}50%{opacity:.85}}',
      '@keyframes scn-a-ufo-fly{',
      '0%{transform:translate(0,0) rotate(-2deg)}',
      '24%{transform:translate(28vw,-7vh) rotate(3deg)}',
      '48%{transform:translate(56vw,5vh) rotate(-3deg)}',
      '72%{transform:translate(86vw,-6vh) rotate(2deg)}',
      '100%{transform:translate(148vw,2vh) rotate(0deg)}}',

      /* ---- 2. 手绘大爆炸 ---- */
      '.scn-a-boom{background:#120101;animation:scn-a-boom-bg .2s steps(2) infinite}',
      '@keyframes scn-a-boom-bg{0%{background:#120101}50%{background:#2c0505}100%{background:#080000}}',
      '.scn-a-boom .ring{position:absolute;left:50%;top:48%;width:12vmin;height:12vmin;' +
        'margin:-6vmin 0 0 -6vmin;border-radius:50%;border:0.9vmin solid #ffe23d;' +
        'opacity:0;animation:scn-a-ring-out .9s ease-out forwards;animation-delay:var(--d,0s);}',
      '.scn-a-boom .ring:nth-child(2){border-color:#ff3b30}',
      '.scn-a-boom .ring:nth-child(3){border-color:#fff}',
      '@keyframes scn-a-ring-out{',
      '0%{transform:scale(.15);opacity:1}',
      '100%{transform:scale(9);opacity:0;border-width:1px}}',
      '.scn-a-boom .core{position:absolute;left:50%;top:48%;width:30vmin;height:30vmin;' +
        'margin:-15vmin 0 0 -15vmin;border-radius:50%;' +
        'background:radial-gradient(circle,#fff 0%,#ffe23d 26%,#ff7b00 48%,rgba(255,59,48,.55) 70%,transparent 76%);' +
        'filter:blur(2px);animation:scn-a-core .7s ease-out forwards;}',
      '@keyframes scn-a-core{0%{transform:scale(.2);opacity:1}60%{opacity:1}100%{transform:scale(1.9);opacity:0}}',
      '.scn-a-boom .word{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%) rotate(-7deg);' +
        'font-family:"Impact","Arial Black","SimHei",sans-serif;font-size:clamp(52px,14vw,160px);' +
        'line-height:1;color:#ffe23d;white-space:nowrap;' +
        'text-shadow:5px 5px 0 #ff3b30,-5px -5px 0 #ff3b30,5px -5px 0 #ff3b30,-5px 5px 0 #ff3b30,' +
        '0 0 44px rgba(255,59,48,.85),0 10px 0 #3a0000;' +
        'animation:scn-a-word .55s cubic-bezier(.2,1.6,.4,1) both;}',
      '@keyframes scn-a-word{',
      '0%{transform:translate(-50%,-50%) rotate(-16deg) scale(3);opacity:0}',
      '62%{transform:translate(-50%,-50%) rotate(-5deg) scale(.92);opacity:1}',
      '100%{transform:translate(-50%,-50%) rotate(-7deg) scale(1);opacity:1}}',
      '.scn-a-frag{position:absolute;left:50%;top:48%;width:1.6vmin;height:1.6vmin;' +
        'background:#ffd23d;box-shadow:0 0 8px rgba(255,120,0,.8);' +
        'animation:scn-a-frag .95s ease-out forwards;animation-delay:var(--d,0s);}',
      '@keyframes scn-a-frag{',
      '0%{transform:translate(-50%,-50%) scale(1.4) rotate(0);opacity:1}',
      '100%{transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.4) rotate(var(--rot));opacity:0}}',

      /* ---- 3. 奥特曼光线 ---- */
      '.scn-a-beam{background:radial-gradient(circle at 30% 20%,#2a0a1c 0%,#05030a 55%,#000 100%)}',
      '.scn-a-beam .grid{position:absolute;inset:0;opacity:.16;' +
        'background-image:linear-gradient(rgba(34,230,255,.5) 1px,transparent 1px),' +
        'linear-gradient(90deg,rgba(255,43,209,.5) 1px,transparent 1px);' +
        'background-size:8vw 8vw;transform:perspective(340px) rotateX(48deg) scale(1.6);' +
        'transform-origin:50% 100%;}',
      '.scn-a-beam .wrap{position:absolute;left:-34%;top:6%;width:170%;height:22vh;' +
        'transform:rotate(30deg);transform-origin:left center;overflow:visible;}',
      '.scn-a-beam .bar{position:absolute;inset:0;transform:scaleX(.02);transform-origin:left center;' +
        'background:linear-gradient(90deg,#ff2b3d 0%,#fff 30%,#9df6ff 58%,#22e6ff 78%,#2b5bff 100%);' +
        'clip-path:polygon(0 44%,100% 0,100% 100%,0 56%);' +
        'box-shadow:0 0 42px #22e6ff,0 0 90px rgba(255,43,209,.7);' +
        'animation:scn-a-beam-sweep 1.15s cubic-bezier(.5,0,.9,.4) forwards,scn-a-beam-flick .16s steps(2) infinite;}',
      '@keyframes scn-a-beam-sweep{0%{transform:scaleX(.02)}100%{transform:scaleX(1)}}',
      '@keyframes scn-a-beam-flick{50%{opacity:.72}}',
      '.scn-a-beam .hit{position:absolute;left:56%;top:58%;width:22vmin;height:22vmin;' +
        'margin:-11vmin 0 0 -11vmin;border-radius:50%;' +
        'background:radial-gradient(circle,#fff 0%,#ffe23d 30%,rgba(255,59,48,.5) 62%,transparent 72%);' +
        'opacity:0;animation:scn-a-hit 1.1s ease-out 1.05s forwards;filter:blur(1px);}',
      '.scn-a-beam .shock{position:absolute;left:56%;top:58%;width:18vmin;height:18vmin;' +
        'margin:-9vmin 0 0 -9vmin;border-radius:50%;border:0.8vmin solid #22e6ff;' +
        'opacity:0;animation:scn-a-shock 1s ease-out 1.1s forwards;}',
      '@keyframes scn-a-hit{0%{transform:scale(.2);opacity:1}100%{transform:scale(2.4);opacity:0}}',
      '@keyframes scn-a-shock{0%{transform:scale(.3);opacity:1}100%{transform:scale(5);opacity:0;border-width:1px}}',

      /* ---- 4. 巨大怪兽 ---- */
      '.scn-a-kaiju{background:linear-gradient(#190a14 0%,#0a0a12 46%,#000 100%)}',
      '.scn-a-kaiju .moon{position:absolute;left:50%;top:12%;width:16vmin;height:16vmin;' +
        'margin-left:-8vmin;border-radius:50%;background:#f4f0d0;opacity:.32;' +
        'box-shadow:0 0 40px 10px rgba(244,240,208,.28);}',
      '.scn-a-kaiju .city{position:absolute;left:-2%;right:-2%;bottom:0;height:44%;' +
        'display:flex;align-items:flex-end;justify-content:space-around;filter:brightness(0);}',
      '.scn-a-kaiju .city span{line-height:1;font-size:11vw;transform:translateY(4px);}',
      '.scn-a-kaiju .city span:nth-child(2n){font-size:8vw}',
      '.scn-a-kaiju .city span:nth-child(3n){font-size:14vw}',
      '.scn-a-kaiju .beast{position:absolute;left:50%;bottom:-46%;width:40vw;height:56vh;max-width:480px;' +
        'transform:translateX(-50%);background:linear-gradient(#161616 0%,#000 88%);' +
        'clip-path:polygon(30% 0%,42% 0%,46% 9%,54% 9%,58% 0%,70% 0%,75% 13%,89% 20%,97% 36%,92% 49%,' +
        '78% 47%,74% 100%,26% 100%,22% 47%,8% 49%,3% 36%,11% 20%,25% 13%);' +
        'filter:drop-shadow(0 0 26px rgba(255,59,48,.35));' +
        'animation:scn-a-beast-rise 3.4s ease-out forwards,scn-a-beast-sway 1.4s ease-in-out 1.2s infinite;}',
      '@keyframes scn-a-beast-rise{0%{transform:translateX(-50%) translateY(0)}100%{transform:translateX(-50%) translateY(-58%)}}',
      '@keyframes scn-a-beast-sway{0%,100%{rotate:-1.6deg}50%{rotate:1.6deg}}',
      '.scn-a-kaiju .eye{position:absolute;top:13%;width:3.4vmin;height:2.2vmin;border-radius:50%;' +
        'background:#ff2b2b;box-shadow:0 0 16px 4px rgba(255,43,43,.9);animation:scn-a-eye 1s steps(2) infinite;}',
      '.scn-a-kaiju .eye.l{left:37%}.scn-a-kaiju .eye.r{right:37%}',
      '@keyframes scn-a-eye{50%{opacity:.25}}',
      '.scn-a-kaiju .fire{position:absolute;bottom:0;left:0;right:0;height:16%;' +
        'background:radial-gradient(ellipse at 50% 100%,rgba(255,120,0,.8),rgba(255,59,48,.28) 45%,transparent 72%);' +
        'animation:scn-a-fire .16s steps(2) infinite;}',
      '@keyframes scn-a-fire{50%{opacity:.55}}',

      /* ---- 5. 天降陨石 ---- */
      '.scn-a-meteor{background:linear-gradient(#2a0d0d 0%,#12030a 40%,#000 100%);overflow:hidden}',
      '.scn-a-meteor .skyline{position:absolute;left:0;right:0;bottom:0;height:20%;background:#000;' +
        'clip-path:polygon(0 46%,6% 32%,13% 52%,21% 26%,28% 55%,37% 30%,46% 58%,55% 36%,64% 60%,72% 34%,81% 56%,90% 30%,100% 44%,100% 100%,0 100%);}',
      '.scn-a-meteor .wrap{position:absolute;left:78%;top:2%;animation:scn-a-meteor-fly 1.9s cubic-bezier(.35,0,.85,.7) forwards;}',
      '@keyframes scn-a-meteor-fly{0%{transform:translate(0,0) rotate(6deg)}100%{transform:translate(-58vw,60vh) rotate(34deg)}}',
      '.scn-a-meteor .rock{font-size:clamp(38px,9vw,96px);line-height:1;filter:drop-shadow(0 0 22px rgba(255,140,0,.9));}',
      '.scn-a-meteor .tail{position:absolute;right:70%;top:46%;width:40vw;height:4.6vh;border-radius:50%;' +
        'transform:rotate(-18deg);transform-origin:right center;' +
        'background:linear-gradient(90deg,transparent 0%,rgba(255,90,0,.25) 34%,rgba(255,180,0,.72) 72%,#fff 100%);' +
        'filter:blur(3px);}',
      '.scn-a-meteor .impact{position:absolute;left:20%;top:66%;width:26vmin;height:26vmin;' +
        'margin:-13vmin 0 0 -13vmin;border-radius:50%;' +
        'background:radial-gradient(circle,#fff 0%,#ffe23d 24%,#ff5b00 50%,rgba(255,59,48,.42) 68%,transparent 76%);' +
        'opacity:0;animation:scn-a-impact 1.1s ease-out 1.92s forwards;filter:blur(2px);}',
      '@keyframes scn-a-impact{0%{transform:scale(.1);opacity:1}100%{transform:scale(2.2);opacity:0}}',
      '.scn-a-meteor .wave{position:absolute;left:20%;top:66%;width:16vmin;height:16vmin;' +
        'margin:-8vmin 0 0 -8vmin;border-radius:50%;border:0.7vmin solid #ffb000;' +
        'opacity:0;animation:scn-a-wave 1s ease-out 1.98s forwards;}',
      '@keyframes scn-a-wave{0%{transform:scale(.2);opacity:1}100%{transform:scale(6);opacity:0;border-width:1px}}',

      /* ---- 6. 闪电风暴 ---- */
      '.scn-a-storm{background:linear-gradient(#0a1220 0%,#060a12 50%,#000 100%);overflow:hidden}',
      '.scn-a-storm .cloud{position:absolute;left:-10%;right:-10%;height:46%;' +
        'background:radial-gradient(ellipse at 28% 68%,#20293a 0%,transparent 62%),' +
        'radial-gradient(ellipse at 64% 58%,#1b2433 0%,transparent 60%),' +
        'radial-gradient(ellipse at 88% 74%,#161e2a 0%,transparent 58%);filter:blur(6px);opacity:.95;}',
      '.scn-a-storm .cloud.top{top:0}',
      '.scn-a-storm .city{position:absolute;left:0;right:0;bottom:0;height:24%;background:#01030a;' +
        'clip-path:polygon(0 52%,8% 38%,16% 56%,25% 30%,33% 58%,44% 34%,53% 60%,62% 36%,71% 58%,80% 32%,89% 54%,100% 40%,100% 100%,0 100%);}',
      '.scn-a-storm .rain{position:absolute;inset:-12% -10% 0 -10%;}',
      '.scn-a-drop{position:absolute;top:-12%;width:1px;height:13vh;' +
        'background:linear-gradient(180deg,transparent,rgba(198,232,255,.72));' +
        'animation:scn-a-dropfall .62s linear infinite;animation-delay:var(--d,0s);opacity:.7;}',
      '@keyframes scn-a-dropfall{0%{transform:translate(0,-10vh)}100%{transform:translate(-16vw,116vh)}}',
      '.scn-a-bolt{position:absolute;inset:0;opacity:0;filter:drop-shadow(0 0 22px rgba(190,225,255,.95));' +
        'animation:scn-a-boltflash 1.1s steps(1) forwards;animation-delay:var(--d,0s);}',
      '@keyframes scn-a-boltflash{',
      '0%,4%{opacity:0}5%{opacity:1}9%{opacity:.1}12%{opacity:1}18%{opacity:0}100%{opacity:0}}',
      '.scn-a-storm .flick{position:absolute;inset:0;background:#dceaff;opacity:0;' +
        'animation:scn-a-flick 1.1s steps(1) infinite;animation-delay:var(--d,0s);pointer-events:none;}',
      '@keyframes scn-a-flick{0%,100%{opacity:0}6%{opacity:.34}8%{opacity:0}14%{opacity:.22}16%{opacity:0}}'
    ].join('');

    var style = document.createElement('style');
    style.id = 'style-scenes-a';
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* 当前挂载上下文：只允许同时存在一个场景 */
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
        ctx.layer.className = 'scene-layer scn-a-' + id;
        stage.appendChild(ctx.layer);
        active = ctx;
        try {
          build(ctx, ctx.layer, stage, idea, hints);
        } catch (e) {
          /* 单个场景异常不能拖垮整场预演 */
          if (window.console) console.warn('[scenes-a]', id, e);
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
   * 场景 1：飞碟来袭
   * ============================================================ */
  var ufo = defineScene('ufo', '飞碟来袭', 3200, function (ctx, layer, stage, idea, hints) {
    add(layer, 'stars');
    add(layer, 'horizon');

    var saucer = add(layer, 'scn-a-saucer');
    add(saucer, 'body');
    add(saucer, 'dome');
    add(saucer, 'lamp');
    var ray = add(saucer, 'ray');

    // 飞碟的光柱跟着类型走色（恐怖片是血红，动物世界是绿）
    if (hints && hints.theme && hints.theme.accent) {
      ray.style.background = 'linear-gradient(180deg,' + hints.theme.accent + 'b8,rgba(0,0,0,0))';
    }

    sfx(ctx, 120, 'ufo');
    sfx(ctx, 1450, 'whoosh');
    sfx(ctx, 2600, 'glitch');
  });

  /* ============================================================
   * 场景 2：手绘大爆炸
   * ============================================================ */
  var boom = defineScene('boom', '手绘大爆炸', 3000, function (ctx, layer) {
    for (var i = 0; i < 3; i++) {
      var ring = add(layer, 'ring');
      ring.style.setProperty('--d', (i * 0.12) + 's');
    }
    add(layer, 'core');

    // 飞散碎片：随机方向、距离、旋转
    for (var j = 0; j < 22; j++) {
      var frag = add(layer, 'scn-a-frag');
      var angle = (Math.PI * 2 * j) / 22 + Math.random() * 0.5;
      var dist = 22 + Math.random() * 30;
      frag.style.setProperty('--dx', (Math.cos(angle) * dist).toFixed(1) + 'vw');
      frag.style.setProperty('--dy', (Math.sin(angle) * dist * 0.7).toFixed(1) + 'vh');
      frag.style.setProperty('--rot', (Math.random() * 720 - 360).toFixed(0) + 'deg');
      frag.style.setProperty('--d', (Math.random() * 0.18).toFixed(2) + 's');
      if (j % 3 === 0) frag.style.background = '#fff';
      else if (j % 3 === 1) frag.style.background = '#ff7b00';
    }

    var word = add(layer, 'word');
    word.textContent = 'BOOM!';

    sfx(ctx, 80, 'bigboom');
    sfx(ctx, 520, 'boom');
  });

  /* ============================================================
   * 场景 3：奥特曼光线
   * ============================================================ */
  var beam = defineScene('beam', '奥特曼光线', 3400, function (ctx, layer, stage, idea, hints) {
    add(layer, 'grid');

    var wrap = add(layer, 'wrap');
    add(wrap, 'bar');

    add(layer, 'hit');
    add(layer, 'shock');

    // 被光线命中的东西，换成脑洞里提到的对象
    if (hints && hints.target) {
      var t = add(layer, '', 'position:absolute;left:56%;top:58%;font-size:9vmin;line-height:1;' +
        'transform:translate(-50%,-50%);opacity:0;z-index:2;' +
        'animation:scn-a-hit 1.1s ease-out 1.05s forwards;' +
        'filter:drop-shadow(0 6px 0 rgba(0,0,0,.55))');
      t.textContent = hints.target;
    }

    sfx(ctx, 260, 'riser');
    schedule(ctx, function () {
      if (window.AUDIO) { try { window.AUDIO.play('laser'); } catch (e) {} }
    }, 950);
    schedule(ctx, function () {
      if (window.AUDIO) { try { window.AUDIO.play('bigboom'); } catch (e) {} }
    }, 1480);
    shakeAt(ctx, layer.parentNode, 1480);
  });

  /* ============================================================
   * 场景 4：巨大怪兽
   * ============================================================ */
  var kaiju = defineScene('kaiju', '巨大怪兽', 3600, function (ctx, layer, stage, idea, hints) {
    add(layer, 'moon');

    var city = add(layer, 'city');
    var places = (hints && hints.places) || ['🏢', '🏬', '🏣'];
    for (var i = 0; i < 9; i++) {
      var b = document.createElement('span');
      b.textContent = places[i % places.length];
      city.appendChild(b);
    }

    // 主角站在废墟前，和怪兽对峙
    if (hints && hints.hero) {
      var h = add(layer, 'idea-bob', 'position:absolute;left:13%;bottom:5%;z-index:3;' +
        'font-size:11vmin;line-height:1;' +
        'filter:drop-shadow(0 6px 0 rgba(0,0,0,.6)) drop-shadow(0 0 18px rgba(255,226,61,.35))');
      h.textContent = hints.hero;
    }

    var beast = add(layer, 'beast');
    add(beast, 'eye l');
    add(beast, 'eye r');

    add(layer, 'fire');

    sfx(ctx, 180, 'roar');
    sfx(ctx, 1500, 'roar');
    sfx(ctx, 2450, 'slam');
    shakeAt(ctx, layer.parentNode, 2500);
  });

  /* ============================================================
   * 场景 5：天降陨石
   * ============================================================ */
  var meteor = defineScene('meteor', '天降陨石', 3400, function (ctx, layer) {
    add(layer, 'skyline');

    var wrap = add(layer, 'wrap');
    add(wrap, 'tail');
    var rock = add(wrap, 'rock');
    rock.textContent = '☄️';

    add(layer, 'impact');
    add(layer, 'wave');

    sfx(ctx, 60, 'meteor');
    sfx(ctx, 1910, 'bigboom');
    shakeAt(ctx, layer.parentNode, 1940);
  });

  /* ============================================================
   * 场景 6：闪电风暴
   * ============================================================ */
  var storm = defineScene('storm', '闪电风暴', 3000, function (ctx, layer) {
    add(layer, 'cloud top');
    add(layer, 'cloud');

    // 雨丝
    var rain = add(layer, 'rain');
    for (var i = 0; i < 46; i++) {
      var drop = document.createElement('div');
      drop.className = 'scn-a-drop';
      drop.style.left = (Math.random() * 120 - 10).toFixed(2) + '%';
      drop.style.height = (8 + Math.random() * 10).toFixed(1) + 'vh';
      drop.style.setProperty('--d', (-Math.random() * 0.62).toFixed(2) + 's');
      drop.style.opacity = (0.35 + Math.random() * 0.5).toFixed(2);
      rain.appendChild(drop);
    }

    add(layer, 'city');

    // 两道折线闪电（内联 SVG，不依赖外部资源）
    var boltData = [
      { d: '0.15s', x: '30%', points: '120,0 96,190 152,214 104,430 160,452 118,700' },
      { d: '1.25s', x: '62%', points: '150,0 178,150 128,172 186,356 136,382 172,620' }
    ];
    boltData.forEach(function (cfg) {
      var svgNS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('class', 'scn-a-bolt');
      svg.setAttribute('viewBox', '0 0 300 720');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.left = cfg.x;
      svg.style.width = '26vw';
      svg.style.setProperty('--d', cfg.d);
      var line = document.createElementNS(svgNS, 'polyline');
      line.setAttribute('points', cfg.points);
      line.setAttribute('fill', 'none');
      line.setAttribute('stroke', '#eaf4ff');
      line.setAttribute('stroke-width', '9');
      line.setAttribute('stroke-linejoin', 'miter');
      var glow = document.createElementNS(svgNS, 'polyline');
      glow.setAttribute('points', cfg.points);
      glow.setAttribute('fill', 'none');
      glow.setAttribute('stroke', '#8fd4ff');
      glow.setAttribute('stroke-width', '26');
      glow.setAttribute('opacity', '0.32');
      svg.appendChild(glow);
      svg.appendChild(line);
      layer.appendChild(svg);
    });

    var flick = add(layer, 'flick');
    flick.style.setProperty('--d', '0.1s');

    sfx(ctx, 300, 'thunder');
    sfx(ctx, 1450, 'thunder');
    sfx(ctx, 1450, 'rain');
  });

  window.SCENES_A = [ufo, boom, beam, kaiju, meteor, storm];
})();
