import * as ReactDOM from "react-dom/client";
import { UserInfo } from "./userinfo";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const root = ReactDOM.createRoot(document.getElementById("reactRoot")!);
const queryClient = new QueryClient();

function Lobby() {
  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <UserInfo />
      </div>
    </QueryClientProvider>
  );
}

root.render(<Lobby />);
