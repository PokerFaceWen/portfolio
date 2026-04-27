# 阿里云部署配置指南

## 🔍 配置信息获取步骤

### 1. 服务器IP（你已拥有）
- 你的域名：`vincentbuilds.fun`
- 获取IP方法：
  ```bash
  ping vincentbuilds.fun
  # 或者使用 nslookup
  nslookup vincentbuilds.fun
  ```

### 2. SSH私钥获取

#### 检查现有密钥
```bash
# 查看本地SSH密钥
ls -la ~/.ssh/

# 如果有以下文件，说明已有密钥：
# id_rsa      (私钥)
# id_rsa.pub  (公钥)

# 查看私钥内容
cat ~/.ssh/id_rsa
```

#### 如果没有密钥，生成新的
```bash
# 生成SSH密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 按提示操作（建议使用默认路径）
# 生成的文件：
# ~/.ssh/id_rsa      (私钥，需要保密)
# ~/.ssh/id_rsa.pub  (公钥，可以上传到服务器)
```

#### 将公钥添加到阿里云服务器
```bash
# 复制公钥内容
cat ~/.ssh/id_rsa.pub

# 登录服务器添加公钥
ssh root@你的服务器IP
# 在服务器上执行：
echo "你的公钥内容" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. 服务器用户名
- 阿里云ECS默认：`root`
- 测试连接：
  ```bash
  ssh root@你的服务器IP
  ```

### 4. 部署路径确认
```bash
# 登录服务器查看网站目录
ssh root@你的服务器IP

# 查看Nginx配置
cat /etc/nginx/nginx.conf
# 或查看站点配置
ls /etc/nginx/sites-available/
ls /etc/nginx/sites-enabled/

# 通常路径是：
# /www/wwwroot/vincentbuilds.fun/
# 或 /var/www/html/
# 或 /usr/share/nginx/html/
```

## 🚀 快速部署配置

### 方法一：临时环境变量（推荐测试）
```bash
# 设置环境变量（替换为你的实际信息）
export ALIYUN_SERVER_HOST="你的服务器IP"
export ALIYUN_SERVER_USER="root"
export ALIYUN_SSH_KEY="$(cat ~/.ssh/id_rsa)"
export ALIYUN_DEPLOY_PATH="/www/wwwroot/vincentbuilds.fun"

# 执行部署
npm run deploy:production
```

### 方法二：创建配置文件
创建文件 `deploy-config.sh`：
```bash
#!/bin/bash
# 阿里云部署配置
export ALIYUN_SERVER_HOST="你的服务器IP"
export ALIYUN_SERVER_USER="root"
export ALIYUN_SSH_KEY="$(cat ~/.ssh/id_rsa)"
export ALIYUN_DEPLOY_PATH="/www/wwwroot/vincentbuilds.fun"
```

使用方式：
```bash
# 加载配置
source deploy-config.sh

# 执行部署
npm run deploy:production
```

### 方法三：手动部署（最简单）
```bash
# 1. 构建项目
npm run build:production

# 2. 手动上传文件
scp -r dist/* root@你的服务器IP:/www/wwwroot/vincentbuilds.fun/

# 3. 重启Nginx
ssh root@你的服务器IP "sudo systemctl reload nginx"
```

## 🔧 故障排除

### SSH连接测试
```bash
# 测试SSH连接
ssh -T root@你的服务器IP

# 如果连接失败，检查：
# 1. 服务器IP是否正确
# 2. 防火墙是否开放22端口
# 3. SSH服务是否运行
```

### 权限问题
```bash
# 检查服务器文件权限
ssh root@你的服务器IP "ls -la /www/wwwroot/vincentbuilds.fun/"

# 如果需要修改权限
ssh root@你的服务器IP "chown -R nginx:nginx /www/wwwroot/vincentbuilds.fun/"
ssh root@你的服务器IP "chmod -R 755 /www/wwwroot/vincentbuilds.fun/"
```

### Nginx配置检查
```bash
# 检查Nginx配置
ssh root@你的服务器IP "nginx -t"

# 查看Nginx错误日志
ssh root@你的服务器IP "tail -f /var/log/nginx/error.log"
```

## 📋 部署检查清单

- [ ] 获取服务器IP
- [ ] 确认SSH私钥可用
- [ ] 测试SSH连接
- [ ] 确认部署路径
- [ ] 检查Nginx配置
- [ ] 测试网站访问

## 💡 重要提醒

1. **SSH私钥安全**：不要将私钥提交到版本控制
2. **备份重要文件**：部署前备份服务器上的现有文件
3. **测试环境**：先在测试环境验证部署流程
4. **监控日志**：部署后检查Nginx和系统日志

## 🆘 获取帮助

如果遇到问题，可以：
1. 检查服务器系统日志
2. 查看Nginx错误日志
3. 测试SSH连接是否正常
4. 确认文件权限设置

---

**配置完成后，运行以下命令测试部署：**
```bash
source deploy-config.sh
npm run deploy:production
```