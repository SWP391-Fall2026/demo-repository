import { useRemote } from "../../../shared/api/use-remote";
import { display } from "../../../shared/lib/format";
import { reportingApi } from "../api/reporting.api";

const numberFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });
const percentFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });

function count(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? numberFormat.format(parsed) : "—";
}

function percent(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? `${percentFormat.format(parsed)}%` : "—";
}

function SummaryCard({ label, value, note }) {
    return <article className="card business-overview-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {note && <small>{note}</small>}
    </article>;
}

export default function ChainDashboardPage() {
    const { data, error, busy, reload } = useRemote(reportingApi.chain);
    const branches = Array.isArray(data?.occupancyByBranch?.branches)
        ? data.occupancyByBranch.branches
        : [];
    const hasOverview = Number(data?.totalBranches) > 0 || branches.length > 0;

    return <main className="page-content business-overview">
      <header className="page-heading">
        <div>
          <span className="eyebrow">STORAGE / ĐIỀU HÀNH KINH DOANH</span>
          <h1>Business Overview</h1>
          <p>Tổng quan hoạt động kinh doanh và tình trạng phân bổ năng lực khoang lưu trữ chuỗi.</p>
        </div>
        <button className="secondary" type="button" onClick={reload}>Làm mới dữ liệu</button>
      </header>

      {error ? <section className="card empty error" role="alert">
        <h2>Không thể tải dữ liệu tổng quan</h2>
        <p>Không thể tải thông tin kinh doanh. Vui lòng thử lại.</p>
        <button type="button" onClick={reload}>Thử lại</button>
      </section> : busy ? <section className="card empty" aria-live="polite">Đang tải dữ liệu tổng quan…</section> : !hasOverview ? <section className="card empty">
        <span className="empty-icon">▤</span>
        <h2>Chưa có dữ liệu tổng quan</h2>
        <p>Hiện tại chưa có dữ liệu kinh doanh phù hợp để hiển thị.</p>
      </section> : <>
        <div className="business-overview-scope">
          <span className="business-overview-scope-dot" aria-hidden="true" />
          PHẠM VI TOÀN HỆ THỐNG
          <span>·</span>
          {count(data?.totalBranches)} cơ sở
        </div>

        <section className="metric-grid business-overview-metrics" aria-label="Chỉ số tổng quan mạng lưới">
          <SummaryCard label="Tổng số cơ sở" value={count(data?.totalBranches)} note="Trong phạm vi toàn hệ thống" />
          <SummaryCard label="Tổng số khoang lưu trữ" value={count(data?.totalUnits)} note="Toàn bộ kho vật lý" />
          <SummaryCard label="Khoang đang cho thuê" value={count(data?.occupiedUnits)} note={`Tỷ lệ lấp đầy ${percent(data?.occupancyRate)}`} />
          <SummaryCard label="Khoang trống sẵn sàng" value={count(data?.availableUnits)} note="Có thể tiếp nhận khách mới" />
        </section>

        <section className="card business-facility-overview">
          <header className="business-section-heading">
            <div><span className="eyebrow">MẠNG LƯỚI</span><h2>Tổng quan cơ sở</h2><p>Tình trạng khoang theo dữ liệu hiện có · chỉ xem</p></div>
            <span className="count">{count(branches.length)} cơ sở</span>
          </header>
          {!branches.length ? <div className="empty business-table-empty">
            <h3>Chưa có dữ liệu cơ sở</h3>
            <p>Thông tin cơ sở sẽ hiển thị khi có dữ liệu phù hợp.</p>
          </div> : <div className="table-scroll">
            <table className="business-facility-table">
              <thead><tr>
                <th>Mã cơ sở</th><th>Tên cơ sở</th><th>Tổng kho</th><th>Đang thuê</th><th>Còn trống</th><th>Đang giữ</th><th>Bảo trì</th><th>Tỷ lệ lấp đầy</th>
              </tr></thead>
              <tbody>{branches.map((branch) => <tr key={String(branch.facilityCode)}>
                <td><strong>{display(branch.facilityCode)}</strong></td>
                <td>{display(branch.facilityName)}</td>
                <td>{count(branch.totalUnits)}</td>
                <td>{count(branch.occupiedUnits)}</td>
                <td>{count(branch.vacantUnits)}</td>
                <td>{count(branch.reservedUnits)}</td>
                <td>{count(branch.maintenanceUnits)}</td>
                <td><span className="business-occupancy-value">{percent(branch.occupancyRate)}</span></td>
              </tr>)}</tbody>
              <tfoot><tr>
                <th scope="row">Toàn chuỗi</th>
                <td>{count(branches.length)} cơ sở</td>
                <td>{count(data?.totalUnits)}</td>
                <td>{count(data?.occupiedUnits)}</td>
                <td>{count(data?.availableUnits)}</td>
                <td>{count(data?.reservedUnits)}</td>
                <td>{count(data?.maintenanceUnits)}</td>
                <td>{percent(data?.occupancyRate)}</td>
              </tr></tfoot>
            </table>
          </div>}
        </section>
      </>}
    </main>;
}
