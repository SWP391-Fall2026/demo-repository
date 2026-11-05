import { useRemote } from "../../../shared/api/use-remote";
import { identityApi } from "../api/identity.api";

const roleDefinitions = [
    {
        role: "ADMIN",
        name: "Quản trị viên hệ thống (System Admin)",
        badge: "Toàn quyền",
        scope: "Toàn bộ hệ thống",
        color: "#9333EA",
        bg: "#F3E8FF",
        icon: "👑",
        summary: "Toàn quyền quản trị hệ thống, quản lý tài khoản người dùng, ma trận RBAC và giám sát an ninh.",
        permissions: [
            "Tạo, sửa, khóa tài khoản nhân sự và phân bổ chi nhánh",
            "Cấp và đặt lại mật khẩu tạm thời",
            "Xem toàn bộ nhật ký kiểm toán (Audit Logs) và lịch sử đăng nhập",
            "Quản lý ma trận phân quyền RBAC và cấu hình phân hệ",
        ],
    },
    {
        role: "OPS_MGR",
        name: "Quản lý vận hành chuỗi (Operations Manager)",
        badge: "Cấp chuỗi",
        scope: "Toàn mạng lưới chuỗi",
        color: "#0066FF",
        bg: "#EFF6FF",
        icon: "📊",
        summary: "Toàn chuỗi; thiết lập chính sách giá, chính sách thuê, hạn mức chi nhánh và theo dõi báo cáo doanh thu.",
        permissions: [
            "Thiết lập biểu giá chuẩn và giá riêng từng chi nhánh",
            "Cấu hình chính sách thời hạn giữ phòng, ân hạn và hoàn tiền",
            "Xem báo cáo doanh thu, tỷ lệ lấp đầy toàn chuỗi",
            "Quản lý danh mục cơ sở chi nhánh",
        ],
    },
    {
        role: "FMANAGER",
        name: "Quản lý chi nhánh (Facility Manager)",
        badge: "Cơ sở",
        scope: "Cơ sở trực thuộc",
        color: "#16A34A",
        bg: "#DCFCE7",
        icon: "🏢",
        summary: "Quản lý vận hành cơ sở được gán, duyệt hoàn tiền, duyệt kho sẵn sàng và phân công công việc cho nhân viên.",
        permissions: [
            "Tạo và quản lý buồng kho tại chi nhánh trực thuộc",
            "Phê duyệt buồng kho sẵn sàng đưa vào kinh doanh",
            "Phê duyệt yêu cầu hoàn tiền cọc / tiền thuê",
            "Phân công nhiệm vụ check-in, nghiệm thu cho nhân viên ca trực",
            "Cấp mã PIN check-in cơ sở bảo mật",
        ],
    },
    {
        role: "STAFF",
        name: "Nhân viên trực cơ sở (Facility Staff)",
        badge: "Vận hành",
        scope: "Cơ sở trực thuộc",
        color: "#D97706",
        bg: "#FEF3C7",
        icon: "👷",
        summary: "Vận hành tác vụ đúng chi nhánh; kiểm tra khách đến, lập biên bản bàn giao, nghiệm thu trả kho và báo cáo sự cố.",
        permissions: [
            "Tiếp nhận và thực hiện task check-in bàn giao kho cho khách",
            "Kiểm tra hiện trạng buồng kho và lập biên bản nghiệm thu",
            "Xác nhận vệ sinh khoang lưu trữ",
            "Tải chứng từ thực hiện hoàn tiền theo lệnh duyệt của Manager",
            "Xử lý và cập nhật tiến độ sự cố buồng kho",
        ],
    },
    {
        role: "CUSTOMER",
        name: "Khách hàng thuê kho (Customer)",
        badge: "Cá nhân / DN",
        scope: "Chỉ dữ liệu cá nhân",
        color: "#475569",
        bg: "#F1F5F9",
        icon: "👤",
        summary: "Chỉ truy cập và quản lý dữ liệu cá nhân: hợp đồng thuê, hóa đơn thanh toán, mã PIN kho và phiếu hỗ trợ.",
        permissions: [
            "Tìm kiếm khoang lưu trữ và tạo đơn đặt chỗ trực tuyến",
            "Thanh toán hóa đơn tiền cọc và tiền thuê qua cổng thanh toán",
            "Tra cứu mã PIN điện tử mở khoang lưu trữ 24/7",
            "Yêu cầu trả kho, khiếu nại nghiệm thu hoặc gia hạn",
            "Gửi phiếu yêu cầu hỗ trợ kỹ thuật và an ninh",
        ],
    },
];

export default function RoleCatalogPage() {
    const { data, error, busy, reload } = useRemote(identityApi.roles);

    return (
        <main className="page-content" style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 20px" }}>
            <header
                className="page-heading"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                    flexWrap: "wrap",
                    gap: "16px",
                }}
            >
                <div>
                    <span className="eyebrow" style={{ color: "#0066FF", fontWeight: "700", fontSize: "12px" }}>
                        STORAGE / PHÂN HỆ QUẢN TRỊ
                    </span>
                    <h1 style={{ fontSize: "28px", fontWeight: "800", color: "#0B192C", margin: "6px 0 4px" }}>
                        Danh mục vai trò & Ma trận RBAC
                    </h1>
                    <p style={{ color: "#475569", margin: 0, fontSize: "14px", maxWidth: "700px" }}>
                        Quy định phạm vi truy cập dữ liệu và thẩm quyền nghiệp vụ cho từng nhóm vai trò trên hệ thống Kho Gọn.
                    </p>
                </div>
                <button
                    type="button"
                    className="btn-figma btn-outline btn-sm"
                    onClick={reload}
                    disabled={busy}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="23 4 23 10 17 10"></polyline>
                        <polyline points="1 20 1 14 7 14"></polyline>
                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                    </svg>
                    Làm mới
                </button>
            </header>

            {error && (
                <section className="card error" role="alert" style={{ marginBottom: "20px" }}>
                    {error}
                </section>
            )}

            {/* Scope Summary */}
            <div
                className="business-overview-scope"
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    padding: "12px 18px",
                    background: "#FFFFFF",
                    borderRadius: "12px",
                    border: "1px solid #E2E8F0",
                    marginBottom: "24px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600", color: "#334155" }}>
                    <span className="business-overview-scope-dot" aria-hidden="true" />
                    <span>MÔ HÌNH KIỂM SOÁT TRUY CẬP DỰA TRÊN VAI TRÒ (RBAC)</span>
                    <span style={{ color: "#CBD5E1" }}>·</span>
                    <span>5 Nhóm vai trò chuẩn hóa</span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12.5px",
                        color: "#166534",
                        background: "#DCFCE7",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontWeight: "700",
                    }}
                >
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16A34A" }} />
                    Chính sách bảo mật phân tầng kích hoạt
                </div>
            </div>

            {/* Role Cards List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {roleDefinitions.map((item) => {
                    const serverDesc = data && typeof data === "object" ? data[item.role] : null;
                    return (
                        <article
                            key={item.role}
                            className="card"
                            style={{
                                padding: "24px",
                                borderRadius: "14px",
                                border: "1px solid #E2E8F0",
                                display: "flex",
                                flexDirection: "column",
                                gap: "16px",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                    flexWrap: "wrap",
                                    gap: "12px",
                                }}
                            >
                                <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                                    <div
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            background: item.bg,
                                            display: "grid",
                                            placeItems: "center",
                                            fontSize: "24px",
                                            flexShrink: 0,
                                        }}
                                    >
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <h2 style={{ fontSize: "17px", fontWeight: "800", color: "#0B192C", margin: 0 }}>
                                                {item.name}
                                            </h2>
                                            <code
                                                style={{
                                                    fontSize: "12px",
                                                    fontWeight: "700",
                                                    color: item.color,
                                                    background: item.bg,
                                                    padding: "2px 8px",
                                                    borderRadius: "6px",
                                                }}
                                            >
                                                {item.role}
                                            </code>
                                        </div>
                                        <p style={{ fontSize: "13px", color: "#64748B", margin: "4px 0 0" }}>
                                            Phạm vi: <strong style={{ color: "#334155" }}>{item.scope}</strong>
                                        </p>
                                    </div>
                                </div>
                                <span
                                    className="badge"
                                    style={{
                                        background: item.bg,
                                        color: item.color,
                                        fontWeight: "700",
                                        padding: "4px 12px",
                                        borderRadius: "20px",
                                    }}
                                >
                                    {item.badge}
                                </span>
                            </div>

                            <p style={{ fontSize: "13.5px", color: "#334155", margin: 0, lineHeight: 1.5 }}>
                                {serverDesc || item.summary}
                            </p>

                            <div
                                style={{
                                    background: "#F8FAFC",
                                    padding: "16px 20px",
                                    borderRadius: "10px",
                                    border: "1px solid #E2E8F0",
                                }}
                            >
                                <strong style={{ fontSize: "12.5px", color: "#0B192C", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "8px" }}>
                                    Thẩm quyền nghiệp vụ chính:
                                </strong>
                                <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                                    {item.permissions.map((p, idx) => (
                                        <li key={idx}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </article>
                    );
                })}
            </div>
        </main>
    );
}
