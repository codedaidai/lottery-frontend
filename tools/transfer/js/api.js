/**
 * API封装
 */

const API = {
    /**
     * 基础请求方法
     */
    request(url, params = {}, method = 'GET') {
        const config = {
            method: method,
            url: CONFIG.apiBase + url,
            timeout: CONFIG.timeout
        };

        if (method === 'GET') {
            config.params = params;
        } else {
            config.data = params;
        }

        return axios(config)
            .then(response => {
                const data = response.data;
                if (data.code !== 200) {
                    ElMessage.error(data.msg || '请求失败');
                    return Promise.reject(data);
                }
                return data;
            })
            .catch(error => {
                if (error.response) {
                    ElMessage.error('服务器错误: ' + error.response.status);
                } else if (error.request) {
                    ElMessage.error('网络错误，请检查后端服务是否启动');
                } else {
                    ElMessage.error('请求失败: ' + error.message);
                }
                return Promise.reject(error);
            });
    },

    /**
     * 数据概览
     */
    getDashboard() {
        return this.request('/dashboard');
    },

    /**
     * 转赠记录列表
     */
    getRecordList(params) {
        return this.request('/list', params);
    },

    /**
     * 转赠详情
     */
    getRecordDetail(id) {
        return this.request('/detail', { id });
    },

    /**
     * 用户统计
     */
    getUserStats(userId) {
        return this.request('/user_stats', { user_id: userId });
    },

    /**
     * 用户趋势
     */
    getUserTrend(userId, days = 30) {
        return this.request('/user_trend', { user_id: userId, days });
    },

    /**
     * 用户转赠关系网络
     */
    getUserNetwork(userId) {
        return this.request('/user_network', { user_id: userId });
    },

    /**
     * 互转用户对
     */
    getMutualPairs(minCount = 5) {
        return this.request('/mutual_pairs', { min_count: minCount });
    },

    /**
     * 导出Excel
     */
    exportExcel(params) {
        const queryString = new URLSearchParams(params).toString();
        const url = CONFIG.apiBase + '/export?' + queryString;
        window.open(url, '_blank');
    }
};
