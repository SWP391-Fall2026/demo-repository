import { useState } from "react";
import { useRemote } from "../api/use-remote";
import { display, money, statusClass } from "../lib/format";
import { fieldLabel } from "../lib/field-labels";
import { ReloadContext } from "./resource-context";
export { Form } from "./Form";
export function ResourcePage({ title, description, load, columns, children, actions, childrenTitle = "Thao tác nghiệp vụ" }) {
    const { data, error, busy, reload } = useRemote(load);
    const [search, setSearch] = useState("");
    const rows = Array.isArray(data) ? data : data ? [data] : [];
    const cols = columns ??
        Object.keys(rows[0] ?? {})
            .filter((k) => ![
            "pinCode",
            "password",
            "cccd",
            "priceSnapshot",
            "idempotencyKey",
            "evidencePath",
        ].includes(k))
            .slice(0, 7)
            .map((k) => [k, fieldLabel(k)]);
    const filtered = rows.filter((r) => Object.values(r).some((v) => display(v).toLowerCase().includes(search.toLowerCase())));
    return (<>
      <header className="page-heading">
        <div>
          <span className="eyebrow">STORAGE / VẬN HÀNH</span>
          <h1>{title}</h1>
          <p>
            {description ||
            "Dữ liệu được tải từ hệ thống theo quyền truy cập của bạn."}
          </p>
        </div>
        <div className="action-row">
          {actions}
          <button className="secondary" onClick={reload}>
            Làm mới
          </button>
        </div>
      </header>
      {children && (<section className="card action-card">
          <h2>{childrenTitle}</h2>
          <ReloadContext.Provider value={reload}>
            {children}
          </ReloadContext.Provider>
        </section>)}
      <section className="card">
        <div className="table-toolbar">
          <h2>
            Danh sách <span className="count">{filtered.length}</span>
          </h2>
          <input aria-label="Tìm trong danh sách" placeholder="Tìm kiếm trong danh sách…" value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        {error ? (<div className="empty error" role="alert">
            {error}
            <button className="secondary" onClick={reload}>
              Thử lại
            </button>
          </div>) : busy ? (<div className="empty" aria-live="polite">
            Đang tải dữ liệu…
          </div>) : !filtered.length ? (<div className="empty">
            <span className="empty-icon">▤</span>
            <h3>Chưa có dữ liệu</h3>
            <p>Dữ liệu sẽ xuất hiện khi có giao dịch phù hợp.</p>
          </div>) : (<div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {cols.map(([key, label]) => (<th key={key}>{label}</th>))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (<tr key={String(r.id ?? r.code ?? i)}>
                    {cols.map(([key]) => (<td key={key}>
                        {/status/i.test(key) ? (<span className={"badge " + statusClass(r[key])}>
                            {display(r[key])}
                          </span>) : /amount|price|fee|deposit/i.test(key) ? (money(r[key])) : (display(r[key]))}
                      </td>))}
                  </tr>))}
              </tbody>
            </table>
          </div>)}
      </section>
    </>);
}
