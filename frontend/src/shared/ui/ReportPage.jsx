import { useRemote } from "../api/use-remote";
import { display, money } from "../lib/format";
export function ReportPage({ title, load, }) {
    const { data, error, busy, reload } = useRemote(load);
    return (<>
      <header className="page-heading">
        <div>
          <span className="eyebrow">STORAGE / BÁO CÁO</span>
          <h1>{title}</h1>
          <p>Tổng hợp theo phạm vi dữ liệu được cấp quyền.</p>
        </div>
        <button onClick={reload}>Cập nhật</button>
      </header>
      {error ? (<div role="alert" className="card error">
          {error}
        </div>) : busy ? (<div className="card empty">Đang tổng hợp…</div>) : (<div className="metric-grid">
          {Object.entries(data ?? {}).map(([key, value]) => (<article className="card metric" key={key}>
              <span>
                {{
                    totalBranches: "Chi nhánh",
                    totalUnits: "Tổng kho",
                    occupiedUnits: "Đang thuê",
                    availableUnits: "Sẵn sàng",
                    occupancyRate: "Tỷ lệ lấp đầy",
                    rentalReceipts: "Tổng tiền thuê đã thu",
                    depositReceipts: "Tổng tiền cọc đã thu",
                    completedRefunds: "Tổng tiền đã hoàn",
                }[key] || key}
              </span>
              <strong>
                {/revenue|funds|amount|receipts|refunds/i.test(key)
                    ? money(value)
                    : display(value)}
              </strong>
            </article>))}
        </div>)}
    </>);
}
