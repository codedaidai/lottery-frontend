# 🎯 无限赏监控系统

实时监控无限赏盒子的库存状况、奖品剩余数量、销售数据，自动检测新盒子和库存告急情况。

## 📋 功能特性

### 核心功能
- ✅ 实时查看所有无限赏盒子状态
- ✅ 监控每个盒子的概率库存 (real_pro_stock)
- ✅ 追踪奖品剩余数量和销售情况
- ✅ 自动检测需要刷新的盒子 (库存 ≤ 50)
- ✅ 库存告急预警 (高价值奖品库存 < 10)
- ✅ 新盒子自动识别
- ✅ 实时数据刷新 (每10秒自动更新)

### 数据看板
- 📊 全局统计: 盒子总数、总销售、总库存、待刷新数量
- 📦 盒子列表: 状态、价格、销量、库存百分比、进度条
- 🎁 奖品详情: 每个奖品的库存、概率、价值、回收价
- 🏆 赏品分级: 宝箱/传说/超神/稀有/普通分类显示
- ⚠️ 智能预警: 库存告急自动高亮提示

## 🚀 快速启动

### 1. 配置数据库连接

编辑 `config/database.json`:

```json
{
  "host": "your_server_ip",
  "port": 3306,
  "user": "your_username",
  "password": "your_password",
  "database": "zspupu_shequtuan",
  "charset": "utf8mb4"
}
```

### 2. 安装依赖

```bash
cd /Users/ywl/lottery/infinite-monitor
pip3 install -r requirements.txt
```

### 3. 启动服务

```bash
# 方式1: 使用启动脚本
chmod +x start.sh
./start.sh

# 方式2: 手动启动
cd backend
python3 app.py
```

### 4. 访问监控面板

打开浏览器访问:
```
http://localhost:5000/static/index.html
```

## 📡 API接口文档

### 全局统计
```
GET /api/infinite/stats
返回: 盒子总数、总销售、总库存等统计数据
```

### 盒子列表
```
GET /api/infinite/boxes
返回: 所有无限赏盒子的基本信息和库存状态
```

### 盒子详情
```
GET /api/infinite/box/<box_id>
返回: 指定盒子的完整信息、所有奖品及库存详情
```

### 库存告急列表
```
GET /api/infinite/prizes/low-stock
返回: 库存 < 10 的高价值奖品列表
```

### 需要刷新的盒子
```
GET /api/infinite/boxes/need-refresh
返回: 总库存 ≤ 50 的盒子列表
```

### 健康检查
```
GET /api/health
返回: 数据库连接状态
```

## 📊 数据字段说明

### 盒子信息
- `id`: 盒子ID
- `title`: 盒子名称
- `price`: 单次价格
- `sale_num`: 已售次数
- `total_stock`: 当前总库存 (所有奖品的real_pro_stock之和)
- `stock_percent`: 库存百分比 (总库存/10000)
- `need_refresh`: 是否需要刷新 (总库存 ≤ 50)

### 奖品信息
- `real_pro_stock`: 概率库存 (当前可抽取次数)
- `gailv2`: 真实概率 (后端开奖概率 %)
- `gailv1`: 显示概率 (前端展示概率 %)
- `price`: 奖品价值
- `money`: 回收价格 (用户可兑换金额)
- `shang_id`: 赏品等级 (5=宝箱, 39=传说, 38=超神, 37=稀有, 36=普通)

## 🎨 界面功能

### 主页面
- 实时时间戳显示
- 自动刷新开关 (默认每10秒刷新)
- 手动刷新按钮
- 全局统计卡片
- 库存告急警告横幅
- 盒子列表 (带进度条、状态标签)

### 详情弹窗
- 盒子完整信息
- 统计数据卡片
- 奖品网格展示
- 赏品等级颜色标识
- 库存告急红色高亮

## 🔧 技术栈

### 后端
- Python 3.x
- Flask (Web框架)
- PyMySQL (数据库连接)
- Flask-CORS (跨域支持)

### 前端
- 纯HTML5 + CSS3 + JavaScript
- 响应式设计
- 实时数据刷新
- 无需额外框架

## 📁 项目结构

```
infinite-monitor/
├── backend/
│   └── app.py                 # Flask API服务
├── frontend/
│   └── index.html             # 监控面板页面
├── config/
│   └── database.json          # 数据库配置
├── requirements.txt           # Python依赖
├── start.sh                   # 启动脚本
└── README.md                  # 说明文档
```

## ⚙️ 配置说明

### 自动刷新频率
编辑 `frontend/index.html` 第 406 行:
```javascript
autoRefreshInterval = setInterval(loadAllData, 10000); // 10秒
```

### API地址
如果后端部署在其他服务器,修改 `frontend/index.html` 第 208 行:
```javascript
const API_BASE = 'http://your-server:5000/api';
```

## 🛡️ 安全建议

1. **生产环境部署**:
   - 修改 Flask debug=False
   - 使用 Gunicorn/uWSGI 部署
   - 配置 Nginx 反向代理

2. **数据库安全**:
   - 使用只读账户连接数据库
   - 不要在配置文件中使用root账户
   - 配置文件添加到 .gitignore

3. **访问控制**:
   - 建议添加登录认证
   - 限制IP访问白名单
   - 使用HTTPS加密传输

## 🐛 常见问题

### 数据库连接失败
1. 检查配置文件中的数据库信息是否正确
2. 确认数据库服务器允许远程连接
3. 检查防火墙规则

### 跨域问题
后端已配置CORS,如仍有问题,检查浏览器控制台错误信息

### 数据不刷新
1. 检查自动刷新开关是否开启
2. 查看浏览器控制台是否有JS错误
3. 确认后端服务正常运行

## 📝 更新日志

### v1.0.0 (2025-01-02)
- ✨ 初始版本发布
- ✅ 支持实时监控所有盒子
- ✅ 自动检测库存告急
- ✅ 详细奖品信息展示
- ✅ 响应式UI设计

## 📧 联系方式

如有问题或建议,请联系系统管理员。

---

**🎯 无限赏监控系统 - 让库存管理一目了然**
