using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleInventorySystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVehicleIdAndCostFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VehicleId",
                table: "Invoices",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Cost",
                table: "Appointments",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_VehicleId",
                table: "Invoices",
                column: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Vehicles_VehicleId",
                table: "Invoices",
                column: "VehicleId",
                principalTable: "Vehicles",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Vehicles_VehicleId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_VehicleId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "VehicleId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "Cost",
                table: "Appointments");
        }
    }
}
