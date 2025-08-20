import crypto from 'crypto';

const WECHAT_APP_ID = process.env.WECHAT_APP_ID!;
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET!;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

interface WeChatAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
}

interface WeChatUserInfoResponse {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  privilege: string[];
  unionid?: string;
}

interface WeChatQRCodeResponse {
  ticket: string;
  expire_seconds: number;
  url: string;
}

export class WeChatAuth {
  // 生成微信授权URL
  static getAuthorizationUrl(state: string, redirectUri: string) {
    const params = new URLSearchParams({
      appid: WECHAT_APP_ID,
      redirect_uri: `${BASE_URL}${redirectUri}`,
      response_type: 'code',
      scope: 'snsapi_login',
      state: state,
    });
    
    return `https://open.weixin.qq.com/connect/qrconnect?${params.toString()}#wechat_redirect`;
  }

  // 获取访问令牌
  static async getAccessToken(code: string): Promise<WeChatAccessTokenResponse> {
    const params = new URLSearchParams({
      appid: WECHAT_APP_ID,
      secret: WECHAT_APP_SECRET,
      code: code,
      grant_type: 'authorization_code',
    });

    const response = await fetch(`https://api.weixin.qq.com/sns/oauth2/access_token?${params.toString()}`);
    const data = await response.json();
    
    if (data.errcode) {
      throw new Error(`WeChat API Error: ${data.errmsg}`);
    }
    
    return data;
  }

  // 获取用户信息
  static async getUserInfo(accessToken: string, openid: string): Promise<WeChatUserInfoResponse> {
    const params = new URLSearchParams({
      access_token: accessToken,
      openid: openid,
    });

    const response = await fetch(`https://api.weixin.qq.com/sns/userinfo?${params.toString()}`);
    const data = await response.json();
    
    if (data.errcode) {
      throw new Error(`WeChat API Error: ${data.errmsg}`);
    }
    
    return data;
  }

  // 生成带参数的二维码
  static async generateQRCode(sceneId: string): Promise<WeChatQRCodeResponse> {
    // 这里需要先获取access_token，然后调用微信接口生成二维码
    // 实际实现时需要缓存access_token
    const accessToken = await this.getCachedAccessToken();
    
    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/qrcode/create?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        expire_seconds: 604800, // 7天
        action_name: 'QR_SCENE',
        action_info: {
          scene: {
            scene_id: parseInt(sceneId)
          }
        }
      })
    });

    const data = await response.json();
    
    if (data.errcode) {
      throw new Error(`WeChat API Error: ${data.errmsg}`);
    }
    
    return data;
  }

  // 获取缓存的access_token（简化版，实际应该使用Redis等缓存）
  private static async getCachedAccessToken(): Promise<string> {
    // 这里应该实现access_token的缓存逻辑
    // 为简化演示，这里直接获取新的token
    const params = new URLSearchParams({
      grant_type: 'client_credential',
      appid: WECHAT_APP_ID,
      secret: WECHAT_APP_SECRET,
    });

    const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?${params.toString()}`);
    const data = await response.json();
    
    if (data.errcode) {
      throw new Error(`WeChat API Error: ${data.errmsg}`);
    }
    
    return data.access_token;
  }
}