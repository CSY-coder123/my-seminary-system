import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
  // 密码统一为 123456，使用 bcrypt 加密
  const password = await bcrypt.hash("123456", 10);

  // 1. 创建一个测试班级 (Cohort)
  const cohort = await prisma.cohort.create({
    data: {
      name: '2024 春季中文班',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-07-01'),
    },
  })

  // 2. 定义要创建的初始用户（6 种角色各一账号，密码均为 123456）
  const users = [
    { email: "admin@test.com", name: "系统管理员", role: "ADMIN" as const },
    { email: "faculty@test.com", name: "测试教师", role: "FACULTY" as const },
    { email: "student1@test.com", name: "学生甲", role: "STUDENT" as const, isMonitor: true },
    { email: "visa@test.com", name: "签证官", role: "VISA_OFFICER" as const },
    { email: "finance@test.com", name: "财务员", role: "FINANCE" as const },
    { email: "library@test.com", name: "图书管理员", role: "LIBRARIAN" as const },
  ];

  console.log("开始填充初始数据...");

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        password,
        role: u.role,
        isMonitor: u.isMonitor ?? false,
        cohortId: u.role === "STUDENT" ? cohort.id : null,
      },
    });
  }

  console.log("✅ 初始账号创建成功！6 种角色 (ADMIN, FACULTY, STUDENT, VISA_OFFICER, FINANCE, LIBRARIAN)，密码均为: 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });