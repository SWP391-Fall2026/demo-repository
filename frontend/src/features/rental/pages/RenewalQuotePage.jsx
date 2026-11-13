import { useState } from "react";
import { Link } from "react-router-dom";
import { ResourcePage, Form } from "../../../shared/ui/ResourcePage";
import { money } from "../../../shared/lib/format";
import { rentalApi } from "../api/rental.api";
const renewalColumns = [
    ["id", "Mã hợp đồng"],
    ["unitCode", "Kho thuê"],
    ["facilityCode", "Cơ sở"],
    ["monthlyFee", "Giá thuê / tháng"],
    ["endDate", "Hạn thuê hiện tại"],
    ["status", "Trạng thái"],
];

export default function RenewalQuotePage() {
    const [quote, setQuote] = useState(null), [invoice, setInvoice] = useState(null);
    return (<ResourcePage eyebrow="STORAGE / GIA HẠN HỢP ĐỒNG" title="Báo giá & Gia hạn hợp đồng" description="Xem báo giá gia hạn thuê kho, áp dụng chiết khấu kỳ hạn và tạo hóa đơn thanh toán gia hạn." load={rentalApi.list} columns={renewalColumns}>
      <Form fields={[
            { name: "contractId", label: "Mã hợp đồng", required: true },
            {
                name: "months",
                label: "Số tháng",
                type: "number",
                defaultValue: 1,
                required: true,
            },
        ]} label="Lấy báo giá" submit={async (d) => {
            const q = await rentalApi.renew(d);
            setQuote(q);
            setInvoice(null);
            return q;
        }}/>
      {quote && (<section className="card">
          <h2>Báo giá gia hạn</h2>
          <p>
            Giá tháng sau chiết khấu: <strong>{money(quote.monthlyRate)}</strong> · Giảm {Number(quote.discountRate || 0) * 100}% · Phí quá
            hạn: {money(quote.overdueFee)}
          </p>
          <p>
            Tổng thanh toán: <strong>{money(quote.totalAmount)}</strong>
          </p>
          <Form key={String(quote.contractId) + String(quote.monthlyRate)} fields={[
                {
                    name: "priceConfirmed",
                    label: "Tôi đồng ý với giá và phí trên",
                    type: "checkbox",
                    required: true,
                },
            ]} label="Xác nhận và tạo hóa đơn" submit={async (d) => {
                const i = await rentalApi.confirmRenewal({
                    ...d,
                    contractId: quote.contractId,
                    months: quote.durationMonths,
                    expectedMonthlyRate: quote.monthlyRate,
                });
                setInvoice(i);
                return i;
            }}/>
          {invoice && (<>
            <Link className="button" to={`/invoices/${(invoice.renewalInvoice ?? invoice).id}/pay`}>
              Thanh toán hóa đơn gia hạn
            </Link>
            {invoice.overdueInvoice && <p className="notice">Đã tách phí quá hạn thành hóa đơn riêng: {money(invoice.overdueInvoice.amount)} — thanh toán tại <Link to={`/invoices/${invoice.overdueInvoice.id}/pay`}>hóa đơn quá hạn</Link>.</p>}
          </>)}
        </section>)}
    </ResourcePage>);
}
