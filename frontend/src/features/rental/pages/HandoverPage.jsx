import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useRemote } from "../../../shared/api/use-remote";
import { rentalApi } from "../api/rental.api";
import { workforceApi } from "../../workforce/api/workforce.api";
import { reservationApi } from "../../reservation/api/reservation.api";
import { useSession } from "../../identity/session";
import { display } from "../../../shared/lib/format";
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

export default function HandoverPage() {
  const { reservationId } = useParams();
  const session = useSession();
  const eligible = useRemote(rentalApi.eligibleHandovers),
    tasks = useRemote(workforceApi.list),
    reservations = useRemote(reservationApi.list);
  const [selectedId, setSelectedId] = useState(reservationId || ""),
    [credentials, setCredentials] = useState(null),
    [credentialsBusy, setCredentialsBusy] = useState(false);
  const [appointmentCardCode, setAppointmentCardCode] = useState(""),
    [identityConfirmed, setIdentityConfirmed] = useState(false),
    [cardConfirmed, setCardConfirmed] = useState(false);
  const [evidence, setEvidence] = useState(),
    [error, setError] = useState(""),
    [done, setDone] = useState(null),
    [busy, setBusy] = useState(false);
  const eligibleRows = Array.isArray(eligible.data) ? eligible.data : [];
  const task = (Array.isArray(tasks.data) ? tasks.data : []).find(
    (row) =>
      row.taskType === "CHECKIN" && String(row.reservationId) === selectedId,
  );
  const reservation = (
    Array.isArray(reservations.data) ? reservations.data : []
  ).find((row) => String(row.id) === selectedId);
  const ready = eligibleRows.find(
    (row) => String(row.reservationId) === selectedId,
  );
  const selected =
    selectedId && (ready || reservation || task)
      ? { ...reservation, ...task, ...credentials, ...ready }
      : null;
  useEffect(() => {
    setSelectedId(reservationId || "");
  }, [reservationId]);
  useEffect(() => {
    let active = true;
    setCredentials(null);
    setIdentityConfirmed(false);
    setCardConfirmed(false);
    setAppointmentCardCode("");
    if (!task || !["PENDING", "IN_PROGRESS"].includes(task.status)) return;
    setCredentialsBusy(true);
    workforceApi
      .credentials(task.id)
      .then((data) => {
        if (active) {
          setCredentials(data);
          setAppointmentCardCode(data.appointmentCardCode || "");
        }
      })
      .catch((cause) => {
        if (active) setError(cause.message);
      })
      .finally(() => {
        if (active) setCredentialsBusy(false);
      });
    return () => {
      active = false;
    };
  }, [task?.id, selectedId]);
  function reload() {
    eligible.reload();
    tasks.reload();
    reservations.reload();
  }
  async function verify(event) {
    event.preventDefault();
    if (!task || !identityConfirmed || !cardConfirmed) return;
    setBusy(true);
    setError("");
    try {
      await workforceApi.verifyCheckin(task.id, {
        appointmentCardCode,
        identityDocumentsConfirmed: identityConfirmed,
        appointmentCardConfirmed: cardConfirmed,
      });
      reload();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (!ready) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(
      [...data.entries()].filter(
        ([key]) =>
          !["evidence", "conditionChecked", "customerPresent"].includes(key),
      ),
    );
    payload.reservationId = selectedId;
    payload.unitCode = ready.unitCode;
    payload.handoverEligibleConfirmed =
      data.get("handoverEligibleConfirmed") === "on";
    setBusy(true);
    setError("");
    try {
      const result = await rentalApi.handover(payload, evidence);
      setDone(result);
      setEvidence(undefined);
      reload();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không lập được biên bản.",
      );
    } finally {
      setBusy(false);
    }
  }
  const knownIds = [
    ...new Set(
      [
        ...(Array.isArray(tasks.data) ? tasks.data : [])
          .filter((item) => item.taskType === "CHECKIN")
          .map((item) => item.reservationId),
        ...eligibleRows.map((item) => item.reservationId),
      ].filter(Boolean),
    ),
  ];
  return (
    <StaffShell className="staff-handover-detail">
      <StaffHeading
        title="Chi tiết đơn đặt & Check-in / Handover"
        section="Nghiệp vụ cơ sở / Đơn đặt phòng"
        description="Rà soát thông tin cơ sở, kiểm tra hồ sơ khách hàng tại quầy và lập biên bản bàn giao khoang thực tế."
        actions={
          <Link to="/facility/reservations/lookup" className="button secondary">
            <StaffIcon name="arrow_back" />
            Quay lại danh sách đơn
          </Link>
        }
      />
      <StaffNotice error>
        {error || tasks.error || reservations.error}
      </StaffNotice>
      {done ? (
        <StaffSection>
          <div className="staff-result">
            <span>
              <StaffIcon name="verified" />
            </span>
            <h2>Đã lập biên bản bàn giao</h2>
            <p>
              Biên bản đã được lưu. Chờ khách hàng xác nhận hiện trạng để hệ
              thống kích hoạt hợp đồng thuê.
            </p>
            <StaffFacts
              items={[
                ["Mã đơn đặt", selectedId],
                ["Mã hợp đồng", done.id || done.contractId],
                ["Khoang bàn giao", done.unitCode || ready?.unitCode],
                [
                  "Trạng thái",
                  <StaffStatus value={done.status || "HANDOVER_PENDING"} />,
                ],
              ]}
            />
            <Link className="button" to="/facility/tasks/my">
              <StaffIcon name="list_alt" />
              Về danh sách công việc
            </Link>
          </div>
        </StaffSection>
      ) : tasks.busy || reservations.busy ? (
        <StaffSection>
          <StaffState loading />
        </StaffSection>
      ) : (
        <>
          {!reservationId && (
            <StaffSection
              title="Chọn hồ sơ Check-in / Bàn giao"
              icon="folder_open"
            >
              <label>
                Đơn đặt được phân công
                <select
                  value={selectedId}
                  onChange={(event) => {
                    setSelectedId(event.target.value);
                    setError("");
                  }}
                >
                  <option value="">Chọn hồ sơ</option>
                  {knownIds.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </label>
            </StaffSection>
          )}
          {selected ? (
            <>
              <div className="staff-summary-strip">
                <span className="staff-code">
                  <StaffIcon name="tag" />
                  MÃ: {selectedId}
                </span>
                <StaffStatus value={reservation?.status || task?.status} />
                {selected.depositStatus && (
                  <StaffStatus
                    value={selected.depositStatus}
                    label={`Cọc: ${selected.depositStatus === "PAID" ? "Đã thanh toán" : selected.depositStatus}`}
                  />
                )}
                <span>
                  <StaffIcon name="event" />
                  {staffDate(selected.appointmentAt, true)}
                </span>
              </div>
              <div className="staff-split staff-detail-layout">
                <div className="staff-stack">
                  <StaffSection
                    title="Thông tin khách hàng & Đối chiếu hồ sơ"
                    icon="badge"
                    description="Hồ sơ định danh từ thông tin đặt chỗ của khách hàng"
                    meta={
                      task?.status === "IN_PROGRESS"
                        ? "Đã xác minh check-in"
                        : "Chờ đối chiếu tại quầy"
                    }
                  >
                    <StaffFacts
                      items={[
                        ["Họ và tên khách hàng", selected.customerName],
                        ["Mã khách hàng", reservation?.userId],
                        ["Số điện thoại liên lạc", selected.customerPhone],
                        ["Email", selected.customerEmail || selected.email],
                        ["Thẻ hẹn", selected.appointmentCardCode || selectedId],
                        ["Lịch hẹn", staffDate(selected.appointmentAt, true)],
                      ]}
                    />
                    {credentials?.documentChecklist?.length > 0 && (
                      <div className="staff-callout staff-checklist-notes">
                        <h3>
                          <StaffIcon name="how_to_reg" />
                          Hồ sơ cần đối chiếu
                        </h3>
                        <ul>
                          {credentials.documentChecklist.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </StaffSection>
                  <StaffSection
                    title="Thông tin khoang lưu trữ & Hợp đồng"
                    icon="door_front"
                    description="Khoang được chỉ định theo hồ sơ và công việc được phân công"
                  >
                    <div className="staff-unit-summary">
                      <div className="staff-unit-illustration">
                        <StaffIcon name="warehouse" />
                        <span>{display(selected.unitCode)}</span>
                      </div>
                      <StaffFacts
                        items={[
                          ["Mã khoang", selected.unitCode || "Chưa gán kho"],
                          [
                            "Cơ sở",
                            selected.facilityName || selected.facilityCode,
                          ],
                          ["Loại kho", selected.unitType],
                          [
                            "Thời hạn thuê",
                            selected.durationMonths
                              ? `${selected.durationMonths} tháng`
                              : "—",
                          ],
                          ["Ngày bắt đầu", staffDate(selected.startDate)],
                          ["Mã hợp đồng", selected.contractId],
                        ]}
                      />
                    </div>
                  </StaffSection>
                  <StaffSection
                    title="Tình trạng khoang & Điều kiện bàn giao"
                    icon="fact_check"
                  >
                    <div className="staff-readiness-list">
                      {[
                        [
                          "Đối chiếu giấy tờ và thẻ hẹn",
                          task?.status === "IN_PROGRESS" || Boolean(ready),
                        ],
                        [
                          "Thanh toán tiền cọc",
                          selected.depositStatus === "PAID" || Boolean(ready),
                        ],
                        ["Hợp đồng và tiền thuê đủ điều kiện", Boolean(ready)],
                      ].map(([label, complete]) => (
                        <div key={label}>
                          <StaffIcon
                            name={
                              complete
                                ? "check_circle"
                                : "radio_button_unchecked"
                            }
                          />
                          <span>{label}</span>
                          <StaffStatus
                            value={complete ? "COMPLETED" : "PENDING"}
                          />
                        </div>
                      ))}
                    </div>
                    {eligible.error && (
                      <StaffNotice error>{eligible.error}</StaffNotice>
                    )}
                    <div className="staff-callout">
                      <p>
                        Không giao mã truy cập chính thức trước khi khách xác
                        nhận biên bản. Mọi hư hỏng cần ghi rõ trong hiện trạng
                        bàn giao.
                      </p>
                    </div>
                  </StaffSection>
                </div>
                <aside className="staff-stack">
                  <StaffSection
                    title={
                      ready
                        ? "Xác nhận bàn giao khoang"
                        : "Xác minh khách Check-in"
                    }
                    icon="assignment_turned_in"
                    className="staff-action-panel"
                  >
                    {credentialsBusy || eligible.busy ? (
                      <StaffState loading />
                    ) : ready ? (
                      <form className="staff-form" onSubmit={submit}>
                        <label>
                          Khoang bàn giao
                          <input readOnly value={ready.unitCode || ""} />
                        </label>
                        <label>
                          Nhân viên tiếp nhận
                          <input
                            readOnly
                            value={
                              session?.user?.name ||
                              session?.user?.username ||
                              ""
                            }
                          />
                        </label>
                        <label>
                          Tình trạng kho
                          <select name="conditionStatus" defaultValue="CLEAN">
                            <option value="CLEAN">Sử dụng bình thường</option>
                            <option value="ISSUE">
                              Có vấn đề cần ghi nhận
                            </option>
                          </select>
                        </label>
                        <label>
                          Hiện trạng / hư hỏng
                          <textarea
                            name="unitConditionNotes"
                            required
                            maxLength={2000}
                            rows={4}
                            placeholder="Ghi nhận cửa, khóa, vách, sàn và hiện trạng kho..."
                          />
                        </label>
                        <label className="staff-file-input">
                          <StaffIcon name="add_a_photo" />
                          Ảnh hiện trạng
                          <input
                            name="evidence"
                            type="file"
                            accept="image/png,image/jpeg"
                            onChange={(event) =>
                              setEvidence(event.target.files?.[0])
                            }
                          />
                          <small>{evidence?.name || "PNG hoặc JPEG"}</small>
                        </label>
                        <label>
                          Ghi chú Staff (Tùy chọn)
                          <textarea
                            name="staffNotes"
                            maxLength={2000}
                            rows={3}
                          />
                        </label>
                        <label className="staff-check">
                          <input
                            name="handoverEligibleConfirmed"
                            type="checkbox"
                            required
                          />
                          Đã xác nhận khách đủ điều kiện nhận bàn giao và đã
                          kiểm tra kho thực tế.
                        </label>
                        <div className="staff-callout">
                          <p>
                            Sau khi lập biên bản, khách xác nhận trên tài khoản
                            trước khi hợp đồng được kích hoạt.
                          </p>
                        </div>
                        <button disabled={busy}>
                          <StaffIcon name="task_alt" />
                          {busy
                            ? "Đang lập biên bản…"
                            : "Lập biên bản bàn giao"}
                        </button>
                        <Link
                          className="button secondary"
                          to="/facility/tasks/my"
                        >
                          Hủy bỏ / Quay lại
                        </Link>
                      </form>
                    ) : task && task.status === "PENDING" && credentials ? (
                      <form className="staff-form" onSubmit={verify}>
                        <label>
                          Mã thẻ hẹn
                          <input
                            value={appointmentCardCode}
                            onChange={(event) =>
                              setAppointmentCardCode(event.target.value)
                            }
                            required
                          />
                        </label>
                        <label className="staff-check">
                          <input
                            type="checkbox"
                            checked={identityConfirmed}
                            onChange={(event) =>
                              setIdentityConfirmed(event.target.checked)
                            }
                          />
                          Đã đối chiếu giấy tờ bản gốc của khách hàng.
                        </label>
                        <label className="staff-check">
                          <input
                            type="checkbox"
                            checked={cardConfirmed}
                            onChange={(event) =>
                              setCardConfirmed(event.target.checked)
                            }
                          />
                          Thẻ hẹn trùng khớp khách hàng và công việc được phân
                          công.
                        </label>
                        <button
                          disabled={
                            busy ||
                            !identityConfirmed ||
                            !cardConfirmed ||
                            !appointmentCardCode.trim()
                          }
                        >
                          <StaffIcon name="verified_user" />
                          {busy ? "Đang xác minh…" : "Xác nhận Check-in"}
                        </button>
                        <Link
                          className="button secondary"
                          to="/facility/tasks/my"
                        >
                          Quay lại hàng đợi
                        </Link>
                      </form>
                    ) : (
                      <div className="staff-form">
                        <div className="staff-callout">
                          <h3>
                            <StaffIcon name="info" />
                            {task?.status === "IN_PROGRESS"
                              ? "Chờ hồ sơ đủ điều kiện"
                              : "Chưa có công việc bàn giao đang mở"}
                          </h3>
                          <p>
                            {task?.status === "IN_PROGRESS"
                              ? "Khách cần xác nhận hợp đồng và thanh toán tiền thuê. Làm mới sau khi khách hoàn tất."
                              : "Chỉ nhân viên được phân công mới có thể thực hiện Check-in / Handover cho đơn này."}
                          </p>
                        </div>
                        <button type="button" onClick={reload}>
                          <StaffIcon name="refresh" />
                          Kiểm tra lại điều kiện
                        </button>
                        <Link
                          className="button secondary"
                          to="/facility/tasks/my"
                        >
                          Về danh sách công việc
                        </Link>
                      </div>
                    )}
                  </StaffSection>
                  {credentials && (
                    <StaffSection
                      title="Mã truy cập tạm cho Check-in"
                      icon="pin"
                    >
                      <StaffFacts
                        items={[
                          ["PIN cơ sở", credentials.facilityPin],
                          ["PIN kho tạm", credentials.unitPin],
                          [
                            "Hết hạn PIN tạm",
                            staffDate(credentials.unitPinExpiresAt, true),
                          ],
                        ]}
                      />
                      <p className="staff-small-note">
                        Chỉ sử dụng để đối chiếu theo công việc được phân công.
                      </p>
                    </StaffSection>
                  )}
                </aside>
              </div>
            </>
          ) : (
            <StaffSection>
              <StaffState
                title={
                  selectedId
                    ? "Không tìm thấy hồ sơ được phân công"
                    : "Chọn hồ sơ để bắt đầu"
                }
                description="Thông tin khách hàng, cơ sở và khoang sẽ được nạp từ hệ thống."
                icon="folder_open"
                onRetry={reload}
              />
            </StaffSection>
          )}
        </>
      )}
    </StaffShell>
  );
}
