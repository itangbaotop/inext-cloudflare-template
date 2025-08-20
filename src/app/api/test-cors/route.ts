// 文件路径: app/api/test-cors/route.ts
// [用于最终测试的极简 API]

import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  // 这个日志应该出现在您的 next dev 终端
  console.log('[CORS Test] ✅ Received OPTIONS request');
  
  const response = new NextResponse(null, { status: 204 });
  
  // 使用最宽松的 CORS 设置进行测试
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  
  return response;
}

export async function GET(request: NextRequest) {
  // 这个日志应该出现在您的 next dev 终端
  console.log('[CORS Test] 🚀 Received GET request');

  return NextResponse.json(
    { message: "CORS test successful!" },
    { 
      headers: {
        'Access-Control-Allow-Origin': '*',
      }
    }
  );
}