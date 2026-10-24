/* ============================================================
 * 脑洞预演器 · 调度器（main.js）
 * 状态机：idle → loading → preview → rating
 * 依赖（均已存在，缺失时自动降级）：
 *   window.AUDIO / window.NARRATION / window.VHS / SCENES_A / SCENES_B
 * ============================================================ */
(function () {
  'use strict';

  /* ---------- 元素引用 ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var screens = {
    idle: $('screen-idle'),
    loading: $('screen-loading'),
    preview: $('screen-preview'),
    rating: $('screen-rating')
  };
  var input = $('idea-input');
  var startBtn = $('start-btn');
  var rollBtn = $('roll-btn');
  var loadingText = $('loading-text');
  var loadingBar = $('loading-bar');
  var loadingNoteEl = $('loading-note');
  var stage = $('stage');
  var titleCard = $('title-card');
  var titleIdea = $('title-idea');
  var titleSub = $('title-sub');
  var endSub = $('end-sub');
  var endCard = $('end-card');
  var subBar = $('subtitle-bar');
  var subText = $('subtitle-text');
  var ratingIdea = $('rating-idea');
  var ratingScore = $('rating-score');
  var ratingStars = $('rating-stars');
  var ratingReview = $('rating-review');
  var ratingAward = $('rating-award');
  var ratingBudgetNote = $('rating-budget-note');
  var ratingIncident = $('rating-incident');
  var ratingTeaser = $('rating-teaser');
  var ratingTag = document.querySelector('#screen-rating .rc-tag');
  var btnReroll = $('btn-reroll');
  var btnNew = $('btn-new');
  var castChip = $('cast-chip');
  var sceneTag = $('scene-tag');
  var titleKicker = document.querySelector('#title-card .tc-kicker');
  var theater = $('theater');
  var theaterList = $('theater-list');
  var theaterClear = $('theater-clear');
  var marqueeText = document.querySelector('.marquee span');

  /* ---------- 外部模块的防御式兜底 ---------- */
  var N = window.NARRATION || {
    intro: function (idea) { return '公元 2026 年，' + idea + ' 的故事，开始了。'; },
    mid: function (idea) { return '没有人想到，' + idea + ' 竟然是真的。'; },
    caption: function (id, idea) { return '镜头里，' + idea + ' 正在发生。'; },
    outro: function (idea) { return '这个关于 ' + idea + ' 的故事，由五毛特效呈现。'; },
    rating: function (idea) {
      return {
        score: '2.0', stars: 2, review: '我看了个寂寞',
        award: '金酸莓奖提名', budgetNote: '已超支', tag: '已认证烂片',
        incident: '拍摄事故：道具楼被风吹倒，重拍 1 次。',
        teaser: '下集预告：' + idea + ' 的暑假。'
      };
    },
    kicker: function (theme) { return '五毛特效 荣誉呈现 · ' + (theme || '伪纪录片'); },
    tagline: function () { return '一 部 不 可 能 获 奖 的 电 影'; },
    loadingNote: function () { return 'PLEASE BE PATIENT · 1998'; },
    marquee: function () { return '本片含有大量廉价特效 · 请勿模仿'; },
    endNote: function () { return '本 片 无 彩 蛋 · 请 自 行 脑 补'; },
    typo: function (t) { return t; }
  };

  var AUDIO = window.AUDIO || null;
  var VHS = window.VHS || null;
  var HINTS = window.HINTS || { of: function () { return null; }, apply: function () {} };

  function sfx(name) {
    if (!AUDIO) return;
    try { AUDIO.play(name); } catch (e) { /* 忽略 */ }
  }

  function glitch(level) {
    if (!VHS) return;
    try { VHS.glitch(level); } catch (e) { /* 忽略 */ }
  }

  /* ---------- 状态与定时器 ---------- */
  var state = 'idle';
  var idea = '';
  var hints = null;
  var lastScenes = [];
  var runToken = 0;
  var timers = [];
  var currentScene = null;

  function later(fn, ms) {
    var id = setTimeout(function () {
      var i = timers.indexOf(id);
      if (i >= 0) timers.splice(i, 1);
      fn();
    }, ms);
    timers.push(id);
    return id;
  }

  function clearTimers() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers.length = 0;
  }

  function showScreen(name) {
    Object.keys(screens).forEach(function (key) {
      if (screens[key]) screens[key].classList.toggle('active', key === name);
    });
    state = name;
    startBtn.disabled = (name === 'loading' || name === 'preview');
    if (rollBtn) rollBtn.disabled = startBtn.disabled;
  }

  /* ---------- 字幕 ---------- */
  function showSubtitle(text) {
    if (!subText || !subBar) return;
    subText.textContent = N.typo(text);
    subBar.classList.add('show');
  }

  function hideSubtitle() {
    if (subBar) subBar.classList.remove('show');
  }

  /* ---------- 预演现场复位 ---------- */
  function resetPreview() {
    if (currentScene) {
      try { currentScene.cleanup(); } catch (e) { /* 忽略 */ }
      currentScene = null;
    }
    if (stage) stage.innerHTML = '';
    hideSubtitle();
    if (sceneTag) sceneTag.textContent = '';
    if (titleCard) titleCard.classList.remove('show');
    if (endCard) endCard.classList.remove('show');
  }

  /* ---------- ① 待机页 ---------- */
  var PLACEHOLDERS = [
    '我变成奥特曼在公司打卡上班',
    '假如猫会开出租车',
    '我用一根橡皮筋造出了永动机',
    '全公司只有我能看见一只恐龙',
    '我家的洗衣机其实是时空传送门',
    '我靠背诵菜单当上了武林盟主',
    '楼下的早餐店在卖外星包子',
    '我把自己上传成了公司内网',
    '我的猫考上了公务员',
    '我的工位开始自己长蘑菇',
    '我家 Wi-Fi 连上了 1998 年',
    '我在电梯里遇见了三十年后的自己',
    '我的外卖备注被当成了圣旨',
    '我的影子报名参加了选秀',
    '我的保温杯里养了一条龙',
    '我的电脑里住着一只会写代码的猫',
    '我的工牌能刷开任何人的梦',
    '我在公司花坛挖出了兵马俑',
    '我的年度总结被拍成了恐怖片',
    '我的外卖小哥其实是神仙'
  ];

  function rotatePlaceholder() {
    if (!input || state !== 'idle') return;
    var i = Math.floor(Math.random() * PLACEHOLDERS.length);
    input.setAttribute('placeholder', PLACEHOLDERS[i]);
  }

  /* ---------- 摇个脑洞 ---------- */
  var IDEA_POOL = [
    '我把老板的假发供在办公桌上当神龛',
    '我的猫每天凌晨三点给我开绩效会',
    '电梯每次开门都通向不同的城市',
    '我靠打喷嚏实现了时间倒流',
    '公司团建把我传送到了三国',
    '我家楼下便利店在卖后悔药',
    '我把自己折成纸飞机飞进了董事会',
    '外卖小哥骑着恐龙来送餐',
    '我的手机充电时会说梦话',
    '全公司只有我能听见打印机唱歌',
    '我用年会抽奖抽中了一颗卫星',
    '我的影子开始替我上班',
    '每天早上我的闹钟会先讲个鬼故事',
    '我把周报写成了武功秘籍',
    '我家的冰箱通往北极',
    '我在工位上挖出了一个温泉',
    '一觉醒来我成了公司门禁系统',
    '我的头发开始自己写代码',
    '我养的绿萝当上了部门主管',
    '开会时我的左手突然开始表决',
    '我用一根网线钓上来一条鲸鱼',
    '我的工牌能刷开任何人的梦',
    '宇宙尽头是一家打印店',
    '我的床底下住着一个退休的神',
    '公司食堂的番茄炒蛋会预言未来',
    '我把自己上传成了公司内网',
    '我的外卖备注被当成了圣旨',
    '台风天我的伞长出了翅膀',
    '我发明了会自己下班的工位',
    '我和楼下的流浪猫组建了乐队',
    '我的电脑蓝屏后出现了祖先',
    '全城的红绿灯开始为我跳踢踏舞',
    '我在简历上写会飞，结果真飞了',
    '我把加班费存进了一个黑洞',
    '我的保温杯里养了一条龙',
    '我每天中午都要给仙人掌汇报工作',
    '我的老板是一只会说话的扫地机器人',
    '我按错了电梯楼层，到了月球分公司',
    '我的年度总结被做成了恐怖片',
    '公司厕所里住着一位古代丞相',
    '我家的猫考上了公务员',
    '我的共享单车会自己回家',
    '我用加班时长兑换了一颗星星',
    '外卖备注写错，送来了一整套餐具',
    '我的工位开始自己长出蘑菇',
    '我在电梯里遇见了三十年后的自己',
    '老板的语音条里藏着一段外星信号',
    '我的键盘少了一个键，全公司停工',
    '我把闹钟调成了领导的呼吸声',
    '公司楼下的树开始给我发工资',
    '我用一张纸巾造了一艘航母',
    '我的签名笔迹变成了一条龙',
    '我在周报里藏了一句咒语',
    '我养的蚊子考上了研究生',
    '我的耳机里一直在播我的童年',
    '我的保温杯会说早安，声音像我前任',
    '我把自己 P 进了公司荣誉墙',
    '我发明了会自动消失的工资',
    '我家 Wi-Fi 连上了 1998 年',
    '我的床每天都在自己通勤',
    '我在公司花坛里挖出了兵马俑',
    '我的手机壁纸开始跟我吵架',
    '我的外卖小哥其实是神仙',
    '我把会议室改造成了海底世界',
    '我的影子报名参加了选秀',
    '我在打卡机上刷出了一条龙',
    '我的电脑里住着一只会写代码的猫',
    '我用手电筒照出了一个平行世界',
    '我的猫给我发了一封辞职信',
    '我们部门的打印机开始写诗',
    '我把年终奖换成了一个愿望',
    '我的工牌显示：查无此人',
    '楼下的保安是外星驻地球代表',
    '我的牙刷每天凌晨三点开会',
    '我用一张便利贴封印了老板',
    '我的头发和绿萝进行了光合作用',
    '我在堆满文件的桌上找到一扇门',
    '全公司只有我的椅子会思考',
    '我把自己写进了公司的财务报表',
    '我的午饭里出现了一张藏宝图',
    '我的工位底下通向了海底两万里',
    '我用一张 Excel 表格造了一个宇宙',
    '我的猫每天准时替我打卡',
    '我在打印机里发现了一个小国家'
  ];

  function rollIdea() {
    if (state !== 'idle' || !input) return;
    var next = input.value;
    // 最多试 12 次，避免摇到和当前一模一样的
    for (var i = 0; i < 12; i++) {
      var pick = IDEA_POOL[Math.floor(Math.random() * IDEA_POOL.length)];
      if (pick !== next) { next = pick; break; }
    }
    input.value = next;

    input.classList.remove('rolled');
    void input.offsetWidth;
    input.classList.add('rolled');
    setTimeout(function () { input.classList.remove('rolled'); }, 560);

    sfx('pew');
    later(function () { sfx('glitch'); }, 70);
    glitch(1);
  }

  function shakeInput() {
    if (!input) return;
    input.classList.remove('shake');
    void input.offsetWidth;
    input.classList.add('shake');
    setTimeout(function () { input.classList.remove('shake'); }, 420);
  }

  /* ---------- 脑洞解析结果落到画面 ---------- */
  function applyHints() {
    if (!hints) return;
    if (screens.preview) HINTS.apply(hints, screens.preview);
    if (titleKicker) titleKicker.textContent = '五毛特效 荣誉呈现 · ' + hints.theme.label;
    if (castChip) castChip.textContent = hints.hero + ' 本片主角 · ' + hints.theme.label;
  }

  function bumpCastChip() {
    if (!castChip) return;
    castChip.classList.remove('pop');
    void castChip.offsetWidth;
    castChip.classList.add('pop');
  }

  function setSceneTag(index, total, scene) {
    if (!sceneTag) return;
    var no = index + 1;
    sceneTag.textContent = 'SCENE ' + (no < 10 ? '0' + no : no) + ' / ' + total +
      ' · ' + (scene.label || scene.id);
  }

  /* ---------- 放映厅：历史烂片 ---------- */
  var STORE_KEY = 'brainhole.films.v1';
  var MAX_FILMS = 12;

  function loadFilms() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(ts) {
    var d = new Date(Number(ts) || Date.now());
    var mm = d.getMonth() + 1;
    var dd = d.getDate();
    return (mm < 10 ? '0' + mm : mm) + '-' + (dd < 10 ? '0' + dd : dd);
  }

  function saveFilm(filmIdea, r) {
    if (!filmIdea) return;
    var list = loadFilms();
    list.unshift({
      idea: filmIdea,
      score: String(r.score || '0.0'),
      stars: Number(r.stars) || 0,
      genre: hints ? hints.theme.label : '伪纪录片',
      hero: hints ? hints.hero : '🧍',
      sceneIds: lastScenes.filter(Boolean),
      ts: Date.now()
    });
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list.slice(0, MAX_FILMS))); } catch (e) { /* 存不了就算了 */ }
    renderTheater();
  }

  function renderTheater() {
    if (!theater || !theaterList) return;
    var list = loadFilms();
    theater.hidden = list.length === 0;
    theaterList.innerHTML = '';
    list.forEach(function (f, i) {
      var card = document.createElement('button');
      card.type = 'button';
      card.className = 'film-card';
      card.setAttribute('data-idx', String(i));
      card.innerHTML =
        '<span class="fc-top"><span class="fc-score">' + esc(f.score || '--') + '</span>' +
        '<span class="fc-stars">' + new Array(Math.max(0, Math.min(5, Number(f.stars) || 0)) + 1).join('★') + '</span></span>' +
        '<span class="fc-idea">' + esc(f.idea) + '</span>' +
        '<span class="fc-meta">' + esc(f.hero || '') + ' ' + esc(f.genre || '') + ' · ' + fmtDate(f.ts) + '</span>';
      theaterList.appendChild(card);
    });
  }

  function scenesByIds(ids) {
    if (!Array.isArray(ids) || !ids.length) return null;
    var pool = scenePool();
    var out = [];
    ids.forEach(function (id) {
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].id === id) { out.push(pool[i]); return; }
      }
    });
    return out.length ? out : null;
  }

  function replayFilm(index) {
    var film = loadFilms()[index];
    if (!film || !film.idea) return;
    if (input) input.value = film.idea;
    sfx('glitch');
    glitch(1);
    startFlow(film.sceneIds);
  }

  /* ---------- ② 假加载 ---------- */
  var LOADING_LINES = [
    '正在从碟架最底层翻找……',
    '倒带中……请不要快进……',
    '特效师正在加班（加班费未发）',
    '渲染进度卡在 87%……',
    '警告：特效经费仅剩五毛',
    '马上就好，真的，最后一次',
    '正在给特效师发工资（分期）',
    '磁头清洗中，请勿拍打机器',
    '正在从 1998 年调取素材……',
    '检测到大量纸片道具，正在压实',
    '剪辑师在找第 37 个片段',
    '正在向邻居借一盏灯',
    '警报：盒饭数量不足',
    '正在给怪兽充气……',
    '绿幕没货了，改用床单',
    '正在说服演员不用替身',
    '渲染失败，正在假装成功',
    '请勿拔掉电源，虽然也没什么用',
    '正在从口袋里找零钱……',
    '碟片划伤，正在念咒语',
    '正在计算五毛钱能拍几秒',
    '特效师已请假，正在远程指导'
  ];

  function pickLines(count) {
    var pool = LOADING_LINES.slice();
    var out = [];
    for (var i = 0; i < count && pool.length; i++) {
      out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    }
    return out;
  }

  function typeLine(el, text, index, token) {
    if (!el || token !== runToken) return;
    el.textContent = text.slice(0, index);
    if (index < text.length) {
      later(function () { typeLine(el, text, index + 1, token); }, 26);
    }
  }

  function setBar(value) {
    if (loadingBar) loadingBar.style.width = value + '%';
  }

  /* ---------- ③ 预演 ---------- */
  var SCENE_TRIGGERS = {
    ufo: /飞碟|ufo|UFO|外星|飞船|天上|天空|不明飞行/,
    boom: /爆炸|炸|爆|崩|毁掉|烟花/,
    beam: /奥特曼|光线|光束|射线|发射|激光/,
    kaiju: /怪兽|恐龙|巨大|高楼|城市|踩/,
    meteor: /陨石|流星|坠落|掉下来|砸|撞击/,
    storm: /雷|闪电|风暴|台风|下雨|暴雨|天气/,
    slowmo: /慢|拖延|加班|卡住|时间/,
    duel: /大战|决战|对射|打斗|pk|PK|互殴/,
    doom: /毁灭|末日|地球|全人类|完蛋/,
    slam: /字幕|周报|报告|备注|写着|宣言|喊/,
    flee: /逃|跑|躲|下班|溜|辞职/,
    hero: /英雄|登场|出场|拯救|救|归来|奥特曼/
  };

  var GENRE_SCENES = {
    horror: ['storm', 'doom', 'flee', 'kaiju'],
    love: ['slowmo', 'hero', 'slam', 'duel'],
    funny: ['boom', 'slam', 'duel', 'flee'],
    scifi: ['ufo', 'meteor', 'doom', 'beam'],
    action: ['boom', 'beam', 'duel', 'kaiju'],
    nature: ['kaiju', 'slowmo', 'ufo', 'hero'],
    office: ['slam', 'slowmo', 'flee', 'doom'],
    doc: []
  };

  function scenePool() {
    var list = [];
    if (Array.isArray(window.SCENES_A)) list = list.concat(window.SCENES_A);
    if (Array.isArray(window.SCENES_B)) list = list.concat(window.SCENES_B);
    return list;
  }

  function pickScenes() {
    var pool = scenePool();
    if (!pool.length) return [];

    var text = String(idea || '');
    var genre = (hints && hints.theme) ? hints.theme.key : 'doc';
    var prefer = GENRE_SCENES[genre] || [];

    // 命中关键词的场景优先，其次是类型偏好场景，其余随机补位
    var scored = pool.map(function (s) {
      var score = Math.random() * 1.2;
      var re = SCENE_TRIGGERS[s.id];
      if (re && re.test(text)) score += 6;
      if (prefer.indexOf(s.id) >= 0) score += 2.5;
      return { scene: s, score: score };
    });

    scored.sort(function (a, b) { return b.score - a.score; });

    var count = Math.min(scored.length, 4 + Math.floor(Math.random() * 3));
    var picked = scored.slice(0, count).map(function (x) { return x.scene; });

    // 第一场留给最匹配的画面，后面几场打乱，保证每次重 roll 不重样
    for (var i = count - 1; i > 1; i--) {
      var j = 2 + Math.floor(Math.random() * (i - 1));
      var tmp = picked[i];
      picked[i] = picked[j];
      picked[j] = tmp;
    }
    return picked;
  }

  function runPreview(forcedScenes) {
    var token = ++runToken;
    var scenes = (Array.isArray(forcedScenes) && forcedScenes.length) ? forcedScenes : pickScenes();
    var currentIdea = idea;
    lastScenes = scenes.map(function (s) { return s && s.id; }).filter(Boolean);

    if (!scenes.length) {
      // 场景模块缺失时的兜底：直接出评分
      renderRating(currentIdea);
      return;
    }

    resetPreview();
    showScreen('preview');

    if (AUDIO) {
      try { AUDIO.init(); AUDIO.bgmStart(); } catch (e) { /* 忽略 */ }
    }
    if (VHS) {
      try { VHS.stop(); VHS.start(); } catch (e) { /* 忽略 */ }
    }

    // 片头标题卡（字幕条同时交代故事背景）
    if (titleIdea) titleIdea.textContent = '《' + currentIdea + ' · 大电影》';
    if (titleKicker) titleKicker.textContent = N.kicker(hints ? hints.theme.label : '');
    if (titleSub) titleSub.textContent = N.tagline();
    showSubtitle(N.intro(currentIdea, hints ? hints.theme.key : ''));
    if (titleCard) titleCard.classList.add('show');
    sfx('gong');
    glitch(2);
    later(function () { glitch(1); }, 700);

    later(function () {
      if (token !== runToken) return;
      if (titleCard) titleCard.classList.remove('show');
      glitch(2);
      playScene(token, scenes, 0, currentIdea);
    }, 2600);
  }

  function playScene(token, scenes, index, currentIdea) {
    if (token !== runToken) return;

    if (index >= scenes.length) {
      finishPreview(token, currentIdea, scenes);
      return;
    }

    var scene = scenes[index];
    if (!scene || typeof scene.mount !== 'function') {
      playScene(token, scenes, index + 1, currentIdea);
      return;
    }

    // 旁白：每一场都写这一镜画面里正在发生的事
    var themeKey = hints ? hints.theme.key : '';
    var line = N.caption(scene.id, currentIdea, hints);
    if (!line) line = N.intro(currentIdea, themeKey);
    showSubtitle(line);
    setSceneTag(index, scenes.length, scene);

    try {
      scene.mount(stage, currentIdea, hints);
      currentScene = scene;
      bumpCastChip();
    } catch (e) {
      if (window.console) console.warn('[main] 场景挂载失败:', scene.id, e);
    }

    var duration = Math.max(1200, Number(scene.duration) || 3000);

    later(function () {
      if (token !== runToken) return;

      if (currentScene) {
        try { currentScene.cleanup(); } catch (e) { /* 忽略 */ }
        currentScene = null;
      }
      if (stage) stage.innerHTML = '';
      hideSubtitle();
      glitch(1);

      later(function () {
        if (token !== runToken) return;
        playScene(token, scenes, index + 1, currentIdea);
      }, 240);
    }, duration);
  }

  function finishPreview(token, currentIdea, scenes) {
    // 结尾旁白（场记板先撤，避免和片尾字幕对不上）
    if (sceneTag) sceneTag.textContent = '';
    showSubtitle(N.outro(currentIdea));
    glitch(2);
    sfx('sting');

    later(function () {
      if (token !== runToken) return;
      hideSubtitle();
    }, 1500);

    later(function () {
      if (token !== runToken) return;
      if (endSub) endSub.textContent = N.endNote();
      if (endCard) endCard.classList.add('show');
      glitch(3);
      sfx('slam');
      if (VHS) { try { VHS.pulse(); } catch (e) { /* 忽略 */ } }
    }, 1400);

    later(function () {
      if (token !== runToken) return;
      renderRating(currentIdea);
    }, 3300);
  }

  /* ---------- ④ 评分卡 ---------- */
  function renderRating(currentIdea) {
    if (AUDIO) {
      try { AUDIO.bgmStop(); } catch (e) { /* 忽略 */ }
    }
    if (VHS) {
      try { VHS.stop(); } catch (e) { /* 忽略 */ }
    }
    resetPreview();

    var r = N.rating(currentIdea);
    if (ratingIdea) ratingIdea.textContent = currentIdea;
    if (ratingScore) ratingScore.textContent = r.score;
    if (ratingStars) {
      var n = Math.max(0, Math.min(5, Number(r.stars) || 0));
      ratingStars.textContent = new Array(n + 1).join('★') + new Array(6 - n).join('☆');
    }
    if (ratingReview) ratingReview.textContent = r.review;
    if (ratingAward) ratingAward.textContent = '获奖：' + r.award;
    if (ratingBudgetNote) ratingBudgetNote.textContent = r.budgetNote;
    if (ratingIncident) ratingIncident.textContent = r.incident;
    if (ratingTeaser) ratingTeaser.textContent = r.teaser;
    if (ratingTag) ratingTag.textContent = r.tag;

    saveFilm(currentIdea, r);

    showScreen('rating');
    sfx('sting');
    sfx('boom');
    if (VHS) { try { VHS.glitch(1); } catch (e) { /* 忽略 */ } }
  }

  /* ---------- 流程入口 ---------- */
  function startFlow(forcedIds) {
    if (state === 'loading' || state === 'preview') return;

    var raw = input ? String(input.value || '').trim() : '';
    if (!raw) {
      shakeInput();
      if (input) input.focus();
      return;
    }

    // 控制字幕与标题长度
    idea = raw.length > 48 ? raw.slice(0, 48) + '……' : raw;
    hints = HINTS.of(idea);
    applyHints();

    var forcedScenes = scenesByIds(forcedIds);

    clearTimers();
    resetPreview();
    ++runToken;
    var token = runToken;

    if (AUDIO) {
      try { AUDIO.init(); } catch (e) { /* 忽略 */ }
    }
    if (VHS) {
      try { VHS.stop(); } catch (e) { /* 忽略 */ }
    }

    showScreen('loading');
    setBar(0);
    if (input) input.blur();

    var lines = pickLines(3);
    if (hints) lines[0] = '选角完成：' + hints.hero + ' · ' + hints.theme.label;
    if (loadingText) loadingText.textContent = '';
    if (loadingNoteEl) loadingNoteEl.textContent = N.loadingNote();
    typeLine(loadingText, lines[0] || '正在准备……', 0, token);

    later(function () {
      if (token !== runToken) return;
      setBar(24 + Math.floor(Math.random() * 8));
      typeLine(loadingText, lines[1] || '倒带中……', 0, token);
    }, 950);

    later(function () {
      if (token !== runToken) return;
      setBar(52 + Math.floor(Math.random() * 10));
      typeLine(loadingText, lines[2] || '渲染中……', 0, token);
      if (loadingNoteEl) loadingNoteEl.textContent = N.loadingNote();
    }, 1900);

    later(function () {
      if (token !== runToken) return;
      setBar(87);
      if (loadingNoteEl) loadingNoteEl.textContent = N.loadingNote();
      if (VHS) { try { VHS.glitch(1); } catch (e) { /* 忽略 */ } }
    }, 2650);

    later(function () {
      if (token !== runToken) return;
      setBar(100);
      if (VHS) { try { VHS.pulse(); } catch (e) { /* 忽略 */ } }
    }, 3650);

    later(function () {
      if (token !== runToken) return;
      runPreview(forcedScenes);
    }, 3980);
  }

  function backToIdle() {
    clearTimers();
    ++runToken;
    resetPreview();
    if (AUDIO) {
      try { AUDIO.bgmStop(); } catch (e) { /* 忽略 */ }
    }
    if (VHS) {
      try { VHS.stop(); VHS.ready(); } catch (e) { /* 忽略 */ }
    }
    showScreen('idle');
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  /* ---------- 事件绑定 ---------- */
  if (startBtn) startBtn.addEventListener('click', startFlow);
  if (rollBtn) rollBtn.addEventListener('click', rollIdea);

  if (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        startFlow();
      }
    });
    input.addEventListener('input', rotatePlaceholder);
  }

  if (btnReroll) {
    btnReroll.addEventListener('click', function () {
      if (state !== 'rating') return;
      clearTimers();
      runPreview();
    });
  }

  if (btnNew) btnNew.addEventListener('click', backToIdle);

  if (theaterList) {
    theaterList.addEventListener('click', function (e) {
      var node = e.target;
      var card = node && node.closest ? node.closest('.film-card') : null;
      if (!card) return;
      replayFilm(Number(card.getAttribute('data-idx')));
    });
  }

  if (theaterClear) {
    theaterClear.addEventListener('click', function () {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* 忽略 */ }
      renderTheater();
      sfx('glitch');
      glitch(1);
    });
  }

  // 页面切走时停掉 BGM，回来再续
  document.addEventListener('visibilitychange', function () {
    if (!AUDIO) return;
    try {
      if (document.hidden) {
        AUDIO.bgmStop();
      } else if (state === 'preview') {
        AUDIO.bgmStart();
      }
    } catch (e) { /* 忽略 */ }
  });

  /* ---------- 启动 ---------- */
  showScreen('idle');
  if (VHS) { try { VHS.ready(); } catch (e) { /* 忽略 */ } }
  renderTheater();
  rotatePlaceholder();

  function rotateMarquee() {
    if (!marqueeText) return;
    marqueeText.textContent = N.marquee();
  }

  rotateMarquee();
  later(rotatePlaceholder, 4200);
  var placeholderTimer = setInterval(rotatePlaceholder, 5200);
  var marqueeTimer = setInterval(rotateMarquee, 11000);
  window.addEventListener('pagehide', function () {
    clearInterval(placeholderTimer);
    clearInterval(marqueeTimer);
  });

})();
