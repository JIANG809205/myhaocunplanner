const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// 每日随机图片（从 images 目录）
app.get('/api/daily-image', (req, res) => {
  const dir = path.join(__dirname, 'public', 'images');
  fs.readdir(dir, (err, files) => {
    if (err) return res.json({ url: '/images/default.webp' });
    const webp = files.filter(f => f.endsWith('.webp'));
    if (!webp.length) return res.json({ url: '/images/default.webp' });
    const seed = new Date().getFullYear() * 10000 + (new Date().getMonth()+1)*100 + new Date().getDate();
    res.json({ url: '/images/' + webp[seed % webp.length] });
  });
});

// 每日背景图片（从 backgrounds 目录）
app.get('/api/daily-bg', (req, res) => {
  const dir = path.join(__dirname, 'public', 'backgrounds');
  fs.readdir(dir, (err, files) => {
    if (err) return res.json({ url: '/backgrounds/default.webp' });
    const webp = files.filter(f => f.endsWith('.webp'));
    if (!webp.length) return res.json({ url: '/backgrounds/default.webp' });
    const seed = new Date().getDate() + new Date().getMonth() * 31; // 简单种子
    res.json({ url: '/backgrounds/' + webp[seed % webp.length] });
  });
});

// 天干地支 + 运势
const tianGan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const diZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const shengXiao = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

function getChineseDate() {
  const now = new Date();
  const year = now.getFullYear();
  // 简单推算天干地支年（以1984为甲子年）
  const yearGan = tianGan[(year - 4) % 10];
  const yearZhi = diZhi[(year - 4) % 12];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  // 月柱简化（按节气约算）
  const monthGan = tianGan[(year * 12 + month) % 10];
  const monthZhi = diZhi[(month + 1) % 12];
  // 日柱简化
  const dayGan = tianGan[(year + month + day) % 10];
  const dayZhi = diZhi[(day + 3) % 12];
  return `${yearGan}${yearZhi}年 ${monthGan}${monthZhi}月 ${dayGan}${dayZhi}日`;
}

const fortunes = [
  '今日宜静不宜动，稳扎稳打方能成事。',
  '贵人运强，多与人交流或有机遇。',
  '财运小吉，但勿贪心，见好就收。',
  '桃花暗涌，单身者或有惊喜。',
  '注意口舌之争，退一步海阔天空。',
  '事业有新机，把握机会大胆尝试。',
  '健康第一，适当休息别透支。',
  '家宅安宁，适合整理内务。',
  '学习运佳，读书效率高。',
  '出行顺利，但注意交通安全。'
];


const axios = require('axios');

// 新增：聚合运势接口 (黄历 + 星座)
app.get('/api/combined-fortune', async (req, res) => {
    try {
        // 1. 调用维梦API获取黄历数据
        const almanacResponse = await axios.get('https://api.52vmy.cn/api/wl/wnl/huangli');
        const almanacData = almanacResponse.data.data;
        
        // 2. 调用素颜API获取星座运势数据 (以天秤座为例)
        // 你也可以让前端传入星座参数，比如 axios.get(`https://api.suyanw.cn/api/huangli.php?astro=${zodiac}`)
        const zodiacResponse = await axios.get('https://api.suyanw.cn/api/huangli.php');
        const zodiacData = zodiacResponse.data.data['星座运势'];
        
        // 3. 组合并返回数据
        res.json({
            success: true,
            data: {
                date: almanacData.date, // 公历和农历日期
                lunar: almanacData.lunar, // 完整农历信息
                chineseDate: almanacData.info.find(i => i.name === '五行')?.index || '', // 例如 "大林木"
                suits: almanacData.info.find(i => i.name === '吉神宜趋')?.index || '', // 宜做什么
                avoids: almanacData.info.find(i => i.name === '凶神宜忌')?.index || '', // 忌做什么
                zodiac: zodiacData
            }
        });
    } catch (error) {
        console.error('获取运势数据失败:', error);
        res.status(500).json({ success: false, message: '获取运势数据失败，请稍后重试。' });
    }
});

app.listen(PORT, () => console.log(`🌿 服务运行在 http://localhost:${PORT}`));
// 每日风光图片（从 scenery 目录）
app.get('/api/scenery', (req, res) => {
  const dir = path.join(__dirname, 'public', 'scenery');
  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.json({ url: '/scenery/default.webp', location: '📍 江南水乡' });
    }
    const webp = files.filter(f => f.endsWith('.webp'));
    if (!webp.length) {
      return res.json({ url: '/scenery/default.webp', location: '📍 诗意中国' });
    }
    // 按日期取一张图片
    const seed = new Date().getDate() + new Date().getMonth() * 31;
    const imgFile = webp[seed % webp.length];
    // 根据图片文件名生成地点（可自定义）
    let location = '📍 秘境中国';
    if (imgFile.includes('黄山')) location = '📍 安徽 · 黄山';
    else if (imgFile.includes('西湖')) location = '📍 杭州 · 西湖';
    else location = `📍 ${imgFile.replace('.webp', '')}`;
    res.json({ url: '/scenery/' + imgFile, location });
  });
});