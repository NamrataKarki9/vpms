SELECT 
    i."Id", 
    i."Type", 
    i."TotalAmount", 
    COALESCE(SUM(ii."Quantity" * ii."UnitPrice"), 0) AS "CalculatedSubtotal",
    i."TotalAmount" - COALESCE(SUM(ii."Quantity" * ii."UnitPrice"), 0) AS "Difference",
    COUNT(ii."Id") AS "ItemCount"
FROM "Invoices" i
LEFT JOIN "InvoiceItems" ii ON i."Id" = ii."InvoiceId"
GROUP BY i."Id", i."Type", i."TotalAmount"
ORDER BY i."Id" DESC
LIMIT 20;
