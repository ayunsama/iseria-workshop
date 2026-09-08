// 伊瑟利亚创意工坊 - 审核接口
// 文件：api_admin.js —— 工坊主后台：待审列表、通过、打回、下架

import {
  json,
  jsonError,
  readJsonBody,
  checkAdmin,
  getSubmission,
  putSubmission,
  getProject,
  putProject,
  deleteProject,
  listByPrefix,
  buildProjectFromSubmission,
} from './utils.js';

function toAdminSummary(s) {
  return {
    id: s.id,
    name: s.name,
    authorName: s.authorName,
    description: s.description,
    version: s.version,
    tags: s.tags,
    status: s.status,
    rejectReason: s.rejectReason || '',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    worldbookCount: (s.worldbookEntries || []).length,
    regexCount: (s.regexEntries || []).length,
    coverImage: s.coverImage || '',
  };
}

export async function handleAdmin(env, url, request) {
  const path = url.pathname.replace(/\/+$/, '');
  const method = request.method;

  // 所有管理接口都需要密码
  if (!(await checkAdmin(request, env))) {
    return jsonError('未授权：请先输入管理密码', 401);
  }

  // GET /api/admin/submissions?status=pending —— 投稿列表
  if (method === 'GET' && path === '/api/admin/submissions') {
    const statusFilter = url.searchParams.get('status');
    const all = await listByPrefix(env, 'submission:');
    const list = all
      .filter((s) => s && (!statusFilter || s.status === statusFilter))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return json({ ok: true, submissions: list.map(toAdminSummary) });
  }

  // GET /api/admin/submissions/:id —— 投稿详情（含完整条目，供审核预览）
  const detailMatch = path.match(/^\/api\/admin\/submissions\/([0-9a-f]{32})$/);
  if (method === 'GET' && detailMatch) {
    const s = await getSubmission(env, detailMatch[1]);
    if (!s) return jsonError('投稿不存在', 404);
    return json({ ok: true, submission: { ...toAdminSummary(s), worldbookEntries: s.worldbookEntries, regexEntries: s.regexEntries } });
  }

  // POST /api/admin/submissions/:id/approve —— 通过并上架
  const approveMatch = path.match(/^\/api\/admin\/submissions\/([0-9a-f]{32})\/approve$/);
  if (method === 'POST' && approveMatch) {
    const s = await getSubmission(env, approveMatch[1]);
    if (!s) return jsonError('投稿不存在', 404);
    if (s.status === 'approved') return jsonError('该投稿已上架');
    if (s.status === 'rejected') return jsonError('该投稿已被打回，不能直接通过（请让作者重新投稿）');

    const project = buildProjectFromSubmission(s);
    await putProject(env, project.id, project);
    s.status = 'approved';
    s.updatedAt = new Date().toISOString();
    await putSubmission(env, s.id, s);
    return json({ ok: true, message: '已通过并上架', projectId: project.id });
  }

  // POST /api/admin/submissions/:id/reject —— 打回
  const rejectMatch = path.match(/^\/api\/admin\/submissions\/([0-9a-f]{32})\/reject$/);
  if (method === 'POST' && rejectMatch) {
    const s = await getSubmission(env, rejectMatch[1]);
    if (!s) return jsonError('投稿不存在', 404);
    let body = {};
    try { body = await readJsonBody(request, 1024 * 64); } catch (e) { /* 无理由也可打回 */ }
    s.status = 'rejected';
    s.rejectReason = (body.reason || '').toString().slice(0, 500);
    s.updatedAt = new Date().toISOString();
    await putSubmission(env, s.id, s);
    return json({ ok: true, message: '已打回' });
  }

  // DELETE /api/admin/projects/:id —— 下架
  const projectDelete = path.match(/^\/api\/admin\/projects\/([0-9a-f]{32})$/);
  if (method === 'DELETE' && projectDelete) {
    const p = await getProject(env, projectDelete[1]);
    if (!p) return jsonError('项目不存在', 404);
    await deleteProject(env, projectDelete[1]);
    return json({ ok: true, message: '已下架' });
  }

  return jsonError('接口不存在', 404);
}
