import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = '加载中...'
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-700 text-lg font-medium">{message}</p>
          <p className="text-gray-500 text-sm text-center">
            首次加载可能需要几秒钟<br />
            如果长时间无响应,请检查网络连接
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
