# 噗噗工具箱 (Pupu Toolbox)

内部管理与数据分析平台，集成多个实用工具。

## 📦 工具列表

### 1. 无限赏模拟 (lottery-feishu)
- **路径**: `tools/lottery-feishu/`
- **功能**: 配置抽奖概率、奖品价值，智能优化利润率，蒙特卡洛模拟验证
- **后端**: Python Flask (需要单独启动)
- **特点**:
  - 支持普通奖品和宝箱嵌套
  - 自动调整概率/价值以达到目标利润率
  - 蒙特卡洛模拟验证配置
  - 可保存/加载配置

### 2. 转赠分析 (transfer)
- **路径**: `tools/transfer/`
- **功能**: 实时转赠数据统计，用户行为分析，转赠关系网络可视化
- **技术栈**:
  - 前端: Vue 3 + Element Plus + ECharts
  - 后端: ThinkPHP 6 + MySQL
- **数据库**:
  - 服务器: 124.221.9.108
  - 数据库: zspupu_shequtuan
- **API**: 通过Cloudflare Tunnel访问
  - Tunnel URL: `https://rolled-article-beautifully-campbell.trycloudflare.com`
  - API Base: `/admin/transfer`
- **特点**:
  - 数据概览（转赠次数、物品数、参与用户、总价值）
  - 转赠趋势图（双Y轴：次数/物品数 vs 金额）
  - 活跃用户TOP10
  - 转赠记录查询和筛选
  - 用户分析（发出/接收统计、常转赠对象）
  - 转赠关系网络图
  - 转赠排行榜
  - 移动端优化（360px-428px分辨率）

### 3. 抽奖转盘 (lottery)
- **路径**: `tools/lottery/`
- **功能**: 可视化抽奖转盘，配置奖品概率，实时抽奖模拟
- **技术**: 纯前端，Canvas绘制
- **特点**:
  - 输入参与者名单（支持序号和附加信息）
  - 转盘旋转动画
  - 自动识别同名参与者
  - 抽中后可选择自动去除该名字的所有条目
  - 剩余条目实时显示
  - 支持重置名单
  - 移动端响应式设计

## 🚀 推送到 GitHub 的方法

### 方法1: 标准推送（推荐）
```bash
# 1. 进入项目目录
cd /Users/ywl/无限赏/lottery-frontend

# 2. 添加所有更改
git add .

# 3. 提交更改（使用heredoc格式化commit message）
git commit -m "$(cat <<'EOF'
feat: 描述你的更改

- 详细说明1
- 详细说明2

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# 4. 推送到远程
git push origin main
```

### 方法2: 快速推送（简单更改）
```bash
cd /Users/ywl/无限赏/lottery-frontend
git add .
git commit -m "你的提交信息"
git push origin main
```

### 方法3: 推送特定文件
```bash
cd /Users/ywl/无限赏/lottery-frontend
git add 文件路径
git commit -m "提交信息"
git push origin main
```

### 常见问题处理

#### 问题1: 推送超时 (Recv failure: Operation timed out)
```bash
# 解决方案1: 禁用HTTP/2
git config --global http.version HTTP/1.1
git push origin main
# 推送成功后恢复
git config --global --unset http.version

# 解决方案2: 增加缓冲区和超时时间
git config --global http.postBuffer 524288000
git config --global http.lowSpeedLimit 0
git config --global http.lowSpeedTime 999999
```

#### 问题2: 推送失败 (HTTP2 framing layer error)
```bash
# 临时禁用HTTP/2
git config --global http.version HTTP/1.1
git push origin main
git config --global --unset http.version
```

#### 问题3: 查看当前状态
```bash
git status              # 查看文件修改状态
git log --oneline -5    # 查看最近5次提交
git diff                # 查看未暂存的更改
```

## 🌐 部署说明

### GitHub 仓库
- **仓库地址**: https://github.com/codedaidai/lottery-frontend
- **分支**: main

### Cloudflare Pages 自动部署
1. 推送到 GitHub 后，Cloudflare Pages 会自动触发部署
2. 部署完成后访问 Cloudflare Pages 提供的域名即可

## 🔧 本地开发

### 转赠系统后端启动

#### 1. 启动 Cloudflare Tunnel
```bash
cloudflared tunnel --url http://localhost:8080
```
记录生成的 Tunnel URL，然后更新配置文件。

#### 2. 更新前端配置
编辑 `tools/transfer/js/config.js`:
```javascript
// 生产环境 - 通过Cloudflare Tunnel访问
return 'https://你的-tunnel-url.trycloudflare.com/admin/transfer';
```

#### 3. 启动ThinkPHP后端
```bash
cd /Users/ywl/无限赏/zspupu.shequtuangou.vip
php think run -H 0.0.0.0 -p 8080
```

### 本地预览
直接用浏览器打开 `index.html` 即可，无需构建步骤。

## 📱 移动端适配

- 转赠系统针对 **360px-428px** 真实手机分辨率进行了优化
- 统计卡片采用 2x2 布局
- 图表垂直堆叠，每个图表占满屏幕宽度
- 底部固定导航栏（移动端）
- 支持 iOS 刘海屏适配 (safe-area-inset-bottom)

### 移动端测试建议分辨率
- iPhone SE: 375 x 667
- iPhone 12/13/14: 390 x 844
- iPhone 14 Pro Max: 430 x 932
- 小屏安卓: 360 x 640

## 🗄️ 数据库信息

### 生产数据库
- **服务器**: 124.221.9.108
- **用户名**: root
- **密码**: s:ayY[!3{NL9
- **数据库**: zspupu_shequtuan
- **端口**: 3306

### 主要数据表
- `order_list_give`: 转赠记录主表
- `order_list_choose`: 转赠物品明细
- `order_list`: 订单表（包含价格信息）
- `user`: 用户表

### 连接方式
```bash
# SSH 连接
ssh root@124.221.9.108

# MySQL 连接
mysql -h 124.221.9.108 -u root -p's:ayY[!3{NL9' zspupu_shequtuan
```

## 📝 项目结构

```
lottery-frontend/
├── index.html              # 工具箱首页
├── README.md              # 项目说明文档（本文件）
├── tools/
│   ├── lottery-feishu/    # 无限赏模拟系统
│   │   ├── index.html
│   │   ├── app.js
│   │   ├── api.js
│   │   └── config.js
│   ├── transfer/          # 转赠分析系统
│   │   ├── index.html
│   │   ├── js/
│   │   │   ├── app.js
│   │   │   ├── api.js
│   │   │   └── config.js
│   │   └── css/
│   │       └── style.css
│   └── lottery/           # 抽奖转盘
│       └── index.html     # 独立HTML文件（包含CSS和JS）
└── .git/                  # Git版本控制

相关后端项目:
/Users/ywl/无限赏/zspupu.shequtuangou.vip/  # ThinkPHP后端
/Users/ywl/lottery/                          # Python抽奖模拟后端
```

## 🎨 技术栈

### 前端
- **框架**: Vue 3 (CDN)
- **UI库**: Element Plus, Bootstrap 5
- **图表**: ECharts 5
- **图标**: Bootstrap Icons
- **样式**: 原生CSS + 响应式设计

### 后端
- **转赠系统**: ThinkPHP 6 + MySQL
- **抽奖模拟**: Python Flask

### 部署
- **代码托管**: GitHub
- **网站部署**: Cloudflare Pages
- **API代理**: Cloudflare Tunnel

## 📄 开发日志

### 2025-10-30
- ✅ 优化转赠系统移动端显示（360px-428px）
- ✅ 隐藏Header API信息，保留统计卡片
- ✅ 转赠趋势图增加金额数据（双Y轴）
- ✅ 添加抽奖转盘工具（Canvas可视化）
- ✅ 集成三个工具到统一工具箱
- ✅ 编写完整的README文档

### 2025-10-29
- ✅ 部署转赠系统到Cloudflare Pages
- ✅ 配置Cloudflare Tunnel连接后端
- ✅ 移动端响应式优化
- ✅ 底部导航栏实现

## 🔐 安全提醒

⚠️ **注意**: 本项目的数据库密码已写入本文档，请确保：
1. 不要将此README推送到公开仓库
2. 定期更换数据库密码
3. 使用环境变量管理敏感信息
4. 限制数据库访问IP白名单

## 💡 快速参考

### 最常用的命令
```bash
# 进入项目目录
cd /Users/ywl/无限赏/lottery-frontend

# 查看状态
git status

# 快速推送
git add . && git commit -m "update: 描述" && git push origin main

# 启动后端（ThinkPHP）
cd /Users/ywl/无限赏/zspupu.shequtuangou.vip
php think run -H 0.0.0.0 -p 8080

# 启动Tunnel
cloudflared tunnel --url http://localhost:8080
```

## 📞 联系方式

如有问题，请联系内部技术团队。

---

**最后更新**: 2025-10-30
**版本**: v1.0
**维护者**: 内部技术团队
