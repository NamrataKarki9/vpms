using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace VehicleInventorySystem.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRescheduleCountToAppointment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RescheduleCount",
                table: "Appointments",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RescheduleCount",
                table: "Appointments");
        }
    }
}
