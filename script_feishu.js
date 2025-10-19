// 飞书网页应用版本的JavaScript
// 在原版基础上增加了飞书JSAPI的集成

// 全局变量
let API_BASE = '';  // 将通过配置动态设置
let currentConfig = null;
let messageModal = null;
let isFeishuReady = false;

function resolveApiBaseDefault() {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file://')) {
        return `${origin.replace(/\/$/, '')}/api`;
    }
    return 'http://127.0.0.1:5000/api';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    initFeishuSDK();
});

// 初始化飞书SDK
function initFeishuSDK() {
    if (typeof h5sdk === 'undefined') {
        console.warn('飞书SDK未加载，使用普通模式');
        API_BASE = resolveApiBaseDefault();
        initApp();
        return;
    }

    // 配置飞书SDK
    h5sdk.config({
        appId: '', // 创建应用后填写
        timestamp: 0,
        nonceStr: '',
        signature: '',
        jsApiList: [
            'biz.navigation.setTitle',
            'biz.util.showToast',
            'device.notification.alert',
            'biz.navigation.close'
        ],
        onSuccess: function(res) {
            console.log('飞书SDK初始化成功', res);
            isFeishuReady = true;
            
            // 设置导航标题
            h5sdk.biz.navigation.setTitle({
                title: '无限赏抽奖系统'
            });

            // 获取环境信息后设置API地址
            getApiBaseUrl();
            
            logMessage('飞书环境初始化成功', 'success');
        },
        onFail: function(err) {
            console.error('飞书SDK初始化失败', err);
            API_BASE = resolveApiBaseDefault();
            initApp();
            logMessage('使用普通模式运行', 'info');
        }
    });
}

// 获取API基础URL（根据实际部署调整）
function getApiBaseUrl() {
    // 方式1: 使用环境变量或配置文件
    // 在飞书应用配置中，你需要将后端API地址配置为环境变量或写死
    
    // 方式2: 使用相对路径（如果前后端部署在同一域名下）
    // API_BASE = '/api';
    
    // 方式3: 使用固定的后端地址（开发环境）
    // API_BASE = 'http://your-server-ip:5000/api';
    
    // 方式4: 从当前URL提取（如果使用反向代理）
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file://')) {
        API_BASE = `${origin.replace(/\/$/, '')}/api`;
    } else {
        API_BASE = resolveApiBaseDefault();
    }

    // 如果是本地开发，默认指向后端本机端口
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        API_BASE = `http://${window.location.hostname}:5000/api`;
    }
    
    console.log('API_BASE:', API_BASE);
    initApp();
}

// 初始化应用
function initApp() {
    loadConfig();
    setupEventListeners();
    logMessage('系统初始化完成', 'success');
}

// 飞书Toast提示（如果在飞书环境中）
function showFeishuToast(message, type = 'success') {
    if (isFeishuReady && h5sdk && h5sdk.biz && h5sdk.biz.util && h5sdk.biz.util.showToast) {
        h5sdk.biz.util.showToast({
            text: message,
            duration: 3,
            onSuccess: function() {
                console.log('Toast显示成功');
            },
            onFail: function(err) {
                console.error('Toast显示失败', err);
            }
        });
    }
}

// 飞书Alert弹窗
function showFeishuAlert(title, message) {
    if (isFeishuReady && h5sdk && h5sdk.device && h5sdk.device.notification && h5sdk.device.notification.alert) {
        h5sdk.device.notification.alert({
            title: title,
            message: message,
            buttonName: '确定',
            onSuccess: function() {
                console.log('Alert显示成功');
            },
            onFail: function(err) {
                console.error('Alert显示失败', err);
            }
        });
    }
}

// ==================== 以下是原有功能，保持不变 ====================

// 设置事件监听器
function setupEventListeners() {
    document.getElementById('calculateBtn').addEventListener('click', calculateStats);
    document.getElementById('adjustValuesBtn').addEventListener('click', adjustValues);
    document.getElementById('adjustProbsBtn').addEventListener('click', adjustProbs);
    document.getElementById('simulateBtn').addEventListener('click', runSimulation);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('addPrizeBtn').addEventListener('click', addPrize);
}

// 加载配置
async function loadConfig() {
    try {
        const response = await fetch(`${API_BASE}/config`);
        const data = await response.json();

        if (data.success) {
            currentConfig = data.config;
            document.getElementById('price').value = data.config.price;
            renderPrizesTable(data.config.prizes);
            updateStats(data.stats);
            logMessage('配置加载成功', 'success');
            showFeishuToast('配置加载成功');
        } else {
            showError('加载配置失败: ' + data.error);
        }
    } catch (error) {
        showError('连接服务器失败，请确保后端服务已启动');
        logMessage('错误: ' + error.message, 'error');
    }
}

// 渲染奖品表格
function renderPrizesTable(prizes) {
    const tbody = document.getElementById('prizesTable');
    tbody.innerHTML = '';

    prizes.forEach((prize, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>
                <input type="text" class="form-control form-control-sm"
                       value="${prize.name}"
                       onchange="updatePrize(${index}, 'name', this.value)">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm"
                       value="${(prize.prob * 100).toFixed(4)}"
                       step="0.0001" min="0" max="100"
                       onchange="updatePrize(${index}, 'prob', parseFloat(this.value) / 100)">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm"
                       value="${prize.value}"
                       step="0.01" min="0"
                       onchange="updatePrize(${index}, 'value', parseFloat(this.value))">
            </td>
            <td class="text-muted">
                ${(prize.prob * prize.value).toFixed(2)}
            </td>
            <td>
                <button class="btn btn-sm btn-danger btn-delete" onclick="deletePrize(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
    });

    updateTotals(prizes);
}

// 更新奖品数据
function updatePrize(index, field, value) {
    if (!currentConfig) return;

    currentConfig.prizes[index][field] = value;
    renderPrizesTable(currentConfig.prizes);
    logMessage(`已修改奖品 ${index + 1} 的 ${field}`, 'info');
}

// 删除奖品
function deletePrize(index) {
    if (!currentConfig) return;
    if (currentConfig.prizes.length <= 1) {
        showError('至少需要保留一个奖品');
        return;
    }

    const prizeName = currentConfig.prizes[index].name;
    currentConfig.prizes.splice(index, 1);
    renderPrizesTable(currentConfig.prizes);
    logMessage(`已删除奖品: ${prizeName}`, 'warning');
    showFeishuToast('已删除奖品');
}

// 添加奖品
function addPrize() {
    if (!currentConfig) return;

    const newPrize = {
        name: `新奖品 ${currentConfig.prizes.length + 1}`,
        prob: 0.01,
        value: 10
    };

    currentConfig.prizes.push(newPrize);
    renderPrizesTable(currentConfig.prizes);
    logMessage('已添加新奖品', 'info');
    showFeishuToast('已添加新奖品');
}

// 更新总计行
function updateTotals(prizes) {
    const totalProb = prizes.reduce((sum, p) => sum + p.prob, 0);
    const totalExpected = prizes.reduce((sum, p) => sum + (p.prob * p.value), 0);

    const totalProbEl = document.getElementById('totalProb');
    totalProbEl.textContent = (totalProb * 100).toFixed(4) + '%';
    totalProbEl.className = Math.abs(totalProb - 1.0) < 0.0001 ? 'prob-valid' : 'prob-invalid';

    document.getElementById('totalExpected').textContent = totalExpected.toFixed(2);
}

// 更新统计信息
function updateStats(stats) {
    document.getElementById('statExpected').textContent = `${stats.expected_payout} 元`;

    const profitEl = document.getElementById('statProfit');
    profitEl.textContent = `${stats.profit_rate}%`;
    profitEl.className = `stat-value ${stats.profit_rate >= 0 ? 'text-success' : 'text-danger'}`;

    const probSumEl = document.getElementById('statProbSum');
    probSumEl.textContent = `${stats.total_prob}%`;
    probSumEl.className = `stat-value ${stats.prob_valid ? 'text-success' : 'text-danger'}`;

    document.getElementById('statPrizeCount').textContent = stats.prize_count;
}

// 计算统计
async function calculateStats() {
    if (!currentConfig) return;

    const btn = document.getElementById('calculateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> 计算中...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizes: currentConfig.prizes,
                price: parseFloat(document.getElementById('price').value)
            })
        });

        const data = await response.json();

        if (data.success) {
            updateStats(data.stats);
            logMessage('统计计算完成', 'success');
            showFeishuToast('计算完成');
        } else {
            showError('计算失败: ' + data.error);
        }
    } catch (error) {
        showError('计算失败: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 调整价值(固定概率)
async function adjustValues() {
    if (!currentConfig) return;

    const targetProfit = parseFloat(document.getElementById('targetProfit').value) / 100;
    const btn = document.getElementById('adjustValuesBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> 调整中...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/adjust/values`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizes: currentConfig.prizes,
                price: parseFloat(document.getElementById('price').value),
                target_profit: targetProfit
            })
        });

        const data = await response.json();

        if (data.success) {
            currentConfig.prizes = data.adjusted_prizes;
            renderPrizesTable(data.adjusted_prizes);
            updateStats(data.stats);
            logMessage(`价值已调整至目标利润率 ${(targetProfit * 100).toFixed(1)}%`, 'success');
            showFeishuToast('价值调整完成');
        } else {
            showError('调整失败: ' + data.error);
        }
    } catch (error) {
        showError('调整失败: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 调整概率(固定价值)
async function adjustProbs() {
    if (!currentConfig) return;

    const targetProfit = parseFloat(document.getElementById('targetProfit').value) / 100;
    const btn = document.getElementById('adjustProbsBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> 调整中...';
    btn.disabled = true;

    try {
        const response = await fetch(`${API_BASE}/adjust/probs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizes: currentConfig.prizes,
                price: parseFloat(document.getElementById('price').value),
                target_profit: targetProfit
            })
        });

        const data = await response.json();

        if (data.success) {
            currentConfig.prizes = data.adjusted_prizes;
            renderPrizesTable(data.adjusted_prizes);
            updateStats(data.stats);
            logMessage(`概率已调整至目标利润率 ${(targetProfit * 100).toFixed(1)}%`, 'success');
            showFeishuToast('概率调整完成');
        } else {
            showError('调整失败: ' + data.error);
        }
    } catch (error) {
        showError('调整失败: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 运行模拟
async function runSimulation() {
    if (!currentConfig) return;

    // 获取用户设置的模拟次数
    const simulationCount = parseInt(document.getElementById('simulationCount').value);

    // 验证模拟次数
    if (isNaN(simulationCount) || simulationCount < 1000) {
        showError('模拟次数至少为 1,000 次');
        return;
    }
    if (simulationCount > 10000000) {
        showError('模拟次数不能超过 10,000,000 次');
        return;
    }

    const btn = document.getElementById('simulateBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> 模拟中...';
    btn.disabled = true;

    const resultsDiv = document.getElementById('simulationResults');
    resultsDiv.innerHTML = `<p class="text-muted">正在模拟 ${simulationCount.toLocaleString()} 次抽奖，请稍候...</p>`;

    try {
        const response = await fetch(`${API_BASE}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizes: currentConfig.prizes,
                price: parseFloat(document.getElementById('price').value),
                n: simulationCount,
                seed: 42
            })
        });

        const data = await response.json();

        if (data.success) {
            displaySimulationResults(data.result);
            logMessage(`模拟完成 (${simulationCount.toLocaleString()}次抽奖)`, 'success');
            showFeishuToast('模拟完成');
        } else {
            showError('模拟失败: ' + data.error);
        }
    } catch (error) {
        showError('模拟失败: ' + error.message);
        resultsDiv.innerHTML = '<p class="text-danger">模拟失败</p>';
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 显示模拟结果
function displaySimulationResults(result) {
    const html = `
        <div class="simulation-stat">
            <strong>模拟次数:</strong> ${result.simulation_count.toLocaleString()}
        </div>
        <div class="simulation-stat">
            <strong>平均赔付:</strong> ${result.avg_payout} 元
            <small class="text-muted">(理论: ${result.theoretical_expected} 元)</small>
        </div>
        <div class="simulation-stat">
            <strong>实际利润率:</strong> ${result.profit_rate}%
            <small class="text-muted">(理论: ${result.theoretical_profit_rate}%)</small>
        </div>
        <div class="simulation-stat">
            <strong>利润率偏差:</strong>
            <span class="${Math.abs(result.profit_rate_deviation) < 0.5 ? 'text-success' : 'text-warning'}">
                ${result.profit_rate_deviation}%
            </span>
        </div>
        <div class="simulation-stat">
            <strong>总收入:</strong> ${result.total_revenue.toLocaleString()} 元
        </div>
        <div class="simulation-stat">
            <strong>总赔付:</strong> ${result.total_payout.toLocaleString()} 元
        </div>
        <div class="simulation-stat">
            <strong>总利润:</strong>
            <span class="text-success fw-bold">${result.total_profit.toLocaleString()} 元</span>
        </div>

        <hr>
        <h6 class="mt-3 mb-2">各奖项偏差分析 (前5项):</h6>
        ${result.prize_stats.slice(0, 5).map(stat => `
            <div class="simulation-stat small">
                <strong>${stat.name}:</strong><br>
                期望 ${stat.expected_count} 次 | 实际 ${stat.actual_count} 次
                <span class="${Math.abs(stat.deviation_percent) < 5 ? 'text-success' : 'text-warning'}">
                    (${stat.deviation_percent > 0 ? '+' : ''}${stat.deviation_percent}%)
                </span>
            </div>
        `).join('')}
    `;

    document.getElementById('simulationResults').innerHTML = html;
}

// 保存配置
async function saveConfig() {
    if (!currentConfig) return;

    const btn = document.getElementById('saveConfigBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="loading-spinner"></span> 保存中...';
    btn.disabled = true;

    try {
        // 更新价格
        currentConfig.price = parseFloat(document.getElementById('price').value);

        const response = await fetch(`${API_BASE}/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentConfig)
        });

        const data = await response.json();

        if (data.success) {
            updateStats(data.stats);
            showSuccess('配置已保存到服务器');
            logMessage('配置保存成功', 'success');
            showFeishuToast('配置保存成功');
        } else {
            showError('保存失败: ' + data.error);
        }
    } catch (error) {
        showError('保存失败: ' + error.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// 日志记录
function logMessage(message, type = 'info') {
    const logArea = document.getElementById('logArea');
    const time = new Date().toLocaleTimeString();
    const logClass = `log-${type}`;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="log-time">[${time}]</span><span class="${logClass}">${message}</span>`;

    logArea.appendChild(entry);
    logArea.scrollTop = logArea.scrollHeight;

    // 限制日志数量
    if (logArea.children.length > 100) {
        logArea.removeChild(logArea.firstChild);
    }
}

// 显示错误提示
function showError(message) {
    document.getElementById('messageModalTitle').textContent = '错误';
    document.getElementById('messageModalBody').innerHTML = `
        <div class="alert alert-danger mb-0">
            <i class="bi bi-exclamation-triangle-fill"></i> ${message}
        </div>
    `;
    messageModal.show();
    logMessage(message, 'error');
    
    // 同时使用飞书的提示
    showFeishuAlert('错误', message);
}

// 显示成功提示
function showSuccess(message) {
    document.getElementById('messageModalTitle').textContent = '成功';
    document.getElementById('messageModalBody').innerHTML = `
        <div class="alert alert-success mb-0">
            <i class="bi bi-check-circle-fill"></i> ${message}
        </div>
    `;
    messageModal.show();
}
