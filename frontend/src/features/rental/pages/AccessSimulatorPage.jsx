import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { rentalApi } from "../api/rental.api";
import {
  StaffFacts,
  StaffHeading,
  StaffIcon,
  StaffNotice,
  StaffSection,
  StaffShell,
  StaffStatus,
} from "../../../shared/ui/stitch/StaffUi";

export default function AccessSimulatorPage() {
  const [params] = useSearchParams();
  const [unitCode, setUnitCode] = useState(params.get("unit") || ""),
    [pin, setPin] = useState(""),
    [visible, setVisible] = useState(false),
    [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function verify(event) {
    event.preventDefault();
    if (pin.length !== 6 || !unitCode.trim()) return;
    setBusy(true);
    setError("");
    try {
      setResult(await rentalApi.verifyPin({ unitCode: unitCode.trim(), pin }));
      setPin("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  function retry() {
    setResult(null);
    setPin("");
    setError("");
  }
  if (result)
    return (
      <StaffShell
        className={`staff-access-result ${result.authorized ? "" : "staff-access-denied"}`}
      >
        <StaffHeading
          title={
            result.authorized
              ? "Ra/Vào kho thành công"
              : "Không thể truy cập cơ sở"
          }
          section="Truy cập kho / Kết quả mô phỏng"
          description="Kết quả kiểm tra quyền truy cập từ hệ thống phần mềm."
        />
        <StaffSection>
          <div className="staff-result">
            <span>
              <StaffIcon name={result.authorized ? "lock_open" : "lock"} />
            </span>
            <h2>
              {result.authorized
                ? "Truy cập kho thành công!"
                : "Không thể mở cửa cơ sở"}
            </h2>
            <p>
              {result.authorized
                ? "PIN và quyền truy cập hợp lệ. Đây là kết quả mô phỏng; hệ thống không điều khiển khóa vật lý."
                : "Mã PIN không chính xác hoặc quyền truy cập không còn hiệu lực. Kiểm tra hợp đồng và PIN trước khi thử lại."}
            </p>
            <StaffFacts
              items={[
                ["Khoang", unitCode],
                ["Chế độ kiểm tra", result.mode || "SOFTWARE_SIMULATION"],
                [
                  "Kết quả",
                  <StaffStatus
                    value={result.authorized ? "ACTIVE" : "ISSUE"}
                    label={
                      result.authorized ? "Truy cập hợp lệ" : "Từ chối truy cập"
                    }
                  />,
                ],
              ]}
            />
            <div className="staff-callout">
              <h3>
                <StaffIcon name="verified_user" />
                Hướng dẫn an toàn khi ra / vào kho
              </h3>
              <p>
                Không chia sẻ PIN. Nếu thông tin đúng nhưng vẫn bị từ chối, kiểm
                tra hồ sơ và liên hệ người quản lý cơ sở.
              </p>
            </div>
            <div className="staff-form-actions">
              <button type="button" onClick={retry}>
                <StaffIcon name="refresh" />
                {result.authorized
                  ? "Kiểm tra lượt tiếp theo"
                  : "Nhập lại mã PIN"}
              </button>
              <Link className="button secondary" to="/facility/tasks/my">
                Về bàn thao tác trực
              </Link>
            </div>
          </div>
        </StaffSection>
      </StaffShell>
    );
  return (
    <StaffShell className="staff-access-form">
      <StaffHeading
        title="Nhập mã PIN tại cửa kho"
        section="Truy cập kho"
        description="Kiểm tra quyền truy cập bằng PIN 6 chữ số trong mô phỏng phần mềm."
      />
      <StaffNotice error>{error}</StaffNotice>
      <StaffSection>
        <form className="staff-form staff-pin-form" onSubmit={verify}>
          <div className="staff-pin-icon">
            <StaffIcon name="dialpad" />
            <StaffIcon name="lock" />
          </div>
          <h2>Xác thực truy cập</h2>
          <p>Nhập mã kho và PIN của hợp đồng để kiểm tra quyền truy cập.</p>
          <label>
            Mã kho / Unit
            <input
              value={unitCode}
              onChange={(event) => setUnitCode(event.target.value)}
              placeholder="Nhập mã kho"
              autoComplete="off"
              required
            />
          </label>
          <label className="staff-pin-label" htmlFor="staff-pin">
            Mã PIN truy cập (6 chữ số)
          </label>
          <div className="staff-pin-input-wrap">
            <input
              id="staff-pin"
              className="staff-pin-real-input"
              aria-label="Mã PIN 6 chữ số"
              inputMode="numeric"
              maxLength={6}
              pattern="[0-9]{6}"
              type={visible ? "text" : "password"}
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, ""))
              }
              autoComplete="off"
              required
            />
            <div className="staff-pin-digits" aria-hidden="true">
              {Array.from({ length: 6 }, (_, index) => (
                <span
                  className={
                    index < pin.length
                      ? "filled"
                      : index === pin.length
                        ? "current"
                        : ""
                  }
                  key={index}
                >
                  {index < pin.length ? (visible ? pin[index] : "•") : ""}
                </span>
              ))}
            </div>
          </div>
          <div className="staff-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() =>
                  setPin((previous) => (previous + value).slice(0, 6))
                }
              >
                {value}
              </button>
            ))}
            <button
              type="button"
              aria-label="Xóa chữ số cuối"
              onClick={() => setPin((previous) => previous.slice(0, -1))}
            >
              <StaffIcon name="backspace" />
            </button>
            <button
              type="button"
              onClick={() => setPin((previous) => (previous + "0").slice(0, 6))}
            >
              0
            </button>
            <button
              type="button"
              aria-label={visible ? "Ẩn mã PIN" : "Hiện mã PIN"}
              onClick={() => setVisible((previous) => !previous)}
            >
              <StaffIcon name={visible ? "visibility_off" : "visibility"} />
            </button>
          </div>
          <div className="staff-callout">
            <p>
              <strong>Bảo mật mã PIN:</strong> Không chia sẻ mã cho người khác.
              Kết quả kiểm tra không kích hoạt khóa vật lý.
            </p>
          </div>
          <button disabled={busy || pin.length !== 6 || !unitCode.trim()}>
            <StaffIcon name="lock_open" />
            {busy ? "Đang kiểm tra…" : "Xác nhận truy cập"}
          </button>
          <Link className="button secondary" to="/facility/tasks/my">
            Hủy thao tác
          </Link>
        </form>
      </StaffSection>
    </StaffShell>
  );
}
