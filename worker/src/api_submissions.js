// 伊瑟利亚创意工坊 - 玩家投稿接口
// 文件：api_submissions.js —— 玩家在网页上传内容包，进入待审核状态

import {
  json,
  jsonError,
  readJsonBody,
  makeId,
  putSubmission,
  validateContentPack,
} from './utils.js';

export async function handleSubmissions(env, url, request) {
  const method = request.method;
  const path = url.pathname.replace(/\/+$/, '');

  // POST /api/submissions —— 玩家投稿
  if (method === 'POST' && path === '/api/submissions') {
    let body;
    try {
      body = await readJsonBody(request, 2 * 1024 * 1024);
    } catch (e) {
      return jsonError(e.message, 413);
    }

    // 必需字段
    if (typeof body.name !== 'string' || !body.name.trim()) {
      return jsonError('请填写内容包名称');
    }
    if (typeof body.authorName !== 'string' || !body.authorName.trim()) {
      body.authorName = '匿名';
    }
    if (typeof body.description !== 'string') body.description = '';
    if (typeof body.content !== 'string' || !body.content.trim()) {
      return jsonError('请填写内容包 JSON 内容');
    }

    // 解析并校验内容包
    let pack;
    try {
      pack = JSON.parse(body.content);
    } catch (e) {
      return jsonError('内容包 JSON 解析失败，请检查格式');
    }
    try {
      validateContentPack(pack);
    } catch (e) {
      return jsonError(e.message);
    }

    // 同名待审防刷
    const existing = await env.WORKSHOP_KV.list({ prefix: 'submission:' });
    for (const key of existing.keys) {
      const s = await env.WORKSHOP_KV.get(key.name, 'json');
      if (s && s.status === 'pending' && s.name === body.name.trim()) {
        return jsonError('已有同名投稿正在审核中，请勿重复提交');
      }
    }

    const now = new Date().toISOString();
    const submission = {
      id: makeId(),
      name: body.name.trim(),
      description: body.description.trim(),
      authorName: body.authorName.trim(),
      coverImage: body.coverImage || '',
      authorAvatar: body.authorAvatar || '',
      version: pack.version,
      tags: pack.tags,
      status: 'pending', // pending / approved / rejected
      rejectReason: '',
      worldbookEntries: pack.worldbookEntries,
      regexEntries: pack.regexEntries || [],
      createdAt: now,
      updatedAt: now,
    };

    await putSubmission(env, submission.id, submission);
    return json(
      { ok: true, id: submission.id, message: '投稿成功！等待工坊主审核后即可上架。' },
      201
    );
  }

  return jsonError('接口不存在', 404);
}
