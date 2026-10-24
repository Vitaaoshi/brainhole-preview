/* ============================================================
 * vhs.js · 五毛特效脑洞预演器 · VHS 氛围层
 *
 * 只做运行时控制，不改动 index.html 中任何元素的静态样式，
 * 也不碰 #stage / #screen-* 的 class 与内联样式。
 *
 * 对外 API（挂 window.VHS）：
 *   VHS.start()      启动时间码 + 随机故障带
 *   VHS.stop()       清理全部定时器，时间码定格
 *   VHS.glitch(level) 立即触发一次故障带（level 1~3）
 *   VHS.pulse()      一次轻微闪白
 *   VHS.ready()      待机页氛围故障带（不更新时间码）
 * ============================================================ */
(function () {
  'use strict';

  /* ---------------- 定时器池 ----------------
   * 本模块创建的所有 setTimeout / setInterval 都登记在 timers 中，
   * killAll() 可一次性清理；回调从池中移除后执行。
   */
  var timers = new Set();

  function later(fn, ms) {
    var id = setTimeout(function () {
      timers.delete(id);
      try { fn(); } catch (e) { /* 单个回调出错不影响其余定时器 */ }
    }, ms);
    timers.add(id);
    return id;
  }

  function every(fn, ms) {
    var id = setInterval(function () {
      try { fn(); } catch (e) {}
    }, ms);
    timers.add(id);
    return id;
  }

  function kill(id) {
    if (id === null || id === undefined) return;
    clearTimeout(id);
    clearInterval(id);
    timers.delete(id);
  }

  function killAll() {
    timers.forEach(function (id) {
      clearTimeout(id);
      clearInterval(id);
    });
    timers.clear();
  }

  /* ---------------- 小工具 ---------------- */
  function getEl(id) {
    return document.getElementById(id) || null;
  }

  function randInt(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  // 0 -> 1，2 保持 2，3 封顶 3；非数字 / undefined 一律按 1 处理
  function normalizeLevel(level) {
    var n = parseInt(level, 10);
    if (!isFinite(n) || n < 1) n = 1;
    if (n > 3) n = 3;
    return n;
  }

  /* ---------------- 内部状态 ---------------- */
  var started = false;        // start() 是否已生效
  var timecodeTimer = null;   // 每秒时间码 interval
  var timecodeSeconds = -1;   // 当前时间码总秒数，-1 表示未初始化
  var glitchTimer = null;     // 下一轮随机故障带的 timeout
  var readyActive = false;    // ready() 是否已生效
  var readyTimer = null;      // 下一轮待机故障带的 timeout
  var bandTimer = null;       // 当前故障带的复位 timeout
  var flashTimer = null;      // 当前闪白的复位 timeout
  var extraTimer = null;      // 自建错位层的移除 timeout
  var hudTimer = null;        // #hud 抖动的复原 timeout
  var hudSaved = null;        // #hud 原始内联 transform / filter

  /* ---------------- 时间码 ---------------- */
  function formatTimecode(total) {
    var t = Math.max(0, Math.floor(total));
    var h = Math.floor(t / 3600) % 100;
    var m = Math.floor((t % 3600) / 60);
    var s = t % 60;
    return pad2(h) + ':' + pad2(m) + ':' + pad2(s);
  }

  function renderTimecode() {
    var el = getEl('timecode');
    if (!el) return; // 元素缺失时静默跳过
    el.textContent = formatTimecode(timecodeSeconds);
  }

  function tickTimecode() {
    if (timecodeSeconds < 0) return;
    timecodeSeconds += 1;
    renderTimecode();
  }

  /* ---------------- 故障带 ---------------- */
  function fireBand(band) {
    if (!band || !band.classList) return;

    // 连续触发时先撤销上一次的复位，保证动画能重新播放
    if (bandTimer !== null) {
      kill(bandTimer);
      bandTimer = null;
    }
    band.classList.remove('on');
    void band.offsetWidth; // 强制重排，重启动画
    band.classList.add('on');

    bandTimer = later(function () {
      bandTimer = null;
      var el = getEl('vhs-glitch');
      if (el && el.classList) el.classList.remove('on');
    }, 190);
  }

  function resetOverlay() {
    var extra = getEl('vhs-extra');
    if (extra && extra.parentNode) extra.parentNode.removeChild(extra);
  }

  function resetHud() {
    var hud = getEl('hud');
    if (hud && hudSaved) {
      hud.style.transform = hudSaved.transform;
      hud.style.filter = hudSaved.filter;
    }
    hudSaved = null;
  }

  // level 3 的横向错位 + 卡帧感
  function stutter() {
    var body = document.body || document.documentElement;
    if (!body) return;

    var extra = getEl('vhs-extra');
    if (!extra) {
      extra = document.createElement('div');
      extra.id = 'vhs-extra';
      extra.className = 'vhs-extra';
    }
    if (extra.parentNode !== body) body.appendChild(extra);

    // 自建覆盖层：水平错位的彩色撕裂带（z-index 905，低于 HUD 的 910）
    extra.style.cssText =
      'position:fixed;inset:0;z-index:905;pointer-events:none;' +
      'mix-blend-mode:screen;opacity:.9;' +
      'background:linear-gradient(to bottom,' +
      'transparent 0%,rgba(34,230,255,.30) 20%,transparent 27%,' +
      'rgba(255,43,209,.30) 48%,transparent 55%,' +
      'rgba(255,255,255,.18) 74%,transparent 82%);' +
      'transform:translateX(16px)';

    if (extraTimer !== null) {
      kill(extraTimer);
      extraTimer = null;
    }
    // 160ms 内复原：移除覆盖层（在 200ms 限制内）
    extraTimer = later(function () {
      extraTimer = null;
      resetOverlay();
    }, 160);

    // 两帧横向抖动，制造卡帧错觉
    later(function () {
      var el = getEl('vhs-extra');
      if (el) el.style.transform = 'translateX(-12px)';
    }, 60);
    later(function () {
      var el = getEl('vhs-extra');
      if (el) el.style.transform = 'translateX(9px)';
    }, 120);

    // #hud 短暂抖动（150ms 内复原）
    var hud = getEl('hud');
    if (!hud) return;
    if (!hudSaved) {
      hudSaved = {
        transform: hud.style.transform || '',
        filter: hud.style.filter || ''
      };
    }
    hud.style.transform = 'translateX(-5px) skewX(2deg)';
    hud.style.filter = 'contrast(1.35) brightness(1.06)';

    if (hudTimer !== null) {
      kill(hudTimer);
      hudTimer = null;
    }
    hudTimer = later(function () {
      hudTimer = null;
      resetHud();
    }, 150);
  }

  /* ---------------- 对外 API ---------------- */
  function start() {
    if (started) return; // 重复调用不叠加定时器
    started = true;

    // 首次启动从随机的 00:12:xx 起递增
    if (timecodeSeconds < 0) {
      timecodeSeconds = 12 * 60 + randInt(0, 59);
    }
    renderTimecode();

    if (timecodeTimer === null) {
      timecodeTimer = every(tickTimecode, 1000);
    }

    if (glitchTimer === null) scheduleLoopGlitch();
  }

  function scheduleLoopGlitch() {
    // 6~10 秒随机间隔，每次触发后重新抽签
    glitchTimer = later(function () {
      glitchTimer = null;
      if (!started) return;
      glitch(1);
      if (started) scheduleLoopGlitch();
    }, randInt(6000, 10000));
  }

  function stop() {
    started = false;
    readyActive = false;

    // 清掉本模块创建的全部定时器（含进行中的故障带 / 闪白复位）
    killAll();

    timecodeTimer = null;
    glitchTimer = null;
    readyTimer = null;
    bandTimer = null;
    flashTimer = null;
    extraTimer = null;
    hudTimer = null;

    // 清理可能残留的运行时状态；timecode 文本保持当前值即"定格"
    resetOverlay();
    resetHud();

    var band = getEl('vhs-glitch');
    if (band && band.classList) band.classList.remove('on');

    var flash = getEl('flash');
    if (flash && flash.classList) flash.classList.remove('on');
  }

  function glitch(level) {
    var band = getEl('vhs-glitch');
    if (!band) return; // 元素缺失时直接返回

    var lv = normalizeLevel(level);
    // level 1：一次；level 2：两次；level 3：三次，间隔 90ms
    var times = lv >= 3 ? 3 : (lv === 2 ? 2 : 1);

    fireBand(band);
    for (var i = 1; i < times; i++) {
      later(function () {
        fireBand(getEl('vhs-glitch'));
      }, i * 90);
    }

    if (lv >= 3) stutter();
  }

  function pulse() {
    var flash = getEl('flash');
    if (!flash || !flash.classList) return; // 元素缺失时直接返回

    // 与上一次闪白错开：取消旧复位，重新起播动画
    if (flashTimer !== null) {
      kill(flashTimer);
      flashTimer = null;
    }
    flash.classList.remove('on');
    void flash.offsetWidth;
    flash.classList.add('on');

    flashTimer = later(function () {
      flashTimer = null;
      var el = getEl('flash');
      if (el && el.classList) el.classList.remove('on');
    }, 450);
  }

  function ready() {
    if (readyActive) return; // 重复调用不叠加
    readyActive = true;
    scheduleReadyGlitch();
  }

  function scheduleReadyGlitch() {
    // 待机氛围：9~14 秒一次 level 1，不触碰 timecode
    readyTimer = later(function () {
      readyTimer = null;
      if (!readyActive) return;
      glitch(1);
      if (readyActive) scheduleReadyGlitch();
    }, randInt(9000, 14000));
  }

  /* ---------------- 挂载全局 ---------------- */
  window.VHS = window.VHS || {};
  window.VHS.start = start;
  window.VHS.stop = stop;
  window.VHS.glitch = glitch;
  window.VHS.pulse = pulse;
  window.VHS.ready = ready;
})();
