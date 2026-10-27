"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import "../auth/auth.css";

export default function ResetPassword() {
  const token = useSearchParams().get("token");
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return setMsg("This reset link is invalid or has expired. Request a new one.");
    if (pw.length < 10) return setMsg("Use at least 10 characters.");
    const { error } = await authClient.resetPassword({ newPassword: pw, token });
    if (error) setMsg("This reset link is invalid or has expired. Request a new one.");
    else router.push("/auth");
  }

  return (
    <div className="wrap" style={{ gridTemplateColumns: "1fr", paddingRight: 0 }}>
      <main className="left">
        <h1>Choose a new password</h1>
        <form className="form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="pw">New password</label>
            <input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
            <div className="msg">{msg}</div>
          </div>
          <button className="cta" type="submit">Save password</button>
        </form>
      </main>
    </div>
  );
}
