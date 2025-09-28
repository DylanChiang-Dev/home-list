import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
// 导入错误监控工具，在应用启动时开始监控
import './utils/errorMonitor'
import { initializeApiConfig } from './utils/apiConfig'

// 初始化API配置
initializeApiConfig().then(() => {
  console.log('[App] API配置初始化完成');
}).catch(error => {
  console.warn('[App] API配置初始化失败:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
