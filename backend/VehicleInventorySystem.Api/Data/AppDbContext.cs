using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Models;

namespace VehicleInventorySystem.Api.Data;

public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Vendor> Vendors { get; set; }
    public DbSet<Part> Parts { get; set; }
    public DbSet<Vehicle> Vehicles { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceItem> InvoiceItems { get; set; }
    public DbSet<Appointment> Appointments { get; set; }
    public DbSet<PartRequest> PartRequests { get; set; }
    public DbSet<SpecialPartRequest> SpecialPartRequests { get; set; }
    public DbSet<ServiceReview> Reviews { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.PhoneNumber).IsUnique();
            entity.HasIndex(u => u.Role);
            entity.HasIndex(u => u.IsActive);
        });

        builder.Entity<IdentityRole<int>>(entity =>
        {
            entity.ToTable("Roles");
        });

        builder.Entity<IdentityUserRole<int>>(entity =>
        {
            entity.ToTable("UserRoles");
        });

        builder.Entity<IdentityUserClaim<int>>(entity =>
        {
            entity.ToTable("UserClaims");
        });

        builder.Entity<IdentityUserLogin<int>>(entity =>
        {
            entity.ToTable("UserLogins");
        });

        builder.Entity<IdentityUserToken<int>>(entity =>
        {
            entity.ToTable("UserTokens");
        });

        builder.Entity<IdentityRoleClaim<int>>(entity =>
        {
            entity.ToTable("RoleClaims");
        });

        builder.Entity<Part>()
            .HasOne(p => p.Vendor)
            .WithMany(v => v.Parts)
            .HasForeignKey(p => p.VendorId);

        builder.Entity<Vehicle>()
            .HasOne(v => v.Customer)
            .WithMany(u => u.Vehicles)
            .HasForeignKey(v => v.CustomerId);

        builder.Entity<InvoiceItem>()
            .HasOne(ii => ii.Part)
            .WithMany()
            .HasForeignKey(ii => ii.PartId);

        builder.Entity<Invoice>()
            .HasMany(i => i.Items)
            .WithOne()
            .HasForeignKey(ii => ii.InvoiceId);

        builder.Entity<Invoice>()
            .HasOne(i => i.Vehicle)
            .WithMany()
            .HasForeignKey(i => i.VehicleId)
            .IsRequired(false);

        builder.Entity<Vendor>(entity =>
        {
            entity.HasIndex(v => v.EmailAddress).IsUnique();
            entity.HasIndex(v => v.PhoneNumber).IsUnique();
        });

        builder.Entity<Part>(entity =>
        {
            entity.HasIndex(p => p.PartCode).IsUnique();
        });

        builder.Entity<SpecialPartRequest>()
            .HasOne(spr => spr.Customer)
            .WithMany()
            .HasForeignKey(spr => spr.CustomerId);

        builder.Entity<SpecialPartRequest>()
            .HasOne(spr => spr.Vehicle)
            .WithMany()
            .HasForeignKey(spr => spr.VehicleId);

        builder.Entity<SpecialPartRequest>()
            .HasOne(spr => spr.Part)
            .WithMany()
            .HasForeignKey(spr => spr.PartId)
            .IsRequired(false);
    }
}
