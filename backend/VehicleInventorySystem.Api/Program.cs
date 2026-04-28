using Microsoft.EntityFrameworkCore;
using VehicleInventorySystem.Api.Data;
using System.Text.Json.Serialization;
using VehicleInventorySystem.Api.Services;
using VehicleInventorySystem.Api.Services.Interfaces;
using VehicleInventorySystem.Api.Services.Implementations;
using System.Data.Common;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});


// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IVendorService, VendorService>();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await dbContext.Database.MigrateAsync();

    var connection = dbContext.Database.GetDbConnection();
    if (connection.State != System.Data.ConnectionState.Open)
    {
        connection.Open();
    }

    static bool ColumnExists(DbConnection connection, string columnName)
    {
        using var existsCommand = connection.CreateCommand();
        existsCommand.CommandText = @"
SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'Vendors'
      AND column_name = @columnName
);";

        var parameter = existsCommand.CreateParameter();
        parameter.ParameterName = "@columnName";
        parameter.Value = columnName;
        existsCommand.Parameters.Add(parameter);

        return Convert.ToBoolean(existsCommand.ExecuteScalar());
    }

    static void ExecuteSql(DbConnection connection, string sql)
    {
        using var command = connection.CreateCommand();
        command.CommandText = sql;
        command.ExecuteNonQuery();
    }

    if (ColumnExists(connection, "Email") && !ColumnExists(connection, "EmailAddress"))
    {
        ExecuteSql(connection, "ALTER TABLE \"Vendors\" RENAME COLUMN \"Email\" TO \"EmailAddress\";");
    }

    if (ColumnExists(connection, "Phone") && !ColumnExists(connection, "PhoneNumber"))
    {
        ExecuteSql(connection, "ALTER TABLE \"Vendors\" RENAME COLUMN \"Phone\" TO \"PhoneNumber\";");
    }

    ExecuteSql(connection, "ALTER TABLE \"Vendors\" ADD COLUMN IF NOT EXISTS \"IsActive\" boolean NOT NULL DEFAULT true;");
    ExecuteSql(connection, "ALTER TABLE \"Vendors\" ADD COLUMN IF NOT EXISTS \"CreatedAt\" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP;");
    ExecuteSql(connection, "ALTER TABLE \"Vendors\" ADD COLUMN IF NOT EXISTS \"UpdatedAt\" timestamp with time zone NULL;");
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

app.UseCors("AllowReactApp");

app.UseAuthorization();

app.MapControllers();

app.Run();

