// 伊瑟利亚创意工坊 - Cloudflare Worker 入口
// 文件：index.js —— 路由分发：静态页面由 Workers Assets 提供（public/ 目录），这里只处理 /api/*

import { jsonError, handleOptions } from './utils.js';
import { handleProjects } from './api_projects.js';
import { handleSubmissions } from './api_submissions.js';
import { handleAdmin } from './api_admin.js';
import { INDEX_HTML, ADMIN_HTML } from './public_html.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method;

    // CORS 预检
    if (request.method === 'OPTIONS') return handleOptions();

    try {
      // 工坊前端页面（方案 A：代码内嵌；方案 B：由 Workers Assets 提供，此分支不会命中）
      if (method === 'GET' && (path === '' || path === '/')) {
        return new Response(INDEX_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      // 工坊主审核后台
      if (method === 'GET' && path === '/admin') {
        return new Response(ADMIN_HTML, { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      // 健康检查
      if (path === '/api/health') {
        return new Response(
          JSON.stringify({ ok: true, name: env.WORKSHOP_NAME || '伊瑟利亚创意工坊', time: new Date().toISOString() }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' },
          }
        );
      }

      // 项目：列表 / 详情 / 文件分发
      if (path.startsWith('/api/projects') || path.startsWith('/api/files')) {
        return await handleProjects(env, url, request);
      }

      // 玩家投稿
      if (path.startsWith('/api/submissions')) {
        return await handleSubmissions(env, url, request);
      }

      // 工坊主审核
      if (path.startsWith('/api/admin')) {
        return await handleAdmin(env, url, request);
      }

      // 其余 /api/* 不存在
      if (path.startsWith('/api')) {
        return jsonError('接口不存在', 404);
      }

      // 非 API 路径：由 Workers Assets（public/ 目录）处理，这里兜底提示
      return new Response('伊瑟利亚创意工坊后端在线。请访问工坊首页（本域名根路径）或 /admin（管理后台）。', {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    } catch (e) {
      console.error('worker error:', e);
      return jsonError('服务器内部错误：' + (e && e.message ? e.message : '未知'), 500);
    }
  },
};
