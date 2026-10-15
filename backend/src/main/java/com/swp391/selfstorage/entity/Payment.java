package com.swp391.selfstorage.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "reservation_id")
    private String reservationId;

    @Column(name = "contract_id")
    private String contractId;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "invoice_type")
    private String invoiceType; // DEPOSIT, RENT, RENEW, EXTRA

    @Column(name = "amount")
    private BigDecimal amount = BigDecimal.ZERO;

    @Column(name = "payment_method")
    private String paymentMethod = "VietQR Napas247";

    @Column(name = "transaction_code")
    private String transactionCode;

    @Column(name = "status")
    private String status = "PAID"; // PENDING, PAID, FAILED, REFUNDED

    @Column(name = "time_str")
    private String timeStr;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Payment() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getReservationId() { return reservationId; }
    public void setReservationId(String reservationId) { this.reservationId = reservationId; }

    public String getContractId() { return contractId; }
    public void setContractId(String contractId) { this.contractId = contractId; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getInvoiceType() { return invoiceType; }
    public void setInvoiceType(String invoiceType) { this.invoiceType = invoiceType; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public String getTransactionCode() { return transactionCode; }
    public void setTransactionCode(String transactionCode) { this.transactionCode = transactionCode; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getTimeStr() { return timeStr; }
    public void setTimeStr(String timeStr) { this.timeStr = timeStr; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
