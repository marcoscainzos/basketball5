"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

export type LocalProfile = {
  firstName: string;
  lastName: string;
  birthDate: string;
  email: string;
  password: string;
  city: string;
  country: string;
  createdAt: string;
};

type ProfileStats = {
  todaySolved: number;
  totalSolved: number;
  since: string;
};

const PROFILE_KEY = "court-inside-profile-v1";
const PROFILE_CREATED_KEY = "court-inside-profile-created";

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function safeJson<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

function emptyProfile(): LocalProfile {
  return { firstName: "", lastName: "", birthDate: "", email: "", password: "", city: "", country: "", createdAt: new Date().toISOString() };
}

function readProfile() {
  return safeJson<LocalProfile | null>(localStorage.getItem(PROFILE_KEY), null);
}

function profileName(profile: LocalProfile | null) {
  if (!profile) return "";
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ").trim();
}

function readStats(): ProfileStats {
  const today = getTodayKey();
  const profile = readProfile();
  const created = profile?.createdAt || localStorage.getItem(PROFILE_CREATED_KEY) || new Date().toISOString();
  localStorage.setItem(PROFILE_CREATED_KEY, created);

  let todaySolved = 0;
  let totalSolved = 0;

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index) || "";
    const value = localStorage.getItem(key);

    if (key.startsWith("court-inside-top5-") && !key.includes("surrendered")) {
      const guessed = safeJson<string[]>(value, []);
      totalSolved += guessed.length;
      if (key.includes(today)) todaySolved += guessed.length;
    }

    if (key.startsWith("court-inside-who-")) {
      const save = safeJson<{ status?: string }>(value, {});
      if (save.status === "won") {
        totalSolved += 1;
        if (key.includes(today)) todaySolved += 1;
      }
    }
  }

  return {
    todaySolved,
    totalSolved,
    since: new Date(created).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
  };
}

export function ProfileMenu() {
  const { lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"home" | "register" | "login" | "settings" | "score">("home");
  const [profile, setProfile] = useState<LocalProfile | null>(null);
  const [draft, setDraft] = useState<LocalProfile>(emptyProfile());
  const [loginDraft, setLoginDraft] = useState({ email: "", password: "" });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const copy = useMemo(() => lang === "es" ? {
    profile: "Perfil",
    register: "Registrarse",
    login: "Iniciar sesión",
    settings: "Configuración",
    score: "Puntuación",
    leagues: "Mis ligas",
    today: "Hoy",
    total: "Desde registro",
    since: "Registro",
    guest: "Invitado",
    save: "Guardar",
    logout: "Cerrar sesión",
    firstName: "Nombre",
    lastName: "Apellidos",
    birthDate: "Fecha de nacimiento",
    email: "Gmail",
    password: "Contraseña",
    repeatPassword: "Repetir contraseña",
    forgot: "¿Olvidaste contraseña?",
    city: "Localidad",
    country: "País",
    sync: "Cuenta local por ahora",
    registerHelp: "Completa tu perfil para ligas, ranking y configuración.",
    loginHelp: "Entra con tu Gmail para recuperar tu perfil local.",
  } : {
    profile: "Profile",
    register: "Register",
    login: "Sign in",
    settings: "Settings",
    score: "Score",
    leagues: "My leagues",
    today: "Today",
    total: "Since signup",
    since: "Joined",
    guest: "Guest",
    save: "Save",
    logout: "Sign out",
    firstName: "First name",
    lastName: "Last name",
    birthDate: "Date of birth",
    email: "Email",
    password: "Password",
    repeatPassword: "Repeat password",
    forgot: "Forgot password?",
    city: "City",
    country: "Country",
    sync: "Local account for now",
    registerHelp: "Complete your profile for leagues, rankings and settings.",
    loginHelp: "Use your email to restore your local profile.",
  }, [lang]);

  const refresh = () => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      client.auth.getUser().then(async ({ data }) => {
        if (!data.user) {
          setProfile(null);
          setDraft(emptyProfile());
          setStats(readStats());
          return;
        }
        const { data: profileRow } = await client
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();
        const nextProfile = profileRow ? {
          firstName: String(profileRow.first_name || ""),
          lastName: String(profileRow.last_name || ""),
          birthDate: String(profileRow.birth_date || ""),
          email: String(profileRow.email || data.user.email || ""),
          password: "",
          city: String(profileRow.city || ""),
          country: String(profileRow.country || ""),
          createdAt: String(profileRow.created_at || data.user.created_at || new Date().toISOString()),
        } : {
          ...emptyProfile(),
          email: data.user.email || "",
          createdAt: data.user.created_at || new Date().toISOString(),
        };
        localStorage.setItem(PROFILE_KEY, JSON.stringify(nextProfile));
        setProfile(nextProfile);
        setDraft(nextProfile);
        setStats(readStats());
        window.dispatchEvent(new Event("court-inside-profile-updated"));
      });
      return;
    }
    const nextProfile = readProfile();
    setProfile(nextProfile);
    setDraft(nextProfile || emptyProfile());
    setStats(readStats());
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!draft.email.trim().includes("@") || !draft.firstName.trim()) {
      setFormError(lang === "es" ? "Completa nombre y correo." : "Complete name and email.");
      return;
    }
    if (view === "register" && draft.password !== confirmPassword) {
      setFormError(lang === "es" ? "Las contraseñas no coinciden." : "Passwords do not match.");
      return;
    }
    if ((view === "register" || view === "settings") && draft.password.length < 4) {
      setFormError(lang === "es" ? "La contraseña debe tener al menos 4 caracteres." : "Password must be at least 4 characters.");
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      if (view === "register") {
        const { data, error } = await client.auth.signUp({
          email: draft.email.trim(),
          password: draft.password,
          options: {
            data: {
              first_name: draft.firstName.trim(),
              last_name: draft.lastName.trim(),
              birth_date: draft.birthDate || null,
              city: draft.city.trim(),
              country: draft.country.trim(),
            },
          },
        });
        if (error) {
          setFormError(error.message);
          return;
        }
        if (data.user && data.session) {
          const { error: profileError } = await client.from("profiles").upsert({
            id: data.user.id,
            email: draft.email.trim(),
            first_name: draft.firstName.trim(),
            last_name: draft.lastName.trim(),
            birth_date: draft.birthDate || null,
            city: draft.city.trim(),
            country: draft.country.trim(),
          });
          if (profileError) {
            setFormError(profileError.message);
            return;
          }
        }
      } else if (view === "settings") {
        const { data: userData } = await client.auth.getUser();
        if (!userData.user) {
          setFormError(lang === "es" ? "Inicia sesión para guardar cambios." : "Sign in to save changes.");
          return;
        }
        const { error } = await client.from("profiles").upsert({
          id: userData.user.id,
          email: draft.email.trim(),
          first_name: draft.firstName.trim(),
          last_name: draft.lastName.trim(),
          birth_date: draft.birthDate || null,
          city: draft.city.trim(),
          country: draft.country.trim(),
        });
        if (error) {
          setFormError(error.message);
          return;
        }
      }
      setOpen(false);
      setView("home");
      window.dispatchEvent(new Event("court-inside-profile-updated"));
      refresh();
      return;
    }
    const next = { ...draft, createdAt: draft.createdAt || new Date().toISOString() };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    localStorage.setItem(PROFILE_CREATED_KEY, next.createdAt);
    window.dispatchEvent(new Event("court-inside-profile-updated"));
    setProfile(next);
    setOpen(false);
    setView("home");
    refresh();
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      await client.auth.signOut();
    }
    localStorage.removeItem(PROFILE_KEY);
    window.dispatchEvent(new Event("court-inside-profile-updated"));
    setProfile(null);
    setDraft(emptyProfile());
    setView("home");
  };
  const login = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { error } = await client.auth.signInWithPassword({
        email: loginDraft.email.trim(),
        password: loginDraft.password,
      });
      if (error) {
        setFormError(error.message);
        return;
      }
      setView("home");
      setOpen(false);
      window.dispatchEvent(new Event("court-inside-profile-updated"));
      refresh();
      return;
    }
    const saved = readProfile();
    if (!saved || saved.email !== loginDraft.email.trim() || saved.password !== loginDraft.password) {
      setFormError(lang === "es" ? "Correo o contraseña incorrectos." : "Wrong email or password.");
      return;
    }
    setProfile(saved);
    setView("home");
    setOpen(false);
    refresh();
  };
  const forgotPassword = async () => {
    if (!loginDraft.email.trim().includes("@")) {
      setFormError(lang === "es" ? "Escribe tu correo primero." : "Enter your email first.");
      return;
    }
    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { error } = await client.auth.resetPasswordForEmail(loginDraft.email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/` : undefined,
      });
      setFormError(error ? error.message : (lang === "es" ? "Te hemos enviado un email de recuperación." : "Recovery email sent."));
      return;
    }
    setFormError(lang === "es" ? "Cuando conectemos backend podrás recuperarla por email." : "Password recovery will work when backend is connected.");
  };

  const name = profileName(profile);
  const formOpen = view === "register" || view === "login" || view === "settings";
  const openForm = (nextView: "register" | "login" | "settings") => {
    setFormError("");
    setConfirmPassword("");
    setLoginDraft({ email: profile?.email || "", password: "" });
    setDraft(nextView === "settings" ? profile || emptyProfile() : emptyProfile());
    setView(nextView);
    setOpen(false);
  };
  const closeForm = () => {
    setView("home");
    refresh();
  };

  return (
    <div className="profile-menu" ref={menuRef}>
      <button type="button" className="profile-trigger" onClick={() => { setOpen((value) => !value); setView("home"); }} aria-expanded={open} aria-label={copy.profile}>
        <span aria-hidden="true" />
      </button>
      {open ? (
        <aside className="profile-panel">
          <header>
            <div className="profile-avatar"><span /></div>
            <div>
              <b>{name || copy.profile}</b>
              <p>{profile?.email || copy.guest}</p>
            </div>
          </header>

          {view === "home" ? (
            <>
              {!profile ? (
                <div className="profile-auth-actions">
                  <button type="button" onClick={() => openForm("register")}>{copy.register}</button>
                  <button type="button" onClick={() => openForm("login")}>{copy.login}</button>
                </div>
              ) : null}
              <section className="profile-score">
                <span>{copy.score}</span>
                <div><b>{stats?.todaySolved ?? 0}</b><small>{copy.today}</small></div>
                <div><b>{stats?.totalSolved ?? 0}</b><small>{copy.total}</small></div>
              </section>
              <nav>
                <button type="button" onClick={() => setView("score")}>{copy.score}<span>→</span></button>
                <Link href="/leagues" onClick={() => setOpen(false)}>{copy.leagues}<span>→</span></Link>
                <button type="button" onClick={() => openForm(profile ? "settings" : "register")}>{copy.settings}<span>⚙</span></button>
                {profile ? <button type="button" onClick={logout}>{copy.logout}<span>×</span></button> : null}
              </nav>
            </>
          ) : null}

          {view === "score" ? (
            <section className="profile-detail">
              <button type="button" onClick={() => setView("home")}>← {copy.profile}</button>
              <h3>{copy.score}</h3>
              <div className="profile-score big">
                <div><b>{stats?.todaySolved ?? 0}</b><small>{copy.today}</small></div>
                <div><b>{stats?.totalSolved ?? 0}</b><small>{copy.total}</small></div>
              </div>
            </section>
          ) : null}

          <footer>
            <span>{copy.since}: {stats?.since}</span>
            <small>{copy.sync}</small>
          </footer>
        </aside>
      ) : null}
      {formOpen ? (
        <div className="profile-modal-backdrop" role="dialog" aria-modal="true" aria-label={view === "settings" ? copy.settings : view === "login" ? copy.login : copy.register}>
          <form className="profile-modal" onSubmit={view === "login" ? login : saveProfile}>
            <button className="profile-modal-close" type="button" onClick={closeForm}>×</button>
            <span>{copy.profile}</span>
            <h3>{view === "settings" ? copy.settings : view === "login" ? copy.login : copy.register}</h3>
            <p>{view === "login" ? copy.loginHelp : copy.registerHelp}</p>
            {view === "login" ? (
              <div className="profile-modal-grid login-grid">
                <label>{copy.email}<input type="email" value={loginDraft.email} onChange={(event) => setLoginDraft({ ...loginDraft, email: event.target.value })} placeholder="tu@gmail.com" /></label>
                <label>{copy.password}<input type="password" value={loginDraft.password} onChange={(event) => setLoginDraft({ ...loginDraft, password: event.target.value })} placeholder="••••••••" /></label>
                <button className="forgot-password" type="button" onClick={forgotPassword}>{copy.forgot}</button>
              </div>
            ) : (
              <div className="profile-modal-grid">
                <label>{copy.firstName}<input value={draft.firstName} onChange={(event) => setDraft({ ...draft, firstName: event.target.value })} placeholder="Marcos" /></label>
                <label>{copy.lastName}<input value={draft.lastName} onChange={(event) => setDraft({ ...draft, lastName: event.target.value })} placeholder="Cainzos" /></label>
                <label>{copy.birthDate}<input type="date" value={draft.birthDate} onChange={(event) => setDraft({ ...draft, birthDate: event.target.value })} /></label>
                <label>{copy.email}<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} placeholder="tu@gmail.com" /></label>
                <label>{copy.password}<input type="password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} placeholder="••••••••" /></label>
                {view === "register" ? <label>{copy.repeatPassword}<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="••••••••" /></label> : null}
              </div>
            )}
            {formError ? <strong className="profile-form-error">{formError}</strong> : null}
            <button type="submit">{view === "login" ? copy.login : copy.save}</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
