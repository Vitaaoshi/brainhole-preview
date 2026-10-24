/**
 * narration.js —— 脑洞预演器的旁白文案生成器
 * 风格：90 年代盗版碟旁白 + 土味预告片 + 一本正经胡说八道
 * 纯文本生成，不操作 DOM；所有输出由主控用 textContent 渲染。
 *
 * 对外接口：
 *   intro(idea, themeKey)      片头旁白（可按影片类型换口吻）
 *   mid(idea, themeKey)        中段旁白（按影片类型调味）
 *   outro(idea)                片尾旁白
 *   caption(sceneId, idea)     场景字幕（12 个场景各有一套）
 *   rating(idea, themeKey)     评分卡数据（含拍摄事故 / 下集预告）
 *   kicker(themeLabel)         片头小字
 *   tagline()                  片头副标题
 *   loadingNote()              假加载页机器提示
 *   marquee()                  待机页滚动条
 *   endNote()                  全剧终页副文案
 *   typo(text)                 盗版碟错别字彩蛋
 */
(function (global) {
  'use strict';

  // 空脑洞的兜底名词
  var FALLBACK_IDEA = '这个脑洞';
  // 脑洞最长保留 24 个字，超出部分省略
  var IDEA_LIMIT = 24;

  /* ---------------- 小工具 ---------------- */

  // 随机取数组中的一条；空数组返回空字符串，避免异常
  function pick(arr) {
    if (!arr || !arr.length) return '';
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // 返回洗牌后的新数组副本，不污染传入的数组
  function shuffle(arr) {
    var copy = (arr || []).slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // 把 idea 安全地转成可用于文案的文本
  function safeIdea(idea) {
    var text = '';
    if (typeof idea === 'string') {
      text = idea.trim();
    } else if (typeof idea === 'number' && isFinite(idea)) {
      text = String(idea);
    }
    if (!text) return FALLBACK_IDEA;

    // 按码点截断，避免把代理对（如 emoji）切成两半
    var chars = Array.from(text);
    if (chars.length > IDEA_LIMIT) {
      return chars.slice(0, IDEA_LIMIT).join('') + '……';
    }
    return text;
  }

  // 用 split/join 替换占位符，idea 里含 $、花括号等字符也不会出错
  function fill(template, idea) {
    return template.split('{idea}').join(idea);
  }

  function fillTheme(template, theme) {
    return template.split('{theme}').join(theme || '五毛特效');
  }

  /* ---------------- 片头旁白 ---------------- */

  var INTRO_POOL = [
    '公元 2026 年，{idea} 的故事，开始了。',
    '这是一个关于 {idea} 的传说，也是一场灾难。',
    '那年夏天，{idea} 悄悄降临。',
    '没有人相信，{idea} 会发生在今天。',
    '请系好安全带，{idea} 即将登场。',
    '在人类遗忘的档案库里，{idea} 一直躺着。',
    '故事要从一个普通的星期二说起，那天 {idea} 来了。',
    '根据不可靠消息，{idea} 已经出现在你家楼下。',
    '本片根据真实事件改编，虽然我们也不知道是哪一件。',
    '一切，都从 {idea} 开始。',
    '当时没人觉得 {idea} 有什么问题。',
    '灯光暗下，{idea} 缓缓升起。',
    '欢迎收看本期节目，本期主角是 {idea}。',
    '有关部门提醒：{idea} 即将发生，请勿围观。',
    '三十年前的一个雨夜，{idea} 第一次出现。',
    '请把音量调大，{idea} 的脚步声近了。',
    '本片由 {idea} 独家赞助，赞助金额为零。',
    '很久很久以前，也就是上周五，{idea} 诞生了。',
    '在宇宙的某个角落，{idea} 正在加载。',
    '温馨提示：接下来发生的一切，都与 {idea} 有关。',
    '那年，{idea} 只值五毛钱，现在也是。',
    '电视机前的观众朋友，{idea} 已经开始了。'
  ];

  /* ---------------- 中段旁白 ---------------- */

  var MID_POOL = [
    '没有人想到，{idea} 竟然是真的。',
    '科学家警告：{idea} 将改变一切。',
    '关键时刻，{idea} 站了出来。',
    '因为 {idea}，人类文明命悬一线。',
    '档案第 7 号：{idea}，禁止公开。',
    '就在此时，{idea} 出现了。',
    '所有人都在问：{idea} 是什么？',
    '事情，远比 {idea} 复杂。',
    '然而，{idea} 只是开始。',
    '上级命令：立即封锁 {idea}。',
    '午夜十二点，{idea} 醒了。',
    '这是最后的警告：{idea} 失控了。',
    '无线电里，传来 {idea} 的声音。',
    '没有人能阻止 {idea}。',
    '三分钟后，{idea} 抵达现场。',
    '秘密实验室里，{idea} 正在苏醒。',
    '专家摇头：{idea} 无法解释。',
    '倒计时结束，{idea} 爆发了。',
    '电视突然插播：{idea} 正在靠近。',
    '报告总部，{idea} 已经没有退路。',
    '目击者称，{idea} 会发光。',
    '全场安静，只剩 {idea} 的呼吸。',
    '数据表明，{idea} 的概率为零。',
    '可它偏偏发生了。',
    '监控画面里，{idea} 一闪而过。',
    '与此同时，{idea} 正在加速。',
    '指挥部沉默了整整三秒。',
    '有人按下了那个按钮。',
    '{idea} 的代表作，即将上演。',
    '警报响了，{idea} 没听见。',
    '这是人类第一次，也是最后一次。',
    '预算已经用完了，{idea} 还在继续。',
    '特效师请假了，{idea} 只好自己上。',
    '导演喊了卡，{idea} 没停。',
    '镜头切到 {idea}，请自备墨镜。',
    '第八集：{idea} 的反击。',
    '前方高能，{idea} 正在接近。',
    '所有人后退，{idea} 要说话了。',
    '天气预报：{idea} 转特大暴雨。',
    '电网开始不稳，{idea} 正在充电。',
    '隔壁老王都听见了。',
    '这次，{idea} 认真了。',
    '出人意料的是，{idea} 会写周报。',
    '时间只剩七秒，{idea} 还在系鞋带。',
    '没有人报警，因为电话费太贵。',
    '{idea} 的第二次出现，更加离谱。',
    '字幕组已放弃翻译 {idea}。',
    '观众席传来掌声，{idea} 更来劲了。',
    '现场只剩一台摄像机和五毛钱。',
    '以上画面由 {idea} 亲自出演。',
    '警方提醒：遇到 {idea} 请保持微笑。',
    '{idea} 动了，全场都动了。',
    '这次不是演习，{idea} 真的来了。',
    '天黑了，{idea} 却更亮了。',
    '最后一个镜头，留给 {idea}。',
    '我们尽力了，{idea} 没有。',
    '{idea} 的数据正在刷新纪录。',
    '救护车来了，{idea} 先上车走了。'
  ];

  /* ---------------- 按影片类型调味 ---------------- */

  var GENRE_INTRO = {
    horror: [
      '警告：接下来，{idea} 将出现在你的屏幕里。',
      '这盘录像带，记录了 {idea} 的第一次出现。',
      '请关灯观看，{idea} 喜欢黑暗。'
    ],
    love: [
      '这是一个关于 {idea} 和另一个倒霉蛋的故事。',
      '那年春天，{idea} 心动了，对象不详。',
      '爱情来了，{idea} 还没准备好。'
    ],
    funny: [
      '郑重声明：本片纯属搞笑，{idea} 本人并不知情。',
      '请坐稳，{idea} 要开始丢人了。',
      '这是一部喜剧片，笑不笑由你，{idea} 已经笑了。'
    ],
    scifi: [
      '公元 2087 年，人类终于造出了 {idea}。',
      '来自未来的信号只有一句：{idea}。',
      '星际档案 004：{idea}，危险等级未知。'
    ],
    action: [
      '倒计时开始，{idea} 即将登场。',
      '本片动作场面全部由 {idea} 亲自完成（大概）。',
      '一声令下，{idea} 冲了出去。'
    ],
    nature: [
      '本期动物世界，我们跟随 {idea} 的脚步。',
      '在广袤的自然界里，{idea} 只是一个开始。',
      '镜头记录下了 {idea} 的日常，非常无聊，但很真实。'
    ],
    office: [
      '周一早上九点，{idea} 准时出现。',
      '这是一部职场纪录片，主角是 {idea}，工位在角落。',
      '本片根据真实周报改编，{idea} 已同意出镜。'
    ],
    doc: [
      '本片由一台旧摄像机拍摄，记录对象是 {idea}。',
      '以下是关于 {idea} 的全部已知资料。',
      '专家无法解释 {idea}，但镜头拍到了。'
    ]
  };

  var GENRE_MID = {
    horror: [
      '深夜的走廊里，{idea} 敲了三次门。',
      '录像带里出现了 {idea} 的脸。',
      '灯灭了，{idea} 却还亮着。',
      '别回头，{idea} 就在你身后。',
      '这个房间里，{idea} 不是唯一的东西。',
      '第 13 分钟，{idea} 开始呼吸。'
    ],
    love: [
      '那一年，{idea} 爱上了隔壁工位。',
      '{idea} 递来一杯奶茶，全片最甜。',
      '可惜，{idea} 的对象是一台打印机。',
      '雨停了，{idea} 的告白还没说完。',
      '他们在天台上拥抱，风很大，假发飞了。',
      '{idea} 说：我们下辈子再拍。'
    ],
    funny: [
      '{idea} 一开口，全场笑到停机。',
      '这段本来要煽情，结果 {idea} 摔了一跤。',
      '导演喊卡，{idea} 还在演。',
      '{idea} 认真起来的样子，更好笑。',
      '观众笑到停电，{idea} 借机退场。',
      '全片最好笑的，是 {idea} 的片酬。'
    ],
    scifi: [
      '公元 2087 年，{idea} 成了新能源。',
      '飞船跃迁失败，因为 {idea} 没买票。',
      '时间线被 {idea} 搅成一团。',
      '平行宇宙里，{idea} 是个正常人。',
      '黑洞吞下 {idea}，第二天吐了出来。',
      '人工智能第一次产生困惑：{idea} 为什么。'
    ],
    action: [
      '{idea} 一个翻滚，躲过了纸片子弹。',
      '追车戏拍到了二环，因为只借到一辆自行车。',
      '{idea} 出拳，空气应声倒地。',
      '爆炸三连，特效组已经尽力。',
      '{idea} 单挑全场，全场只有两个人。',
      '最后一击，用了全片最贵的音效。'
    ],
    nature: [
      '在大草原上，{idea} 正在迁徙。',
      '春天来了，{idea} 开始换毛。',
      '镜头拍到 {idea} 捕食，食物是薯片。',
      '动物学家表示：这个物种不存在。',
      '{idea} 的巢，建在了公司打印机里。',
      '夜幕降临，{idea} 开始求偶，声音很大。'
    ],
    office: [
      '周一上午九点，{idea} 准时出现在工位。',
      '周报里，{idea} 被写进了第三条。',
      '会议开到第五个小时，{idea} 举了手。',
      '老板说：这个月 KPI 就是 {idea}。',
      '{idea} 的工位在厕所旁边，风景独好。',
      '下班时间到了，{idea} 没走，它不敢。'
    ],
    doc: [
      '镜头记录下了 {idea} 的全部过程。',
      '解说员停顿三秒：{idea} 无法解释。',
      '本片素材来自一台旧手机。',
      '专家组反复研究，最后放弃了。',
      '{idea} 的标本，现存于导演家阳台。',
      '这是人类第一次完整拍到 {idea}。'
    ]
  };

  /* ---------------- 场景专属字幕 ---------------- */

  var CAPTION_POOL = {
    ufo: [
      '雷达显示：{idea} 正在降落。',
      '飞碟停在楼顶，车主一直没下来。',
      '外星朋友递来一张名片，上面写着 {idea}。',
      '探照灯扫过，{idea} 假装没看见。',
      '第一次接触，双方都很紧张，主要因为经费。',
      '雷达上的光点，是 {hero} 打电话叫来的。'
    ],
    boom: [
      '一声巨响，{idea} 原地开花。',
      '爆炸半径：五毛。冲击波：没有。',
      '火光冲天的画面，其实是一张 A4 纸。',
      '{idea} 被炸飞了，但没飞出画框。',
      '特效组表示：这一段我们加了三层滤镜。',
      '爆炸掀起一阵风，{hero} 的头发更乱了。'
    ],
    beam: [
      '{idea} 抬手，光线开始蓄力。',
      '光束打中目标，目标礼貌地后退半步。',
      '这是全片最贵的一秒。',
      '十字光波，由两根荧光灯管出演。',
      '{idea} 大喊：发射！预算：熄灯。',
      '{hero} 抬手，光线直直打向 {target}。'
    ],
    kaiju: [
      '{idea} 长到八百米，楼价应声下跌。',
      '怪兽抬头，城市开始发抖（轻微）。',
      '它的吼声，是配音演员现场喊的。',
      '{idea} 一脚踩空，踩到了自家停车场。',
      '楼是纸的，怪兽是剪纸的，情绪是真的。',
      '怪兽低头，{hero} 站在它对面，腿有点抖。'
    ],
    meteor: [
      '陨石坠落，准确砸中 {idea} 的快递。',
      '天文台确认：这次真的不是特效。',
      '{idea} 抬头，天空裂了一条缝。',
      '撞击坑深度：三厘米，含泡沫。',
      '六秒钟后，尘埃落定，也落荒而逃。'
    ],
    storm: [
      '雷声响起，{idea} 躲进了被窝。',
      '雨一直下，摄影师一直抖。',
      '闪电劈下，{idea} 的手机瞬间满电。',
      '这场暴雨，是拿喷壶拍的。',
      '全城停电，{idea} 却开始发光。'
    ],
    slowmo: [
      '慢镜头里，{idea} 跑了三分钟还没跑出画面。',
      '时间变慢了，{idea} 的鞋带还没系好。',
      '风吹起头发，{idea} 的假发先飞了。',
      '这一跑，跑掉了全片一半预算。',
      '{idea} 回头，观众席一片模糊。',
      '{hero} 慢动作跑过，假发飞了三次。'
    ],
    duel: [
      '双方对视，激光开始乱飞。',
      '{idea} 掏出武器，是一支激光笔。',
      '打斗持续八秒，剪辑用了四十个镜头。',
      '红绿光束交错，{idea} 精准地打中空气。',
      '火花四溅，其实有人在旁边甩仙女棒。'
    ],
    doom: [
      '地球裂开，{idea} 站在裂缝边上吃瓜。',
      '世界末日，特效组终于认真了一次。',
      '{idea} 转身，身后是碎成拼图的地球。',
      '这一次，真的没有续集预算了。',
      '宇宙静音三秒，{idea} 打了个哈欠。'
    ],
    slam: [
      '就在这时，{idea} 有点尴尬。',
      '字幕砸下来，观众的心也砸了一下。',
      '{idea} 缓了缓，说：下一场。',
      '画面一黑，声音还没黑。',
      '导演最爱的镜头，就俩字。',
      '{hero} 想说话，字幕抢先一步砸了下来。'
    ],
    flee: [
      '人群四散，{idea} 逆行而上。',
      '大家跑得很快，因为后面没特效。',
      '楼开始倾斜，{idea} 还在找出口。',
      '尘土飞扬，是有人在旁边扫地板。',
      '{idea} 回头看了一眼，然后也跑了。',
      '{hero} 跑在人群最前面，方向不太对。'
    ],
    hero: [
      '英雄登场，披风是床单改的。',
      '光打下来，{idea} 的剪影帅了 0.5 秒。',
      '背影很稳，因为脚下垫了砖。',
      '这一刻，{idea} 觉得自己值五块钱。',
      '全场起立，主要是为了活动一下。',
      '镜头给到 {hero}，披风是床单改的，气势是真的。'
    ]
  };

  var GENERIC_CAPTION = [
    '镜头一转，{idea} 又出现了。',
    '没有人喊卡，{idea} 只好继续。',
    '这一段的特效，是昨天做的。',
    '导演说：先拍着，后期再想办法。',
    '{idea} 往前一步，画面抖了一下。',
    '此处应有掌声，但没有预算。',
    '摄像机还在录，{idea} 还在演。',
    '现场安静得能听见电风扇。'
  ];

  /* ---------------- 片尾旁白 ---------------- */

  var OUTRO_POOL = [
    '这个关于 {idea} 的故事，由五毛特效呈现。',
    '{idea} 的故事到此结束，请倒带重看。',
    '感谢观看 {idea}，本片特效由电风扇提供。',
    '{idea}，下次还敢。',
    '如果你看到了这里，说明你是真的闲。',
    '关于 {idea} 的一切纯属虚构，如有雷同，建议搬家。',
    '本片没有彩蛋，{idea} 也没有。',
    '幕布落下，{idea} 还在加班。',
    '以上就是 {idea} 的全部预算。',
    '请把录像带放回原位，{idea} 会记得你。',
    '字幕升起，{idea} 悄悄退场。',
    '更多关于 {idea} 的故事，暂时没有了。',
    '本片拍摄期间，{idea} 未受任何伤害（大概）。',
    '感谢 {idea} 的精彩表演，片酬为两包辣条。',
    '下一集：{idea} 的邻居。',
    '全片完，{idea} 未完。',
    '请勿模仿 {idea}，后果自负。',
    '录像带请勿倒放，否则 {idea} 会回来。',
    '这就是 {idea}，便宜，但真诚。',
    '后会有期，{idea} 便宜地走了。'
  ];

  /* ---------------- 评分卡文案 ---------------- */

  var REVIEW_POOL = [
    '我看了个寂寞',
    '建议特效师倒贴钱',
    '逻辑是什么？能吃吗？',
    '年度五毛巨制，物超所值',
    '经费在燃烧，但烧的是蜡烛',
    '剧情比我家网速还卡',
    '看完想给电视机道歉',
    '特效像用脚画的',
    '我奶奶剪得都比这好',
    '十分钟拍了八十集',
    '建议改成广播剧',
    '画面糊得很有年代感',
    '一只飞碟反复用了六次',
    '演员很努力，道具不努力',
    '看完我学会了倒带',
    '这票价，我认了',
    '导演可能也没看懂',
    '声音比画面先到',
    '我爷爷用手机拍的都比这个稳',
    '建议按秒收费，这样我还能少付点',
    '剧情像我家楼道的灯，忽明忽暗',
    '特效不如我眨一下眼',
    '看完想去给导演递纸巾',
    '全片最贵的是片头字幕',
    '画面在动，故事在睡',
    '我给了一星，另一星给勇气',
    '建议出个纯音频版',
    '剪辑师可能中途下班了',
    '道具组用心了，用的是昨天的',
    '这特效，拼多多九块九包邮',
    '我看完立刻检查了自家电视',
    '情节推进靠字幕，字幕也不太情愿',
    '这是一部需要观众配合的电影',
    '声音很立体，画面很平面',
    '片头三分钟，片尾两分钟，中间靠猜',
    '一颗星给努力，一颗星给盒饭',
    '我家猫看得比我还认真',
    '建议在片尾加一句对不起',
    '反转很突然，因为没有铺垫',
    '全片唯一高清的是字幕',
    '我已经开始期待下一部了（并不）',
    '导演的想象力远远超过了预算',
    '看完我决定不学电影了',
    '眼睛很累，心很平静',
    '这部电影治好了我的失眠',
    '强烈建议二倍速观看',
    '五毛钱花出了五分钱的效果',
    '结尾字幕比正片精彩',
    '我甚至怀疑这是故意的',
    '全片最真实的是黑屏那三秒',
    '建议收藏，以后当笑话看',
    '看完我给自己鼓了掌',
    '我不是目标观众，我是受害者',
    '画面一出，全场沉默',
    '请把预算还给投资人'
  ];

  var AWARD_POOL = [
    '金酸莓奖提名',
    '五毛电影节最佳音效',
    '房东警告奖',
    '最佳纸片飞碟奖',
    '年度最省钱爆炸奖',
    '最佳反复利用道具奖',
    '观众忍耐力特别奖',
    '最糊画面荣誉奖',
    '最佳停电式打光奖',
    '特效部门集体失踪奖',
    '最佳倒带体验奖',
    '影碟店滞销冠军',
    '年度最佳锅盖道具奖',
    '最节约用电摄影奖',
    '手绘特效终身成就奖',
    '最佳纸片降落奖',
    '年度最不清晰画面奖',
    '五毛预算管理优秀奖',
    '最佳一次成型奖（一次就放弃）',
    '最佳背景布景奖',
    '年度最吵配音奖',
    '最佳自制披风设计奖',
    '观众最想退票奖',
    '最稳定手持摄影奖（一直在抖）',
    '最佳道具重复利用奖',
    '年度最短拍摄周期奖',
    '最佳停电氛围奖',
    '最佳字幕抢戏奖',
    '年度最勇敢导演奖',
    '最佳一块砖头表演奖',
    '影碟店最快下架奖'
  ];

  var BUDGET_POOL = [
    '主要花在盒饭上',
    '剩下的钱买了电池',
    '特效全靠手抖',
    '由导演自费垫付',
    '比道具还便宜',
    '预算：两包辣条',
    '还没算电费',
    '已经超支五毛',
    '全靠后期硬撑',
    '省下的钱拍续集',
    '剩余 0.3 元用于买胶带',
    '实际支出为负数',
    '由盒饭赞助商友情提供',
    '电池钱是借的',
    '至今还没还清',
    '已抵押给道具组',
    '一半用来打印海报',
    '另一半买了个锅盖',
    '片酬以辣条结算',
    '电费另计',
    '拍摄场地是自家客厅',
    '服装来自衣柜',
    '后期费用：一顿饭',
    '音效是口技',
    '灯光靠太阳',
    '交通费占了大头',
    '演员自带盒饭'
  ];

  var TAG_POOL = [
    '已认证烂片',
    '建议倒带重录',
    '五毛特效认证',
    '年度迷惑巨制',
    '请自备耐心',
    '盗版碟限定',
    '胶片已发霉',
    '请勿模仿',
    '含大量纸片',
    '片尾有彩蛋',
    '强烈建议快进',
    '请配合脑补',
    '道具已回收',
    '导演情绪稳定',
    '含少量剧情',
    '已通过自我审核',
    '本片不宜空腹观看',
    '错别字属正常现象',
    '轻微掉帧（严重）',
    '结局留白（其实是忘了拍）',
    '适合深夜独自观看',
    '建议搭配泡面',
    '片尾无彩蛋',
    '请勿外传（并不会有人传）'
  ];

  var INCIDENT_POOL = [
    '拍摄事故：道具楼被风吹倒，重拍 1 次。',
    '拍摄事故：主角笑场 4 次，剪掉 3 次。',
    '拍摄事故：爆炸镜头用的是一张红纸。',
    '拍摄事故：灯光师手抖，全片自带抖动。',
    '拍摄事故：群演只有两个人，来回跑。',
    '拍摄事故：摄影师踩到电线，摔进了镜头。',
    '拍摄事故：外星飞碟是用锅盖改的。',
    '拍摄事故：怪兽配音由导演亲自喊。',
    '拍摄事故：雨戏用的是楼上浇花的水。',
    '拍摄事故：片场盒饭被狗叼走一份。',
    '拍摄事故：结尾镜头因内存不足未拍。',
    '拍摄事故：录音里混进了隔壁装修声。',
    '拍摄事故：演员的披风是自家窗帘。',
    '拍摄事故：陨石由一块砖头出演。',
    '拍摄事故：全片 NG 27 次，成片留下 1 条。'
  ];

  var TEASER_POOL = [
    '下集预告：{idea} 的暑假。',
    '下集预告：{idea} 结婚了，对象是打印机。',
    '下集预告：{idea} 升职了，工位在厕所。',
    '下集预告：{idea} 去月球开分店。',
    '下集预告：{idea} 大战自己的复印机。',
    '下集预告：{idea} 学会了倒立走路。',
    '下集预告：{idea} 参加选秀，止步海选。',
    '下集预告：{idea} 搬家，搬到了隔壁。',
    '下集预告：{idea} 的第二职业：卖烤肠。',
    '下集预告：{idea} 收到外星人的投诉。',
    '下集预告：{idea} 宣布退休，第二天复出。',
    '下集预告：{idea} 的前传，正在筹钱。',
    '下集预告：{idea} 的孩子比它还离谱。',
    '下集预告：{idea} 开了家五毛特效公司。',
    '下集预告：{idea} 和楼下的猫握手言和。'
  ];

  /* ---------------- 片头小字 / 副标题 ---------------- */

  var KICKER_POOL = [
    '五毛特效 荣誉呈现 · {theme}',
    '本片由电风扇赞助 · {theme}',
    '{theme} · 请勿在观看时进食',
    '录像带第 3 次使用 · {theme}',
    '{theme} · 主演是一个 emoji',
    '盗版碟限量发行 · {theme}',
    '拍摄于一个普通的楼道 · {theme}',
    '{theme} · 特效组已集体请假',
    '本片含大量手绘场景 · {theme}',
    '{theme} · 谨以此片致敬所有穷人'
  ];

  var TAGLINE_POOL = [
    '一 部 不 可 能 获 奖 的 电 影',
    '今 年 最 省 钱 的 大 片',
    '建 议 倒 带 重 看',
    '请 自 备 想 象 力',
    '全 片 无 尿 点，因 为 只 有 二 十 秒',
    '特 效 不 足，脑 补 有 余',
    '已 经 尽 力 了',
    '拍 摄 过 程 无 人 受 伤（大 概）',
    '票 房 预 计：五 毛',
    '导 演 说 这 是 艺 术'
  ];

  /* ---------------- 机器提示 / 滚动条 / 片尾小字 ---------------- */

  var LOADING_NOTE_POOL = [
    'PLEASE BE PATIENT · 1998',
    'TRACKING · 请勿拍打机顶',
    'HEAD CLEANING REQUIRED',
    'TAPE 03 · 已使用 47 次',
    'SP · 信号良好（勉强）',
    '请勿快进 · 会卡',
    '正在读取磁粉……',
    '机器比片子还老',
    '音量请调至最大',
    '本碟为盗版 · 请低调观看',
    '画质已尽力 · 请勿投诉',
    '退碟请按两次'
  ];

  var MARQUEE_POOL = [
    '本片含有大量廉价特效 心理承受能力弱者慎入 · 建议佩戴墨镜观看 · 特效经费已严重超支 · 导演已跑路 · 请勿模仿片中动作',
    '全场实景拍摄（在客厅）· 道具均为家中常备 · 演员没有片酬只有盒饭 · 请爱护公共财物 · 尤其是那台电风扇',
    '本碟为盗版转录 画质略有下降 · 请调大音量 · 如出现雪花属正常现象 · 拍打机身可能导致更严重雪花',
    '请勿在观看时饮食 · 因为真的会喷出来 · 本片包含手绘爆炸 · 纸片飞碟 · 以及一段没有拍完的结局',
    '本片由五毛特效团队制作 · 特效预算 ¥0.50 · 其中 ¥0.30 用于购买胶带 · 剩余 ¥0.20 下落不明',
    '观影提示 · 请自备想象力 · 本片不提供逻辑 · 不提供剧情 · 不提供退款 · 只提供二十秒的快乐'
  ];

  var END_NOTE_POOL = [
    '本 片 无 彩 蛋 · 请 自 行 脑 补',
    '字 幕 到 此 结 束 · 感 谢 忍 受',
    '拍 摄 期 间 无 人 受 伤（大 概）',
    '特 效 组 已 下 班 · 再 见',
    '请 倒 带 · 或 直 接 关 机',
    '本 片 耗 资 五 毛 · 已 严 重 超 支'
  ];

  /* ---------------- 洗牌队列：避免短时间内重复 ---------------- */

  var midQueue = [];
  var lastMidTemplate = '';
  var genreQueues = {};

  // 取一条本轮未出现过的中段模板
  function nextMidTemplate() {
    if (!midQueue.length) {
      midQueue = shuffle(MID_POOL);
      // 避免新一轮的第一条和上一轮最后一条撞车
      if (midQueue.length > 1 && midQueue[0] === lastMidTemplate) {
        var first = midQueue[0];
        midQueue[0] = midQueue[midQueue.length - 1];
        midQueue[midQueue.length - 1] = first;
      }
    }
    return midQueue.shift();
  }

  // 按类型取一条，同样用完再洗牌
  function nextGenreTemplate(themeKey) {
    var pool = themeKey ? GENRE_MID[themeKey] : null;
    if (!pool || !pool.length) return '';
    if (!genreQueues[themeKey] || !genreQueues[themeKey].length) {
      genreQueues[themeKey] = shuffle(pool);
    }
    return genreQueues[themeKey].shift();
  }

  /* ---------------- 对外 API ---------------- */

  // 开场旁白：三成概率切到类型专属开场
  function intro(idea, themeKey) {
    var safe = safeIdea(idea);
    var genrePool = themeKey ? GENRE_INTRO[themeKey] : null;
    var template = (genrePool && Math.random() < 0.35)
      ? pick(genrePool)
      : pick(INTRO_POOL);
    return fill(template, safe);
  }

  // 中段旁白：六成概率用类型专属台词，其余走通用池
  function mid(idea, themeKey) {
    var safe = safeIdea(idea);
    var template = '';
    if (themeKey && Math.random() < 0.6) template = nextGenreTemplate(themeKey);
    if (!template) template = nextMidTemplate();
    if (!template) template = '然而，{idea} 只是开始。';
    if (themeKey && GENRE_MID[themeKey] && GENRE_MID[themeKey].indexOf(template) >= 0) {
      // 类型台词不参与 lastMidTemplate 的去重
      return fill(template, safe);
    }
    lastMidTemplate = template;
    return fill(template, safe);
  }

  // 场景字幕：按场景 id 取专属台词，并按脑洞解析结果替换 {hero} / {target}
  function caption(sceneId, idea, hints) {
    var safe = safeIdea(idea);
    var pool = CAPTION_POOL[sceneId];
    var template = (pool && pool.length) ? pick(pool) : pick(GENERIC_CAPTION);
    var text = fill(template, safe);
    if (hints) {
      text = text.split('{hero}').join(hints.hero || '');
      text = text.split('{target}').join(hints.target || '');
    }
    return text;
  }

  // 结尾旁白
  function outro(idea) {
    var safe = safeIdea(idea);
    return fill(pick(OUTRO_POOL), safe);
  }

  // 评分卡：字段固定为 score / stars / review / award / budgetNote / tag / incident / teaser
  function rating(idea) {
    var safe = safeIdea(idea);

    // 1.5 ~ 3.9，保留一位小数
    var score = ((15 + Math.floor(Math.random() * 25)) / 10).toFixed(1);
    var scoreNumber = parseFloat(score);

    var stars;
    if (scoreNumber <= 2.4) {
      stars = 1;
    } else if (scoreNumber <= 3.2) {
      stars = 2;
    } else {
      stars = 3;
    }

    return {
      score: score,
      stars: stars,
      review: pick(REVIEW_POOL),
      award: pick(AWARD_POOL),
      budgetNote: pick(BUDGET_POOL),
      tag: pick(TAG_POOL),
      incident: pick(INCIDENT_POOL),
      teaser: fill(pick(TEASER_POOL), safe)
    };
  }

  // 片头小字
  function kicker(themeLabel) {
    return fillTheme(pick(KICKER_POOL), themeLabel);
  }

  // 片头副标题
  function tagline() {
    return pick(TAGLINE_POOL);
  }

  // 假加载页右下角机器提示
  function loadingNote() {
    return pick(LOADING_NOTE_POOL);
  }

  // 待机页滚动条
  function marquee() {
    return pick(MARQUEE_POOL);
  }

  // 全剧终页副文案
  function endNote() {
    return pick(END_NOTE_POOL);
  }

  // 盗版碟错别字彩蛋：10% 概率把一个「的」换成「滴」
  function typo(text) {
    if (typeof text !== 'string' || !text) return typeof text === 'string' ? text : '';
    if (Math.random() >= 0.1) return text;

    var positions = [];
    for (var i = 0; i < text.length; i++) {
      if (text.charAt(i) === '的') positions.push(i);
    }
    if (!positions.length) return text;

    var at = positions[Math.floor(Math.random() * positions.length)];
    return text.slice(0, at) + '滴' + text.slice(at + 1);
  }

  global.NARRATION = {
    intro: intro,
    mid: mid,
    caption: caption,
    outro: outro,
    rating: rating,
    kicker: kicker,
    tagline: tagline,
    loadingNote: loadingNote,
    marquee: marquee,
    endNote: endNote,
    typo: typo
  };
})(typeof window !== 'undefined' ? window : globalThis);
