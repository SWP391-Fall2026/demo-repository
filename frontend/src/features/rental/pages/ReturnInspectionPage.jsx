import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { rentalApi } from "../api/rental.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { facilityApi } from "../../facility/api/facility.api";
import { useSession } from "../../identity/session";
import { useRemote } from "../../../shared/api/use-remote";
import { display, money } from "../../../shared/lib/format";
import {
  StaffFacts,
  StaffHeading,
  StaffIcon,
  StaffNotice,
  StaffSection,
  StaffShell,
  StaffState,
  StaffStatus,
  staffDate,
} from "../../../shared/ui/stitch/StaffUi";

export default function ReturnInspectionPage() {
  const { contractId } = useParams();
  const session = useSession();
  const remote = useRemote(workforceApi.list),
    contracts = useRemote(rentalApi.list),
    units = useRemote(facilityApi.managedUnits);
  const task = useMemo(
    () =>
      (Array.isArray(remote.data) ? remote.data : []).find(
        (row) =>
          row.taskType === "RETURN" && String(row.contractId) === contractId,
      ),
    [remote.data, contractId],
  );
  const contract = (Array.isArray(contracts.data) ? contracts.data : []).find(
    (row) => row.id === contractId,
  );
  const unit = (Array.isArray(units.data) ? units.data : []).find(
    (row) => row.code === task?.unitCode,
  );
  const [checks, setChecks] = useState({
    cleared: false,
    inspected: false,
    recorded: false,
    reset: false,
  });
  const [result, setResult] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const checked = Object.values(checks).filter(Boolean).length;
  async function submit(event) {
    event.preventDefault();
    if (!task || checked !== 4) return;
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(event.currentTarget));
    body.unitCode = task.unitCode;
    body.lockDamaged = body.lockDamaged === "on";
    try {
      setResult(await rentalApi.inspect(body));
      remote.reload();
      contracts.reload();
      units.reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <StaffShell className="staff-return-detail">
      <StaffHeading
        title="Chi tiết yêu cầu trả kho"
        section="Nghiệp vụ cơ sở / Trả kho & Nghiệm thu"
        description={`${session?.user?.facility || session?.user?.facilityCode || "Cơ sở được phân công"} • Tiếp nhận & Nghiệm thu kết thúc hợp đồng lưu trữ`}
        actions={
          <Link
            to="/facility/tasks/my?type=RETURN"
            className="button secondary"
          >
            <StaffIcon name="arrow_back" />
            Quay lại danh sách yêu cầu
          </Link>
        }
      />
      <StaffNotice error>{error || contracts.error || units.error}</StaffNotice>
      {result ? (
        <StaffSection>
          <div className="staff-result">
            <span>
              <StaffIcon name="task_alt" />
            </span>
            <h2>Hoàn tất trả kho thành công!</h2>
            <p>
              Biên bản nghiệm thu đã được lưu. Hợp đồng kết thúc, quyền truy cập
              PIN đã thu hồi; kho chuyển sang vệ sinh.
            </p>
            <StaffFacts
              items={[
                ["Mã biên bản", result.inspectionId],
                ["Hợp đồng", result.contractId],
                ["Khoang bàn giao", task?.unitCode],
                ["Hiện trạng kho", <StaffStatus value="CLEANING" />],
                ["Khấu trừ theo chính sách", money(result.deductions)],
                ["Tiền cọc có thể hoàn", money(result.refundableDeposit)],
              ]}
            />
            <div className="staff-callout">
              <p>
                Tiền cọc được xử lý qua luồng yêu cầu và duyệt hoàn tiền. Kết
                quả này chưa xác nhận chuyển tiền cho khách.
              </p>
            </div>
            <Link className="button" to="/facility/tasks/my?type=RETURN">
              <StaffIcon name="list_alt" />
              Về danh sách yêu cầu
            </Link>
          </div>
        </StaffSection>
      ) : remote.busy || contracts.busy ? (
        <StaffSection>
          <StaffState loading />
        </StaffSection>
      ) : remote.error ? (
        <StaffSection>
          <StaffState error={remote.error} onRetry={remote.reload} />
        </StaffSection>
      ) : !task || !["PENDING", "IN_PROGRESS"].includes(task.status) ? (
        <StaffSection>
          <StaffState
            title="Không có công việc nghiệm thu đang mở"
            description="Chỉ nhân viên được phân công mới được nghiệm thu hợp đồng này. Làm mới để kiểm tra công việc."
            onRetry={remote.reload}
            icon="event_busy"
          />
        </StaffSection>
      ) : (
        <>
          <div className="staff-summary-strip">
            <span className="staff-code">{task.id}</span>
            <StaffStatus value={task.status} />
            <span>
              <StaffIcon name="event" />
              Lịch hẹn: {staffDate(task.dueDate)} {task.deadline}
            </span>
            <span>
              <StaffIcon name="warehouse" />
              Khoang: <strong>{task.unitCode}</strong>
            </span>
          </div>
          <div className="staff-split staff-detail-layout">
            <div className="staff-stack">
              <StaffSection
                title="Thông tin yêu cầu trả kho từ Khách hàng"
                icon="person_pin"
              >
                <StaffFacts
                  items={[
                    [
                      "Họ và tên khách hàng",
                      contract?.customerName || task.customerName,
                    ],
                    ["Mã khách hàng", contract?.userId],
                    [
                      "Số điện thoại liên hệ",
                      contract?.customerPhone || task.customerPhone,
                    ],
                    [
                      "Thời điểm gửi yêu cầu",
                      staffDate(contract?.checkoutRequestedAt, true),
                    ],
                    [
                      "Ngày trả kho mong muốn",
                      staffDate(
                        contract?.checkoutRequestedDate || task.dueDate,
                      ),
                    ],
                    ["Nội dung công việc", task.title],
                  ]}
                />
              </StaffSection>
              <StaffSection
                title="Thông tin khoang lưu trữ & Hợp đồng thuê"
                icon="domain"
                meta="Hồ sơ thuê gốc"
              >
                <div className="staff-unit-summary">
                  <div className="staff-unit-illustration">
                    <StaffIcon name="door_front" />
                    <span>{task.unitCode}</span>
                  </div>
                  <StaffFacts
                    items={[
                      ["Mã khoang", task.unitCode],
                      ["Cơ sở", task.facilityCode],
                      [
                        "Quy cách khoang",
                        unit ? `Kho ${unit.type} · ${unit.sizeSqm} m²` : "—",
                      ],
                      ["Kích thước", unit?.sizeDesc],
                      ["Hồ sơ thuê gốc", contractId],
                      ["Đơn đặt", contract?.reservationId],
                      [
                        "Ngày bắt đầu",
                        staffDate(contract?.startDate || contract?.startAt),
                      ],
                      [
                        "Ngày kết thúc",
                        staffDate(contract?.endDate || contract?.endAt),
                      ],
                      [
                        "Thời hạn thuê",
                        contract?.durationMonths
                          ? `${contract.durationMonths} tháng`
                          : "—",
                      ],
                      [
                        "Tiền cọc ghi nhận",
                        contract?.depositFee == null
                          ? "—"
                          : money(contract.depositFee),
                      ],
                    ]}
                  />
                </div>
              </StaffSection>
              <StaffSection
                title="Tình trạng khoang thực tế trước khi xác nhận"
                icon="checklist_rtl"
                meta={`Đã kiểm tra ${checked}/4 tiêu chí`}
              >
                <p className="staff-small-note">
                  Kiểm tra hiện trường tại chỗ theo danh mục quy chuẩn thu hồi
                  khoang:
                </p>
                <div className="staff-inspection-checks">
                  {[
                    [
                      "cleared",
                      "Khách đã di dời toàn bộ tài sản",
                      "Không còn tư trang, thùng carton hay kiện hàng lưu giữ bên trong.",
                    ],
                    [
                      "inspected",
                      "Đã kiểm tra cửa cuốn, khung vách và khóa",
                      "Ghi nhận đầy đủ tình trạng hư hỏng vào biên bản, kể cả khi không có hư hỏng.",
                    ],
                    [
                      "recorded",
                      "Đã kiểm tra mặt sàn và tình trạng vệ sinh",
                      "Đối chiếu thực tế, chọn đúng mức độ vệ sinh trong phần xử lý trả kho.",
                    ],
                    [
                      "reset",
                      "Đã thông báo việc thu hồi quyền truy cập PIN",
                      "PIN của khách sẽ bị thu hồi sau khi hoàn tất nghiệm thu.",
                    ],
                  ].map(([key, label, description]) => (
                    <label className={checks[key] ? "checked" : ""} key={key}>
                      <input
                        type="checkbox"
                        checked={checks[key]}
                        onChange={(event) =>
                          setChecks((previous) => ({
                            ...previous,
                            [key]: event.target.checked,
                          }))
                        }
                      />
                      <span>
                        <strong>{label}</strong>
                        <small>{description}</small>
                      </span>
                    </label>
                  ))}
                </div>
                <div className="staff-inspection-staff">
                  <StaffIcon name="verified_user" />
                  Nhân viên thực hiện nghiệm thu:{" "}
                  <strong>
                    {session?.user?.name || session?.user?.username}
                  </strong>
                </div>
              </StaffSection>
            </div>
            <aside className="staff-stack">
              <StaffSection
                title="Xử lý trả kho"
                icon="task_alt"
                description="Hoàn tất biên bản và cập nhật trạng thái khoang."
                className="staff-action-panel"
              >
                <form className="staff-form" onSubmit={submit}>
                  <label>
                    Khoang bàn giao
                    <input readOnly value={task.unitCode || ""} />
                  </label>
                  <label>
                    Ngày nghiệm thu
                    <input readOnly value={staffDate(new Date())} />
                  </label>
                  <label>
                    Nhân viên tiếp nhận
                    <input
                      readOnly
                      value={
                        session?.user?.name || session?.user?.username || ""
                      }
                    />
                  </label>
                  <label>
                    Tình trạng vệ sinh
                    <select name="cleanlinessStatus">
                      <option value="CLEAN">
                        Sạch, không cần vệ sinh bổ sung
                      </option>
                      <option value="NEEDS_CLEANING">
                        Cần vệ sinh bổ sung
                      </option>
                    </select>
                  </label>
                  <label className="staff-check">
                    <input type="checkbox" name="lockDamaged" />
                    Khóa bị hư hỏng, cần thay khóa
                  </label>
                  <label>
                    Hiện trạng / Ghi chú nghiệm thu
                    <textarea
                      name="damageNotes"
                      required
                      maxLength={255}
                      rows={4}
                      placeholder="Ghi rõ hiện trạng kiểm tra và hư hỏng (nếu có)..."
                    />
                  </label>
                  <div className="staff-callout staff-confirm-callout">
                    <h3>
                      <StaffIcon name="info" />
                      Xác nhận trả kho
                    </h3>
                    <p>
                      Hoàn tất hợp đồng <strong>{contractId}</strong>, thu hồi
                      mã PIN khách và chuyển kho{" "}
                      <strong>{task.unitCode}</strong> sang vệ sinh. Phí khấu
                      trừ được tính theo chính sách hiện hành.
                    </p>
                  </div>
                  <button disabled={busy || checked !== 4}>
                    <StaffIcon name="check_circle" />
                    {busy ? "Đang lưu biên bản…" : "Xác nhận trả kho"}
                  </button>
                  <Link
                    className="button secondary"
                    to="/facility/tasks/my?type=RETURN"
                  >
                    Quay lại / Hủy thao tác
                  </Link>
                  {checked !== 4 && (
                    <p className="staff-small-note">
                      Hoàn tất 4 tiêu chí kiểm tra trước khi xác nhận.
                    </p>
                  )}
                </form>
              </StaffSection>
              <div className="staff-callout">
                <h3>
                  <StaffIcon name="rule" />
                  Sau nghiệm thu
                </h3>
                <p>
                  Manager phân công vệ sinh và duyệt kho sẵn sàng. Kho chỉ được
                  cho thuê lại sau khi hoàn tất bước duyệt.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </StaffShell>
  );
}
