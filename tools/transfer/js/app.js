/**
 * 主应用逻辑
 */

const { createApp } = Vue;
const { ElMessage } = ElementPlus;

const app = createApp({
    data() {
        return {
            // 当前菜单
            currentMenu: 'dashboard',
            menuTitle: '数据概览',
            apiBase: CONFIG.apiBase,

            // 数据概览
            dashboardData: {
                stats: {
                    total_count: 0,
                    total_items: 0,
                    total_users: 0,
                    total_value: 0
                },
                trend: [],
                top_users: []
            },

            // 最新转赠动态
            recentTransfers: [],

            // 转赠记录
            recordsList: [],
            recordsPage: 1,
            recordsLimit: 20,
            recordsTotal: 0,
            recordsLoading: false,
            recordsFilter: {
                user_id: '',
                direction: '',
                dateRange: null,
                min_count: '',
                max_count: '',
                min_value: '',
                max_value: ''
            },

            // 详情弹窗
            detailVisible: false,
            currentDetail: null,

            // 用户分析
            userAnalysisId: '',
            userStats: {
                user_info: null,
                send: { count: 0, items: 0, value: 0 },
                receive: { count: 0, items: 0, value: 0 },
                top_receivers: [],
                send_detail_list: [],
                receive_detail_list: []
            },
            userTrendData: {
                send_trend: [],
                receive_trend: []
            },
            userNetworkData: {
                center_user: null,
                send_list: [],
                receive_list: []
            },
            userLoading: false,

            // 关系网络
            networkPairs: [],
            networkMinCount: 5,
            networkLoading: false
        };
    },

    mounted() {
        // 初始加载数据概览
        this.loadDashboard();
    },

    methods: {
        /**
         * 菜单切换
         */
        handleMenuSelect(index) {
            this.currentMenu = index;

            const titles = {
                'dashboard': '数据概览',
                'records': '转赠记录',
                'user': '用户分析',
                'network': '转赠排行'
            };

            this.menuTitle = titles[index];

            // 切换到相应页面时加载数据
            if (index === 'dashboard' && !this.dashboardData.trend.length) {
                this.loadDashboard();
            } else if (index === 'records' && !this.recordsList.length) {
                this.loadRecords();
            } else if (index === 'network' && !this.networkPairs.length) {
                this.loadNetwork();
            }
        },

        /**
         * 加载数据概览
         */
        async loadDashboard() {
            try {
                const res = await API.getDashboard();
                this.dashboardData = res.data;

                // 加载最新转赠动态（最近24小时，限制10条）
                await this.loadRecentTransfers();

                // 渲染图表
                this.$nextTick(() => {
                    this.renderTrendChart();
                    this.renderTopUsersChart();
                });

                ElMessage.success('数据加载成功');
            } catch (error) {
                console.error('加载数据概览失败', error);
            }
        },

        /**
         * 加载最新转赠动态
         */
        async loadRecentTransfers() {
            try {
                // 获取最近24小时的记录
                const now = new Date();
                const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                const startTime = yesterday.toISOString().split('T')[0];

                const res = await API.getRecordList({
                    page: 1,
                    limit: 10,
                    start_time: startTime
                });
                this.recentTransfers = res.data.list.filter(item => item.is_recent);
            } catch (error) {
                console.error('加载最新动态失败', error);
                this.recentTransfers = [];
            }
        },

        /**
         * 渲染转赠趋势图
         */
        renderTrendChart() {
            const chart = echarts.init(document.getElementById('trendChart'));
            const dates = this.dashboardData.trend.map(item => item.date);
            const counts = this.dashboardData.trend.map(item => item.count);
            const items = this.dashboardData.trend.map(item => item.items);
            const values = this.dashboardData.trend.map(item => item.value);

            const option = {
                title: {
                    text: '转赠趋势（最近30天）',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['转赠次数', '转赠物品数', '转赠金额（¥）'],
                    bottom: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: dates
                },
                yAxis: [
                    {
                        type: 'value',
                        name: '次数/物品数',
                        position: 'left'
                    },
                    {
                        type: 'value',
                        name: '金额（¥）',
                        position: 'right'
                    }
                ],
                series: [
                    {
                        name: '转赠次数',
                        type: 'line',
                        data: counts,
                        smooth: true,
                        itemStyle: { color: '#409EFF' }
                    },
                    {
                        name: '转赠物品数',
                        type: 'line',
                        data: items,
                        smooth: true,
                        itemStyle: { color: '#67C23A' }
                    },
                    {
                        name: '转赠金额（¥）',
                        type: 'line',
                        data: values,
                        smooth: true,
                        yAxisIndex: 1,
                        itemStyle: { color: '#F56C6C' }
                    }
                ]
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        },

        /**
         * 渲染活跃用户图
         */
        renderTopUsersChart() {
            const chart = echarts.init(document.getElementById('topUsersChart'));
            const users = this.dashboardData.top_users.map(item =>
                `${item.user_id}:${item.nickname || '未知'}`
            );
            const counts = this.dashboardData.top_users.map(item => item.send_count);

            const option = {
                title: {
                    text: '活跃用户 TOP10',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value'
                },
                yAxis: {
                    type: 'category',
                    data: users
                },
                series: [
                    {
                        name: '转赠次数',
                        type: 'bar',
                        data: counts,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: '#83bff6' },
                                { offset: 0.5, color: '#188df0' },
                                { offset: 1, color: '#188df0' }
                            ])
                        }
                    }
                ]
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        },

        /**
         * 加载转赠记录
         */
        async loadRecords() {
            this.recordsLoading = true;

            try {
                const params = {
                    page: this.recordsPage,
                    limit: this.recordsLimit,
                    user_id: this.recordsFilter.user_id,
                    direction: this.recordsFilter.direction,
                    min_count: this.recordsFilter.min_count,
                    max_count: this.recordsFilter.max_count,
                    min_value: this.recordsFilter.min_value,
                    max_value: this.recordsFilter.max_value
                };

                if (this.recordsFilter.dateRange && this.recordsFilter.dateRange.length === 2) {
                    params.start_time = this.recordsFilter.dateRange[0];
                    params.end_time = this.recordsFilter.dateRange[1];
                }

                const res = await API.getRecordList(params);
                this.recordsList = res.data.list;
                this.recordsTotal = res.data.total;

                ElMessage.success('记录加载成功');
            } catch (error) {
                console.error('加载记录失败', error);
            } finally {
                this.recordsLoading = false;
            }
        },

        /**
         * 重置筛选条件
         */
        resetRecordsFilter() {
            this.recordsFilter = {
                user_id: '',
                direction: '',
                dateRange: null,
                min_count: '',
                max_count: '',
                min_value: '',
                max_value: ''
            };
            this.recordsPage = 1;
            this.loadRecords();
        },

        /**
         * 显示记录详情
         */
        async showRecordDetail(id) {
            try {
                const res = await API.getRecordDetail(id);
                this.currentDetail = res.data;
                this.detailVisible = true;
            } catch (error) {
                console.error('加载详情失败', error);
            }
        },

        /**
         * 导出Excel
         */
        exportExcel() {
            const params = {
                user_id: this.recordsFilter.user_id
            };

            if (this.recordsFilter.dateRange && this.recordsFilter.dateRange.length === 2) {
                params.start_time = this.recordsFilter.dateRange[0];
                params.end_time = this.recordsFilter.dateRange[1];
            }

            API.exportExcel(params);
            ElMessage.success('正在导出，请稍候...');
        },

        /**
         * 加载用户分析
         */
        async loadUserAnalysis() {
            if (!this.userAnalysisId) {
                ElMessage.warning('请输入用户ID');
                return;
            }

            this.userLoading = true;

            try {
                // 加载用户统计
                const statsRes = await API.getUserStats(this.userAnalysisId);
                this.userStats = statsRes.data;

                // 加载用户趋势
                const trendRes = await API.getUserTrend(this.userAnalysisId);
                this.userTrendData = trendRes.data;

                // 加载用户转赠网络
                const networkRes = await API.getUserNetwork(this.userAnalysisId);
                this.userNetworkData = networkRes.data;

                // 渲染图表 - 使用嵌套的$nextTick确保DOM完全就绪
                this.$nextTick(() => {
                    this.renderUserTrendChart();
                    this.renderTopReceiversChart();

                    // 用户网络图需要额外的$nextTick，因为它在v-if条件块内
                    this.$nextTick(() => {
                        this.renderUserNetworkChart();
                    });
                });

                ElMessage.success('用户数据加载成功');
            } catch (error) {
                console.error('加载用户分析失败', error);
            } finally {
                this.userLoading = false;
            }
        },

        /**
         * 渲染用户趋势图
         */
        renderUserTrendChart() {
            const chart = echarts.init(document.getElementById('userTrendChart'));

            // 合并日期
            const allDates = new Set([
                ...this.userTrendData.send_trend.map(item => item.date),
                ...this.userTrendData.receive_trend.map(item => item.date)
            ]);
            const dates = Array.from(allDates).sort();

            // 构建数据
            const sendData = dates.map(date => {
                const item = this.userTrendData.send_trend.find(t => t.date === date);
                return item ? item.items : 0;
            });

            const receiveData = dates.map(date => {
                const item = this.userTrendData.receive_trend.find(t => t.date === date);
                return item ? item.items : 0;
            });

            const option = {
                title: {
                    text: '转赠趋势',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['发出', '收到'],
                    bottom: 0
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '10%',
                    containLabel: true
                },
                xAxis: {
                    type: 'category',
                    boundaryGap: false,
                    data: dates
                },
                yAxis: {
                    type: 'value'
                },
                series: [
                    {
                        name: '发出',
                        type: 'line',
                        data: sendData,
                        smooth: true,
                        itemStyle: { color: '#409EFF' }
                    },
                    {
                        name: '收到',
                        type: 'line',
                        data: receiveData,
                        smooth: true,
                        itemStyle: { color: '#67C23A' }
                    }
                ]
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        },

        /**
         * 渲染常转赠对象图
         */
        renderTopReceiversChart() {
            const chart = echarts.init(document.getElementById('topReceiversChart'));
            const receivers = this.userStats.top_receivers.map(item =>
                `${item.give_user_id}:${item.nickname || '未知'}`
            );
            const counts = this.userStats.top_receivers.map(item => item.count);

            const option = {
                title: {
                    text: '常转赠对象 TOP5',
                    left: 'center'
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'shadow'
                    }
                },
                grid: {
                    left: '3%',
                    right: '4%',
                    bottom: '3%',
                    containLabel: true
                },
                xAxis: {
                    type: 'value'
                },
                yAxis: {
                    type: 'category',
                    data: receivers
                },
                series: [
                    {
                        name: '转赠次数',
                        type: 'bar',
                        data: counts,
                        itemStyle: {
                            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                                { offset: 0, color: '#fbc7d4' },
                                { offset: 0.5, color: '#9796f0' },
                                { offset: 1, color: '#fbc7d4' }
                            ])
                        }
                    }
                ]
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        },

        /**
         * 渲染用户转赠关系网络图
         */
        renderUserNetworkChart() {
            const container = document.getElementById('userNetworkChart');
            if (!container) {
                console.error('userNetworkChart container not found in DOM');
                return;
            }

            if (!this.userNetworkData.center_user) {
                return;
            }

            const chart = echarts.init(container);

            // 构建节点和连接 - 使用Map去重
            const nodesMap = new Map();
            const links = [];

            // 中心用户节点
            const centerUserId = this.userNetworkData.center_user.id.toString();
            nodesMap.set(centerUserId, {
                id: centerUserId,
                name: `${this.userNetworkData.center_user.id}:${this.userNetworkData.center_user.nickname}`,
                symbolSize: 80,
                category: 2,  // 中心用户分类
                value: 0,
                itemStyle: {
                    color: '#ff6b6b'
                },
                label: {
                    fontSize: 14,
                    fontWeight: 'bold'
                }
            });

            // 添加发出节点（蓝色）
            this.userNetworkData.send_list.forEach(item => {
                if (!item.target_user_id || !item.target_name) {
                    return;
                }

                const userId = item.target_user_id.toString();
                if (!nodesMap.has(userId)) {
                    nodesMap.set(userId, {
                        id: userId,
                        name: `${item.target_user_id}:${item.target_name}`,
                        symbolSize: 20 + Math.min(item.count * 2, 40),
                        category: 0,  // 接收转赠的用户
                        count: item.count,
                        value: parseFloat(item.value || 0).toFixed(2)
                    });
                }

                links.push({
                    source: centerUserId,
                    target: userId,
                    count: item.count,
                    value: parseFloat(item.value || 0).toFixed(2),
                    lineStyle: {
                        width: Math.max(1, Math.min(6, item.count / 5)),
                        color: '#409EFF',
                        curveness: 0.2
                    }
                });
            });

            // 添加收到节点（绿色）
            this.userNetworkData.receive_list.forEach(item => {
                if (!item.source_user_id || !item.source_name) {
                    return;
                }

                const userId = item.source_user_id.toString();
                if (!nodesMap.has(userId)) {
                    nodesMap.set(userId, {
                        id: userId,
                        name: `${item.source_user_id}:${item.source_name}`,
                        symbolSize: 20 + Math.min(item.count * 2, 40),
                        category: 1,  // 发出转赠的用户
                        count: item.count,
                        value: parseFloat(item.value || 0).toFixed(2)
                    });
                }

                links.push({
                    source: userId,
                    target: centerUserId,
                    count: item.count,
                    value: parseFloat(item.value || 0).toFixed(2),
                    lineStyle: {
                        width: Math.max(1, Math.min(6, item.count / 5)),
                        color: '#67C23A',
                        curveness: 0.2
                    }
                });
            });

            // 将Map转为数组
            const nodes = Array.from(nodesMap.values());

            const option = {
                title: {
                    text: `${this.userNetworkData.center_user.id}:${this.userNetworkData.center_user.nickname} 的转赠关系网络`,
                    left: 'center',
                    top: 10
                },
                tooltip: {
                    formatter: function(params) {
                        if (params.dataType === 'node') {
                            if (params.data.count) {
                                return `${params.data.name}<br/>转赠次数: ${params.data.count}次<br/>转赠价值: ¥${params.data.value}`;
                            } else {
                                return `${params.data.name}<br/>中心用户`;
                            }
                        } else if (params.dataType === 'edge') {
                            return `转赠次数: ${params.data.count}次<br/>转赠价值: ¥${params.data.value}`;
                        }
                    }
                },
                legend: {
                    data: ['接收转赠的用户', '发出转赠的用户', '中心用户'],
                    bottom: 10
                },
                series: [{
                    type: 'graph',
                    layout: 'force',
                    data: nodes,
                    links: links,
                    categories: [
                        { name: '接收转赠的用户', itemStyle: { color: '#409EFF' } },
                        { name: '发出转赠的用户', itemStyle: { color: '#67C23A' } },
                        { name: '中心用户', itemStyle: { color: '#ff6b6b' } }
                    ],
                    roam: true,
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{b}',
                        fontSize: 11
                    },
                    labelLayout: {
                        hideOverlap: true
                    },
                    emphasis: {
                        focus: 'adjacency',
                        label: {
                            fontSize: 14
                        },
                        lineStyle: {
                            width: 5
                        }
                    },
                    force: {
                        repulsion: 200,
                        gravity: 0.1,
                        edgeLength: [100, 200],
                        layoutAnimation: true
                    },
                    itemStyle: {
                        borderColor: '#fff',
                        borderWidth: 2
                    }
                }]
            };

            chart.setOption(option);
            window.addEventListener('resize', () => chart.resize());
        },

        /**
         * 加载关系网络
         */
        async loadNetwork() {
            this.networkLoading = true;

            try {
                const res = await API.getMutualPairs(this.networkMinCount);
                this.networkPairs = res.data;

                ElMessage.success('关系网络加载成功');
            } catch (error) {
                console.error('加载关系网络失败', error);
            } finally {
                this.networkLoading = false;
            }
        }
    }
});

app.use(ElementPlus);
app.mount('#app');
