using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using VehicleInventorySystem.Api.Configuration;
using VehicleInventorySystem.Api.Services.Interfaces;

namespace VehicleInventorySystem.Api.Services.Implementations;

public class SmtpEmailService : IEmailService
{
    private readonly SmtpSettings _settings;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IOptions<SmtpSettings> options, ILogger<SmtpEmailService> logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        if (string.IsNullOrWhiteSpace(_settings.FromEmail) && !string.IsNullOrWhiteSpace(_settings.Username))
        {
            _settings.FromEmail = _settings.Username;
        }

        if (!string.IsNullOrWhiteSpace(_settings.Password))
        {
            _settings.Password = _settings.Password.Replace(" ", string.Empty);
        }

        _logger.LogInformation("SMTP settings loaded: Host={Host}, Port={Port}, FromEmail={FromEmail}, Username={Username}, SenderName={SenderName}, EnableSsl={EnableSsl}",
            _settings.Host ?? "NULL",
            _settings.Port,
            _settings.FromEmail ?? "NULL",
            _settings.Username ?? "NULL",
            _settings.SenderName ?? "NULL",
            _settings.EnableSsl);

        if (!string.Equals(_settings.FromEmail, _settings.Username, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("SMTP FromEmail does not match Username. FromEmail={FromEmail}, Username={Username}",
                _settings.FromEmail ?? "NULL", _settings.Username ?? "NULL");
        }

        // Validate SMTP settings
        if (string.IsNullOrWhiteSpace(_settings.Host) || 
            string.IsNullOrWhiteSpace(_settings.FromEmail) || 
            string.IsNullOrWhiteSpace(_settings.Username) ||
            string.IsNullOrWhiteSpace(_settings.Password))
        {
            _logger.LogError("SMTP configuration is incomplete. Host: {Host}, FromEmail: {FromEmail}, Username: {Username}, Password: ***",
                _settings.Host ?? "NULL", _settings.FromEmail ?? "NULL", _settings.Username ?? "NULL");
            throw new InvalidOperationException("SMTP configuration is missing or invalid. Please check Host, FromEmail, Username, and Password.");
        }

        _logger.LogInformation("Preparing email: From={FromEmail}, To={ToEmail}, Subject={Subject}",
            _settings.FromEmail, toEmail, subject);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName ?? "System", _settings.FromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder();
        string trimmedBody = body.Trim();
        if (trimmedBody.StartsWith("<") || trimmedBody.Contains("<html>") || trimmedBody.Contains("<body>"))
        {
            bodyBuilder.HtmlBody = body;
        }
        else
        {
            bodyBuilder.TextBody = body;
        }
        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            var socketOptions = _settings.EnableSsl
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.None;

            _logger.LogInformation("Connecting to SMTP server: {Host}:{Port} with SecureSocketOptions={SocketOptions}",
                _settings.Host, _settings.Port, socketOptions);
            await client.ConnectAsync(_settings.Host, _settings.Port, socketOptions);

            _logger.LogInformation("Authenticating with SMTP using username: {Username}", _settings.Username);
            await client.AuthenticateAsync(_settings.Username, _settings.Password);

            _logger.LogInformation("Sending email message to: {ToEmail}", toEmail);
            await client.SendAsync(message);

            _logger.LogInformation("Email sent successfully to: {ToEmail}", toEmail);
        }
        catch (MailKit.ProtocolException protoEx)
        {
            _logger.LogError(protoEx, "SMTP protocol error: {Message}",
                protoEx.Message);
            throw new InvalidOperationException($"SMTP error: {protoEx.Message}", protoEx);
        }
        catch (MailKit.Security.AuthenticationException authEx)
        {
            _logger.LogError(authEx, "SMTP authentication failed. Check username and password.");
            throw new InvalidOperationException("SMTP authentication failed. Please verify Gmail app password.", authEx);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {ToEmail}. Exception type: {ExceptionType}, Message: {Message}",
                toEmail, ex.GetType().Name, ex.Message);
            throw;
        }
        finally
        {
            try
            {
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SMTP disconnect failed.");
            }
        }
    }
}
