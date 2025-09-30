# 🚀 发布流程 / Release Process

## 📋 自动化发布说明

本项目已配置 GitHub Actions 自动化构建和发布流程，每次推送版本标签时会自动：

1. ✅ 安装依赖并构建扩展
2. 📦 打包为 ZIP 文件
3. 🚀 创建 GitHub Release
4. 📄 生成变更日志

## 🔖 发布新版本

### 1. 更新版本号
```bash
# 修改 manifest.config.ts 中的版本号
# 修改 package.json 中的版本号
```

### 2. 提交更改
```bash
git add .
git commit -m "chore: bump version to v1.0.1"
git push
```

### 3. 创建并推送标签
```bash
# 创建版本标签
git tag v1.0.1

# 推送标签到 GitHub（这会触发自动构建）
git push origin v1.0.1
```

### 4. 等待自动构建
- 访问 GitHub Actions 页面查看构建进度
- 构建成功后会自动创建 Release
- Release 中包含可安装的 ZIP 文件

## 📦 手动构建

如需本地构建：

```bash
# 安装依赖
pnpm install

# 构建扩展
pnpm build

# 手动打包
cd dist && zip -r ../TabMaster-Pro.zip . && cd ..
```

## 🏷️ 版本命名规范

使用语义化版本控制：
- `v1.0.0` - 主要版本（重大更新）
- `v1.1.0` - 次要版本（新功能）
- `v1.0.1` - 补丁版本（bug修复）

## 📝 发布检查清单

发布前确认：
- [ ] 版本号已更新（manifest.config.ts + package.json）
- [ ] 功能测试通过
- [ ] 构建无错误 (`pnpm build`)
- [ ] 更新日志已记录
- [ ] 标签命名正确

## 🛠️ 故障排除

### 构建失败
- 检查 GitHub Actions 日志
- 确认 Node.js 版本兼容
- 验证依赖安装是否成功

### 标签问题
```bash
# 删除本地标签
git tag -d v1.0.1

# 删除远程标签
git push origin --delete v1.0.1

# 重新创建标签
git tag v1.0.1
git push origin v1.0.1
```

### 权限问题
- 确认仓库的 Actions 权限已启用
- 检查 GITHUB_TOKEN 权限设置

## 📊 发布历史

查看所有发布版本：
- [GitHub Releases](https://github.com/icatw/TabMaster-Pro/releases)
- [Actions 构建历史](https://github.com/icatw/TabMaster-Pro/actions)