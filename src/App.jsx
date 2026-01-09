import React, { useEffect, useMemo, useState } from "react";
import { HashRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { PROJECTS } from "./projects.js";

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
  const [contactSending, setContactSending] = useState(false);
  const [contactStatus, setContactStatus] = useState(null);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (contactSending) return;

    setContactSending(true);
    setContactStatus(null);

    try {
      const form = e.currentTarget;
      const fd = new FormData(form);

      // Honeypot: if bots fill it, silently ignore.
      const honey = (fd.get("_honey") || "").toString();
      if (honey) {
        form.reset();
        setContactStatus({ kind: "success", message: "Thanks! Your message has been sent." });
        return;
      }

      const payload = {
        name: (fd.get("name") || "").toString(),
        email: (fd.get("email") || "").toString(),
        message: (fd.get("message") || "").toString(),
        _subject: "New message from racal.ph",
        _template: "table",
      };

      const res = await fetch("https://formsubmit.co/ajax/contact@racal.ph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || "Request failed");
      }

      form.reset();
      setContactStatus({
        kind: "success",
        message:
          "Message sent! Thank you for getting in touch. I’ll get back to you as soon as possible.",
      });
    } catch (err) {
      setContactStatus({
        kind: "error",
        message: "Couldn’t send right now. Please try again or email me at contact@racal.ph.",
      });
    } finally {
      setContactSending(false);
    }
  };

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
              IT-ELAI FINALS
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
              <Chip>Python</Chip>
              <Chip>SQL</Chip>
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
              <Button as="a" href="https://resumate.ph" target="_blank" rel="noreferrer">
                ResuMate
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

          <form onSubmit={handleContactSubmit}>
            {/* Honeypot to reduce spam (should stay empty) */}
            <input className="hpField" type="text" name="_honey" tabIndex="-1" autoComplete="off" aria-hidden="true" />

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

            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <Button className="btn-primary" type="submit" disabled={contactSending}>
                {contactSending ? "Sending..." : "Submit"}
              </Button>
              <Button as="a" href="#/projects">
                See Projects
              </Button>

              <a className="muted-link" href="mailto:contact@racal.ph" style={{ marginLeft: "auto" }}>
                Or email: contact@racal.ph
              </a>
            </div>

            {contactStatus ? (
              <div className="formStatus" data-kind={contactStatus.kind} role="status" aria-live="polite">
                {contactStatus.message}
              </div>
            ) : null}
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
      { key: "AI", label: "AI" },
      { key: "dotnet", label: ".NET" },
      { key: "API", label: "API" },
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

function FloatingChatbot() {
  const FLOWISE_URL =
    // limit reached "https://cloud.flowiseai.com/api/v1/prediction/9f4a5ad9-7da6-4fc2-8c42-0c92382dfb35";
    "https://cloud.flowiseai.com/api/v1/prediction/c1d97f88-7cfd-4a38-af03-37ed04f00b94";

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! Ask me anything about Racal or the projects here." },
  ]);

  const listRef = React.useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [open, messages.length]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(FLOWISE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json().catch(() => ({}));

      const answer =
        data?.text ||
        data?.answer ||
        data?.result ||
        (typeof data === "string" ? data : null) ||
        "Sorry — I didn’t get a response. Try again.";

      setMessages((m) => [...m, { role: "bot", text: String(answer) }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Network error. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="chatbotFab"
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chatbot" : "Open chatbot"}
      >
        {open ? (
          <span style={{ fontSize: 18, lineHeight: 1 }}>×</span>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M7 8h10M7 12h6M12 21a9 9 0 1 0-8-5.1L3 21l5.1-1A9 9 0 0 0 12 21Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open ? (
        <div className="chatbotPanel" role="dialog" aria-label="Chatbot">
          <div className="chatbotHeader">
            <div>
              <div className="chatbotTitle">AI Chat</div>
            </div>
            <button className="chatbotClose" type="button" onClick={() => setOpen(false)} aria-label="Close">
              ×
            </button>
          </div>

          <div className="chatbotMessages" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbotMsg ${m.role === "user" ? "isUser" : "isBot"}`}>
                {m.text}
              </div>
            ))}
            {loading ? <div className="chatbotHint">Thinking…</div> : null}
          </div>

          <div className="chatbotInputRow">
            <textarea
              className="chatbotInput"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question…"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button className="chatbotSend" type="button" onClick={send} disabled={loading || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}


