import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { ImportView } from "@/components/dashboard/import-view";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Import" };

export default async function ImportPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = session.user.id;

  const importSessions = await prisma.importSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { transactions: true }
      }
    },
    take: 10,
  });

  return (
    <ImportView
      history={importSessions.map((s) => ({
        id: s.id,
        filename: s.filename,
        source: s.source,
        transactions: s._count.transactions,
        date: formatDateTime(s.createdAt, "Asia/Jakarta"),
      }))}
    />
  );
}
