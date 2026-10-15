package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Facility;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.repository.FacilityRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final UnitRepository unitRepository;

    public FacilityService(FacilityRepository facilityRepository, UnitRepository unitRepository) {
        this.facilityRepository = facilityRepository;
        this.unitRepository = unitRepository;
    }

    public List<Facility> getAllFacilities() {
        return facilityRepository.findAll();
    }

    public List<Map<String, Object>> getUnitTypes() {
        List<Map<String, Object>> list = new ArrayList<>();

        Map<String, Object> s = new LinkedHashMap<>();
        s.put("type", "S");
        s.put("name", "Kho Mini (Size S)");
        s.put("sizeRange", "1.5 - 3.0 m²");
        s.put("pricePerMonth", 800000);
        s.put("suitableFor", "Hồ sơ công chứng, vali du lịch, tài liệu kế toán");
        list.add(s);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("type", "M");
        m.put("name", "Kho Tiêu chuẩn (Size M)");
        m.put("sizeRange", "4.0 - 6.0 m²");
        m.put("pricePerMonth", 1450000);
        m.put("suitableFor", "Đồ nội thất căn hộ 1 phòng ngủ, xe máy, hàng tồn kho shop");
        list.add(m);

        Map<String, Object> l = new LinkedHashMap<>();
        l.put("type", "L");
        l.put("name", "Kho Gia đình / Doanh nghiệp (Size L)");
        l.put("sizeRange", "8.0 - 15.0 m²");
        l.put("pricePerMonth", 2800000);
        l.put("suitableFor", "Toàn bộ tài sản nhà phố 3 tầng, thiết bị sự kiện, pallet hàng");
        list.add(l);

        Map<String, Object> c = new LinkedHashMap<>();
        c.put("type", "CLIMATE");
        c.put("name", "Kho Lạnh / Kiểm soát ẩm (Climate Controlled)");
        c.put("sizeRange", "3.0 - 8.0 m²");
        c.put("pricePerMonth", 2200000);
        c.put("suitableFor", "Rượu vang cao cấp, tranh nghệ thuật, thiết bị điện tử, dược phẩm");
        list.add(c);

        return list;
    }

    public List<Unit> getAllUnits() {
        return unitRepository.findAll();
    }

    public Unit getUnitByCode(String code) {
        return unitRepository.findById(code).orElse(null);
    }

    public Unit updateUnitStatus(String code, String newStatus, String tenant) {
        Unit unit = unitRepository.findById(code)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy phòng kho với mã: " + code));
        unit.setStatus(newStatus);
        if (tenant != null) {
            unit.setTenantName(tenant);
        }
        return unitRepository.save(unit);
    }
}
