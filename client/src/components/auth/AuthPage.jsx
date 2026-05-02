import { useEffect, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { FolderKanban } from "lucide-react";
import { Alert } from "../ui/alert.jsx";
import { Button } from "../ui/button.jsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card.jsx";
import { Input } from "../ui/input.jsx";
import { Label } from "../ui/label.jsx";
import { Tabs, TabsTrigger } from "../ui/tabs.jsx";

export function AuthPage({ error, googleLoginReady, onEmailAuth, onVerifyEmail, onGoogleAuth, onGoogleError, onForgotPassword, onResetPassword }) {
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get("verifyToken");
    const resetTokenParam = params.get("resetToken");

    if (verifyToken) {
      onVerifyEmail(verifyToken);
      window.history.replaceState({}, "", window.location.pathname);
    } else if (resetTokenParam) {
      setResetToken(resetTokenParam);
      setShowForgotPassword(true);
    }
  }, []);

  async function submitAuth(event) {
    event.preventDefault();
    setMessage("");
    const result = await onEmailAuth(authMode, authForm);

    if (result?.message) {
      setMessage(result.message);
      setAuthMode("login");
    }
  }

  async function submitForgotPassword(event) {
    event.preventDefault();
    setMessage("");
    const result = await onForgotPassword(forgotEmail);
    if (result?.message) {
      setMessage(result.message);
    }
  }

  async function submitResetPassword(event) {
    event.preventDefault();
    setMessage("");
    const result = await onResetPassword(resetToken, newPassword);
    if (result?.token) {
      setShowForgotPassword(false);
      setMessage("Password reset successfully. You are now logged in!");
    }
  }

  if (showForgotPassword && !resetToken) {
    return (
      <main className="auth-page">
        <Card className="auth-card">
          <CardHeader>
            <div className="brand-row">
              <div className="brand-mark">
                <FolderKanban size={22} />
              </div>
              <div>
                <CardTitle>Project Desk</CardTitle>
                <CardDescription>Reset your password</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="form-stack" onSubmit={submitForgotPassword}>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <Label>
                Email
                <Input type="email" value={forgotEmail} onChange={(event) => setForgotEmail(event.target.value)} required />
              </Label>

              {message && <Alert>{message}</Alert>}
              {error && <Alert variant="destructive">{error}</Alert>}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Button type="submit">Send reset link</Button>
                <Button type="button" variant="outline" onClick={() => setShowForgotPassword(false)}>
                  Back to login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (resetToken) {
    return (
      <main className="auth-page">
        <Card className="auth-card">
          <CardHeader>
            <div className="brand-row">
              <div className="brand-mark">
                <FolderKanban size={22} />
              </div>
              <div>
                <CardTitle>Project Desk</CardTitle>
                <CardDescription>Create your new password</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form className="form-stack" onSubmit={submitResetPassword}>
              <Label>
                New Password
                <Input type="password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
              </Label>

              {message && <Alert>{message}</Alert>}
              {error && <Alert variant="destructive">{error}</Alert>}

              <Button type="submit">Reset password</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <Card className="auth-card">
        <CardHeader>
          <div className="brand-row">
            <div className="brand-mark">
              <FolderKanban size={22} />
            </div>
            <div>
              <CardTitle>Project Desk</CardTitle>
              <CardDescription>Projects, roles, and task progress in one quiet workspace.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs>
            <TabsTrigger active={authMode === "login"} onClick={() => setAuthMode("login")}>
              Login
            </TabsTrigger>
            <TabsTrigger active={authMode === "signup"} onClick={() => setAuthMode("signup")}>
              Signup
            </TabsTrigger>
          </Tabs>

          <form className="form-stack" onSubmit={submitAuth}>
            {authMode === "signup" && (
              <Label>
                Name
                <Input value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} required />
              </Label>
            )}

            <Label>
              Email
              <Input type="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />
            </Label>

            <Label>
              Password
              <Input
                type="password"
                minLength={authMode === "signup" ? 8 : 1}
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                required
              />
            </Label>

            {message && <Alert>{message}</Alert>}
            {error && <Alert variant="destructive">{error}</Alert>}

            <Button type="submit">{authMode === "login" ? "Login" : "Create account"}</Button>

            {authMode === "login" && (
              <button type="button" className="text-link" onClick={() => setShowForgotPassword(true)} style={{ textAlign: "center", fontSize: "0.9rem" }}>
                Forgot your password?
              </button>
            )}
          </form>

        </CardContent>
      </Card>
    </main>
  );
}

