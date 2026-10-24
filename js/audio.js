/* ============================================================
 * 脑洞预演器 · 五毛音效库（audio.js）
 * 纯 Web Audio API 现场合成，无音频文件、无网络请求。
 * classic script，仅导出全局 window.AUDIO。
 * 浏览器不支持 AudioContext 时静默降级；所有公开方法均不抛异常。
 * ============================================================ */
(function () {
  'use strict';

  var AC = window.AudioContext || window.webkitAudioContext || null;
  var MASTER_LEVEL = 0.8;   // 总音量
  var BGM_LEVEL = 0.035;    // BGM 总线音量（刻意很低）
  var BGM_STEP = 0.25;      // 120 BPM 的八分音符
  var BGM_PATTERN = [130.81, 155.56, 196.00, 261.63, 196.00, 155.56, 130.81, 196.00]; // Cm 分解：C3 Eb3 G3 C4 ...
  var BGM_ROOT = 65.41;     // 低音根音 C2

  var ctx = null;
  var master = null;
  var compressor = null;
  var noiseCache = Object.create(null);
  var muted = false;

  var BGM = {
    timer: null,
    bus: null,
    playing: false,
    nextTime: 0,
    step: 0
  };

  /* ---------------- 基础工具 ---------------- */

  // 创建/恢复 AudioContext（幂等）。返回是否可用。
  function ensure() {
    if (!AC) return false;
    if (!ctx) {
      try {
        ctx = new AC();
        // 防爆音：先压缩再进扬声器
        compressor = ctx.createDynamicsCompressor();
        compressor.threshold.value = -16;
        compressor.knee.value = 16;
        compressor.ratio.value = 6;
        compressor.attack.value = 0.004;
        compressor.release.value = 0.25;

        master = ctx.createGain();
        master.gain.value = muted ? 0 : MASTER_LEVEL;
        master.connect(compressor);
        compressor.connect(ctx.destination);
      } catch (e) {
        // 创建失败：彻底退回静默模式
        ctx = null;
        master = null;
        compressor = null;
        return false;
      }
    }
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
      try {
        var p = ctx.resume();
        if (p && typeof p.catch === 'function') p.catch(function () {});
      } catch (e2) { /* 忽略自动播放限制 */ }
    }
    return true;
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function mkGain(v) {
    var g = ctx.createGain();
    g.gain.value = v;
    return g;
  }

  function mkFilter(type, freq, q) {
    var f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    if (typeof q === 'number') f.Q.value = q;
    return f;
  }

  // 缓存噪声 buffer（白噪声 / 棕噪声），避免重复生成
  function getNoise(kind) {
    kind = kind || 'white';
    if (noiseCache[kind]) return noiseCache[kind];
    var seconds = 2.2;
    var len = Math.floor(ctx.sampleRate * seconds);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    var i;
    if (kind === 'brown') {
      var last = 0;
      for (i = 0; i < len; i++) {
        var white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = Math.max(-1, Math.min(1, last * 3.5));
      }
    } else {
      for (i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    }
    noiseCache[kind] = buf;
    return buf;
  }

  function noiseAt(kind, t0, dur) {
    var src = ctx.createBufferSource();
    src.buffer = getNoise(kind);
    src.start(t0);
    src.stop(t0 + dur);
    return src;
  }

  // 打击型包络：短 attack 防 click，指数衰减到近零
  function perc(g, t0, peak, attack, decay) {
    var p = g.gain;
    p.setValueAtTime(0.0001, t0);
    p.linearRampToValueAtTime(peak, t0 + attack);
    p.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
  }

  // 播放结束后断开所有一次性节点，防止节点泄漏
  function cleanup(src, nodes) {
    src.onended = function () {
      try { src.disconnect(); } catch (e) {}
      if (nodes) {
        for (var i = 0; i < nodes.length; i++) {
          try { nodes[i].disconnect(); } catch (e2) {}
        }
      }
    };
  }

  /* ---------------- 一次性音效 ---------------- */

  // 爆炸：白噪声 + lowpass 800→60Hz
  function sBoom() {
    var t = now(), dur = 1.2;
    var src = noiseAt('white', t, dur);
    var lp = mkFilter('lowpass', 800, 0.9);
    lp.frequency.setValueAtTime(800, t);
    lp.frequency.exponentialRampToValueAtTime(60, t + dur);
    var g = mkGain(0.0001);
    perc(g, t, 0.5, 0.005, dur - 0.005);
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    cleanup(src, [lp, g]);
  }

  // 大爆炸：两层噪声 + 40Hz 次低频冲击
  function sBigBoom() {
    var t = now(), dur = 1.8;

    // 第一层：棕噪声低频主体
    var src1 = noiseAt('brown', t, dur);
    var lp1 = mkFilter('lowpass', 500, 1.1);
    lp1.frequency.setValueAtTime(500, t);
    lp1.frequency.exponentialRampToValueAtTime(45, t + dur);
    var g1 = mkGain(0.0001);
    perc(g1, t, 0.55, 0.008, dur - 0.008);
    src1.connect(lp1);
    lp1.connect(g1);
    g1.connect(master);
    cleanup(src1, [lp1, g1]);

    // 第二层：白噪声带通快速下扫，做出碎裂质感
    var dur2 = dur * 0.8;
    var src2 = noiseAt('white', t, dur2);
    var bp2 = mkFilter('bandpass', 1400, 0.8);
    bp2.frequency.setValueAtTime(1400, t);
    bp2.frequency.exponentialRampToValueAtTime(120, t + dur2);
    var g2 = mkGain(0.0001);
    perc(g2, t, 0.22, 0.005, dur2 - 0.005);
    src2.connect(bp2);
    bp2.connect(g2);
    g2.connect(master);
    cleanup(src2, [bp2, g2]);

    // 40Hz 附近的正弦冲击
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(50, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.9);
    var g3 = mkGain(0.0001);
    perc(g3, t, 0.35, 0.01, 1.2);
    o.connect(g3);
    g3.connect(master);
    o.start(t);
    o.stop(t + 1.25);
    cleanup(o, [g3]);
  }

  // 激光："噬——" 锯齿 1800→200Hz 下扫
  function sLaser() {
    var t = now(), dur = 0.4;
    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(1800, t);
    o.frequency.exponentialRampToValueAtTime(200, t + dur);
    var lp = mkFilter('lowpass', 2600, 1.2);
    var g = mkGain(0.0001);
    perc(g, t, 0.18, 0.005, dur - 0.005);
    o.connect(lp);
    lp.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
    cleanup(o, [lp, g]);
  }

  // 小激光枪：square 900→1400→600Hz，约 0.12s
  function sPew() {
    var t = now(), dur = 0.12;
    var o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(900, t);
    o.frequency.linearRampToValueAtTime(1400, t + 0.06);
    o.frequency.linearRampToValueAtTime(600, t + dur);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
    cleanup(o, [g]);
  }

  // UFO：正弦 + LFO 音高摆动 300~600Hz
  function sUfo() {
    var t = now(), dur = 1.6;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(450, t);

    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 5.5;
    var lfoGain = mkGain(150);
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);

    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + 0.15);
    g.gain.setValueAtTime(0.12, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
    cleanup(o, [lfo, lfoGain, g]);
  }

  // 怪兽低吼：锯齿 45Hz + 6Hz LFO + lowpass
  function sRoar() {
    var t = now(), dur = 1.6;
    var o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(45, t);

    var lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 6;
    var lfoGain = mkGain(11);
    lfo.connect(lfoGain);
    lfoGain.connect(o.frequency);

    var lp = mkFilter('lowpass', 420, 3.5);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.26, t + 0.12);
    g.gain.setValueAtTime(0.26, t + dur - 0.35);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);

    o.connect(lp);
    lp.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
    lfo.start(t);
    lfo.stop(t + dur);
    cleanup(o, [lfo, lfoGain, lp, g]);
  }

  // 陨石：带通噪声下扫 + 上升啸叫
  function sMeteor() {
    var t = now(), dur = 1.4;

    var src = noiseAt('white', t, dur);
    var bp = mkFilter('bandpass', 2800, 1.1);
    bp.frequency.setValueAtTime(2800, t);
    bp.frequency.exponentialRampToValueAtTime(260, t + dur);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + 0.12);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);

    // 上升的啸叫
    var whistleDur = dur * 0.85;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(260, t);
    o.frequency.exponentialRampToValueAtTime(1500, t + whistleDur);
    var og = mkGain(0.0001);
    og.gain.setValueAtTime(0.0001, t);
    og.gain.linearRampToValueAtTime(0.07, t + 0.3);
    og.gain.exponentialRampToValueAtTime(0.0001, t + whistleDur);
    o.connect(og);
    og.connect(master);
    o.start(t);
    o.stop(t + whistleDur);

    cleanup(src, [bp, g, o, og]);
  }

  // 雷声：棕噪声 + 低通长尾，约 2s
  function sThunder() {
    var t = now(), dur = 2.0;
    var src = noiseAt('brown', t, dur);
    var lp = mkFilter('lowpass', 900, 0.7);
    lp.frequency.setValueAtTime(900, t);
    lp.frequency.exponentialRampToValueAtTime(120, t + dur);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(lp);
    lp.connect(g);
    g.connect(master);
    cleanup(src, [lp, g]);
  }

  // 恢弘（但廉价）：小调方波和弦齐奏 + 慢起音
  function sEpic() {
    var t = now(), dur = 1.5;
    var freqs = [130.81, 155.56, 196.00, 261.63]; // C3 Eb3 G3 C4
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.06, t + 0.4);
    g.gain.setValueAtTime(0.06, t + dur - 0.55);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    var lp = mkFilter('lowpass', 2200, 0.8);
    g.connect(lp);
    lp.connect(master);

    var oscs = [];
    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = freqs[i];
      o.detune.value = Math.random() * 8 - 4; // 轻微走音，更显廉价
      o.connect(g);
      o.start(t);
      o.stop(t + dur);
      oscs.push(o);
    }
    cleanup(oscs[oscs.length - 1], [lp, g].concat(oscs.slice(0, -1)));
  }

  // 紧张 sting：短促小调和弦刺音
  function sSting() {
    var t = now(), dur = 0.6;
    var freqs = [523.25, 622.25, 783.99]; // C5 Eb5 G5
    var g = mkGain(0.0001);
    perc(g, t, 0.14, 0.006, dur - 0.006);
    var lp = mkFilter('lowpass', 4000, 0.7);
    g.connect(lp);
    lp.connect(master);

    var oscs = [];
    for (var i = 0; i < freqs.length; i++) {
      var o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = freqs[i];
      o.detune.value = Math.random() * 10 - 5;
      o.connect(g);
      o.start(t);
      o.stop(t + dur);
      oscs.push(o);
    }
    cleanup(oscs[oscs.length - 1], [lp, g].concat(oscs.slice(0, -1)));
  }

  // 人群：带通噪声 + 随机脉冲包络，约 1.2s
  function sCrowd() {
    var t = now(), dur = 1.2;
    var src = noiseAt('white', t, dur);
    var bp = mkFilter('bandpass', 900, 0.8);
    var g = mkGain(0.025);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);

    var p = g.gain;
    p.setValueAtTime(0.0001, t);
    p.linearRampToValueAtTime(0.025, t + 0.02); // 短起音，避免起始 click
    var times = [];
    var i;
    for (i = 0; i < 20; i++) times.push(t + 0.04 + Math.random() * (dur - 0.12));
    times.sort(function (a, b) { return a - b; });
    for (i = 0; i < times.length; i++) {
      var at = times[i];
      var peak = 0.03 + Math.random() * 0.14;
      p.setValueAtTime(0.025, at);
      p.linearRampToValueAtTime(peak, at + 0.012);
      p.linearRampToValueAtTime(0.025, at + 0.055);
    }
    p.linearRampToValueAtTime(0.0001, t + dur); // 收尾淡出

    cleanup(src, [bp, g]);
  }

  // 呼啸：带通噪声快速上扫
  function sWhoosh() {
    var t = now(), dur = 0.5;
    var src = noiseAt('white', t, dur);
    var bp = mkFilter('bandpass', 220, 1.4);
    bp.frequency.setValueAtTime(220, t);
    bp.frequency.exponentialRampToValueAtTime(3800, t + dur * 0.75);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.3, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp);
    bp.connect(g);
    g.connect(master);
    cleanup(src, [bp, g]);
  }

  // 金属锣：90Hz 基频 FM + 非谐分音
  function sGong() {
    var t = now(), dur = 2.5;
    var carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.value = 90;

    var mod = ctx.createOscillator();
    mod.type = 'sine';
    mod.frequency.value = 137;
    var modGain = mkGain(320);
    modGain.gain.setValueAtTime(320, t);
    modGain.gain.exponentialRampToValueAtTime(8, t + 1.6);
    mod.connect(modGain);
    modGain.connect(carrier.frequency);

    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.22, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    carrier.connect(g);
    g.connect(master);
    carrier.start(t);
    carrier.stop(t + dur);
    mod.start(t);
    mod.stop(t + dur);

    // 非谐分音
    var partials = [[247, 0.09, 1.8], [371, 0.06, 1.4], [563, 0.035, 1.0]];
    var nodes = [];
    for (var i = 0; i < partials.length; i++) {
      var f = partials[i][0];
      var amp = partials[i][1];
      var tail = partials[i][2];
      var po = ctx.createOscillator();
      po.type = 'sine';
      po.frequency.value = f;
      var pg = mkGain(0.0001);
      pg.gain.setValueAtTime(0.0001, t);
      pg.gain.linearRampToValueAtTime(amp, t + 0.008);
      pg.gain.exponentialRampToValueAtTime(0.0001, t + tail);
      po.connect(pg);
      pg.connect(master);
      po.start(t);
      po.stop(t + tail);
      cleanup(po, [pg]);
      nodes.push(po, pg);
    }

    cleanup(carrier, [mod, modGain, g].concat(nodes));
  }

  // 上升音：锯齿上扫
  function sRiser() {
    var t = now(), dur = 0.6;
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.12, t + dur * 0.85);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    var lp = mkFilter('lowpass', 3000, 1);
    g.connect(lp);
    lp.connect(master);

    var oscs = [];
    for (var i = 0; i < 2; i++) {
      var o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(180, t);
      o.frequency.exponentialRampToValueAtTime(1200, t + dur * 0.9);
      o.detune.value = i ? 9 : -9;
      o.connect(g);
      o.start(t);
      o.stop(t + dur);
      oscs.push(o);
    }
    cleanup(oscs[1], [lp, g, oscs[0]]);
  }

  // 雨声：高通噪声 + 随机水滴，约 2s
  function sRain() {
    var t = now(), dur = 2.0;
    var src = noiseAt('white', t, dur);
    var hp = mkFilter('highpass', 1200, 0.7);
    var g = mkGain(0.0001);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.08, t + 0.2);
    g.gain.setValueAtTime(0.08, t + dur - 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    src.connect(hp);
    hp.connect(g);
    g.connect(master);
    cleanup(src, [hp, g]);

    // 随机水滴
    for (var i = 0; i < 18; i++) {
      var at = t + 0.05 + Math.random() * (dur - 0.15);
      var f = 900 + Math.random() * 1600;
      var drop = ctx.createOscillator();
      drop.type = 'sine';
      drop.frequency.setValueAtTime(f, at);
      drop.frequency.exponentialRampToValueAtTime(f * 0.6, at + 0.05);
      var dg = mkGain(0.0001);
      dg.gain.setValueAtTime(0.0001, at);
      dg.gain.linearRampToValueAtTime(0.03, at + 0.005);
      dg.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
      drop.connect(dg);
      dg.connect(master);
      drop.start(at);
      drop.stop(at + 0.08);
      cleanup(drop, [dg]);
    }
  }

  // 重击：70Hz 正弦 + 噪声 click
  function sSlam() {
    var t = now(), dur = 0.35;
    var o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(85, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.18);
    var g = mkGain(0.0001);
    perc(g, t, 0.42, 0.004, dur - 0.004);
    o.connect(g);
    g.connect(master);
    o.start(t);
    o.stop(t + dur);
    cleanup(o, [g]);

    // 高频噪声 click
    var n = noiseAt('white', t, 0.06);
    var hp = mkFilter('highpass', 1800, 0.7);
    var ng = mkGain(0.0001);
    perc(ng, t, 0.12, 0.002, 0.055);
    n.connect(hp);
    hp.connect(ng);
    ng.connect(master);
    cleanup(n, [hp, ng]);
  }

  // 数字故障：随机方波短爆
  function sGlitch() {
    var t = now(), dur = 0.2;
    for (var i = 0; i < 7; i++) {
      var at = t + Math.random() * (dur - 0.04);
      var len = 0.012 + Math.random() * 0.025;
      var o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.setValueAtTime(180 + Math.random() * 2600, at);
      var g = mkGain(0.0001);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.08, at + 0.002);
      g.gain.linearRampToValueAtTime(0.0001, at + len);
      o.connect(g);
      g.connect(master);
      o.start(at);
      o.stop(at + len + 0.005);
      cleanup(o, [g]);
    }
  }

  var sounds = {
    boom: sBoom,
    bigboom: sBigBoom,
    laser: sLaser,
    pew: sPew,
    ufo: sUfo,
    roar: sRoar,
    meteor: sMeteor,
    thunder: sThunder,
    epic: sEpic,
    sting: sSting,
    crowd: sCrowd,
    whoosh: sWhoosh,
    gong: sGong,
    riser: sRiser,
    rain: sRain,
    slam: sSlam,
    glitch: sGlitch
  };

  /* ---------------- BGM ---------------- */

  // 排一个 BGM 音符（或低音根音）
  function bgmNote(freq, t, isBass) {
    if (!BGM.bus) return;
    var o = ctx.createOscillator();
    o.type = isBass ? 'triangle' : 'square';
    o.frequency.setValueAtTime(freq, t);

    var f = mkFilter('lowpass', isBass ? 220 : 1600, 0.8);
    var g = mkGain(0.0001);
    if (isBass) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.8, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
      o.start(t);
      o.stop(t + 1.7);
    } else {
      perc(g, t, 0.55, 0.008, 0.22);
      o.start(t);
      o.stop(t + 0.24);
    }
    o.connect(f);
    f.connect(g);
    g.connect(BGM.bus);
    cleanup(o, [f, g]);
  }

  // 前瞻调度：用 setInterval 提前 0.2s 排音符
  function bgmTick() {
    if (!BGM.playing || !ctx) return;
    try {
      var t = ctx.currentTime;
      // 页面在后台被节流后，避免一次性补出大量音符
      if (BGM.nextTime < t - 0.4) BGM.nextTime = t + 0.05;
      while (BGM.nextTime < t + 0.2) {
        if (BGM.step % 8 === 0) bgmNote(BGM_ROOT, BGM.nextTime, true);
        bgmNote(BGM_PATTERN[BGM.step % 8], BGM.nextTime, false);
        BGM.step++;
        BGM.nextTime += BGM_STEP;
      }
    } catch (e) { /* 调度异常不向外抛 */ }
  }

  function bgmStart() {
    try {
      if (!ensure()) return;
      if (BGM.playing) return; // 重复调用不叠加
      if (!BGM.bus) {
        BGM.bus = mkGain(0);
        BGM.bus.connect(master);
      }
      var t = ctx.currentTime;
      var p = BGM.bus.gain;
      try { p.cancelScheduledValues(t); } catch (e) {}
      p.setValueAtTime(0.0001, t);
      p.linearRampToValueAtTime(BGM_LEVEL, t + 0.5);

      BGM.step = 0;
      BGM.nextTime = t + 0.06;
      BGM.playing = true;
      BGM.timer = setInterval(bgmTick, 50);
      bgmTick();
    } catch (e2) { /* 静默 */ }
  }

  function bgmStop() {
    try {
      if (BGM.timer !== null) {
        clearInterval(BGM.timer);
        BGM.timer = null;
      }
      if (!ctx || !BGM.playing) return;
      BGM.playing = false;
      if (!BGM.bus) return;
      var t = ctx.currentTime;
      var p = BGM.bus.gain;
      try { p.cancelScheduledValues(t); } catch (e) {}
      p.setValueAtTime(p.value, t);
      p.linearRampToValueAtTime(0.0001, t + 0.6); // 约 0.6s 淡出
    } catch (e2) { /* 静默 */ }
  }

  /* ---------------- 对外接口 ---------------- */

  function play(name) {
    try {
      var fn = sounds[name];
      if (!fn) return;
      if (!ensure()) return;
      fn();
    } catch (e) { /* 任何合成异常都不影响主控 */ }
  }

  function setMuted(v) {
    muted = !!v;
    try {
      if (ctx && master) {
        var t = ctx.currentTime;
        var p = master.gain;
        var target = muted ? 0 : MASTER_LEVEL;
        p.cancelScheduledValues(t);
        p.setValueAtTime(p.value, t);
        p.linearRampToValueAtTime(target, t + 0.03);
      }
    } catch (e) { /* 静默 */ }
  }

  window.AUDIO = {
    init: function () {
      try { return ensure(); } catch (e) { return false; }
    },
    play: play,
    bgmStart: bgmStart,
    bgmStop: bgmStop,
    setMuted: setMuted,
    isMuted: function () {
      return muted;
    }
  };
})();
