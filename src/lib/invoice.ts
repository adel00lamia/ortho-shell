/**
 * Moroccan invoice generator with ICE/IF compliance.
 * Opens a print-ready window for PDF save.
 */

export interface InvoiceData {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  // Seller
  sellerName: string;
  sellerAddress: string;
  sellerIce: string;       // Identifiant Commun de l'Entreprise
  sellerIf: string;        // Identifiant Fiscal
  sellerRc?: string;       // Registre du Commerce
  sellerCnss?: string;     // CNSS number
  // Buyer
  buyerName: string;
  buyerAddress: string;
  buyerIce: string;
  buyerIf?: string;
  // Line items
  items: {
    description: string;
    quantity: number;
    unitPrice: number;     // in MAD
    tvaRate: number;       // e.g. 20 for 20%
  }[];
  // Notes
  notes?: string;
  currency?: string;
}

export function generateInvoice(data: InvoiceData) {
  const currency = data.currency || 'MAD';
  const subtotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tvaTotal = data.items.reduce((s, i) => s + i.quantity * i.unitPrice * (i.tvaRate / 100), 0);
  const total = subtotal + tvaTotal;

  const fmt = (n: number) => n.toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Facture ${data.invoiceNumber}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; font-size: 12px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; margin-bottom: 32px; }
    .brand { font-size: 22px; font-weight: 800; color: #6366f1; }
    .invoice-label { font-size: 28px; font-weight: 800; color: #1a1a2e; text-align: right; }
    .invoice-meta { text-align: right; color: #666; margin-top: 4px; }
    .parties { display: flex; gap: 40px; margin-bottom: 24px; }
    .party { flex: 1; }
    .party-label { font-size: 10px; font-weight: 600; text-transform: uppercase; color: #999; letter-spacing: 1px; margin-bottom: 8px; }
    .party-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
    .party-detail { color: #666; font-size: 11px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead th { background: #f0f0f5; text-align: left; padding: 10px 12px; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #ddd; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #eee; }
    .text-right { text-align: right; }
    .totals { display: flex; justify-content: flex-end; }
    .totals-table { width: 280px; }
    .totals-table td { padding: 6px 12px; }
    .total-row td { font-size: 16px; font-weight: 800; border-top: 2px solid #1a1a2e; padding-top: 12px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; color: #999; font-size: 10px; text-align: center; }
    .notes { margin-top: 24px; padding: 12px; background: #fafafa; border-radius: 6px; color: #666; font-size: 11px; }
    .legal { margin-top: 16px; font-size: 10px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">QimataQ</div>
      <div style="color: #666; font-size: 11px; margin-top: 4px;">Plateforme de gestion de formation</div>
    </div>
    <div>
      <div class="invoice-label">FACTURE</div>
      <div class="invoice-meta">
        N° ${data.invoiceNumber}<br>
        Date: ${data.date}<br>
        ${data.dueDate ? `Échéance: ${data.dueDate}` : ''}
      </div>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <div class="party-label">Émetteur</div>
      <div class="party-name">${data.sellerName}</div>
      <div class="party-detail">${data.sellerAddress}</div>
      <div class="party-detail">ICE: ${data.sellerIce}</div>
      <div class="party-detail">IF: ${data.sellerIf}</div>
      ${data.sellerRc ? `<div class="party-detail">RC: ${data.sellerRc}</div>` : ''}
      ${data.sellerCnss ? `<div class="party-detail">CNSS: ${data.sellerCnss}</div>` : ''}
    </div>
    <div class="party">
      <div class="party-label">Client</div>
      <div class="party-name">${data.buyerName}</div>
      <div class="party-detail">${data.buyerAddress}</div>
      <div class="party-detail">ICE: ${data.buyerIce}</div>
      ${data.buyerIf ? `<div class="party-detail">IF: ${data.buyerIf}</div>` : ''}
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Désignation</th>
        <th class="text-right">Qté</th>
        <th class="text-right">P.U. HT</th>
        <th class="text-right">TVA</th>
        <th class="text-right">Montant HT</th>
      </tr>
    </thead>
    <tbody>
      ${data.items.map(i => `
        <tr>
          <td>${i.description}</td>
          <td class="text-right">${i.quantity}</td>
          <td class="text-right">${fmt(i.unitPrice)} ${currency}</td>
          <td class="text-right">${i.tvaRate}%</td>
          <td class="text-right">${fmt(i.quantity * i.unitPrice)} ${currency}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr>
        <td>Total HT</td>
        <td class="text-right">${fmt(subtotal)} ${currency}</td>
      </tr>
      <tr>
        <td>TVA</td>
        <td class="text-right">${fmt(tvaTotal)} ${currency}</td>
      </tr>
      <tr class="total-row">
        <td>Total TTC</td>
        <td class="text-right">${fmt(total)} ${currency}</td>
      </tr>
    </table>
  </div>

  ${data.notes ? `<div class="notes">${data.notes}</div>` : ''}

  <div class="legal">
    Conformément à la réglementation fiscale marocaine, cette facture est émise en dirham marocain (MAD).
    TVA applicable selon l'article 89 du CGI.
  </div>

  <div class="footer">
    © ${new Date().getFullYear()} QimataQ — Document généré automatiquement
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => printWindow.print();
}
