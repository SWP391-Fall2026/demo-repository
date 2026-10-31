import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { money } from "../../../shared/lib/format";
import { policyApi } from "../api/policy.api";
import { CustomerBreadcrumb, CustomerHeading, CustomerHelp, Icon } from "../../customer/components/StitchCustomer";
import "../../customer/components/customer.css";

const valueOr = (policies, key, fallback) => policies?.[key] ?? fallback;

export default function RentalTermsPage() {
  const remote = useRemote(policyApi.get);
  const policies = remote.data && typeof remote.data === "object" ? remote.data : {};
  const depositMonths = valueOr(policies, "depositMonths", "1");
  const graceDays = valueOr(policies, "gracePeriodDays", "3");
  const overdueFee = valueOr(policies, "overdueDailyFee", "50000");

  return <main className="page-content stitch-customer sc-terms-page">
    <CustomerBreadcrumb items={[{ label: "Điều kiện thuê" }]} />
    <CustomerHeading
      title="Điều kiện thuê kho"
      description="Thông tin tóm tắt về quy trình đặt chỗ, thanh toán, nhận bàn giao và trả kho. Điều khoản áp dụng theo chính sách hiện hành của hệ thống."
      icon="description"
    />
    {remote.error && <div className="stitch-note" role="alert"><Icon>info</Icon><p>Không tải được chính sách động. Các điều kiện hiển thị theo mức mặc định của hệ thống.</p></div>}
    <div className="sc-terms-grid">
      <section className="card sc-terms-card">
        <span className="eyebrow">01 · ĐẶT CHỖ &amp; THANH TOÁN</span>
        <h2>Giữ chỗ và xác nhận đơn</h2>
        <ol>
          <li>Khách chọn cơ sở, loại kho, thời gian thuê và tạo đơn giữ chỗ.</li>
          <li>Đơn ở trạng thái chờ thanh toán trong thời gian giữ chỗ quy định.</li>
          <li>Tiền cọc được tính theo chính sách hiện hành; mức mặc định là {depositMonths} tháng tiền thuê.</li>
          <li>Đơn chỉ chuyển sang đã đặt sau khi backend xác nhận thanh toán thành công.</li>
        </ol>
      </section>
      <section className="card sc-terms-card">
        <span className="eyebrow">02 · NHẬN BÀN GIAO</span>
        <h2>Check-in tại cơ sở</h2>
        <ol>
          <li>Khách mang giấy tờ định danh và thẻ hẹn đến đúng lịch đã xác nhận.</li>
          <li>Staff đối chiếu thông tin, ghi nhận hiện trạng và hoàn tất biên bản bàn giao.</li>
          <li>Khách xác nhận điều khoản hợp đồng trước khi thanh toán kỳ thuê đầu tiên.</li>
          <li>PIN truy cập chỉ có hiệu lực sau khi hợp đồng và bàn giao hoàn tất.</li>
        </ol>
      </section>
      <section className="card sc-terms-card">
        <span className="eyebrow">03 · TRONG THỜI GIAN THUÊ</span>
        <h2>Sử dụng và gia hạn</h2>
        <ol>
          <li>Chỉ người được xác thực trong hợp đồng được sử dụng mã truy cập của kho.</li>
          <li>Gia hạn cần thực hiện trước khi gửi yêu cầu trả kho và phải thanh toán hóa đơn gia hạn.</li>
          <li>Phí quá hạn mặc định là {money(overdueFee)} mỗi ngày sau thời gian ân hạn {graceDays} ngày, theo chính sách cơ sở.</li>
          <li>Không tự ý chia sẻ PIN hoặc thay đổi khóa, thiết bị và kết cấu kho.</li>
        </ol>
      </section>
      <section className="card sc-terms-card">
        <span className="eyebrow">04 · TRẢ KHO &amp; HOÀN TIỀN</span>
        <h2>Kết thúc hợp đồng</h2>
        <ol>
          <li>Khách gửi yêu cầu trả kho trên cổng khách hàng; Manager tiếp nhận và phân công Staff kiểm tra.</li>
          <li>Staff nghiệm thu hiện trạng, tài sản và vệ sinh kho theo biên bản.</li>
          <li>Hợp đồng chỉ kết thúc sau khi quy trình nghiệm thu được xác nhận.</li>
          <li>Khoản hoàn tiền, nếu đủ điều kiện, được xử lý theo chính sách và trạng thái đối soát thực tế.</li>
        </ol>
      </section>
    </div>
    <section className="card sc-terms-confirm">
      <Icon>verified_user</Icon>
      <div><h2>Thông tin minh bạch theo hồ sơ của bạn</h2><p>Giá, hóa đơn, lịch hẹn và trạng thái xử lý luôn được lấy từ backend. Nếu cần xác nhận trường hợp cụ thể, hãy liên hệ bộ phận hỗ trợ trước khi thanh toán.</p></div>
      <Link className="button secondary" to="/support">Liên hệ hỗ trợ<Icon>arrow_forward</Icon></Link>
    </section>
    <CustomerHelp title="Cần giải thích điều kiện thuê?" description="Đội ngũ hỗ trợ có thể giải thích chính sách theo cơ sở và hồ sơ thuê của bạn." />
  </main>;
}
