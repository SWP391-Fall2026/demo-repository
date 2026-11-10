/**
 * Resolves real storage unit and facility image URLs from /public/units
 * based on explicit imageUrl, unit type (S, M, L, CLIMATE), and facility code.
 */

export function getFacilityImage(facilityCode) {
    const code = String(facilityCode || "").toUpperCase();
    if (code.includes("CG") || code.includes("HN")) return "/units/facility_cau_giay.jpg";
    if (code.includes("Q7")) return "/units/facility_quan_7.jpg";
    if (code.includes("TB")) return "/units/facility_tan_binh.jpg";
    return "/units/hero_storage.jpg";
}

export function getUnitPrimaryImage(unit, contract, facility) {
    if (unit?.imageUrl) return String(unit.imageUrl);
    const type = String(unit?.type || contract?.unitType || "").toUpperCase();
    if (type === "S") return "/units/storage_s_01.jpg";
    if (type === "M") return "/units/storage_m_01.jpg";
    if (type === "L") return "/units/storage_l_01.jpg";
    if (type === "CLIMATE") return "/units/storage_climate_01.jpg";

    const facilityCode = unit?.facilityCode || contract?.facilityCode || facility?.code;
    return getFacilityImage(facilityCode);
}

export function getUnitGallery(unit, contract, facility) {
    const facilityCode = unit?.facilityCode || contract?.facilityCode || facility?.code;
    const type = String(unit?.type || contract?.unitType || "Tiêu chuẩn").toUpperCase();
    const unitCode = unit?.code || contract?.unitCode || "Kho lưu trữ";

    const primaryUrl = getUnitPrimaryImage(unit, contract, facility);
    const facilityImg = getFacilityImage(facilityCode);

    const gallery = [
        {
            url: primaryUrl,
            label: `Khoang ${unitCode} (${type})`,
            desc: "Không gian khoang lưu trữ thực tế"
        },
        {
            url: type === "M" ? "/units/storage_m_02.jpg" : "/units/unit_01.jpg",
            label: "Bố trí bên trong khoang",
            desc: "Sàn sạch, khóa bảo mật 2 lớp & chống ẩm"
        },
        {
            url: facilityImg,
            label: `Cơ sở ${facility?.name || facilityCode || ""}`.trim(),
            desc: facility?.address || "Khuôn viên & khu vực bốc dỡ hàng hóa"
        },
        {
            url: "/units/facility_clean.jpg",
            label: "Hành lang & An ninh 24/7",
            desc: "Camera giám sát và kiểm soát ra vào bằng mã PIN"
        }
    ];

    // Ensure unique URLs if primaryUrl happened to match one of the fallbacks
    const seen = new Set();
    return gallery.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
    });
}

