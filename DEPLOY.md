# 部署指南：GitHub + Vercel

## 一、推送到 GitHub

### 1. 初始化 Git（若尚未初始化）

```bash
git init
git add .
git commit -m "Initial commit: seminary system v3"
```

### 2. 在 GitHub 创建仓库

- 打开 [GitHub](https://github.com/new)
- 仓库名例如：`seminary-v3`
- 不勾选 “Add a README”（本地已有代码）
- 创建后复制仓库 URL（如 `https://github.com/你的用户名/seminary-v3.git`）

### 3. 关联并推送

```bash
git remote add origin https://github.com/你的用户名/seminary-v3.git
git branch -M main
git push -u origin main
```

---

## 二、在 Vercel 部署

### 1. 导入项目

- 打开 [Vercel](https://vercel.com) 并登录
- 点击 **Add New… → Project**
- 选择 **Import Git Repository**，连接 GitHub 后选择 `seminary-v3`
- **Framework Preset** 保持 **Next.js**（自动识别）
- **Root Directory** 保持默认
- **Build Command** 已由 `package.json` 配置为：`prisma generate && next build`，一般无需修改

### 2. 配置环境变量

在 **Environment Variables** 中至少添加：

| 变量名 | 说明 | 示例 / 获取方式 |
|--------|------|------------------|
| `DATABASE_URL` | PostgreSQL 连接串（必填） | 使用 [Vercel Postgres](https://vercel.com/storage/postgres) 或自己的数据库，格式：`postgresql://user:pass@host:5432/db?sslmode=require` |
| `AUTH_SECRET` | Auth.js 密钥（必填） | 本地可运行 `npx auth secret` 生成，或使用随机 32 位字符串 |
| `AUTH_URL` | 站点根 URL（必填） | 部署后填 Vercel 分配的域名，如 `https://seminary-v3-xxx.vercel.app`（首次可先留空，部署后再改） |

可选（签证资料上传）：

| 变量名 | 说明 |
|--------|------|
| `BLOB_READ_WRITE_TOKEN` | 在 Vercel 项目 → **Storage** → 创建 **Blob** 后，Vercel 会自动注入；也可在 Environment Variables 里手动粘贴 |

### 3. 部署

- 点击 **Deploy**
- 等待构建完成；若失败，在 **Deployments** 里查看 **Build Logs**

### 4. 首次部署后

1. 在 Vercel 项目 **Settings → Environment Variables** 中，将 `AUTH_URL` 设为你的生产域名（例如 `https://你的项目.vercel.app`）。
2. 若使用 Prisma 迁移：数据库需先存在（Vercel Postgres 或自建），在**本地**对生产库执行一次迁移后再部署，或使用 Vercel 的 **Build** 里能访问到的 `DATABASE_URL` 在 CI 中执行 `prisma migrate deploy`（需自行在 **Build Command** 或脚本中加一步）。

---

## 三、数据库迁移（生产）

生产环境建议在部署前或通过 CI 执行迁移，而不是在 Vercel Build 里对生产库做 `migrate dev`。

**方式 A：本地对生产库执行一次**

```bash
# 将 .env 中的 DATABASE_URL 临时改为生产库连接串
npx prisma migrate deploy
```

**方式 B：在 Vercel 的 Build Command 中仅做 generate，迁移在别处跑**

保持 `package.json` 的 build 为：`prisma generate && next build`，迁移在本地或 CI 用上面的命令执行。

---

## 四、检查清单

- [ ] `.env` 未提交（已列入 `.gitignore`）
- [ ] GitHub 仓库已推送
- [ ] Vercel 已配置 `DATABASE_URL`、`AUTH_SECRET`、`AUTH_URL`
- [ ] 生产数据库已执行 `prisma migrate deploy`（若使用迁移）
- [ ] 需要签证上传时，已创建 Vercel Blob 并确保 `BLOB_READ_WRITE_TOKEN` 可用
