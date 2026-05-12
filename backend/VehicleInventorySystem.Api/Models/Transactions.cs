namespace VehicleInventorySystem.Api.Models;

public class Vehicle
{
    public int Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Make { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? FuelType { get; set; } // Petrol, Diesel, Hybrid, Electric, etc.
    public int Mileage { get; set; } = 0; // in kilometers
    
    public int CustomerId { get; set; }
    public User? Customer { get; set; }
}

public enum InvoiceType
{
    Purchase, // From Vendor
    Sale      // To Customer
}

public class Invoice
{
    public int Id { get; set; }
    public InvoiceType Type { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
    public decimal TotalAmount { get; set; }
    public bool IsPaid { get; set; } = true;
    public string? PaymentStatus { get; set; } // full-payment, half-payment, partial-payment
    
    // For Sale: Staff Id and Customer Id
    // For Purchase: Vendor Id
    public int? CreatedById { get; set; } // Staff Id
    public int? CustomerId { get; set; }Please fix the StaffDashboard invoice persistence and runtime error.

Current issues:
1. Sale invoice is created successfully and saved in database.
2. But after refreshing the frontend, invoice list becomes empty.
3. Console error:
   Uncaught ReferenceError: emailStatus is not defined
   at InvoicesPage (StaffDashboard.jsx:250)

This means:
- InvoicesPage is referencing emailStatus without defining it.
- Invoice list may be using only local state instead of fetching invoices from backend after refresh.

Please inspect:
- src/pages/StaffDashboard.jsx
- InvoicesPage component inside StaffDashboard.jsx
- api.js
- TransactionsController.cs
- invoice endpoints

Fix requirements:

1. Fix emailStatus error:
   - Define emailStatus state if email sending feature is needed:
     const [emailStatus, setEmailStatus] = useState(null);
   OR
   - Remove emailStatus usage if email invoice feature is not implemented.
   - Do not leave undefined variables in JSX.

2. Add/fix backend endpoint to fetch saved invoices:
   GET /api/Transactions/invoices
   or
   GET /api/Transactions/sales

3. Endpoint should return saved invoices from database, including:
   - invoice id
   - customer name/email if available
   - date
   - total amount
   - payment status or isPaid
   - invoice items
   - part names
   - quantity
   - unit price

4. Use IQueryable in backend:
   var query = _context.Invoices.AsQueryable();
   query = query.Where(i => i.Type == InvoiceType.Sale);
   Include customer and items/parts before ToListAsync.

5. Authorize invoice fetch endpoint for Admin and Staff:
   [Authorize(Roles = "Admin,Staff")]

6. Frontend:
   - On InvoicesPage mount, fetch invoices from backend using useEffect.
   - Do not rely only on local state created after sale.
   - After creating a sale, refetch invoices or append returned invoice to state.
   - After page refresh, invoices should load from backend database.

7. Add loading and empty states:
   - Loading invoices...
   - No invoices found.

8. Handle API errors with toast:
   - "Unable to load invoices."
   - Do not crash the page.

9. Make sure field names match backend response:
   - isPaid vs paymentStatus
   - customerName
   - totalAmount
   - items

10. Do not break:
   - Sale transaction creation
   - Staff dashboard
   - Customer registration
   - Auth/JWT
   - Parts stock update
   - Vendor/Parts management

Expected result:
- No emailStatus undefined error.
- Invoice list loads from database after refresh.
- Newly created sale invoice appears immediately and remains after refresh.
    public User? Customer { get; set; }
    public int? VendorId { get; set; }
    
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}

public class InvoiceItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public int PartId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    
    public Part? Part { get; set; }
}
