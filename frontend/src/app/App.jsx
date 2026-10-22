import { BrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/AppShell";
import "../styles/globals.css";
export default function App() {
    return (<BrowserRouter>
      <AppShell />
    </BrowserRouter>);
}
