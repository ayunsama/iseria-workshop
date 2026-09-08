// 伊瑟利亚创意工坊 - 项目接口
// 文件：api_projects.js —— 浏览列表、项目详情、内容包文件分发

import { json, jsonError, getProject, listByPrefix } from './utils.js';

// 列表返回摘要（不含完整条目正文）
function toSummary(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    version: p.version,
    tags: p.tags,
    authorName: p.authorName,
    coverImage: p.coverImage,
    authorAvatar: p.authorAvatar || '',
    downloadsCount: p.downloadsCount || 0,
    likesCount: p.likesCount || 0,
    approvedAt: p.approvedAt,
    worldbookCount: (p.worldbookEntries || []).length,
    regexCount: (p.regexEntries || []).length,
    updatedAt: p.updatedAt,
  };
}

export async function handleProjects(env, url, request) {
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  // GET /api/projects —— 已上架项目列表
  if (method === 'GET' && path === '/api/projects') {
    const all = await listByPrefix(env, 'project:');
    const approved = all
      .filter((p) => p && p.status === 'approved')
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
    return json({ ok: true, projects: approved.map(toSummary) });
  }

  // GET /api/projects/:id —— 项目详情（含条目/正则预览）
  const detailMatch = path.match(/^\/api\/projects\/([0-9a-f]{32})$/);
  if (method === 'GET' && detailMatch) {
    const p = await getProject(env, detailMatch[1]);
    if (!p || p.status !== 'approved') return jsonError('项目不存在或未上架', 404);
    return json({
      ok: true,
      project: {
        ...toSummary(p),
        worldbookEntriesPreview: p.worldbookEntriesPreview || [],
        regexEntriesPreview: p.regexEntriesPreview || [],
      },
    });
  }

  // GET /api/files/projects/:id/project-:id.json —— 完整内容包文件（宿主脚本安装时下载）
  const fileMatch = path.match(/^\/api\/files\/projects\/([0-9a-f]{32})\/project-\1\.json$/);
  if (method === 'GET' && fileMatch) {
    const p = await getProject(env, fileMatch[1]);
    if (!p || p.status !== 'approved') return jsonError('文件不存在或未上架', 404);

    // 下载计数 +1（尽力而为，失败不影响下载）
    try {
      p.downloadsCount = (p.downloadsCount || 0) + 1;
      await env.WORKSHOP_KV.put('project:' + p.id, JSON.stringify(p));
    } catch (e) { /* 忽略计数失败 */ }

    const fileBody = {
      name: p.name,
      version: p.version,
      tags: p.tags,
      description: p.description,
      worldbookEntries: p.worldbookEntries || [],
      regexEntries: p.regexEntries || [],
    };
    return json(fileBody, 200, { 'Cache-Control': 'public, max-age=300' });
  }

  return jsonError('接口不存在', 404);
}
