import * as ReactDOM from "react-dom/client";
import "./lobby.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Header } from "./header";

const root = ReactDOM.createRoot(document.getElementById("reactRoot")!);
const queryClient = new QueryClient();

function Lobby() {
  return (
    <QueryClientProvider client={queryClient}>
      <Header />
      <div></div>
    </QueryClientProvider>
  );
}

root.render(<Lobby />);
