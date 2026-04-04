# 生成密钥，链接github

ssh-keygen -t ed25519 -C "dashboard"

## 配置github

cat ~/.ssh/id_ed25519.pub
到git中
打开：https://github.com/settings/ssh/new

Title：填写 "My Computer" 或任何你记得的名字

Key type：选择 Authentication Key

Key：粘贴你刚才复制的内容

点击 Add SSH key

## 测试

ssh -T git@github.com

## clone 仓库

git clone git@github.com:scott20050218/side-dashboard.git

# 配置远程登陆

ssh-keygen -t ed25519 -C "github-actions-side-dashboard" -f ./gha-deploy-ec2 -N ""

cd ~.ssh

cat gha-deploy-ec2.pub >> authorized_keys

## 测试

ssh -i gha-deploy-ec2 ubuntu@51.20.192.16

## 配置git

打开：https://github.com/scott20050218/side-dashboard → Settings → Secrets and variables → Actions → New repository secret

### SSH_PRIVATE_KEY

必填。给 CI 专用的一对密钥里的私钥全文gha-deploy-ec2（含 -----BEGIN ... PRIVATE KEY----- 到 END）。

# OIDC + actions-oidc-trigger（推荐，改动最小）

## 工作原理

GitHub Actions → 获取 OIDC Token → 发送到你的服务器 → 服务器验证 Token → 执行 rsync

## 服务器上部署 OIDC 触发器

# 安装并运行

npx actions-oidc-trigger --config '{
triggers: [{
route: "/deploy",
command: "rsync -avz --delete /tmp/dist/ /home/ubuntu/node/",
allowedRepositories: ["scott20050218/side-dashboard"],
allowedRefs: ["refs/heads/main"],
showCommandOutput: false
}]
}'
