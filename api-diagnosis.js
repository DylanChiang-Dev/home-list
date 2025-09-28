import https from 'https';
import http from 'http';
import { URL } from 'url';

const API_BASE_URL = 'https://home-list-api.dylan-chiang.workers.dev';
const TEST_ENDPOINTS = [
    '/',
    '/api/family/members',
    '/api/family/invites', 
    '/api/tasks',
    '/api/auth/me'
];

class APITester {
    constructor() {
        this.results = {
            connectivity: [],
            cors: [],
            endpoints: [],
            performance: [],
            errors: []
        };
    }

    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        const emoji = {
            'INFO': '📋',
            'SUCCESS': '✅', 
            'ERROR': '❌',
            'WARNING': '⚠️',
            'DEBUG': '🔍'
        }[type] || '📋';
        console.log(`[${timestamp}] ${emoji} ${message}`);
    }

    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'User-Agent': 'Node.js API Tester',
                    'Accept': 'application/json',
                    ...options.headers
                },
                timeout: options.timeout || 10000
            };

            const startTime = Date.now();
            const req = client.request(requestOptions, (res) => {
                const duration = Date.now() - startTime;
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        statusMessage: res.statusMessage,
                        headers: res.headers,
                        data: data,
                        duration: duration,
                        success: res.statusCode < 400
                    });
                });
            });

            req.on('error', (error) => {
                const duration = Date.now() - startTime;
                reject({
                    error: error.message,
                    code: error.code,
                    duration: duration,
                    success: false
                });
            });

            req.on('timeout', () => {
                req.destroy();
                const duration = Date.now() - startTime;
                reject({
                    error: 'Request timeout',
                    code: 'TIMEOUT',
                    duration: duration,
                    success: false
                });
            });

            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    }

    async testConnectivity() {
        this.log('开始基础连通性测试...', 'INFO');
        
        try {
            // 测试基本HTTP连接
            const result = await this.makeRequest(`${API_BASE_URL}/`, {
                method: 'HEAD',
                timeout: 5000
            });
            
            this.log(`基础连接测试: HTTP ${result.statusCode} (${result.duration}ms)`, 'SUCCESS');
            this.results.connectivity.push({
                test: 'basic_connection',
                status: result.statusCode,
                duration: result.duration,
                success: true
            });
            
        } catch (error) {
            this.log(`基础连接失败: ${error.error} (${error.code})`, 'ERROR');
            this.results.connectivity.push({
                test: 'basic_connection',
                error: error.error,
                code: error.code,
                success: false
            });
            this.results.errors.push(error);
        }
    }

    async testCORS() {
        this.log('开始CORS测试...', 'INFO');
        
        try {
            // 测试OPTIONS预检请求
            const result = await this.makeRequest(`${API_BASE_URL}/api/family/members`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'http://localhost:5173',
                    'Access-Control-Request-Method': 'GET',
                    'Access-Control-Request-Headers': 'Content-Type,Authorization'
                }
            });
            
            this.log(`CORS预检测试: HTTP ${result.statusCode} (${result.duration}ms)`, 'SUCCESS');
            this.log(`CORS Headers: ${JSON.stringify({
                'access-control-allow-origin': result.headers['access-control-allow-origin'],
                'access-control-allow-methods': result.headers['access-control-allow-methods'],
                'access-control-allow-headers': result.headers['access-control-allow-headers'],
                'access-control-allow-credentials': result.headers['access-control-allow-credentials']
            }, null, 2)}`, 'DEBUG');
            
            this.results.cors.push({
                test: 'options_preflight',
                status: result.statusCode,
                duration: result.duration,
                corsHeaders: {
                    origin: result.headers['access-control-allow-origin'],
                    methods: result.headers['access-control-allow-methods'],
                    headers: result.headers['access-control-allow-headers'],
                    credentials: result.headers['access-control-allow-credentials']
                },
                success: true
            });
            
        } catch (error) {
            this.log(`CORS测试失败: ${error.error} (${error.code})`, 'ERROR');
            this.results.cors.push({
                test: 'options_preflight',
                error: error.error,
                code: error.code,
                success: false
            });
            this.results.errors.push(error);
        }
    }

    async testEndpoints() {
        this.log('开始API端点测试...', 'INFO');
        
        for (const endpoint of TEST_ENDPOINTS) {
            try {
                // 模拟浏览器请求
                const result = await this.makeRequest(`${API_BASE_URL}${endpoint}`, {
                    method: 'GET',
                    headers: {
                        'Origin': 'http://localhost:5173',
                        'Content-Type': 'application/json',
                        'Referer': 'http://localhost:5173/',
                        'Accept': 'application/json, text/plain, */*'
                    }
                });
                
                let responseData = '';
                try {
                    responseData = result.data ? JSON.parse(result.data) : {};
                } catch {
                    responseData = result.data.substring(0, 100) + (result.data.length > 100 ? '...' : '');
                }
                
                this.log(`${endpoint}: HTTP ${result.statusCode} (${result.duration}ms)`, 
                    result.statusCode < 500 ? 'SUCCESS' : 'ERROR');
                
                if (result.statusCode >= 400) {
                    this.log(`响应内容: ${JSON.stringify(responseData)}`, 'DEBUG');
                }
                
                this.results.endpoints.push({
                    endpoint: endpoint,
                    status: result.statusCode,
                    statusMessage: result.statusMessage,
                    duration: result.duration,
                    responseSize: result.data.length,
                    success: result.statusCode < 500,
                    corsHeaders: {
                        origin: result.headers['access-control-allow-origin'],
                        credentials: result.headers['access-control-allow-credentials']
                    }
                });
                
            } catch (error) {
                this.log(`${endpoint}: 请求失败 - ${error.error} (${error.code})`, 'ERROR');
                this.results.endpoints.push({
                    endpoint: endpoint,
                    error: error.error,
                    code: error.code,
                    duration: error.duration,
                    success: false
                });
                this.results.errors.push({ endpoint, ...error });
            }
        }
    }

    async testPerformance() {
        this.log('开始性能测试...', 'INFO');
        
        const testEndpoint = '/api/family/members';
        const testCounts = [1, 3, 5];
        
        for (const count of testCounts) {
            try {
                this.log(`测试 ${count} 个并发请求...`, 'INFO');
                const startTime = Date.now();
                
                const promises = Array(count).fill().map(() => 
                    this.makeRequest(`${API_BASE_URL}${testEndpoint}`, {
                        headers: {
                            'Origin': 'http://localhost:5173',
                            'Content-Type': 'application/json'
                        }
                    }).catch(error => ({ error: true, ...error }))
                );
                
                const results = await Promise.all(promises);
                const totalDuration = Date.now() - startTime;
                const successful = results.filter(r => !r.error).length;
                const avgDuration = results
                    .filter(r => !r.error && r.duration)
                    .reduce((sum, r) => sum + r.duration, 0) / successful || 0;
                
                this.log(`${count} 并发请求完成: ${successful}/${count} 成功, 总时间 ${totalDuration}ms, 平均 ${avgDuration.toFixed(2)}ms`, 
                    successful === count ? 'SUCCESS' : 'WARNING');
                
                this.results.performance.push({
                    concurrency: count,
                    totalDuration: totalDuration,
                    avgDuration: avgDuration,
                    successCount: successful,
                    totalCount: count,
                    successRate: (successful / count) * 100
                });
                
            } catch (error) {
                this.log(`${count} 并发测试失败: ${error.message}`, 'ERROR');
                this.results.performance.push({
                    concurrency: count,
                    error: error.message,
                    success: false
                });
            }
        }
    }

    generateReport() {
        this.log('\n=== 诊断报告 ===', 'INFO');
        
        // 连通性报告
        const connectivitySuccess = this.results.connectivity.filter(r => r.success).length;
        this.log(`连通性测试: ${connectivitySuccess}/${this.results.connectivity.length} 通过`, 
            connectivitySuccess > 0 ? 'SUCCESS' : 'ERROR');
        
        // CORS报告
        const corsSuccess = this.results.cors.filter(r => r.success).length;
        this.log(`CORS测试: ${corsSuccess}/${this.results.cors.length} 通过`, 
            corsSuccess > 0 ? 'SUCCESS' : 'ERROR');
        
        // API端点报告
        const endpointSuccess = this.results.endpoints.filter(r => r.success).length;
        this.log(`API端点测试: ${endpointSuccess}/${this.results.endpoints.length} 可访问`, 
            endpointSuccess > 0 ? 'SUCCESS' : 'ERROR');
        
        // 性能报告
        if (this.results.performance.length > 0) {
            const avgResponseTime = this.results.performance
                .filter(r => r.avgDuration)
                .reduce((sum, r) => sum + r.avgDuration, 0) / this.results.performance.length;
            this.log(`平均响应时间: ${avgResponseTime.toFixed(2)}ms`, 
                avgResponseTime < 1000 ? 'SUCCESS' : 'WARNING');
        }
        
        // 错误汇总
        if (this.results.errors.length > 0) {
            this.log(`\n发现 ${this.results.errors.length} 个错误:`, 'ERROR');
            this.results.errors.forEach((error, index) => {
                this.log(`${index + 1}. ${error.error} (${error.code || 'UNKNOWN'})`, 'ERROR');
            });
        }
        
        // 建议
        this.log('\n=== 诊断建议 ===', 'INFO');
        
        if (connectivitySuccess === 0) {
            this.log('• 基础连接失败，请检查网络连接和防火墙设置', 'WARNING');
        }
        
        if (corsSuccess === 0) {
            this.log('• CORS配置可能有问题，请检查服务器CORS设置', 'WARNING');
        }
        
        if (endpointSuccess < this.results.endpoints.length) {
            this.log('• 部分API端点无法访问，可能是服务器问题或认证问题', 'WARNING');
        }
        
        const networkErrors = this.results.errors.filter(e => 
            e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED' || e.code === 'TIMEOUT'
        );
        
        if (networkErrors.length > 0) {
            this.log('• 检测到网络连接问题，建议检查DNS设置和网络连接', 'WARNING');
        }
        
        if (this.results.errors.length === 0 && endpointSuccess > 0) {
            this.log('• API服务运行正常，ERR_ABORTED可能是前端配置问题', 'SUCCESS');
        }
        
        return this.results;
    }

    async runFullDiagnosis() {
        this.log('开始全面API诊断...', 'INFO');
        
        await this.testConnectivity();
        await this.testCORS();
        await this.testEndpoints();
        await this.testPerformance();
        
        return this.generateReport();
    }
}

// 运行诊断
const tester = new APITester();
tester.runFullDiagnosis().then(results => {
    console.log('\n=== 完整诊断结果 ===');
    console.log(JSON.stringify(results, null, 2));
}).catch(error => {
    console.error('诊断过程中发生错误:', error);
});