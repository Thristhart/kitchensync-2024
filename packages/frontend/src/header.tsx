import { UserInfo } from "./userinfo";
import "./header.css";

export function Header() {
  return (
    <header>
      <a href="/" className="logo">
        <img src="/logo.png" /> Kitchen Sync
      </a>
      <UserInfo />
    </header>
  );
}
