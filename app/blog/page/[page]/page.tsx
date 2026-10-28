import { notFound, permanentRedirect } from "next/navigation";
import { BlogIndex } from "@/components/BlogIndex";
import { getPageCount } from "@/lib/articles";
import { indexMetadata } from "@/lib/seo";

type Props = { params: Promise<{ page: string }> };
export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: getPageCount() - 1 }, (_, index) => ({ page: String(index + 2) }));
}

function parsePage(value: string) {
  if (value === "1") permanentRedirect("/blog");
  if (!/^[1-9]\d*$/.test(value) || Number(value) > getPageCount()) notFound();
  return Number(value);
}

export async function generateMetadata({ params }: Props) {
  return indexMetadata(parsePage((await params).page));
}

export default async function ArchivePage({ params }: Props) {
  return <BlogIndex page={parsePage((await params).page)} />;
}
