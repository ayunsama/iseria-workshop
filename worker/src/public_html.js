// 伊瑟利亚创意工坊 - 内嵌页面（方案 A：纯网页粘贴部署用）
// 由 public/index.html 与 public/admin.html 自动生成，勿手改；修改页面后重新运行 generate_html_module.py

export const INDEX_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>伊瑟利亚创意工坊</title>
<style>
  :root{
    --bg:#f4f1ea; --card:#ffffff; --ink:#1a1b1c; --sub:#6b7280;
    --accent:#8a6a3b; --accent-soft:#f0e4d0; --line:#e4e3dd;
    --ok:#3f9e4d; --warn:#b9770e; --err:#c0392b;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font-family:'Roboto','PingFang SC','Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.55}
  header{background:linear-gradient(135deg,#2c2115,#4a3a22);color:#f5ead6;padding:18px 22px}
  header h1{font-size:20px;font-weight:700;letter-spacing:1px}
  header p{font-size:12.5px;opacity:.85;margin-top:2px}
  nav{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
  nav button{background:rgba(255,255,255,.12);color:#f5ead6;border:1px solid rgba(255,255,255,.25);border-radius:8px;padding:7px 16px;font-size:13.5px;cursor:pointer}
  nav button.active{background:#c9a24b;color:#241a0d;border-color:#c9a24b;font-weight:600}
  main{max-width:980px;margin:0 auto;padding:20px 16px 60px}
  section{display:none}
  section.active{display:block}
  .muted{color:var(--sub);font-size:13px}
  /* 卡片 */
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-top:14px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
  .card .cover{height:120px;border-radius:10px;background:linear-gradient(135deg,#e8dcc4,#cbb794);display:flex;align-items:center;justify-content:center;color:#7a6234;font-size:30px}
  .card h3{font-size:16px}
  .tags{display:flex;gap:6px;flex-wrap:wrap}
  .tag{background:var(--accent-soft);color:var(--accent);border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600}
  .meta{color:var(--sub);font-size:12.5px}
  .desc{font-size:13px;color:#333}
  .btns{display:flex;gap:8px;margin-top:auto;flex-wrap:wrap}
  .btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13.5px;cursor:pointer}
  .btn:hover{filter:brightness(1.08)}
  .btn.secondary{background:#e5e2da;color:#333}
  .btn.danger{background:#f2dcd7;color:var(--err)}
  .btn.ok{background:#dcefde;color:var(--ok)}
  .btn:disabled{opacity:.55;cursor:not-allowed}
  /* 表单 */
  .form{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px;margin-top:14px;display:flex;flex-direction:column;gap:14px}
  .form label{font-size:13px;font-weight:600}
  .form input,.form textarea,.form select{border:1px solid var(--line);border-radius:8px;padding:10px 12px;font-size:14px;font-family:inherit;width:100%;background:#fff}
  .form textarea{min-height:120px;resize:vertical}
  .form .hint{color:var(--sub);font-size:12px}
  .row2{display:flex;gap:12px;flex-wrap:wrap}
  .row2 > div{flex:1 1 200px}
  /* toast */
  #toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#2c2c2c;color:#fff;padding:10px 20px;border-radius:10px;font-size:13.5px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:99;max-width:90vw}
  #toast.show{opacity:.95}
  #toast.err{background:#7a2a22}
  footer{position:fixed;bottom:0;left:0;right:0;background:#efece4;border-top:1px solid var(--line);padding:7px 16px;font-size:12px;color:var(--sub);display:flex;justify-content:space-between;align-items:center}
  footer a{color:var(--accent);text-decoration:none}
  .empty{padding:40px 0;text-align:center;color:var(--sub)}
  .loading{text-align:center;color:var(--sub);padding:30px 0}
</style>
</head>
<body>

<header>
  <h1>🏰 伊瑟利亚创意工坊</h1>
  <p>为伊瑟利亚大陆加载由玩家创作的内容包：事件、角色、材料本与扩展</p>
  <nav>
    <button data-view="browse" class="active">浏览内容</button>
    <button data-view="submit">投稿创作</button>
    <button data-view="installed">我的已装</button>
  </nav>
</header>

<main>
  <!-- 浏览 -->
  <section id="view-browse" class="active">
    <p class="muted">在下方找到喜欢的内容包，点击「安装」即可装进当前角色卡（可随时卸载/更新）。</p>
    <div id="project-list"><div class="loading">正在加载内容列表…</div></div>
  </section>

  <!-- 投稿 -->
  <section id="view-submit">
    <p class="muted">创作了内容包？按下方格式提交，工坊主审核通过后即会上架。</p>
    <form class="form" id="submit-form">
      <div class="row2">
        <div><label>内容包名称 *</label><input id="f-name" placeholder="例如：晨曦之环小事件" maxlength="60" required></div>
        <div><label>作者署名 *</label><input id="f-author" placeholder="你的名字 / 昵称" maxlength="30" required></div>
      </div>
      <div>
        <label>一句话简介</label>
        <input id="f-desc" placeholder="这个内容包讲什么、包含什么玩法" maxlength="200">
      </div>
      <div>
        <label>分类标签 *</label>
        <div id="f-tags" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px">
          <label class="tag-pick"><input type="checkbox" value="事件" checked> 事件</label>
          <label class="tag-pick"><input type="checkbox" value="角色包"> 角色包</label>
          <label class="tag-pick"><input type="checkbox" value="材料本"> 材料本</label>
          <label class="tag-pick"><input type="checkbox" value="扩展"> 扩展</label>
        </div>
        <style>.tag-pick{background:var(--accent-soft);border-radius:20px;padding:4px 12px;font-size:13px;display:flex;align-items:center;gap:6px;cursor:pointer}</style>
      </div>
      <div>
        <label>内容包 JSON（project.json 的全部内容）*</label>
        <textarea id="f-content" placeholder='{"name":"…","version":"1.0.0","tags":["事件"],"worldbookEntries":[…],"regexEntries":[…]}' required></textarea>
        <p class="hint">格式说明见 docs/content-pack-format.md；也可以在上传前用「示例内容包」文件对照。</p>
      </div>
      <div>
        <button type="submit" class="btn" style="font-size:15px">提交投稿</button>
        <span class="hint" style="margin-left:10px">审核通过前不会出现在浏览列表里</span>
      </div>
    </form>
  </section>

  <!-- 已安装 -->
  <section id="view-installed">
    <p class="muted">当前角色卡已安装的内容包（由创意工坊脚本管理）。</p>
    <div id="installed-list"><div class="loading">正在读取已安装内容…</div></div>
  </section>
</main>

<footer>
  <span>伊瑟利亚创意工坊 · 内容由玩家创作，工坊主审核</span>
  <a href="/admin" target="_blank" rel="noopener">工坊主后台 →</a>
</footer>

<div id="toast"></div>

<script>
(function () {
  'use strict';
  var NAMESPACE = 'iseria-workshop-bridge';
  var API = ''; // 同源

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  function toast(msg, isErr) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = isErr ? 'show err' : 'show';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = ''; }, 2600);
  }

  // ---- 与宿主脚本的 postMessage 桥 ----
  function bridgeRequest(type, data, timeoutMs) {
    return new Promise(function (resolve, reject) {
      var requestId = 'r' + Date.now() + Math.random().toString(16).slice(2, 8);
      var timer = setTimeout(function () {
        window.removeEventListener('message', onMsg);
        reject(new Error('桥接超时：宿主脚本未响应（请在游戏内打开工坊）'));
      }, timeoutMs || 8000);
      function onMsg(ev) {
        var d = ev.data;
        if (!d || d.namespace !== NAMESPACE) return;
        if (d.requestId !== requestId) return;
        clearTimeout(timer);
        window.removeEventListener('message', onMsg);
        if (d.type === 'bridge:response') {
          if (d.data && d.data.ok === false) reject(new Error(d.data.error || '宿主脚本返回失败'));
          else resolve(d.data);
        } else if (d.type === 'bridge:error') {
          reject(new Error(d.data && d.data.error || '宿主脚本错误'));
        }
      }
      window.addEventListener('message', onMsg);
      window.parent.postMessage({ namespace: NAMESPACE, type: type, requestId: requestId, data: data || {} }, '*');
    });
  }

  function hostAvailable() {
    try { return window.parent && window.parent !== window; } catch (e) { return false; }
  }

  // ---- 项目数据 ----
  var installedMap = {}; // projectId -> {version, ...}
  var projects = [];

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function loadInstalled() {
    if (!hostAvailable()) { installedMap = {}; return; }
    try {
      var data = await bridgeRequest('list-installed-projects');
      installedMap = {};
      (data.installedProjects || []).forEach(function (p) {
        installedMap[p.projectId] = p;
      });
    } catch (e) { installedMap = {}; }
  }

  function renderProjects() {
    var box = $('#project-list');
    if (!projects.length) { box.innerHTML = '<div class="empty">暂无已上架内容包。来「投稿创作」成为第一个贡献者吧！</div>'; return; }
    box.innerHTML = '';
    projects.forEach(function (p) {
      var installed = installedMap[p.id];
      var card = document.createElement('div');
      card.className = 'card';

      var cover = document.createElement('div');
      cover.className = 'cover';
      cover.textContent = p.tags[0] === '事件' ? '📜' : p.tags[0] === '角色包' ? '👤' : p.tags[0] === '材料本' ? '📦' : '🧩';

      var h3 = document.createElement('h3');
      h3.textContent = p.name;

      var tags = document.createElement('div');
      tags.className = 'tags';
      (p.tags || []).forEach(function (t) {
        var s = document.createElement('span'); s.className = 'tag'; s.textContent = t; tags.appendChild(s);
      });

      var meta = document.createElement('div');
      meta.className = 'meta';
      meta.textContent = 'v' + p.version + ' · 作者 ' + p.authorName + ' · ' + p.worldbookCount + ' 条 · 下载 ' + p.downloadsCount;

      var desc = document.createElement('div');
      desc.className = 'desc';
      desc.textContent = p.description || '（无简介）';

      var btns = document.createElement('div');
      btns.className = 'btns';

      if (installed) {
        var up = document.createElement('button');
        up.className = 'btn secondary';
        up.textContent = '已安装 v' + installed.version;
        up.disabled = true;
        var needUpdate = installed.version !== p.version;
        if (needUpdate) {
          up.textContent = '可更新 v' + p.version;
          up.disabled = false;
          up.className = 'btn ok';
          up.onclick = function () { updateProject(p); };
        }
        var un = document.createElement('button');
        un.className = 'btn danger';
        un.textContent = '卸载';
        un.onclick = function () { uninstallProject(p); };
        btns.appendChild(up);
        btns.appendChild(un);
      } else {
        var ins = document.createElement('button');
        ins.className = 'btn';
        ins.textContent = '安装';
        ins.onclick = function () { installProject(p); };
        btns.appendChild(ins);
      }

      card.appendChild(cover); card.appendChild(h3); card.appendChild(tags);
      card.appendChild(meta); card.appendChild(desc); card.appendChild(btns);
      box.appendChild(card);
    });
  }

  async function refresh() {
    await Promise.all([loadInstalled(), fetchProjects()]);
    renderProjects();
    renderInstalled();
  }

  async function fetchProjects() {
    try {
      var r = await fetch(API + '/api/projects');
      var j = await r.json();
      projects = j.ok ? (j.projects || []) : [];
    } catch (e) { projects = []; }
  }

  function renderInstalled() {
    var box = $('#installed-list');
    var list = Object.keys(installedMap).map(function (k) { return installedMap[k]; });
    if (!hostAvailable()) {
      box.innerHTML = '<div class="empty">未检测到宿主脚本：请从游戏内的「伊瑟利亚创意工坊」按钮打开本页面。</div>';
      return;
    }
    if (!list.length) {
      box.innerHTML = '<div class="empty">还没有安装任何内容包。去「浏览内容」挑一个吧！</div>';
      return;
    }
    box.innerHTML = '';
    list.forEach(function (p) {
      var row = document.createElement('div');
      row.className = 'card';
      var h3 = document.createElement('h3'); h3.textContent = p.nameDisplay || p.name;
      var meta = document.createElement('div'); meta.className = 'meta';
      meta.textContent = 'v' + p.version + ' · ' + p.entriesCount + ' 条世界书 · ' + (p.regexCount || 0) + ' 个正则';
      var btns = document.createElement('div'); btns.className = 'btns';
      var un = document.createElement('button'); un.className = 'btn danger'; un.textContent = '卸载';
      un.onclick = function () { uninstallProject(p); };
      btns.appendChild(un);
      row.appendChild(h3); row.appendChild(meta); row.appendChild(btns);
      box.appendChild(row);
    });
  }

  // ---- 安装 / 卸载 / 更新 ----
  async function installProject(p) {
    if (!hostAvailable()) { toast('请在游戏内打开工坊进行安装', true); return; }
    toast('正在下载并安装「' + p.name + '」…');
    try {
      await bridgeRequest('install-project', {
        projectId: p.id,
        downloadUrl: API + '/api/files/projects/' + p.id + '/project-' + p.id + '.json',
        name: p.name, version: p.version, tags: p.tags
      }, 30000);
      toast('✅ 安装成功！');
      await loadInstalled(); renderProjects(); renderInstalled();
    } catch (e) { toast('安装失败：' + e.message, true); }
  }

  async function uninstallProject(p) {
    if (!hostAvailable()) { toast('请在游戏内打开工坊进行卸载', true); return; }
    if (!window.confirm('确定卸载「' + (p.nameDisplay || p.name) + '」吗？')) return;
    try {
      await bridgeRequest('uninstall-project', { projectId: p.projectId || p.id }, 15000);
      toast('已卸载');
      await loadInstalled(); renderProjects(); renderInstalled();
    } catch (e) { toast('卸载失败：' + e.message, true); }
  }

  async function updateProject(p) {
    if (!hostAvailable()) { toast('请在游戏内打开工坊进行更新', true); return; }
    toast('正在更新「' + p.name + '」…');
    try {
      await bridgeRequest('confirm-project-update', {
        projectId: p.id,
        downloadUrl: API + '/api/files/projects/' + p.id + '/project-' + p.id + '.json',
        name: p.name, version: p.version, tags: p.tags
      }, 30000);
      toast('✅ 更新成功！');
      await loadInstalled(); renderProjects(); renderInstalled();
    } catch (e) { toast('更新失败：' + e.message, true); }
  }

  // ---- 投稿 ----
  function selectedTags() {
    return $$('#f-tags input:checked').map(function (i) { return i.value; });
  }

  $('#submit-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var tags = selectedTags();
    if (!tags.length) { toast('请至少选择一个分类标签', true); return; }
    var payload = {
      name: $('#f-name').value.trim(),
      authorName: $('#f-author').value.trim(),
      description: $('#f-desc').value.trim(),
      tags: tags,
      content: $('#f-content').value.trim()
    };
    var btn = ev.target.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = '提交中…';
    try {
      var r = await fetch(API + '/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var j = await r.json();
      if (j.ok) {
        toast('✅ ' + j.message);
        ev.target.reset();
        $$('#f-tags input')[0].checked = true;
      } else {
        toast('投稿失败：' + (j.error || '未知错误'), true);
      }
    } catch (e) {
      toast('投稿失败：' + e.message, true);
    } finally {
      btn.disabled = false; btn.textContent = '提交投稿';
    }
  });

  // ---- 页签切换 ----
  $$('nav button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('nav button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      $$('main section').forEach(function (s) { s.classList.remove('active'); });
      $('#view-' + b.dataset.view).classList.add('active');
      if (b.dataset.view === 'browse') refresh();
      if (b.dataset.view === 'installed') renderInstalled();
    });
  });

  refresh();
})();
</script>
</body>
</html>
`;

export const ADMIN_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>伊瑟利亚创意工坊 · 工坊主后台</title>
<style>
  :root{
    --bg:#f4f1ea; --card:#fff; --ink:#1a1b1c; --sub:#6b7280;
    --accent:#8a6a3b; --accent-soft:#f0e4d0; --line:#e4e3dd;
    --ok:#3f9e4d; --warn:#b9770e; --err:#c0392b;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--ink);font-family:'Roboto','PingFang SC','Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.55}
  header{background:linear-gradient(135deg,#2c2115,#4a3a22);color:#f5ead6;padding:16px 22px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
  header h1{font-size:18px}
  header a{color:#c9a24b;text-decoration:none;font-size:13px}
  main{max-width:1000px;margin:0 auto;padding:20px 16px 60px}
  nav{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
  nav button{background:#efece4;border:1px solid var(--line);border-radius:8px;padding:7px 16px;font-size:13.5px;cursor:pointer}
  nav button.active{background:var(--accent);color:#fff;border-color:var(--accent);font-weight:600}
  .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.05)}
  .card h3{font-size:15.5px}
  .meta{color:var(--sub);font-size:12.5px;margin-top:2px}
  .desc{font-size:13px;color:#333;margin-top:6px}
  .badge{display:inline-block;border-radius:20px;padding:2px 10px;font-size:12px;font-weight:600;margin:6px 6px 0 0}
  .badge.pending{background:#fdeed0;color:var(--warn)}
  .badge.approved{background:#dcefde;color:var(--ok)}
  .badge.rejected{background:#f2dcd7;color:var(--err)}
  .btns{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
  .btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:13.5px;cursor:pointer}
  .btn:hover{filter:brightness(1.08)}
  .btn.secondary{background:#e5e2da;color:#333}
  .btn.danger{background:#f2dcd7;color:var(--err)}
  .btn.ok{background:#dcefde;color:var(--ok)}
  .login{max-width:420px;margin:60px auto;background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px}
  .login input{width:100%;border:1px solid var(--line);border-radius:8px;padding:11px 12px;font-size:14px;margin-top:10px}
  .login button{margin-top:14px;width:100%}
  .loading{text-align:center;color:var(--sub);padding:30px 0}
  .empty{text-align:center;color:var(--sub);padding:40px 0}
  pre{background:#f8f6f1;border:1px solid var(--line);border-radius:8px;padding:10px;font-size:12px;overflow:auto;max-height:260px;white-space:pre-wrap;word-break:break-all}
  .detail{display:none;margin-top:10px}
  .detail.open{display:block}
  .entry{border-top:1px dashed var(--line);padding:8px 0}
  .entry b{font-size:13px}
  #toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#2c2c2c;color:#fff;padding:10px 20px;border-radius:10px;font-size:13.5px;opacity:0;transition:opacity .25s;pointer-events:none;z-index:99;max-width:90vw}
  #toast.show{opacity:.95}
  #toast.err{background:#7a2a22}
</style>
</head>
<body>

<header>
  <h1>🔑 伊瑟利亚创意工坊 · 工坊主后台</h1>
  <a href="/" target="_blank" rel="noopener">← 返回工坊</a>
</header>

<main>
  <div id="login-box" class="login">
    <h3>输入管理密码</h3>
    <p class="meta" style="margin-top:6px">密码由你在 Cloudflare Worker 的环境变量 ADMIN_PASSWORD 中设置</p>
    <input type="password" id="admin-pass" placeholder="管理密码">
    <button class="btn" id="login-btn">进入后台</button>
  </div>

  <div id="panel" style="display:none">
    <nav>
      <button data-filter="pending" class="active">待审核</button>
      <button data-filter="rejected">已打回</button>
      <button data-filter="approved">已上架</button>
      <button data-filter="live">全部已上架项目</button>
    </nav>
    <div id="list"><div class="loading">加载中…</div></div>
  </div>
</main>

<div id="toast"></div>

<script>
(function () {
  'use strict';
  var API = '';
  var TOKEN_KEY = 'iseria_admin_token';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function toast(msg, isErr) {
    var t = $('#toast');
    t.textContent = msg;
    t.className = isErr ? 'show err' : 'show';
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = ''; }, 2600);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function token() { return localStorage.getItem(TOKEN_KEY) || ''; }

  async function api(path, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers || {});
    if (options.body && !options.headers['Content-Type']) {
      options.headers['Content-Type'] = 'application/json';
    }
    if (token()) options.headers['Authorization'] = 'Bearer ' + token();
    var r = await fetch(API + path, options);
    var j;
    try { j = await r.json(); } catch (e) { j = { ok: false, error: '响应解析失败' }; }
    if (!r.ok && !j.ok) throw new Error(j.error || ('HTTP ' + r.status));
    return j;
  }

  var currentFilter = 'pending';

  function badge(status) {
    var map = { pending: ['待审核', 'pending'], approved: ['已上架', 'approved'], rejected: ['已打回', 'rejected'] };
    var m = map[status] || [status, 'pending'];
    return '<span class="badge ' + m[1] + '">' + m[0] + '</span>';
  }

  function renderSubmissionCard(s) {
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<h3>' + esc(s.name) + ' ' + badge(s.status) + '</h3>' +
      '<div class="meta">作者 ' + esc(s.authorName) + ' · v' + esc(s.version) + ' · ' +
        esc((s.tags || []).join(' / ')) + ' · ' + s.worldbookCount + ' 条世界书 · ' + s.regexCount + ' 个正则' +
        ' · 投稿 ' + (s.createdAt || '').replace('T', ' ').slice(0, 16) + '</div>' +
      (s.description ? '<div class="desc">' + esc(s.description) + '</div>' : '') +
      (s.rejectReason ? '<div class="desc" style="color:var(--err)">打回理由：' + esc(s.rejectReason) + '</div>' : '');

    var btns = document.createElement('div');
    btns.className = 'btns';

    if (s.status === 'pending') {
      var detailBtn = document.createElement('button');
      detailBtn.className = 'btn secondary';
      detailBtn.textContent = '查看内容';
      var approveBtn = document.createElement('button');
      approveBtn.className = 'btn ok';
      approveBtn.textContent = '✅ 通过并上架';
      var rejectBtn = document.createElement('button');
      rejectBtn.className = 'btn danger';
      rejectBtn.textContent = '打回';

      detailBtn.onclick = function () { toggleDetail(card, s.id); };
      approveBtn.onclick = function () { doApprove(s); };
      rejectBtn.onclick = function () { doReject(s); };
      btns.appendChild(detailBtn); btns.appendChild(approveBtn); btns.appendChild(rejectBtn);
    }
    card.appendChild(btns);

    var detail = document.createElement('div');
    detail.className = 'detail';
    detail.id = 'detail-' + s.id;
    card.appendChild(detail);
    return card;
  }

  async function toggleDetail(card, id) {
    var box = card.querySelector('.detail');
    if (box.classList.contains('open')) { box.classList.remove('open'); return; }
    box.innerHTML = '<div class="loading">加载详情…</div>';
    box.classList.add('open');
    try {
      var j = await api('/api/admin/submissions/' + id);
      var sub = j.submission;
      var html = '<p class="meta">共 ' + sub.worldbookEntries.length + ' 条世界书 / ' + (sub.regexEntries || []).length + ' 个正则：</p>';
      sub.worldbookEntries.forEach(function (e, i) {
        html += '<div class="entry"><b>#' + (i + 1) + ' ' + esc(e.comment || '(无名)') + '</b>' +
          '<span class="meta"> keys=' + esc((e.key || []).join(',')) + ' constant=' + (!!e.constant) + ' selective=' + (!!e.selective) + ' depth=' + esc(e.depth) + '</span>' +
          '<pre>' + esc(String(e.content || '').slice(0, 600)) + (String(e.content || '').length > 600 ? '\n…(内容过长已截断)' : '') + '</pre></div>';
      });
      (sub.regexEntries || []).forEach(function (r, i) {
        html += '<div class="entry"><b>正则 #' + (i + 1) + ' ' + esc(r.scriptName) + '</b>' +
          '<pre>' + esc(String(r.findRegex || '')) + '</pre></div>';
      });
      box.innerHTML = html;
    } catch (e) {
      box.innerHTML = '<div class="empty" style="color:var(--err)">加载失败：' + esc(e.message) + '</div>';
    }
  }

  async function doApprove(s) {
    if (!window.confirm('确认通过并上架「' + s.name + '」？')) return;
    try {
      await api('/api/admin/submissions/' + s.id + '/approve', { method: 'POST', body: '{}' });
      toast('✅ 已上架');
      load(currentFilter);
    } catch (e) { toast('操作失败：' + e.message, true); }
  }

  async function doReject(s) {
    var reason = window.prompt('打回理由（会展示给作者）：', '请按内容包格式要求修改后重新投稿');
    if (reason === null) return;
    try {
      await api('/api/admin/submissions/' + s.id + '/reject', { method: 'POST', body: JSON.stringify({ reason: reason }) });
      toast('已打回');
      load(currentFilter);
    } catch (e) { toast('操作失败：' + e.message, true); }
  }

  function renderProjectRow(p) {
    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      '<h3>' + esc(p.name) + '</h3>' +
      '<div class="meta">v' + esc(p.version) + ' · ' + esc(p.authorName) + ' · ' +
        esc((p.tags || []).join(' / ')) + ' · ' + p.worldbookCount + ' 条 · 下载 ' + p.downloadsCount + '</div>' +
      (p.description ? '<div class="desc">' + esc(p.description) + '</div>' : '');
    var btns = document.createElement('div');
    btns.className = 'btns';
    var del = document.createElement('button');
    del.className = 'btn danger';
    del.textContent = '下架';
    del.onclick = function () {
      if (!window.confirm('确定下架「' + p.name + '」？玩家将无法再安装/更新它。')) return;
      api('/api/admin/projects/' + p.id, { method: 'DELETE' })
        .then(function () { toast('已下架'); load('live'); })
        .catch(function (e) { toast('下架失败：' + e.message, true); });
    };
    btns.appendChild(del);
    card.appendChild(btns);
    return card;
  }

  async function load(filter) {
    currentFilter = filter;
    $$('nav button').forEach(function (b) {
      b.classList.toggle('active', b.dataset.filter === filter);
    });
    var box = $('#list');
    box.innerHTML = '<div class="loading">加载中…</div>';
    try {
      if (filter === 'live') {
        var j = await api('/api/projects');
        box.innerHTML = '';
        if (!j.projects.length) box.innerHTML = '<div class="empty">暂无已上架项目</div>';
        j.projects.forEach(function (p) { box.appendChild(renderProjectRow(p)); });
      } else {
        var j2 = await api('/api/admin/submissions?status=' + filter);
        box.innerHTML = '';
        if (!j2.submissions.length) box.innerHTML = '<div class="empty">这里空空如也</div>';
        j2.submissions.forEach(function (s) { box.appendChild(renderSubmissionCard(s)); });
      }
    } catch (e) {
      box.innerHTML = '<div class="empty" style="color:var(--err)">加载失败：' + esc(e.message) + '</div>';
    }
  }

  // ---- 登录 ----
  async function tryLogin() {
    var pass = $('#admin-pass').value.trim();
    if (!pass) { toast('请输入管理密码', true); return; }
    // 用一次真实请求验证密码
    localStorage.setItem(TOKEN_KEY, pass);
    try {
      await api('/api/admin/submissions?status=pending');
      $('#login-box').style.display = 'none';
      $('#panel').style.display = 'block';
      load('pending');
      toast('✅ 已进入后台');
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      toast('密码错误：' + e.message, true);
    }
  }

  $('#login-btn').addEventListener('click', tryLogin);
  $('#admin-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') tryLogin(); });
  $$('nav button').forEach(function (b) {
    b.addEventListener('click', function () { load(b.dataset.filter); });
  });

  // 已存密码则直接尝试进入
  if (token()) tryLogin();
})();
</script>
</body>
</html>
`;
