import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface ReceiptData {
  tipo: string;
  valor: number;
  descricao?: string | null;
  status?: string;
  data: string | Date;
  de?: string;
  para?: string;
  chavePix?: string;
}

const tipoLabels: Record<string, string> = {
  mesada: "Mesada",
  transferencia: "Transferência",
  pagamento: "Pagamento",
  comissao: "Comissão Mini Gerente",
  deposito: "Depósito",
  saque: "Saque",
  pix: "Pagamento Pix",
};

const statusLabels: Record<string, string> = {
  aprovado: "Aprovado",
  confirmado: "Confirmado",
  pendente: "Pendente",
  recusado: "Recusado",
  solicitado: "Solicitado",
};

export function printReceipt(receipt: ReceiptData) {
  const dateStr = format(
    typeof receipt.data === "string" ? new Date(receipt.data) : receipt.data,
    "dd/MM/yyyy 'às' HH:mm",
    { locale: ptBR },
  );

  const tipoLabel = tipoLabels[receipt.tipo] || receipt.tipo;
  const statusLabel = receipt.status ? (statusLabels[receipt.status] || receipt.status) : "Aprovado";

  const rows: Array<[string, string]> = [
    ["Tipo", tipoLabel],
    ["Valor", `R$ ${receipt.valor.toFixed(2)}`],
    ["Data", dateStr],
    ["Status", statusLabel],
  ];

  if (receipt.de) rows.push(["De", receipt.de]);
  if (receipt.para) rows.push(["Para", receipt.para]);
  if (receipt.chavePix) rows.push(["Chave Pix", receipt.chavePix]);
  if (receipt.descricao) rows.push(["Descrição", receipt.descricao]);

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <title>Comprovante - Pix Kids</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; padding: 20px; }
        .receipt {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          padding: 32px 24px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }
        .header {
          text-align: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 2px dashed #e5e7eb;
        }
        .header h1 {
          font-size: 20px;
          color: #7c3aed;
          margin-bottom: 4px;
        }
        .header p {
          font-size: 12px;
          color: #9ca3af;
        }
        .amount {
          text-align: center;
          margin: 20px 0;
        }
        .amount span {
          font-size: 32px;
          font-weight: 800;
          color: #7c3aed;
        }
        .tipo-badge {
          display: inline-block;
          background: #ede9fe;
          color: #7c3aed;
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        .rows {
          margin: 20px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        .row:last-child { border-bottom: none; }
        .row .label { color: #6b7280; }
        .row .value {
          font-weight: 600;
          color: #111827;
          text-align: right;
          max-width: 60%;
          word-break: break-word;
        }
        .footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 2px dashed #e5e7eb;
        }
        .footer p {
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { background: white; padding: 0; }
          .receipt { box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">
          <h1>Pix Kids</h1>
          <p>Comprovante de Operação</p>
        </div>
        <div class="amount">
          <div class="tipo-badge">${tipoLabel}</div>
          <br />
          <span>R$ ${receipt.valor.toFixed(2)}</span>
        </div>
        <div class="rows">
          ${rows
            .map(
              ([label, value]) => `
                <div class="row">
                  <span class="label">${label}</span>
                  <span class="value">${value}</span>
                </div>
              `,
            )
            .join("")}
        </div>
        <div class="footer">
          <p>Pix Kids - Educação Financeira Infantil</p>
          <p>Comprovante gerado em ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
        </div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>
  `;

  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
