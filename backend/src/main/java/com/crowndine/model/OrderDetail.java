package com.crowndine.model;

import com.crowndine.common.enums.EOrderDetailStatus;
import jakarta.persistence.*;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "order_details")
public class OrderDetail extends AbstractEntity<Long> {

    @ManyToOne
    @JoinColumn(name = "order_id")
    private Order order;

    @ManyToOne
    @JoinColumn(name = "item_id")
    private Item item;

    @ManyToOne
    @JoinColumn(name = "combo_id")
    private Combo combo;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "total_price")
    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private EOrderDetailStatus status;

    @Column(name = "note")
    private String note;

    public String getProductName() {
        if (combo != null) return combo.getName();
        if (item != null) return item.getName();
        return "Unknown Item";
    }

    public void calculateAndSetTotalPrice() {
        BigDecimal unitPrice = getAppliedUnitPrice();

        if (this.quantity != null && this.quantity > 0) {
            this.totalPrice = unitPrice.multiply(BigDecimal.valueOf(this.quantity));
        } else {
            this.totalPrice = BigDecimal.ZERO;
        }
    }

    public BigDecimal getAppliedUnitPrice() {
        if (this.item != null) {
            if (this.item.getPriceAfterDiscount() != null) {
                return this.item.getPriceAfterDiscount();
            }
            return this.item.getPrice() != null ? this.item.getPrice() : BigDecimal.ZERO;
        }

        if (this.combo != null) {
            if (this.combo.getPriceAfterDiscount() != null) {
                return this.combo.getPriceAfterDiscount();
            }
            return this.combo.getPrice() != null ? this.combo.getPrice() : BigDecimal.ZERO;
        }

        return BigDecimal.ZERO;
    }
}
