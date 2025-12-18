
import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    name: 'Re-Word (易语道) - 沉浸式英语',
    description: 'Re-Word (Read Word)：在浏览中文网页时，自动将指定词汇替换为英文，重塑您的词汇记忆，体验沉浸式学习之“道”。',
    version: '3.3.0',
    permissions: ['storage', 'activeTab', 'scripting', 'contextMenus', 'unlimitedStorage'],
    host_permissions: [
      "https://*.tencentcloudapi.com/*",
      "https://translation.googleapis.com/*",
      "https://api-free.deepl.com/*",
      "https://dict.youdao.com/*"
    ],
    action: {
      default_title: '打开 Re-Word 设置'
    },
    commands: {
      "translate-page": {
        "suggested_key": {
          "default": "Alt+T",
          "mac": "Alt+T"
        },
        "description": "开始当前页面翻译替换"
      }
    }
  },
  modules: ['@wxt-dev/module-react'],
});
