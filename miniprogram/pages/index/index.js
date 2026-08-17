// 诗海单页：行为与网页版 index.html 对齐（抽取→渲染→主题→分享图）
const cfg = require("../../utils/config");
const data = require("../../utils/data");
// require 必须全部置顶：DevTools 依赖分析对超大数组字面量之后的 require 会漏判（ignoreDevUnusedFiles 误删模块）
const verse = require("../../utils/verse");
const themes = require("../../utils/themes");
const { drawShare, drawNoteShare } = require("../../utils/share-canvas");
// Round-18：全部体裁内嵌代码（按常见度排序），不再在线统计
const TYPE_LIST_ALL = ["七言绝句","七言律诗","五言律诗","五言古风","五言绝句","七言古风","元曲","浣溪沙","水调歌头","菩萨蛮","鹧鸪天","满江红","临江仙","西江月","念奴娇","减字木兰花","沁园春","蝶恋花","点绛唇","清平乐","失调名","贺新郎","满庭芳","虞美人","诗经","好事近","水龙吟","朝中措","渔家傲","卜算子","谒金门","南乡子","玉楼春","南歌子","踏莎行","生查子","柳梢青","蓦山溪","望江南・忆江南","浪淘沙","鹊桥仙","如梦令","诉衷情","木兰花慢","洞仙歌","阮郎归","青玉案","采桑子","醉落魄・一斛珠","江城子","摸鱼儿","瑞鹤仙","小重山","长相思","感皇恩","八声甘州","醉蓬莱","喜迁莺","酹江月・念奴娇","忆秦娥","霜天晓角","导引","齐天乐","木兰花・玉楼春","眼儿媚","定风波","少年游","汉宫春","永遇乐","江神子・江城子","更漏子","千秋岁","声声慢","祝英台近","风入松","楚辞","瑞鹧鸪","渔父词・渔父","行香子","丑奴儿・采桑子","乌夜啼","桃源忆故人","风流子","南柯子・南歌子","一翦梅","凤栖梧・蝶恋花","酒泉子","烛影摇红","武陵春","最高楼","夜行船","杏花天","调笑・调笑令","天仙子","一落索","秦楼月・忆秦娥","望海潮","醉桃源・阮郎归","画堂春","昭君怨","醉花阴","兰陵王","思佳客","恋绣衾","河传","品令","壶中天・念奴娇","花心动","忆王孙","雨中花・夜行船","十二时・忆少年","金缕曲・贺新郎","应天长","御街行","桂枝香","苏幕遮","惜奴娇","捣练子","词","六州","六州歌头","夜游宫","女冠子","燕归梁","玉蝴蝶","解连环","贺新凉・贺新郎","高阳台","万年欢","忆旧游","惜分飞","探春令","杨柳枝","人娇","宴清都","调笑令","乐语","太常引","扫花游・扫地游","木兰花令","相见欢","九张机","唐多令","多丽","步蟾宫","绛都春","一丛花","天香","宴桃源・如梦令","玉漏迟","疏影","秋蕊香","台城路・齐天乐","渔歌子","破阵子","糖多令・唐多令","一萼红","二郎神","六么令","婆罗门引","宝鼎现","新荷叶","河满子","法曲献仙音","法驾导引","甘州・八声甘州","哨遍","庆清朝","春光好","真珠帘","荷叶杯","贺圣朝","迎春乐","东风第一枝","乳燕飞・贺新郎","减字浣溪沙・浣溪沙","归朝欢","忆仙姿・如梦令","摊破浣溪沙・山花子","水调歌・水调","渡江云","玲珑四犯","花舞","莺啼序","西河","满路花・促拍满路花","相思引","绮罗香","胜胜慢・声声慢","雨中花慢","一剪梅・一翦梅","倦寻芳","南楼令・唐多令","意难忘","渔父・渔歌子","琐窗寒","百字令・念奴娇","菊花新","豆叶黄・忆王孙","七娘子","三姝媚","两同心","于飞乐","人月圆","传言玉女","塞翁吟","暗香","望远行","渔家傲引・渔家傲","滴滴金","留春令","百字谣・念奴娇","祝英台・祝英台近","绿头鸭・多丽","解语花","调笑转踏・调笑令","过秦楼","隔浦莲・隔浦莲近拍","雨中花令","东坡引","促拍满路花","垂丝钓","安阳好・忆江南","尾犯","梅花引","瑞龙吟","秋夜雨","花犯","薄媚","选冠子","锦堂春・锦堂春慢","一斛珠","八六子","减兰十梅・减字木兰花","剔银灯","南徐好","夜合花","安公子","定西番","庆春宫・高阳台","极相思","柳枝","渔歌・渔父","满庭霜・满庭芳","潇湘神","看花回","解佩令","霓裳中序第一","霜叶飞","三登乐","倾杯・倾杯乐","华胥引","南浦","大","巫山一段云","徵招","探芳信","摸鱼子","昼锦堂","洞庭春色・沁园春","浣沙溪・浣溪沙","玉烛新","秋霁","红林擒近","金人捧露盘","鼓笛慢・水龙吟","一寸金","侧犯","凤凰台上忆吹箫","卖花声","夏云峰","夜飞鹊・夜飞鹊慢","愁倚阑・春光好","探春慢","梦江南","梦玉人引","氐州第一","水调歌","江城梅花引","河渎神","海棠春","添字浣溪沙・山花子","渔夫舞","粉蝶儿","荔枝香近・荔枝香","采莲舞","金盏子","金蕉叶","鱼游春水","鹊踏枝・蝶恋花","鹤冲天","三部乐","六丑","凤衔杯","大圣乐","太清舞","奉礼歌","尉迟杯","忆少年","惜双双・惜分飞","折丹桂","早梅芳・喜迁莺","月上海棠","步虚词・西江月","浪淘沙令","瑶台第一层","瑶台聚八仙・新雁过妆楼","绮寮怨","芰荷香","解蹀躞","转调二郎神・二郎神","醉太平","锁窗寒・琐寒窗","长相思令・长相思","后庭花","塞垣春","大酺","孤鸾","山花子","庆宫春・高阳台","庆春泽","度清霄","归国遥","怨王孙・忆王孙","惜黄花","扑蝴蝶","扬州慢","摊破浣溪沙","斗百花","月下笛","望仙门","木兰花","桂殿秋","沙塞子","清商怨","渔父乐・渔歌子","石州慢","碧牡丹","罗敷歌・采桑子","薄幸","西地锦","西平乐","踏青游","还京乐","醉公子","醉春风","重叠金・菩萨蛮","雨霖铃","丁香结","上林春・一落萦","上西平・金人捧露盘","丑奴儿慢・采桑子慢","丹凤吟","于中好","侍香金童","倒犯","倾杯乐","凤凰阁","十月桃","千秋岁引","喜朝天・踏莎行","四字令・醉太平","夏初临","好女儿","定风波令・定风波","归田乐","忆帝京","思越人・朝天子","惜秋华","折红梅","无闷","木兰花减字・减字木兰花","梁州令","江梅引・江城梅花引","浣溪纱・浣溪沙","潇湘夜雨・满庭芳","燕山亭","玉交枝・忆秦娥","玉团儿","甘州子","百字歌・自度曲","红窗迥","绕佛阁","芳草渡・系裙腰","苏武慢","荔枝香","谢新恩","谢池春","赤枣子","醉思仙","醉翁操","金盏倒垂莲","金菊对芙蓉","长亭怨・长亭怨慢","黄莺儿","鼓笛令","一枝春","上行杯","下水船","买陂塘・摸鱼儿","亭前柳","伤情怨・清商怨","促拍丑奴儿","偷声木兰花","八拍蛮","凄凉犯","凤皇台上忆吹箫・凤凰台上忆吹箫","凤箫吟・芳草","击梧桐","双头莲","合宫歌","四园竹","国香","子夜歌","宜男草","宴琼林","开元乐・三台","引驾行","思帝乡","思越人","惜红衣","惜馀春慢・选冠子","惜黄花慢","愁倚阑令・春光好","拜星月慢","摊破丑奴儿・采桑子","新雁过妆楼","早梅芳近・早梅芳","昼夜乐","曲江秋","曲游春","望梅花","柳初新","柳含烟","梦游仙・戚氏","江南好・忆江南","汤泉应制","洛阳春・一落萦","淡黄柳","湘月・念奴娇","玉女摇仙佩","玉胡蝶・玉蝴蝶","玉连环・解连环","珍珠帘・真珠帘","甘草子","端正好","系裙腰","聒龙谣","苍梧谣・归字谣","茶瓶儿","连理枝","迷神引","遐方怨","长寿乐","隔浦莲近・隔浦莲近拍","隔浦莲近拍","露华","青门引・青门饮","青门饮","龙吟曲・水龙吟","龙山会","万年欢慢・万年欢","上阳春・蓦山溪","临江仙引","八宝妆","八归","关河令・清商怨","内家娇","凤归云","凤来朝","十拍子・破阵子","千年调","南海子","卷珠帘・蝶恋花","双雁儿","古记・如梦令","合欢带","喜迁莺令・喜迁莺","圣无忧・乌夜啼","城头月","声声令・胜胜令","孤雁儿・御街行","宴山亭・燕山亭","宴春台","寿星明・沁园春","小桃红・连理枝","忆瑶姬","恨春迟","拂霓裳","拟古","摊声浣溪沙・浣溪沙","摊破木兰花・木兰花","於中好","明月引・江城梅花引","明月逐人来","春从天上来","月中行・月宫春","月华清","月照梨花・河传","望梅","望汉月・忆汉月","望江南","望秦川・南歌子","柘枝舞","梅花曲","梦江南・忆江南","楼心月","江南曲・踏莎行","洞仙歌令・洞仙歌","浪淘沙慢","渔父","满宫花","满朝欢","玉堂春","玉联环・解连环","瑶台月","甘露歌","白苎","盐角儿","相思令・相思儿令","相思儿令","石州引・石州慢","离亭宴","离亭燕・离亭宴","笛家弄・笛家","红窗听","胡捣练","花发沁园春","蕙兰芳引","蜡梅香","西施","西溪子","踏歌","透碧霄","遍地花","醉垂鞭","金凤钩","金缕曲","钗头凤・撷芳词","锦帐春","阳关曲","降仙台","雁後归・临江仙","雪梅香","驻马听","一丛花令・一丛花","一井金","一箩金・蝶恋花","一络索","一络索・一落萦","三台春曲","三字令","三犯渡江云・渡江云","上平西・金人捧露盘","上林春令・一落索","不见・如梦令","丑奴儿令・采桑子","五彩结同心","五福降中天","佳人醉","倒垂柳","八节长欢","六桥行","冉冉云","凤凰台忆吹箫・凤凰台上忆吹箫","劝金船","卓牌儿・卓牌子","卜算子慢","厅前柳","双双燕","双燕儿","发引","古阳关・阳关引","向湖边","吴山青・长相思","吴门柳・渔家傲","吴音子","喜团圆","喜迁莺慢・喜迁莺","塞孤","壶中天慢・念奴娇","夜半乐","大有","大江东去・念奴娇","天门谣","如意令・如梦令","如鱼水","安平乐・安平乐慢","安平乐慢","宴瑶池・越江吟","寻梅","小冲山・小重山","小品","小秦王","小重山令・小重山","少年心","山亭柳","庆佳节","庆春时","庆清朝慢・庆清朝","庆金枝","归去来","归国谣・归国遥","归字谣","归田乐引・归田乐","忆东坡","忆人人・鹊桥仙","忆旧游慢","忆桃源","忆汉月","忆江南","忆闷令","思远人","怨三三","怨春郎","怨春风・一斛珠","恋情深","情久长","惜分钗・撷芳词","惜春令","感恩多","戚氏","戛金钗","扑蝴蝶近・扑蝴蝶","抛球乐","拜星月・拜星月慢","拟冬日景忠山应制","拨棹子","探春・探春慢","探芳讯","握金钗","摊破诉衷情・诉衷情","摘得新","摘红英","撼庭竹","斗百草","明月棹孤舟・夜行船","月宫春","望仙楼・胡捣练","朝天子","朝玉阶・朝天子","杜韦娘","极相思令・极相思","柳枝・杨柳枝","梅子黄时雨","楼上曲","步月","水仙子","江南春・秋风清","泛兰舟","浣溪沙慢","海月谣","海棠春令・海棠春","清波引","湘灵瑟","燕归来・喜迁莺","燕春台","独脚令・忆王孙","献衷心","玉京秋","玉抱肚","玉树后庭花・后庭花","玉蹀躞・解蹀躞","瑞鹤仙令・临江仙","瑞鹧鸪慢・瑞鹧鸪","瑶池月・瑶台月","瑶花慢","甘州遍","留客住","番女怨","白雪","相思引・琴调","眉妩","睿恩新","石州词・石州慢","破阵乐","祭天神","离别难","秋日田父辞","秋波媚・眼儿媚","竹枝","竹马子・竹马儿","红窗怨","红罗袄","纱窗恨","罗敷媚・采桑子","翻香令","脱银袍","舜韶新","菩萨・菩萨蛮","菩萨蛮令・菩萨蛮","蕙兰芳・蕙兰芳引","西子妆慢・西子妆","西平乐慢・西平乐","西楼子・相见欢","西江月慢","西湖明月引・江城梅花引","西湖月","角招","诉衷情令","诉衷情近","调啸・调笑令","贺圣朝影・添声杨柳枝","贺明朝","蹋莎行・踏莎行","转调满庭芳・满庭芳","转调蝶恋花・蝶恋花","转调踏莎行・踏莎行","轮台子","过涧歇近・过涧歇","过龙门・浪淘沙令","远朝归","迷仙引","醉花间","采莲令","采莲子","金明池","金缕歌・贺新郎","金缕词・贺新郎","锦园春三犯・锦园春","锦缠道","长亭怨慢","长寿仙促拍","长生乐","雪狮儿","青房并蒂莲","飞雪满群山","黄河清","黄鹂绕碧树","一丝风・诉衷情令","一枝花・促拍满路花","万年歌","万里春","三台","三台令","三段子・宝鼎现","上林春慢","上西楼・相见欢","与团圆・喜团圆","且坐令","东吴乐・尉迟杯","东邻妙・玉楼春","东阳叹・清商怨","东风齐著力","个侬","中兴乐","乃词","乌啼月・乌夜啼","九回肠・好女儿","买坡塘・摸鱼儿","二色宫桃","二色莲","于飞乐令・于飞乐","云仙引","云鬓松令","人南渡・感皇恩","人月圆令・人月园","付金钗・更漏子","伊川令・伊州令","伊州三台","伊州三台令・伊州三台","伊州曲","传花枝","伤春曲・满江红","伴云来・天香","伴登临・采桑子","似娘儿","何满子・河满子","使牛子","保寿乐","倚秋千・好事近","倚西楼","倚阑人","倚阑令・春光好","倚风娇近","倦寻芳慢・倦寻芳","倾杯令・倾杯乐","倾杯令・杯倾乐","倾杯序・倾杯乐","倾杯近","偶相逢・诉衷情","入塞","八宝装・八宝妆","八犯玉交枝・八宝妆","八音谐","六花飞","凉州令・梁州令","凌・金人捧露盘","凤孤飞","凤时春","凤楼春","凤求凰・声声慢","凤池吟","凤皇枝令・凤凰枝令","凤鸾双舞","凯歌","出塞・谒金门","别怨","别瑶姬慢・忆瑶姬","别素质・忆瑶姬","剑器近","剑舞","北山移文哨遍・哨遍","十二时慢","十二郎・二郎神","十六贤","十月梅・十月桃","十样花","千叶莲・鹧鸪天","千春词","千秋万岁・千秋岁引","千秋岁令・千秋岁引","千金意","升平乐","半死桐・鹧鸪天","华清引","卓牌子慢・卓牌子","卓牌子近","南楼令","南浦月・点绛唇","占春芳","卷春空・定风波","双","双声子","双头莲令","双瑞莲","双翠羽","双荷叶・忆秦娥","双韵子","受恩深","古倾杯・倾杯乐","古香慢","台城游・水调歌头","吊严陵","后庭花破子","吹柳絮・瑞鹧鸪","呈纤手・玉楼春","唤春愁・添声杨柳枝","唱金缕・贺新郎","啄木儿","喜长新","喝火令","四代好・宴清都","四和香・四犯令","四槛花","四犯令","四犯翦梅花","国门东・好女儿","国香慢・国香","垂丝钓近・垂丝钓","垂杨","垂杨碧・谒金门","城里钟・菩萨蛮","夏日宴黉堂・夏日燕黉堂","夏日燕黉堂","夜厌厌・夜行船","夜如年・捣练子","夜度娘","夜捣衣・捣练子","夜飞鹊慢","大圣乐令・玉团儿","大椿","大江乘・念奴娇","大江西上曲・念奴娇","大江词・念奴娇","天下乐","天下乐令・减字木兰花","天宁乐・金人捧露盘","太平年慢・太平年","太平时・添声杨柳枝","太平欢・念奴娇","太清歌词","头盏曲","夹竹桃花","好女儿令・好女儿","好溪山","如此江山・齐天乐","娇木笪・木笪","婆罗门・婆罗门引","婆罗门令","孟家蝉","孤馆深沈","安庆摸・摸鱼儿","定情曲","定风波慢","宛溪柳・六么令","宝鼎见・宝鼎现","宣州竹・虞美人","宣清","宴春台慢・宴春台","宴清堂","宴齐云・南歌子","家山好","寒松叹・声声慢","寰海清","寿延长中腔令・寿延长","寿延长破字令","寿楼春","将进酒・梅花引","尉迟杯慢・尉迟杯","小木兰花・木兰花","小梅花・梅花引","小楼连苑・水龙吟","小镇西・小镇西犯","小镇西犯","小阑干・少年游","少年游慢","尔汝歌・清商怨","山亭宴","山亭宴慢・山亭宴","山庄劝酒","山渐青・长相思","山鬼谣・摸鱼儿","峭寒轻","市桥柳","师师令","帝台春","幔卷绸・慢卷绸","平阳兴・踏莎行","并蒂芙蓉","广寒秋・鹊桥仙","庄椿岁・水龙吟","庆千秋","庆双椿・浣溪沙","庆同天・河传","庆寿光","庆灵椿・摊破南乡子","庆金枝令・庆金枝","庆长春・念奴娇","庆青春","应天长令・应天长","应景乐","弄珠英・蓦山溪","归去来兮引・归去来兮","归去难・促拍满路花","归平遥・归国遥","归朝歌","归田乐令・归田乐","归自谣","归风便・玉楼春","彩云归","彩凤飞","彩鸾归令","征部乐","御带花","御阶行・御街行","徵招调中腔・徵招","忆君王・忆王孙","忆吹箫・凤凰台上忆吹箫","忆吹箫慢・凤凰台上忆吹箫","忆少年令・忆少年","忆故人・烛影摇红","忆真妃・相见欢","忆萝月・清平乐","忆黄梅","忍泪吟・采桑子","快活年","快活年近拍","念彩云・夜游宫","念离群・沁园春","念良游・满江红","思佳客令・思佳客","思归乐","思牛女・踏莎行","恋绣衣","恋芳春慢","恋香衾","恨来迟","恨欢迟・恨来迟","惜双双令・惜分飞","惜寒梅","惜时芳・思归乐","惜春郎","惜琼花","惜花容","惜花春起早","惜花春起早慢","惜芳时・思归乐","惜芳菲・惜分飞","惜馀妍・惜余妍","惜馀春・踏莎行","惜馀欢・惜余欢","想车音・兀令","愁倚栏・春光好","愁风月・生查子","感庭秋・撼庭秋","感恩多令・山花子","感皇恩令・感皇恩","慢卷绸","扑胡蝶・扑蝴蝶","扫地舞","扫地花・扫地游","扫市舞","折新荷引・折新荷","折红英・撷芳词","抛球乐小抛球乐・抛球乐","抛球乐折花令・抛球乐","抛球乐水龙吟令・抛球乐","拥鼻吟・吴音子","拾翠羽","换巢鸾凤","换追风・浣溪沙","换遍歌头","捣练子令","探芳新","接贤宾","掩萧斋・浣溪沙","摊破南乡子","摊破江城子・江城梅花引","撒金钱","撷芳词","撼庭秋","攀鞍态・迎春乐","教池回","散天花","散馀霞","数花风・凤凰阁","斗婵娟・霜叶飞","斗鸡回","断湘弦・万年欢","断肠声・南歌子","新念别・夜游宫","新水令","无愁可解","无月不登楼","早梅香","昆明池・金明池","明月棹孤舟","明月照高楼慢・明月照高楼","映山红","映山红慢","春云怨","春声碎","春夏两相期","春归怨","春晓曲","春晴","春草碧・番枪子","春雪间早梅","春霁・秋霁","春风袅娜","晕眉山・踏莎行","晚云高・添声杨柳枝","晴偏好","暗香疏影","暮花天・花发沁园春","曲玉管","替人愁・添声杨柳枝","最多宜・浣溪沙","月上海棠慢・月上海棠","月上瓜洲・相见欢","月中桂","月先圆・好女儿","月华清慢・月华清","月城春・四犯翦梅花","月底修箫谱・祝英台近","月当厅","月当窗・霜天晓角","月边娇","有有令","望书归・捣练子","望云涯引","望南云慢","望扬州・长相思慢","望明河","望春回","望梅词・望梅","望江东","望江怨","望江梅","望湘人","望西飞・清商怨","望长安・蝶恋花","期夜月","木兰香・减字木兰花","杏园芳","杏梁燕・解连环","杏花天慢","杨州慢","杨柳陌・浣溪沙","杵声齐・捣练子","松梢月","枕屏儿","柳垂金","柳摇金・思归乐","柳腰轻","柳长春・踏莎行","桂华明・四犯令","桂枝香慢・桂枝香","桂飘香","桃园忆故人・桃源忆故人","桃源行・蝶恋花","梁州令叠韵・梁州令","梅弄影","梅香慢","梦仙乡","梦兰堂","梦扬州","梦横塘","梦相亲・玉楼春","梦芙蓉","梦行云","梦还京","梧桐影","楚宫春・楚宫春慢","楚宫春慢","楼下柳・天香","横塘路・青玉案","檐前铁","步花间・诉衷情","步虚子令","武林春・武陵春","比梅・如梦令","水晶帘・南歌子","水龙吟慢・水龙吟","永同欢","永裕陵歌","汉宫春慢・汉宫春","江南柳","江城子慢","江如练・蝶恋花","江楼令","江神子慢・江城子慢","沙头雨・点绛唇","法曲入破第一・法曲","法曲入破第三・法曲","法曲入破第二・法曲","法曲入破第四・法曲","法曲散序・法曲","法曲歌头・法曲","法曲第二・法曲","法曲第五煞・法曲","法曲第四・法曲","法曲遍第一・法曲","法曲遍第三・法曲","法曲遍第二・法曲","泛清波摘遍","泛清苕","洛妃怨・昭君怨","洞天春","浣沙溪","浦湘曲","浪涛沙・浪淘沙","浪淘沙近・浪淘沙","消息・永遇乐","淮甸春・念奴娇","添字丑奴儿・采桑子","添春色・醉乡春","清夜游","清平乐令・清平乐","清平令破子・清平乐","清风满桂楼","渔父家风・诉衷情令","渡江云三犯・渡江云","游月宫令","湘春夜月","湘江静","满园花・促拍满路花","满宫春","满庭芳慢・满庭芳","满朝欢令","潇湘忆故人慢","潇湘雨・满庭芳","潇湘静・湘江静","潇潇雨・踏莎行","澡兰香","熙州慢","爪茉莉","爱孤云・添声杨柳枝","爱月夜眠迟・爱月夜眠迟慢","爱月夜眠迟慢","独倚楼・更漏子","献仙桃","献仙音・法曲献仙音","献天寿令","献天寿慢・献天寿","献金杯・厌金杯","玉京谣","玉人歌","玉叶重黄","玉女迎春慢・玉女迎春","玉山枕","玉梅令","玉梅香慢","玉楼人","玉楼宴","玉楼春令・玉楼春","玉珑璁","玉簟凉","玉连环・一落索","玉阑干","王子高六么大曲・自度曲","王孙信・寻芳草","玲珑玉","珍珠令","琐寒窗","琵琶仙","琵琶仙・自度曲","瑞云浓","瑞云浓慢","瑞庭花引","瑶华","瑶池宴令・越江吟","瑶池燕","瑶花","瑶阶草","璧月堂・小重山","甘州令","甘露滴乔松","画堂春令・画堂春","画娥眉・忆王孙","画楼空・诉衷情","画眉郎・好女儿","番枪子","疏帘淡月・桂枝香","百媚娘","百字令","百宜娇・眉妩","百宝妆・新雁过妆楼","百宝装・新燕过妆楼","百岁令","皂罗特髻","相思会・千年调","眉峰碧・卜算子","真珠髻","睡花阴令・醉花阴","石湖仙","破子清平乐・清平乐","破字令","碧云深・忆秦娥","碧桃春・阮郎归","祝英台令","福寿千春・自度曲","秋兰香","秋千儿词","秋夜月・相见欢","秋宵吟","秋思","秋蕊香令","秋蕊香引","秋风叹・燕瑶池","秦刷子","窗下绣・一落萦","章台月・一斛珠","竹香子","竹马儿","第一花・鹧鸪天","簇水","簇水近","粉蝶儿慢","索酒","紫玉箫","紫萸香慢","红","红娘子・连理枝","红情・暗香","红楼慢","红窗月","红芍药","结带巾","绕池游","绕池游慢","绣停针","绣带儿・好女儿","绣带子・好女儿","绣鸾凤花犯・花犯","续渔歌・玉楼春","绮筵张・好女儿","维扬好","绿意・疏影","绿盖舞风轻・绿尽舞风轻","绿罗裙・生查子","群玉轩・小重山","翠楼吟","翠羽吟","翦征袍・捣练子","翦朝霞・鹧鸪天","翦牡丹","翻翠袖・更漏子","耍鼓令","胜胜令","胡捣练令・胡捣练","舞杨花","舞迎春・迎春乐","艳声歌・添声杨柳枝","芙蓉月","芭蕉雨","花上月令","花前饮","花发状元红慢","花幕暗・添声杨柳枝","花心动慢・花心动","花想容・武陵春","花自落・谒金门","花酒令","芳心苦・踏莎行","芳洲泊・踏莎行","芳草","苏武令","苗而秀・采桑子","荆溪咏・渔家傲","荐金蕉","荔子丹","荷华媚","荷叶铺水面","莫思归・抛球乐","莺声绕红楼","菱花怨","落梅慢・落梅","落梅花・落梅","落梅风・落梅","落花时","蓦溪山・蓦山溪","蕊珠闲","蕙清风","蕙香囊・鹊桥仙","薄命女","虞主歌","虞神・虞神歌","虞神歌","虞美人令・虞美人","虞美人影・桃源忆故人","蜀溪春","蝴蝶儿","行路难・梅花引","行香子慢","被花恼","西吴曲","西楼月・春晓曲","西湖念语","西湖曲・玉楼春","西窗烛","西笑吟・蝶恋花","要销凝・清商怨","解仙佩","解佩环・疏影","试周郎・诉衷情","误桃源","调笑歌・调笑令","谢池春慢","貂裘换酒・贺新郎","负心期・浣溪沙","赏南枝","赏松菊","赞成功","赞浦子","赤壁词・念奴娇","越女镜心・法曲献仙音","越山青・长相思","越江吟","越溪春","踏莎行慢","转声虞美人・桃源忆故人","转调丑奴儿・采桑子","转调定风波・定风波","转调贺圣朝・贺圣朝","辊绣球","辘轳金井・四犯翦梅花","辟寒金・迎春乐","辨弦声・迎春乐","过涧歇","迎仙客","迎新春","迎春乐令・迎春乐","还宫乐","送入我门来","送征衣","选官子・选冠子","逍遥乐","遂宁好","遥天奉翠华引","避少年・鹧鸪天","郭郎儿近拍","酷相思","醉中真・浣溪沙","醉乡曲","醉亭楼","醉厌厌・南歌子","醉吟商小品・小品","醉思凡・醉太平","醉桃园・桃源忆故人","醉梅花・鹧鸪天","醉梦迷・采桑子","醉琼枝・定风波","醉瑶池","醉红妆","醉落托","醉高楼","采明珠","采桑子慢","采绿吟","采莲入破・采莲令","采莲实催・采莲令","采莲延遍・采莲令","采莲摇捱遍・采莲令","采莲歇拍・采莲令","采莲煞衮・采莲令","采莲衮・采莲令","采莲衮遍・采莲令","野庵曲","金明春・金明池","金殿乐慢","金盏子令","金盏子慢・金盏子","金缕衣・贺新郎","金莲绕凤楼","金落索","金钱子","钓船归・添声杨柳枝","钓船笛・好事近","钗头凤・撷坊词","钿带长中腔","锦园春","锦堂春","锦标归","锦瑟清商引","锦缠头・浣溪沙","锦缠绊・锦缠道","锦被堆","锦香囊","锯解令","镇西・小镇西犯","镜中人・相思引","长相思慢","问歌颦・雨中花令","闻鹊喜","阑干万里心・忆王孙","阳关三叠","阳关引","阳台怨","阳台梦","阳台路","阳春","阳春曲・阳春","阳羡歌・踏莎行","陇头泉・多丽","陌上郎・生查子","陵歌","隔帘听","隔帘花","雁侵云慢","集贤宾・接贤宾","雨淋铃","雪夜渔舟","雪明鹊夜慢・雪明鹊夜","雪月交光・醉蓬莱","雪花飞","霜天晓月","霜花腴","青山远","青衫湿","青门怨","韵令","频载酒・浣溪沙","题醉袖・踏莎行","风中柳・谢池春","风中柳令・谢池春","风光好","风瀑竹","风蝶令・南歌子","飞雪满堆山・飞雪满群山","飞龙宴","饮马歌","香山会","马家春慢","马索","高山流水","鬓云松令","鬓边华","鬲溪梅令","鱼水同欢・蝶恋花","鸣梭","鸳鸯梦・临江仙","鸳鸯语・七娘子","鹊桥仙令・鹊桥仙","鹧鸪词・瑞鹧鸪","黄金缕・蝶恋花","黄钟乐","黄鹤引"];

// 二十四节气数据（公历近似日期 + 主题色）
const SOLAR_TERMS = [
  { name: "小寒", month: 1, day: 6, theme: { "--bg-color": "#f5f0e8", "--card-bg": "#fffaf5", "--accent-color": "#8a6d3b", "--seal-color": "#8a6d3b" } },
  { name: "大寒", month: 1, day: 21, theme: { "--bg-color": "#f0ebe3", "--card-bg": "#fffcf7", "--accent-color": "#6b5b4e", "--seal-color": "#6b5b4e" } },
  { name: "立春", month: 2, day: 4, theme: { "--bg-color": "#f4f9ee", "--card-bg": "#fdfff6", "--accent-color": "#4a7c3a", "--seal-color": "#4a7c3a" } },
  { name: "雨水", month: 2, day: 19, theme: { "--bg-color": "#eef4f5", "--card-bg": "#f6fffa", "--accent-color": "#3a6b6b", "--seal-color": "#3a6b6b" } },
  { name: "惊蛰", month: 3, day: 6, theme: { "--bg-color": "#f5f0f5", "--card-bg": "#fff6ff", "--accent-color": "#7a3a6b", "--seal-color": "#7a3a6b" } },
  { name: "春分", month: 3, day: 21, theme: { "--bg-color": "#f0f9f0", "--card-bg": "#f6fff6", "--accent-color": "#3a8a3a", "--seal-color": "#3a8a3a" } },
  { name: "清明", month: 4, day: 5, theme: { "--bg-color": "#f0f5f0", "--card-bg": "#f6fff0", "--accent-color": "#4a8a4a", "--seal-color": "#4a8a4a" } },
  { name: "谷雨", month: 4, day: 20, theme: { "--bg-color": "#f5f9ee", "--card-bg": "#fcfff6", "--accent-color": "#5a7a2a", "--seal-color": "#5a7a2a" } },
  { name: "立夏", month: 5, day: 6, theme: { "--bg-color": "#fff8f0", "--card-bg": "#fffdf6", "--accent-color": "#b85a2a", "--seal-color": "#b85a2a" } },
  { name: "小满", month: 5, day: 21, theme: { "--bg-color": "#fff9ee", "--card-bg": "#fffef8", "--accent-color": "#a0702a", "--seal-color": "#a0702a" } },
  { name: "芒种", month: 6, day: 6, theme: { "--bg-color": "#fff8ee", "--card-bg": "#fffdf5", "--accent-color": "#8a6a2a", "--seal-color": "#8a6a2a" } },
  { name: "夏至", month: 6, day: 21, theme: { "--bg-color": "#fff6f0", "--card-bg": "#fffcf8", "--accent-color": "#c04a2a", "--seal-color": "#c04a2a" } },
  { name: "小暑", month: 7, day: 7, theme: { "--bg-color": "#fff5ee", "--card-bg": "#fffcf5", "--accent-color": "#c0402a", "--seal-color": "#c0402a" } },
  { name: "大暑", month: 7, day: 23, theme: { "--bg-color": "#fff4ee", "--card-bg": "#fffbf5", "--accent-color": "#b8382a", "--seal-color": "#b8382a" } },
  { name: "立秋", month: 8, day: 8, theme: { "--bg-color": "#f9f5ee", "--card-bg": "#fffaf2", "--accent-color": "#8a6a2a", "--seal-color": "#8a6a2a" } },
  { name: "处暑", month: 8, day: 23, theme: { "--bg-color": "#f8f5f0", "--card-bg": "#fffaf0", "--accent-color": "#7a5a3a", "--seal-color": "#7a5a3a" } },
  { name: "白露", month: 9, day: 8, theme: { "--bg-color": "#f4f5f9", "--card-bg": "#faffff", "--accent-color": "#3a5a7a", "--seal-color": "#3a5a7a" } },
  { name: "秋分", month: 9, day: 23, theme: { "--bg-color": "#f5f0f5", "--card-bg": "#fffaff", "--accent-color": "#6a3a6a", "--seal-color": "#6a3a6a" } },
  { name: "寒露", month: 10, day: 8, theme: { "--bg-color": "#f5f0f0", "--card-bg": "#fff8f8", "--accent-color": "#8a3a4a", "--seal-color": "#8a3a4a" } },
  { name: "霜降", month: 10, day: 24, theme: { "--bg-color": "#f0f0f5", "--card-bg": "#f8f8ff", "--accent-color": "#5a4a7a", "--seal-color": "#5a4a7a" } },
  { name: "立冬", month: 11, day: 7, theme: { "--bg-color": "#f0f4f5", "--card-bg": "#f6faff", "--accent-color": "#3a5a8a", "--seal-color": "#3a5a8a" } },
  { name: "小雪", month: 11, day: 22, theme: { "--bg-color": "#eef0f5", "--card-bg": "#f5f8ff", "--accent-color": "#3a4a8a", "--seal-color": "#3a4a8a" } },
  { name: "大雪", month: 12, day: 7, theme: { "--bg-color": "#eef0f5", "--card-bg": "#f5f8ff", "--accent-color": "#2a4a8a", "--seal-color": "#2a4a8a" } },
  { name: "冬至", month: 12, day: 22, theme: { "--bg-color": "#edeef5", "--card-bg": "#f5f6ff", "--accent-color": "#3a3a8a", "--seal-color": "#3a3a8a" } }
];

// ====== 收藏：仅存本机本地缓存（等同浏览器 cookie/storage），清缓存即丢失 ======
const FAV_KEY = "shihai-favs-v1";
const NOTE_KEY = "shihai-notes-v1";
const NOTE_ASK_KEY = "shihai-note-ask";
const NOTE_RATIO_KEY = "shihai-note-ratio";
const NOTE_PROMPT_KEY = "shihai-note-prompt";
function favId(p) {
  const s = (p.t || "") + "|" + (p.a || "") + "|" + (p.c || "");
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// 均分换行：先算需要几行，再按行均分字数，断点优先落在标点之后（±2 字内）
function splitTitleLines(chars, unitW, innerW) {
  const PUNCT = "，、。！？；： ";
  const n = chars.length;
  const count = Math.max(2, Math.ceil((n * unitW) / innerW));
  const lines = [];
  let start = 0;
  for (let i = 1; i < count; i++) {
    const ideal = Math.round((n * i) / count);
    let pos = -1;
    for (let d = 0; d <= 2 && pos < 0; d++) {
      for (const p of [ideal + d, ideal - d]) {
        if (p <= start || p >= n) continue;
        if (PUNCT.includes(chars[p - 1])) { pos = p; break; }
      }
    }
    if (pos < 0) pos = Math.min(Math.max(ideal, start + 1), n - 1);
    lines.push(chars.slice(start, pos).join(""));
    start = pos;
  }
  lines.push(chars.slice(start).join(""));
  return lines;
}

const RATIO_OPTIONS = [
  { value: "1:1", label: "1:1" },
  { value: "3:4", label: "3:4" },
  { value: "9:16", label: "9:16" },
  { value: "auto", label: "自动" }
];

Page({
  data: {
    // 主题变量由 JS 计算后经 style 绑定注入（等价网页版 :root style）
    varsStyle: "",
    isVertical: false,
    themePanelOpen: false,
    colorOptions: themes.COLOR_OPTIONS.map((o) => ({ ...o, active: o.value === "warm" })),
    directionOptions: themes.DIRECTION_OPTIONS.map((o) => ({ ...o, active: o.value === "horizontal" })),

    keyword: "",
    searchMode: "auto",
    kwHint: "",
    searchProgress: "",
    kwStateText: "",
    kwStateMuted: false,
    smIdx: 0,
    sgStyleClosed: false,
    sgOptsClosed: false,
    favQuery: "",
    optPreview: true,
    optShake: false,
    optBrief: false,
    optSign: "",
    imagery: "",
    imageryCircleShow: false,
    imageryQuery: "",
    imageryCatIdx: 0,
    imageryCatList: [],
    imageryPool: [],
    imagerySel: [],
    optFontFace: "",
    solarTheme: false,
    themeDark: false,
    statsLine: "",
    onboardShow: false,
    briefQuote: "",
    briefFull: false,
    ripple: null,
    type: "",
    typeCircleShow: false,
    typeCircleQuery: "",
    typeSel: [],
    typePool: [],
    libTip: "收录 34 万余首古诗词",
    statusText: "正在加载诗词库……",
    statusError: false,
    hasPoem: false,
    poem: null,
    verseLines: [],
    sealText: "",
    inkAnim: false,
    histList: [],
    histShow: false,
    titleStyle: "",
    titleLines: [],
    metaStyle: "",
    categoryStyle: "",
    randomLoading: false,
    shareLoading: false,
    shareSheetShow: false,
    devShow: false,
    devRows: [],
    shareImg: "",
    randomBtnLines: ["与诗相逢"],
    randomTip: "读到心动的一首，可在下方生成卡片保存或分享 · 点诗词旁 ✎ 可写下感悟",
    resultsList: [],
    resultsLoading: false,
    resultsDone: false,
    resultsCount: 0,
    listMode: false,
    selMode: false,
    selIds: {},
    selCount: 0,
    currentFav: false,
    favSheetShow: false,
    favBurst: false,
    guideShow: false,
    favList: [],
    favSelMode: false,
    currentNote: false,
    noteSheetShow: false,
    noteListData: [],
    noteSelMode: false,
    noteSelIds: {},
    noteSelCount: 0,
    noteEditShow: false,
    noteEditTitle: "写批注",
    noteEditMeta: "",
    noteEditHas: false,
    noteText: "",
    noteRatio: "3:4",
    noteRatioIndex: 1,
    noteRatioOptions: [
      { value: "1:1", label: "1:1", active: false },
      { value: "3:4", label: "3:4", active: true },
      { value: "9:16", label: "9:16", active: false },
      { value: "auto", label: "自动", active: false }
    ],
    noteAskShow: false,
    noteAskRemember: false,
    noteRatioShow: false,
    noteRatioAuto: false,
    notePromptOn: true,
    favSelIds: {},
    favSelCount: 0,
    shareBtnLines: ["下载或分享卡片"],
    mottoChars: "掬古人之诗·养今时之心".split(""),
    ratioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === "1:1", disabled: false })),
    ratioActiveIndex: 0,
    shareRatio: "1:1",
    progressState: "", // "" | run | done
    splashShow: true,
    disclaimerShow: false,
    uiReady: false,
    gearSpin: false
  },

  currentPoem: null,
  currentTheme: null,
  prevHorzTheme: null,
  indexReady: false,

  onLoad(options) {
    // 分享深链参数（好友/朋友圈进入时携带）：标题 + 作者 + 朝代
    try {
      if (options && options.pt) {
        this._shareTarget = {
          t: decodeURIComponent(options.pt),
          a: options.pa ? decodeURIComponent(options.pa) : "",
          d: options.pd ? decodeURIComponent(options.pd) : ""
        };
      }
    } catch (e) {}
    this.currentTheme = themes.loadTheme();
    this.applyTheme();
    // 首次使用提示：确认过则照常开屏；首次只展示提示抽屉，同意后直进主页（不再播开屏动画）
    let agreed = "";
    try { agreed = wx.getStorageSync("shihai-disclaimer-v1"); } catch (e) {}
    if (!agreed) {
      this.setData({ disclaimerShow: true, splashShow: false, uiReady: true });
    } else {
      this.startSplash();
    }
    this.loadFavs();
    this.loadNotes();
    try { this._history = wx.getStorageSync("shihai-history-v1") || []; } catch (e) { this._history = []; }
    const h = new Date().getHours();
    const greet = h >= 5 && h < 8 ? "晨读" : h < 12 ? "上午品读" : h < 14 ? "午间小读" : h < 18 ? "午后漫读" : h < 23 ? "灯下夜读" : "深夜静读";
    this.setData({ randomTip: greet + " · " + this.data.randomTip });
    try { let sm0 = wx.getStorageSync("shihai-search-mode-v1"); if (sm0 === "auto") { sm0 = "title"; try { wx.setStorageSync("shihai-search-mode-v1", "title"); } catch (e2) {} } if (sm0 === "author" || sm0 === "dynasty" || sm0 === "title") this.setData({ searchMode: sm0, smIdx: ["author", "dynasty", "title"].indexOf(sm0) }); } catch (e) {}
    try { const tl = wx.getStorageSync("shihai-type-list-v1"); if (Array.isArray(tl) && tl.length) { this._typesArr = tl; this.setData({ type: tl.length === 1 ? tl[0] : tl[0] + " · 等" + tl.length + "种" }); } } catch (e) {}
    try { const il = wx.getStorageSync("shihai-imagery-list-v1"); if (Array.isArray(il) && il.length) { this._imageryArr = il; this.setData({ imagery: il.length === 1 ? il[0] : il[0] + " · 等" + il.length + "种" }); } } catch (e) {}
    // 精致化选项（主题小预览 / 摇一摇抽诗 / 名句速览 / 分享签名）
    this._opts = { preview: true, shake: false, brief: false, sign: "", fontFace: "", solarTheme: false };
    try { const o0 = wx.getStorageSync("shihai-opts-v1"); if (o0) this._opts = { ...this._opts, ...o0 }; } catch (e) {}
    this.setData({ optPreview: !!this._opts.preview, optShake: !!this._opts.shake, optBrief: !!this._opts.brief, optSign: this._opts.sign || "", optFontFace: this._opts.fontFace || "", solarTheme: !!this._opts.solarTheme });
    this._applyFontFace(this._opts.fontFace || "");
    this._applySolarTheme();
    if (this._opts.shake) this._startShake();
    // 预热搜索摘要索引，首次标题检索更快
    data.ensureSearchIndex();
    this._stats = { total: 0, dates: [], streak: 0, last: "" };
    try { const st0 = wx.getStorageSync("shihai-stats-v1"); if (st0 && typeof st0.total === "number") this._stats = st0; } catch (e) {}
    // 访问统计：先读本地缓存快速展示，再订阅云端更新
    try { this._visitCount = wx.getStorageSync("shihai-visit-count") || 0; } catch (e) { this._visitCount = 0; }
    const app = getApp();
    if (app && typeof app.onVisitUpdate === "function") {
      this._unsubVisit = app.onVisitUpdate((cnt) => {
        this._visitCount = cnt || 0;
        if (this.data.guideShow) this._refreshStatsLine();
      });
    }
    const term0 = this._solarTermToday();
    if (term0) this.setData({ libTip: this.data.libTip + " · 今日" + term0 });
    this.setData({ colorOptions: this.data.colorOptions.map((o) => ({ ...o, dot: themes.THEMES.color[o.value].vars["--bg-color"] })) });
    this.boot();
    this.fitBtnLabels();
  },

  onResize() {
    this.fitBtnLabels();
  },

  // 按钮标签自适应换行：太窄时拆行，硬性保证每行不少于两个字
  fitBtnLabels() {
    const winW = wx.getSystemInfoSync().windowWidth;
    this._winH = wx.getSystemInfoSync().windowHeight;
    const scale = winW / 375; // 32rpx 字号 → 16*scale px
    // 按钮内文字可用宽 = 屏宽 - 页面左右16px*2 - 控件区36rpx + btn-row外扩16rpx - 按钮自身左右padding 32rpx*2
    const avail = winW - 32 - 36 * scale + 16 * scale - 32 * scale;
    const fontPx = 16 * scale;
    this.setData({
      randomBtnLines: this._splitBtnLabel("与诗相逢", avail, fontPx),
      shareBtnLines: this._splitBtnLabel("下载或分享卡片", avail, fontPx)
    });
  },

  _splitBtnLabel(text, availW, fontPx) {
    if (text.length * fontPx <= availW) return [text];
    const n = text.length;
    for (let k = 2; k <= Math.floor(n / 2); k++) {
      const per = Math.ceil(n / k);
      if (per * fontPx <= availW) {
        const lines = [];
        for (let i = 0; i < n; i += per) lines.push(text.slice(i, i + per));
        return lines;
      }
    }
    return [text];
  },

  onDismissDisclaimer() {
    this.haptic();
    try { wx.setStorageSync("shihai-disclaimer-v1", "1"); } catch (e) {}
    clearTimeout(this.splashTimer);
    this.setData({ uiReady: true });
    this.hideSheet("disclaimerShow");
    this.hideSheet("splashShow");
    this._maybeOnboard();
  },

  // ====== 开屏动画（与网页版一致：3.2s 自动消失，点击可跳过） ======
  startSplash() {
    const hide = () => {
      if (!this.data.splashShow) return;
      this.setData({ uiReady: true });
    this.hideSheet("splashShow");
      this._maybeOnboard();
    };
    this.splashTimer = setTimeout(hide, 3200);
  },
  onTapSplash() {
    this.haptic();
    clearTimeout(this.splashTimer);
    this.setData({ uiReady: true });
    this.hideSheet("splashShow");
  },

  // ====== 顶部进度条 ======
  progressStart() {
    this.setData({ progressState: "" });
    setTimeout(() => this.setData({ progressState: "run" }), 30);
  },
  progressDone() {
    this.setData({ progressState: "done" });
    setTimeout(() => this.setData({ progressState: "" }), 800);
  },

  // ====== 启动：加载索引 → 自动抽一首（与网页版一致） ======
  async boot() {
    try {
      const index = await data.loadIndex();
      this.indexReady = true;
      const total = (index && index.total) || 0;
      if (total) {
        this.setData({
          libTip: "收录 " + Math.floor(total / 10000) + " 万余首古诗词"
        });
      }
      this.setData({
        statusText: "收录 " + total.toLocaleString("zh-CN") + " 首诗词，点击下方按钮随机抽取",
        statusError: false
      });
      let shared = false;
      if (this._shareTarget) shared = await this.applyShareTarget();
      if (!shared) await this.loadRandomPoem(false);
    } catch (err) {
      this.showStatus("诗词库加载失败：" + (err && err.message ? err.message : err), true);
    }
  },

  showStatus(message, isError) {
    if (isError) {
      this.setData({ statusText: message, statusError: true, hasPoem: false, poem: null, verseLines: [] });
      this.currentPoem = null;
    } else {
      this.setData({ statusText: message, statusError: false });
    }
  },

  // 分享深链：按分享携带的 标题/作者/朝代 定位并直接展示该诗；失败返回 false 走随机推荐兜底
  async applyShareTarget() {
    const q = this._shareTarget;
    if (!q || !q.t) return false;
    try {
      const poem = await data.findPoemByMeta(q.t, q.a, q.d);
      if (!poem) return false;
      this.renderPoem(poem);
      setTimeout(() => wx.pageScrollTo({ selector: ".card", duration: 300 }), 80);
      return true;
    } catch (e) {
      return false;
    }
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
    clearTimeout(this._kwHintTimer);
    this._kwHintTimer = setTimeout(() => this.updateKwHint(), 250);
  },
  onSearchModeTap(e) {
    const m = e.currentTarget.dataset.mode;
    if (!m || m === this.data.searchMode) return;
    this.haptic();
    this.setData({ searchMode: m, smIdx: ["author", "dynasty", "title"].indexOf(m) });
    try { wx.setStorageSync("shihai-search-mode-v1", m); } catch (err) {}
    this.updateKwHint();
  },
  _detectKw(kw) {
    if (this._authorSet && this._authorSet.has(kw)) return "author";
    if (this._dynastySet && this._dynastySet.has(kw)) return "dynasty";
    return "title";
  },
  _buildKnownSets(full) {
    if (!full || !Array.isArray(full.chunks)) return;
    this._authorSet = new Set(); this._dynastySet = new Set();
    full.chunks.forEach((c) => {
      (c.authors || []).forEach((a) => { const x = (a || "").trim(); if (x) this._authorSet.add(x); });
      (c.dynasties || []).forEach((d) => { const x = (d || "").trim(); if (x) this._dynastySet.add(x); });
    });
  },
  _effModeFor(kw) {
    return this.data.searchMode;
  },
  updateKwHint() {
    const kw = (this.data.keyword || "").trim();
    if (!kw) { this.setData({ kwStateText: "", kwStateMuted: false }); return; }
    const m = this.data.searchMode;
    this.setData({ kwStateText: m === "author" ? "按作者检索" : m === "dynasty" ? "按朝代检索" : "按标题检索", kwStateMuted: false });
  },
  onTypeInput(e) { this._typesArr = []; this.setData({ type: e.detail.value }); },

  onRandomTap() {
    this.haptic();
    const kw = (this.data.keyword || "").trim();
    const hasTypeArr = Array.isArray(this._typesArr) && this._typesArr.length > 0;
    const hasImageryArr = Array.isArray(this._imageryArr) && this._imageryArr.length > 0;
    const typeDisplay = (this.data.type || "").trim();
    // 用真实的多选数组判断是否选了体裁；显示字符串仅供兜底
    const effTypeStr = typeDisplay && typeDisplay.indexOf(" · 等") < 0 && typeDisplay.indexOf("体裁：") < 0 ? typeDisplay : "";
    // 填了搜索词 或 选了体裁 → 重新搜索（重置列表状态）；未填 → 随机一首（恢复卡片）
    if (kw || hasTypeArr || effTypeStr || hasImageryArr) {
      this.openResults(kw, effTypeStr);
      return;
    }
    this.setData({ listMode: false });
    this.loadRandomPoem(true);
  },

  // ====== 体裁选择器入口 ======
  onTypeMoreTap() {
    this.haptic();
    this.openTypeCircle();
  },
  // ====== 双半圆滚动多选体裁选择器 ======
  openTypeCircle() {
    this._typesArr = this._typesArr || [];
    this.setData({ typeCircleShow: true, typeCircleQuery: "", typeSel: this._typesArr.slice() });
    this._rebuildTypePool();
  },
  _rebuildTypePool() {
    const q = (this.data.typeCircleQuery || "").trim();
    const sel = new Set(this.data.typeSel || []);
    let pool = TYPE_LIST_ALL.filter((t) => !sel.has(t));
    if (q) pool = pool.filter((t) => t.indexOf(q) >= 0);
    this.setData({ typePool: pool.slice(0, 400) });
  },
  onTypeCircleQuery(e) {
    this.setData({ typeCircleQuery: e.detail.value });
    this._rebuildTypePool();
  },
  onTypeCirclePick(e) {
    const t = e.currentTarget.dataset.value;
    this.haptic();
    this.setData({ typeSel: (this.data.typeSel || []).concat([t]) });
    this._rebuildTypePool();
  },
  onTypeCircleUnpick(e) {
    const t = e.currentTarget.dataset.value;
    this.haptic();
    this.setData({ typeSel: (this.data.typeSel || []).filter((x) => x !== t) });
    this._rebuildTypePool();
  },
  onTypeCircleClear() {
    this.haptic();
    this.setData({ typeSel: [] });
    this._rebuildTypePool();
  },
  onTypeCircleConfirm() {
    this.haptic();
    const sel = this.data.typeSel || [];
    this._typesArr = sel.slice();
    try { wx.setStorageSync("shihai-type-list-v1", sel); } catch (e2) {}
    this.setData({ type: sel.length === 0 ? "" : (sel.length === 1 ? sel[0] : sel[0] + " · 等" + sel.length + "种") });
    this.hideSheet("typeCircleShow");
  },
  // 滚动时节流触发震动反馈（每 120ms 一次，避免连击过频）
  onTypeCircleScroll() {
    const now = Date.now();
    if (now - (this._tcScrollHapticAt || 0) < 120) return;
    this._tcScrollHapticAt = now;
    this.haptic();
  },
  onTypeCircleClose() {
    this.hideSheet("typeCircleShow");
  },
  // ====== 意象选择器入口 ======
  async onImageryMoreTap() {
    this.haptic();
    await this.openImageryCircle();
  },
  // ====== 意象多选面板（左分类 + 右意象 + 已选区） ======
  async openImageryCircle() {
    this._imageryArr = this._imageryArr || [];
    // 首次打开时加载意象索引
    if (!this._imageryIdx) {
      this._imageryIdx = await data.ensureImageryIndex();
    }
    const cats = (this._imageryIdx && this._imageryIdx.categories) || [];
    this.setData({
      imageryCircleShow: true,
      imageryQuery: "",
      imageryCatIdx: 0,
      imageryCatList: cats.map((c) => c.name),
      imagerySel: this._imageryArr.slice()
    });
    this._rebuildImageryPool();
  },
  _rebuildImageryPool() {
    if (!this._imageryIdx || !this._imageryIdx.categories) return;
    const q = (this.data.imageryQuery || "").trim();
    const sel = new Set(this.data.imagerySel || []);
    const catIdx = this.data.imageryCatIdx || 0;
    const cat = this._imageryIdx.categories[catIdx];
    if (!cat) return;
    let pool = cat.items.filter((t) => !sel.has(t));
    if (q) {
      // 搜索模式：跨所有分类搜索
      pool = [];
      this._imageryIdx.categories.forEach((c) => {
        c.items.forEach((img) => {
          if (img.indexOf(q) >= 0 && !sel.has(img)) pool.push(img);
        });
      });
    }
    this.setData({ imageryPool: pool });
  },
  onImageryCatTap(e) {
    this.haptic();
    const idx = parseInt(e.currentTarget.dataset.idx, 10);
    this.setData({ imageryCatIdx: idx });
    this._rebuildImageryPool();
  },
  onImageryQuery(e) {
    this.setData({ imageryQuery: e.detail.value });
    this._rebuildImageryPool();
  },
  onImageryPick(e) {
    const t = e.currentTarget.dataset.value;
    this.haptic();
    this.setData({ imagerySel: (this.data.imagerySel || []).concat([t]) });
    this._rebuildImageryPool();
  },
  onImageryUnpick(e) {
    const t = e.currentTarget.dataset.value;
    this.haptic();
    this.setData({ imagerySel: (this.data.imagerySel || []).filter((x) => x !== t) });
    this._rebuildImageryPool();
  },
  onImageryClear() {
    this.haptic();
    this.setData({ imagerySel: [] });
    this._rebuildImageryPool();
  },
  onImageryConfirm() {
    this.haptic();
    const sel = this.data.imagerySel || [];
    this._imageryArr = sel.slice();
    try { wx.setStorageSync("shihai-imagery-list-v1", sel); } catch (e2) {}
    this.setData({ imagery: sel.length === 0 ? "" : (sel.length === 1 ? sel[0] : sel[0] + " · 等" + sel.length + "种") });
    this.hideSheet("imageryCircleShow");
  },
  onImageryScroll() {
    const now = Date.now();
    if (now - (this._icScrollHapticAt || 0) < 120) return;
    this._icScrollHapticAt = now;
    this.haptic();
  },
  onImageryClose() {
    this.hideSheet("imageryCircleShow");
  },
  // 设置面板分组折叠
  onSgStyleToggle() { this.haptic(); this.setData({ sgStyleClosed: !this.data.sgStyleClosed }); },
  onSgOptsToggle() { this.haptic(); this.setData({ sgOptsClosed: !this.data.sgOptsClosed }); },

  // ====== 收藏（本地缓存） ======
  loadFavs() {
    let list = [];
    try { list = wx.getStorageSync(FAV_KEY) || []; } catch (e) {}
    this._favs = Array.isArray(list) ? list : [];
    this._favSet = new Set(this._favs.map((p) => p.id));
  },
  saveFavs() {
    try { wx.setStorageSync(FAV_KEY, this._favs); } catch (e) {}
  },
  addFavs(poems) {
    let added = 0;
    poems.forEach((p) => {
      const id = p.id || favId(p);
      if (this._favSet.has(id)) return;
      this._favSet.add(id);
      this._favs.unshift({ id, t: p.t || "", a: p.a || "", d: p.d || "", y: p.y || "", c: p.c || "" });
      added++;
    });
    if (added) this.saveFavs();
    return added;
  },
  removeFav(id) {
    this._favSet.delete(id);
    this._favs = this._favs.filter((p) => p.id !== id);
    this.saveFavs();
  },
  toggleFav(poem) {
    const id = poem.id || favId(poem);
    if (this._favSet.has(id)) {
      this.removeFav(id);
      wx.showToast({ title: "已取消收藏", icon: "none" });
      return false;
    }
    this.addFavs([{ ...poem, id }]);
    wx.showToast({ title: "已收藏", icon: "none" });
    return true;
  },
  // 收藏状态变化后同步列表中所有小爱心
  _syncResultsFav() {
    const updates = {};
    this.data.resultsList.forEach((it, i) => {
      const f = this._favSet.has(it.id);
      if (f !== it.fav) updates["resultsList[" + i + "].fav"] = f;
    });
    if (Object.keys(updates).length) this.setData(updates);
  },
  // ====== 批注：纸笔图标写感悟，存本机本地缓存；批注本支持批量管理；批注卡片（批注大、诗词小） ======
  loadNotes() {
    let list = [];
    try { list = wx.getStorageSync(NOTE_KEY) || []; } catch (e) {}
    this._notes = Array.isArray(list) ? list : [];
    this._noteMap = new Map(this._notes.map((n) => [n.id, n]));
    try { this._noteAskMode = wx.getStorageSync(NOTE_ASK_KEY) || ""; } catch (e) { this._noteAskMode = ""; }
    try { this._noteRatio = wx.getStorageSync(NOTE_RATIO_KEY) || "3:4"; } catch (e) { this._noteRatio = "3:4"; }
    try { this._notePromptOn = wx.getStorageSync(NOTE_PROMPT_KEY) !== "0"; } catch (e) { this._notePromptOn = true; }
    this.setData({ notePromptOn: this._notePromptOn });
  },
  onNotePromptTap(e) {
    this.haptic();
    const on = e.currentTarget.dataset.value === "on";
    this._notePromptOn = on;
    try { wx.setStorageSync(NOTE_PROMPT_KEY, on ? "1" : "0"); } catch (err) {}
    this.setData({ notePromptOn: on });
  },
  saveNotes() {
    try { wx.setStorageSync(NOTE_KEY, this._notes); } catch (e) {}
  },
  _noteDate(ts) {
    const dt = new Date(ts || Date.now());
    return dt.getFullYear() + "/" + (dt.getMonth() + 1) + "/" + dt.getDate();
  },
  _syncResultsNote() {
    const updates = {};
    this.data.resultsList.forEach((it, i) => {
      const h = this._noteMap.has(it.id);
      if (h !== it.hasNote) updates["resultsList[" + i + "].hasNote"] = h;
    });
    if (Object.keys(updates).length) this.setData(updates);
  },
  openNoteEditor(poem) {
    this._noteEditPoem = poem;
    const id = poem.id || favId(poem);
    const ex = this._noteMap.get(id);
    const r = this._noteRatio;
    this.setData({
      noteEditShow: true,
      noteEditTitle: ex ? "编辑批注" : "写批注",
      noteEditMeta: "《" + (poem.t || "无题") + "》" + [poem.d, poem.a].filter(Boolean).join(" · "),
      noteEditHas: !!ex,
      noteText: ex ? ex.n : "",
      noteRatio: r,
      noteRatioIndex: RATIO_OPTIONS.findIndex((o) => o.value === r),
      noteRatioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === r })),
      themePanelOpen: false
    });
  },
  onCardNoteTap() {
    if (!this.currentPoem) return;
    this.haptic();
    this.openNoteEditor(this.currentPoem);
  },
  onResultNoteTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    this.openNoteEditor(item);
  },
  onNoteInput(e) { this.setData({ noteText: e.detail.value }); },
  onNoteRatioTap(e) {
    this.haptic();
    const value = e.currentTarget.dataset.value;
    this._noteRatio = value;
    try { wx.setStorageSync(NOTE_RATIO_KEY, value); } catch (err) {}
    this.setData({
      noteRatio: value,
      noteRatioIndex: RATIO_OPTIONS.findIndex((o) => o.value === value),
      noteRatioOptions: this.data.noteRatioOptions.map((o) => ({ ...o, active: o.value === value }))
    });
  },
  onNoteEditClose() { this.hideSheet("noteEditShow"); },
  onNoteRemove() {
    const poem = this._noteEditPoem;
    if (!poem) return;
    this.haptic();
    const id = poem.id || favId(poem);
    this._notes = this._notes.filter((n) => n.id !== id);
    this._noteMap.delete(id);
    this.saveNotes();
    this.hideSheet("noteEditShow");
    if (this.currentPoem && (this.currentPoem.id || favId(this.currentPoem)) === id) this.setData({ currentNote: false });
    this._syncResultsNote();
    wx.showToast({ title: "批注已删除", icon: "none" });
  },
  onNoteSave() {
    const poem = this._noteEditPoem;
    if (!poem) return;
    const text = (this.data.noteText || "").trim();
    if (!text) { wx.showToast({ title: "批注内容不能为空", icon: "none" }); return; }
    this.haptic();
    const id = poem.id || favId(poem);
    const ex = this._noteMap.get(id);
    if (ex) { ex.n = text; ex.ts = Date.now(); }
    else {
      const rec = { id, t: poem.t || "", a: poem.a || "", d: poem.d || "", y: poem.y || "", c: poem.c || "", n: text, ts: Date.now() };
      this._notes.unshift(rec);
      this._noteMap.set(id, rec);
    }
    this.saveNotes();
    this.hideSheet("noteEditShow");
    if (this.currentPoem && (this.currentPoem.id || favId(this.currentPoem)) === id) this.setData({ currentNote: true });
    this._syncResultsNote();
    // 提醒总开关关闭：只保存并告知查看位置
    if (!this._notePromptOn) { wx.showToast({ title: "批注已保存 · 右上角批注本可查看", icon: "none", duration: 2200 }); return; }
    // 「不再询问」记忆：yes=保存后直接生成卡片，no=只保存
    if (this._noteAskMode === "yes") { this.openNoteRatioSheet(id, true); return; }
    if (this._noteAskMode === "no") { wx.showToast({ title: "批注已保存 · 右上角批注本可查看", icon: "none", duration: 2200 }); return; }
    this._noteAskId = id;
    this.setData({ noteAskShow: true, noteAskRemember: false });
  },
  onNoteAskRememberToggle() { this.haptic(); this.setData({ noteAskRemember: !this.data.noteAskRemember }); },
  _noteAskFinish(action) {
    if (this.data.noteAskRemember) {
      this._noteAskMode = action;
      try { wx.setStorageSync(NOTE_ASK_KEY, action); } catch (e) {}
    }
    const id = this._noteAskId;
    this.hideSheet("noteAskShow");
    if (action === "yes") this.openNoteRatioSheet(id);
    else wx.showToast({ title: "批注已保存 · 右上角批注本可查看", icon: "none", duration: 2200 });
  },
  onNoteAskYes() { this.haptic(); this._noteAskFinish("yes"); },
  onNoteAskNo() { this.haptic(); this._noteAskFinish("no"); },
  onNoteToggle() {
    this.haptic();
    if (this.data.noteSheetShow) { this.hideSheet("noteSheetShow"); return; }
    this.openNoteSheet();
  },
  openNoteSheet() {
    this.setData({
      noteSheetShow: true,
      noteListData: this._notes.map((n) => ({ ...n, date: this._noteDate(n.ts) })),
      noteSelMode: false, noteSelIds: {}, noteSelCount: 0,
      themePanelOpen: false
    });
  },
  onNoteSheetClose() { this.hideSheet("noteSheetShow"); },
  onNoteItemTap(e) {
    if (this.data.noteSelMode) { this.onNoteSelToggle(e); return; }
    const idx = e.currentTarget.dataset.index;
    const rec = this._notes[idx];
    if (!rec) return;
    this.haptic();
    this.hideSheet("noteSheetShow");
    this.openNoteEditor(rec);
  },
  onNoteItemCard(e) {
    const idx = e.currentTarget.dataset.index;
    const rec = this._notes[idx];
    if (!rec) return;
    this.haptic();
    this.hideSheet("noteSheetShow");
    this.openNoteRatioSheet(rec.id);
  },
  // 生成批注卡片前选择比例（编辑器内不再选比例）
  openNoteRatioSheet(id, auto) {
    this._noteRatioId = id;
    const r = this._noteRatio;
    this.setData({
      noteRatioShow: true,
      noteRatioAuto: !!auto,
      noteRatioIndex: RATIO_OPTIONS.findIndex((o) => o.value === r),
      noteRatioOptions: RATIO_OPTIONS.map((o) => ({ ...o, active: o.value === r }))
    });
  },
  onNoteRatioClose() { this.hideSheet("noteRatioShow"); },
  onNoteRatioConfirm() {
    this.haptic();
    const id = this._noteRatioId;
    this.hideSheet("noteRatioShow");
    this.generateNoteShare(id);
  },
  onNoteManage() {
    this.haptic();
    if (this.data.noteSelMode) { this.setData({ noteSelMode: false, noteSelIds: {}, noteSelCount: 0 }); return; }
    this.setData({ noteSelMode: true, noteSelIds: {}, noteSelCount: 0 });
  },
  onNoteSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.noteListData[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.noteSelIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ noteSelIds: selIds, noteSelCount: Object.keys(selIds).length });
  },
  onNoteSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.noteSelCount >= this.data.noteListData.length && this.data.noteListData.length)) {
      this.data.noteListData.forEach((n) => { selIds[n.id] = true; });
    }
    this.setData({ noteSelIds: selIds, noteSelCount: Object.keys(selIds).length });
  },
  onNoteDelete() {
    this.haptic();
    const ids = this.data.noteSelIds;
    const targets = this._notes.filter((n) => ids[n.id]);
    if (!targets.length) return;
    wx.showModal({
      title: "删除批注",
      content: "确定删除选中的 " + targets.length + " 条批注？",
      success: (r) => {
        if (!r.confirm) return;
        targets.forEach((n) => this._noteMap.delete(n.id));
        this._notes = this._notes.filter((n) => !ids[n.id]);
        this.saveNotes();
        this._syncResultsNote();
        if (this.currentPoem && !this._noteMap.has(this.currentPoem.id || favId(this.currentPoem))) this.setData({ currentNote: false });
        this.openNoteSheet();
        wx.showToast({ title: "已删除", icon: "none" });
      }
    });
  },
  // 批注卡片生成：复用分享画布与预览/保存浮层
  async generateNoteShare(id) {
    const note = this._noteMap.get(id);
    if (!note) return;
    if (this.data.shareLoading) return;
    this.setData({ shareLoading: true });
    try {
      const t = this.currentTheme;
      const colors = themes.THEMES.color[t.color].vars;
      let rect = this._cardRect;
      if (!rect) {
        rect = await new Promise((resolve) => {
          wx.createSelectorQuery().select(".card-body").boundingClientRect().exec((r) => resolve(r && r[0]));
        });
      }
      const filePath = await new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .select("#shareCanvas")
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0] || !res[0].node) return reject(new Error("画布初始化失败"));
            const canvas = res[0].node;
            const ctx = canvas.getContext("2d");
            try {
              await drawNoteShare({
                canvas, ctx, note,
                ratio: this._noteRatio,
                cardW: rect ? rect.width : 300,
                cardH: rect ? rect.height : 300,
                colors: {
                  bg: colors["--bg-color"], text: colors["--text-color"],
                  meta: colors["--meta-color"], accent: colors["--accent-color"],
                  category: colors["--category-color"], seal: colors["--seal-color"]
                },
                logoPath: "/assets/logo-yin.png"
              });
            } catch (e) {
              return reject(e);
            }
            const out = wx.env.USER_DATA_PATH + "/shihai_note_" + String(this._noteRatio).replace(":", "x") + "_" + Date.now() + ".png";
            wx.canvasToTempFilePath({
              canvas,
              fileType: "png",
              destWidth: canvas.width,
              destHeight: canvas.height,
              filePath: out,
              success: (r) => resolve(r.tempFilePath),
              fail: (e) => reject(new Error("导出图片失败：" + (e.errMsg || "")))
            });
          });
      });
      this._sharePath = filePath;
      this.setData({ shareImg: filePath, shareSheetShow: true });
    } catch (e) {
      this.showStatus("生成批注卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  onCardFavTap() {
    if (!this.currentPoem) return;
    this.haptic();
    const fav = this.toggleFav(this.currentPoem);
    this.setData({ currentFav: fav });
    if (fav) {
      this.setData({ favBurst: true });
      clearTimeout(this._burstT);
      this._burstT = setTimeout(() => this.setData({ favBurst: false }), 650);
    }
  },
  onResultFavTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    const fav = this.toggleFav(item);
    this.setData({ ["resultsList[" + idx + "].fav"]: fav });
    if (fav) {
      this.setData({ ["resultsList[" + idx + "].burst"]: true });
      clearTimeout(this._burstT2);
      this._burstT2 = setTimeout(() => this.setData({ ["resultsList[" + idx + "].burst"]: false }), 650);
    }
    if (this.currentPoem && this.currentPoem.id === item.id) this.setData({ currentFav: fav });
  },
  onGuideOpen() {
    this.haptic();
    this.setData({ guideShow: true });
    this._refreshStatsLine();
  },
  _refreshStatsLine() {
    const st = this._stats || { total: 0, dates: [], streak: 0 };
    const vc = this._visitCount || 0;
    const vcStr = vc > 0 ? " · 全站到访 " + vc.toLocaleString() + " 次" : "";
    this.setData({
      statsLine: "已读 " + st.total + " 首 · 到访 " + (st.dates ? st.dates.length : 0) + " 天 · 连续 " + (st.streak || 0) + " 天" + vcStr
    });
  },
  onGuideClose() {
    this.haptic();
    this.hideSheet("guideShow");
  },

  // ====== 收藏夹面板（设置图标旁入口；批量管理/删除） ======
  onFavToggle() {
    this.haptic();
    if (this.data.favSheetShow) { this.hideSheet("favSheetShow"); return; }
    this.openFavSheet();
  },
  _filterFavs(q) {
    const list = this._favs.map((p) => ({ ...p }));
    if (!q) return list;
    return list.filter((p) => ((p.t || "") + (p.a || "") + (p.d || "")).indexOf(q) >= 0);
  },
  onFavQuery(e) {
    const q = (e.detail.value || "").trim();
    this.setData({ favQuery: q, favList: this._filterFavs(q) });
  },
  openFavSheet() {
    this.setData({
      favSheetShow: true,
      favList: this._filterFavs(this.data.favQuery),
      favSelMode: false, favSelIds: {}, favSelCount: 0,
      themePanelOpen: false
    });
  },
  onFavSheetClose() { this.hideSheet("favSheetShow"); },
  onFavItemTap(e) {
    if (this.data.favSelMode) { this.onFavSelToggle(e); return; }
    const idx = e.currentTarget.dataset.index;
    const item = this.data.favList[idx];
    const poem = item ? this._favs.find((p) => p.id === item.id) : null;
    if (!poem) return;
    this.haptic();
    this.setData({ listMode: false });
    this.hideSheet("favSheetShow");
    poem.id = poem.id || favId(poem);
    this.renderPoem(poem);
    setTimeout(() => wx.pageScrollTo({ selector: ".card", duration: 300 }), 80);
  },
  onFavManage() {
    this.haptic();
    if (this.data.favSelMode) { this.setData({ favSelMode: false, favSelIds: {}, favSelCount: 0 }); return; }
    this.setData({ favSelMode: true, favSelIds: {}, favSelCount: 0 });
  },
  onFavSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.favList[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.favSelIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ favSelIds: selIds, favSelCount: Object.keys(selIds).length });
  },
  onFavSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.favSelCount >= this.data.favList.length && this.data.favList.length)) {
      this.data.favList.forEach((p) => { selIds[p.id] = true; });
    }
    this.setData({ favSelIds: selIds, favSelCount: Object.keys(selIds).length });
  },
  onFavDelete() {
    this.haptic();
    const ids = this.data.favSelIds;
    const targets = this._favs.filter((p) => ids[p.id]);
    if (!targets.length) return;
    wx.showModal({
      title: "删除收藏",
      content: "确定删除选中的 " + targets.length + " 首收藏诗词？",
      success: (r) => {
        if (!r.confirm) return;
        targets.forEach((p) => this.removeFav(p.id));
        this._syncResultsFav();
        if (this.currentPoem && !this._favSet.has(favId(this.currentPoem))) this.setData({ currentFav: false });
        this.setData({
          favList: this._filterFavs(this.data.favQuery),
          favSelIds: {}, favSelCount: 0
        });
        wx.showToast({ title: "已删除", icon: "success" });
      }
    });
  },

  // ====== 搜索结果列表：就地替换诗词卡片；无限分页（页面触底）；手风琴；批量收藏 ======
  async openResults(kw, type) {
    // 意象筛选：优先用多选数组 _imageryArr
    const effImagery = (this._imageryArr && this._imageryArr.length) ? this._imageryArr : null;
    // 优先用多选数组 _typesArr；如果 type 是「xxx · 等N种」格式但 _typesArr 为空，说明是之前的旧值，需要忽略
    let effType = null;
    if (this._typesArr && this._typesArr.length) {
      effType = this._typesArr;
    } else if (type && type.indexOf(" · 等") < 0 && type.indexOf("体裁：") < 0) {
      // 单选且是纯体裁名称（没有复合文字）
      effType = type;
    }
    if (!this.indexReady) { this.showStatus("诗词库尚未加载完成，请稍候……"); return; }
    if (effType) {
      const full = await data.ensureFullIndex();
      if (!full) { this.showStatus("筛选数据加载失败，请检查网络后重试", true); return; }
      if (!this._authorSet) this._buildKnownSets(full);
    } else if (kw && this.data.searchMode === "author") {
      const full = await data.ensureFullIndex(); // 失败不阻断：退化为全库流式扫描
      if (full && !this._authorSet) this._buildKnownSets(full);
    }
    if (effImagery) {
      await data.ensureImageryIndex();
    }
    const base = await data.loadIndex();
    const mode = this.data.searchMode;
    // 优先用全索引分块（含 authors），作者/朝代收窄才能生效
    const baseChunks = data.getFullChunks() || base.chunks;
    let candidates = effType ? data.filterChunks("", "", effType) : baseChunks.slice();
    if (effImagery) candidates = data.filterByImagery(candidates, effImagery);
    if (kw) {
      candidates = data.sortChunksByKw(candidates, kw, mode);
      // 朝代检索：只扫描含该朝代的数据块（精简索引即含 dynasties，可靠）
      if (mode === "dynasty") candidates = candidates.filter((c) => data.chunkKwScore(c, kw, mode) > 0);
      // 作者检索：仅在拿到全索引 authors 时收窄；收窄为空则退回全量流式扫描，避免误报无结果
      if (mode === "author") {
        const fc = data.getFullChunks();
        if (fc) {
          const n = candidates.filter((c) => data.chunkHasAuthor(c.file, kw));
          if (n.length) candidates = n;
        }
      }
      if (mode === "title") { await data.ensureSearchIndex(); candidates = data.narrowByDigest(candidates, kw); }
    }
    if (!candidates.length) { this.showStatus("未找到匹配条件的诗词", true); return; }
    this._resultChunks = candidates;
    this._resultCursor = 0;
    this._pendingItems = [];
    this._resultFilter = { kw, type: effType, imagery: effImagery, mode };
    this._resultsBusy = false;
    this._openIdx = null;
    this._seenIds = this._seenIds || new Set();
    this.setData({
      listMode: true, resultsList: [], resultsDone: false, resultsCount: 0,
      selMode: false, selIds: {}, selCount: 0,
      searchProgress: "正在检索：0 / " + candidates.length + " 个数据块 · 已命中 0 首"
    });
    setTimeout(() => wx.pageScrollTo({ selector: ".results-panel", duration: 300 }), 80);
    this.loadMoreResults();
  },
  async loadMoreResults() {
    if (this._resultsBusy || this.data.resultsDone || !this.data.listMode) return;
    this._resultsBusy = true;
    this.setData({ resultsLoading: true });
    const { kw, type, imagery, mode } = this._resultFilter;
    let added = 0;
    this._pendingItems = this._pendingItems || [];
    try {
      const TARGET = 20;
      // 维护一个本地真实长度计数器，避免并发中 this.data.resultsList.length 读旧值导致覆盖
      let localLen = this.data.resultsList.length;
      while (added < TARGET && (this._pendingItems.length || this._resultCursor < this._resultChunks.length)) {
        // 先上屏上一轮缓冲的命中
        if (this._pendingItems.length) {
          const take0 = this._pendingItems.splice(0, TARGET - added);
          const patch0 = {};
          take0.forEach((it, k) => { patch0["resultsList[" + (localLen + k) + "]"] = it; });
          this.setData(patch0);
          localLen += take0.length;
          added += take0.length;
          continue;
        }
        // 并行拉取 6 个数据块，但收集命中后统一排序再一次性上屏（避免并发写同一下标互相覆盖）
        const batch = this._resultChunks.slice(this._resultCursor, this._resultCursor + 6);
        this._resultCursor += batch.length;
        const allHits = [];
        await Promise.all(batch.map(async (c) => {
          try {
            const poems = await data.loadChunk(c.file);
            poems.filter((p) => data.matchKw(p, kw, type, mode) && data.matchImagery(p, imagery)).forEach((p) => {
              const id = favId(p);
              allHits.push({ id, t: p.t, a: p.a, d: p.d, y: p.y, c: p.c, open: false, seen: this._seenIds.has(id), fav: this._favSet.has(id), hasNote: !!(this._noteMap && this._noteMap.has(id)), tSegs: this._kwSegs(p.t || "无题", kw), mSegs: this._kwSegs((p.d || "") + " · " + (p.a || "") + (p.y ? " · " + p.y : ""), kw) });
            });
          } catch (e) {}
        }));
        if (allHits.length) {
          const room = Math.max(0, TARGET - added);
          const take = allHits.slice(0, room);
          if (allHits.length > room) this._pendingItems = this._pendingItems.concat(allHits.slice(room));
          if (take.length) {
            const patch = {};
            take.forEach((it, k) => { patch["resultsList[" + (localLen + k) + "]"] = it; });
            this.setData(patch);
            localLen += take.length;
            added += take.length;
          }
        }
        this.setData({ searchProgress: "正在检索：" + Math.min(this._resultCursor, this._resultChunks.length) + " / " + this._resultChunks.length + " 个数据块 · 已命中 " + localLen + " 首" });
      }
      this.setData({
        resultsDone: this._resultCursor >= this._resultChunks.length && !this._pendingItems.length,
        resultsCount: localLen,
        searchProgress: ""
      });
      // 预取下一批首块，翻页时可直接命中缓存
      if (!this.data.resultsDone && this._resultCursor < this._resultChunks.length) {
        data.prefetchChunk(this._resultChunks[this._resultCursor].file);
      }
    } catch (err) {
      this.setData({ searchProgress: "" });
      this.showStatus("读取失败：" + (err && err.message ? err.message : err), true);
    } finally {
      this._resultsBusy = false;
      this.setData({ resultsLoading: false });
    }
  },
  // 按搜索词切分文本用于高亮（搜索引擎式加粗）
  _kwSegs(text, kw) {
    if (!kw || text.indexOf(kw) < 0) return null;
    const parts = text.split(kw);
    const segs = [];
    parts.forEach((s, i) => {
      if (i) segs.push({ s: kw, h: true, k: "h" + i });
      if (s) segs.push({ s, h: false, k: "t" + i });
    });
    return segs;
  },
  // 页面触底自动加载下一页
  onReachBottom() {
    if (this.data.listMode && !this.data.resultsDone && !this.data.resultsLoading) this.loadMoreResults();
  },
  onResultItemTap(e) {
    const idx = e.currentTarget.dataset.index;
    // 多选模式下点整行 = 勾选/取消
    if (this.data.selMode) { this.onSelToggle(e); return; }
    this.haptic();
    const list = this.data.resultsList;
    const updates = {};
    // 手风琴：同一时间只展开一首
    if (this._openIdx != null && this._openIdx !== idx && list[this._openIdx] && list[this._openIdx].open) {
      updates["resultsList[" + this._openIdx + "].open"] = false;
    }
    const willOpen = !list[idx].open;
    updates["resultsList[" + idx + "].open"] = willOpen;
    if (willOpen && !list[idx].seen) {
      updates["resultsList[" + idx + "].seen"] = true;
      if (!this._seenIds) this._seenIds = new Set();
      this._seenIds.add(list[idx].id);
    }
    this._openIdx = willOpen ? idx : null;
    this.setData(updates);
    // 展开后把该首滚动到视口垂直居中
    if (willOpen) {
      setTimeout(() => {
        const q = wx.createSelectorQuery();
        q.select("#resItem-" + idx).boundingClientRect();
        q.selectViewport().scrollOffset();
        q.exec((res) => {
          const r = res && res[0], so = res && res[1];
          if (!r || !so) return;
          const winH = this._winH || wx.getSystemInfoSync().windowHeight;
          const target = so.scrollTop + r.top + r.height / 2 - winH / 2;
          wx.pageScrollTo({ scrollTop: Math.max(0, target), duration: 300 });
        });
      }, 360);
    }
  },
  async onResultShareTap(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    // 留在列表页直接为这首诗词生成卡片（不跳回主卡片）；完成后恢复主卡片状态
    const prev = this.currentPoem;
    this.currentPoem = item;
    this._cardRect = { width: 300, height: 400 }; // 卡片未显示时，自适应比例回退 3:4
    try { await this.onShareTap(); } finally { this.currentPoem = prev; this._cardRect = null; }
  },
  onListModeExit() {
    this.haptic();
    this.setData({ listMode: false });
  },
  // 多选（批量收藏）
  onSelModeEnter() {
    this.haptic();
    this.setData({ selMode: true, selIds: {}, selCount: 0 });
  },
  onSelModeExit() {
    this.haptic();
    this.setData({ selMode: false, selIds: {}, selCount: 0 });
  },
  onSelToggle(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.resultsList[idx];
    if (!item) return;
    this.haptic();
    const selIds = { ...this.data.selIds };
    if (selIds[item.id]) delete selIds[item.id]; else selIds[item.id] = true;
    this.setData({ selIds, selCount: Object.keys(selIds).length });
  },
  onSelAll() {
    this.haptic();
    const selIds = {};
    if (!(this.data.selCount >= this.data.resultsList.length && this.data.resultsList.length)) {
      this.data.resultsList.forEach((it) => { selIds[it.id] = true; });
    }
    this.setData({ selIds, selCount: Object.keys(selIds).length });
  },
  onSelFav() {
    const ids = this.data.selIds;
    const poems = this.data.resultsList.filter((it) => ids[it.id]);
    if (!poems.length) return;
    this.haptic();
    const added = this.addFavs(poems);
    this._syncResultsFav();
    wx.showToast({ title: added ? "已收藏 " + added + " 首" : "均已在收藏夹中", icon: "none" });
    this.setData({ selMode: false, selIds: {}, selCount: 0 });
  },

  // ====== 随机抽取（与网页版 loadRandomPoem 一致） ======
  async loadRandomPoem(userAction, forceRandom) {
    if (this.data.randomLoading) return;
    this.setData({ randomLoading: true });
    this.progressStart();
    const kw = forceRandom ? "" : (this.data.keyword || "").trim();
    const type = forceRandom ? "" : (this.data.type || "").trim();
    try {
      if (!this.indexReady) {
        this.showStatus("诗词库尚未加载完成，请稍候……");
        return;
      }
      // 竖排显示模式：不推荐内容超过 56 字的诗词
      const maxLen = this.currentTheme.direction === "vertical" ? 56 : 0;
      const poem = await data.findRandomPoemByKw(kw, type, maxLen, kw ? this._effModeFor(kw) : "auto");
      this.renderPoem(poem);
      if (userAction) {
        wx.pageScrollTo({ selector: ".card", duration: 300 });
      }
    } catch (err) {
      this.showStatus("读取失败：" + (err && err.message ? err.message : err), true);
    } finally {
      this.setData({ randomLoading: false });
      this.progressDone();
    }
  },

  // ====== 最近读过（本地缓存，最多 20 首） ======
  _recordHistory(poem) {
    if (!poem) return;
    this._history = this._history || [];
    const id = favId(poem);
    this._history = this._history.filter((p) => favId(p) !== id);
    this._history.unshift({ t: poem.t, a: poem.a, d: poem.d, y: poem.y, c: poem.c });
    if (this._history.length > 20) this._history.length = 20;
    try { wx.setStorageSync("shihai-history-v1", this._history); } catch (e) {}
  },
  onHistToggle() {
    this.haptic();
    this.setData({ histList: this._history || [], histShow: true });
  },
  onHistClose() { this.hideSheet("histShow"); },
  onHistItemTap(e) {
    const p = (this._history || [])[e.currentTarget.dataset.index];
    if (!p) return;
    this.haptic();
    this.hideSheet("histShow");
    this.setData({ listMode: false });
    this.renderPoem(p);
    wx.pageScrollTo({ selector: ".card", duration: 300 });
  },
  onHistClear() {
    this.haptic();
    if (!(this._history || []).length) { wx.showToast({ title: "暂无阅读记录", icon: "none" }); return; }
    this._history = [];
    try { wx.setStorageSync("shihai-history-v1", []); } catch (e) {}
    this.setData({ histList: [] });
    wx.showToast({ title: "已清空阅读记录", icon: "none" });
  },


  // ====== 卡片手势：左右轻滑换诗 / 长按诗句复制 / 双击收藏 ======
  onCardTouchStart(e) {
    const t = e.touches[0];
    this._cardTouch = { x: t.clientX, y: t.clientY };
  },
  onCardTouchEnd(e) {
    if (!this._cardTouch) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this._cardTouch.x;
    const dy = t.clientY - this._cardTouch.y;
    this._cardTouch = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 2) return;
    if (!this.currentPoem || this.data.randomLoading) return;
    this.haptic();
    this.setData({ listMode: false });
    this.loadRandomPoem(false, true);
  },
  onVerseLongPress(e) {
    const text = e.currentTarget.dataset.text || "";
    if (!text) return;
    this.haptic();
    wx.setClipboardData({ data: text });
  },
  onCardBodyTap() {
    if (!this.currentPoem) return;
    const now = Date.now();
    if (now - (this._lastBodyTap || 0) < 320) {
      this._lastBodyTap = 0;
      this.onCardFavTap();
    } else {
      this._lastBodyTap = now;
    }
  },

  // ====== 收藏夹导出：复制全部收藏为文本 ======
  onFavExport() {
    this.haptic();
    const list = this.data.favList || [];
    if (!list.length) { wx.showToast({ title: "还没有收藏可导出", icon: "none" }); return; }
    const text = "诗海 · 我的收藏（" + list.length + " 首）\n\n" +
      list.map((p) => "《" + (p.t || "无题") + "》 " + [p.d, p.a].filter(Boolean).join(" · ") + "\n" + (p.c || "")).join("\n\n");
    wx.setClipboardData({ data: text, success: () => wx.showToast({ title: "已复制 " + list.length + " 首收藏", icon: "none" }) });
  },

  // ====== 渲染诗词（对齐网页版 renderPoem + fitCardText） ======
  _metaText(poem) {
    return [poem.d, poem.a].filter(Boolean).join(" · ");
  },

  renderPoem(poem) {
    this.currentPoem = poem;
    const meta = this._metaText(poem);
    const tt = this._buildTitle(poem.t || "无题");
    const pid = favId(poem);
    if (this._lastStatId !== pid) { this._lastStatId = pid; this._recordStats(); }
    const newPoem = this._briefOverrideId !== pid;
    if (newPoem) this._briefOverrideId = pid;
    const verseList = verse.splitVerses(poem.c);
    let briefQuote = "";
    if (this._opts && this._opts.brief && verseList.length) {
      let h = 0;
      for (let i = 0; i < pid.length; i++) h += pid.charCodeAt(i);
      briefQuote = verseList[h % verseList.length];
    }
    this.setData({
      hasPoem: true,
      currentFav: !!(this._favSet && this._favSet.has(favId(poem))),
      currentNote: !!(this._noteMap && this._noteMap.has(favId(poem))),
      statusText: "",
      statusError: false,
      poem: { t: poem.t || "无题", meta, pd: poem.d || "", pa: poem.a || "", type: poem.y || "", imagery: data.extractImageryTags(poem) },
      briefQuote,
      briefFull: newPoem ? false : this.data.briefFull,
      titleLines: tt.lines,
      titleStyle: tt.style,
      metaStyle: this._fitInlineStyle(meta, "--meta-font-size"),
      categoryStyle: this._fitInlineStyle(poem.y ? "体裁：" + poem.y : "", "--category-font-size"),
      verseLines: this.buildVerseLines(poem),
      inkAnim: false
    }, () => { this.fitCardText(); this.setData({ inkAnim: true }); });
    this._recordHistory(poem);
  },

  // 标题排版：放得下则单行；超宽则均分为多行（优先在标点处断句），
  // 换行后仍超宽才等比缩小字号（最小 50%）——文字绝不触碰卡片内框
  _buildTitle(title, width) {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars["--title-font-size"]) * 2;
    // 留 6% 安全边距：补偿字宽估算误差，确保任何字体下都不碰边框
    const innerW = (width || this._cardInnerW()) * 0.94;
    const chars = Array.from(title);
    const unitW = fontRpx * scale;
    if (chars.length * unitW <= innerW) return { lines: [title], style: "" };
    const lines = splitTitleLines(chars, unitW, innerW);
    // 换行后某行仍超宽：等比缩小字号兜底（最小 50%）
    const maxN = Math.max(...lines.map((l) => Array.from(l).length));
    let style = "";
    if (maxN * unitW > innerW) {
      const shrunk = Math.max((fontRpx * innerW) / (maxN * unitW), fontRpx * 0.5);
      style = "font-size:" + shrunk + "rpx;";
    }
    return { lines, style };
  },

  // 硬性要求：作者行超宽时按比例缩小（最小 50%），保证不出卡片内框
  _fitInlineStyle(text, fontVar, width) {
    if (!text) return "";
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    const fontRpx = parseFloat(themes.THEMES.size[this.currentTheme.size].vars[fontVar]) * 2;
    const w = Array.from(text).length * fontRpx * scale;
    const innerW = width || this._cardInnerW();
    if (w <= innerW) return "";
    return "font-size:" + Math.max((fontRpx * innerW) / w, fontRpx * 0.5) + "rpx;";
  },

  // fitCardText 的排版结果：[{text, punct, wrap}]
  buildVerseLines(poem) {
    const isV = this.currentTheme && this.currentTheme.direction === "vertical";
    const verses = verse.splitVerses(poem.c);
    if (isV) {
      // 竖排：整句成列
      return verses.map((v) => ({ text: v, punct: "", wrap: false }));
    }
    return this._fitVerses(poem, verses);
  },

  _fitVerses(poem, verses, width) {
    const clauses = [];
    for (const v of verses) {
      for (const c of verse.splitClauseLines(v)) clauses.push(c);
    }
    const safeW = (width || this._cardInnerW()) * 0.98;
    const fontSize = this._contentFontPx();
    // 字宽估算留 6% 余量（含行尾悬挂标点），任何字都不允许碰到卡片内框
    const estW = (t) => t.length * fontSize * 1.06;
    const plain = (t) => t.replace(/[，、。！？；]/g, "").length;
    // 硬性规则：一旦有任何小句单独放不下，整首诗都以一行一个小句呈现
    const needBreak = clauses.some((c) => estW(c) > safeW);
    const out = [];
    for (let i = 0; i < clauses.length; i++) {
      const a = clauses[i];
      const b = clauses[i + 1];
      // 大句合并：两小句均较短（≤14 字）且合并后放得下（整句需折行时不合并）
      if (!needBreak && b && plain(a) <= 14 && plain(b) <= 14 && estW(a + b) <= safeW) {
        const sp = verse.hangSplit(a + b);
        out.push({ text: sp.body, punct: sp.punct, wrap: false });
        i++;
        continue;
      }
      const sp = verse.hangSplit(a);
      out.push({ text: sp.body, punct: sp.punct, wrap: plain(a) >= 8 || estW(a) > safeW });
    }
    return out;
  },

  _contentFontPx() {
    // 主题字号（设计 px）→ rpx(×2) → 实际屏幕 px
    const sizePx = themes.THEMES.size[this.currentTheme.size].vars["--content-font-size"];
    const winW = wx.getSystemInfoSync().windowWidth;
    return parseFloat(sizePx) * 2 * (winW / 750);
  },

  _cardInnerW() {
    const winW = wx.getSystemInfoSync().windowWidth;
    const scale = winW / 750;
    // 页面两侧留白（主题变量 --page-padding 水平值，设计 px → rpx(×2) → 屏幕 px）
    const padVar = themes.THEMES.layout[this.currentTheme.layout].vars["--page-padding"];
    const pagePad = parseFloat(padVar.split(" ")[1]) * 2 * scale;
    // 卡片铺满屏幕（主题已不再限制 max-width）
    const cardW = winW - pagePad * 2;
    const padX = themes.CARD_PAD_X[this.currentTheme.layout] * 2 * scale;
    // 与网页版一致：再减 28（装饰内框余量）
    return cardW - padX * 2 - 28 * scale;
  },

  // 卡片实际尺寸测量后再排版一次（等价 resize 监听）：
  // 直接取 .content 内容盒实测宽度（装饰内框之内的真实可用宽度）重排所有文字，
  // 不依赖公式估算，任何字体/缩放下都不可能超出内框
  fitCardText() {
    if (!this.currentPoem) return;
    wx.createSelectorQuery()
      .select(".card-body")
      .boundingClientRect()
      .select(".content")
      .boundingClientRect()
      .exec((res) => {
        if (!res || !res[0]) return;
        this._cardRect = res[0];
        if (this.currentTheme.direction === "vertical") return;
        const innerW = res[1] && res[1].width ? res[1].width : this._cardInnerW();
        const poem = this.currentPoem;
        const tt = this._buildTitle(poem.t || "无题", innerW);
        const meta = this._metaText(poem);
        this.setData({
          titleLines: tt.lines,
          titleStyle: tt.style,
          metaStyle: this._fitInlineStyle(meta, "--meta-font-size", innerW),
          categoryStyle: this._fitInlineStyle(poem.y ? "体裁：" + poem.y : "", "--category-font-size", innerW),
          verseLines: this._fitVerses(poem, verse.splitVerses(poem.c), innerW)
        });
      });
  },

  // ====== 主题面板（对齐网页版 themePanel） ======
  onThemeToggle() {
    // 长按已触发开发者面板：吃掉松手后随之而来的 tap，避免设置面板误开
    if (this._devLongPressFired) { this._devLongPressFired = false; return; }
    this.haptic();
    // 齿轮绕中心整周旋转（650ms 后复位类，供下次触发）
    this.setData({ gearSpin: true });
    clearTimeout(this._gearTimer);
    this._gearTimer = setTimeout(() => this.setData({ gearSpin: false }), 650);
    this.setData({ themePanelOpen: !this.data.themePanelOpen });
  },
  onPageTap() {
    const patch = {};
    if (this.data.themePanelOpen) patch.themePanelOpen = false;
    if (Object.keys(patch).length) this.setData(patch);
  },
  // ====== 开发者入口：长按设置齿轮 5s ======
  onGearTouchStart(e) {
    const t = e.touches && e.touches[0];
    this._gearStart = t ? { x: t.clientX, y: t.clientY } : null;
    clearTimeout(this._devTimer);
    this._devTimer = setTimeout(() => {
      this._devTimer = null;
      this._devLongPressFired = true;
      this.openDevPanel();
    }, 5000);
  },
  onGearTouchEnd() {
    if (this._devTimer) { clearTimeout(this._devTimer); this._devTimer = null; }
  },
  onGearTouchMove(e) {
    // 手指轻微抖动不取消（位移阈值 12px），明显移动才视为放弃长按
    const t = e.touches && e.touches[0];
    if (t && this._gearStart) {
      const dx = t.clientX - this._gearStart.x, dy = t.clientY - this._gearStart.y;
      if (dx * dx + dy * dy <= 144) return;
    }
    if (this._devTimer) { clearTimeout(this._devTimer); this._devTimer = null; }
  },
  // 隐藏开发者入口：页脚版权行长按（原生 longpress，真机可靠；齿轮 5s 长按保留为备用）
  onDevEntry() {
    this.openDevPanel();
  },
  openDevPanel() {
    // 强触感提示长按已到位
    try { wx.vibrateShort({ type: "heavy" }); } catch (e) { try { wx.vibrateShort(); } catch (e2) {} }
    this._devOpenedAt = Date.now();
    this.refreshDevRows();
    this.setData({ devShow: true, themePanelOpen: false });
    // 面板打开期间每秒刷新实时状态
    clearInterval(this._devInterval);
    this._devInterval = setInterval(() => this.refreshDevRows(), 1000);
  },
  refreshDevRows() {
    const app = getApp() || { globalData: {} };
    const g = app.globalData || {};
    let win = {}, dev = {}, base = {}, acct = "", store = {};
    try { win = wx.getWindowInfo(); } catch (e) {}
    try { dev = wx.getDeviceInfo(); } catch (e) {}
    try { base = wx.getAppBaseInfo ? wx.getAppBaseInfo() : {}; } catch (e) {}
    try { acct = wx.getAccountInfoSync().miniProgram.appId; } catch (e) {}
    try { store = wx.getStorageInfoSync(); } catch (e) {}
    win = win || {}; dev = dev || {}; base = base || {}; store = store || {};
    try {
      wx.getNetworkType({ success: (r) => {
        this._devNet = r.networkType === "none" ? "未连接" : r.networkType;
        this._updateDevRow("网络", this._devNet);
      } });
    } catch (e) {}
    try {
      wx.getBatteryInfo({ success: (r) => {
        this._devBat = r.level + "%" + (r.isCharging ? "（充电中）" : "");
        this._updateDevRow("电量", this._devBat);
      } });
    } catch (e) {}
    const cache = data.cacheStats();
    const t = this.currentTheme || {};
    const up = Math.max(0, Math.floor((Date.now() - (this._devOpenedAt || Date.now())) / 1000));
    const pad = (n) => String(n).padStart(2, "0");
    const dur = pad(Math.floor(up / 60)) + ":" + pad(up % 60);
    const now = new Date();
    const clock = now.getFullYear() + "-" + pad(now.getMonth() + 1) + "-" + pad(now.getDate()) + " " + pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    const raw = [
      { sec: "应用" },
      { k: "应用名称", v: "诗海 · The Poetry Ocean" },
      { k: "AppID", v: acct || "不可用" },
      { k: "基础库", v: win.SDKVersion || "-" },
      { k: "环境版本", v: typeof __wxConfig !== "undefined" && __wxConfig.envVersion ? __wxConfig.envVersion : "-" },
      { sec: "设备与系统" },
      { k: "设备型号", v: ((dev.brand ? dev.brand + " " : "") + (dev.model || "-")).trim() },
      { k: "系统", v: (dev.system || "-") + " · " + (dev.platform || "-") },
      { k: "语言", v: base.language || dev.language || "-" },
      { k: "屏幕", v: (win.screenWidth || "-") + "×" + (win.screenHeight || "-") + (win.pixelRatio ? " @" + win.pixelRatio + "x" : "") },
      { k: "窗口", v: (win.windowWidth || "-") + "×" + (win.windowHeight || "-") + (win.statusBarHeight != null ? " · 状态栏 " + win.statusBarHeight + "px" : "") },
      { k: "电量", v: this._devBat || "检测中…" },
      { sec: "数据与存储" },
      { k: "诗词总数", v: (g.total || 0).toLocaleString() + " 首" },
      { k: "数据模式", v: cfg.DATA_MODE + (cfg.DATA_MODE === "cloudbase" ? "（" + cfg.CLOUDBASE_ENV + "）" : "") },
      { k: "内存缓存分块", v: cache.count + " 个" + (cache.count ? "：" + cache.chunks.slice(0, 8).join(", ") + (cache.chunks.length > 8 ? "…" : "") : "") },
      { k: "本地存储", v: (store.currentSize || 0) + " KB / " + (store.limitSize || "?") + " KB · " + (store.keys || []).length + " 项" },
      { k: "收藏 / 批注", v: (this._favs || []).length + " 条收藏 · " + (this._notes || []).length + " 条批注" },
      { sec: "运行状态" },
      { k: "网络", v: this._devNet || "检测中…" },
      { k: "思源宋体", v: g.fontOk ? "✓ 已加载（" + (g.fontSrc || "") + "）" : "加载中/回退（" + (g.fontLoaded || []).length + "/2 字重）" },
      { k: "当前主题", v: (t.color || "-") + " · " + (t.layout || "-") + " · " + (t.direction || "-") },
      { k: "面板已打开", v: dur },
      { k: "当前时间", v: clock }
    ];
    const rows = raw.map((r, i) => Object.assign({ id: i }, r));
    this._devRowsCache = rows;
    this.setData({ devRows: rows });
  },
  _updateDevRow(k, v) {
    if (!this.data.devShow) return;
    const rows = this.data.devRows.map((r) => (r.k === k ? Object.assign({}, r, { v }) : r));
    this.setData({ devRows: rows });
  },
  onDevCopy() {
    this.haptic();
    const text = (this._devRowsCache || [])
      .map((r) => (r.sec ? "[" + r.sec + "]" : r.k + ": " + r.v))
      .join("\n");
    wx.setClipboardData({ data: text });
  },
  onDevReshowDisclaimer() {
    this.haptic();
    clearInterval(this._devInterval);
    this.hideSheet("devShow");
    this.setData({ disclaimerShow: true });
  },
  onDevReonboard() {
    this.haptic();
    clearInterval(this._devInterval);
    this.hideSheet("devShow");
    try { wx.removeStorageSync("shihai-onboard-v1"); } catch (e) {}
    this._maybeOnboard();
  },
  onDevResplash() {
    this.haptic();
    clearInterval(this._devInterval);
    this.hideSheet("devShow");
    this.setData({ splashShow: true, uiReady: false });
    this.startSplash();
  },
  onDevClose() {
    clearInterval(this._devInterval);
    this.hideSheet("devShow");
  },
  noop() {},
  // ====== 精致化：水墨涟漪 / 选项开关 / 签名 / 摇一摇 / 统计 / 节气 / 首次引导 ======
  onRippleTouch(e) {
    const t = e.touches && e.touches[0];
    if (!t) return;
    this.setData({ ripple: { x: t.clientX, y: t.clientY } });
    clearTimeout(this._rippleTimer);
    this._rippleTimer = setTimeout(() => this.setData({ ripple: null }), 650);
  },
  _saveOpts() { try { wx.setStorageSync("shihai-opts-v1", this._opts); } catch (e) {} },
  onOptToggle(e) {
    const { key, value } = e.currentTarget.dataset;
    if (!key) return;
    this.haptic();
    this._opts[key] = value === "on";
    this._saveOpts();
    const upd = {};
    upd["opt" + key.charAt(0).toUpperCase() + key.slice(1)] = this._opts[key];
    if (key === "brief") upd.briefFull = false;
    this.setData(upd);
    if (key === "shake") { if (this._opts.shake) this._startShake(); else this._stopShake(); }
    if (key === "brief" && this.currentPoem) this.renderPoem(this.currentPoem);
  },
  onSignInput(e) {
    this._opts.sign = (e.detail.value || "").trim();
    this.setData({ optSign: e.detail.value || "" });
    this._saveOpts();
  },
  // ====== 书法字体（动态加载开源字体） ======
  _fontLoaded: {},
  _applyFontFace(face) {
    this.setData({ optFontFace: face || "" });
    if (!face) return;
    const families = {
      kai: "LXGW WenKai",
      xing: "Long Cang",
      cao: "Liu Jian Mao Cao"
    };
    const urls = {
      kai: "https://cdn.jsdelivr.net/npm/lxgw-wenkai-screen/lxgwwenkaiscreen.ttf",
      xing: "https://cdn.jsdelivr.net/npm/@fontsource/long-cang/files/long-cang-chinese-simplified-400-normal.ttf",
      cao: "https://cdn.jsdelivr.net/npm/@fontsource/liu-jian-mao-cao/files/liu-jian-mao-cao-chinese-simplified-400-normal.ttf"
    };
    const family = families[face];
    const url = urls[face];
    if (!family || !url || this._fontLoaded[face]) return;
    this._fontLoaded[face] = true;
    wx.loadFontFace({
      family,
      source: 'url("' + url + '")',
      global: true,
      scopes: ["webview", "native"],
      success: () => {},
      fail: () => { this._fontLoaded[face] = false; }
    });
  },
  onFontFaceTap(e) {
    this.haptic();
    const v = e.currentTarget.dataset.value;
    this._opts.fontFace = v;
    this._saveOpts();
    this._applyFontFace(v);
  },
  // ====== 节气主题 ======
  _applySolarTheme() {
    if (!this._opts.solarTheme) return;
    const term = this._getCurrentSolarTerm();
    if (!term) return;
    const vars = Object.assign({}, this.data.themeVars || {}, term.theme);
    this.setData({ varsStyle: Object.keys(vars).map((k) => k + ":" + vars[k]).join(";") });
  },
  _getCurrentSolarTerm() {
    const now = new Date();
    const m = now.getMonth() + 1, d = now.getDate();
    let current = SOLAR_TERMS[SOLAR_TERMS.length - 1];
    for (const t of SOLAR_TERMS) {
      if (m < t.month || (m === t.month && d < t.day)) break;
      current = t;
    }
    return current;
  },
  onSolarThemeTap(e) {
    this.haptic();
    const on = e.currentTarget.dataset.value === "on";
    this._opts.solarTheme = on;
    this._saveOpts();
    this.setData({ solarTheme: on });
    if (on) this._applySolarTheme();
    else this.applyTheme(this.data.themeIdx || 0);
  },
  // ====== 每日推荐 ======
  async loadDailyPoem() {
    if (this._dailyPoem) return this._dailyPoem;
    try {
      const idx = await data.loadIndex();
      if (!idx || !idx.chunks || !idx.chunks.length) return null;
      const now = new Date();
      const seed = now.getFullYear() * 1000 + (now.getMonth() + 1) * 50 + now.getDate();
      const chunkIdx = seed % idx.chunks.length;
      const chunk = idx.chunks[chunkIdx];
      const poems = await data.loadChunk(chunk.file);
      if (!poems || !poems.length) return null;
      const poemIdx = (seed * 7 + 13) % poems.length;
      this._dailyPoem = poems[poemIdx];
      return this._dailyPoem;
    } catch (e) { return null; }
  },
  async onDailyTap() {
    this.haptic();
    wx.showLoading({ title: "加载中..." });
    const p = await this.loadDailyPoem();
    wx.hideLoading();
    if (p) {
      this.setData({ listMode: false });
      this.renderPoem(p);
      wx.pageScrollTo({ selector: ".card", duration: 300 });
    }
  },
  // ====== 每日推送（订阅消息） ======
  onSubscribeDaily() {
    this.haptic();
    const tmplId = "DAILY_POEM_TMPL_ID"; // 用户在小程序后台创建模板后替换
    wx.requestSubscribeMessage({
      tmplIds: [tmplId],
      success: (res) => {
        if (res[tmplId] === "accept") {
          wx.showToast({ title: "订阅成功", icon: "success" });
          // 调用云函数记录订阅
          if (wx.cloud) {
            wx.cloud.callFunction({
              name: "dailySubscribe",
              data: { action: "subscribe" },
              fail: () => {}
            });
          }
        }
      },
      fail: () => {}
    });
  },
  onBriefFullTap() {
    this.haptic();
    this.setData({ briefFull: true });
  },
  onMetaAuthorTap() {
    const a = this.currentPoem && (this.currentPoem.a || "").trim();
    if (!a) return;
    this.haptic();
    this.setData({ keyword: a });
    this.openResults(a, "");
  },
  _startShake() {
    if (this._shakeOn) return;
    this._shakeOn = true;
    this._shakeLast = 0;
    this._accPrev = null;
    try { wx.startAccelerometer({ interval: "game" }); } catch (e) {}
    this._accCb = (res) => {
      const p = this._accPrev;
      this._accPrev = res;
      if (!p) return;
      const d = Math.abs(res.x - p.x) + Math.abs(res.y - p.y) + Math.abs(res.z - p.z);
      if (d > 1.5 && Date.now() - this._shakeLast > 2000 && !this.data.randomLoading) {
        this._shakeLast = Date.now();
        this.haptic();
        wx.showToast({ title: "摇一摇 · 与诗相逢", icon: "none" });
        this.setData({ listMode: false, keyword: "", type: "" });
        this.loadRandomPoem(true);
      }
    };
    wx.onAccelerometerChange(this._accCb);
  },
  _stopShake() {
    if (!this._shakeOn) return;
    this._shakeOn = false;
    if (this._accCb) { try { wx.offAccelerometerChange(this._accCb); } catch (e) {} }
    try { wx.stopAccelerometer(); } catch (e) {}
  },
  _recordStats() {
    const st = this._stats = this._stats || { total: 0, dates: [], streak: 0, last: "" };
    const d = new Date();
    const ds = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    if (st.last !== ds) {
      const y = new Date(d.getTime() - 86400000);
      const ys = y.getFullYear() + "-" + (y.getMonth() + 1) + "-" + y.getDate();
      st.streak = st.last === ys ? (st.streak || 0) + 1 : 1;
      st.last = ds;
      if (!Array.isArray(st.dates)) st.dates = [];
      if (st.dates.indexOf(ds) < 0) st.dates.push(ds);
      if (st.dates.length > 500) st.dates.shift();
    }
    st.total += 1;
    try { wx.setStorageSync("shihai-stats-v1", st); } catch (e) {}
  },
  _solarTermToday() {
    const TERMS = ["小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种","夏至","小暑","大暑","立秋","处暑","白露","秋分","寒露","霜降","立冬","小雪","大雪","冬至"];
    const C21 = [5.4055,20.12,3.87,18.73,5.63,20.646,4.81,20.1,5.52,21.04,5.678,21.37,7.108,22.83,7.5,23.13,7.646,23.042,8.318,23.438,7.438,22.36,7.18,21.94];
    const d = new Date(); const m = d.getMonth(); const Y = d.getFullYear() % 100;
    for (let i = 0; i < 2; i++) {
      const day = Math.floor(Y * 0.2422 + C21[m * 2 + i]) - Math.floor((Y - 1) / 4);
      if (d.getDate() === day) return TERMS[m * 2 + i];
    }
    return "";
  },
  _maybeOnboard() {
    try {
      const ts = parseInt(wx.getStorageSync("shihai-onboard-v1") || "0", 10);
      if (ts && Date.now() - ts < 30 * 86400000) return;
      wx.setStorageSync("shihai-onboard-v1", String(Date.now()));
    } catch (e) {}
    setTimeout(() => this.setData({ onboardShow: true }), 600);
    setTimeout(() => this.setData({ onboardShow: false }), 6600);
  },
  onOnboardClose() {
    this.setData({ onboardShow: false });
  },
  onThemeOptTap(e) {
    this.haptic();
    const { group, value } = e.currentTarget.dataset;
    if (this.currentTheme[group] === value) return;
    // 切到竖排：默认紧凑排版；切回横排恢复原选择（与网页版一致）
    if (group === "direction") {
      if (value === "vertical") {
        this.prevHorzTheme = { layout: this.currentTheme.layout };
        this.currentTheme.layout = "compact";
      } else if (this.prevHorzTheme) {
        this.currentTheme.layout = this.prevHorzTheme.layout;
        this.prevHorzTheme = null;
      }
    }
    this.currentTheme[group] = value;
    this.applyTheme();
    themes.saveTheme(this.currentTheme);
    // 切到竖排且当前诗内容超 56 字：自动换一首短诗
    if (group === "direction" && value === "vertical" && this.currentPoem &&
        Array.from(this.currentPoem.c || "").length > 56) {
      this.loadRandomPoem(false);
      return;
    }
    if (this.currentPoem) this.renderPoem(this.currentPoem);
  },

  applyTheme() {
    const t = this.currentTheme;
    const px2rpx = (v) => Math.round(parseFloat(v) * 2) + "rpx";
    const vars = {};
    ["color", "layout", "size"].forEach((g) => {
      const th = themes.THEMES[g][t[g]];
      Object.keys(th.vars).forEach((k) => {
        const raw = th.vars[k];
        // 字号/内边距按 750 设计稿换算成 rpx，其余原样
        vars[k] = /font-size|padding/.test(k) ? px2rpx(raw) : raw;
      });
    });
    const isVertical = t.direction === "vertical";
    // 竖排时强制自适应比例（与网页版 syncRatioOptions 一致）
    let shareRatio = this.data.shareRatio;
    if (isVertical) shareRatio = "auto";
    const varsStyle = Object.keys(vars).map((k) => k + ":" + vars[k]).join(";");
    // 计算 bg 亮度判断是否深色主题
    const bgHex = (vars["--bg-color"] || "").replace("#", "");
    let themeDark = false;
    if (/^[0-9a-fA-F]{6}$/.test(bgHex)) {
      const r = parseInt(bgHex.slice(0, 2), 16), g = parseInt(bgHex.slice(2, 4), 16), b = parseInt(bgHex.slice(4, 6), 16);
      themeDark = (0.299 * r + 0.587 * g + 0.114 * b) < 128;
    }
    this.setData({
      varsStyle,
      themeDark,
      isVertical,
      shareRatio,
      ratioOptions: RATIO_OPTIONS.map((o) => ({
        ...o,
        disabled: isVertical && o.value !== "auto",
        active: isVertical ? o.value === "auto" : o.value === shareRatio
      })),
      ratioActiveIndex: RATIO_OPTIONS.findIndex((o) => o.value === (isVertical ? "auto" : shareRatio)),
      colorOptions: this.data.colorOptions.map((o) => ({ ...o, active: o.value === t.color })),
      directionOptions: this.data.directionOptions.map((o) => ({ ...o, active: o.value === t.direction }))
    });
  },

  onRatioTap(e) {
    this.haptic();
    const value = e.currentTarget.dataset.value;
    if (this.currentTheme.direction === "vertical" && value !== "auto") return;
    this.setData({
      shareRatio: value,
      ratioOptions: this.data.ratioOptions.map((o) => ({ ...o, active: o.value === value })),
      ratioActiveIndex: RATIO_OPTIONS.findIndex((o) => o.value === value)
    });
  },

  // ====== 分享卡片（canvas 2d 手绘 → 预览/保存，等价网页版下载） ======
  async onShareTap() {
    this.haptic();
    if (!this.currentPoem) {
      this.showStatus("请先随机抽取一首诗，再分享", true);
      return;
    }
    if (this.data.shareLoading) return;
    this.setData({ shareLoading: true });
    try {
      const t = this.currentTheme;
      const colors = themes.THEMES.color[t.color].vars;
      // 卡片实际宽高（自适应比例用），取最近一次测量值或现测
      let rect = this._cardRect;
      if (!rect) {
        rect = await new Promise((resolve) => {
          wx.createSelectorQuery().select(".card-body").boundingClientRect().exec((r) => resolve(r && r[0]));
        });
      }
      const vertical = t.direction === "vertical";
      const filePath = await new Promise((resolve, reject) => {
        wx.createSelectorQuery()
          .select("#shareCanvas")
          .fields({ node: true, size: true })
          .exec(async (res) => {
            if (!res || !res[0] || !res[0].node) return reject(new Error("画布初始化失败"));
            const canvas = res[0].node;
            const ctx = canvas.getContext("2d");
            try {
              await drawShare({
                canvas, ctx,
                poem: this.currentPoem,
                vertical,
                ratio: this.data.shareRatio,
                cardW: rect ? rect.width : 300,
                cardH: rect ? rect.height : 300,
                colors: {
                  bg: colors["--bg-color"], text: colors["--text-color"],
                  meta: colors["--meta-color"], accent: colors["--accent-color"],
                  category: colors["--category-color"], seal: colors["--seal-color"]
                },
                logoPath: vertical ? "/assets/logo-vertical.png" : "/assets/logo-yin.png",
                sign: (this._opts && this._opts.sign) || ""
              });
            } catch (e) {
              return reject(e);
            }
            const out = wx.env.USER_DATA_PATH + "/shihai_" + this.data.shareRatio.replace(":", "x") + "_" + Date.now() + ".png";
            wx.canvasToTempFilePath({
              canvas,
              fileType: "png",
              destWidth: canvas.width,
              destHeight: canvas.height,
              filePath: out,
              success: (r) => resolve(r.tempFilePath),
              fail: (e) => reject(new Error("导出图片失败：" + (e.errMsg || "")))
            });
          });
      });
      this._sharePath = filePath;
      // 弹出分享浮层：预览图上浮，下方三选项（朋友圈/朋友/相册）
      this.setData({ shareImg: filePath, shareSheetShow: true });
    } catch (e) {
      this.showStatus("生成卡片失败：" + (e && e.message ? e.message : e), true);
    } finally {
      this.setData({ shareLoading: false });
    }
  },

  // 轻触感震动反馈：medium 档位（短促有力的一下），不支持 type 的设备退回默认 vibrateShort
  // 浮层关闭退场动画：立即翻转显示标志（逻辑不阻塞），240ms 后卸载节点
  hideSheet(key) {
    if (!this.data[key]) return;
    const closing = key + "Closing";
    this.setData({ [key]: false, [closing]: true });
    this._sheetCloseTimers = this._sheetCloseTimers || {};
    clearTimeout(this._sheetCloseTimers[key]);
    this._sheetCloseTimers[key] = setTimeout(() => this.setData({ [closing]: false }), 240);
  },

  haptic() {
    wx.vibrateShort({ type: "heavy", fail: () => wx.vibrateShort({ fail: () => {} }) });
  },

  // 关闭分享浮层
  closeShareSheet() {
    this.hideSheet("shareSheetShow");
  },

  // 点预览图 → 全屏预览
  previewShareImg() {
    if (this._sharePath) wx.previewImage({ urls: [this._sharePath] });
  },

  saveShare() {
    this.haptic();
    const doSave = () =>
      wx.saveImageToPhotosAlbum({
        filePath: this._sharePath,
        success: () => wx.showToast({ title: "已保存到相册", icon: "success" }),
        fail: (e) => wx.showToast({ title: "保存失败：" + (e.errMsg || ""), icon: "none" })
      });
    wx.authorize({
      scope: "scope.writePhotosAlbum",
      success: doSave,
      fail: () =>
        wx.showModal({
          title: "需要相册权限",
          content: "请在设置中允许写入相册后重试",
          confirmText: "去设置",
          success: (r) => { if (r.confirm) wx.openSetting(); }
        })
    });
  },

  // ====== 微信原生分享 ======
  _shareTitle() {
    const p = this.currentPoem;
    return p ? "诗海 · " + (p.t || "无题") + " — " + [p.d, p.a].filter(Boolean).join("·") : "诗海 · 古诗词浏览器";
  },
  _shareQuery() {
    const p = this.currentPoem;
    if (!p || !p.t) return "";
    // 标题截取前 30 字控制链接长度；还原时按 前缀 + 作者/朝代精确 匹配
    const pt = encodeURIComponent(String(p.t).slice(0, 30));
    return "pt=" + pt + (p.a ? "&pa=" + encodeURIComponent(p.a) : "") + (p.d ? "&pd=" + encodeURIComponent(p.d) : "");
  },
  // 分享给朋友：携带深链参数，好友点开直达同一首诗
  onShareAppMessage() {
    const q = this._shareQuery();
    return {
      title: this._shareTitle(),
      path: "/pages/index/index" + (q ? "?" + q : ""),
      imageUrl: this.data.shareImg || undefined
    };
  },
  // 分享到朋友圈：定义本方法后右上角「···」即出现朋友圈入口（仅安卓端开放）
  onShareTimeline() {
    return {
      title: this._shareTitle(),
      query: this._shareQuery(),
      imageUrl: this.data.shareImg || undefined
    };
  },
  onUnload() {
    if (typeof this._unsubVisit === "function") { try { this._unsubVisit(); } catch (e) {} }
  }
});
