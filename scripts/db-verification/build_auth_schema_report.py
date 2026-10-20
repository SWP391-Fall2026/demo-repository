"""Offline comparison of the approved metadata capture; no DB or secret access."""
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "docs/drafts/schema-alignment-20261018"
CAPTURE = ROOT / "artifacts/auth-staging/session-pooler-metadata.json"
OUTPUT = ROOT / "docs/testing/auth-staging-schema-diff.md"


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8-sig"))


def cell(value):
    return str(value).replace("|", "\\|").replace("\n", " ")


def main():
    capture = read_json(CAPTURE)
    inventory = read_json(BASE / "mapping-inventory.json")
    baseline = read_json(BASE / "g0-evidence-manifest.json")
    assert capture["status"] == "METADATA_COLLECTED_READONLY"
    groups = {g["query_sequence"]: g for g in capture["groups"]}
    assert all(g["status"] == "OK" for g in groups.values())
    assert groups[1]["rows"][0]["read_only"] == "on"
    # The old inventory can be used only if all 16 source files are unchanged.
    for entry in baseline["source_checks"]:
        digest = hashlib.sha256((ROOT / entry["source"]).read_bytes()).hexdigest()
        assert digest == entry["sha256"], "Entity source drift: regenerate inventory before comparison"
    assert len(baseline["source_checks"]) == len(inventory["entities"]) == 16

    relations = {r["relation_name"]: r for r in groups[2]["rows"]}
    columns = {(r["table_name"], r["column_name"]): r for r in groups[3]["rows"]}
    catalog = {(r["table_name"], r["column_name"]): r for r in groups[4]["rows"]}
    assert set(columns) == set(catalog), "Catalog / information_schema visibility differs"
    result = []
    lines = [
        "# Đối chiếu JPA với schema staging — chưa áp dụng thay đổi",
        "",
        "> Snapshot catalog trước migration; không phải trạng thái hiện tại sau COMMIT002/003/004.",
        "> Xem docs/testing/schema-migration-execution-20261019.md và post-migration-metadata.json cho bằng chứng sau triển khai.",
        "",
        f"Capture bắt đầu UTC: `{capture['captured_at_utc']}`; PostgreSQL `{capture['database_product']}`.",
        "Database `postgres`, schema `public`, current_user `postgres`; Session pooler do người dùng cung cấp.",
        "19 nhóm truy vấn catalog đều trả kết quả; transaction repeatable read/read only và rollback.",
        "Role là owner các bảng public được quan sát, có BYPASSRLS; pg_catalog và information_schema đồng nhất 179 cột.",
        "Đã kiểm SHA-256 của 16 Entity khớp inventory baseline. Không đọc hàng nghiệp vụ hoặc credential.",
        "",
        "## Tóm tắt theo bảng",
        "",
        "| Entity / table | Field code | Cột live | Thiếu so với mapping | Ngoài mapping trên bảng |",
        "|---|---:|---:|---|---|",
    ]
    for table, entity in sorted(inventory["entities"].items()):
        mapped = {f["column"] for f in entity["fields"]}
        live = {c for t, c in columns if t == table}
        missing = sorted(mapped - live)
        extra = sorted(live - mapped)
        lines.append(f"| {entity['entity']} / `{table}` | {len(mapped)} | {len(live)} | "
                     f"{', '.join(missing) or '—'} | {', '.join(extra) or '—'} |")

    for table, entity in sorted(inventory["entities"].items()):
        lines += ["", f"## {table}", "",
                  "| Entity/field | Mapping source | Metadata live | Phân loại / rủi ro | Bước tiếp theo |",
                  "|---|---|---|---|---|"]
        for field in entity["fields"]:
            key = (table, field["column"])
            live = columns.get(key)
            source = f"{field['java_type']}; nullable={field['nullable']}"
            if field.get("length"):
                source += f"; length={field['length']}"
            if field["id"]:
                source += f"; ID {field['generation']}"
            labels, risks, next_steps = [], [], []
            if live is None:
                labels.append("MISSING_LIVE")
                risks.append("Cao: mapping không có cột/bảng để truy cập; chặn validate")
                next_steps.append("Review draft additive; không backfill giả hoặc tự chạy DDL")
                live_summary = "Không có bảng trong public" if table not in relations else "Không có cột trong cả hai catalog"
            else:
                live_summary = (f"{catalog[key]['exact_postgresql_type']}; "
                                f"nullable={live['is_nullable']}; default={live['column_default']}")
                java = field["java_type"].rsplit(".", 1)[-1]
                pg = live["data_type"]
                compatible = {
                    "String": {"character varying", "text"},
                    "Long": {"bigint"}, "Integer": {"integer"},
                    "Boolean": {"boolean"}, "BigDecimal": {"numeric"},
                    "LocalDate": {"date"},
                    "LocalDateTime": {"timestamp without time zone", "timestamp with time zone"},
                }
                if pg not in compatible.get(java, set()):
                    labels.append("TYPE_MISMATCH")
                    risks.append("Cao: cần review JDBC/dialect, chưa thử runtime")
                elif java == "LocalDateTime" and pg == "timestamp with time zone":
                    labels.append("UNVERIFIED")
                    risks.append("Cao: khác ngữ nghĩa offset/instant; chưa chứng minh lỗi validate hay round-trip")
                    next_steps.append("Test UTC round-trip trên PostgreSQL thử nghiệm; không tự đổi kiểu")
                if field["nullable"] != (live["is_nullable"] == "YES"):
                    labels.append("NULLABILITY_MISMATCH")
                    risks.append("Vừa: DB chặt hơn mapping; writer phải đáp ứng NOT NULL")
                    next_steps.append("Giữ invariant DB; kiểm writer, không tự nới constraint")
                if (field.get("length") and live["character_maximum_length"]
                        and live["character_maximum_length"] < field["length"]):
                    labels.append("TYPE_MISMATCH")
                    risks.append("Vừa: giới hạn chuỗi live ngắn hơn hint JPA; không tự chứng minh giá trị hiện tại quá dài")
                    next_steps.append("Kiểm giới hạn payload/ID và rehearsal; không tự mở rộng hoặc cắt dữ liệu")
                if not labels:
                    labels.append("MATCH")
                    risks.append("Chỉ type family/nullability/length đủ chứa hint; không phải PASS runtime hoặc toàn schema")
                next_steps.append("DB default/constraint/generation xem capture; Java initializer không là yêu cầu SQL DEFAULT")
            row = {"table": table, "field": field["field"], "column": field["column"],
                   "source": field, "live": live, "labels": list(dict.fromkeys(labels)),
                   "evidence": {"source": entity["source"], "metadata_groups": [2, 3, 4]},
                   "risks": risks, "next_steps": next_steps}
            result.append(row)
            values = [f"{entity['entity']}.{field['field']} / {field['column']}", source,
                      live_summary, "; ".join(row["labels"] + risks), "; ".join(next_steps)]
            lines.append("| " + " | ".join(cell(v) for v in values) + " |")
        mapped = {f["column"] for f in entity["fields"]}
        for (t, col), live in sorted(columns.items()):
            if t == table and col not in mapped:
                summary = f"{catalog[(t,col)]['exact_postgresql_type']}; nullable={live['is_nullable']}; default={live['column_default']}"
                lines.append(f"| Ngoài Entity / {col} | Không mapping | {cell(summary)} | EXTRA_LIVE; chưa phải lỗi | Giữ nguyên; review consumer/default/NOT NULL |")
    labels = Counter(label for row in result for label in row["labels"])
    assert len(result) == 216
    assert labels["MISSING_LIVE"] == 60
    lines += ["", "## Phạm vi và điểm còn thiếu", "",
              "60 field MISSING_LIVE = 37 cột trên bảng đã tồn tại + 23 field thuộc hai bảng chưa có (`invoices`, `refund_transactions`).",
              "Các bảng ngoài mapping: " + ", ".join(f"`{t}`" for t in sorted(set(relations)-set(inventory["entities"]))) + ". Không xóa hoặc coi đó là lỗi.",
              "", "MATCH ở đây là đối chiếu thuộc tính cấu trúc có giới hạn; không bao gồm default/generation/PK/FK/CHECK/ACL/RLS hay dữ liệu sạch.",
              "TYPE_MISMATCH do length ngắn hơn là khác biệt khai báo đã xác minh, không kết luận Hibernate chắc chắn từ chối hoặc dữ liệu chắc chắn bị lỗi.",
              "Không gán DEFAULT_MISMATCH từ Java initializer. BigDecimal không khai precision/scale; cần quyết định tiền/diện tích trước DDL.",
              "", "Metadata M05–M12 đã thu thập, nhưng chưa duyệt từng constraint/index/sequence/trigger/policy cho migration. Policy expressions và default nhạy cảm bị che.",
              "Không truy vấn auth.users; ứng dụng hiện quản lý public.users. Không chạy quality queries, kiểm dữ liệu cá nhân, sequence nextval/setval, hoặc timestamp write/read.",
              "", "Auth blockers: users có UNIQUE(username), UNIQUE(email) thông thường nhưng không có unique phone/canonical-phone hoặc lower(username/email).",
              "Precheck trong service không thay được DB invariant khi concurrency; dữ liệu legacy/canonical collisions chưa được kiểm tra.",
              "users.email_verified là cột ngoài mapping, NOT NULL DEFAULT true; chưa xác minh bằng HTTP rằng OTP flow tạo đúng trạng thái.",
              "", "Trạng thái startup xem auth-staging-verification.md và backend-startup-evidence.json; đối chiếu offline này không chạy ứng dụng.",
              "API/Postman, SMTP send và browser E2E chưa thực thi. AUTH_SCHEMA_REVIEWED vẫn false. Không đánh dấu G0/G4 đạt.",
              "Bản draft SQL ngày 18/10 vẫn có guard và chưa áp dụng; metadata mới không tự phê duyệt các quyết định audit/time/billing hoặc privilege cho bảng mới.", ""]
    OUTPUT.write_text("\n".join(lines), encoding="utf-8")
    artifact = ROOT / "artifacts/auth-staging/field-comparison.json"
    artifact.write_text(json.dumps({"captured_at_utc": capture["captured_at_utc"],
                        "metadata_sha256": hashlib.sha256(CAPTURE.read_bytes()).hexdigest(),
                        "source_fingerprints_verified": 16, "label_counts": dict(labels),
                        "rows": result}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"report": str(OUTPUT), "fields": len(result), "label_counts": dict(labels)}, ensure_ascii=False))


if __name__ == "__main__":
    main()
