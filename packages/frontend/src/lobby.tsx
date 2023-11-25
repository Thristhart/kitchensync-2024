import * as ReactDOM from "react-dom/client";

const root = ReactDOM.createRoot(document.getElementById("reactRoot")!);

function Lobby()
{
    return <span>hi world</span>;
}

root.render(<Lobby />);