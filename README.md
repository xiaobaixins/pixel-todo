# PixelTodo · 像素待办

像素风极简待办清单（PWA）—— 可安装到手机主屏、全屏运行、离线可用。
纯本地：无任何外部依赖、无账号、数据存在手机本地（localStorage）。

## 功能
- 添加 / 勾选 / 点击文字编辑 / 删除任务；点标签可切换科目
- 科目分组：数学 / 英语 / 408 / 政治 / 其他，支持科目筛选
- 考研倒计时：显示剩余天数，点按可设置考试日期（默认 2026-12-19）
- 像素打卡日历：GitHub 风格热力格 + 连续打卡天数（勾选任务自动记录）
- 番茄钟：15 / 25 / 45 / 60 分钟，今日专注时长统计
- 全部 / 未完成 / 已完成 筛选 + 像素进度条 + 剩余计数
- 明暗双主题、像素方波音效（可关）
- PWA：安装到主屏、离线缓存

## 本地运行（电脑）
```
python serve.py 8080
```
浏览器打开 http://localhost:8080

## 部署到手机
### 方式 A：局域网（最简单）
1. 电脑运行 `python serve.py 8080`
2. 手机与电脑连同一 Wi-Fi，浏览器打开 `http://<电脑IP>:8080`（IP 用 `ipconfig` 查，形如 192.168.x.x）
3. 手机浏览器菜单 →「添加到主屏幕」
   注意：HTTP 局域网下 Service Worker 不可用，需电脑保持在线

### 方式 B：GitHub Pages（推荐，真 PWA：可安装 + 离线）
1. 建仓库并推送本目录：
   ```
   git init && git add -A && git commit -m "pixel todo"
   git remote add origin git@github.com:<用户名>/<仓库名>.git
   git push -u origin main
   ```
2. 仓库 Settings → Pages → Deploy from branch → main
3. 手机访问 `https://<用户名>.github.io/<仓库名>/`
4. Android Chrome：菜单/地址栏出现「安装应用」；iOS Safari：分享 →「添加到主屏幕」
   安装后全屏运行、断网也能用

## 文件说明
- `index.html` / `style.css` / `app.js` — 应用本体（零依赖）
- `manifest.webmanifest` / `sw.js` — PWA 清单与离线缓存（更新版本号 `CACHE` 即刷新缓存）
- `icons/` — 像素图标（`icons.py` 生成，可改色重生成）
- `fonts/zpix.woff2` — 最像素字体 Zpix（作者 SolidZORO，个人使用免费）
- `serve.py` — 局域网静态服务器（含正确 MIME）
