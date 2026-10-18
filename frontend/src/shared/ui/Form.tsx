import { useContext, useState, type FormEvent } from "react";
import type { Row } from "../types/api";
import { ReloadContext } from "./resource-context";
import { ActionResult } from "./ActionResult";
export interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  defaultValue?: string | number;
}
export function Form({
  fields,
  submit,
  label = "Lưu thay đổi",
  onSuccess,
}: {
  fields: Field[];
  submit: (data: Row) => Promise<unknown>;
  label?: string;
  onSuccess?: (result: unknown) => void;
}) {
  const reload = useContext(ReloadContext);
  const [result, setResult] = useState<unknown>(null);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [done, setDone] = useState("");
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const body: Row = {};
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
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form-grid" onSubmit={save}>
      {fields.map((f) => (
        <label key={f.name}>
          {f.label}
          {f.options ? (
            <select
              name={f.name}
              defaultValue={f.defaultValue}
              required={f.required}
            >
              {f.options.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.name}
              required={f.required}
              defaultValue={f.defaultValue}
            />
          ) : (
            <input
              name={f.name}
              type={f.type || "text"}
              required={f.required}
              defaultValue={f.defaultValue}
              min={f.type === "number" ? 0 : undefined}
            />
          )}
        </label>
      ))}
      <div className="form-actions">
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        {done && (
          <p role="status" className="notice">
            {done}
          </p>
        )}
        {result != null && <ActionResult value={result} />}
        <button disabled={busy}>{busy ? "Đang xử lý…" : label}</button>
      </div>
    </form>
  );
}
