addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

const GITHUB_URL = 'https://github.com/';//
const BLOG_URL = '';//瞎加的，想写成什么就写什么
const MONITOR_NAME = ' 站点监测';

const SITES = [
    { url: 'https://example.com/', name: 'example' },
    { url: 'https://github.com/', name: 'github' },
    { url: 'https://www.baidu.com/', name: '百度' },
];

async function handleRequest(request) {
    if (request.url.endsWith('/api/status')) {//json（原始请求数据）
        return getStatus();
    }

    if (request.url.endsWith('/')) {
        const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${MONITOR_NAME}</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="monitor-name">${MONITOR_NAME}</div>
            <div class="countdown" id="countdown"></div>  <!-- 添加倒计时元素 -->
            <div class="buttons">
                <a href="${GITHUB_URL}" target="_blank" class="button github-button"><i class="fab fa-github"></i> GitHub</a>
                <a href="${BLOG_URL}" target="_blank" class="button blog-button"><i class="fas fa-blog"></i>Blog</a>
            </div>
        </div>
        <div id="status-list">
            <!-- Status items will be added here by JavaScript -->
        </div>
    </div>
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
const countdownDisplay = document.getElementById("countdown"); // 获取倒计时元素
const refreshInterval = 300000; // 5 分钟，以毫秒为单位
let nextRefreshTime = Date.now() + refreshInterval;

function showLoading() {
    statusList.innerHTML = '';

    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('progress-bar-container');

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBarContainer.appendChild(progressBar);

    statusList.appendChild(progressBarContainer);

    // 模拟加载进度（可选）
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        progressBar.style.width = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
        }
    }, 300); // 调整进度更新频率
}

async function fetchStatus() {
    showLoading();
    try {
        const response = await fetch("/api/status");
        const data = await response.json();
        renderStatus(data);
        nextRefreshTime = Date.now() + refreshInterval; // 更新下次刷新时间
    } catch (error) {
        console.error("Error fetching status:", error);
        statusList.innerHTML = '<div class="error">Failed to load status. Please try again later.</div>';
    }
}

function renderStatus(data) {
    statusList.innerHTML = "";
    data.forEach(site => {
        const statusItem = document.createElement("div");
        statusItem.classList.add("status-item");

        const statusIndicator = document.createElement("div");
        statusIndicator.classList.add("status-indicator");
        statusIndicator.classList.add(site.isUp ? "up" : "down");

        const websiteName = document.createElement("div");
        websiteName.classList.add("website-name");
        websiteName.textContent = site.name;

        const statusLink = document.createElement("a");
        statusLink.href = site.url;
        statusLink.target = "_blank";
        statusLink.classList.add("status-link");
        statusLink.textContent = site.isUp ? "正常访问" : "无法访问";

        const statusBars = document.createElement('div');
        statusBars.classList.add('status-bars');

        const last50History = site.history.slice(-50);
        for (let i = 49; i >= 0; i--) {
            const bar = document.createElement('div');
            bar.classList.add('status-bar');
            if (last50History[49 - i] !== undefined) {
                bar.classList.add(last50History[49 - i] === 1 ? 'up' : 'down');
            }
            statusBars.appendChild(bar);
        }

        const upCount = site.history.filter(status => status === 1).length;
        const overallPercentage = site.history.length > 0 ? ((upCount / site.history.length) * 100).toFixed(2) + "%" : "N/A";
        const percentageDisplay = document.createElement("div");
        percentageDisplay.classList.add("percentage-display");
        percentageDisplay.textContent = overallPercentage;

        statusItem.appendChild(statusIndicator);
        statusItem.appendChild(websiteName);
        statusItem.appendChild(statusLink);
        statusItem.appendChild(statusBars);
        statusItem.appendChild(percentageDisplay);

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
    countdownDisplay.textContent = \`将于 \${minutes} 分 \${seconds} 秒之后刷新\`;
  }
}

fetchStatus(); // 首次加载
setInterval(updateCountdown, 1000); // 每秒更新倒计时
`;
        return new Response(scriptContent, {
            headers: { 'Content-Type': 'application/javascript' },
        });
    }

    if (request.url.endsWith('/style.css')) {
        const styleContent = `
        body {
    font-family: sans-serif;
    background-color: #f0f0f0;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 800px;
    margin: 20px auto;
    padding: 20px;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap; /* 允许头部内容换行 */
}

.monitor-name {
    font-size: 24px;
    font-weight: bold;
    margin-right:10px;
}
.countdown{
    margin-right:auto;
}

.buttons {
    display: flex;
}

.button {
    padding: 8px 16px;
    margin-left: 10px;
    border-radius: 5px;
    text-decoration: none;
    color: #fff;
    font-weight: bold;
}

.github-button {
    background-color: #24292e;
}

.blog-button {
    background-color: #007bff;
}

.status-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    padding: 10px;
    border-radius: 5px;
    border: 1px solid #ddd;
    position: relative; /* 相对定位 */
}

.status-item:hover {
    background-color: #f9f9f9;
}

.status-item .status-indicator {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 10px;
}

.status-item .status-indicator.up {
    background-color: green;
}

.status-item .status-indicator.down {
    background-color: red;
}

.status-item .website-name {
    flex-grow: 1;
    font-weight: bold;
    margin-right: 10px;
}

.status-bars {
    display: flex;
    align-items: center;
    margin-left: auto;
}

.status-bar {
    width: 6px;
    height: 10px;
    margin: 0 1px;
    background-color: #ddd;
}

.status-bar.up {
    background-color: green;
}

.status-bar.down {
    background-color: red;
}

.loading,
.error {
    text-align: center;
    font-weight: bold;
    color: #555;
}

.status-link {
    margin-right: 10px;
    color: #007bff;
    text-decoration: none;
    white-space: nowrap;
}

.status-link:hover {
    text-decoration: underline;
}

/* 总体响应百分比样式 */
.percentage-display {
    position: absolute;
    top: 2px;
    right: 5px; /* 增大右边距 */
    font-size: 12px;
    color: #555;
}
/* 加载进度条样式 */
.progress-bar-container {
    width: 100%;
    height: 20px;
    background-color: #f0f0f0;
    border-radius: 5px;
    overflow: hidden; /* 确保进度条在容器内 */
    margin:20px 0;
}

.progress-bar {
    height: 100%;
    width: 0;
    background-color: #4caf50; /* 进度条颜色 */
    transition: width 0.2s ease; /* 平滑过渡效果 */
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
