// src/components/ui/__tests__/Input.test.jsx
import React, { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { Input } from "../components/ui/input";

describe("Input Component", () => {
  it("renders without crashing", () => {
    render(<Input />);
    const inputElement = screen.getByRole("textbox"); // default type="text"
    expect(inputElement).toBeInTheDocument();
  });

  it("accepts a type prop", () => {
    render(<Input type="password" />);
    const inputElement = screen.getByTestId("input-test");
    expect(inputElement).toHaveAttribute("type", "password");
  });



  it("accepts a custom className", () => {
    render(<Input className="custom-class" />);
    const inputElement = screen.getByRole("textbox");
    expect(inputElement).toHaveClass("custom-class");
  });

  it("forwards ref correctly", () => {
    const ref = createRef();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it("renders placeholder text", () => {
    render(<Input placeholder="Enter your name" />);
    const inputElement = screen.getByPlaceholderText("Enter your name");
    expect(inputElement).toBeInTheDocument();
  });
});
