import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

describe("landing page", () => {
  it("apresenta a proposta e caminhos de navegação acessíveis", () => {
    render(<Home />);

    expect(screen.getByRole("heading", { name: /uma vida mais leve começa/i })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Navegação principal" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /encontre seu ritmo/i })).toHaveAttribute("href", "/cadastro");
  });
});
