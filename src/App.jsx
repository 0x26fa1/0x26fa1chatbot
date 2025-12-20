import React, { useEffect, useMemo, useRef, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { PROJECTS } from "./projects.js";

const FLOWISE_ENDPOINT =
  "https://cloud.flowiseai.com/api/v1/prediction/9f4a5ad9-7da6-4fc2-8c42-0c92382dfb35";

async function queryFlowise(data, { signal } = {}) {
  const response = await fetch(FLOWISE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Flowise request failed (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
}

function extractAssistantText(payload) {
  const pick = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "boolean") return String(v);
    if (Array.isArray(v)) {
      for (let i = v.length - 1; i >= 0; i--) {
        const t = pick(v[i]);
        if (t) return t;
      }
      return "";
    }
    if (typeof v === "object") {
      for (const key of ["text", "answer", "result", "response", "message", "output", "data"]) {
        const t = pick(v[key]);
        if (t) return t;
      }
    }
    return "";
  };

  const text = pick(payload);
  return text || "Sorry — I couldn’t parse a reply from the chatbot.";
}

function FloatingChatbot() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() => [
    {
      id: "m0",
      role: "assistant",
      text: "Hi! I’m the site assistant — ask me anything.",
    },
  ]);

  const inputRef = useRef(null);
  const endRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus?.();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [open, messages, loading]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!open) return;
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const send = async () => {
    const question = draft.trim();
    if (!question || loading) return;

    setDraft("");
    setLoading(true);

    const id = (globalThis.crypto?.randomUUID?.() || String(Date.now())) + "-u";
    setMessages((prev) => [...prev, { id, role: "user", text: question }]);

    // cancel any previous in-flight request
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await queryFlowise({ question }, { signal: controller.signal });
      const replyText = extractAssistantText(result);
      const rid = (globalThis.crypto?.randomUUID?.() || String(Date.now())) + "-a";
      setMessages((prev) => [...prev, { id: rid, role: "assistant", text: replyText }]);
    } catch (err) {
      if (err?.name !== "AbortError") {
        const rid = (globalThis.crypto?.randomUUID?.() || String(Date.now())) + "-e";
        setMessages((prev) => [...prev, { id: rid, role: "assistant", text: "Sorry — the chatbot request failed. Try again." }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot" aria-live="polite">
      {open && (
        <div id="chatpanel" className="chatpanel" role="dialog" aria-label="Chatbot">
          <div className="chathead">
            <div className="chathead-title">
              <span className="chathead-dot" aria-hidden="true" />
              <span>AI Chat</span>
            </div>
            <button className="chathead-close" type="button" onClick={() => setOpen(false)} aria-label="Close chat">
              ✕
            </button>
          </div>

          <div className="chatscroll" role="log" aria-label="Messages">
            {messages.map((m) => (
              <div key={m.id} className={`chatrow ${m.role === "user" ? "is-user" : "is-assistant"}`}>
                <div className="chatbubble">{m.text}</div>
              </div>
            ))}
            {loading && (
              <div className="chatrow is-assistant">
                <div className="chatbubble chattyping">Thinking…</div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="chatcomposer">
            <div className="chatinputShell">
              <textarea
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message…"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
            </div>
            <button className="chatsend" type="button" onClick={send} disabled={loading || !draft.trim()}>
              Send
            </button>
          </div>
        </div>
      )}

      <button
        className="chatfab"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chatpanel"
      >
        {open ? "—" : "💬"}
      </button>
    </div>
  );
}

function useTheme() {
  const getInitial = () => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    return prefersDark ? "dark" : "light";
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}

function ScrollToContactOnRoute() {
  const location = useLocation();

  useEffect(() => {
    if (location.pathname !== "/contact") return;

    requestAnimationFrame(() => {
      const el = document.querySelector("[data-contact]");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [location.pathname]);

  return null;
}

function Button({ as = "button", className = "", ...props }) {
  const Comp = as;
  return <Comp className={`btn ${className}`.trim()} {...props} />;
}

function Card({ children, className = "" }) {
  return <div className={`card ${className}`.trim()}>{children}</div>;
}

function Chip({ children }) {
  return <span className="chip">{children}</span>;
}

function Navbar({ theme, toggleTheme }) {
  return (
    <header className="nav">
      <div className="container nav-inner">
        <a className="brand" href="#/">
          <span className="brand-badge" aria-hidden="true" />
          <span>Racal</span>
        </a>

        <nav className="nav-links" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>

          <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
            Projects
          </NavLink>

          <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
            Contact
          </NavLink>
        </nav>

        <div className="nav-actions">
          <Button type="button" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? "Light" : "Dark"}
          </Button>
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <main className="container">
      <section className="hero">
        <div className="hero-grid">
          <Card className="card-pad">
            <h1 className="h-title">Web Developer building practical web + backend systems.</h1>

            <div className="chips" aria-label="Highlights">
              <Chip>Next.js + TypeScript</Chip>
              <Chip>Node.js + Express</Chip>
              <Chip>ASP.NET MVC / .NET</Chip>
              <Chip>SQL</Chip>
              <Chip>Nginx + VPS</Chip>
            </div>

            <hr className="sep" />

            <div className="actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button as="a" className="btn-primary" href="#/projects">
                View Projects
              </Button>
              <Button as="a" href="#/contact">
                Contact
              </Button>
              <Button
                as="a"
                className="btn-ghost"
                href="https://github.com/0x26fa1"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </Button>
            </div>
          </Card>

          <Card className="card-pad">
            <h2 style={{ margin: "0 0 10px", fontSize: 16 }}>profile.json</h2>
            <div className="kbd" role="note" aria-label="Profile JSON">{`{
  "name": "Racal, Raffy",
  "occupation": "web developer",
  "likes": ["CTF"]
}`}</div>
            <p style={{ margin: "10px 0 0", color: "var(--muted)", fontSize: 13 }}>
              Full-stack projects with Node.js, Next.js/TypeScript, ASP.NET, and SQL — plus infra work on VPS + Nginx +
              Docker.
            </p>
          </Card>
        </div>
      </section>

      <section className="section" id="about">
        <Card className="card-pad">
          <h2>About</h2>
          <p>
            I build end-to-end apps: frontends, reliable APIs, and production deployment. I like projects that mix product work
            with real infrastructure (SSL, monitoring, processes, uptime).
          </p>
        </Card>
      </section>

      <section className="section">
        <div className="grid-2">
          <Card className="card-pad">
            <h2>Skills</h2>
            <div className="chips" style={{ marginTop: 10 }}>
              <Chip>HTML/CSS/JS</Chip>
              <Chip>TypeScript</Chip>
              <Chip>C# / .NET</Chip>
              <Chip>Python</Chip>
              <Chip>SQL</Chip>
              <Chip>Docker</Chip>
              <Chip>PM2</Chip>
              <Chip>Nginx</Chip>
              <Chip>Linux VPS</Chip>
            </div>
          </Card>

          <Card className="card-pad">
            <h2>Featured</h2>
            <p style={{ marginBottom: 12 }}>A few projects that show full-stack work, infra, and real deployment.</p>
            <div className="actions" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button as="a" className="btn-primary" href="#/projects">
                Open Projects Page
              </Button>
              <Button as="a" href="https://app.erosu.ph" target="_blank" rel="noreferrer">
                Discord App
              </Button>
              <Button as="a" href="https://bookhaven.digital/" target="_blank" rel="noreferrer">
                BookHaven
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <section className="section" id="contact" data-contact>
        <Card className="card-pad">
          <h2>Contact</h2>
          <p style={{ marginBottom: 12 }}>Want to work together or ask something? Send a message.</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Hook this form to your backend/Formspree.");
            }}
          >
            <div className="grid-2">
              <div className="field">
                <span className="label">Name</span>
                <div className="inputShell">
                  <input name="name" placeholder="Your name" required />
                </div>
              </div>

              <div className="field">
                <span className="label">Email</span>
                <div className="inputShell">
                  <input type="email" name="email" placeholder="you@email.com" required />
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: 12 }}>
              <span className="label">Message</span>
              <div className="inputShell" style={{ alignItems: "stretch" }}>
                <textarea name="message" placeholder="What’s up?" required />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Button className="btn-primary" type="submit">
                Submit
              </Button>
              <Button as="a" href="#/projects">
                See Projects
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <footer className="footer">© {new Date().getFullYear()} Racal</footer>
    </main>
  );
}

function Projects() {
  const filters = useMemo(
    () => [
      { key: "all", label: "All" },
      { key: "web", label: "Web Apps" },
      { key: "dotnet", label: ".NET" },
      { key: "node", label: "Node" },
      { key: "infra", label: "Infra" },
      { key: "security", label: "Security" },
    ],
    []
  );

  const [active, setActive] = useState("all");

  const visible = useMemo(() => {
    if (active === "all") return PROJECTS;
    return PROJECTS.filter((p) => p.tags.includes(active));
  }, [active]);

  return (
    <main className="container">
      <section className="hero">
        <Card className="card-pad">
          <h1 className="h-title" style={{ marginBottom: 6 }}>
            Projects
          </h1>
          <p className="sub" style={{ marginBottom: 12 }}>
            Button-first layout (no images): quick to scan, easy to click.
          </p>

          <div className="toolbar" role="toolbar" aria-label="Project filters">
            {filters.map((f) => (
              <button
                key={f.key}
                className="pill"
                type="button"
                aria-pressed={active === f.key}
                onClick={() => setActive(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </Card>
      </section>

      <section className="section">
        <div className="grid-2">
          {visible.map((p) => (
            <Card key={p.title} className="card-pad project">
              <h3>{p.title}</h3>
              <p className="desc">{p.description}</p>

              <div className="chips">
                {p.chips.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>

              <div className="actions">
                {p.links.map((l) => (
                  <Button
                    key={l.href}
                    as="a"
                    className={l.label === "Open Site" || l.label === "Web App" ? "btn-primary" : ""}
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {l.label}
                  </Button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <footer className="footer">
        <Button as="a" href="#/">
          ← Back home
        </Button>
        <span style={{ marginLeft: 10 }}>© {new Date().getFullYear()} Racal</span>
      </footer>
    </main>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onContextMenu = (e) => e.preventDefault();

    const onKeyDown = (e) => {
      if (e.key === "F12") return e.preventDefault();

      const key = (e.key || "").toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      if (ctrlOrCmd) {
        if (e.shiftKey && (key === "i" || key === "j" || key === "c")) return e.preventDefault();
        if (key === "u") return e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <HashRouter>
      <Navbar theme={theme} toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
      <ScrollToContactOnRoute />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Home />} />
      </Routes>
      <FloatingChatbot />
    </HashRouter>
  );
}
