import { BrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import "../styles/globals.css";
import "../styles/figma-theme.css";
import "../styles/interface-refresh.css";

export default function App() {
    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}
