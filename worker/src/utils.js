// 伊瑟利亚创意工坊 - Worker 公共工具
// 文件：utils.js —— JSON 响应、CORS、鉴权、KV 封装、内容包校验

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
      ...extraHeaders,
    },
  });
}

export function text(body, status = 200, contentType = 'text/plain; charset=utf-8') {
  return new Response(body, {
    status,
    headers: { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' },
  });
}

export function jsonError(message, status = 400) {
  return json({ ok: false, error: message }, status);
}

// 处理 OPTIONS 预检
export function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function readJsonBody(request, maxBytes = 2 * 1024 * 1024) {
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > maxBytes) throw new Error(`内容超过大小限制（最大 ${Math.round(maxBytes / 1024)}KB）`);
  const raw = await request.text();
  if (raw.length > maxBytes) throw new Error(`内容超过大小限制（最大 ${Math.round(maxBytes / 1024)}KB）`);
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error('不是合法的 JSON 格式');
  }
}

// 生成 ID：简单随机 32 位
export function makeId() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ---- KV 封装 ----
const P_PROJECT = 'project:';
const P_SUBMISSION = 'submission:';

export async function getProject(env, id) {
  return await env.WORKSHOP_KV.get(P_PROJECT + id, 'json');
}
export async function putProject(env, id, project) {
  await env.WORKSHOP_KV.put(P_PROJECT + id, JSON.stringify(project));
}
export async function deleteProject(env, id) {
  await env.WORKSHOP_KV.delete(P_PROJECT + id);
}

export async function getSubmission(env, id) {
  return await env.WORKSHOP_KV.get(P_SUBMISSION + id, 'json');
}
export async function putSubmission(env, id, submission) {
  await env.WORKSHOP_KV.put(P_SUBMISSION + id, JSON.stringify(submission));
}

// 列出某个前缀下的全部记录（按 updated 倒序由调用方处理）
export async function listByPrefix(env, prefix) {
  const list = await env.WORKSHOP_KV.list({ prefix });
  const items = [];
  for (const key of list.keys) {
    const v = await env.WORKSHOP_KV.get(key.name, 'json');
    if (v) items.push(v);
  }
  return items;
}

// ---- 管理员鉴权：请求头 Authorization: Bearer <密码> ----
export async function checkAdmin(request, env) {
  const secret = env.ADMIN_PASSWORD;
  if (!secret) return false;
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return false;
  // 恒定时间比较，防时序攻击
  const enc = new TextEncoder();
  const a = enc.encode(secret);
  const b = enc.encode(token);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---- 内容包结构校验（投稿与上架共用） ----
export const MAX_ENTRIES = 200;
export const MAX_REGEX = 50;

export function validateContentPack(pack) {
  if (!pack || typeof pack !== 'object') throw new Error('内容包必须是 JSON 对象');
  if (typeof pack.name !== 'string' || !pack.name.trim()) throw new Error('缺少内容包名称 name');
  if (pack.name.length > 60) throw new Error('内容包名称过长（最多 60 字）');
  if (typeof pack.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pack.version)) {
    throw new Error('版本号必须是 x.y.z 格式，例如 1.0.0');
  }
  if (!Array.isArray(pack.tags) || pack.tags.length === 0) {
    throw new Error('至少选择一个分类标签（事件/角色包/材料本/扩展）');
  }
  const allowedTags = ['事件', '角色包', '材料本', '扩展'];
  for (const t of pack.tags) {
    if (!allowedTags.includes(t)) throw new Error(`不支持的标签：${t}`);
  }

  const wb = pack.worldbookEntries;
  if (!Array.isArray(wb) || wb.length === 0) {
    throw new Error('内容包必须包含至少 1 条世界书条目');
  }
  if (wb.length > MAX_ENTRIES) throw new Error(`世界书条目过多（最多 ${MAX_ENTRIES} 条）`);

  for (const e of wb) {
    if (!e || typeof e !== 'object') throw new Error('存在非法的世界书条目');
    if (typeof e.content !== 'string' || e.content.length === 0) throw new Error('存在正文为空的条目');
    if (e.content.length > 50000) throw new Error('存在正文过长的条目（单条最多 5 万字）');
  }

  if (pack.regexEntries !== undefined) {
    if (!Array.isArray(pack.regexEntries)) throw new Error('regexEntries 必须是数组');
    if (pack.regexEntries.length > MAX_REGEX) throw new Error(`正则过多（最多 ${MAX_REGEX} 条）`);
    for (const r of pack.regexEntries) {
      if (!r || typeof r !== 'object') throw new Error('存在非法的正则条目');
      if (typeof r.scriptName !== 'string' || !r.scriptName.trim()) throw new Error('正则缺少名称');
      if (typeof r.findRegex !== 'string' || !r.findRegex) throw new Error('正则缺少匹配表达式 findRegex');
    }
  }
  return true;
}

// 生成项目对象（从投稿）
export function buildProjectFromSubmission(sub) {
  const now = new Date().toISOString();
  return {
    id: sub.id,
    name: sub.name.trim(),
    description: (sub.description || '').trim(),
    version: sub.version,
    tags: sub.tags,
    authorName: (sub.authorName || '匿名').trim(),
    coverImage: sub.coverImage || '',
    status: 'approved',
    downloadsCount: 0,
    likesCount: 0,
    createdAt: sub.createdAt,
    updatedAt: now,
    approvedAt: now,
    // 完整内容（文件分发用）
    worldbookEntries: sub.worldbookEntries,
    regexEntries: sub.regexEntries || [],
    // 预览（列表用，不含完整正文以省流量）
    worldbookEntriesPreview: sub.worldbookEntries.map((e, i) => ({
      uid: i + 1,
      comment: e.comment || `条目${i + 1}`,
      contentLength: (e.content || '').length,
      keys: Array.isArray(e.key) ? e.key : [],
      constant: !!e.constant,
      selective: !!e.selective,
      depth: e.depth,
    })),
    regexEntriesPreview: (sub.regexEntries || []).map((r) => ({
      id: r.id || '',
      scriptName: r.scriptName,
      findRegex: r.findRegex,
    })),
  };
}
