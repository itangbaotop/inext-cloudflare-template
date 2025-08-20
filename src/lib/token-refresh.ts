// 客户端token刷新工具
class TokenRefresher {
  private isRefreshing = false;
  private failedQueue: Array<() => void> = [];

  // 检查token是否即将过期
  isTokenExpiringSoon(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      const now = Date.now();
      const bufferTime = 5 * 60 * 1000; // 提前5分钟刷新
      
      return exp - now < bufferTime;
    } catch {
      return true; // 如果解析失败，认为需要刷新
    }
  }

  // 刷新token
  async refreshToken(): Promise<boolean> {
    if (this.isRefreshing) {
      // 如果正在刷新，等待队列
      return new Promise((resolve) => {
        this.failedQueue.push(() => resolve(true));
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include', // 包含cookies
      });

      if (response.ok) {
        // 刷新成功，执行队列中的请求
        this.failedQueue.forEach(cb => cb());
        this.failedQueue = [];
        return true;
      } else {
        // 刷新失败，可能需要重新登录
        console.warn('Token刷新失败，需要重新登录');
        window.location.href = '/login?expired=true';
        return false;
      }
    } catch (error) {
      console.error('Token刷新错误:', error);
      window.location.href = '/login?expired=true';
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  // 包装fetch，自动处理token刷新
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    // 如果是登录/注册页面，不需要检查token
    if (window.location.pathname.startsWith('/login') || 
        window.location.pathname.startsWith('/register') ||
        window.location.pathname.startsWith('/forgot-password')) {
      return fetch(url, options);
    }

    // 尝试刷新token
    const refreshed = await this.refreshToken();
    if (!refreshed) {
      throw new Error('Token刷新失败');
    }

    return fetch(url, options);
  }
}

// 创建单例实例
export const tokenRefresher = new TokenRefresher();

// 全局fetch拦截器
if (typeof window !== 'undefined') {
  const originalFetch = window.fetch;
  
  window.fetch = async function(url: string | URL | Request, init?: RequestInit) {
    const urlString = url instanceof Request ? url.url : url.toString();
    
    // 跳过认证相关的API
    if (urlString.includes('/api/auth/')) {
      return originalFetch.call(this, url, init);
    }

    try {
      // 尝试刷新token
      await tokenRefresher.refreshToken();
      return originalFetch.call(this, url, init);
    } catch (error) {
      console.error('Fetch with token refresh failed:', error);
      throw error;
    }
  };
}

// 定时刷新（每10分钟检查一次）
if (typeof window !== 'undefined') {
  setInterval(() => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];

    if (token && tokenRefresher.isTokenExpiringSoon(token)) {
      tokenRefresher.refreshToken().catch(console.error);
    }
  }, 10 * 60 * 1000); // 10分钟检查一次
}