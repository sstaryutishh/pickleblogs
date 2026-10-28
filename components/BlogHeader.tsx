import Image from "next/image";
import { absoluteUrl } from "@/lib/site";

export function BlogHeader() {
  return (
    <header className="blog-header">
      <a className="brand" href={absoluteUrl("/")} aria-label="Pickle homepage">
        <Image src="/blog/assets/pickle-icon.png" alt="" width={48} height={48} priority />
        <span className="wordmark">Pickle</span>
      </a>
    </header>
  );
}
