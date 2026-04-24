# 个人网站操作指南

## 一、本地开发

### 日常开发流程

```bash
cd /Users/wxhu/Documents/TRAE_workspace/WebPage

# 启动开发服务器
npm run dev
# 访问 http://localhost:4321/portfolio/

# 构建生产版本
npm run build
# 输出到 dist/ 目录

# 本地预览构建结果
npm run preview
```

### 新增博客文章

1. 在 `src/content/blog/` 下创建 `.mdx` 文件
2. 按照现有文章的 frontmatter 格式填写元数据
3. `npm run dev` 本地预览效果
4. 满意后提交推送

### 新增作品项目

1. 在 `src/content/projects/` 下创建 `.mdx` 文件
2. 按照现有项目的 frontmatter 格式填写元数据
3. 本地预览后提交推送

---

## 二、部署上线

### 自动部署（推荐）

```bash
git add .
git commit -m "描述你的改动"
git push
```

推送后 GitHub Actions 自动执行：
- 构建站点 → 部署到 GitHub Pages（约 30 秒）
- 同步到阿里云服务器（如已配置）

### 手动触发部署

```bash
# 通过 GitHub CLI
gh workflow run deploy.yml --ref main -R PokerFaceWen/portfolio

# 或空提交触发
git commit --allow-empty -m "trigger deployment"
git push
```

### 查看部署状态

```bash
gh run list --workflow="deploy.yml" -R PokerFaceWen/portfolio
gh run view <run-id> -R PokerFaceWen/portfolio
```

---

## 三、访问地址

| 环境 | URL | 用途 |
|------|-----|------|
| 本地开发 | http://localhost:4321/portfolio/ | 日常调试 |
| GitHub Pages | https://pokerfacewen.github.io/portfolio/ | 线上访问（海外线路） |
| 阿里云服务器 | http://服务器IP | 线上访问（国内线路） |

---

## 四、阿里云服务器操作

### SSH 登录

```bash
ssh root@服务器IP
```

### Nginx 常用命令

```bash
systemctl status nginx    # 查看状态
systemctl start nginx     # 启动
systemctl stop nginx      # 停止
systemctl reload nginx    # 重载配置（修改配置后用这个，不中断服务）
systemctl restart nginx   # 重启（会短暂中断）
nginx -t                  # 测试配置文件语法是否正确
```

### 网站文件位置

```
/var/www/portfolio/       # 静态文件目录
/etc/nginx/conf.d/portfolio.conf  # Nginx 站点配置
```

### 手动同步文件到服务器

```bash
# 从本地同步 dist/ 到服务器
rsync -avz --delete dist/ root@服务器IP:/var/www/portfolio/
```

### Nginx 配置修改流程

```bash
# 1. 编辑配置
vim /etc/nginx/conf.d/portfolio.conf

# 2. 测试语法
nginx -t

# 3. 重载配置
systemctl reload nginx
```

---

## 五、HTTPS 配置（备案通过后操作）

### 申请 Let's Encrypt 免费证书

```bash
# 安装 certbot
yum install -y certbot python3-certbot-nginx

# 申请证书（自动修改 Nginx 配置）
certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 测试自动续期
certbot renew --dry-run
```

证书有效期 90 天，certbot 会自动续期，无需手动操作。

---

## 六、安全相关

### 服务器安全检查清单

- [ ] 阿里云控制台防火墙已开 80/443 端口
- [ ] SSH 密钥登录已配置
- [ ] root 密码登录已禁用（密钥配好后执行）
- [ ] fail2ban 已安装运行
- [ ] Nginx 禁止访问隐藏文件（配置中已包含）
- [ ] GitHub Secrets 中存放云服务密钥，不硬编码

### 禁用密码登录（密钥配好后执行）

```bash
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd
```

---

## 七、快照与备份

### 创建快照（重大变更前）

阿里云控制台 → 快照 → 创建快照 → 命名备注

### 建议打快照的时机

- Nginx 配置完成后
- HTTPS 证书配置完成后
- 每次重大配置变更前

---

## 八、域名与备案（正式上线时操作）

### 域名解析配置

```
阿里云控制台 → 域名 → 解析设置

A 记录：
  主机记录：@
  记录值：服务器公网 IP

A 记录：
  主机记录：www
  记录值：服务器公网 IP
```

### ICP 备案

```
阿里云控制台 → 域名 → 备案
按引导提交，审核时间 5-20 天
```

### 备案通过后

1. 域名解析生效
2. 配置 Nginx server_name 为你的域名
3. 申请 HTTPS 证书
4. 更新 astro.config.mjs 中的 site 为你的域名

---

## 九、故障排查

### GitHub Pages 部署失败

```bash
# 查看最近运行记录
gh run list --workflow="deploy.yml" -R PokerFaceWen/portfolio

# 查看失败日志
gh run view <run-id> --log-failed -R PokerFaceWen/portfolio
```

### 服务器网站打不开

```bash
# 1. 检查 Nginx 是否运行
systemctl status nginx

# 2. 检查端口是否监听
ss -tlnp | grep -E '80|443'

# 3. 检查 Nginx 配置
nginx -t

# 4. 查看 Nginx 错误日志
tail -50 /var/log/nginx/error.log
```

### 阿里云控制台防火墙检查

控制台 → 服务器 → 安全 → 防火墙 → 确认 80/443 端口已开放

---

## 十、项目技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Astro | 6.x | 静态站点生成器 |
| React | 待集成 | 交互组件 |
| Tailwind CSS | 待集成 | 样式系统 |
| MDX | 待集成 | 博客内容 |
| Nginx | 服务器端 | 静态文件托管 |
| GitHub Actions | CI/CD | 自动部署 |
