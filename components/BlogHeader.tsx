import Image from "next/image";

export function BlogHeader() {
  return (
    <header className="blog-header">
      {/* Stay on this host: the local blog root, or Framer on the public domain. */}
      <a className="brand" href="/" aria-label="Pickle homepage">
        <Image src="/blog/assets/pickle-icon.png" alt="" width={48} height={48} priority />
        <span className="wordmark">Pickle</span>
      </a>
    </header>
  );
}
