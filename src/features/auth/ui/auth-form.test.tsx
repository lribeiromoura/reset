import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  requestPasswordReset: vi.fn(),
  sendVerificationEmail: vi.fn(),
  resetPassword: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: mocks.signUp },
    signIn: { email: mocks.signIn },
    requestPasswordReset: mocks.requestPasswordReset,
    sendVerificationEmail: mocks.sendVerificationEmail,
    resetPassword: mocks.resetPassword,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));

describe("authentication forms", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an account and gives a neutral email confirmation response", async () => {
    mocks.signUp.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthForm mode="signup" />);

    await user.type(screen.getByLabelText("Seu nome"), "Ana");
    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "senha-segura-com-12");
    await user.click(screen.getByRole("button", { name: "Criar minha conta" }));

    expect(mocks.signUp).toHaveBeenCalledWith({
      name: "Ana",
      email: "ana@example.com",
      password: "senha-segura-com-12",
      callbackURL: "/onboarding",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("enviamos um link de confirmação");
  });

  it("does not reveal whether a password reset email belongs to an account", async () => {
    mocks.requestPasswordReset.mockResolvedValue({ error: null });
    const user = userEvent.setup();
    render(<AuthForm mode="forgot" />);

    await user.type(screen.getByLabelText("E-mail"), "alguem@example.com");
    await user.click(screen.getByRole("button", { name: "Enviar instruções" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Se houver uma conta para esse e-mail");
  });

  it("offers email confirmation after a rejected unverified login", async () => {
    mocks.signIn.mockResolvedValue({ error: { status: 403, message: "Forbidden" } });
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "senha-segura-com-12");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Confirme seu e-mail para entrar");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
