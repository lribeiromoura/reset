import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "./auth-form";

const mocks = vi.hoisted(() => ({
  signUp: vi.fn(),
  signIn: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signUp: { email: mocks.signUp },
    signIn: { email: mocks.signIn },
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

  it("creates an account and opens onboarding immediately", async () => {
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
    expect(mocks.replace).toHaveBeenCalledWith("/onboarding");
  });

  it("shows an error when sign-in is rejected", async () => {
    mocks.signIn.mockResolvedValue({ error: { status: 401, message: "Invalid email or password" } });
    const user = userEvent.setup();
    render(<AuthForm mode="signin" />);

    await user.type(screen.getByLabelText("E-mail"), "ana@example.com");
    await user.type(screen.getByLabelText(/^Senha/), "senha-segura-com-12");
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid email or password");
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
