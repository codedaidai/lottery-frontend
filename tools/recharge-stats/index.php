<?php
/**
 * 奶量统计系统 - 后台充值数据可视化
 * 功能：统计后台充值欧气值的情况，支持时间筛选和图表展示
 */

// 数据库配置
$DB_HOST = "124.221.9.108";
$DB_PORT = 3306;
$DB_NAME = "zspupu_shequtuan";
$DB_USER = "zspupu_shequtuan";  // 使用与转赠系统相同的用户
$DB_PASS = "dtmjy7E6XKbWFf8t";  // 使用与转赠系统相同的密码

date_default_timezone_set('Asia/Shanghai');

// 连接数据库
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
if ($mysqli->connect_error) {
    die("❌ 数据库连接失败: " . $mysqli->connect_error);
}
$mysqli->set_charset("utf8mb4");

// 获取时间范围参数
$range = $_GET['range'] ?? 'today';
$start_date = $_GET['start'] ?? '';
$end_date = $_GET['end'] ?? '';

// 计算时间范围
function getTimeRange($range, $start = '', $end = '') {
    switch ($range) {
        case 'today':
            return [
                'start' => strtotime('today'),
                'end' => time(),
                'label' => '今天'
            ];
        case 'yesterday':
            return [
                'start' => strtotime('yesterday'),
                'end' => strtotime('today') - 1,
                'label' => '昨天'
            ];
        case 'week':
            return [
                'start' => strtotime('this week'),
                'end' => time(),
                'label' => '本周'
            ];
        case 'month':
            return [
                'start' => strtotime('first day of this month'),
                'end' => time(),
                'label' => '本月'
            ];
        case 'custom':
            if ($start && $end) {
                return [
                    'start' => strtotime($start),
                    'end' => strtotime($end . ' 23:59:59'),
                    'label' => $start . ' ~ ' . $end
                ];
            }
        default:
            return [
                'start' => strtotime('today'),
                'end' => time(),
                'label' => '今天'
            ];
    }
}

$timeRange = getTimeRange($range, $start_date, $end_date);

// 查询统计数据
$sql_stats = "
    SELECT
        COUNT(*) as total_count,
        SUM(CASE WHEN `change` > 0 THEN 1 ELSE 0 END) as recharge_count,
        SUM(CASE WHEN `change` < 0 THEN 1 ELSE 0 END) as deduct_count,
        SUM(`change`) as total_amount,
        SUM(CASE WHEN `change` > 0 THEN `change` ELSE 0 END) as recharge_amount,
        ABS(SUM(CASE WHEN `change` < 0 THEN `change` ELSE 0 END)) as deduct_amount,
        AVG(`change`) as avg_amount,
        MAX(`change`) as max_amount,
        MIN(`change`) as min_amount
    FROM profit_money
    WHERE type = 1
    AND addtime >= {$timeRange['start']}
    AND addtime <= {$timeRange['end']}
";
$result_stats = $mysqli->query($sql_stats);
$stats = $result_stats->fetch_assoc();

// 查询按天分组的数据（用于图表）
$sql_daily = "
    SELECT
        DATE(FROM_UNIXTIME(addtime)) as date,
        COUNT(*) as count,
        SUM(`change`) as amount,
        SUM(CASE WHEN `change` > 0 THEN `change` ELSE 0 END) as recharge,
        ABS(SUM(CASE WHEN `change` < 0 THEN `change` ELSE 0 END)) as deduct
    FROM profit_money
    WHERE type = 1
    AND addtime >= {$timeRange['start']}
    AND addtime <= {$timeRange['end']}
    GROUP BY DATE(FROM_UNIXTIME(addtime))
    ORDER BY date ASC
";
$result_daily = $mysqli->query($sql_daily);
$daily_data = [];
while ($row = $result_daily->fetch_assoc()) {
    $daily_data[] = $row;
}

// 查询详细记录
$sql_details = "
    SELECT
        pm.id,
        pm.user_id,
        u.nickname,
        pm.change,
        pm.money as balance_after,
        pm.addtime
    FROM profit_money pm
    LEFT JOIN user u ON pm.user_id = u.id
    WHERE pm.type = 1
    AND pm.addtime >= {$timeRange['start']}
    AND pm.addtime <= {$timeRange['end']}
    ORDER BY pm.addtime DESC
    LIMIT 100
";
$result_details = $mysqli->query($sql_details);
$details = [];
while ($row = $result_details->fetch_assoc()) {
    $details[] = $row;
}

$mysqli->close();
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>💰 奶量统计系统</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            text-align: center;
            color: white;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 2em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .header p {
            font-size: 1em;
            opacity: 0.9;
        }

        .card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .card-title {
            font-size: 1.2em;
            font-weight: 600;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* 时间筛选器 */
        .filter-section {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 20px;
        }

        .filter-btn {
            padding: 10px 20px;
            border: 2px solid #667eea;
            background: white;
            color: #667eea;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            transition: all 0.3s;
        }

        .filter-btn:hover {
            background: #667eea;
            color: white;
        }

        .filter-btn.active {
            background: #667eea;
            color: white;
        }

        .custom-date {
            display: flex;
            gap: 10px;
            align-items: center;
            flex-wrap: wrap;
        }

        .custom-date input {
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
        }

        /* 统计卡片 */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
        }

        .stat-card.green {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        }

        .stat-card.red {
            background: linear-gradient(135deg, #ee0979 0%, #ff6a00 100%);
        }

        .stat-card.blue {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .stat-card .label {
            font-size: 0.9em;
            opacity: 0.9;
            margin-bottom: 8px;
        }

        .stat-card .value {
            font-size: 2em;
            font-weight: 700;
        }

        .stat-card .sub {
            font-size: 0.85em;
            opacity: 0.8;
            margin-top: 5px;
        }

        /* 图表区域 */
        .chart-container {
            position: relative;
            height: 300px;
            margin-bottom: 20px;
        }

        /* 详细列表 */
        .details-table {
            width: 100%;
            border-collapse: collapse;
            overflow-x: auto;
            display: block;
        }

        .details-table thead {
            background: #f8f9fa;
        }

        .details-table th,
        .details-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }

        .details-table th {
            font-weight: 600;
            color: #666;
            white-space: nowrap;
        }

        .amount-positive {
            color: #38ef7d;
            font-weight: 600;
        }

        .amount-negative {
            color: #ee0979;
            font-weight: 600;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }

            .header h1 {
                font-size: 1.5em;
            }

            .card {
                padding: 15px;
            }

            .filter-section {
                flex-direction: column;
            }

            .filter-btn {
                width: 100%;
            }

            .custom-date {
                flex-direction: column;
                width: 100%;
            }

            .custom-date input {
                width: 100%;
            }

            .stats-grid {
                grid-template-columns: 1fr;
            }

            .chart-container {
                height: 250px;
            }

            .details-table {
                font-size: 12px;
            }

            .details-table th,
            .details-table td {
                padding: 8px 5px;
            }
        }

        .no-data {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 1.1em;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 头部 -->
        <div class="header">
            <h1>💰 奶量统计系统</h1>
            <p>后台充值欧气值数据分析</p>
        </div>

        <!-- 时间筛选器 -->
        <div class="card">
            <div class="card-title">📅 时间筛选</div>
            <div class="filter-section">
                <button class="filter-btn <?= $range === 'today' ? 'active' : '' ?>" onclick="location.href='?range=today'">今天</button>
                <button class="filter-btn <?= $range === 'yesterday' ? 'active' : '' ?>" onclick="location.href='?range=yesterday'">昨天</button>
                <button class="filter-btn <?= $range === 'week' ? 'active' : '' ?>" onclick="location.href='?range=week'">本周</button>
                <button class="filter-btn <?= $range === 'month' ? 'active' : '' ?>" onclick="location.href='?range=month'">本月</button>
            </div>
            <form class="custom-date" method="GET">
                <input type="hidden" name="range" value="custom">
                <input type="date" name="start" value="<?= $start_date ?>" required>
                <span>至</span>
                <input type="date" name="end" value="<?= $end_date ?>" required>
                <button type="submit" class="filter-btn">查询</button>
            </form>
            <div style="margin-top: 10px; color: #666; font-size: 14px;">
                📊 当前查询: <?= $timeRange['label'] ?>
            </div>
        </div>

        <!-- 统计概览 -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="label">📈 总操作次数</div>
                <div class="value"><?= number_format($stats['total_count']) ?></div>
                <div class="sub">充值 <?= $stats['recharge_count'] ?> | 扣除 <?= $stats['deduct_count'] ?></div>
            </div>
            <div class="stat-card green">
                <div class="label">💵 充值总额</div>
                <div class="value">+<?= number_format($stats['recharge_amount'], 2) ?></div>
                <div class="sub">平均 <?= number_format($stats['recharge_amount'] / max($stats['recharge_count'], 1), 2) ?></div>
            </div>
            <div class="stat-card red">
                <div class="label">💸 扣除总额</div>
                <div class="value">-<?= number_format($stats['deduct_amount'], 2) ?></div>
                <div class="sub">平均 <?= number_format($stats['deduct_amount'] / max($stats['deduct_count'], 1), 2) ?></div>
            </div>
            <div class="stat-card blue">
                <div class="label">📊 净增量</div>
                <div class="value"><?= number_format($stats['total_amount'], 2) ?></div>
                <div class="sub">最大 <?= number_format($stats['max_amount'], 2) ?> | 最小 <?= number_format($stats['min_amount'], 2) ?></div>
            </div>
        </div>

        <!-- 趋势图表 -->
        <?php if (!empty($daily_data)): ?>
        <div class="card">
            <div class="card-title">📈 充值趋势图</div>
            <div class="chart-container">
                <canvas id="trendChart"></canvas>
            </div>
        </div>
        <?php endif; ?>

        <!-- 详细记录 -->
        <div class="card">
            <div class="card-title">📋 详细记录 (最近100条)</div>
            <?php if (!empty($details)): ?>
            <div style="overflow-x: auto;">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>用户ID</th>
                            <th>用户昵称</th>
                            <th>变动金额</th>
                            <th>变动后余额</th>
                            <th>操作时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($details as $row): ?>
                        <tr>
                            <td><?= $row['id'] ?></td>
                            <td><?= $row['user_id'] ?></td>
                            <td><?= htmlspecialchars($row['nickname'] ?? '未知') ?></td>
                            <td class="<?= $row['change'] > 0 ? 'amount-positive' : 'amount-negative' ?>">
                                <?= $row['change'] > 0 ? '+' : '' ?><?= number_format($row['change'], 2) ?>
                            </td>
                            <td><?= number_format($row['balance_after'], 2) ?></td>
                            <td><?= date('Y-m-d H:i:s', $row['addtime']) ?></td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php else: ?>
            <div class="no-data">📭 该时间段内没有充值记录</div>
            <?php endif; ?>
        </div>
    </div>

    <script>
        <?php if (!empty($daily_data)): ?>
        // 准备图表数据
        const dailyData = <?= json_encode($daily_data) ?>;
        const labels = dailyData.map(item => item.date);
        const rechargeData = dailyData.map(item => parseFloat(item.recharge));
        const deductData = dailyData.map(item => parseFloat(item.deduct));

        // 创建图表
        const ctx = document.getElementById('trendChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: '充值',
                        data: rechargeData,
                        backgroundColor: 'rgba(56, 239, 125, 0.7)',
                        borderColor: 'rgba(56, 239, 125, 1)',
                        borderWidth: 2
                    },
                    {
                        label: '扣除',
                        data: deductData,
                        backgroundColor: 'rgba(238, 9, 121, 0.7)',
                        borderColor: 'rgba(238, 9, 121, 1)',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        <?php endif; ?>
    </script>
</body>
</html>
