using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleInventorySystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSoftDeleteToVehicle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "Vehicles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_VendorId",
                table: "Invoices",
                column: "VendorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Invoices_Vendors_VendorId",
                table: "Invoices",
                column: "VendorId",
                principalTable: "Vendors",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Invoices_Vendors_VendorId",
                table: "Invoices");

            migrationBuilder.DropIndex(
                name: "IX_Invoices_VendorId",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DeletedAt",
                table: "Vehicles");
        }
    }
}
