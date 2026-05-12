using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleInventorySystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentStatusToInvoice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "Invoices",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "Invoices");
        }
    }
}
