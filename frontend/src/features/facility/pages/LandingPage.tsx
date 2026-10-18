import { Link } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { facilityApi } from "../api/facility.api";
import hero from "../../../assets/images/hero_storage.jpg";
import photo from "../../../assets/images/facility_clean.jpg";
import { display, money, statusClass } from "../../../shared/lib/format";
export default function LandingPage() {
  const { data: units, error, busy, reload } = useRemote(facilityApi.units);
  return (
    <>
      <section className="hero">
        <div>
          <span className="eyebrow">KHÔNG GIAN CHO CUỘC SỐNG CỦA BẠN</span>
          <h1>
            Thêm không gian.
            <br />
            Thêm an tâm.
          </h1>
          <p>
            Kho lưu trữ cá nhân và doanh nghiệp. Chọn cơ sở, tìm không gian phù
            hợp và quản lý hợp đồng trực tuyến.
          </p>
          <div className="hero-actions">
            <Link className="button" to="/storage">
              Tìm kho phù hợp →
            </Link>
            <Link className="button secondary" to="/register">
              Tạo tài khoản
            </Link>
          </div>
          <div className="hero-notes">
            <span>✓ Hợp đồng minh bạch</span>
            <span>✓ Quản lý trực tuyến</span>
            <span>✓ Hỗ trợ tại cơ sở</span>
          </div>
        </div>
        <img src={hero} alt="Không gian kho lưu trữ sạch sẽ và ngăn nắp" />
      </section>
      <section className="section-heading">
        <div>
          <span className="eyebrow">KHÔNG GIAN LINH HOẠT</span>
          <h2>Khám phá kho lưu trữ</h2>
          <p>Giá và tình trạng được tải từ hệ thống.</p>
        </div>
        <Link to="/storage">Xem tất cả →</Link>
      </section>
      {error ? (
        <section className="card error" role="alert">
          {error} <button onClick={reload}>Thử lại</button>
        </section>
      ) : busy ? (
        <p>Đang tải danh mục…</p>
      ) : (
        <div className="unit-grid">
          {units?.slice(0, 6).map((u) => (
            <article className="card unit-card" key={String(u.code)}>
              <img src={photo} alt="Phòng kho lưu trữ" />
              <div>
                <span className={"badge " + statusClass(u.status)}>
                  {display(u.status)}
                </span>
                <h3>
                  Kho {display(u.type)} · {display(u.code)}
                </h3>
                <p>
                  {display(u.sizeDesc)} · {display(u.facilityCode)}
                </p>
                <strong>
                  {money(u.pricePerMonth)}
                  <small>/tháng</small>
                </strong>
                <Link
                  className="button"
                  to={
                    "/reservations/new?facility=" +
                    encodeURIComponent(String(u.facilityCode)) +
                    "&type=" +
                    encodeURIComponent(String(u.type))
                  }
                >
                  Chọn kho →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <section className="steps card">
        <h2>Thuê kho chỉ với vài bước</h2>
        <div>
          <article>
            <b>01</b>
            <h3>Tìm kho</h3>
            <p>Chọn cơ sở và loại kho.</p>
          </article>
          <article>
            <b>02</b>
            <h3>Đặt chỗ</h3>
            <p>Xác nhận báo giá và nộp cọc.</p>
          </article>
          <article>
            <b>03</b>
            <h3>Nhận bàn giao</h3>
            <p>Nhân viên hỗ trợ tại cơ sở.</p>
          </article>
          <article>
            <b>04</b>
            <h3>Quản lý trực tuyến</h3>
            <p>Theo dõi hợp đồng và yêu cầu.</p>
          </article>
        </div>
      </section>
    </>
  );
}
