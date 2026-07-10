"use client";

import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageProvider";

export function SiteBrand({ link = true }: { link?: boolean }) {
  const content = <><span className="mark">CI</span><b>COURT INSIDE</b></>;
  return (
    <div className="nav-brand-row">
      {link ? <Link className="wordmark" href="/">{content}</Link> : <div className="wordmark">{content}</div>}
      <LanguageSwitcher />
    </div>
  );
}
