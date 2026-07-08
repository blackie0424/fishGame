// 每種魚的像素藝術參數，供 renderer/sprites.js 繪製像素魚圖
// 2026-07-08 依 public/images/removebg/ 去背照片逐張目視+抽色校正（feat/fish-art-from-photos）
// 正式環境以後台魚種設定（fish_species.art）為準，此處為未連線時的 fallback
export const FISH_ART = {
  //           shape   body      belly     accent    pattern   特徵
  Acyod:    {shape:"deep", body:"#2c4468", belly:"#c8b4c4", acc:"#e0a030", pat:"hline", tail:"#141c2c"}, // 深藍底黃縱紋，腹淡粉白
  Amingang: {shape:"oval", body:"#c87888", belly:"#eec6cc", acc:"#8a4a58", pat:"plain"},                 // 玫瑰粉紅鬚哥（秋姑）
  Angsa:    {shape:"deep", body:"#3c3833", belly:"#625a4e", acc:"#1e1c1a", pat:"plain"},                 // 深褐黑厚身刺尾鯛
  Anid:     {shape:"oval", body:"#d0bca4", belly:"#ece4d8", acc:"#7a5640", pat:"spots"},                 // 米白底褐色豹斑石斑
  Arawa:    {shape:"long", body:"#3c7058", belly:"#8ab07c", acc:"#7a4e30", pat:"plain", tail:"#3e6e9e"}, // 綠鸚哥，背古銅、尾藍
  Cilat:    {shape:"deep", body:"#c6c2a2", belly:"#eeeadc", acc:"#4c5668", pat:"spots"},                 // 銀白帶橄欖黃，細黑點
  Cirow:    {shape:"oval", body:"#322e32", belly:"#9a94a0", acc:"#16141a", pat:"plain"},                 // 黑褐身、腹側銀灰
  Ilek:     {shape:"oval", body:"#9aa2a8", belly:"#d6dade", acc:"#4e565e", pat:"plain"},                 // 銀灰白毛
  Kosikosi: {shape:"long", body:"#a8b8c8", belly:"#dde4ea", acc:"#1c1e22", pat:"plain", tail:"#24262a"}, // 銀藍細長身，黑白帶尾
  Kowaos:   {shape:"long", body:"#a4b49c", belly:"#d6dcd0", acc:"#8a5040", pat:"spots"},                 // 綠灰底紅褐網格斑隆頭魚
  Kozapo:   {shape:"deep", body:"#d6c6b0", belly:"#eee8da", acc:"#965e48", pat:"spots"},                 // 米白底紅褐雲斑石狗公
  Lagarow:  {shape:"long", body:"#55985e", belly:"#c4dc74", acc:"#d84a5e", pat:"hline", tail:"#c04858"}, // 綠底紅粉縱紋隆頭魚
  Lalavok:  {shape:"deep", body:"#b8bcb2", belly:"#eeece4", acc:"#56504a", pat:"plain", tail:"#4e5a6c"}, // 淡銀白豆娘，尾深藍灰
  Mahabteng:{shape:"deep", body:"#585c50", belly:"#888c7e", acc:"#2c302a", pat:"bars"},                  // 橄欖灰底深縱帶
  Malan:    {shape:"deep", body:"#7ecec0", belly:"#d6efe6", acc:"#1c2226", pat:"bars",  tail:"#2c3238"}, // 藍綠雀鯛黑縱帶
  Savali:   {shape:"deep", body:"#d6b678", belly:"#f0eade", acc:"#18181c", pat:"plain", tail:"#b4b0a4"}, // 畢卡索砲彈魚
  Takazit:  {shape:"long", body:"#20362a", belly:"#30503c", acc:"#101a14", pat:"plain", tail:"#bed676"}, // 墨綠長吻鳥鸚鯛，尾緣黃綠
  Tangara:  {shape:"deep", body:"#4a3c34", belly:"#6e5c50", acc:"#28201a", pat:"plain"},                 // 深巧克力褐厚身雀鯛
  Tapez:    {shape:"deep", body:"#e6c322", belly:"#f0d84a", acc:"#3a3222", pat:"spots", tail:"#c89858"}, // 鮮黃蝴蝶魚，黑白眼帶
  Veras:    {shape:"long", body:"#b6cac2", belly:"#daeee6", acc:"#3c4a4e", pat:"spots", tail:"#d8882e"}, // 棋盤格紋隆頭魚，尾橘
};
