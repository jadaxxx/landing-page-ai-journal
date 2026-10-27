"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "signup" | "reset";
type Errors = { name?: string; email?: string; password?: string };

const copy = {
  signin: { title: "Welcome back", sub: "Sign in to continue your journal.", btn: "Sign in" },
  signup: { title: "Start your journal", sub: "Create a free account. It takes under a minute.", btn: "Create account" },
  reset: { title: "Reset your password", sub: "Enter your email and we’ll send a reset link.", btn: "Send reset link" },
} as const;

function score(v: string) {
  let s = 0;
  if (v.length >= 10) s++;
  if (/[a-z]/.test(v) && /[A-Z]/.test(v)) s++;
  if (/\d/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v) || v.length >= 16) s++;
  return s;
}
const COLORS = ["#d9594c", "#e0914a", "#c9b13f", "#4c9f6b"];
const HINTS = ["Too weak. Use 10+ characters.", "Add upper and lowercase letters.", "Add a number.", "Strong password."];

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [alert, setAlert] = useState<{ type: "err" | "ok"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const s = score(password);

  function switchMode(m: Mode) {
    setMode(m);
    setErrors({});
    setAlert(null);
  }

  function validate() {
    const e: Errors = {};
    if (mode === "signup" && !name.trim()) e.name = "Enter your name.";
    if (!email.trim()) e.email = "Enter your email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()))
      e.email = "Enter a valid email, like you@example.com.";
    if (mode !== "reset") {
      if (!password) e.password = "Enter your password.";
      else if (mode === "signup" && (password.length < 10 || s < 3))
        e.password = "Use at least 10 characters with upper and lowercase letters and a number.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    setAlert(null);
    if (!validate()) return;
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
          rememberMe: remember,
        });
        if (error) {
          setAlert({
            type: "err",
            text:
              error.status === 403
                ? "Confirm your email first. We sent you a link."
                : "Email or password is incorrect.",
          });
        } else {
          router.push("/journal");
          router.refresh();
        }
      } else if (mode === "signup") {
        const { error } = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: "/journal",
        });
        if (error) setAlert({ type: "err", text: error.message ?? "Couldn’t create your account. Try again." });
        else setAlert({ type: "ok", text: "Account created. Check your email to confirm your address." });
      } else {
        await authClient.requestPasswordReset({
          email: email.trim(),
          redirectTo: "/reset-password",
        });
        // same message whether or not the account exists
        setAlert({ type: "ok", text: `If an account exists for ${email.trim()}, a reset link is on its way.` });
      }
    } catch {
      setAlert({ type: "err", text: "Can’t reach JADEN. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  const c = copy[mode];

  return (
    <div className="wrap">
      <main className="left">
        <a className="logo" href="/"><i></i>JADEN</a>
        <h1>{c.title}</h1>
        <p className="sub">{c.sub}</p>

        <div className="form">
          {mode !== "reset" && (
            <div className="tabs" role="tablist">
              <button role="tab" aria-selected={mode === "signin"} onClick={() => switchMode("signin")}>Sign in</button>
              <button role="tab" aria-selected={mode === "signup"} onClick={() => switchMode("signup")}>Create account</button>
            </div>
          )}

          {alert && <div role="alert" className={`alert ${alert.type}`}>{alert.text}</div>}

          <form onSubmit={onSubmit} noValidate>
            {mode === "signup" && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" autoComplete="name" placeholder="What should we call you?"
                  value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
                <div className="msg">{errors.name}</div>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!errors.email} />
              <div className="msg">{errors.email}</div>
            </div>

            {mode !== "reset" && (
              <div className="field">
                <label htmlFor="pw">Password</label>
                <div className="inp">
                  <input id="pw" type={show ? "text" : "password"}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                    placeholder="At least 10 characters"
                    value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!errors.password} />
                  <button type="button" className="show" aria-pressed={show} onClick={() => setShow(!show)}>
                    {show ? "Hide" : "Show"}
                  </button>
                </div>
                {mode === "signup" && (
                  <>
                    <div className="meter" aria-hidden="true">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} style={{ background: i < s ? COLORS[Math.max(s - 1, 0)] : undefined }} />
                      ))}
                    </div>
                    <div className="hint">
                      {password ? HINTS[Math.max(s - 1, 0)] : "Use 10+ characters with letters, a number, and a symbol or a longer phrase."}
                    </div>
                  </>
                )}
                <div className="msg">{errors.password}</div>
              </div>
            )}

            {mode === "signin" && (
              <div className="row">
                <label>
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                  Keep me signed in
                </label>
                <button type="button" className="link" onClick={() => switchMode("reset")}>Forgot password?</button>
              </div>
            )}

            <button className="cta" type="submit" disabled={loading}>
              {loading ? "Please wait…" : c.btn}
            </button>
          </form>

          {mode === "reset" && (
            <button type="button" className="link" style={{ marginTop: 16, fontSize: 14 }} onClick={() => switchMode("signin")}>
              Back to sign in
            </button>
          )}

          <div className="trust">
            <div className="tr">
              <span className="chip b">✓ Always disclosed</span>
              <p>Every AI request is logged in your Processing Log, and never used to train models.</p>
            </div>
            <div className="tr">
              <span className="chip g">✓ Always exportable</span>
              <p>One-tap export of every entry and insight, any time.</p>
            </div>
          </div>
        </div>
      </main>

      <aside className="right" aria-hidden="true">
        <div className="float f1"><h3>A slower morning</h3><p>Woke up before the alarm and just sat with my coffee for a while, no phone, no rush.</p></div>
        <div className="float f2"><h3 style={{ fontSize: 15, fontFamily: "var(--sans)", fontWeight: 600 }}>Mood mix, this week</h3><p>Calm · Grateful</p></div>
        <div className="float f3"><span className="dot"></span><p style={{ color: "var(--ink)" }}>Deadline pressure keeps coming up on Mondays.</p></div>
      </aside>
    </div>
  );
}
