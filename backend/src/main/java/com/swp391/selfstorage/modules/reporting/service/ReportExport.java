package com.swp391.selfstorage.modules.reporting.service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.zip.*;

final class ReportExport {
  private ReportExport() {}

  @SuppressWarnings("unchecked")
  static byte[] write(Map<String, Object> report, String format) {
    List<List<Object>> rows = new ArrayList<>();
    rows.add(List.of("Báo cáo vận hành và dòng tiền", report.get("scope")));
    rows.add(List.of("Từ ngày", report.get("startDate"), "Đến ngày", report.get("endDate")));
    rows.add(List.of(report.get("occupancyBasis")));
    rows.add(List.of("Mã cơ sở", "Tên cơ sở", "Tổng kho", "Đang thuê", "Sẵn sàng", "Lấp đầy (%)", "Tiền thuê", "Tiền cọc", "Phụ phí", "Đã hoàn"));
    for (var row : (List<Map<String, Object>>)report.get("byFacility")) rows.add(List.of(
        row.get("facilityCode"), row.get("facilityName"), row.get("totalUnits"), row.get("occupiedUnits"),
        row.get("availableUnits"), row.get("occupancyRate"), row.get("rentalReceipts"), row.get("depositReceipts"),
        row.get("feeReceipts"), row.get("completedRefunds")));
    if ("csv".equals(format)) return csv(rows);
    try {
      ByteArrayOutputStream buffer = new ByteArrayOutputStream();
      try (ZipOutputStream zip = new ZipOutputStream(buffer, StandardCharsets.UTF_8)) {
        put(zip, "[Content_Types].xml", "<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"rels\" ContentType=\"application/vnd.openxmlformats-package.relationships+xml\"/><Default Extension=\"xml\" ContentType=\"application/xml\"/><Override PartName=\"/xl/workbook.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml\"/><Override PartName=\"/xl/worksheets/sheet1.xml\" ContentType=\"application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml\"/></Types>");
        put(zip, "_rels/.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument\" Target=\"xl/workbook.xml\"/></Relationships>");
        put(zip, "xl/workbook.xml", "<workbook xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\" xmlns:r=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships\"><sheets><sheet name=\"Bao cao\" sheetId=\"1\" r:id=\"rId1\"/></sheets></workbook>");
        put(zip, "xl/_rels/workbook.xml.rels", "<Relationships xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\"><Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet\" Target=\"worksheets/sheet1.xml\"/></Relationships>");
        StringBuilder sheet = new StringBuilder("<worksheet xmlns=\"http://schemas.openxmlformats.org/spreadsheetml/2006/main\"><sheetData>");
        for (int r = 0; r < rows.size(); r++) { sheet.append("<row r=\"").append(r + 1).append("\">");
          for (int c = 0; c < rows.get(r).size(); c++) { Object value = rows.get(r).get(c); String ref = String.valueOf((char)('A' + c)) + (r + 1);
            sheet.append("<c r=\"").append(ref).append("\"");
            if (value instanceof Number) sheet.append("><v>").append(value).append("</v></c>");
            else sheet.append(" t=\"inlineStr\"><is><t xml:space=\"preserve\">").append(xml(String.valueOf(value))).append("</t></is></c>");
          } sheet.append("</row>"); }
        put(zip, "xl/worksheets/sheet1.xml", sheet.append("</sheetData></worksheet>").toString());
      }
      return buffer.toByteArray();
    } catch (IOException ex) { throw new UncheckedIOException(ex); }
  }

  private static byte[] csv(List<List<Object>> rows) { StringBuilder out = new StringBuilder("\uFEFF");
    for (var row : rows) { for (int i = 0; i < row.size(); i++) {
      if (i > 0) out.append(','); String value = String.valueOf(row.get(i));
      if (!(row.get(i) instanceof Number) && value.stripLeading().matches("^[=+@-].*")) value = "'" + value;
      out.append('"').append(value.replace("\"", "\"\"")).append('"');
    } out.append("\r\n"); }
    return out.toString().getBytes(StandardCharsets.UTF_8); }
  private static String xml(String value) { return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;"); }
  private static void put(ZipOutputStream zip, String name, String text) throws IOException { zip.putNextEntry(new ZipEntry(name)); zip.write(("<?xml version=\"1.0\" encoding=\"UTF-8\"?>" + text).getBytes(StandardCharsets.UTF_8)); zip.closeEntry(); }
}
