import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders main home on default route", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: /메인 화면/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /로그인/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /과목 관리 과목을 추가하고 관리해보세요/i })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /기록/i })).not.toBeInTheDocument();
});
