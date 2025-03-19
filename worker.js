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
];
async function handleRequest(request) {
    if (request.url.endsWith('/api/status')) {
        return getStatus();
    }
    if (request.url.endsWith('/')) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${MONITOR_NAME}</title>
    <link rel="stylesheet" href="/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo"><i class="fas fa-server"></i></div>
            <div class="monitor-name">${MONITOR_NAME}</div>
            <div class="countdown" id="countdown"></div>
            <div class="buttons">
                <a href="${GITHUB_URL}" target="_blank" class="button github-button"><i class="fab fa-github"></i> GitHub</a>
                <a href="${BLOG_URL}" target="_blank" class="button blog-button"><i class="fas fa-blog"></i> Blog</a>
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
        </div>
        <div id="status-list">
            <!-- Status items will be added here by JavaScript -->
        </div>
    </div>
    <footer>
        <p>站点状态每5分钟更新一次 | <span id="current-time"></span></p>
    </footer>
    <script src="/script.js"></script>
</body>
</html>`;
        return new Response(htmlContent, {
            headers: { 'Content-Type': 'text/html' },
        });
    }
    if (request.url.endsWith('/script.js')) {
        const scriptContent = `
const statusList = document.getElementById("status-list");
const countdownDisplay = document.getElementById("countdown");
const totalSitesDisplay = document.getElementById("total-sites");
const upSitesDisplay = document.getElementById("up-sites");
const downSitesDisplay = document.getElementById("down-sites");
const currentTimeDisplay = document.getElementById("current-time");
const refreshInterval = 300000; // 5 分钟，以毫秒为单位
let nextRefreshTime = Date.now() + refreshInterval;
// 更新当前时间
function updateCurrentTime() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    };
    currentTimeDisplay.textContent = now.toLocaleDateString('zh-CN', options);
}
function showLoading() {
    statusList.innerHTML = '';
    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('progress-bar-container');
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBarContainer.appendChild(progressBar);
    statusList.appendChild(progressBarContainer);
    // 模拟加载进度
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        progressBar.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 100);
}
async function fetchStatus() {
    showLoading();
    try {
        const response = await fetch("/api/status");
        const data = await response.json();
        renderStatus(data);
        updateSummary(data);
        nextRefreshTime = Date.now() + refreshInterval; // 更新下次刷新时间
    } catch (error) {
        console.error("Error fetching status:", error);
        statusList.innerHTML = '<div class="error">加载失败，请稍后重试</div>';
    }
}
function updateSummary(data) {
    const totalSites = data.length;
    const upSites = data.filter(site => site.isUp).length;
    const downSites = totalSites - upSites;
    
    totalSitesDisplay.textContent = totalSites;
    upSitesDisplay.textContent = upSites;
    downSitesDisplay.textContent = downSites;
}
function renderStatus(data) {
    statusList.innerHTML = "";
    
    data.forEach(site => {
        const statusItem = document.createElement("div");
        statusItem.classList.add("status-item");
        
        // 站点状态指示器
        const statusHeader = document.createElement("div");
        statusHeader.classList.add("status-header");
        
        const statusIndicator = document.createElement("div");
        statusIndicator.classList.add("status-indicator");
        statusIndicator.classList.add(site.isUp ? "up" : "down");
        
        const websiteName = document.createElement("div");
        websiteName.classList.add("website-name");
        websiteName.textContent = site.name;
        
        const statusText = document.createElement("div");
        statusText.classList.add("status-text");
        statusText.classList.add(site.isUp ? "up" : "down");
        statusText.textContent = site.isUp ? "正常" : "异常";
        
        statusHeader.appendChild(statusIndicator);
        statusHeader.appendChild(websiteName);
        statusHeader.appendChild(statusText);
        
        // 站点链接
        const statusLink = document.createElement("a");
        statusLink.href = site.url;
        statusLink.target = "_blank";
        statusLink.classList.add("status-link");
        statusLink.innerHTML = '<i class="fas fa-external-link-alt"></i> ' + site.url;
        
        // 状态历史图表
        const statusChart = document.createElement("div");
        statusChart.classList.add("status-chart");
        
        // 计算可用率
        const upCount = site.history.filter(status => status === 1).length;
        const availabilityRate = site.history.length > 0 ? ((upCount / site.history.length) * 100).toFixed(2) : 0;
        
        const chartHeader = document.createElement("div");
        chartHeader.classList.add("chart-header");
        
        const chartTitle = document.createElement("div");
        chartTitle.classList.add("chart-title");
        chartTitle.textContent = "过去60天可用率";
        
        const chartPercentage = document.createElement("div");
        chartPercentage.classList.add("chart-percentage");
        chartPercentage.textContent = availabilityRate + "%";
        
        chartHeader.appendChild(chartTitle);
        chartHeader.appendChild(chartPercentage);
        
        const statusBars = document.createElement("div");
        statusBars.classList.add("status-bars");
        
        // 创建60个状态点，前59个为灰色，最后一个根据当前状态显示
        for (let i = 0; i < 60; i++) {
            const bar = document.createElement("div");
            bar.classList.add("status-bar");
            
            if (i < 59) {
                // 前59个状态点显示为灰色，表示无数据
                bar.classList.add("no-data");
                bar.setAttribute("data-tooltip", "无数据");
            } else {
                // 第60个状态点根据当前状态显示
                const status = site.isUp ? 1 : 0;
                bar.classList.add(status === 1 ? "up" : "down");
                bar.setAttribute("data-tooltip", status === 1 ? "今天 - 正常" : "今天 - 异常");
            }
            
            statusBars.appendChild(bar);
        }
        
        statusChart.appendChild(chartHeader);
        statusChart.appendChild(statusBars);
        
        // 组装所有元素
        statusItem.appendChild(statusHeader);
        statusItem.appendChild(statusLink);
        statusItem.appendChild(statusChart);
        
        statusList.appendChild(statusItem);
    });
}
// 更新倒计时
function updateCountdown() {
    const now = Date.now();
    const timeLeft = nextRefreshTime - now;
    
    if (timeLeft <= 0) {
        fetchStatus(); // 时间到了，立即刷新
        countdownDisplay.textContent = "正在刷新...";
    } else {
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        countdownDisplay.innerHTML = \`<i class="fas fa-sync-alt"></i> \${minutes}分\${seconds}秒后刷新\`;
    }
}
// 初始化
fetchStatus(); // 首次加载
updateCurrentTime(); // 初始化当前时间
setInterval(updateCountdown, 1000); // 每秒更新倒计时
setInterval(updateCurrentTime, 1000); // 每秒更新当前时间
`;
        return new Response(scriptContent, {
            headers: { 'Content-Type': 'application/javascript' },
        });
    }
    if (request.url.endsWith('/style.css')) {
        const styleContent = `
:root {
    --primary-color: #1e88e5;
    --success-color: #4caf50;
    --warning-color: #ff9800;
    --danger-color: #f44336;
    --gray-color: #9e9e9e;
    --light-gray: #e0e0e0;
    --dark-gray: #424242;
    --background-color: #f5f5f5;
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
}

.container {
    max-width: 1000px;
    margin: 30px auto;
    padding: 20px;
}

.header {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
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
    background-color: var(--light-gray);
    padding: 8px 15px;
    border-radius: 20px;
    font-size: 14px;
    color: var(--dark-gray);
    margin-right: 15px;
    display: flex;
    align-items: center;
}

.countdown i {
    margin-right: 8px;
    animation: spin 4s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.buttons {
    display: flex;
}

.button {
    padding: 8px 16px;
    margin-left: 10px;
    border-radius: 20px;
    text-decoration: none;
    color: #fff;
    font-weight: bold;
    display: flex;
    align-items: center;
    transition: transform var(--transition-speed), box-shadow var(--transition-speed);
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

.status-summary {
    display: flex;
    justify-content: space-between;
    margin-bottom: 30px;
}

.summary-item {
    flex: 1;
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    padding: 20px;
    text-align: center;
    box-shadow: var(--box-shadow);
    margin: 0 10px;
    transition: transform var(--transition-speed);
}

.summary-item:hover {
    transform: translateY(-5px);
}

.summary-item:first-child {
    margin-left: 0;
    border-top: 3px solid var(--primary-color);
}

.summary-item:nth-child(2) {
    border-top: 3px solid var(--success-color);
}

.summary-item:last-child {
    margin-right: 0;
    border-top: 3px solid var(--danger-color);
}

.summary-value {
    font-size: 36px;
    font-weight: bold;
    margin-bottom: 10px;
}

.summary-label {
    font-size: 14px;
    color: var(--gray-color);
}

.status-item {
    background-color: var(--card-background);
    border-radius: var(--border-radius);
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: var(--box-shadow);
    transition: transform var(--transition-speed);
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
}

.status-text {
    font-size: 14px;
    font-weight: bold;
    padding: 4px 12px;
    border-radius: 20px;
}

.status-text.up {
    background-color: rgba(76, 175, 80, 0.1);
    color: var(--success-color);
}

.status-text.down {
    background-color: rgba(244, 67, 54, 0.1);
    color: var(--danger-color);
}

.status-link {
    display: block;
    color: var(--primary-color);
    text-decoration: none;
    margin-bottom: 15px;
    font-size: 14px;
    transition: color var(--transition-speed);
}

.status-link:hover {
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
}

.chart-percentage {
    font-size: 14px;
    font-weight: bold;
    color: var(--dark-gray);
}

.status-bars {
    display: flex;
    height: 30px;
    border-radius: 4px;
    overflow: hidden;
}

.status-bar {
    flex: 1;
    height: 30px; /* 可以根据需要调整高度 */
    margin: 0 1px;
    border-radius: 10px; /* 圆角效果 */
    transition: background-color var(--transition-speed);
    position: relative;
}

.status-bar:hover {
    transform: scaleY(1.2);
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

.status-bar::before {
    content: attr(data-tooltip);
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    padding: 5px 10px;
    background-color: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.3s;
    z-index: 10;
}

.status-bar:hover::before {
    visibility: visible;
    opacity: 1;
}

.progress-bar-container {
    width: 100%;
    height: 6px;
    background-color: var(--light-gray);
    border-radius: 3px;
    overflow: hidden;
    margin: 40px 0;
}

.progress-bar {
    height: 100%;
    width: 0;
    background-color: var(--primary-color);
    transition: width 0.3s ease;
}

.error {
    text-align: center;
    padding: 40px 0;
    color: var(--danger-color);
    font-weight: bold;
}

footer {
    text-align: center;
    padding: 20px;
    margin-top: 30px;
    color: var(--gray-color);
    font-size: 14px;
    border-top: 1px solid var(--light-gray);
}

/* 媒体查询：针对小屏幕 */
@media (max-width: 768px) {
    .container {
        padding: 15px;
        margin: 15px auto;
    }
    
    .header {
        flex-direction: column;
        align-items: flex-start;
    }
    
    .logo {
        margin-bottom: 10px;
    }
    
    .monitor-name {
        margin-bottom: 15px;
    }
    
    .countdown {
        margin-bottom: 15px;
        margin-right: 0;
    }
    
    .buttons {
        width: 100%;
        justify-content: space-between;
    }
    
    .button {
        margin-left: 0;
    }
    
    .status-summary {
        flex-direction: column;
    }
    
    .summary-item {
        margin: 0 0 15px 0;
    }
    
    .status-header {
        flex-wrap: wrap;
    }
    
    .website-name {
        width: 100%;
        margin-bottom: 10px;
    }
    
    .status-text {
        margin-left: auto;
    }
}
`;
return new Response(styleContent, {
    headers: { 'Content-Type': 'text/css' },
});
}
return new Response('Not Found', { status: 404 });
}
const fetchWithTimeout = async (url, options, timeout = 5000) => {
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), timeout);
try {
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeoutId);
return response;
} catch (error) {
clearTimeout(timeoutId);
throw error;
}
};
async function getStatus() {
const statusData = await Promise.all(
SITES.map(async (site) => {
    const key = `status:${site.url}`;
    let history = [];
    try {
        const response = await fetchWithTimeout(site.url, { method: 'HEAD', headers: { 'User-Agent': 'Cloudflare-Worker' } }, 5000);
        const isUp = response.status === 200;
        let historyString = await STATUS.get(key);
        history = historyString ? JSON.parse(historyString) : [];
        if (history.length >= 60) {
            history.shift();
        }
        history.push(isUp ? 1 : 0);
        await STATUS.put(key, JSON.stringify(history));
        return { url: site.url, name: site.name, isUp: isUp, history: history };
    } catch (error) {
        console.error(`Error checking ${site.url}:`, error);
        let historyString = await STATUS.get(key);
        history = historyString ? JSON.parse(historyString) : [];
        if (history.length >= 60) {
            history.shift();
        }
        history.push(0);
        await STATUS.put(key, JSON.stringify(history));
        return { url: site.url, name: site.name, isUp: false, history: history };
    }
})
);
return new Response(JSON.stringify(statusData), {
headers: { 'Content-Type': 'application/json' },
});
}
