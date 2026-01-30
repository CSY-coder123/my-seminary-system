import { auth } from "@/auth";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { returnBook } from "@/app/lib/actions/library";
import { LibraryPageClient } from "./LibraryPageClient";

export default async function LibraryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user?.role !== "LIBRARIAN") {
    redirect("/dashboard");
  }

  const [books, students] = await Promise.all([
    prisma.book.findMany({
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        isbn: true,
        author: true,
        isAvailable: true,
      },
    }),
    prisma.user.findMany({
      where: { role: "STUDENT" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const bookList = books.map((b) => ({
    id: b.id,
    title: b.title,
    isbn: b.isbn,
    author: b.author,
    isAvailable: b.isAvailable,
  }));

  const studentList = students.map((s) => ({
    id: s.id,
    name: s.name,
    email: s.email,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        userName={session.user?.name ?? "图书管理员"}
        role="图书管理员"
      />
      <main className="p-8">
        <div className="bg-white rounded-xl shadow-sm border p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800">图书管理</h1>
            <LibraryPageClient books={bookList} students={studentList} />
          </div>

          <div className="rounded-md border overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    名称
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    ISBN
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    状态
                  </th>
                  <th className="h-10 px-4 text-left align-middle font-medium">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookList.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-4 text-center text-muted-foreground"
                    >
                      暂无书籍
                    </td>
                  </tr>
                ) : (
                  bookList.map((book) => (
                    <tr
                      key={book.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 font-medium">{book.title}</td>
                      <td className="p-4 text-muted-foreground">
                        {book.isbn ?? "—"}
                      </td>
                      <td className="p-4">
                        <span
                          className={
                            book.isAvailable
                              ? "font-medium text-green-600"
                              : "font-medium text-muted-foreground"
                          }
                        >
                          {book.isAvailable ? "可借" : "已借出"}
                        </span>
                      </td>
                      <td className="p-4">
                        {!book.isAvailable && (
                          <form action={returnBook.bind(null, book.id)}>
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                            >
                              归案
                            </Button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
