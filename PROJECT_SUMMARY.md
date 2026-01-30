# Seminary Academic System — 校园全功能管理蓝图 (v4.0 Final)

> **摘要**：基于 Next.js 15 + Prisma 6 的全方位校园 ERP 系统。
> **目标**：零配置错误，角色权限清晰，包含教务、财务、图书、签证及资产管理。

---

## 一、 技术栈清单 (已锁定版本)

- **Core**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Prisma **6.2.1** (严禁使用 Prisma 7)
- **Auth**: NextAuth v5 (Credentials + JWT)
- **UI**: Tailwind CSS + Shadcn/UI
- **Date**: moment / date-fns (UTC 存储，本地显示)

---

## 二、 核心数据库模型 (Prisma Schema 规范)

### 1. 角色枚举 (Role)
必须严格区分以下 6 种角色：
- `ADMIN` (管理员)：拥有最高权限。
- `FACULTY` (教师)：**注意！** 严禁使用 TEACHER，统一叫 FACULTY。
- `STUDENT` (学生)：基础用户。
- `VISA_OFFICER` (签证官)：负责学生签证预警。
- `FINANCE` (财务)：负责学费与奖学金。
- `LIBRARIAN` (图书管理员)：负责书籍借还。

### 2. 关键模型定义
- **User**: 包含字段 `role` (枚举), `isMonitor` (Boolean, 班长标识)。
- **Cohort** (班级): 包含 `name`, `startDate`。
- **Course** (课程): 必须关联 `Cohort`。约束：`@@unique([cohortId, code])`。
- **Submission** (作业): 关联 `Student` 和 `Course`，存储 `fileUrl` (String)。
- **VisaRecord**: 关联 `User` (1对1)，包含 `passportNumber`, `expiryDate`。
- **FixedAsset**: 包含 `name`, `serialNumber`, `status` (枚举), `managerId`。
- **Book**: 包含 `isbn`, `title`, `author`, `isAvailable`。
- **BorrowRecord**: 关联 `User` 和 `Book`，包含 `borrowDate`, `returnDate`。

---

## 三、 路由结构与权限矩阵 (RBAC)

所有受保护页面位于 `app/(protected)/dashboard/...`

| 路径前缀 | 允许角色 | 核心功能 |
| :--- | :--- | :--- |
| `/dashboard/admin` | ADMIN | **用户管理** (分配 Cohort)、**资产管理** (Fixed Assets) |
| `/dashboard/faculty` | FACULTY | **我的课程** (上传课件/下载作业)、**成绩录入**、**考勤管理** |
| `/dashboard/student` | STUDENT | **我的课表**、**作业上传**、**班务值日** (仅限 isMonitor=true) |
| `/dashboard/visa` | VISA_OFFICER | **签证预警** (高亮显示 30 天内过期的记录) |
| `/dashboard/finance` | FINANCE | **学费记录**、**奖学金管理** |
| `/dashboard/library` | LIBRARIAN | **图书录入**、**借还登记** |

---

## 四、 关键技术规约 (Bug 防御)

1.  **Prisma 配置**：
    * 必须在 `schema.prisma` 中使用 `datasource db { url = env("DATABASE_URL") }`。
    * 不要创建 `prisma.config.ts`。

2.  **数据安全与缓存**：
    * **单例模式**：数据库连接必须通过 `@/lib/prisma` 导入，防止连接溢出。
    * **缓存刷新**：所有 Server Actions (增删改) 后必须调用 `revalidatePath()`。
    * **文件存储**：严禁将文件存入本地磁盘，数据库仅存 URL。

3.  **时间处理**：
    * 数据库存储 UTC 时间。
    * 前端显示时格式化为本地时间。

---

## 五、 Cursor 常用指令集

* **初始化 Schema**: "参考 @PROJECT_SUMMARY.md 编写 schema.prisma，确保包含 Visa, Asset, Library 模块。"
* **生成 Seed**: "编写 prisma/seed.ts，创建 6 种角色的初始账号，密码加密。"
* **编写 Action**: "为 VISA_OFFICER 编写一个查询过期签证的 Server Action。"