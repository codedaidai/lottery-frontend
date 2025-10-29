// 全局变量
// 自动适配本地和局域网访问
const API_BASE = resolveApiBase();
let currentConfig = null;
let messageModal = null;

function resolveApiBase() {
    const origin = window.location.origin;
    if (origin && origin !== 'null' && !origin.startsWith('file://')) {
        return `${origin.replace(/\/$/, '')}/api`;
    }
    return 'http://127.0.0.1:5000/api';
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    messageModal = new bootstrap.Modal(document.getElementById('messageModal'));
    loadConfig();
    setupEventListeners();
    logMessage('系统初始化完成', 'success');
});

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
        const isBox = prize.type === 'box';
        const row = tbody.insertRow();

        if (isBox) {
            // 宝箱类型：计算期望价值
            const boxValue = prize.sub_prizes.reduce((sum, sp) => sum + sp.prob * sp.value, 0);
            row.innerHTML = `
                <td>
                    <button class="btn btn-sm btn-link p-0 me-2" onclick="toggleBox(${index})" id="toggleBtn${index}">
                        <i class="bi bi-chevron-right"></i>
                    </button>
                    <input type="text" class="form-control form-control-sm d-inline-block" style="width: 70%"
                           value="${prize.name}"
                           onchange="updatePrize(${index}, 'name', this.value)">
                    <span class="badge bg-primary ms-1">宝箱</span>
                </td>
                <td>
                    <input type="number" class="form-control form-control-sm"
                           value="${(prize.prob * 100).toFixed(4)}"
                           step="0.0001" min="0" max="100"
                           onchange="updatePrize(${index}, 'prob', parseFloat(this.value) / 100)">
                </td>
                <td class="text-muted">
                    ${boxValue.toFixed(2)} (期望)
                </td>
                <td class="text-muted">
                    ${(prize.prob * boxValue).toFixed(2)}
                </td>
                <td>
                    <button class="btn btn-sm btn-danger btn-delete" onclick="deletePrize(${index})">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            `;
        } else {
            // 普通奖品
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
        }

        // 如果是宝箱，添加子商品行（初始隐藏）
        if (isBox) {
            const subRow = tbody.insertRow();
            subRow.id = `subPrizes${index}`;
            subRow.style.display = 'none';
            subRow.innerHTML = `
                <td colspan="5" class="bg-light">
                    <div class="ms-4 p-2">
                        <h6>宝箱内商品 <button class="btn btn-sm btn-success" onclick="addSubPrize(${index})"><i class="bi bi-plus"></i> 添加商品</button></h6>
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th>商品名称</th>
                                    <th>概率 (%)</th>
                                    <th>价值</th>
                                    <th>期望成本</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="subPrizesTable${index}">
                                ${renderSubPrizes(prize.sub_prizes, index)}
                            </tbody>
                        </table>
                    </div>
                </td>
            `;
        }
    });

    updateTotals(prizes);
}

// 渲染宝箱子商品
function renderSubPrizes(subPrizes, parentIndex) {
    return subPrizes.map((sp, spIndex) => `
        <tr>
            <td>
                <input type="text" class="form-control form-control-sm"
                       value="${sp.name}"
                       onchange="updateSubPrize(${parentIndex}, ${spIndex}, 'name', this.value)">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm"
                       value="${(sp.prob * 100).toFixed(4)}"
                       step="0.0001" min="0" max="100"
                       onchange="updateSubPrize(${parentIndex}, ${spIndex}, 'prob', parseFloat(this.value) / 100)">
            </td>
            <td>
                <input type="number" class="form-control form-control-sm"
                       value="${sp.value}"
                       step="0.01" min="0"
                       onchange="updateSubPrize(${parentIndex}, ${spIndex}, 'value', parseFloat(this.value))">
            </td>
            <td class="text-muted">
                ${(sp.prob * sp.value).toFixed(2)}
            </td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteSubPrize(${parentIndex}, ${spIndex})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// 切换宝箱展开/折叠
function toggleBox(index) {
    const subRow = document.getElementById(`subPrizes${index}`);
    const toggleBtn = document.getElementById(`toggleBtn${index}`);
    if (subRow.style.display === 'none') {
        subRow.style.display = '';
        toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
    } else {
        subRow.style.display = 'none';
        toggleBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
    }
}

// 更新子商品
function updateSubPrize(parentIndex, subIndex, field, value) {
    if (!currentConfig) return;
    currentConfig.prizes[parentIndex].sub_prizes[subIndex][field] = value;
    renderPrizesTable(currentConfig.prizes);
    logMessage(`已修改宝箱子商品 ${field}`, 'info');
}

// 添加子商品
function addSubPrize(parentIndex) {
    if (!currentConfig) return;
    const newSubPrize = {
        name: '新商品',
        prob: 0.1,
        value: 10
    };
    currentConfig.prizes[parentIndex].sub_prizes.push(newSubPrize);
    renderPrizesTable(currentConfig.prizes);
    logMessage('已添加宝箱子商品', 'info');
}

// 删除子商品
function deleteSubPrize(parentIndex, subIndex) {
    if (!currentConfig) return;
    if (currentConfig.prizes[parentIndex].sub_prizes.length <= 1) {
        showError('宝箱至少需要保留一个商品');
        return;
    }
    currentConfig.prizes[parentIndex].sub_prizes.splice(subIndex, 1);
    renderPrizesTable(currentConfig.prizes);
    logMessage('已删除宝箱子商品', 'warning');
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
}

// 添加奖品 (弹出选择框)
function addPrize() {
    if (!currentConfig) return;

    // 使用 Bootstrap Modal 选择奖品类型
    const modalHtml = `
        <div class="modal fade" id="addPrizeModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">选择奖品类型</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="d-grid gap-2">
                            <button class="btn btn-primary" onclick="addNormalPrize()">
                                <i class="bi bi-gift"></i> 添加普通奖品
                            </button>
                            <button class="btn btn-info" onclick="addBoxPrize()">
                                <i class="bi bi-box"></i> 添加宝箱
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 移除旧的 modal（如果存在）
    const oldModal = document.getElementById('addPrizeModal');
    if (oldModal) oldModal.remove();

    // 添加新 modal
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    const modal = new bootstrap.Modal(document.getElementById('addPrizeModal'));
    modal.show();
}

// 添加普通奖品
function addNormalPrize() {
    const newPrize = {
        name: `新奖品 ${currentConfig.prizes.length + 1}`,
        prob: 0.01,
        value: 10
    };

    currentConfig.prizes.push(newPrize);
    renderPrizesTable(currentConfig.prizes);
    logMessage('已添加新奖品', 'info');

    // 关闭 modal
    bootstrap.Modal.getInstance(document.getElementById('addPrizeModal')).hide();
}

// 添加宝箱
function addBoxPrize() {
    const newBox = {
        name: `新宝箱 ${currentConfig.prizes.length + 1}`,
        type: 'box',
        prob: 0.01,
        sub_prizes: [
            { name: '奖品A', prob: 0.3, value: 100 },
            { name: '奖品B', prob: 0.5, value: 50 },
            { name: '谢谢参与', prob: 0.2, value: 0 }
        ]
    };

    currentConfig.prizes.push(newBox);
    renderPrizesTable(currentConfig.prizes);
    logMessage('已添加新宝箱', 'info');

    // 关闭 modal
    bootstrap.Modal.getInstance(document.getElementById('addPrizeModal')).hide();
}

// 更新总计行
function updateTotals(prizes) {
    const totalProb = prizes.reduce((sum, p) => sum + p.prob, 0);

    // 计算总期望赔付（宝箱需要计算期望价值）
    const totalExpected = prizes.reduce((sum, p) => {
        if (p.type === 'box') {
            const boxValue = p.sub_prizes.reduce((s, sp) => s + sp.prob * sp.value, 0);
            return sum + (p.prob * boxValue);
        } else {
            return sum + (p.prob * p.value);
        }
    }, 0);

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
