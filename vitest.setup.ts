import "@testing-library/jest-dom/vitest";

// Tests that depend on the local calendar can set TZ explicitly per test.
process.env.TZ = "America/Sao_Paulo";
