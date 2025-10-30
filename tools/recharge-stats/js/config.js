const CONFIG = {
    apiBase: (() => {
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:8002';
        }
        // 生产环境 - 需要配置 Cloudflare Tunnel URL
        return 'http://localhost:8002'; // 暂时使用本地地址
    })(),
    timeout: 30000
};
