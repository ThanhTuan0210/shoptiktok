import type { PaymentGatewayConfig } from "../types";

export interface TransactionVerificationResult {
  verified: boolean;
  transactionId?: string;
  amount?: number;
  message?: string;
  bankName?: string;
  paidAt?: string;
}

export async function verifyPayment(
  orderCode: string,
  expectedAmount: number,
  config: PaymentGatewayConfig
): Promise<TransactionVerificationResult> {
  const cleanCode = orderCode.replace(/^WEB-/, "").toUpperCase();

  // 1. If user provided a real SePay API Token, call SePay API
  if (config.apiToken && config.apiToken.trim().length > 0) {
    try {
      const response = await fetch("https://my.sepay.vn/userapi/transactions/list?limit=20", {
        headers: {
          Authorization: `Bearer ${config.apiToken.trim()}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const transactions = data.transactions || data.messages || [];

        for (const tx of transactions) {
          const content = (tx.transaction_content || tx.content || "").toUpperCase();
          const amountIn = Number(tx.amount_in || tx.amount || 0);

          if (content.includes(cleanCode) && amountIn >= expectedAmount) {
            return {
              verified: true,
              transactionId: String(tx.id || tx.transaction_id || `SP-${Date.now()}`),
              amount: amountIn,
              bankName: tx.bank_brand_name || config.bankName,
              paidAt: tx.transaction_date || new Date().toISOString(),
              message: `Đã xác thực nộp tiền thành công qua ${config.bankName}!`,
            };
          }
        }
      }
    } catch (err) {
      console.warn("[PaymentGateway] Error calling SePay API:", err);
    }
  }

  // 2. Check Local Simulated / Webhook Buffer (allows testing and works offline)
  try {
    const rawBuffer = localStorage.getItem("tt_bank_transactions");
    if (rawBuffer) {
      const buffer = JSON.parse(rawBuffer);
      for (const tx of buffer) {
        const content = (tx.content || "").toUpperCase();
        const amountIn = Number(tx.amount || 0);

        if (content.includes(cleanCode) && amountIn >= expectedAmount) {
          return {
            verified: true,
            transactionId: tx.id || `TX-${Date.now()}`,
            amount: amountIn,
            bankName: tx.bankName || config.bankName,
            paidAt: tx.date || new Date().toISOString(),
            message: `Xác thực giao dịch thành công: +${amountIn.toLocaleString("vi-VN")}đ`,
          };
        }
      }
    }
  } catch {}

  return {
    verified: false,
    message: "Chưa phát hiện giao dịch khớp với mã đơn hàng.",
  };
}

export function simulateIncomingPayment(orderCode: string, amount: number, bankName = "Vietcombank") {
  try {
    const rawBuffer = localStorage.getItem("tt_bank_transactions");
    const buffer = rawBuffer ? JSON.parse(rawBuffer) : [];
    const cleanCode = orderCode.replace(/^WEB-/, "").toUpperCase();

    buffer.unshift({
      id: "SIM-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
      content: `HENR ${cleanCode}`,
      amount: amount,
      bankName: bankName,
      date: new Date().toISOString(),
    });

    localStorage.setItem("tt_bank_transactions", JSON.stringify(buffer.slice(0, 50)));
  } catch (e) {
    console.error("Failed to simulate bank payment:", e);
  }
}
