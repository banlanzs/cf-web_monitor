[![Snipaste_2025-03-20_00-19-27.png](https://img.picui.cn/free/2025/03/20/67daef46f2b87.png)](https://img.picui.cn/free/2025/03/20/67daef46f2b87.png)

```bash
const GITHUB_URL = 'https://github.com/';//
const BLOG_URL = '';//瞎加的，想写成什么就写什么
const MONITOR_NAME = ' 站点监测';
```
这里自定义吧
```bash
getStatus()
```
想换请求方式，比如GET，HEAD，POST，在这改改
`SITES`里面加需要监控的网站

### 部署
丢到cloudflare的worker里面，新建KV空间`STATUS`，再绑定KV

### 本地测试
在如vscode中同一目录下包含
```
worker.js
wrangler.toml
```
wrangler.toml内容：
```
name = "status-monitor"
type = "javascript"
account_id = "xxx" # 替换为你的 Cloudflare 账户 ID
workers_dev = true
route = ""
zone_id = ""
main = "worker.js"  # 指定入口文件为 worker.js

kv_namespaces = [
  { binding = "STATUS", id = "xxx" } # 替换为你的 KV 命名空间 ID
]
```

#### 本地测试注意
1.安装wrangler

使用 npm 全局安装 `wrangler`：
```
npm install -g wrangler
```
安装完成后，运行以下命令检查是否安装成功：
```
wrangler --version
```
如果显示版本号（例如 `⛅️ wrangler 3.108.1`），说明 `wrangler` 已正确安装。

------------------------------------------------------------------------------------
2.运行 `wrangler dev`

在你的项目目录中，运行以下命令启动本地开发服务器：
```
wrangler dev
```
如果一切正常，会看到类似以下的输出：
```
Listening on http://localhost:8787
```

-------------------------------------------------------------------------------------
3.本地无代理请求网站时，部分需要代理或者加了cf5秒盾的可能会`红红火火`的（直接部署到cf worker没事）

------------------------------------------------------------------------------------

### [demo](https://status.banlanzs.x10.mx/)


## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=banlanzs/cf-web_monitor&type=Date)](https://www.star-history.com/#banlanzs/cf-web_monitor&Date)
