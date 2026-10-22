const steps = [
    ["01", "Chọn kho và tạo đơn", "Chọn cơ sở, loại kho, ngày bắt đầu thuê, số tháng và giờ hẹn check-in. Ngày bắt đầu không được trước ngày check-in."],
    ["02", "Thanh toán tiền cọc", "Hệ thống tạo hóa đơn DEPOSIT. Hoàn tất thanh toán VNPay trong 5 phút. Quá hạn, đơn và hóa đơn chờ sẽ tự hủy."],
    ["03", "Check-in và xác nhận hợp đồng", "Sau khi cọc thành công, khách nhận thẻ hẹn. Khi khách gửi yêu cầu check-in, hệ thống gán kho còn trống đúng cơ sở và loại kho đã yêu cầu; Manager phân công Staff. Staff đối chiếu giấy tờ/mã thẻ rồi xác nhận. Khách xem hợp đồng, đồng ý điều khoản và thanh toán hóa đơn RENT."],
    ["04", "Nhận PIN và bàn giao", "Sau khi hóa đơn RENT đã thanh toán, hệ thống cấp PIN và thẻ Check-in. Đưa mã cơ sở, mã kho và PIN cho Staff; Staff ghi nhận hiện trạng, hoàn tất bàn giao và kích hoạt hợp đồng."],
];
export default function CustomerRentalGuide({ active = 1 }) {
    return <section className="rental-guide" aria-labelledby="rental-guide-title">
    <div className="rental-guide-heading"><div><span className="eyebrow">HƯỚNG DẪN THUÊ KHO</span><h2 id="rental-guide-title">4 bước hoàn tất thuê kho</h2></div><span className="guide-progress">Bước {active}/4</span></div>
    <ol className="rental-guide-steps">
      {steps.map(([number, title, description], index) => <li className={index + 1 === active ? "active" : index + 1 < active ? "done" : ""} key={number}>
        <span className="guide-number">{number}</span><div><strong>{title}</strong><p>{description}</p></div>
      </li>)}
    </ol>
  </section>;
}
