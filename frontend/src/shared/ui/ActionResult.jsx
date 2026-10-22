import { display, money } from "../lib/format";
import { fieldLabel } from "../lib/field-labels";
export function ActionResult({ value }) {
    const rows = typeof value === "object" && value
        ? Object.entries(value).filter(([k, v]) => v != null &&
            typeof v !== "object" &&
            !/password|pinCode|evidencePath|priceSnapshot|idempotencyKey|mode/i.test(k))
        : [["result", value]];
    return (<details className="action-result">
      <summary>Kết quả thao tác</summary>
      <dl>
        {rows.map(([key, v]) => (<div key={String(key)}>
            <dt>{fieldLabel(String(key))}</dt>
            <dd>
              {/amount|fee|rate|price|deposit|deductions|totalRent/i.test(String(key)) && !/discount/i.test(String(key))
                ? money(v)
                : display(v)}
            </dd>
          </div>))}
      </dl>
    </details>);
}
