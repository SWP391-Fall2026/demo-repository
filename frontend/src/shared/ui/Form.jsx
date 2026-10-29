import { useContext, useState } from "react";
import { ReloadContext } from "./resource-context";
import { ActionResult } from "./ActionResult";
export function Form({ fields, submit, label = "Lưu thay đổi", onSuccess, }) {
    const reload = useContext(ReloadContext);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false), [error, setError] = useState(""), [done, setDone] = useState("");
    async function save(e) {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        const body = {};
        fields.forEach((f) => {
            const v = fd.get(f.name);
            body[f.name] =
                f.type === "number"
                    ? Number(v)
                    : f.type === "checkbox"
                        ? v === "on"
                        : v;
        });
        setBusy(true);
        setError("");
        setDone("");
        try {
            const response = await submit(body);
            setResult(response);
            reload();
            setDone("Đã ghi nhận thay đổi.");
            onSuccess?.(response);
        }
        catch (e) {
            setError(e.message);
        }
        finally {
            setBusy(false);
        }
    }
    return (<form className="form-grid" onSubmit={save}>
      {fields.map((f) => (<label key={f.name}>
          {f.label}
          {f.options ? (<select name={f.name} defaultValue={f.defaultValue} required={f.required}>
              {f.options.map((o) => (<option key={o}>{o}</option>))}
            </select>) : f.type === "textarea" ? (<textarea name={f.name} required={f.required} defaultValue={f.defaultValue}/>) : (<input name={f.name} type={f.type || "text"} required={f.required} defaultValue={f.defaultValue} min={f.type === "number" ? 0 : undefined} step={f.step ?? (f.type === "number" ? "any" : undefined)}/>)}
        </label>))}
      <div className="form-actions">
        {error && (<p role="alert" className="error">
            {error}
          </p>)}
        {done && (<p role="status" className="notice">
            {done}
          </p>)}
        {result != null && <ActionResult value={result}/>}
        <button disabled={busy}>{busy ? "Đang xử lý…" : label}</button>
      </div>
    </form>);
}
