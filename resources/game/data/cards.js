export const ACTION_MIX = {
  low:  {hit:13, double:6, tangle:1, swallow:2, baitlost:1, snag:1},
  mid:  {hit:12, double:6, tangle:1, swallow:2, baitlost:2, snag:1},
  high: {hit:12, double:8, tangle:1, swallow:2, baitlost:1, snag:0},
};

export const ACTION_INFO = {
  hit: {
    emoji:"🎣", title:"中魚了！", desc:"成功拉竿：進行捕獲判定。", flavor:"魚兒咬餌了，現在看你的技術。",
    hooked:{emoji:"💪", title:"穩住！開始收線", desc:"沉住氣收線：進行捕獲判定。", flavor:"竿尾彎了，一收一放之間見真章。"},
  },
  double: {
    emoji:"🎣🎣", title:"雙鉤中魚！", desc:"強力拉竿：可拉 2 條、每條各自判定（含鄰近遞補）。", flavor:"運氣極佳、技術純熟，一次吸引兩條魚上鉤。",
    hooked:{emoji:"🎣🎣", title:"另一門鉤也中了！", desc:"收線途中另一門鉤也中魚：可拉 2 條、每條各自判定（含鄰近遞補）。", flavor:"雙竿齊沉，今天海神眷顧。"},
  },
  tangle: {
    emoji:"🪢", title:"跟夥伴纏線了", desc:"協作失誤：與離你最近的夥伴魚線纏繞，雙方皆無漁獲。擲骰未達 3，兩人一起休息一回合。", flavor:"站得越近，線越容易繞在一起。",
    hooked:{emoji:"🪢", title:"魚拖著線纏住夥伴！", desc:"上鉤的魚亂竄，把線拖進離你最近的夥伴那裡——魚跑了，雙方皆無漁獲。擲骰未達 3，兩人一起休息一回合。", flavor:"大魚一發力，兩個人的線全亂了。"},
  },
  swallow: {
    emoji:"😮", title:"吞鉤了！", desc:"自動捕獲：隨機取得該水域 1 張魚牌，但下回合休息。", flavor:"穩拿，但處理吞鉤很費時。",
    hooked:{emoji:"😮", title:"魚把鉤吞得更深", desc:"自動捕獲：直接取得該水域 1 張魚牌，但下回合休息處理。", flavor:"連鉤帶線吞下去了，跑不掉、也急不得。"},
  },
  baitlost: {
    emoji:"🪱", title:"魚餌掉了", desc:"直接失敗：本次行動結束，不進行判定。", flavor:"魚只吃了餌就跑了，只能重新整理釣組。",
    hooked:{emoji:"💨", title:"脫鉤了！", desc:"魚在收線途中甩脫了魚鉤：本次行動結束，不進行判定。", flavor:"就差一點！魚尾一甩，回到了大海。"},
  },
  snag: {
    emoji:"🪨", title:"釣到地球（底礁）", desc:"設備損壞：本次行動結束，下回合需休息處理線組。", flavor:"魚鉤被礁石卡住了。",
    hooked:{emoji:"🪨", title:"魚鑽進礁石縫！", desc:"上鉤的魚鑽進礁縫把線卡死：本次行動結束，下回合需休息處理線組。", flavor:"老釣手都知道，讓魚鑽了洞就只能斷線。"},
  },
};

export const DESTINY_CARDS = [
  {t:"surge",   n:1, title:"湧浪來襲",      content:"湧浪突然拍打上岸，被淋濕了",                 result:"沒有漁獲",                                         kind:"fail"},
  {t:"baitoff", n:1, title:"魚餌掉了",      content:"魚餌沒有勾好，魚竿甩出去就掉了",             result:"沒有漁獲",                                         kind:"fail"},
  {t:"baiteat", n:1, title:"魚餌被吃了",    content:"魚餌被吃掉了",                               result:"沒有漁獲",                                         kind:"fail"},
  {t:"gearbad", n:1, title:"釣具沒有準備好",content:"浮標跟鉛配重錯誤，無法判別魚是否上鉤",       result:"沒有漁獲",                                         kind:"fail"},
  {t:"snag",    n:1, title:"釣到地球了",    content:"魚餌被礁石卡住，需要擲骰子",                 result:"沒有漁獲。擲骰 ≤3 魚鉤收不回來，休息一回合處理釣具", kind:"snag"},
  {t:"tangle",  n:1, title:"跟夥伴纏線了",  content:"魚線跟夥伴的纏繞在一起，需要擲骰子",         result:"沒有漁獲。擲骰 ≤3 釣具損壞，與身旁玩家一起休息一回合", kind:"tangle"},
  {t:"wind",    n:2, title:"風太大了",      content:"因為風太大，需要用骰子決定釣具是否順利入海", result:"擲骰 >2 魚餌順利入海，進入拉竿階段",               kind:"wind"},
  {t:"hooked",  n:9, title:"中魚了",        content:"有魚上鉤了，把握好機會",                     result:"進入拉竿階段！",                                   kind:"go"},
  {t:"swallow", n:4, title:"中魚了（吞鉤）",content:"有魚吞鉤了，把握好機會",                     result:"進入拉竿階段！若順利釣起，需休息一回合處理吞鉤",   kind:"go_swallow"},
  {t:"double",  n:4, title:"雙鉤中魚了",    content:"使用兩門魚鉤都中魚了，把握好機會",           result:"進入拉竿階段！若拉竿成功可額外多得 1 條（含鄰近遞補）", kind:"go_double"},
  {t:"eel",     n:2, title:"遇到海鰻",      content:"海鰻會偷吃漁獲，需要用骰子決定漁獲狀態",     result:"擲骰 >2 保住漁獲；否則損失 1 條放回魚牌堆",       kind:"eel"},
  {t:"bigwave", n:1, title:"大浪來襲",      content:"有一波浪推來了，快把腳抬高，避開浪潮",       result:"擲骰 >2 躲過浪潮；否則跌倒，休息一回合",           kind:"bigwave"},
  {t:"seen1",   n:1, title:"被魚發現了",    content:"魚線用太粗了，被魚抓包了",                   result:"沒有漁獲",                                         kind:"fail"},
  {t:"seen2",   n:1, title:"被魚發現了",    content:"站太高了，被魚抓包了",                       result:"沒有漁獲",                                         kind:"fail"},
];

export const DESTINY_MIX = {
  low:  {surge:1,baitoff:1,baiteat:0,gearbad:0,seen1:1,seen2:0,snag:1,tangle:1,wind:1,hooked:15,swallow:3,double:6,eel:0,bigwave:0},
  mid:  {surge:1,baitoff:1,baiteat:0,gearbad:0,seen1:1,seen2:0,snag:1,tangle:1,wind:1,hooked:14,swallow:3,double:5,eel:1,bigwave:1},
  high: {surge:1,baitoff:1,baiteat:0,gearbad:0,seen1:1,seen2:0,snag:1,tangle:1,wind:1,hooked:14,swallow:3,double:7,eel:0,bigwave:0},
};

export const ENV_COUNTS = {calm:5, eel:2, hightide:2, wave:3, lowtide:2, chat:1, escape:2};

export const ENV_INFO = {
  calm:     {animType:"calm",     emoji:"🌅",   title:"風平浪靜",         desc:"無事發生，下一回合大家都正常釣魚。",                                               flavor:"海洋寬容的一面，適合釣魚。"},
  eel:      {animType:"eel",      emoji:"🐍",   title:"海鰻偷襲",         desc:"海鰻爬上岸偷水窪的漁獲！每位玩家擲骰，小於 3 損失 1 條放回補充堆。",               flavor:"趁大家盯著海面，牠從岩縫溜了上來。"},
  escape:   {animType:"escape",   emoji:"🐟💨", title:"奮力逃脫",         desc:"水窪裡的魚奮力跳出！每位玩家擲骰，小於 3 損失 1 條放回補充堆。",                   flavor:"魚池的魚奮力逃出水池，游回大海。"},
  hightide: {animType:"hightide", emoji:"🌊",   title:"漲潮了",           desc:"魚群移動：場上所有魚牌重新洗牌置放。",                                             flavor:"潮水帶著魚群換了位置。"},
  lowtide:  {animType:"lowtide",  emoji:"🏖️",  title:"退潮了",           desc:"魚群移動：場上所有魚牌重新洗牌置放。",                                             flavor:"礁岩露出，魚群游向別處。"},
  wave:     {animType:"wave",     emoji:"🌊💥", title:"大浪打來",         desc:"自然反撲：每位玩家擲骰，小於 3 需強制休息一回合。",                               flavor:"大浪出現，單腳站立、避免被浪沖倒！"},
  chat:     {animType:"chat",     emoji:"💬",   title:"風平浪靜，聊聊天吧", desc:"全員同步休息一回合。",                                                          flavor:"海邊的閒聊，也是文化的傳承。"},
};
