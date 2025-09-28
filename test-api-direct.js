// 直接测试API请求的Node.js脚本
import https from 'https';
import http from 'http';
import dns from 'dns';
import net from 'net';

const API_BASE_URL = 'https://home-list-api.dylan-chiang.workers.dev';

// 测试函数
async function testApiRequest(path, description) {
    console.log(`\n=== 测试: ${description} ===`);
    console.log(`URL: ${API_BASE_URL}${path}`);
    
    return new Promise((resolve, reject) => {
        const url = new URL(`${API_BASE_URL}${path}`);
        
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Node.js Test Client',
                'Accept': 'application/json'
            },
            timeout: 10000
        };
        
        const req = https.request(options, (res) => {
            console.log(`状态码: ${res.statusCode}`);
            console.log(`响应头:`, res.headers);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`响应内容: ${data.substring(0, 200)}${data.length > 200 ? '...' : ''}`);
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data
                });
            });
        });
        
        req.on('error', (error) => {
            console.error(`请求错误: ${error.message}`);
            console.error(`错误代码: ${error.code}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.error('请求超时');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// 测试DNS解析
async function testDnsResolution() {
    console.log('\n=== DNS 解析测试 ===');
    const dnsPromises = dns.promises;
    
    try {
        const addresses = await dnsPromises.resolve4('home-list-api.dylan-chiang.workers.dev');
        console.log('DNS解析成功:', addresses);
        return addresses;
    } catch (error) {
        console.error('DNS解析失败:', error.message);
        throw error;
    }
}

// 测试TCP连接
async function testTcpConnection() {
    console.log('\n=== TCP 连接测试 ===');
    
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        const timeout = setTimeout(() => {
            socket.destroy();
            reject(new Error('TCP连接超时'));
        }, 5000);
        
        socket.connect(443, 'home-list-api.dylan-chiang.workers.dev', () => {
            clearTimeout(timeout);
            console.log('TCP连接成功');
            socket.destroy();
            resolve(true);
        });
        
        socket.on('error', (error) => {
            clearTimeout(timeout);
            console.error('TCP连接失败:', error.message);
            reject(error);
        });
    });
}

// 主测试函数
async function runTests() {
    console.log('开始 API 连接诊断...');
    console.log('时间:', new Date().toISOString());
    
    try {
        // 1. DNS解析测试
        await testDnsResolution();
        
        // 2. TCP连接测试
        await testTcpConnection();
        
        // 3. API端点测试
        const endpoints = [
            { path: '/', description: '根路径' },
            { path: '/api/family/members', description: '家庭成员API' },
            { path: '/api/family/invites', description: '邀请码API' },
            { path: '/api/tasks', description: '任务API' },
            { path: '/api/auth/me', description: '用户信息API' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                await testApiRequest(endpoint.path, endpoint.description);
                await new Promise(resolve => setTimeout(resolve, 1000)); // 延迟1秒
            } catch (error) {
                console.error(`${endpoint.description} 测试失败:`, error.message);
            }
        }
        
        console.log('\n=== 诊断完成 ===');
        
    } catch (error) {
        console.error('诊断过程中发生错误:', error.message);
    }
}

// 运行测试
runTests().catch(console.error);