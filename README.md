# 噗噗工具箱

内部管理与数据分析平台

## 项目结构

```
lottery-frontend/
├── index.html                    # 工具箱首页
├── style.css                     # 全局样式
├── tools/                        # 工具目录
│   ├── lottery/                  # 抽奖系统（普通版）
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   ├── lottery-feishu/          # 抽奖系统（飞书版）
│   │   ├── index.html
│   │   ├── script.js
│   │   └── style.css
│   └── transfer/                # 转赠分析系统
│       ├── index.html
│       ├── css/style.css
│       └── js/
│           ├── config.js        # 配置文件
│           ├── api.js           # API封装
│           └── app.js           # 主应用
└── README.md                     # 本文档
```

## 已有工具

### 1. 抽奖系统
- **路径**：`tools/lottery-feishu/`
- **功能**：
  - 配置抽奖概率和奖品价值
  - 智能优化利润率
  - 蒙特卡洛模拟验证
  - 宝箱功能支持
- **后端**：`localhost:5001` → Cloudflare Tunnel
- **技术栈**：Bootstrap 5 + Chart.js + 飞书SDK

### 2. 转赠分析系统
- **路径**：`tools/transfer/`
- **功能**：
  - 实时转赠数据统计
  - 用户行为分析
  - 转赠关系网络可视化
  - 转赠排行榜
- **后端**：`localhost:8080` → ThinkPHP
- **数据库**：远程MySQL (124.221.9.108)
- **技术栈**：Vue 3 + Element Plus + ECharts

## 部署方式

### 方式1：本地开发
```bash
# 直接打开 index.html
open index.html
```

### 方式2：Cloudflare Pages部署
```bash
# 提交代码到 GitHub
git add .
git commit -m "update: xxx"
git push origin main

# Cloudflare Pages 会自动部署
```

### 方式3：飞书自建应用
1. 登录飞书开放平台
2. 创建自建应用
3. 配置网页地址：Cloudflare Pages 部署后的地址
4. 在飞书工作台中访问

## 配置 Cloudflare Tunnel

### 抽奖系统后端
```bash
# 已配置，地址在 tools/lottery-feishu/script.js
# API_BASE = 'https://bind-injection-travesti-beatles.trycloudflare.com/api';
```

### 转赠分析系统后端（需要配置）
```bash
# 启动 Cloudflare Tunnel 暴露 8080 端口
cloudflared tunnel --url http://localhost:8080

# 获取到的 Tunnel 地址，填入以下文件：
# tools/transfer/js/config.js
# 修改第18行：return 'https://YOUR_TUNNEL_URL/admin/transfer';
```

## 添加新工具

### 步骤1：创建工具目录
```bash
mkdir -p tools/new-tool
```

### 步骤2：添加工具文件
```
tools/new-tool/
├── index.html
├── script.js
└── style.css
```

### 步骤3：在首页添加入口
编辑 `index.html`，在 `tools-grid` 中添加：
```html
<a href="tools/new-tool/index.html" class="tool-card">
    <div class="tool-icon">
        <i class="bi bi-your-icon"></i>
    </div>
    <h3 class="tool-title">新工具名称</h3>
    <p class="tool-description">工具简介</p>
    <span class="tool-badge">已启用</span>
</a>
```

### 步骤4：提交代码
```bash
git add .
git commit -m "feat: 添加新工具 xxx"
git push
```

## 图标库

使用 Bootstrap Icons：https://icons.getbootstrap.com/

常用图标：
- `bi-gift` - 礼物
- `bi-arrow-left-right` - 转赠
- `bi-graph-up` - 数据分析
- `bi-gear` - 设置
- `bi-people` - 用户
- `bi-box` - 包裹

## 注意事项

1. **API地址配置**：生产环境需要配置 Cloudflare Tunnel 地址
2. **跨域问题**：确保后端配置了 CORS 允许前端域名访问
3. **飞书SDK**：如需飞书集成，需配置 `appId` 和签名
4. **样式隔离**：每个工具独立样式，避免冲突

## 技术支持

- GitHub: https://github.com/codedaidai/lottery-frontend
- 内部文档: 待补充

## 更新日志

### v1.0 (2025-10-29)
- ✅ 创建工具箱架构
- ✅ 集成抽奖系统
- ✅ 集成转赠分析系统
- ✅ 设计首页UI

### 待开发
- [ ] 用户权限管理
- [ ] 更多数据分析工具
- [ ] 飞书消息推送集成
