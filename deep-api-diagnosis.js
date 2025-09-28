#!/usr/bin/env node

import https from 'https';
import http from 'http';
import { promises as dns } from 'dns';
import { performance } from 'perf_hooks';
import fs from 'fs';

// API配置
const API_BASE = 'https://home-list-api.zhangkaishen.workers.dev';
const LOCAL_BASE = 'http://localhost:5173';

// 颜色输出
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

function log(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// 深度网络诊断
class DeepNetworkDiagnostic {
    constructor() {
        this.results = {
            dns: {},
            connectivity: {},
            api: {},
            performance: {},
            errors: []
        };
    }

    // DNS解析测试
    async testDNS() {
        log('cyan', '\n🔍 DNS解析测试');
        log('cyan', '='.repeat(50));
        
        const domains = [
            'home-list-api.zhangkaishen.workers.dev',
            'cloudflare.com',
            'workers.dev',
            'google.com'
        ];

        for (const domain of domains) {
            try {
                const start = performance.now();
                const addresses = await dns.resolve4(domain);
                const time = (performance.now() - start).toFixed(2);
                
                this.results.dns[domain] = {
                    success: true,
                    addresses,
                    time: `${time}ms`
                };
                
                log('green', `✅ ${domain}: ${addresses.join(', ')} (${time}ms)`);
            } catch (error) {
                this.results.dns[domain] = {
                    success: false,
                    error: error.message
                };
                
                log('red', `❌ ${domain}: ${error.message}`);
                this.results.errors.push(`DNS解析失败: ${domain} - ${error.message}`);
            }
        }
    }

    // TLS/SSL连接测试
    async testTLSConnection() {
        log('cyan', '\n🔒 TLS/SSL连接测试');
        log('cyan', '='.repeat(50));
        
        return new Promise((resolve) => {
            const start = performance.now();
            const req = https.request({
                hostname: 'home-list-api.zhangkaishen.workers.dev',
                port: 443,
                path: '/',
                method: 'HEAD',
                timeout: 10000
            }, (res) => {
                const time = (performance.now() - start).toFixed(2);
                
                this.results.connectivity.tls = {
                    success: true,
                    statusCode: res.statusCode,
                    headers: res.headers,
                    time: `${time}ms`
                };
                
                log('green', `✅ TLS连接成功: ${res.statusCode} (${time}ms)`);
                log('blue', `   服务器: ${res.headers.server || 'Unknown'}`);
                log('blue', `   CF-Ray: ${res.headers['cf-ray'] || 'None'}`);
                resolve();
            });

            req.on('error', (error) => {
                this.results.connectivity.tls = {
                    success: false,
                    error: error.message
                };
                
                log('red', `❌ TLS连接失败: ${error.message}`);
                this.results.errors.push(`TLS连接失败: ${error.message}`);
                resolve();
            });

            req.on('timeout', () => {
                req.destroy();
                this.results.connectivity.tls = {
                    success: false,
                    error: 'Connection timeout'
                };
                
                log('red', '❌ TLS连接超时');
                this.results.errors.push('TLS连接超时');
                resolve();
            });

            req.end();
        });
    }

    // Cloudflare Workers健康检查
    async testWorkersHealth() {
        log('cyan', '\n⚡ Cloudflare Workers健康检查');
        log('cyan', '='.repeat(50));
        
        const endpoints = [
            '/',
            '/health',
            '/api/health',
            '/api/family/members',
            '/api/family/invites'
        ];

        for (const endpoint of endpoints) {
            await this.testSingleEndpoint(endpoint);
        }
    }

    async testSingleEndpoint(path) {
        return new Promise((resolve) => {
            const start = performance.now();
            const req = https.request({
                hostname: 'home-list-api.zhangkaishen.workers.dev',
                port: 443,
                path: path,
                method: 'GET',
                headers: {
                    'User-Agent': 'Deep-Diagnostic-Tool/1.0',
                    'Accept': 'application/json',
                    'Authorization': 'Bearer test-token'
                },
                timeout: 15000
            }, (res) => {
                const time = (performance.now() - start).toFixed(2);
                let body = '';
                
                res.on('data', (chunk) => {
                    body += chunk;
                });
                
                res.on('end', () => {
                    this.results.api[path] = {
                        success: res.statusCode < 500,
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body.substring(0, 200),
                        time: `${time}ms`
                    };
                    
                    const statusColor = res.statusCode < 400 ? 'green' : res.statusCode < 500 ? 'yellow' : 'red';
                    const statusIcon = res.statusCode < 400 ? '✅' : res.statusCode < 500 ? '⚠️' : '❌';
                    
                    log(statusColor, `${statusIcon} ${path}: ${res.statusCode} (${time}ms)`);
                    
                    if (res.headers['cf-ray']) {
                        log('blue', `   CF-Ray: ${res.headers['cf-ray']}`);
                    }
                    
                    if (body && body.length > 0) {
                        try {
                            const jsonBody = JSON.parse(body);
                            if (jsonBody.error) {
                                log('yellow', `   错误: ${jsonBody.error}`);
                            }
                        } catch (e) {
                            log('blue', `   响应: ${body.substring(0, 100)}...`);
                        }
                    }
                    
                    if (res.statusCode >= 500) {
                        this.results.errors.push(`服务器错误: ${path} - ${res.statusCode}`);
                    }
                    
                    resolve();
                });
            });

            req.on('error', (error) => {
                const time = (performance.now() - start).toFixed(2);
                
                this.results.api[path] = {
                    success: false,
                    error: error.message,
                    time: `${time}ms`
                };
                
                log('red', `❌ ${path}: ${error.message} (${time}ms)`);
                
                if (error.code === 'ECONNABORTED' || error.message.includes('aborted')) {
                    this.results.errors.push(`ERR_ABORTED: ${path} - ${error.message}`);
                } else if (error.message.includes('fetch') || error.code === 'ENOTFOUND') {
                    this.results.errors.push(`Failed to fetch: ${path} - ${error.message}`);
                } else {
                    this.results.errors.push(`网络错误: ${path} - ${error.message}`);
                }
                
                resolve();
            });

            req.on('timeout', () => {
                req.destroy();
                const time = (performance.now() - start).toFixed(2);
                
                this.results.api[path] = {
                    success: false,
                    error: 'Request timeout',
                    time: `${time}ms`
                };
                
                log('red', `❌ ${path}: 请求超时 (${time}ms)`);
                this.results.errors.push(`请求超时: ${path}`);
                resolve();
            });

            req.end();
        });
    }

    // 并发压力测试
    async testConcurrentRequests() {
        log('cyan', '\n🚀 并发压力测试');
        log('cyan', '='.repeat(50));
        
        const concurrencyLevels = [1, 3, 5, 10];
        
        for (const concurrency of concurrencyLevels) {
            log('blue', `\n测试并发数: ${concurrency}`);
            
            const promises = [];
            const start = performance.now();
            
            for (let i = 0; i < concurrency; i++) {
                promises.push(this.makeConcurrentRequest(i));
            }
            
            const results = await Promise.allSettled(promises);
            const totalTime = (performance.now() - start).toFixed(2);
            
            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
            const failed = results.length - successful;
            
            this.results.performance[`concurrency_${concurrency}`] = {
                total: results.length,
                successful,
                failed,
                successRate: `${((successful / results.length) * 100).toFixed(1)}%`,
                totalTime: `${totalTime}ms`,
                avgTime: `${(totalTime / results.length).toFixed(2)}ms`
            };
            
            log('green', `   成功: ${successful}/${results.length} (${((successful / results.length) * 100).toFixed(1)}%)`);
            log('blue', `   总时间: ${totalTime}ms, 平均: ${(totalTime / results.length).toFixed(2)}ms`);
            
            if (failed > 0) {
                log('red', `   失败: ${failed}`);
                results.forEach((result, index) => {
                    if (result.status === 'rejected' || !result.value.success) {
                        const error = result.reason || result.value.error;
                        log('red', `     请求${index + 1}: ${error}`);
                    }
                });
            }
        }
    }

    async makeConcurrentRequest(index) {
        return new Promise((resolve) => {
            const start = performance.now();
            const req = https.request({
                hostname: 'home-list-api.zhangkaishen.workers.dev',
                port: 443,
                path: '/api/family/members',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer test-token',
                    'User-Agent': `Concurrent-Test-${index}/1.0`
                },
                timeout: 10000
            }, (res) => {
                const time = (performance.now() - start).toFixed(2);
                resolve({
                    success: res.statusCode < 500,
                    statusCode: res.statusCode,
                    time
                });
            });

            req.on('error', (error) => {
                const time = (performance.now() - start).toFixed(2);
                resolve({
                    success: false,
                    error: error.message,
                    time
                });
            });

            req.on('timeout', () => {
                req.destroy();
                resolve({
                    success: false,
                    error: 'timeout',
                    time: '10000+'
                });
            });

            req.end();
        });
    }

    // 生成诊断报告
    generateReport() {
        log('magenta', '\n📊 深度诊断报告');
        log('magenta', '='.repeat(50));
        
        // DNS状态
        const dnsIssues = Object.values(this.results.dns).filter(r => !r.success).length;
        log('cyan', `\nDNS解析状态: ${dnsIssues === 0 ? '✅ 正常' : `❌ ${dnsIssues}个问题`}`);
        
        // 连接状态
        const tlsOk = this.results.connectivity.tls?.success;
        log('cyan', `TLS连接状态: ${tlsOk ? '✅ 正常' : '❌ 异常'}`);
        
        // API状态
        const apiResults = Object.values(this.results.api);
        const apiIssues = apiResults.filter(r => !r.success).length;
        log('cyan', `API端点状态: ${apiIssues === 0 ? '✅ 正常' : `❌ ${apiIssues}个问题`}`);
        
        // 错误汇总
        if (this.results.errors.length > 0) {
            log('red', '\n🚨 发现的问题:');
            this.results.errors.forEach((error, index) => {
                log('red', `   ${index + 1}. ${error}`);
            });
        }
        
        // 性能汇总
        log('cyan', '\n⚡ 性能汇总:');
        Object.entries(this.results.performance).forEach(([key, perf]) => {
            log('blue', `   ${key}: 成功率 ${perf.successRate}, 平均响应 ${perf.avgTime}`);
        });
        
        // 建议
        log('yellow', '\n💡 诊断建议:');
        
        if (dnsIssues > 0) {
            log('yellow', '   • DNS解析存在问题，检查网络连接和DNS设置');
        }
        
        if (!tlsOk) {
            log('yellow', '   • TLS连接失败，可能是网络防火墙或代理问题');
        }
        
        if (apiIssues > 0) {
            log('yellow', '   • API端点存在问题，检查Cloudflare Workers部署状态');
        }
        
        const hasAbortErrors = this.results.errors.some(e => e.includes('ERR_ABORTED'));
        const hasFetchErrors = this.results.errors.some(e => e.includes('Failed to fetch'));
        
        if (hasAbortErrors) {
            log('yellow', '   • 检测到ERR_ABORTED错误，可能是请求被取消或超时');
            log('yellow', '     - 检查前端代码中的AbortController使用');
            log('yellow', '     - 增加请求超时时间');
            log('yellow', '     - 实施重试机制');
        }
        
        if (hasFetchErrors) {
            log('yellow', '   • 检测到Failed to fetch错误，可能是网络连接问题');
            log('yellow', '     - 检查CORS配置');
            log('yellow', '     - 验证API域名可访问性');
            log('yellow', '     - 考虑使用备用端点');
        }
        
        // 保存详细报告
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                dnsIssues,
                tlsOk,
                apiIssues,
                totalErrors: this.results.errors.length
            },
            details: this.results
        };
        
        fs.writeFileSync(
            `deep-diagnostic-report-${Date.now()}.json`,
            JSON.stringify(reportData, null, 2)
        );
        
        log('green', `\n📄 详细报告已保存到: deep-diagnostic-report-${Date.now()}.json`);
    }

    // 运行完整诊断
    async runFullDiagnostic() {
        log('magenta', '🔬 开始深度API诊断...');
        log('magenta', '='.repeat(50));
        
        try {
            await this.testDNS();
            await this.testTLSConnection();
            await this.testWorkersHealth();
            await this.testConcurrentRequests();
            
            this.generateReport();
            
        } catch (error) {
            log('red', `\n❌ 诊断过程中发生错误: ${error.message}`);
            this.results.errors.push(`诊断错误: ${error.message}`);
        }
    }
}

// 运行诊断
const diagnostic = new DeepNetworkDiagnostic();
diagnostic.runFullDiagnostic().then(() => {
    log('green', '\n✅ 深度诊断完成!');
    process.exit(0);
}).catch((error) => {
    log('red', `\n❌ 诊断失败: ${error.message}`);
    process.exit(1);
});

export default DeepNetworkDiagnostic;