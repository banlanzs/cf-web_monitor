addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

const GITHUB_URL = 'https://github.com/';
const BLOG_URL = ''; // 这里可以根据需要填写
const MONITOR_NAME = 'BANLAN站点监测';
const SITES = [
  { url: 'https://linux.do/', name: 'LINUXDO' },
  { url: 'https://github.com/', name: 'GitHub' },
  { url: 'https://www.baidu.com/', name: '百度' },
  { url: 'https://www.nodeloc.com/', name: 'NodeLoc' },
];

// 检查频率（毫秒）
const CHECK_INTERVAL = 300000; // 5分钟

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === '/api/status') {
    return getStatus();
  }
  
  if (path === '/api/check') {
    // 手动触发检查
    return checkAllSites();
  }
  
  if (path === '/' || path === '') {
    return getIndexPage();
  }
  
  if (path === '/script.js') {
    return getScriptFile();
  }
  
  if (path === '/style.css') {
    return getStyleFile();
  }
  
  return new Response('Not Found', { status: 404 });
}

async function getIndexPage() {
  const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${MONITOR_NAME}</title>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
  <link rel="icon" href="https://img.131213.xyz/api/cfile/AgACAgUAAx0Eflp52gACgPtn2-_0Hx0ddICG7vNJURR3gtCumgACKsUxG-7v4Fak6tALKtotUwEAAwIAA3kAAzYE" type="image/x-icon">
  <meta name="description" content="实时监控网站状态，提供可靠性报告和性能指标">
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo"><i class="fas fa-server"></i></div>
      <div class="monitor-name">${MONITOR_NAME}</div>
      <div class="countdown" id="countdown"><i class="fas fa-sync-alt"></i> 加载中...</div>
      <div class="buttons">
        <a href="${GITHUB_URL}" target="_blank" class="button github-button"><i class="fab fa-github"></i> GitHub</a>
        <a href="${BLOG_URL}" target="_blank" class="button blog-button"><i class="fas fa-blog"></i> Blog</a>
        <button id="refresh-now" class="button refresh-button"><i class="fas fa-redo-alt"></i> 立即刷新</button>
      </div>
    </div>
    
    <div class="status-summary">
      <div class="summary-item">
        <div class="summary-value" id="total-sites">0</div>
        <div class="summary-label">监控站点</div>
      </div>
      <div class="summary-item">
        <div class="summary-value" id="up-sites">0</div>
        <div class="summary-label">正常运行</div>
      </div>
      <div class="summary-item">
        <div class="summary-value" id="down-sites">0</div>
        <div class="summary-label">异常站点</div>
      </div>
      <div class="summary-item">
        <div class="summary-value" id="avg-response">0</div>
        <div class="summary-label">平均响应(ms)</div>
      </div>
    </div>
    
    <div class="filter-bar">
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input type="text" id="search-input" placeholder="搜索站点...">
      </div>
      <div class="filter-buttons">
        <button class="filter-btn active" data-filter="all">全部</button>
        <button class="filter-btn" data-filter="up">正常</button>
        <button class="filter-btn" data-filter="down">异常</button>
      </div>
    </div>
    
    <div id="status-list">
      <!-- 状态项将通过JavaScript添加 -->
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>加载监控数据中...</p>
      </div>
    </div>
  </div>
  
  <div id="incident-modal" class="modal">
    <div class="modal-content">
      <span class="close-modal">&times;</span>
      <h2 id="incident-site-name">站点事件历史</h2>
      <div class="incident-timeline" id="incident-timeline">
        <!-- 事件时间线将通过JavaScript添加 -->
      </div>
    </div>
  </div>
  
  <footer>
    <div class="footer-content">
      <p>站点状态每5分钟更新一次 | <span id="current-time"></span></p>
      <p>最后检查: <span id="last-check-time">加载中...</span></p>
    </div>
  </footer>
  
  <script src="/script.js"></script>
</body>
</html>`;

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

async function getScriptFile() {
  const scriptContent = `
// 全局变量
const statusList = document.getElementById("status-list");
const countdownDisplay = document.getElementById("countdown");
const totalSitesDisplay = document.getElementById("total-sites");
const upSitesDisplay = document.getElementById("up-sites");
const downSitesDisplay = document.getElementById("down-sites");
const avgResponseDisplay = document.getElementById("avg-response");
const currentTimeDisplay = document.getElementById("current-time");
const lastCheckTimeDisplay = document.getElementById("last-check-time");
const searchInput = document.getElementById("search-input");
const refreshButton = document.getElementById("refresh-now");
const filterButtons = document.querySelectorAll(".filter-btn");
const modal = document.getElementById("incident-modal");
const closeModal = document.querySelector(".close-modal");

// 配置
const refreshInterval = 300000; // 5分钟，以毫秒为单位
let nextRefreshTime = Date.now() + refreshInterval;
let statusData = []; // 存储最新的状态数据
let currentFilter = 'all'; // 当前筛选器状态

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  fetchStatus();
  updateCurrentTime();
  setInterval(updateCountdown, 1000);
  setInterval(updateCurrentTime, 1000);
  
  // 事件监听器
  refreshButton.addEventListener('click', manualRefresh);
  searchInput.addEventListener('input', filterSites);
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      filterSites();
    });
  });
  
  // 关闭模态框
  closeModal.addEventListener('click', () => {
    modal.style.display = "none";
  });
  
  // 点击模态框外部关闭
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  });
});

// 手动刷新
function manualRefresh() {
  refreshButton.disabled = true;
  refreshButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 刷新中...';
  
  fetch('/api/check')
    .then(response => response.json())
    .then(data => {
      statusData = data;
      renderStatus(data);
      updateSummary(data);
      nextRefreshTime = Date.now() + refreshInterval;
      
      refreshButton.disabled = false;
      refreshButton.innerHTML = '<i class="fas fa-redo-alt"></i> 立即刷新';
      
      // 显示成功消息
      showNotification('刷新成功', 'success');
    })
    .catch(error => {
      console.error("刷新失败:", error);
      refreshButton.disabled = false;
      refreshButton.innerHTML = '<i class="fas fa-redo-alt"></i> 立即刷新';
      
      // 显示错误消息
      showNotification('刷新失败，请稍后重试', 'error');
    });
}

// 显示通知
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = \`notification \${type}\`;
  notification.innerHTML = \`
    <div class="notification-icon">
      <i class="fas \${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    </div>
    <div class="notification-message">\${message}</div>
  \`;
  
  document.body.appendChild(notification);
  
  // 动画显示
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // 3秒后消失
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// 更新当前时间
function updateCurrentTime() {
  const now = new Date();
  const options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    hour12: false
  };
  currentTimeDisplay.textContent = now.toLocaleDateString('zh-CN', options);
}

// 显示加载动画
function showLoading() {
  statusList.innerHTML = \`
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>加载监控数据中...</p>
    </div>
  \`;
}

// 获取状态数据
async function fetchStatus() {
  showLoading();
  
  try {
    const response = await fetch("/api/status");
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    
    const data = await response.json();
    statusData = data; // 保存数据到全局变量
    
    renderStatus(data);
    updateSummary(data);
    updateLastCheckTime(data);
    nextRefreshTime = Date.now() + refreshInterval;
  } catch (error) {
    console.error("获取状态数据失败:", error);
    statusList.innerHTML = \`
      <div class="error-container">
        <i class="fas fa-exclamation-triangle"></i>
        <p>加载失败，请稍后重试</p>
        <button id="retry-button" class="retry-button">重试</button>
      </div>
    \`;
    
    document.getElementById("retry-button").addEventListener('click', fetchStatus);
  }
}

// 更新最后检查时间
function updateLastCheckTime(data) {
  if (data && data.length > 0 && data[0].lastCheck) {
    const lastCheck = new Date(data[0].lastCheck);
    const options = { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    };
    lastCheckTimeDisplay.textContent = lastCheck.toLocaleDateString('zh-CN', options);
  } else {
    lastCheckTimeDisplay.textContent = "未知";
  }
}

// 更新统计摘要
function updateSummary(data) {
  const totalSites = data.length;
  const upSites = data.filter(site => site.isUp).length;
  const downSites = totalSites - upSites;
  
  // 计算平均响应时间（只考虑正常运行的站点）
  const responseTimes = data
    .filter(site => site.isUp && site.responseTime)
    .map(site => site.responseTime);
  
  let avgResponse = 0;
  if (responseTimes.length > 0) {
    avgResponse = Math.round(responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length);
  }
  
  // 使用动画更新数值
  animateValue(totalSitesDisplay, parseInt(totalSitesDisplay.textContent) || 0, totalSites, 500);
  animateValue(upSitesDisplay, parseInt(upSitesDisplay.textContent) || 0, upSites, 500);
  animateValue(downSitesDisplay, parseInt(downSitesDisplay.textContent) || 0, downSites, 500);
  animateValue(avgResponseDisplay, parseInt(avgResponseDisplay.textContent) || 0, avgResponse, 500);
}

// 数值动画
function animateValue(element, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const value = Math.floor(progress * (end - start) + start);
    element.textContent = value;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}

// 渲染状态列表
function renderStatus(data) {
  statusList.innerHTML = "";
  
  if (data.length === 0) {
    statusList.innerHTML = \`
      <div class="empty-state">
        <i class="fas fa-radar"></i>
        <p>没有监控数据</p>
      </div>
    \`;
    return;
  }
  
  // 应用筛选
  let filteredData = [...data];
  
  // 应用搜索筛选
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    filteredData = filteredData.filter(site => 
      site.name.toLowerCase().includes(searchTerm) || 
      site.url.toLowerCase().includes(searchTerm)
    );
  }
  
  // 应用状态筛选
  if (currentFilter === 'up') {
    filteredData = filteredData.filter(site => site.isUp);
  } else if (currentFilter === 'down') {
    filteredData = filteredData.filter(site => !site.isUp);
  }
  
  if (filteredData.length === 0) {
    statusList.innerHTML = \`
      <div class="empty-state">
        <i class="fas fa-filter"></i>
        <p>没有符合条件的站点</p>
      </div>
    \`;
    return;
  }
  
  // 创建状态卡片
  filteredData.forEach(site => {
    const statusItem = document.createElement("div");
    statusItem.classList.add("status-item");
    statusItem.classList.add(site.isUp ? "up" : "down");
    
    // 计算可用率
    const upCount = site.history.filter(status => status === 1).length;
    const availabilityRate = site.history.length > 0 ? ((upCount / site.history.length) * 100).toFixed(2) : "N/A";
    
    // 计算平均响应时间
    let avgResponseTime = "N/A";
    const validResponseTimes = site.responseTimes?.filter(time => time !== null && time !== undefined);
    if (validResponseTimes && validResponseTimes.length > 0) {
      avgResponseTime = Math.round(validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length);
    }
    
    // 确定状态标签和图标
    let statusLabel, statusIcon;
    if (site.isUp) {
      statusLabel = "正常运行";
      statusIcon = "fa-check-circle";
    } else {
      statusLabel = "异常";
      statusIcon = "fa-exclamation-circle";
    }
    
    statusItem.innerHTML = \`
      <div class="status-header">
        <div class="status-indicator \${site.isUp ? 'up' : 'down'}"></div>
        <div class="website-name">\${site.name}</div>
        <div class="status-badge \${site.isUp ? 'up' : 'down'}">
          <i class="fas \${statusIcon}"></i> \${statusLabel}
        </div>
      </div>
      
      <div class="status-details">
        <div class="status-url">
          <a href="\${site.url}" target="_blank" rel="noopener">
            <i class="fas fa-external-link-alt"></i> \${site.url}
          </a>
        </div>
        
        <div class="status-metrics">
          <div class="metric">
            <div class="metric-label">可用率</div>
            <div class="metric-value">\${availabilityRate}%</div>
          </div>
          <div class="metric">
            <div class="metric-label">响应时间</div>
            <div class="metric-value">\${site.isUp ? (site.responseTime ? site.responseTime + 'ms' : 'N/A') : 'N/A'}</div>
          </div>
          <div class="metric">
            <div class="metric-label">平均响应</div>
            <div class="metric-value">\${avgResponseTime !== "N/A" ? avgResponseTime + 'ms' : 'N/A'}</div>
          </div>
        </div>
      </div>
      
      <div class="status-chart">
        <div class="chart-header">
          <div class="chart-title">过去60次请求状态历史</div>
          <button class="view-incidents-btn" data-site="\${site.name}">
            <i class="fas fa-history"></i> 查看事件
          </button>
        </div>
        <div class="status-bars">
          \${generateStatusBars(site.history)}
        </div>
      </div>
    \`;
    
    statusList.appendChild(statusItem);
    
    // 添加事件查看按钮事件
    const incidentBtn = statusItem.querySelector('.view-incidents-btn');
    incidentBtn.addEventListener('click', () => {
      showIncidentModal(site);
    });
  });
}

// 生成状态条
function generateStatusBars(history) {
  let barsHTML = '';
  
  // 确保历史记录是数组
  const historyArray = Array.isArray(history) ? history : [];
  
//   // 从最旧到最新显示，最新的在最右边
//   for (let i = 0; i < 24; i++) {
//     const index = historyArray.length - 24 + i;
    
//     if (index >= 0 && index < historyArray.length) {
//       const status = historyArray[index];
//       const statusClass = status === 1 ? 'up' : 'down';
//       const daysAgo = historyArray.length - 1 - index;
//       const tooltipText = daysAgo === 0 ? '最新' : \`\${daysAgo}次检查前\`;
      
//       barsHTML += \`
//         <div class="status-bar \${statusClass}" data-tooltip="\${tooltipText}: \${status === 1 ? '正常' : '异常'}"></div>
//       \`;
//     } else {
//       // 无数据
//       barsHTML += \`<div class="status-bar no-data" data-tooltip="无数据"></div>\`;
//     }
//   }
  
//   return barsHTML;
// }
// 从最新到最旧显示，最新的在最右边
  const totalDays = 60; // 显示过去60天的状态
  const currentDate = new Date();
  
  // 填充状态条
  for (let i = totalDays - 1; i >= 0; i--) {
    const dateToCheck = new Date(currentDate);
    dateToCheck.setDate(currentDate.getDate() - i); // 计算过去的日期
    const dayIndex = historyArray.length - 1 - i; // 计算对应的历史记录索引
    
    if (dayIndex >= 0 && dayIndex < historyArray.length) {
      const status = historyArray[dayIndex];
      const statusClass = status === 1 ? 'up' : 'down';
      const tooltipText = '日期: ' + dateToCheck.toLocaleDateString() + ' - 状态: ' + (status === 1 ? '正常' : '异常');
      
      barsHTML += '<div class="status-bar ' + statusClass + '" data-tooltip="' + tooltipText + '"></div>';
    } else {
      // 无数据
      barsHTML += '<div class="status-bar no-data" data-tooltip="无数据"></div>';
    }
  }
  
  return barsHTML;
}

// 计算可用率
function calculateAvailabilityRate(history) {
  const upCount = history.filter(status => status === 1).length;
  const totalCount = history.length;
  return totalCount > 0 ? ((upCount / totalCount) * 100).toFixed(2) : 0;
}
// 显示事件模态框
function showIncidentModal(site) {
  const modalTitle = document.getElementById('incident-site-name');
  const timeline = document.getElementById('incident-timeline');
  
  modalTitle.textContent = \`\${site.name} - 事件历史\`;
  
  // 清空时间线
  timeline.innerHTML = '';
  
  // 构建事件时间线
  if (!site.incidents || site.incidents.length === 0) {
    timeline.innerHTML = '<div class="empty-incidents">没有记录的事件</div>';
  } else {
    // 按时间倒序排列事件
    const sortedIncidents = [...site.incidents].sort((a, b) => 
      new Date(b.startTime) - new Date(a.startTime)
    );
    
    sortedIncidents.forEach(incident => {
      const incidentItem = document.createElement('div');
      incidentItem.className = 'incident-item';
      
      const startDate = new Date(incident.startTime);
      const endDate = incident.endTime ? new Date(incident.endTime) : null;
      
      const duration = endDate 
        ? calculateDuration(startDate, endDate)
        : '正在进行';
      
      incidentItem.innerHTML = \`
        <div class="incident-dot \${incident.resolved ? 'resolved' : 'ongoing'}"></div>
        <div class="incident-content">
          <div class="incident-header">
            <span class="incident-status \${incident.resolved ? 'resolved' : 'ongoing'}">
              \${incident.resolved ? '已解决' : '正在进行'}
            </span>
            <span class="incident-time">\${formatDate(startDate)}</span>
          </div>
          <div class="incident-body">
            <p class="incident-message">\${incident.message || '站点不可访问'}</p>
            <p class="incident-duration">
              <i class="fas fa-clock"></i> 持续时间: \${duration}
            </p>
            \${incident.resolved ? \`<p class="incident-resolution-time">解决于: \${formatDate(endDate)}</p>\` : ''}
          </div>
        </div>
      \`;
      
      timeline.appendChild(incidentItem);
    });
  }
  
  // 显示模态框
  modal.style.display = "block";
}

// 计算持续时间
function calculateDuration(startDate, endDate) {
  const diff = endDate - startDate; // 毫秒差
  
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return \`\${seconds}秒\`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return \`\${minutes}分钟\`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return \`\${hours}小时 \${minutes % 60}分钟\`;
  
  const days = Math.floor(hours / 24);
  return \`\${days}天 \${hours % 24}小时\`;
}

// 格式化日期
function formatDate(date) {
  if (!date) return 'N/A';
  
  const options = { 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  };
  
  return date.toLocaleDateString('zh-CN', options);
}

// 筛选站点
function filterSites() {
  renderStatus(statusData);
}

// 更新倒计时
function updateCountdown() {
  const now = Date.now();
  const timeLeft = nextRefreshTime - now;
  
  if (timeLeft <= 0) {
    fetchStatus(); // 时间到了，立即刷新
    countdownDisplay.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> 正在刷新...';
  } else {
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    countdownDisplay.innerHTML = \`<i class="fas fa-sync-alt"></i> \${minutes}分\${seconds}秒后刷新\`;
  }
}
`;

  return new Response(scriptContent, {
    headers: { 'Content-Type': 'application/javascript' },
  });
}

async function getStyleFile() {
  const styleContent = `
:root {
  --primary-color: #1e88e5;
  --primary-light: #e3f2fd;
  --success-color: #4caf50;
  --success-light: #e8f5e9;
  --warning-color: #ff9800;
  --warning-light: #fff3e0;
  --danger-color: #f44336;
  --danger-light: #ffebee;
  --gray-color: #9e9e9e;
  --light-gray: #e0e0e0;
  --dark-gray: #424242;
  --background-color: #f5f7fa;
  --card-background: #ffffff;
  --text-color: #333333;
  --border-radius: 8px;
  --box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  --transition-speed: 0.3s;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: var(--background-color);
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
  padding: 0;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  flex: 1;
}

/* 头部样式 */
.header {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
}

.logo {
  font-size: 28px;
  color: var(--primary-color);
  margin-right: 15px;
}

.monitor-name {
  font-size: 24px;
  font-weight: bold;
  color: var(--dark-gray);
  margin-right: auto;
}

.countdown {
  background-color: var(--primary-light);
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  color: var(--primary-color);
  display: flex;
  align-items: center;
  font-weight: 500;
}

.countdown i {
  margin-right: 8px;
}

.buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.button {
  padding: 8px 16px;
  border-radius: 20px;
  text-decoration: none;
  color: #fff;
  font-weight: 500;
  display: flex;
  align-items: center;
  transition: transform var(--transition-speed), box-shadow var(--transition-speed);
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.button i {
  margin-right: 8px;
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.github-button {
  background-color: #24292e;
}

.blog-button {
  background-color: var(--primary-color);
}

.refresh-button {
  background-color: var(--success-color);
}

.refresh-button:disabled {
  background-color: var(--gray-color);
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 状态摘要样式 */
.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 30px;
}

.summary-item {
  flex: 1;
  min-width: 200px;
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 20px;
  text-align: center;
  box-shadow: var(--box-shadow);
  transition: transform var(--transition-speed);
}

.summary-item:hover {
  transform: translateY(-5px);
}

.summary-item:nth-child(1) {
  border-top: 3px solid var(--primary-color);
}

.summary-item:nth-child(2) {
  border-top: 3px solid var(--success-color);
}

.summary-item:nth-child(3) {
  border-top: 3px solid var(--danger-color);
}

.summary-item:nth-child(4) {
  border-top: 3px solid var(--warning-color);
}

.summary-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 10px;
  color: var(--dark-gray);
}

.summary-label {
  font-size: 14px;
  color: var(--gray-color);
  font-weight: 500;
}

/* 筛选栏样式 */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  background-color: var(--card-background);
  padding: 10px 20px;
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box i {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-color);
}

#search-input {
  width: 100%;
  padding: 8px 8px 8px 35px;
  border: 1px solid var(--light-gray);
  border-radius: 20px;
  font-size: 14px;
  transition: border-color var(--transition-speed);
}

#search-input:focus {
  outline: none;
  border-color: var(--primary-color);
}

.filter-buttons {
  display: flex;
  gap: 10px;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  background-color: var(--light-gray);
  color: var(--dark-gray);
  border-radius: 20px;
  cursor: pointer;
  transition: background-color var(--transition-speed), color var(--transition-speed);
  font-weight: 500;
  font-size: 14px;
}

.filter-btn.active {
  background-color: var(--primary-color);
  color: white;
}

/* 状态项样式 */
.status-item {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: var(--box-shadow);
  transition: transform var(--transition-speed), box-shadow var(--transition-speed);
  border-left: 5px solid transparent;
}

.status-item.up {
  border-left-color: var(--success-color);
}

.status-item.down {
  border-left-color: var(--danger-color);
}

.status-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.status-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.status-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  margin-right: 15px;
}

.status-indicator.up {
  background-color: var(--success-color);
  box-shadow: 0 0 10px var(--success-color);
}

.status-indicator.down {
  background-color: var(--danger-color);
  box-shadow: 0 0 10px var(--danger-color);
}

.website-name {
  font-size: 18px;
  font-weight: bold;
  margin-right: auto;
  color: var(--dark-gray);
}

.status-badge {
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.status-badge.up {
  background-color: var(--success-light);
  color: var(--success-color);
}

.status-badge.down {
  background-color: var(--danger-light);
  color: var(--danger-color);
}

.status-details {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.status-url {
  font-size: 14px;
}

.status-url a {
  color: var(--primary-color);
  text-decoration: none;
  transition: color var(--transition-speed);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.status-url a:hover {
  color: var(--dark-gray);
  text-decoration: underline;
}

.status-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.metric {
  flex: 1;
  min-width: 100px;
  background-color: var(--background-color);
  padding: 10px;
  border-radius: var(--border-radius);
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: var(--gray-color);
  margin-bottom: 5px;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: var(--dark-gray);
}

.status-chart {
  margin-top: 15px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.chart-title {
  font-size: 14px;
  color: var(--gray-color);
  font-weight: 500;
}

.view-incidents-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.view-incidents-btn:hover {
  text-decoration: underline;
}

.status-bars {
  display: flex;
  height: 30px;
  border-radius: 4px;
  overflow: hidden;
  gap: 3px;
}

.status-bar {
  flex: 1;
  height: 30px;
  border-radius: 3px;
  transition: transform 0.2s, opacity 0.2s;
  position: relative;
}

.status-bar:hover {
  transform: scaleY(1.2);
  opacity: 0.9;
}

.status-bar.up {
  background-color: var(--success-color);
}

.status-bar.down {
  background-color: var(--danger-color);
}

.status-bar.no-data {
  background-color: var(--light-gray);
}

.status-bar::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.3s, visibility 0.3s;
  pointer-events: none;
  z-index: 100;
}

.status-bar:hover::after {
  opacity: 1;
  visibility: visible;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  color: var(--gray-color);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--light-gray);
  border-top: 4px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 错误状态 */
.error-container {
  text-align: center;
  padding: 50px 0;
  color: var(--danger-color);
}

.error-container i {
  font-size: 40px;
  margin-bottom: 15px;
}

.retry-button {
  margin-top: 15px;
  padding: 8px 20px;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 500;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 50px 0;
  color: var(--gray-color);
}

.empty-state i {
  font-size: 40px;
  margin-bottom: 15px;
}

/* 页脚样式 */
footer {
  background-color: var(--card-background);
  padding: 15px 0;
  text-align: center;
  margin-top: 30px;
  border-top: 1px solid var(--light-gray);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  color: var(--gray-color);
  font-size: 14px;
}

/* 模态框样式 */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  overflow: auto;
}

.modal-content {
  background-color: var(--card-background);
  margin: 5% auto;
  padding: 25px;
  border-radius: var(--border-radius);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 800px;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.close-modal {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 24px;
  font-weight: bold;
  color: var(--gray-color);
  cursor: pointer;
}

.close-modal:hover {
  color: var(--dark-gray);
}

#incident-site-name {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--light-gray);
  color: var(--dark-gray);
}

.incident-timeline {
  position: relative;
  padding-left: 30px;
}

.incident-timeline::before {
  content: '';
  position: absolute;
  left: 10px;
  top: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--light-gray);
}

.incident-item {
  position: relative;
  margin-bottom: 25px;
  display: flex;
}

.incident-dot {
  position: absolute;
  left: -30px;
  top: 5px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: white;
  border: 2px solid;
  z-index: 1;
}

.incident-dot.resolved {
  border-color: var(--success-color);
}

.incident-dot.ongoing {
  border-color: var(--danger-color);
}

.incident-content {
  flex: 1;
  background-color: var(--background-color);
  padding: 15px;
  border-radius: var(--border-radius);
}

.incident-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.incident-status {
  font-size: 13px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 15px;
}

.incident-status.resolved {
  background-color: var(--success-light);
  color: var(--success-color);
}

.incident-status.ongoing {
  background-color: var(--danger-light);
  color: var(--danger-color);
}

.incident-time {
  font-size: 13px;
  color: var(--gray-color);
}

.incident-body {
  font-size: 14px;
}

.incident-message {
  margin-bottom: 10px;
  color: var(--dark-gray);
}

.incident-duration, .incident-resolution-time {
  color: var(--gray-color);
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
}

.empty-incidents {
  text-align: center;
  padding: 30px 0;
  color: var(--gray-color);
  font-style: italic;
}

/* 通知样式 */
.notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  padding: 15px 20px;
  border-radius: var(--border-radius);
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transform: translateY(100px);
  opacity: 0;
  transition: transform 0.3s, opacity 0.3s;
}

.notification.show {
  transform: translateY(0);
  opacity: 1;
}

.notification.success {
  border-left: 4px solid var(--success-color);
}

.notification.error {
  border-left: 4px solid var(--danger-color);
}

.notification.info {
  border-left: 4px solid var(--primary-color);
}

.notification-icon {
  margin-right: 15px;
  font-size: 20px;
}

.notification.success .notification-icon {
  color: var(--success-color);
}

.notification.error .notification-icon {
  color: var(--danger-color);
}

.notification.info .notification-icon {
  color: var(--primary-color);
}

.notification-message {
  font-size: 14px;
  color: var(--dark-gray);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .container {
    padding: 15px;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .logo, .monitor-name {
    margin-bottom: 10px;
  }
  
  .countdown {
    margin-bottom: 15px;
    width: 100%;
    justify-content: center;
  }
  
  .buttons {
    width: 100%;
    justify-content: center;
  }
  
  .summary-item {
    min-width: 100%;
  }
  
  .filter-bar {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-box {
    max-width: 100%;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .status-metrics {
    flex-direction: column;
    gap: 10px;
  }
  
  .metric {
    min-width: 100%;
  }
  
  .modal-content {
    width: 95%;
    margin: 10% auto;
    padding: 15px;
  }
}
`;

  return new Response(styleContent, {
    headers: { 'Content-Type': 'text/css' },
  });
}

async function checkAllSites() {
  try {
    const results = await Promise.all(
      SITES.map(async (site) => {
        const result = await checkSite(site);
        return result;
      })
    );
    
    return new Response(JSON.stringify(results), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function checkSite(site) {
  const key = `status:${site.url}`;
  let history = [];
  let responseTimes = [];
  let incidents = [];
  let currentIncident = null;
  
  try {
    // 从 KV 获取历史数据
    const storedData = await STATUS.get(key, { type: 'json' });
    
    if (storedData) {
      history = storedData.history || [];
      responseTimes = storedData.responseTimes || [];
      incidents = storedData.incidents || [];
      currentIncident = storedData.currentIncident || null;
    }
    
    // 检查站点状态
    let isUp = false;
    let statusCode = 0;
    let responseTime = null;
    let errorMessage = null;
    
    try {
      const startTime = Date.now();
      const response = await fetchWithTimeout(
        site.url,
        { 
          method: 'HEAD', 
          headers: { 'User-Agent': 'UptimeMonitor/1.0' },
          redirect: 'follow'
        },
        10000 // 10秒超时
      );
      
      responseTime = Date.now() - startTime;
      statusCode = response.status;
      
      // 2xx 和 3xx 状态码都视为正常
      isUp = response.status >= 200 && response.status < 400;
    } catch (error) {
      console.error(`Error checking ${site.url}:`, error);
      errorMessage = error.message || "连接失败";
      isUp = false;
    }
    
    // 更新历史记录
    history.push(isUp ? 1 : 0);
    if (history.length > 60) {
      history.shift(); // 保留最近60次检查结果
    }
    
    // 更新响应时间记录
    responseTimes.push(responseTime);
    if (responseTimes.length > 30) {
      responseTimes.shift(); // 保留最近30次响应时间
    }
    
    // 处理事件记录
    const now = new Date().toISOString();
    
    // 如果站点从正常变为异常，创建新事件
    if (isUp === false && (history.length <= 1 || history[history.length - 2] === 1)) {
      currentIncident = {
        id: Date.now().toString(),
        startTime: now,
        endTime: null,
        resolved: false,
        message: errorMessage || `HTTP错误: ${statusCode || '连接失败'}`
      };
      incidents.push(currentIncident);
    }
    // 如果站点从异常变为正常，结束当前事件
    else if (isUp === true && currentIncident && !currentIncident.resolved) {
      currentIncident.endTime = now;
      currentIncident.resolved = true;
      
      // 更新incidents数组中的对应事件
      const index = incidents.findIndex(inc => inc.id === currentIncident.id);
      if (index !== -1) {
        incidents[index] = currentIncident;
      }
      
      currentIncident = null;
    }
    
    // 限制存储的事件数量
    if (incidents.length > 20) {
      incidents = incidents.slice(-20);
    }
    
    // 保存到KV
    await STATUS.put(key, JSON.stringify({
      history,
      responseTimes,
      incidents,
      currentIncident,
      lastCheck: now
    }));
    
    return {
      url: site.url,
      name: site.name,
      isUp,
      statusCode,
      responseTime,
      errorMessage,
      history,
      responseTimes,
      incidents,
      lastCheck: now
    };
  } catch (error) {
    console.error(`Error processing ${site.url}:`, error);
    
    // 发生错误时，依然记录为 down
    history.push(0);
    if (history.length > 60) {
      history.shift();
    }
    
    return {
      url: site.url,
      name: site.name,
      isUp: false,
      statusCode: 0,
      responseTime: null,
      errorMessage: error.message || "处理错误",
      history,
      responseTimes,
      incidents,
      lastCheck: new Date().toISOString()
    };
  }
}

async function getStatus() {
  try {
    const results = await Promise.all(
      SITES.map(async (site) => {
        const key = `status:${site.url}`;
        const storedData = await STATUS.get(key, { type: 'json' });
        
        if (!storedData) {
          // 如果没有数据，执行首次检查
          return checkSite(site);
        }
        
        // 检查上次检查时间，如果超过检查间隔，则重新检查
        const lastCheck = new Date(storedData.lastCheck || 0);
        const now = new Date();
        const timeSinceLastCheck = now - lastCheck;
        
        if (timeSinceLastCheck > CHECK_INTERVAL) {
          return checkSite(site);
        }
        
        // 否则返回存储的数据
        return {
          url: site.url,
          name: site.name,
          isUp: storedData.history ? storedData.history[storedData.history.length - 1] === 1 : false,
          statusCode: storedData.statusCode || 0,
          responseTime: storedData.responseTimes ? storedData.responseTimes[storedData.responseTimes.length - 1] : null,
          history: storedData.history || [],
          responseTimes: storedData.responseTimes || [],
          incidents: storedData.incidents || [],
          lastCheck: storedData.lastCheck
        };
      })
    );
    
    return new Response(JSON.stringify(results), {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// 辅助函数：带超时的fetch
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      ...options, 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};
