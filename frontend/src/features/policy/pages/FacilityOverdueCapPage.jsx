import { useMemo, useState } from "react";
import { useRemote } from "../../../shared/api/use-remote";
import { display, formatDateTime } from "../../../shared/lib/format";
import { formatPolicyValue, policyLabel } from "../../../shared/lib/policy-format";
import { useSession } from "../../identity/session";
import { policyApi } from "../api/policy.api";

const LEGACY_DUPLICATE_KEYS = new Set(["basePrices", "durationDiscounts", "extraFees", "depositRule", "generalRules"]);

export default function FacilityOverdueCapPage() {
    const session = useSession();
    const facilityCode = session?.user?.facilityCode || "HN-CG";
    const { data, error: loadError, busy, reload } = useRemote(policyApi.get);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [search, setSearch] = useState("");
    const [percentageInput, setPercentageInput] = useState("");

    const policies = data && typeof data === "object" ? data : {};
    const capKey = `cap.${facilityCode}`;
    const currentCap = policies[capKey] ?? "50";
    const dailyOverdueFee = policies.overdueDailyFee ?? "50000";
    const graceDays = policies.gracePeriodDays ?? "0";

    const rows = useMemo(() => {
        const entries = Object.entries(policies)
            .filter(([key]) => !LEGACY_DUPLICATE_KEYS.has(key))
            .map(([key, raw]) => ({
                key,
                label: policyLabel(key),
                value: formatPolicyValue(key, raw),
            }));
        if (!policies[capKey]) {
            entries.unshift({
                key: capKey,
                label: policyLabel(capKey),
                value: formatPolicyValue(capKey, "50"),
            });
        }
        const q = search.trim().toLowerCase();
        const filtered = !q
            ? entries
            : entries.filter((item) => item.key.toLowerCase().includes(q) || item.label.toLowerCase().includes(q) || item.value.toLowerCase().includes(q));
        return filtered.sort((a, b) => {
            const rank = (k) => (k === capKey ? 0 : k === "overdueDailyFee" || k === "gracePeriodDays" ? 1 : 2);
            return rank(a.key) - rank(b.key) || a.label.localeCompare(b.label, "vi");
        });
    }, [policies, capKey, search]);

    async function handleSaveCap(event) {
        event.preventDefault();
        const value = percentageInput !== "" ? Number(percentageInput) : Number(currentCap);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            setSubmitError("Tỷ lệ trần phí quá hạn phải nằm trong khoảng 0% đến 100%.");
            return;
        }
        setSaving(true);
        setSubmitError("");
        setMessage("");
        try {
            await policyApi.cap({ percentage: value });
            setMessage(`Đã cập nhật trần phí quá hạn cơ sở ${facilityCode} thành ${value}% (lúc ${formatDateTime(new Date().toISOString())}).`);
            setPercentageInput("");
            reload();
        } catch (cause) {
            setSubmitError(cause instanceof Error ? cause.message : "Không lưu được tỷ lệ trần.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="page-content">
            <header className="page-heading">
                <div>
                    <span className="eyebrow">STORAGE / CHÍNH SÁCH CƠ SỞ</span>
                    <h1>Trần phí quá hạn tại cơ sở</h1>
                    <p>Mức trần áp dụng trên giá thuê tháng hiện hành tại thời điểm phát sinh phí quá hạn nhằm đảm bảo quyền lợi khách hàng.</p>
                </div>
                <button type="button" className="btn-figma btn-primary-dark btn-sm" onClick={reload} disabled={busy}>
                    {busy ? "Đang tải…" : "Làm mới"}
                </button>
            </header>

            {loadError && <section className="card error" role="alert">{loadError}</section>}

            <section className="summary-grid">
                <article className="card">
                    <span>Trần phí cơ sở ({display(facilityCode)})</span>
                    <strong style={{ color: "#0066FF" }}>{currentCap}% giá thuê tháng</strong>
                </article>
                <article className="card">
                    <span>Phí phạt quá hạn mỗi ngày</span>
                    <strong>{formatPolicyValue("overdueDailyFee", dailyOverdueFee)}</strong>
                </article>
                <article className="card">
                    <span>Số ngày ân hạn</span>
                    <strong>{formatPolicyValue("gracePeriodDays", graceDays)}</strong>
                </article>
            </section>

            <section className="card">
                <h2>Cập nhật tỷ lệ trần phí</h2>
                <form className="form-grid" onSubmit={handleSaveCap}>
                    <label>
                        Tỷ lệ trần phí quá hạn (%) so với giá thuê tháng (0 - 100%)
                        <input
                            name="percentage"
                            type="number"
                            min={0}
                            max={100}
                            step="1"
                            value={percentageInput !== "" ? percentageInput : String(currentCap)}
                            onChange={(e) => setPercentageInput(e.target.value)}
                            required
                        />
                    </label>
                    <div className="form-actions">
                        {submitError && <p role="alert" className="error alert-banner alert-danger">{submitError}</p>}
                        {message && <p role="status" className="notice alert-banner alert-success">{message}</p>}
                        <button type="submit" className="btn-figma btn-primary-dark" disabled={saving}>
                            {saving ? "Đang lưu…" : "Lưu tỷ lệ trần"}
                        </button>
                    </div>
                </form>
            </section>

            <section className="card">
                <div className="table-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
                    <div>
                        <h2 style={{ margin: 0 }}>Danh sách chính sách áp dụng <span className="count">{rows.length}</span></h2>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#64748B" }}>Các thông số đã được chuẩn hóa theo đơn vị VND, ngày, tháng và phần trăm.</p>
                    </div>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm theo tên chính sách…"
                        style={{ minWidth: "240px", padding: "8px 12px", borderRadius: "10px", border: "1px solid #CBD5E1", fontSize: "13.5px" }}
                    />
                </div>
                {busy && !data ? (
                    <p>Đang tải chính sách…</p>
                ) : !rows.length ? (
                    <p className="empty">Không có chính sách phù hợp.</p>
                ) : (
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Chính sách</th>
                                    <th>Mã tham số</th>
                                    <th>Giá trị áp dụng</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((item) => (
                                    <tr key={item.key}>
                                        <td><strong>{item.label}</strong></td>
                                        <td><code style={{ fontSize: "12px", color: "#475569" }}>{item.key}</code></td>
                                        <td><strong style={{ color: "#0B192C" }}>{item.value}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}
