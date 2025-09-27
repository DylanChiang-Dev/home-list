import React, { useState } from 'react';
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { apiPost } from '../utils/api';

interface MigrationData {
  tasks: any[];
  families: any[];
  users: any[];
}

interface DataMigrationProps {
  onMigrationComplete?: () => void;
}

const DataMigration: React.FC<DataMigrationProps> = ({ onMigrationComplete }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [exportData, setExportData] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // 导出localStorage数据
  const exportLocalStorageData = () => {
    setIsExporting(true);
    
    try {
      const data: MigrationData = {
        tasks: [],
        families: [],
        users: []
      };

      // 收集所有localStorage数据
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const parsedValue = JSON.parse(value);
              
              // 根据key的模式分类数据
              if (key.startsWith('task_') || key === 'tasks') {
                if (Array.isArray(parsedValue)) {
                  data.tasks.push(...parsedValue);
                } else {
                  data.tasks.push(parsedValue);
                }
              } else if (key.startsWith('family_') || key === 'families') {
                if (Array.isArray(parsedValue)) {
                  data.families.push(...parsedValue);
                } else {
                  data.families.push(parsedValue);
                }
              } else if (key.startsWith('user_') || key === 'users' || key === 'userData') {
                if (Array.isArray(parsedValue)) {
                  data.users.push(...parsedValue);
                } else {
                  data.users.push(parsedValue);
                }
              }
            } catch (e) {
              // 忽略无法解析的数据
              console.warn(`无法解析localStorage项: ${key}`);
            }
          }
        }
      }

      const exportString = JSON.stringify(data, null, 2);
      setExportData(exportString);
      
      // 自动下载文件
      const blob = new Blob([exportString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `home-list-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('导出数据失败:', error);
      setImportStatus({
        success: false,
        message: '导出数据失败，请检查localStorage数据格式'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 导入数据到后端
  const importDataToBackend = async (jsonData: string) => {
    setIsImporting(true);
    setImportStatus(null);
    
    try {
      const data = JSON.parse(jsonData);
      
      const result = await apiPost('/api/migration/import', data);
      
      if (result.error) {
        setImportStatus({
          success: false,
          message: result.error
        });
      } else {
        setImportStatus({
          success: true,
          message: '数据导入成功！',
          details: result.data
        });
        
        if (onMigrationComplete) {
          onMigrationComplete();
        }
      }
    } catch (error) {
      console.error('导入数据失败:', error);
      setImportStatus({
        success: false,
        message: '数据格式错误或网络异常，请检查JSON格式'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        importDataToBackend(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">数据迁移工具</h2>
        <p className="text-gray-600 mb-6">
          将您的本地数据迁移到云端数据库，确保数据安全和跨设备同步。
        </p>

        {/* 导出数据 */}
        <div className="border rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Download className="w-5 h-5 mr-2" />
            步骤1: 导出本地数据
          </h3>
          <p className="text-gray-600 mb-4">
            首先导出您存储在浏览器中的本地数据。
          </p>
          <button
            onClick={exportLocalStorageData}
            disabled={isExporting}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {isExporting ? '导出中...' : '导出本地数据'}
          </button>
        </div>

        {/* 导入数据 */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            步骤2: 导入到云端数据库
          </h3>
          <p className="text-gray-600 mb-4">
            选择刚才导出的JSON文件，将数据导入到云端数据库。
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择数据文件 (JSON格式)
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={isImporting}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
            </div>

            {isImporting && (
              <div className="flex items-center text-blue-600">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在导入数据...
              </div>
            )}

            {importStatus && (
              <div className={`p-4 rounded-md flex items-start ${
                importStatus.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                {importStatus.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${
                    importStatus.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {importStatus.message}
                  </p>
                  {importStatus.details && (
                    <pre className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(importStatus.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 导出的数据预览 */}
        {exportData && (
          <div className="mt-6 border rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              导出数据预览
            </h3>
            <textarea
              value={exportData}
              readOnly
              className="w-full h-40 p-3 border rounded-md bg-gray-50 text-sm font-mono"
              placeholder="导出的数据将显示在这里..."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataMigration;