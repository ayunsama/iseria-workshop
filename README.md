# 🏰 伊瑟利亚创意工坊

给「伊瑟利亚大陆」角色卡用的**二创内容分发系统**：玩家在游戏内打开「伊瑟利亚创意工坊」，浏览、安装、卸载、更新由玩家创作的内容包（事件 / 角色包 / 材料本 / 扩展）；玩家也可以在网页投稿，工坊主审核通过后自动上架。



```
\[玩家在酒馆点按钮] ──→ \[宿主脚本(随卡分发)] ──→ \[Cloudflare Worker 云端]

&#x20;                            │                        │

&#x20;                安装/卸载/更新内容包         浏览列表 / 投稿 / 审核

&#x20;                            │                        │

&#x20;                       \[角色世界书+正则]          \[KV 数据库]
```

**全程免费**（Cloudflare Workers 免费额度 + GitHub 免费仓库），不需要租服务器、不需要买域名。

---

## ✅ 部署状态（2026-09-08 已上线）

| 项目 | 地址 |
|---|---|
| 🏰 工坊玩家端（浏览 / 安装 / 投稿） | https://iseria-workshop.1020803065.workers.dev |
| 🔐 工坊主审核后台 | https://iseria-workshop.1020803065.workers.dev/admin |
| 📦 GitHub 仓库 | https://github.com/ayunsama/iseria-workshop |

- 管理后台密码：见本地文件 `C:\Users\Administrator\Desktop\iseria_admin_password.txt`（勿上传 GitHub；可在 Cloudflare 控制台 → Workers → iseria-workshop → Settings → Variables 中修改 `ADMIN_PASSWORD`）。
- 宿主脚本已内置工坊地址，无需再改：`host-script/index.js` 的 `WORKER_URL`。
- 云端全链路已验证：健康检查 / 页面 / 投稿 → 审核 → 上架 → 文件分发 / 下载计数，全部通过。
- 子域名为账号自动分配的 `1020803065.workers.dev`；如需更好记的子域名，可在 Cloudflare 控制台修改（Workers 设置 → Workers 子域名）。

***

## 一、文件结构



```
iseria-workshop/

├── host-script/index.js         宿主脚本（装进角色卡的那一段，随卡分发）

├── worker/

│   ├── wrangler.toml            Cloudflare 配置（方案 B 用）

│   ├── src/                     后端代码（4 个文件 + 页面包）

│   │   ├── index.js             入口与路由

│   │   ├── utils.js             公共工具

│   │   ├── api\_projects.js      项目列表 / 详情 / 文件分发

│   │   ├── api\_submissions.js   玩家投稿

│   │   ├── api\_admin.js         审核（通过 / 打回 / 下架）

│   │   └── public\_html.js       工坊前端 + 审核后台页面（内嵌版）

│   └── public/                  工坊前端页面（独立文件版，方案 B 用）

│       ├── index.html           玩家端：浏览 / 安装 / 投稿（中文）

│       └── admin.html           工坊主审核后台（中文）

├── content-packs/demo-hearth/project.json   示例内容包（验证用）

└── docs/content-pack-format.md  内容包投稿格式说明
```



***

## 二、部署教程（零基础版，约 30 分钟）

### 第 1 步：把代码放到 GitHub（免费）



1. 注册 [GitHub](https://github.com)（要邮箱验证）；

2. 点右上角 **+ → New repository**，仓库名填 `iseria-workshop`，选 Public，Create；

3. 在仓库页点 **Add file → Upload files**，把本文件夹里的 `host-script/`、`worker/`、`content-packs/`、`docs/` 全部拖进去，提交（Commit changes）。

> 这时你已经有一个网页地址：
>
> `https://raw.githubusercontent.com/你的用户名/iseria-workshop/main/host-script/index.js`
>
> ，宿主脚本就靠它分发（走 jsDelivr 加速）。

### 第 2 步：注册 Cloudflare 并创建 KV 数据库（免费）



1. 注册 [Cloudflare](https://dash.cloudflare.com/sign-up)（要邮箱验证）；

2. 左侧菜单 **Workers 和 Pages** → **KV** → **创建命名空间**，名称填 `WORKSHOP_KV`，创建；

3. 记下它的 **ID**（后面要用）。

### 第 3 步：创建 Worker 并粘贴代码（二选一）

**方案 A：网页粘贴（推荐给零基础）**



1. **Workers 和 Pages → 创建 → Workers → 创建 Worker**，名称填 `iseria-workshop`；

2. 在编辑页左侧 **文件** 面板，把 `worker/src/` 下的 **6 个文件**（index.js、utils.js、api\_projects.js、api\_submissions.js、api\_admin.js、public\_html.js）**逐个上传**（点文件列表的 + 号，文件内容从你 GitHub 仓库复制粘贴即可）；

* 注意：Worker 入口必须保持为 `index.js`，且代码格式选 **ES Modules**；

1. 左侧 **设置 → 变量和机密**：

* 添加**机密** `ADMIN_PASSWORD`（你设一个管理密码，例如 `yiseliya-admin-2026`）；

* 添加**变量** `WORKSHOP_NAME` = `伊瑟利亚创意工坊`；

1. 左侧 **设置 → 绑定**（或变量页的 KV 命名空间绑定）：添加 KV 命名空间，绑定名填 `WORKSHOP_KV`，选第 2 步创建的命名空间；

2. 右上角 **部署**。

**方案 B：命令行（wrangler）**



```
cd iseria-workshop/worker

npx wrangler login          # 浏览器里授权一次

npx wrangler kv namespace create WORKSHOP\_KV   # 把输出的 id 填进 wrangler.toml

npx wrangler secret put ADMIN\_PASSWORD          # 输入你的管理密码

npx wrangler deploy
```

### 第 4 步：验证云端 OK

打开浏览器访问（把域名换成你的）：



```
https://iseria-workshop.你的子域.workers.dev/api/health
```

看到 `{"ok":true,...}` 就说明后端活了。再访问：



```
https://iseria-workshop.你的子域.workers.dev/          ← 工坊前端（中文）

https://iseria-workshop.你的子域.workers.dev/admin     ← 审核后台（输管理密码进入）
```

> 域名形如 
>
> `iseria-workshop.<你的账号>子域.workers.dev`
>
> ，部署完成后会显示在 Worker 详情页。

### 第 5 步：把工坊地址填进宿主脚本并上传



1. 打开 `host-script/index.js`，把开头的：



```
var WORKER\_URL = 'https://你的工坊域名.workers.dev';
```

改成你的真实地址（`https://iseria-workshop.xxx.workers.dev`，不带末尾斜杠）；



1. 把改好的 `index.js` 重新上传覆盖到你 GitHub 仓库的 `host-script/index.js`；

2. 验证 CDN 可用：浏览器打开



```
https://cdn.jsdelivr.net/gh/你的用户名/iseria-workshop@main/host-script/index.js
```

能看到代码就 OK（首次访问需等几十秒缓存生效）。

### 第 6 步：装进角色卡

在「伊瑟利亚大陆」角色卡的**脚本**里新增一行（放在其他脚本之后）：



```
import 'https://cdn.jsdelivr.net/gh/你的用户名/iseria-workshop@main/host-script/index.js';
```

保存并重新打开角色卡。酒馆扩展栏会出现 **「伊瑟利亚创意工坊」** 按钮。

### 第 7 步：端到端测试



1. 浏览器打开工坊前端 → **投稿创作** → 粘贴 `content-packs/demo-hearth/project.json` 全文 → 提交；

2. 打开 `/admin` → 输入管理密码 → 看到待审核投稿 → **查看内容** → **✅ 通过并上架**；

3. 刷新工坊前端 → **浏览内容** 里出现「示例・篝火夜谈」→ 在游戏内打开工坊 → 点 **安装**；

4. 酒馆世界书里出现 `[伊瑟利亚工坊][事件][示例·篝火夜谈]` 系列条目，正则里出现 `[伊瑟利亚工坊] 示例·篝火夜谈 - 篝火氛围条`；

5. 回到工坊可看到「已安装 / 卸载」，作者更新版本后显示「可更新」。

**到这里，你的工坊就上线了！**



***

## 三、日常使用



| 你要做什么           | 去哪                                                |
| --------------- | ------------------------------------------------- |
| 看玩家投稿 / 审核 / 下架 | 打开 `/admin`，输入管理密码                                |
| 修改审核密码          | Cloudflare Worker 设置 → 机密 `ADMIN_PASSWORD` 改掉即可   |
| 自定义工坊名称 / 文案    | 改 `worker/public/index.html` 与 `admin.html` 后重新上传 |
| 给玩家讲解投稿格式       | 把 `docs/content-pack-format.md` 发给他们              |

## 四、常见问题

**Q：酒馆里点了按钮没反应？**

A：确认宿主脚本已加载（酒馆扩展栏有按钮即可）；确认 `WORKER_URL` 改成了你的真实地址；看酒馆控制台是否有报错日志（前缀 `[伊瑟利亚工坊]`）。

**Q：安装报 "下载失败"？**

A：先在浏览器里直接打开 `downloadUrl`（工坊前端卡片信息里有），能出 JSON 再回游戏安装；多半是 Worker 未部署成功或 KV 未绑定。

**Q：内容包能带图片 / 音频吗？**

A：第一版只支持 "世界书条目 + 正则" 两种数据（正则里的 HTML 可以引用网络图片 / 音频链接，如 CDN 图床、音乐直链）。后续可扩展 "资源文件" 类型。

**Q：想加 Discord 登录 / 玩家账号体系？**

A：第一版用 "投稿匿名 + 署名 + 后台密码审核" 简化上线。要加 OAuth 可以在 `worker/src` 增加 `oauth.js` 模块，参考 Cloudflare 官方 OAuth 教程接入。

**Q：流量大了要花钱吗？**

A：免费额度（每天 10 万请求）对小圈子绰绰有余；真到需要升级时，说明你已经很火了。



***

## 五、给作者：怎么快速生产内容包

用豆包的 `creative-workshop-content-pack` 技能（已按「失乐园」逆向拆解），按模板生成六类条目（入口 / 角色信息 / 规则 / 本体 / 物品 / BGM 控制器），产出 `project.json` 即可投稿。格式细节见 `docs/content-pack-format.md`。