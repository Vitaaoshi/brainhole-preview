/* ============================================================
 * 脑洞解析层（hints.js）
 * 把用户输入的一句话拆成：主角 / 对象 / 场景 / 影片类型主题
 * 供 main.js 与各场景使用，让「输入」真的影响「画面」
 * ============================================================ */
(function () {
  'use strict';
  if (window.HINTS) return;

  /* ---------- 主角（按优先级匹配，最后兜底） ---------- */
  var ROLES = [
    { re: /猫|喵/, hero: '🐱', word: '喵', type: '动物' },
    { re: /外卖|快递|骑手/, hero: '🛵', word: '让', type: '服务业' },
    { re: /狗|汪/, hero: '🐶', word: '汪', type: '动物' },
    { re: /恐龙/, hero: '🦖', word: '吼', type: '动物' },
    { re: /龙/, hero: '🐉', word: '吟', type: '动物' },
    { re: /鲸鱼|鲸/, hero: '🐋', word: '咕', type: '动物' },
    { re: /绿萝|仙人掌|植物/, hero: '🌵', word: '嗨', type: '植物' },
    { re: /奥特曼|超人|英雄|大侠|盟主/, hero: '🦸', word: '冲', type: '英雄' },
    { re: /外星|飞碟|ufo|UFO/, hero: '👽', word: '咦', type: '外星' },
    { re: /机器人|人工智能|AI|ai/, hero: '🤖', word: '嘀', type: '机器' },
    { re: /神|仙|佛祖|上帝|祖先/, hero: '🧙', word: '叹', type: '神' },
    { re: /鬼|幽灵|噩梦/, hero: '👻', word: '呜', type: '鬼' },
    { re: /老板|领导|上司/, hero: '🧑‍💼', word: '嗯', type: '职场' },
    { re: /同事/, hero: '🧑‍💻', word: '哦', type: '职场' },
    { re: /外卖|快递/, hero: '🛵', word: '让', type: '服务业' },
    { re: /手机|电脑|打印机|蓝屏|充电/, hero: '💻', word: '滴', type: '电子' },
    { re: /孩子|学生|同学|儿子|女儿/, hero: '🧒', word: '啊', type: '人类' },
    { re: /我|咱|本人/, hero: '🧍', word: '我', type: '人类' }
  ];

  /* ---------- 被怼的对象 / 命中点 ---------- */
  var TARGETS = [
    { re: /老板|领导|上司/, t: '🧑‍💼' },
    { re: /公司|办公室|工位|周报|开会|打卡|加班|上班|简历|面试|绩效|电梯/, t: '🏢' },
    { re: /外星|飞碟|ufo|UFO/, t: '🛸' },
    { re: /怪兽|恐龙/, t: '🦖' },
    { re: /猫/, t: '🐱' },
    { re: /狗/, t: '🐶' },
    { re: /地球|世界|宇宙|太空|月球|卫星/, t: '🌍' },
    { re: /早餐|食堂|外卖|包子|番茄|菜单|冰箱/, t: '🍜' },
    { re: /门|电梯|洗衣机|传送门/, t: '🚪' },
    { re: /闹钟|手机|电话/, t: '⏰' },
    { re: /冰箱|保温杯/, t: '🧊' },
    { re: /红绿灯|马路|地铁/, t: '🚦' }
  ];

  /* ---------- 场景背景（怪兽脚下的城市） ---------- */
  var PLACES = [
    { re: /宇宙|太空|月球|卫星|黑洞/, p: ['🌑', '🌕', '🛸'] },
    { re: /海|鲸鱼|鱼|河边|湖/, p: ['🌊', '⛵', '🐟'] },
    { re: /厨房|早餐|食堂|外卖|包子|番茄|饭店/, p: ['🍳', '🍜', '🥟'] },
    { re: /学校|教室|考试|操场/, p: ['🏫', '📚', '✏️'] },
    { re: /山|森林|北极|野外|沙漠/, p: ['🏔️', '🌲', '⛺'] },
    { re: /家|床|客厅|楼下|小区/, p: ['🏠', '🏢', '🛋️'] }
  ];

  /* ---------- 影片类型 ---------- */
  var THEMES = {
    horror: { key: 'horror', label: '恐怖片', accent: '#ff2b3d', accent2: '#8a0028' },
    love: { key: 'love', label: '爱情片', accent: '#ff7ab8', accent2: '#ff2bd1' },
    funny: { key: 'funny', label: '喜剧片', accent: '#ffe23d', accent2: '#ff9d00' },
    scifi: { key: 'scifi', label: '科幻片', accent: '#22e6ff', accent2: '#2b5bff' },
    action: { key: 'action', label: '动作片', accent: '#ff6b1a', accent2: '#ff3b30' },
    nature: { key: 'nature', label: '动物世界', accent: '#35ff8a', accent2: '#9dff6b' },
    office: { key: 'office', label: '职场纪录片', accent: '#9db3cc', accent2: '#35ff8a' },
    doc: { key: 'doc', label: '伪纪录片', accent: '#35ff8a', accent2: '#22e6ff' }
  };

  var THEME_RULES = [
    { re: /鬼|恐怖|噩梦|灵异|阴森/, theme: THEMES.horror },
    { re: /爱|喜欢|暗恋|前任|约会|结婚|相亲/, theme: THEMES.love },
    { re: /搞笑|沙雕|离谱|尴尬|懵逼|笑话|崩了/, theme: THEMES.funny },
    { re: /宇宙|太空|外星|月球|卫星|黑洞|时光|穿越|时空|时间|平行|传送|通向|异次元|轮回|回到/, theme: THEMES.scifi },
    { re: /奥特曼|大战|爆炸|追杀|拯救|逃亡|开战|打架|怪兽/, theme: THEMES.action },
    { re: /猫|狗|恐龙|龙|鱼|鲸|鸟|熊|绿萝|仙人掌|动物/, theme: THEMES.nature },
    { re: /公司|上班|加班|老板|领导|同事|周报|开会|打卡|工位|办公室|简历|面试|绩效/, theme: THEMES.office }
  ];

  var CACHE = {};
  var MAX_CACHE = 40;

  function firstMatch(list, text) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].re.test(text)) return list[i];
    }
    return null;
  }

  function of(raw) {
    var text = String(raw == null ? '' : raw).slice(0, 120);
    if (!text) text = '这个脑洞';
    if (CACHE[text]) return CACHE[text];

    var role = firstMatch(ROLES, text);
    var target = firstMatch(TARGETS, text);
    var place = firstMatch(PLACES, text);
    var themeHit = firstMatch(THEME_RULES, text);

    var tags = [];
    if (role && role.type) tags.push(role.type);
    if (themeHit) tags.push(themeHit.theme.label);

    var out = {
      text: text,
      hero: role ? role.hero : '🧍',
      heroWord: role ? role.word : '我',
      roleType: role ? role.type : '人类',
      target: target ? target.t : '🏢',
      places: place ? place.p : ['🏢', '🏬', '🏣'],
      theme: themeHit ? themeHit.theme : THEMES.doc,
      tags: tags
    };

    CACHE[text] = out;
    var keys = Object.keys(CACHE);
    if (keys.length > MAX_CACHE) delete CACHE[keys[0]];
    return out;
  }

  /* 类型主题写进预演容器，供 CSS 变量取用 */
  function apply(hints, el) {
    if (!hints || !el) return;
    el.style.setProperty('--acc', hints.theme.accent);
    el.style.setProperty('--acc2', hints.theme.accent2);
    el.setAttribute('data-genre', hints.theme.key);
  }

  window.HINTS = {
    of: of,
    apply: apply,
    THEMES: THEMES
  };
})();
