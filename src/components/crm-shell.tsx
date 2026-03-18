import Link from "next/link";
import { ReactNode } from "react";

import { getWorkspaceSession } from "@/lib/session";

const navigation = [
  { href: "/dashboard", label: "Dashboard", pill: "04" },
  { href: "/contacts", label: "Contacts", pill: "219" },
  { href: "/companies", label: "Companies", pill: "74" },
  { href: "/deals", label: "Deals", pill: "18" },
  { href: "/tasks", label: "Tasks", pill: "06" },
];

type CrmShellProps = {
  children: ReactNode;
  currentPath: string;
  title: string;
  copy: string;
};

export function CrmShell({ children, currentPath, title, copy }: CrmShellProps) {
  const session = getWorkspaceSession();

  return (
    <main className="app-shell">
      <aside className="side-panel">
        <div className="brand-block">
          <span className="eyebrow">Northstar CRM</span>
          <div>
            <p className="brand-title">Small team focus, sharp pipeline clarity.</p>
            <p className="brand-copy">
              Workspace-scoped shell with quick access to records, deals, and follow-up.
            </p>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {navigation.map((item) => {
            const active = currentPath === item.href || currentPath.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                className={`nav-item${active ? " active" : ""}`}
                href={item.href}
              >
                <span>{item.label}</span>
                <span className="nav-pill">{item.pill}</span>
              </Link>
            );
          })}
        </nav>

        <div className="workspace-card">
          <span className="eyebrow">Workspace guard</span>
          <strong>{session.workspaceName}</strong>
          <p className="meta-copy">
            Session placeholder for wave one. Middleware injects a workspace header and the
            shell resolves a scoped admin view for implementation.
          </p>
        </div>

        <div className="spotlight-card">
          <strong>Current build wave</strong>
          <p className="meta-copy">
            Foundation, schema, and shell pages are intentionally front-loaded so API, pipeline,
            and timeline tasks can land without refactoring the app frame.
          </p>
        </div>
      </aside>

      <section className="content-shell">
        <header className="topbar">
          <div>
            <span className="eyebrow">Authenticated workspace shell</span>
            <h1>{title}</h1>
            <p>{copy}</p>
          </div>

          <div className="row-stack">
            <label className="search-shell">
              <span className="subtle">⌘K</span>
              <input aria-label="Search CRM" placeholder="Search contacts, companies, deals" />
            </label>
            <div className="workspace-badge">
              <span>{session.userName}</span>
              <span>{session.role}</span>
            </div>
          </div>
        </header>

        {children}
      </section>
    </main>
  );
}
