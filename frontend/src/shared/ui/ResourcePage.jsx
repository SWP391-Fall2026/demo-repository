import { useEffect, useMemo, useRef, useState } from "react";
import { useRemote } from "../api/use-remote";
import { display, money, statusClass } from "../lib/format";
import { fieldLabel } from "../lib/field-labels";
import { ReloadContext } from "./resource-context";
import {
  OfficeDialog,
  OfficeIcon,
  OfficeMetrics,
  OfficeState,
  OfficeDetailPage,
  downloadRows,
} from "./office/OfficeUi";
export { Form } from "./Form";

const HIDDEN_FIELDS = [
  "pinCode",
  "password",
  "cccd",
  "priceSnapshot",
  "idempotencyKey",
  "evidencePath",
  "temporaryPin",
];
const moneyKey = (key) =>
  /amount|price|fee|deposit|revenue|rent|cost/i.test(key);
const statusKey = (key) => /status|state|readiness/i.test(key);
export function ResourcePage({
  title,
  description,
  load,
  columns,
  children,
  filters = [],
  details = true,
  exportName = "storage-export",
  metrics,
  actionLabel = "Thao tác mới",
  renderDetail,
  detailTitle,
  detailMode = "dialog",
  className = "",
  eyebrow = "STORAGE / VẬN HÀNH",
  searchPlaceholder = "Tìm kiếm trong danh sách…",
  tableTitle = "Danh sách",
  emptyTitle = "Chưa có dữ liệu",
  emptyDescription = "Dữ liệu sẽ xuất hiện khi có bản ghi phù hợp.",
  emptyIcon = "inventory_2",
  renderCell,
  footer,
  initialSelectedId,
}) {
  const remote = useRemote(load);
  const { data, error, busy, reload } = remote;
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState({});
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [actionOpen, setActionOpen] = useState(false);
  const opened = useRef("");
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const cols =
    columns ??
    Object.keys(rows[0] ?? {})
      .filter((key) => !HIDDEN_FIELDS.includes(key))
      .slice(0, 7)
      .map((key) => [key, fieldLabel(key)]);
  const autoStatus = cols.find(([key]) => statusKey(key))?.[0];
  const valuesFor = (key) => [
    ...new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean)),
  ];
  useEffect(() => {
    if (
      !initialSelectedId ||
      opened.current === initialSelectedId ||
      !Array.isArray(data)
    )
      return;
    const match = data.find(
      (row) => String(row.code || row.id) === String(initialSelectedId),
    );
    if (match) {
      opened.current = initialSelectedId;
      setSelected(match);
    }
  }, [data, initialSelectedId]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (!search ||
            Object.entries(row)
              .filter(([key]) => !HIDDEN_FIELDS.includes(key))
              .map(([, value]) => display(value))
              .join(" ")
              .toLowerCase()
              .includes(search.toLowerCase())) &&
          Object.entries(filterValues).every(
            ([key, value]) => !value || String(row[key] ?? "") === value,
          ),
      ),
    [rows, search, filterValues],
  );
  const pageSize = 10;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );
  const reset = () => {
    setSearch("");
    setFilterValues({});
    setPage(1);
  };
  const renderValue = (key, value, row, custom) => {
    if (custom) return custom(value, row);
    if (renderCell) {
      const content = renderCell(key, value, row);
      if (content !== undefined) return content;
    }
    if (statusKey(key))
      return (
        <span className={`badge ${statusClass(value)}`}>{display(value)}</span>
      );
    return moneyKey(key) && typeof value !== "string"
      ? money(value)
      : display(value);
  };
  const detail =
    selected &&
    (renderDetail ? (
      renderDetail(selected, () => {
        reload();
        setSelected(null);
      })
    ) : (
      <dl className="office-detail-grid">
        {Object.entries(selected)
          .filter(
            ([key, value]) =>
              !HIDDEN_FIELDS.includes(key) && typeof value !== "object",
          )
          .map(([key, value]) => (
            <div key={key}>
              <dt>{fieldLabel(key)}</dt>
              <dd>{renderValue(key, value, selected)}</dd>
            </div>
          ))}
      </dl>
    ));
  const detailHeading =
    selected &&
    (detailTitle
      ? detailTitle(selected)
      : `Chi tiết ${selected.code || selected.id || selected.username || "bản ghi"}`);
  if (selected && detailMode === "page")
    return (
      <OfficeDetailPage
        title={detailHeading}
        eyebrow={eyebrow}
        onBack={() => setSelected(null)}
      >
        {detail}
      </OfficeDetailPage>
    );
  return (
    <div className={`office-page office-resource ${className}`}>
      <header className="office-heading">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>
            {description ||
              "Quản lý và tra cứu dữ liệu trong phạm vi phụ trách."}
          </p>
        </div>
        <div className="office-actions">
          <button className="secondary" onClick={reload} disabled={busy}>
            <OfficeIcon>sync</OfficeIcon>Làm mới dữ liệu
          </button>
          {rows.length > 0 && (
            <button
              className="ghost"
              onClick={() => downloadRows(filtered, cols, exportName)}
            >
              <OfficeIcon>download</OfficeIcon>Xuất CSV
            </button>
          )}
          {children && (
            <button onClick={() => setActionOpen(true)}>
              <OfficeIcon>add</OfficeIcon>
              {actionLabel}
            </button>
          )}
        </div>
      </header>
      {!busy && !error && metrics && (
        <OfficeMetrics
          items={typeof metrics === "function" ? metrics(rows) : metrics}
        />
      )}
      <section className="office-filter" aria-label="Bộ lọc danh sách">
        <label className="office-search">
          <OfficeIcon>search</OfficeIcon>
          <input
            aria-label="Tìm trong danh sách"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") reset();
            }}
          />
        </label>
        {filters.map(({ key, label, options }) => (
          <label key={key}>
            {label}
            <select
              value={filterValues[key] || ""}
              onChange={(event) => {
                setFilterValues({ ...filterValues, [key]: event.target.value });
                setPage(1);
              }}
            >
              <option value="">Tất cả</option>
              {(options || valuesFor(key)).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
        {autoStatus &&
          !filters.some((filter) => filter.key === autoStatus) &&
          valuesFor(autoStatus).length > 1 && (
            <label>
              Trạng thái
              <select
                value={filterValues[autoStatus] || ""}
                onChange={(event) => {
                  setFilterValues({
                    ...filterValues,
                    [autoStatus]: event.target.value,
                  });
                  setPage(1);
                }}
              >
                <option value="">Tất cả</option>
                {valuesFor(autoStatus).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}
        <button className="secondary" type="button" onClick={reset}>
          <OfficeIcon>filter_alt_off</OfficeIcon>Đặt lại
        </button>
      </section>
      <section className="card office-table">
        <div className="office-table-header">
          <h2>
            {tableTitle}
            <span className="count">{filtered.length}</span>
          </h2>
          <small>
            {filtered.length
              ? `Hiển thị ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, filtered.length)} / ${filtered.length}`
              : "Không có bản ghi phù hợp"}
          </small>
        </div>
        {error ? (
          <OfficeState error={error} onRetry={reload} />
        ) : busy ? (
          <OfficeState busy />
        ) : !filtered.length ? (
          <OfficeState
            title={emptyTitle}
            icon={emptyIcon}
            onRetry={
              search || Object.values(filterValues).some(Boolean)
                ? reset
                : reload
            }
          >
            {search
              ? "Không tìm thấy kết quả phù hợp. Đặt lại bộ lọc để xem toàn bộ danh sách."
              : emptyDescription}
          </OfficeState>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {cols.map(([key, label]) => (
                    <th key={key}>{label}</th>
                  ))}
                  {details && <th>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {visible.map((row, index) => (
                  <tr key={String(row.id ?? row.code ?? row.username ?? index)}>
                    {cols.map(([key, , custom]) => (
                      <td key={key}>
                        {renderValue(key, row[key], row, custom)}
                      </td>
                    ))}
                    {details && (
                      <td>
                        <button
                          className="office-row-action"
                          onClick={() => setSelected(row)}
                        >
                          Xem chi tiết<OfficeIcon>arrow_forward</OfficeIcon>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!busy && !error && filtered.length > 0 && (
          <footer className="office-pagination">
            <span>
              Hiển thị {(safePage - 1) * pageSize + 1}–
              {Math.min(safePage * pageSize, filtered.length)} /{" "}
              {filtered.length} bản ghi
            </span>
            <div>
              <button
                className="secondary"
                aria-label="Trang trước"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <OfficeIcon>chevron_left</OfficeIcon>
              </button>
              <span className="office-page-number">{safePage}</span>
              <button
                className="secondary"
                aria-label="Trang sau"
                disabled={safePage >= pages}
                onClick={() => setPage(safePage + 1)}
              >
                <OfficeIcon>chevron_right</OfficeIcon>
              </button>
            </div>
          </footer>
        )}
      </section>
      {footer}
      {selected && (
        <OfficeDialog title={detailHeading} onClose={() => setSelected(null)}>
          {detail}
        </OfficeDialog>
      )}
      {children && actionOpen && (
        <OfficeDialog title={actionLabel} onClose={() => setActionOpen(false)}>
          <ReloadContext.Provider
            value={() => {
              setActionOpen(false);
              reload();
            }}
          >
            {children}
          </ReloadContext.Provider>
        </OfficeDialog>
      )}
    </div>
  );
}
