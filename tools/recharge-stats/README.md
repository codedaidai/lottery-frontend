# 💰 奶量统计系统

后台充值欧气值数据可视化分析工具

## 📋 功能特性

### 📅 时间筛选
- ✅ 今天
- ✅ 昨天
- ✅ 本周
- ✅ 本月
- ✅ 自定义日期范围

### 📊 数据统计
- **总操作次数** - 充值和扣除的总次数统计
- **充值总额** - 所有充值金额汇总（绿色显示）
- **扣除总额** - 所有扣除金额汇总（红色显示）
- **净增量** - 充值减去扣除的净值（蓝色显示）
- **平均值/最大值/最小值** - 详细的数据分析

### 📈 可视化图表
- 按天展示充值和扣除趋势
- 柱状图对比显示
- 使用 Chart.js 实现

### 📋 详细记录
- 显示最近100条充值记录
- 包含：ID、用户ID、用户昵称、变动金额、变动后余额、操作时间
- 正数绿色显示，负数红色显示

### 📱 响应式设计
- ✅ 桌面端大屏展示
- ✅ 移动端单列布局
- ✅ 自适应各种屏幕尺寸

## 🚀 使用方法

### 方法1：PHP 内置服务器（本地测试）

```bash
cd /Users/ywl/无限赏/recharge-stats
php -S 0.0.0.0:8000
```

然后浏览器访问：`http://localhost:8000`

### 方法2：部署到 Web 服务器

将整个 `recharge-stats` 文件夹上传到你的 Web 服务器，通过浏览器访问目录即可。

例如：`https://your-domain.com/recharge-stats/`

## ⚙️ 配置说明

### 数据库配置

数据库配置在 `index.php` 文件开头：

```php
$DB_HOST = "124.221.9.108";  // 生产服务器
$DB_PORT = 3306;
$DB_NAME = "zspupu_shequtuan";
$DB_USER = "root";           // ✅ 使用root账户
$DB_PASS = "s:ayY[!3{NL9";   // ✅ 正确的密码
```

如需修改，请编辑 `index.php` 的第 8-12 行。

### 服务器连接方式

#### SSH 连接服务器
```bash
# 直接连接
ssh root@124.221.9.108

# 使用密码
# 密码: s:ayY[!3{NL9
```

#### MySQL 数据库连接
```bash
# 方法1: 命令行直接连接
mysql -h 124.221.9.108 -u root -p's:ayY[!3{NL9' zspupu_shequtuan

# 方法2: 先SSH再连接
ssh root@124.221.9.108
mysql -u root -p
# 输入密码: s:ayY[!3{NL9
use zspupu_shequtuan;
```

#### 使用 sshpass 自动登录（可选）
```bash
# 安装 sshpass (如果未安装)
brew install sshpass  # macOS
apt install sshpass   # Ubuntu/Debian

# 自动SSH登录
sshpass -p 's:ayY[!3{NL9' ssh -o StrictHostKeyChecking=no root@124.221.9.108
```

## 📊 数据来源

系统从以下数据库表读取数据：
- `profit_money` - 欧气值变动记录表
- `user` - 用户信息表

查询条件：`type = 1` (后台充值类型)

## 🎨 界面截图

### 桌面端
- 渐变紫色背景
- 4列统计卡片布局
- 完整图表和表格展示

### 移动端
- 单列自适应布局
- 触摸友好的按钮和表单
- 横向滚动支持

## 📝 技术栈

- **后端**：PHP 7.4+
- **数据库**：MySQL 5.7+
- **前端**：HTML5 + CSS3
- **图表**：Chart.js 4.4.0
- **CDN**：jsDelivr

## 🔧 系统要求

- PHP >= 7.4
- MySQL >= 5.7
- mysqli 扩展
- 现代浏览器（Chrome、Firefox、Safari、Edge）

## 📞 说明

这是一个轻量级的单文件应用，无需复杂配置，开箱即用。

所有数据实时从数据库读取，无需额外的数据处理或缓存。
