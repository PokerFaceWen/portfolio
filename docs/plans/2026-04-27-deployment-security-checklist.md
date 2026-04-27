# 部署与安全风险整改清单

## 一、部署链路整改

- 为阿里云部署补一条自动化流水线，避免 GitHub Pages 和自建站内容不同步。
- 将生产部署拆成 `build`、`pages deploy`、`server deploy` 三段，分别记录状态和失败原因。
- 给阿里云部署增加 `rsync --delete` 或原子发布目录切换，避免残留旧文件。
- 为构建产物增加一次部署前检查，确认 `base`、favicon、canonical、静态资源路径符合预期。
- 在仓库中补充一份“切换根路径部署”的操作手册，明确 `astro.config.mjs`、Nginx rewrite、站点链接需要同时调整。

## 二、服务器安全整改

- 配置 SSH 密钥登录，并验证可用后禁用密码登录。
- 禁止 root 直接远程登录，改用普通用户加 `sudo`。
- 修改 SSH 默认端口，并同步更新安全组和防火墙规则。
- 安装并启用 `fail2ban`，至少保护 SSH 和 Nginx。
- 检查系统更新与安全补丁，建立月度更新节奏。

## 三、Nginx 与证书整改

- 为 Nginx 配置变更建立标准流程：改配置、`nginx -t`、reload、回滚。
- 给站点开启常见安全响应头，例如 `X-Frame-Options`、`X-Content-Type-Options`、`Referrer-Policy`。
- 记录 SSL 证书到期时间，并在到期前至少 30 天提醒续期。
- 如果继续手动续签，补一份证书更换回滚预案；如果条件允许，迁移到可自动续签方案。

## 四、站点可维护性整改

- 增加基础 CI 校验，至少包含 `npm run build`。
- 将 `.DS_Store` 加入忽略并清理仓库中的同类本地文件。
- 为关键页面补一轮人工验收清单：首页、博客详情、项目详情、照片墙、主题切换。
- 为 SEO 建立检查项，至少覆盖 title、description、canonical、Open Graph、Twitter Card。
