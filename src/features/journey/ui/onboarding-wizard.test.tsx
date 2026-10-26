import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingWizard } from "./onboarding-wizard";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }) }));
vi.mock("@/lib/auth-client", () => ({ authClient: { signOut: vi.fn() } }));

describe("onboarding wizard", () => {
  it("guides a user through focus, habits and a final review", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard name="Ana Moura" />);

    expect(screen.getByRole("heading", { name: "O que você quer cultivar?" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Estudos/ }));
    await user.type(screen.getByLabelText("Sua meta para esta jornada"), "Ler mais com calma");
    await user.click(screen.getByRole("button", { name: /Continuar/ }));

    expect(screen.getByRole("heading", { name: "Escolha seus primeiros hábitos." })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Revisar jornada/ }));

    expect(screen.getByRole("heading", { name: "Seu novo ritmo começa pequeno." })).toBeInTheDocument();
    expect(screen.getByText("Ler mais com calma")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Iniciar minha jornada" })).toBeInTheDocument();
  });
});
