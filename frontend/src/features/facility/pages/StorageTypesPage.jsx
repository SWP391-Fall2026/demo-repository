import { ResourcePage } from "../../../shared/ui/ResourcePage";
import { facilityApi } from "../api/facility.api";
import { money } from "../../../shared/lib/format";

async function loadStorageTypes() {
  const units = await facilityApi.managedUnits();
  const groups = new Map();
  for (const unit of Array.isArray(units) ? units : []) {
    const type = String(unit.type || "Chưa phân loại");
    if (!groups.has(type)) groups.set(type, []);
    groups.get(type).push(unit);
  }
  return [...groups.entries()].map(([type, members]) => {
    const sizes = members
      .map((unit) => Number(unit.sizeSqm))
      .filter(Number.isFinite);
    const rates = members
      .map((unit) => Number(unit.pricePerMonth))
      .filter(Number.isFinite);
    const available = members.filter(
      (unit) => String(unit.status).toUpperCase() === "AVAILABLE",
    ).length;
    return {
      code: type,
      name:
        {
          S: "Kho Mini S",
          M: "Kho Medium M",
          L: "Kho Large L",
          CLIMATE: "Kho kiểm soát nhiệt độ",
        }[type] || type,
      sizeRange: sizes.length
        ? `${Math.min(...sizes)}–${Math.max(...sizes)} m²`
        : "—",
      rateRange: rates.length
        ? `${money(Math.min(...rates))}–${money(Math.max(...rates))}`
        : "—",
      unitCount: members.length,
      availableCount: available,
      occupancy: `${members.length ? Math.round((members.filter((unit) => String(unit.status).toUpperCase() === "OCCUPIED").length / members.length) * 100) : 0}%`,
      facilities: [
        ...new Set(members.map((unit) => unit.facilityCode).filter(Boolean)),
      ].join(", "),
    };
  });
}

export default function StorageTypesPage() {
  return (
    <ResourcePage
      className="office-storage-types"
      title="Quản lý loại kho"
      description="Thông số và phân bổ loại kho tổng hợp từ các Unit đang được quản lý tại cơ sở."
      eyebrow="FACILITY MANAGER / DANH MỤC LOẠI KHO"
      load={loadStorageTypes}
      exportName="storage-types"
      searchPlaceholder="Tìm kiếm theo mã loại kho hoặc tên phân loại..."
      tableTitle="Danh mục loại kho"
      emptyTitle="Không có loại kho"
      columns={[
        ["code", "Mã loại kho"],
        ["name", "Tên loại kho"],
        ["sizeRange", "Kích thước & Thể tích"],
        ["rateRange", "Mức giá / tháng"],
        ["unitCount", "Phân bổ tại trạm"],
        ["availableCount", "Trống sẵn sàng"],
        ["occupancy", "Tỷ lệ lấp đầy"],
      ]}
    />
  );
}
