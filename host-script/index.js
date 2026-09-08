// ============================================================================
// 伊瑟利亚创意工坊 · 宿主脚本
// 运行环境：酒馆助手（Tavern Helper）脚本（iframe），随"伊瑟利亚大陆"角色卡分发
// 职责：注册「伊瑟利亚创意工坊」按钮 → 打开工坊前端（iframe）→ postMessage 桥 →
//       安装/卸载/更新内容包（世界书条目 + 正则）→ 缓存管理
//
// 部署方式：
//   1. 把本文件上传到你的 GitHub 仓库（例如 iseria-workshop/host-script/index.js）
//   2. 角色卡脚本里加一行：import 'https://cdn.jsdelivr.net/gh/你的用户名/iseria-workshop@main/host-script/index.js'
//   3. 把下方 WORKER_URL 改成你部署好的 Cloudflare Worker 地址（或设置脚本变量 iseria_workshop_worker_url 覆盖）
// ============================================================================

(function () {
  'use strict';

  var NS = 'iseria-workshop-bridge';
  var WORKER_URL = 'https://iseria-workshop.1020803065.workers.dev'; // ← 已部署地址（2026-09-08）
  var REGEX_ID_PREFIX = 'iseria_workshop:';
  var CACHE_KEY = 'iseria_workshop_cache';
  var AGREEMENT_KEY = 'iseria_workshop_agreement_accepted';
  var CACHE_TTL = { worldbookSources: 90 * 60 * 1000 }; // 项目源文件缓存 90 分钟

  // 运行环境：酒馆助手脚本 iframe（隐藏）。遮罩/iframe 必须挂到父页面（酒馆网页）才能全屏可见；
  // 消息监听也要挂在父窗口（工坊 iframe 是父窗口的子节点，其 postMessage 发往父窗口）。
  var DOC = (function () {
    try {
      if (window.parent && window.parent.document && window.parent !== window) return window.parent.document;
    } catch (e) { /* 非 iframe 环境 */ }
    return document;
  })();
  var MSG_TARGET = (function () {
    try {
      if (window.parent && window.parent !== window) return window.parent;
    } catch (e) { /* 非 iframe 环境 */ }
    return window;
  })();

  function log() { console.info('[伊瑟利亚工坊]', Array.prototype.join.call(arguments, ' ')); }
  function warn() { console.warn('[伊瑟利亚工坊]', Array.prototype.join.call(arguments, ' ')); }

  // ---- 配置 ----
  function workerUrl() {
    try {
      var vars = getVariables({ type: 'script', script_id: getScriptId() });
      if (vars && vars.iseria_workshop_worker_url) return vars.iseria_workshop_worker_url;
    } catch (e) { /* 忽略 */ }
    return WORKER_URL;
  }

  // ---- 脚本变量缓存 ----
  function readCache() {
    try {
      var vars = getVariables({ type: 'script', script_id: getScriptId() }) || {};
      return vars[CACHE_KEY] || {};
    } catch (e) { return {}; }
  }
  function writeCache(cache) {
    try {
      var vars = getVariables({ type: 'script', script_id: getScriptId() }) || {};
      vars[CACHE_KEY] = cache;
      replaceVariables(vars, { type: 'script', script_id: getScriptId() });
    } catch (e) { warn('缓存写入失败', e); }
  }
  function cacheGet(bucket, key) {
    var c = readCache();
    var item = (c[bucket] || {})[key];
    if (!item) return null;
    if (Date.now() - item.time > CACHE_TTL[bucket]) return null;
    return item.data;
  }
  function cacheSet(bucket, key, data) {
    var c = readCache();
    if (!c[bucket]) c[bucket] = {};
    c[bucket][key] = { time: Date.now(), data: data };
    writeCache(c);
  }

  // ---- 安装器：命名规则 ----
  function entryName(comment, projectName, tags) {
    if (/^\[伊瑟利亚工坊\]/.test(comment)) return comment; // 已带前缀，原样保留
    if (/系统/.test(comment)) return '伊瑟利亚系统-' + comment;
    var category = '扩展';
    if (tags.indexOf('角色包') >= 0) category = '角色';
    else if (tags.indexOf('事件') >= 0) category = '事件';
    return '[伊瑟利亚工坊][' + category + '][' + projectName + ']' + comment;
  }

  // ---- 安装器：字段映射（项目文件条目 → 酒馆世界书条目） ----
  function mapEntry(src, project, idx) {
    var tags = project.tags || [];
    var e = {
      uid: src.uid || ('iws_' + project.id + '_' + idx),
      comment: entryName(src.comment || ('条目' + (idx + 1)), project.name, tags),
      key: Array.isArray(src.key) ? src.key : (src.key ? [src.key] : []),
      keysecondary: Array.isArray(src.keysecondary) ? src.keysecondary : [],
      selectiveLogic: typeof src.selectiveLogic === 'number' ? src.selectiveLogic : 0,
      constant: !!src.constant,
      selective: src.selective !== undefined ? !!src.selective : !src.constant,
      vectorized: !!src.vectorized,
      content: typeof src.content === 'string' ? src.content : '',
      position: typeof src.position === 'number' ? src.position : 0,
      depth: typeof src.depth === 'number' ? src.depth : 4,
      order: typeof src.order === 'number' ? src.order : 100,
      role: typeof src.role === 'number' ? src.role : 0,
      useProbability: !!src.useProbability,
      probability: typeof src.probability === 'number' ? src.probability : 100,
      excludeRecursion: !!src.excludeRecursion,
      preventRecursion: !!src.preventRecursion,
      sticky: !!src.sticky,
      cooldown: !!src.cooldown,
      delay: typeof src.delay === 'number' ? src.delay : undefined,
      scanDepth: src.scanDepth !== undefined ? src.scanDepth : 'same_as_global',
      group: src.group || '',
      groupOverride: !!src.groupOverride,
      groupWeight: typeof src.groupWeight === 'number' ? src.groupWeight : 100,
      automationId: src.automationId || '',
      disabled: !!src.disabled,
      addMemo: typeof src.addMemo === 'boolean' ? src.addMemo : false,
      // 打标：卸载/更新/列表识别的把手
      extra: {
        iseria_cw_project_id: project.id,
        iseria_cw_project_name_display: project.name,
        iseria_cw_project_version: project.version,
        iseria_cw_remote_version: project.version,
        iseria_cw_entry_key: project.id + ':' + idx,
      },
    };
    return e;
  }

  // ---- 安装器：正则映射 ----
  function mapRegex(src, project) {
    return {
      id: REGEX_ID_PREFIX + project.id + ':' + (src.id || String(Math.random()).slice(2, 10)),
      scriptName: '[伊瑟利亚工坊] ' + project.name + ' - ' + src.scriptName,
      findRegex: src.findRegex || '',
      replaceString: src.replaceString || '',
      trimStrings: Array.isArray(src.trimStrings) ? src.trimStrings : [],
      placement: Array.isArray(src.placement) ? src.placement : [2],
      disabled: !!src.disabled,
      markdownOnly: src.markdownOnly !== undefined ? !!src.markdownOnly : true,
      promptOnly: !!src.promptOnly,
      runOnEdit: !!src.runOnEdit,
      substituteRegex: typeof src.substituteRegex === 'number' ? src.substituteRegex : 0,
      minDepth: src.minDepth !== undefined ? src.minDepth : null,
      maxDepth: src.maxDepth !== undefined ? src.maxDepth : null,
    };
  }

  // ---- 下载项目源（带 90 分钟缓存） ----
  async function fetchProjectSource(url) {
    var cached = cacheGet('worldbookSources', url);
    if (cached) return cached;
    var res = await fetch(url);
    if (!res.ok) throw new Error('下载失败（HTTP ' + res.status + '），请稍后重试');
    var data = await res.json();
    if (!data || typeof data !== 'object') throw new Error('项目文件格式错误');
    var entries = data.worldbookEntries || data.entries || data;
    if (Array.isArray(data)) entries = data;
    else if (data.entries && Array.isArray(data.entries)) entries = data.entries;
    var pack = {
      name: data.name || url,
      version: data.version || '0.0.0',
      tags: Array.isArray(data.tags) ? data.tags : [],
      worldbookEntries: Array.isArray(entries) ? entries : [],
      regexEntries: Array.isArray(data.regexEntries) ? data.regexEntries : [],
    };
    if (!pack.worldbookEntries.length) throw new Error('内容包没有世界书条目');
    cacheSet('worldbookSources', url, pack);
    return pack;
  }

  // ---- 世界书读写 ----
  async function loadWorldbook() {
    // getWorldbook() 返回酒馆世界书对象（含 character 子世界书）
    return await getWorldbook();
  }
  async function saveWorldbook(wb) {
    await setWorldbook(wb);
  }
  function charEntries(wb) {
    return (wb && wb.character && wb.character.entries) ? wb.character.entries : [];
  }

  // ---- 正则读写 ----
  async function loadRegex() {
    return (await getTavernRegex()) || [];
  }
  async function saveRegex(arr) {
    await setTavernRegex(arr);
  }

  // ---- 安装 ----
  async function installProject(data) {
    var projectId = data.projectId;
    var url = data.downloadUrl;
    if (!projectId || !url) throw new Error('缺少项目信息');
    var pack = await fetchProjectSource(url);

    // 1. 写入世界书（按 iseria_cw_entry_key upsert）
    var wb = await loadWorldbook();
    var entries = charEntries(wb);
    var oldMap = {};
    var installedCount = 0;
    entries.forEach(function (en) {
      if (en && en.extra && en.extra.iseria_cw_project_id === projectId) {
        oldMap[en.extra.iseria_cw_entry_key] = en;
      }
    });

    pack.worldbookEntries.forEach(function (src, idx) {
      var key = projectId + ':' + idx;
      if (oldMap[key]) {
        // 已存在：原位替换（保留 uid）
        var old = oldMap[key];
        var neu = mapEntry(src, pack, idx);
        neu.uid = old.uid;
        Object.assign(old, neu);
      } else {
        entries.push(mapEntry(src, pack, idx));
      }
      installedCount++;
    });
    await saveWorldbook(wb);

    // 2. 写入正则（先删本项目旧正则，再写新正则）
    var regexArr = await loadRegex();
    var kept = regexArr.filter(function (r) {
      return !(r && r.id && r.id.indexOf(REGEX_ID_PREFIX + projectId + ':') === 0);
    });
    (pack.regexEntries || []).forEach(function (src) {
      kept.push(mapRegex(src, pack));
    });
    await saveRegex(kept);

    log('安装完成：', projectId, installedCount, '条世界书,', (pack.regexEntries || []).length, '个正则');
    return { ok: true, installed: installedCount, regex: (pack.regexEntries || []).length };
  }

  // ---- 卸载 ----
  async function uninstallProject(data) {
    var projectId = data.projectId;
    if (!projectId) throw new Error('缺少项目 ID');

    var wb = await loadWorldbook();
    var entries = charEntries(wb);
    var before = entries.length;
    var kept = entries.filter(function (en) {
      return !(en && en.extra && en.extra.iseria_cw_project_id === projectId);
    });
    var removed = before - kept.length;
    if (removed > 0) {
      wb.character.entries = kept;
      await saveWorldbook(wb);
    }

    var regexArr = await loadRegex();
    var rBefore = regexArr.length;
    var rKept = regexArr.filter(function (r) {
      return !(r && r.id && r.id.indexOf(REGEX_ID_PREFIX + projectId + ':') === 0);
    });
    var rRemoved = rBefore - rKept.length;
    if (rRemoved > 0) {
      await saveRegex(rKept);
    }

    log('卸载完成：', projectId, '移除', removed, '条目,', rRemoved, '正则');
    return { ok: true, removed: removed, regexRemoved: rRemoved };
  }

  // ---- 已安装列表 ----
  async function listInstalled() {
    var wb = await loadWorldbook();
    var map = {};
    charEntries(wb).forEach(function (en) {
      if (!en || !en.extra || !en.extra.iseria_cw_project_id) return;
      var pid = en.extra.iseria_cw_project_id;
      if (!map[pid]) {
        map[pid] = {
          projectId: pid,
          name: en.extra.iseria_cw_project_name_display || pid,
          nameDisplay: en.extra.iseria_cw_project_name_display || pid,
          version: en.extra.iseria_cw_project_version || '',
          entriesCount: 0,
          regexCount: 0,
        };
      }
      map[pid].entriesCount++;
    });
    var regexArr = await loadRegex();
    var regexByProject = {};
    regexArr.forEach(function (r) {
      if (!r || !r.id) return;
      var m = r.id.match(new RegExp('^' + REGEX_ID_PREFIX + '([0-9a-f]+):'));
      if (m) regexByProject[m[1]] = (regexByProject[m[1]] || 0) + 1;
    });
    Object.keys(map).forEach(function (pid) { map[pid].regexCount = regexByProject[pid] || 0; });
    return { ok: true, installedProjects: Object.keys(map).map(function (k) { return map[k]; }) };
  }

  // ---- diff（简化：只比较版本） ----
  function getProjectDiff(data) {
    var installedVersion = (data.localVersion || '');
    var remoteVersion = (data.remoteVersion || '');
    if (!installedVersion) return { status: 'not-installed' };
    if (installedVersion !== remoteVersion) return { status: 'update-available', localVersion: installedVersion, remoteVersion: remoteVersion };
    return { status: 'up-to-date' };
  }

  // ---- 更新：先卸后装 ----
  async function updateProject(data) {
    await uninstallProject({ projectId: data.projectId });
    var r = await installProject(data);
    return { ok: true, message: '更新完成', installed: r.installed };
  }

  // ---- 桥：统一入口 ----
  function bridgeCall(type, data) {
    switch (type) {
      case 'handshake':
      case 'get-context':
        return Promise.resolve({ ok: true, connected: true, characterName: '', installedProjects: [] }).then(function (base) {
          return listInstalled().then(function (li) {
            return { ok: true, connected: true, characterName: getCharacterName ? getCharacterName() || '' : '', installedProjects: li.installedProjects };
          });
        });
      case 'list-installed-projects':
        return listInstalled();
      case 'install-project':
        return installProject(data);
      case 'uninstall-project':
        return uninstallProject(data);
      case 'get-project-diff':
        return Promise.resolve(getProjectDiff(data));
      case 'confirm-project-update':
        return updateProject(data);
      default:
        return Promise.reject(new Error('未知消息类型：' + type));
    }
  }

  // ---- 工坊窗口（遮罩 + iframe） ----
  var overlay = null;
  var iframe = null;
  var origin = '';

  function defaultSrcdoc() {
    return (
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      'html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;' +
      'background:#f4f1ea;font-family:sans-serif;color:#6b7280;font-size:14px}' +
      '</style></head><body><div>正在连接「伊瑟利亚创意工坊」…</div>' +
      '<script>window.addEventListener("load",function(){location.replace(' + JSON.stringify(workerUrl() + '/') + ');});<\/script>' +
      '</body></html>'
    );
  }

  function disclaimerSrcdoc() {
    return (
      '<!doctype html><html><head><meta charset="utf-8"><style>' +
      'html,body{margin:0;height:100%;display:flex;align-items:center;justify-content:center;' +
      'background:#f4f1ea;font-family:\'PingFang SC\',\'Segoe UI\',sans-serif}' +
      '.card{max-width:520px;padding:36px 32px;border-radius:16px;background:#fff;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.08);text-align:center}' +
      'h1{font-size:20px;margin:0 0 12px;color:#1a1b1c}' +
      'p{font-size:14px;line-height:1.9;color:#4b5563;text-align:left;margin:0 0 22px}' +
      '.btn{display:inline-block;padding:11px 34px;border:none;border-radius:999px;' +
      'background:#8a5a44;color:#fff;font-size:15px;cursor:pointer}' +
      '.btn:hover{background:#744936}' +
      '</style></head><body><div class="card"><h1>伊瑟利亚创意工坊</h1>' +
      '<p>内容包均由玩家创作并经工坊主审核后上架。安装第三方内容包可能存在与角色卡冲突的风险，请自行判断是否安装。</p>' +
      '<button class="btn" id="go">我已了解，进入工坊</button></div>' +
      '<script>document.getElementById(\'go\').onclick=function(){' +
      'parent.postMessage({namespace:\'' + NS + '\',type:\'agreement-accepted\'},\'*\')};<\/script>' +
      '</body></html>'
    );
  }

  function buildOverlay(srcdoc) {
    overlay = DOC.createElement('div');
    overlay.id = 'iseria-workshop-overlay';
    overlay.style.cssText =
      'position:fixed;inset:0;z-index:2147483647;background:rgba(10,8,6,.72);' +
      'display:flex;align-items:center;justify-content:center;';
    var frame = DOC.createElement('iframe');
    frame.style.cssText =
      'width:min(1180px,96vw);height:min(820px,92vh);border:none;border-radius:14px;background:#f4f1ea;' +
      'box-shadow:0 12px 48px rgba(0,0,0,.5);';
    frame.srcdoc = srcdoc || defaultSrcdoc();
    overlay.appendChild(frame);
    // 关闭按钮：固定在遮罩右上角，任何情况下（含工坊页面加载失败）都能关掉窗口
    var closeBtn = DOC.createElement('div');
    closeBtn.id = 'iseria-workshop-close';
    closeBtn.textContent = '✕';
    closeBtn.title = '关闭工坊';
    closeBtn.style.cssText =
      'position:fixed;top:14px;right:14px;z-index:2147483648;width:42px;height:42px;' +
      'border-radius:50%;background:rgba(25,18,14,.72);color:#fff;font-size:18px;line-height:42px;' +
      'text-align:center;cursor:pointer;font-family:sans-serif;user-select:none;box-shadow:0 2px 10px rgba(0,0,0,.4);';
    closeBtn.onclick = function () { closeOverlay(); };
    overlay.appendChild(closeBtn);
    (DOC.body || document.body).appendChild(overlay);
    iframe = frame;
    origin = (function () {
      try { return new URL(workerUrl()).origin; } catch (e) { return workerUrl(); }
    })();
  }

  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null; iframe = null;
  }

  function installBridgeListener() {
    if (!window.__iseriaBridgeInstalled) {
      window.__iseriaBridgeInstalled = true;
      MSG_TARGET.addEventListener('message', onBridgeMessage);
    }
  }

  // 导航工坊 iframe：重建 iframe 并设置 src（避免跨窗口 location.replace 被浏览器静默忽略）
  function navigateIframe(url) {
    if (!iframe || !overlay) return;
    try {
      var fr = DOC.createElement('iframe');
      fr.style.cssText = iframe.style.cssText;
      fr.setAttribute('src', url);
      fr.addEventListener('load', installBridgeListener);
      overlay.replaceChild(fr, iframe);
      iframe = fr;
    } catch (e) { warn('导航工坊失败', e); }
  }

  function handleAgreement(ev) {
    var d = ev.data;
    if (!d || d.namespace !== NS || d.type !== 'agreement-accepted') return;
    if (ev.source !== (iframe && iframe.contentWindow)) return;
    MSG_TARGET.removeEventListener('message', handleAgreement);
    try { localStorage.setItem(AGREEMENT_KEY, 'true'); } catch (e) {}
    navigateIframe(workerUrl() + '/');
  }

  function openWorkshop() {
    if (overlay) { closeOverlay(); return; }
    var accepted = false;
    try { accepted = localStorage.getItem(AGREEMENT_KEY) === 'true'; } catch (e) {}

    if (!accepted) {
      // 首次：遮罩内嵌免责声明，同意后再进入工坊（不依赖 window.confirm）
      buildOverlay(disclaimerSrcdoc());
      MSG_TARGET.addEventListener('message', handleAgreement);
      return;
    }

    buildOverlay();
    iframe.addEventListener('load', installBridgeListener);
  }

  function onBridgeMessage(ev) {
    var d = ev.data;
    if (!d || d.namespace !== NS) return;
    // 安全校验：来源必须是我们的 iframe，且 origin 与工坊一致
    if (ev.source !== (iframe && iframe.contentWindow)) return;
    if (origin && ev.origin !== origin) { warn('拒绝来自', ev.origin, '的消息'); return; }

    var type = d.type;
    var requestId = d.requestId;
    var data = d.data || {};

    // 工坊前端请求关闭窗口
    if (type === 'close') { closeOverlay(); return; }

    function respond(result) {
      try {
        if (!iframe || !iframe.contentWindow) return;
        iframe.contentWindow.postMessage(
          { namespace: NS, type: 'bridge:response', requestId: requestId, data: result },
          origin || '*'
        );
      } catch (e) { warn('回传失败', e); }
    }
    function respondError(err) {
      try {
        if (!iframe || !iframe.contentWindow) return;
        iframe.contentWindow.postMessage(
          { namespace: NS, type: 'bridge:response', requestId: requestId, data: { ok: false, error: (err && err.message) || '未知错误' } },
          origin || '*'
        );
      } catch (e) { warn('回传失败', e); }
    }

    bridgeCall(type, data).then(respond).catch(respondError);
  }

  // ---- 注册按钮 ----
  function register() {
    try {
      appendInexistentScriptButtons([{ name: '伊瑟利亚创意工坊', visible: true }]);
      eventOn(getButtonEvent('伊瑟利亚创意工坊'), function () {
        openWorkshop();
      });
      log('宿主脚本已加载');
    } catch (e) {
      console.error('[伊瑟利亚工坊] 注册失败：', e);
    }
  }

  // 加载时机：jQuery ready（禁止使用 DOMContentLoaded）
  $(function () {
    register();
  });
})();
