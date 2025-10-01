import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { getCurrentEndpoint, checkEndpointHealth } from '../utils/apiConfig';

interface NetworkStatusProps {
  showDetails?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({ showDetails = false }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [currentEndpointName, setCurrentEndpointName] = useState('');

  useEffect(() => {
    const checkNetwork = async () => {
      setIsChecking(true);
      const endpoint = getCurrentEndpoint();
      setCurrentEndpointName(endpoint.name);

      const isHealthy = await checkEndpointHealth(endpoint);
      setIsOnline(isHealthy);
      setIsChecking(false);
    };

    checkNetwork();

    // 每30秒检查一次
    const interval = setInterval(checkNetwork, 30000);

    return () => clearInterval(interval);
  }, []);

  if (isChecking) {
    return null; // 首次检查时不显示
  }

  if (isOnline && !showDetails) {
    return null; // 在线且不需要显示详情时隐藏
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${isOnline ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border rounded-lg p-3 shadow-lg flex items-center space-x-2`}>
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 text-green-600" />
          {showDetails && (
            <div className="text-sm">
              <p className="font-medium text-green-900">已连接</p>
              <p className="text-green-700 text-xs">{currentEndpointName}</p>
            </div>
          )}
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 text-red-600" />
          <div className="text-sm">
            <p className="font-medium text-red-900">网络连接失败</p>
            <p className="text-red-700 text-xs">请检查网络或稍后重试</p>
          </div>
        </>
      )}
    </div>
  );
};

export default NetworkStatus;
