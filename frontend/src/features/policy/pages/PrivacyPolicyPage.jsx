import { Link } from "react-router-dom";
import { CustomerBreadcrumb, CustomerHeading, CustomerHelp, Icon } from "../../customer/components/StitchCustomer";
import "../../customer/components/customer.css";

const sections = [
  {
    eyebrow: "01 · DỮ LIỆU THU THẬP",
    title: "Thông tin cần thiết để cung cấp dịch vụ",
    items: [
      "Họ tên, số điện thoại, email và thông tin định danh khi tạo tài khoản hoặc nhận bàn giao.",
      "Thông tin cơ sở, kho thuê, lịch hẹn, hóa đơn và giao dịch phát sinh trong quá trình sử dụng.",
      "Nhật ký đăng nhập, truy cập và hỗ trợ để bảo vệ tài khoản, kho và hoạt động vận hành.",
    ],
  },
  {
    eyebrow: "02 · MỤC ĐÍCH SỬ DỤNG",
    title: "Xử lý đúng nhu cầu thuê kho",
    items: [
      "Xác thực tài khoản, tạo đơn, thanh toán, bàn giao, gia hạn và trả kho.",
      "Gửi thông báo về lịch hẹn, hóa đơn, trạng thái hợp đồng và yêu cầu hỗ trợ.",
      "Phát hiện gian lận, xử lý sự cố, kiểm toán và cải thiện chất lượng dịch vụ.",
    ],
  },
  {
    eyebrow: "03 · BẢO VỆ & CHIA SẺ",
    title: "Giới hạn quyền truy cập dữ liệu",
    items: [
      "Dữ liệu được phân quyền theo vai trò; nhân sự chỉ xem thông tin cần thiết cho nghiệp vụ được giao.",
      "Thông tin thanh toán được gửi qua kênh xử lý được cấu hình; hệ thống không lưu mã bảo mật thẻ.",
      "Chỉ chia sẻ cho đơn vị cung cấp dịch vụ cần thiết hoặc khi pháp luật yêu cầu, với biện pháp bảo vệ phù hợp.",
    ],
  },
  {
    eyebrow: "04 · QUYỀN CỦA BẠN",
    title: "Kiểm soát thông tin cá nhân",
    items: [
      "Bạn có thể xem và cập nhật thông tin tài khoản trong phạm vi hệ thống cho phép.",
      "Bạn có thể yêu cầu giải thích, chỉnh sửa hoặc xử lý dữ liệu qua Trung tâm hỗ trợ.",
      "Yêu cầu xóa dữ liệu có thể bị giới hạn khi cần lưu hồ sơ giao dịch, pháp lý hoặc đối soát.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return <main className="page-content stitch-customer sc-terms-page sc-privacy-page">
    <CustomerBreadcrumb items={[{ label: "Chính sách bảo mật" }]} />
    <CustomerHeading
      title="Chính sách bảo mật"
      description="Storage bảo vệ thông tin tài khoản và dữ liệu thuê kho bằng quyền truy cập theo vai trò, nhật ký vận hành và các biện pháp bảo mật phù hợp."
      icon="lock"
    />
    <div className="sc-terms-grid">
      {sections.map((section) => <section className="card sc-terms-card" key={section.eyebrow}>
        <span className="eyebrow">{section.eyebrow}</span>
        <h2>{section.title}</h2>
        <ol>{section.items.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>)}
    </div>
    <section className="card sc-terms-confirm">
      <Icon>support_agent</Icon>
      <div><h2>Cần hỗ trợ về dữ liệu?</h2><p>Gửi yêu cầu qua Trung tâm hỗ trợ để đội ngũ kiểm tra hồ sơ và hướng dẫn theo trường hợp cụ thể.</p></div>
      <Link className="button secondary" to="/support">Liên hệ hỗ trợ<Icon>arrow_forward</Icon></Link>
    </section>
    <CustomerHelp title="Bảo mật tài khoản của bạn" description="Không chia sẻ mật khẩu, mã OTP hoặc PIN truy cập kho cho người khác." />
  </main>;
}
