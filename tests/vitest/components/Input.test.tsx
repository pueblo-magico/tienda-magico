import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  test("asocia etiqueta, ayuda y valor ingresado", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Input
        name="email"
        label="Correo electrónico"
        hint="Usá el correo de tu cuenta"
        onChange={onChange}
      />,
    );

    const input = screen.getByRole("textbox", {
      name: "Correo electrónico",
    });
    await user.type(input, "persona@example.com");

    expect(input.getAttribute("aria-describedby")).toBe("email-hint");
    expect(input).toHaveProperty("value", "persona@example.com");
    expect(onChange).toHaveBeenCalled();
  });

  test("expone un error accesible", () => {
    render(
      <Input
        name="email"
        label="Correo electrónico"
        error="Ingresá un correo válido"
      />,
    );

    const input = screen.getByRole("textbox", {
      name: "Correo electrónico",
    });
    const error = document.getElementById("email-error");

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe("email-error");
    expect(error?.textContent).toBe("Ingresá un correo válido");
  });
});
