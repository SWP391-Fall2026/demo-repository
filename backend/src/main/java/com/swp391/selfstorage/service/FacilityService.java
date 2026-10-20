package com.swp391.selfstorage.service;

import com.swp391.selfstorage.entity.Facility;
import com.swp391.selfstorage.entity.Unit;
import com.swp391.selfstorage.entity.User;
import com.swp391.selfstorage.repository.ContractRepository;
import com.swp391.selfstorage.repository.FacilityRepository;
import com.swp391.selfstorage.repository.ReservationRepository;
import com.swp391.selfstorage.repository.UnitRepository;
import com.swp391.selfstorage.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@Service
public class FacilityService {

    private final FacilityRepository facilityRepository;
    private final UnitRepository unitRepository;
    private final UserRepository userRepository;
    private final ReservationRepository reservationRepository;
    private final ContractRepository contractRepository;

    public FacilityService(FacilityRepository facilityRepository, UnitRepository unitRepository,
            UserRepository userRepository, ReservationRepository reservationRepository,
            ContractRepository contractRepository) {
        this.facilityRepository = facilityRepository;
        this.unitRepository = unitRepository;
        this.userRepository = userRepository;
        this.reservationRepository = reservationRepository;
        this.contractRepository = contractRepository;
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

    public List<Unit> getAvailableUnits(String facilityCode, String type) {
        List<Unit> available = facilityCode == null || facilityCode.isBlank()
                ? unitRepository.findByStatus("available")
                : unitRepository.findByFacilityCodeAndStatus(facilityCode, "available");
        return type == null || type.isBlank() ? available
                : available.stream().filter(unit -> type.equalsIgnoreCase(unit.getType())).toList();
    }

            public Map<String, Object> getPublicInventory(String facilityCode) {
            Facility facility = facilityRepository.findById(facilityCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));
            List<Map<String, Object>> publicUnits = unitRepository.findByFacilityCode(facilityCode).stream()
                .sorted(Comparator.comparing(Unit::getCode))
                .map(unit -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("code", unit.getCode());
                    row.put("type", unit.getType());
                    row.put("sizeDesc", unit.getSizeDesc());
                    row.put("sizeSqm", unit.getSizeSqm());
                    row.put("volumeM3", unit.getSizeSqm() == null ? null
                        : unit.getSizeSqm().multiply(BigDecimal.valueOf(2.5)));
                    row.put("floor", unit.getFloor());
                    row.put("pricePerMonth", unit.getPricePerMonth());
                    row.put("status", unit.getStatus());
                    return row;
                }).toList();
            Map<String, Object> inventory = new LinkedHashMap<>();
            inventory.put("facilityCode", facility.getCode());
            inventory.put("facilityName", facility.getName());
            inventory.put("total", publicUnits.size());
            inventory.put("available", unitRepository.countByFacilityCodeAndStatus(facilityCode, "available"));
            inventory.put("reserved", unitRepository.countByFacilityCodeAndStatus(facilityCode, "reserved"));
            inventory.put("occupied", unitRepository.countByFacilityCodeAndStatus(facilityCode, "occupied"));
            inventory.put("units", publicUnits);
            return inventory;
            }

    public List<Unit> getManagedUnits(String username, String status, String type) {
        User manager = requireFacilityOperator(username);
        List<Unit> units = unitRepository.findByFacilityCode(manager.getFacilityCode());
        return units.stream()
                .filter(unit -> status == null || status.isBlank() || status.equalsIgnoreCase(unit.getStatus()))
                .filter(unit -> type == null || type.isBlank() || type.equalsIgnoreCase(unit.getType()))
                .sorted(Comparator.comparing(Unit::getCode))
                .toList();
    }

    public Unit getUnitByCode(String code) {
        return unitRepository.findById(code).orElse(null);
    }

    @Transactional
    public Unit createUnit(String username, Map<String, Object> data) {
        User manager = requireManager(username);
        String code = requiredText(data.get("code"), "Unit code is required");
        String type = requiredText(data.get("type"), "Unit type is required").toUpperCase(Locale.ROOT);
        if (!Set.of("S", "M", "L", "CLIMATE").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported unit type");
        }
        if (unitRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Unit code already exists");
        }
        Unit unit = new Unit();
        unit.setCode(code);
        unit.setFacilityCode(manager.getFacilityCode());
        applyUnitFields(unit, data, type);
        String initialStatus = Objects.toString(data.getOrDefault("status", "available")).toLowerCase(Locale.ROOT);
        if (!Set.of("available", "cleaning", "maintenance").contains(initialStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New units must start available, cleaning or maintenance");
        }
        unit.setStatus(initialStatus);
        unit.setTenantName(null);
        unit.setPinCode("000000");
        return unitRepository.save(unit);
    }

    @Transactional
    public Unit updateUnit(String username, String code, Map<String, Object> data) {
        User manager = requireManager(username);
        Unit unit = findManagedUnit(manager, code);
        String type = data.get("type") == null ? unit.getType()
                : requiredText(data.get("type"), "Unit type is required").toUpperCase(Locale.ROOT);
        if (!Set.of("S", "M", "L", "CLIMATE").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported unit type");
        }
        applyUnitFields(unit, data, type);
        return unitRepository.save(unit);
    }

    @Transactional
    public Unit updateUnitStatus(String username, String code, String newStatus, String tenant) {
        User manager = requireFacilityOperator(username);
        Unit unit = findManagedUnit(manager, code);
        String status = requiredText(newStatus, "Unit status is required").toLowerCase(Locale.ROOT);
        if (status.equalsIgnoreCase(unit.getStatus())) return unit;
        if (!Set.of("available", "cleaning", "maintenance").contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported unit status");
        }
        if ("available".equals(status) && hasActiveRentalOrReservation(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Unit cannot be marked available while an active rental or reservation exists");
        }
        unit.setStatus(status);
        if (tenant != null) unit.setTenantName(tenant);
        if (!"occupied".equals(status)) unit.setPinCode("000000");
        return unitRepository.save(unit);
    }

    @Transactional
    public void deleteUnit(String username, String code) {
        User manager = requireManager(username);
        Unit unit = findManagedUnit(manager, code);
        if (!"available".equals(unit.getStatus()) || hasActiveRentalOrReservation(code)
                || contractRepository.findByUnitCode(code).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Only available units without contract history or active reservations can be deleted");
        }
        unitRepository.delete(unit);
    }

    @Transactional
    public Facility createFacility(String username, Map<String, Object> data) {
        requireOpsManager(username);
        String code = requiredText(data.get("code"), "Facility code is required").toUpperCase(Locale.ROOT);
        if (facilityRepository.existsById(code)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Facility code already exists");
        }
        Facility facility = new Facility();
        facility.setCode(code);
        facility.setName(requiredText(data.get("name"), "Facility name is required"));
        facility.setAddress(requiredText(data.get("address"), "Facility address is required"));
        facility.setCity(requiredText(data.get("city"), "Facility city is required"));
        facility.setHotline(Objects.toString(data.get("hotline"), null));
        facility.setTotalUnits(0);
        facility.setOccupiedUnits(0);
        facility.setOccupancyRate(BigDecimal.ZERO);
        facility.setStatus("ACTIVE");
        return facilityRepository.save(facility);
    }

    @Transactional
    public Facility updateFacility(String username, String code, Map<String, Object> data) {
        requireOpsManager(username);
        Facility facility = facilityRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Facility not found"));
        if (data.containsKey("name")) facility.setName(requiredText(data.get("name"), "Facility name is required"));
        if (data.containsKey("address")) facility.setAddress(requiredText(data.get("address"), "Facility address is required"));
        if (data.containsKey("city")) facility.setCity(requiredText(data.get("city"), "Facility city is required"));
        if (data.containsKey("hotline")) facility.setHotline(Objects.toString(data.get("hotline"), null));
        if (data.containsKey("status")) {
            String status = requiredText(data.get("status"), "Facility status is required").toUpperCase(Locale.ROOT);
            if (!Set.of("ACTIVE", "INACTIVE").contains(status)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported facility status");
            }
            facility.setStatus(status);
        }
        return facilityRepository.save(facility);
    }

    private User requireManager(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!Set.of("FMANAGER", "FACILITY_MANAGER").contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility manager role required");
        }
        if (user.getFacilityCode() == null || user.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User has no facility scope");
        }
        return user;
    }

    private User requireFacilityOperator(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!Set.of("STAFF", "FMANAGER", "FACILITY_MANAGER").contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Facility operator role required");
        }
        if (user.getFacilityCode() == null || user.getFacilityCode().isBlank()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User has no facility scope");
        }
        return user;
    }

    private void requireOpsManager(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!Set.of("OPS_MGR", "OPS_MANAGER", "BUSINESS_OPERATIONS_MANAGER").contains(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Operations manager role required");
        }
    }

    private Unit findManagedUnit(User manager, String code) {
        Unit unit = unitRepository.findById(code)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found"));
        if (!manager.getFacilityCode().equals(unit.getFacilityCode())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Unit not found in this facility");
        }
        return unit;
    }

    private boolean hasActiveRentalOrReservation(String unitCode) {
        return contractRepository.findByUnitCode(unitCode)
                .filter(contract -> !"TERMINATED".equalsIgnoreCase(contract.getStatus())).isPresent()
                || !reservationRepository.findByUnitCodeAndStatusIn(
                unitCode, List.of("RESERVED")).isEmpty();
    }

    private static void applyUnitFields(Unit unit, Map<String, Object> data, String type) {
        unit.setType(type);
        if (data.containsKey("sizeDesc")) unit.setSizeDesc(Objects.toString(data.get("sizeDesc"), null));
        if (data.containsKey("sizeSqm")) unit.setSizeSqm(positiveDecimal(data.get("sizeSqm"), "sizeSqm"));
        if (data.containsKey("pricePerMonth")) unit.setPricePerMonth(nonNegativeDecimal(data.get("pricePerMonth"), "pricePerMonth"));
        if (data.containsKey("floor")) {
            Object floor = data.get("floor");
            if (floor == null) unit.setFloor(null);
            else if (floor instanceof Number number && number.intValue() >= 0) unit.setFloor(number.intValue());
            else throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "floor must be a non-negative integer");
        }
        if (unit.getSizeSqm() == null || unit.getPricePerMonth() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sizeSqm and pricePerMonth are required");
        }
    }

    private static BigDecimal positiveDecimal(Object value, String name) {
        BigDecimal number = decimal(value, name);
        if (number.signum() <= 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " must be positive");
        return number;
    }

    private static BigDecimal nonNegativeDecimal(Object value, String name) {
        BigDecimal number = decimal(value, name);
        if (number.signum() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " cannot be negative");
        return number;
    }

    private static BigDecimal decimal(Object value, String name) {
        if (value instanceof Number number) return BigDecimal.valueOf(number.doubleValue());
        try {
            return new BigDecimal(String.valueOf(value));
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, name + " must be numeric");
        }
    }

    private static String requiredText(Object value, String message) {
        if (value == null || value.toString().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        return value.toString().trim();
    }
}
