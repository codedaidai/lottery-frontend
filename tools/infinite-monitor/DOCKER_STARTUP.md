# 🎯 无限赏监控系统 - 快速启动文档

## 📍 系统位置

- **Docker项目**: `/Users/ywl/无限赏/infinite-monitor/`
- **工具箱入口**: `/Users/ywl/无限赏/lottery-frontend/tools/infinite-monitor/`
- **Docker端口**: 5003 (容器内5000)
- **数据库**: 124.221.9.108:3306 / zspupu_shequtuan

---

## ⚡ 快速启动

### 方式1: Docker Compose（推荐）

```bash
cd /Users/ywl/无限赏/infinite-monitor
docker-compose up -d
```

### 方式2: 查看现有容器

```bash
docker ps | grep infinite-monitor
```

### 方式3: 重启容器

```bash
docker restart infinite-monitor
```

---

## 🌐 访问地址

### 本地访问
- 监控面板: http://localhost:5003/static/index.html
- API接口: http://localhost:5003/api/
- 健康检查: http://localhost:5003/api/health

### 通过工具箱访问
- 工具箱首页: https://lottery-frontend.pages.dev/
- 点击"无限赏监控"卡片

---

## 🔧 Docker管理命令

### 查看容器状态
```bash
docker ps | grep infinite-monitor
```

### 查看日志
```bash
docker logs infinite-monitor
docker logs -f infinite-monitor  # 实时查看
```

### 停止容器
```bash
docker-compose down
```

### 重启容器
```bash
docker restart infinite-monitor
```

### 重建容器
```bash
cd /Users/ywl/无限赏/infinite-monitor
docker-compose down
docker-compose up -d --build
```

---

## 📊 主要功能

✅ 实时监控所有无限赏盒子状态
✅ 查看每个盒子的库存百分比（总库存/10000）
✅ 追踪每个奖品的剩余数量（real_pro_stock）
✅ 自动检测需要刷新的盒子（库存≤50）
✅ 库存告急预警（高价值奖品<10）
✅ 自动刷新数据（每10秒）
✅ 点击盒子查看详细奖品信息

---

## 🗄️ 数据库配置

配置文件: `config/database.json`

```json
{
  "host": "124.221.9.108",
  "port": 3306,
  "user": "zspupu_shequtuan",
  "password": "dtmjy7E6XKbWFf8t",
  "database": "zspupu_shequtuan",
  "charset": "utf8mb4"
}
```

**注意**: 配置文件已通过Docker volume挂载，修改后无需重启容器。

---

## 📡 API接口列表

| 接口 | 说明 |
|------|------|
| GET /api/health | 健康检查 |
| GET /api/infinite/stats | 全局统计（盒子总数、总销量、总库存） |
| GET /api/infinite/boxes | 所有盒子列表 |
| GET /api/infinite/box/:id | 指定盒子详情 |
| GET /api/infinite/prizes/low-stock | 库存告急列表 |
| GET /api/infinite/boxes/need-refresh | 需要刷新的盒子 |

---

## 🔍 常见问题

### Q: 数据库连接失败？
A: 检查 `config/database.json` 配置是否正确
   确认数据库服务器允许远程连接
   测试命令: `curl http://localhost:5003/api/health`

### Q: 端口5003被占用？
A: 修改 `docker-compose.yml` 中的端口映射:
   ```yaml
   ports:
     - "5004:5000"  # 改用5004端口
   ```

### Q: 页面无法访问？
A: 确认容器是否运行: `docker ps | grep infinite-monitor`
   查看容器日志: `docker logs infinite-monitor`

---

## 🚀 集成到工具箱

已完成集成：
1. ✅ 创建入口页面: `lottery-frontend/tools/infinite-monitor/index.html`
2. ✅ 更新工具箱主页，添加"无限赏监控"卡片
3. ✅ 使用图标: `bi-box-seam`

---

## 📝 技术栈

- **后端**: Python 3.12 + Flask + PyMySQL
- **前端**: HTML5 + CSS3 + JavaScript（纯前端，无框架）
- **容器**: Docker + docker-compose
- **数据库**: MySQL 5.7 / MariaDB

---

## 🔄 更新流程

### 1. 更新代码
```bash
cd /Users/ywl/无限赏/infinite-monitor
# 修改代码后...
```

### 2. 重启容器
```bash
docker-compose restart
```

### 3. 如果修改了依赖
```bash
docker-compose down
docker-compose up -d --build
```

---

## 📞 系统状态检查

快速检查所有服务状态：

```bash
#!/bin/bash
echo "🔍 无限赏监控系统状态检查"
echo ""

# Docker容器
echo "📦 Docker容器状态:"
docker ps | grep infinite-monitor || echo "  ❌ 容器未运行"
echo ""

# 本地服务测试
echo "🔌 本地服务测试:"
curl -s http://localhost:5003/api/health | python3 -m json.tool
echo ""

# API测试
echo "📊 数据测试:"
curl -s http://localhost:5003/api/infinite/stats | python3 -m json.tool
```

---

**创建时间**: 2025-11-02
**端口**: 5003
**状态**: ✅ 已部署运行
