import React, { useState } from 'react';
import { API_ENDPOINTS, apiGet } from '../utils/api';

const ApiTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [testing, setTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testApiConnection = async () => {
    setTesting(true);
    setTestResults([]);
    
    addResult('开始API连接测试...');
    
    try {
      // 测试基础连接
      addResult(`测试API基础URL: ${API_ENDPOINTS.FAMILY.MEMBERS}`);
      
      // 使用fetch直接测试
      addResult('使用fetch直接测试...');
      try {
        const response = await fetch(API_ENDPOINTS.FAMILY.MEMBERS, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || 'test-token'}`
          }
        });
        addResult(`Fetch响应状态: ${response.status}`);
        addResult(`Fetch响应URL: ${response.url}`);
        addResult(`Fetch响应头: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
        
        const text = await response.text();
        addResult(`Fetch响应内容: ${text.substring(0, 200)}`);
      } catch (fetchError) {
        addResult(`Fetch错误: ${fetchError.message}`);
        addResult(`Fetch错误详情: ${JSON.stringify(fetchError)}`);
      }
      
      // 使用API工具函数测试
      addResult('使用API工具函数测试...');
      try {
        const result = await apiGet(API_ENDPOINTS.FAMILY.MEMBERS);
        addResult(`API工具函数结果: ${JSON.stringify(result)}`);
      } catch (apiError) {
        addResult(`API工具函数错误: ${apiError.message}`);
        addResult(`API工具函数错误详情: ${JSON.stringify(apiError)}`);
      }
      
    } catch (error) {
      addResult(`测试过程中出现错误: ${error.message}`);
    } finally {
      setTesting(false);
      addResult('API连接测试完成');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">API连接测试</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={testApiConnection}
              disabled={testing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testing ? '测试中...' : '开始测试'}
            </button>
            <button
              onClick={clearResults}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              清除结果
            </button>
          </div>
          
          <div className="bg-gray-100 rounded-lg p-4 max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">测试结果:</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-500">点击"开始测试"来运行API连接测试</p>
            ) : (
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono text-gray-800">
                    {result}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="font-semibold mb-2">环境信息:</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <div>API Base URL: {import.meta.env.VITE_API_BASE_URL}</div>
            <div>Family Members Endpoint: {API_ENDPOINTS.FAMILY.MEMBERS}</div>
            <div>Auth Token: {localStorage.getItem('authToken') ? '已设置' : '未设置'}</div>
            <div>User Agent: {navigator.userAgent}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;