import { BlogIndex } from "@/components/BlogIndex";
import { indexMetadata } from "@/lib/seo";

export const metadata = indexMetadata();
export default function BlogPage() { return <BlogIndex />; }
