// ================= 配置区域（可修改） =================
const CONFIG = {
  userName: '蒋晓涵',
  assistantName: '存子',
  // 小助手头像（网络图片，确保能访问）
  assistantImage: '/images/忆秦娥.gif',
  assistantWords: [
    '蒋晓涵，今天也要加油呀~',
    '休息一下，别太累哦。',
    '存子给你一朵小花 🌸',
    '你一定可以完成！',
    '晓涵最棒啦！'
  ]
};

// ================= DOM 元素 =================
const liveClock = document.getElementById('liveClock');
const liveDate = document.getElementById('liveDate');
const dailyImage = document.getElementById('dailyImage');
const sceneryImage = document.getElementById('sceneryImage');
const sceneryLocation = document.getElementById('sceneryLocation');
const fortuneView = document.getElementById('fortuneView');
const sceneryView = document.getElementById('sceneryView');
const switchBtns = document.querySelectorAll('.switch-btn');
const chineseDate = document.getElementById('chineseDate');
const animalYear = document.getElementById('animalYear');
const fortuneText = document.getElementById('fortuneText');
const taskText = document.getElementById('taskText');
const taskTime = document.getElementById('taskTime');
const taskPeriod = document.getElementById('taskPeriod');
const taskLocation = document.getElementById('taskLocation');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const totalSpan = document.getElementById('totalCount');
const activeSpan = document.getElementById('activeCount');
const completedSpan = document.getElementById('completedCount');
const tabs = document.querySelectorAll('.tab');
const assistantImg = document.getElementById('assistantImg');
const bubbleText = document.getElementById('bubbleText');
const assistantFooter = document.getElementById('assistantFooter');
const celebrateOverlay = document.getElementById('celebrate-overlay');
const celebrateText = document.getElementById('celebrateText');

let currentFilter = 'all';
let tasks = [];

// ================= 音效 =================
function playSound(name) {
  try {
    const a = new Audio(`/sounds/${name}.mp3`);
    a.volume = 0.3;
    a.play().catch(() => {});
  } catch (e) {}
}

// ================= 时钟 =================
function updateClock() {
  const now = new Date();
  liveClock.textContent = now.toLocaleTimeString('zh-CN', { hour12: false });
  liveDate.textContent = `${now.getFullYear()}年${now.getMonth()+1}月${now.getDate()}日 ${['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][now.getDay()]}`;
}
setInterval(updateClock, 1000);
updateClock();

// ================= 背景 & 图片 =================
fetch('/api/daily-bg')
  .then(r => r.json())
  .then(d => { document.body.style.backgroundImage = `url(${d.url})`; })
  .catch(() => {});

fetch('/api/daily-image')
  .then(r => r.json())
  .then(d => { dailyImage.src = d.url; dailyImage.onerror = () => dailyImage.src = '/images/default.webp'; });

// 调用新的运势接口（前端函数）
fetchCombinedFortune();

function loadScenery() {
  fetch('/api/scenery')
    .then(r => r.json())
    .then(data => {
      sceneryImage.src = data.url;
      sceneryLocation.textContent = data.location;
      sceneryImage.onerror = () => sceneryImage.src = '/scenery/default.webp';
    })
    .catch(() => {
      sceneryImage.src = '/scenery/default.webp';
      sceneryLocation.textContent = '📍 神秘之境';
    });
}
loadScenery();

switchBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    switchBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    if (btn.dataset.view === 'fortune') {
      fortuneView.classList.remove('hidden');
      sceneryView.classList.add('hidden');
    } else {
      sceneryView.classList.remove('hidden');
      fortuneView.classList.add('hidden');
      loadScenery();
    }
  });
});

// ================= 存子小助理 =================
// 播放小助理语音（根据索引）
function playAssistantVoice(index) {
  try {
    const audio = new Audio(`/sounds/assistant${index}.mp3`);
    audio.volume = 0.3;
    audio.play().catch(err => console.log('语音播放失败:', err));
  } catch (e) {}
}

function setRandomBubble() {
  const randomIndex = Math.floor(Math.random() * CONFIG.assistantWords.length);
  const newText = CONFIG.assistantWords[randomIndex];
  bubbleText.textContent = newText;
  playAssistantVoice(randomIndex);  // 换话时自动播放对应语音
}

function initAssistant() {
  assistantImg.src = CONFIG.assistantImage;
  assistantImg.onerror = () => assistantImg.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22%3E%3Ccircle cx=%2230%22 cy=%2230%22 r=%2228%22 fill=%22%23f0c0c0%22/%3E%3Ctext x=%2230%22 y=%2238%22 text-anchor=%22middle%22 font-size=%2224%22%3E👧%3C/text%3E%3C/svg%3E';
  setRandomBubble();  // 会播放第一句的语音
  assistantFooter.addEventListener('click', setRandomBubble);
  // 点击头像播放当前句子的语音
  assistantImg.addEventListener('click', () => {
    const currentText = bubbleText.textContent;
    const index = CONFIG.assistantWords.findIndex(word => word === currentText);
    if (index !== -1) {
      playAssistantVoice(index);
    } else {
      // fallback
      playAssistantVoice(Math.floor(Math.random() * CONFIG.assistantWords.length));
    }
  });
}

// ================= 庆祝弹窗（GIF 图片） =================
function showCelebrate(taskText = '') {
  const celebrateGif = document.getElementById('celebrateGif');
  if (!celebrateGif) {
    console.warn('找不到 celebrateGif 元素');
    return;
  }
  const gifUrl = '/images/hc打招呼.gif';
  celebrateGif.src = gifUrl;
  celebrateText.textContent = '蒋晓涵你太棒了！';
  const celebrateSub = document.getElementById('celebrateSub');
  if (celebrateSub) celebrateSub.textContent = taskText ? `完成任务「${taskText}」存子给你点赞 👍` : '存子给你点赞 👍';
  
  celebrateOverlay.classList.remove('hidden');
  playSound('complete');  // 保留原有的完成音效（可选）
  
  // 播放庆祝语音
  try {
    const praiseAudio = new Audio('/sounds/praise.mp3');
    praiseAudio.volume = 0.5;  // 音量可调
    praiseAudio.play().catch(err => console.log('庆祝语音播放失败:', err));
  } catch(e) {}
  
  setTimeout(() => {
    celebrateOverlay.classList.add('hidden');
    celebrateGif.src = '';
  }, 3000);
}

// ================= 任务逻辑（含进度条） =================
function loadTasks() {
  const stored = localStorage.getItem('myTasksV5');
  tasks = stored ? JSON.parse(stored) : [];
  tasks.forEach(t => {
    if (t.status === 'progress' && t.startTime) {
      t.elapsed = Math.floor((Date.now() - t.startTime) / 1000) + (t.savedElapsed || 0);
    } else {
      t.elapsed = t.savedElapsed || 0;
    }
    t.timerInterval = null;
    if (t.progress === undefined) t.progress = 0;
  });
  renderTasks();
  tasks.forEach((t, i) => {
    if (t.status === 'progress' && t.startTime) startTimer(i);
  });
}

function saveTasks() {
  const toSave = tasks.map(({ elapsed, timerInterval, ...t }) => ({
    ...t,
    savedElapsed: t.status === 'progress' ? Math.floor((Date.now() - t.startTime) / 1000) + (t.savedElapsed || 0) : t.savedElapsed
  }));
  localStorage.setItem('myTasksV5', JSON.stringify(toSave));
}

function renderTasks() {
  const filtered = currentFilter === 'all' ? tasks : tasks.filter(t => t.status === currentFilter);
  taskList.innerHTML = '';
  filtered.forEach(task => {
    const realIndex = tasks.indexOf(task);
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.index = realIndex;
    const statusMap = { planned: '计划中', progress: '进行中', completed: '已完成' };
    let timerHtml = '';
    if (task.status === 'progress') {
      const elapsed = Math.floor((Date.now() - task.startTime) / 1000) + (task.savedElapsed || 0);
      timerHtml = `<span class="timer-display">⏱️ ${formatTime(elapsed)}</span>`;
    } else if (task.savedElapsed && task.status !== 'progress') {
      timerHtml = `<span class="timer-display">⏱️ ${formatTime(task.savedElapsed)}</span>`;
    }
    const completedHtml = task.completedAt ? `<div class="task-detail">✅ 完成于 ${new Date(task.completedAt).toLocaleTimeString()}</div>` : '';
    
    // 可爱大头照进度区域（使用 GIF 或图片）
    let progressHtml = '';
    if (task.status === 'progress') {
      // 👇 重要：请把图片放到 public/images/ 目录下，然后使用 /images/xxx.gif 这样的路径
      // 这里示例一个稳定 GIF，你也可以换成自己的
      const avatarGif = '/images/hc.gif'; // 静态熊猫头
      progressHtml = `
        <div class="cute-progress">
          <img src="${avatarGif}" class="progress-avatar" alt="大头照">
          <span class="progress-text">${task.progress}%</span>
          <button class="progress-btn"> +10%</button>
        </div>
      `;
    }
    
    li.innerHTML = `
      <div class="task-header">
        <span class="status-badge status-${task.status}">${statusMap[task.status]}</span>
        <span class="task-text">${escapeHtml(task.text)}</span>
        ${timerHtml}
      </div>
      <div class="task-detail">
        <span>🕐 ${task.time} ${task.period}</span>
        <span>📍 ${escapeHtml(task.location) || '未指定'}</span>
      </div>
      ${completedHtml}
      ${progressHtml}
      <div class="btn-group">
        ${task.status === 'planned' ? '<button class="start-btn">▶ 开始</button>' : ''}
        ${task.status === 'progress' ? '<button class="pause-btn">⏸️ 暂停</button><button class="stop-btn">✅ 完成</button>' : ''}
        <button class="delete-btn">🗑️</button>
      </div>
    `;
    taskList.appendChild(li);
  });
  updateStats();
}

// 防止 XSS 的简单转义
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function formatTime(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function startTimer(index) {
  if (tasks[index].timerInterval) clearInterval(tasks[index].timerInterval);
  tasks[index].timerInterval = setInterval(() => {
    tasks[index].elapsed = Math.floor((Date.now() - tasks[index].startTime) / 1000) + (tasks[index].savedElapsed || 0);
    renderTasks();
  }, 1000);
}

function addTask() {
  const text = taskText.value.trim();
  if (!text) return alert('请输入任务内容');
  tasks.push({
    text,
    status: 'planned',
    time: taskTime.value || '08:00',
    period: taskPeriod.value,
    location: taskLocation.value.trim() || '未指定',
    startTime: null,
    savedElapsed: 0,
    completedAt: null,
    timerInterval: null,
    progress: 0
  });
  saveTasks();
  renderTasks();
  taskText.value = '';
  taskText.focus();
  playSound('click');
}

function deleteTask(index) {
  if (tasks[index].timerInterval) clearInterval(tasks[index].timerInterval);
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}

function startTask(index) {
  const t = tasks[index];
  t.status = 'progress';
  t.startTime = Date.now();
  t.progress = 0;
  startTimer(index);
  saveTasks();
  renderTasks();
  playSound('start');
}

function pauseTask(index) {
  const t = tasks[index];
  if (t.timerInterval) {
    clearInterval(t.timerInterval);
    t.timerInterval = null;
  }
  t.savedElapsed = Math.floor((Date.now() - t.startTime) / 1000) + (t.savedElapsed || 0);
  t.startTime = null;
  t.status = 'planned';
  saveTasks();
  renderTasks();
}

function completeTask(index) {
  const t = tasks[index];
  if (t.timerInterval) {
    clearInterval(t.timerInterval);
    t.timerInterval = null;
  }
  t.savedElapsed = Math.floor((Date.now() - t.startTime) / 1000) + (t.savedElapsed || 0);
  t.startTime = null;
  t.status = 'completed';
  t.completedAt = Date.now();
  t.progress = 100;
  saveTasks();
  renderTasks();
  showCelebrate(t.text);
}

function updateStats() {
  totalSpan.textContent = tasks.length;
  activeSpan.textContent = tasks.filter(t => t.status === 'progress').length;
  completedSpan.textContent = tasks.filter(t => t.status === 'completed').length;
}

// 事件绑定
taskList.addEventListener('click', e => {
  const li = e.target.closest('.task-item');
  if (!li) return;
  const index = parseInt(li.dataset.index);
  if (e.target.classList.contains('start-btn')) startTask(index);
  else if (e.target.classList.contains('pause-btn')) pauseTask(index);
  else if (e.target.classList.contains('stop-btn')) completeTask(index);
  else if (e.target.classList.contains('delete-btn')) deleteTask(index);
  else if (e.target.classList.contains('progress-btn')) {
    const t = tasks[index];
    if (t.status === 'progress') {
      let newProgress = Math.min(t.progress + 10, 100);
      t.progress = newProgress;
      saveTasks();
      renderTasks();
      if (newProgress === 100) {
        completeTask(index);
      }
    }
  }
});

addBtn.addEventListener('click', addTask);
taskText.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentFilter = tab.dataset.tab;
    renderTasks();
  });
});

// 鼠标拖尾
const trailContainer = document.getElementById('trail-container');
if (trailContainer) {
  document.addEventListener('mousemove', (e) => {
    const trail = document.createElement('div');
    trail.className = 'trail';
    trail.style.left = e.clientX - 4 + 'px';
    trail.style.top = e.clientY - 4 + 'px';
    trailContainer.appendChild(trail);
    setTimeout(() => trail.remove(), 800);
  });
}
async function fetchCombinedFortune() {
    try {
        const response = await fetch('/api/combined-fortune');
        const result = await response.json();
        if (result.success) {
            updateFortuneUI(result.data);
        } else {
            console.error('API返回错误:', result.message);
            // 降级处理：使用你原有的本地运势数据
            fallbackToLocalFortune();
        }
    } catch (error) {
        console.error('请求运势接口失败:', error);
        fallbackToLocalFortune();
    }
}
function updateFortuneUI(data) {
    // 更新天干地支（甲辰年）
    const yearGanZhi = data.lunar.split(' ')[0]; // 提取“丙午年”
    // 更新黄历信息
    chineseDate.textContent = `${yearGanZhi} ${data.date}`;
    // 更新生肖年（从天干地支里提取属相，或者你也可以用一个映射表）
    const animal = data.lunar.includes('马') ? '🐎 马' : '龙';
    animalYear.textContent = `${animal}年`;
    
    // 展示黄历的宜忌，并保留你原有的“运势”作为文案参考
    const fortuneHtml = `
        <div>✨ 五行：${data.chineseDate}</div>
        <div>👍 宜：${data.suits || '诸事皆宜'}</div>
        <div>👎 忌：${data.avoids || '百无禁忌'}</div>
        <hr style="margin: 8px 0; border-color: #ddd;">
        <div>⭐ 星座：${data.zodiac['今日一言'] || ''}</div>
    `;
    fortuneText.innerHTML = fortuneHtml;
    
    // 你也可以把“幸运颜色、幸运数字”等数据用在其他地方
    console.log('幸运颜色:', data.zodiac['幸运颜色']);
}

function fallbackToLocalFortune() {
    const fortunes = [
        '今日宜静不宜动，稳扎稳打方能成事。',
        '贵人运强，多与人交流或有机遇。',
        '财运小吉，但勿贪心，见好就收。',
        '桃花暗涌，单身者或有惊喜。',
        '注意口舌之争，退一步海阔天空。'
    ];
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(),0,0)) / 86400000);
    const fortune = fortunes[dayOfYear % fortunes.length];
    fortuneText.textContent = fortune;
}

// 启动
initAssistant();
loadTasks();
loadTasks();
