# Use the official Microsoft .NET SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the csproj file and restore dependencies
COPY ["backend/VehicleInventorySystem.Api/VehicleInventorySystem.Api.csproj", "backend/VehicleInventorySystem.Api/"]
RUN dotnet restore "backend/VehicleInventorySystem.Api/VehicleInventorySystem.Api.csproj"

# Copy the remaining source files
COPY . .

# Build the project
WORKDIR "/src/backend/VehicleInventorySystem.Api"
RUN dotnet build "VehicleInventorySystem.Api.csproj" -c Release -o /app/build

# Publish the project to a lightweight folder
FROM build AS publish
RUN dotnet publish "VehicleInventorySystem.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official ASP.NET Core runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Configure ASP.NET Core to bind to port 10000 (Render's default port)
ENV ASPNETCORE_URLS=http://*:10000
EXPOSE 10000

# Set entry point to launch the C# Web API assembly
ENTRYPOINT ["dotnet", "VehicleInventorySystem.Api.dll"]
