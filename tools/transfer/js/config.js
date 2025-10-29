/**
 * 配置文件 - 支持本地开发和生产环境
 */

const CONFIG = {
    // API基础地址 - 自动根据环境切换
    apiBase: (() => {
        const hostname = window.location.hostname;

        // 本地开发环境
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8080/admin/transfer';
        }

        // 生产环境 - 通过Cloudflare Tunnel访问
        return 'https://rolled-article-beautifully-campbell.trycloudflare.com/admin/transfer';
    })(),

    // 分页配置
    pageSize: 20,

    // 请求超时时间（毫秒）
    timeout: 30000,

    // 图表主题
    chartTheme: 'light'
};
