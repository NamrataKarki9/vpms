using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace VehicleInventorySystem.Api.Services;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string subject, string body);
}

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly SmtpSettings _settings;

    public EmailService(ILogger<EmailService> logger, IOptions<SmtpSettings> settings)
    {
        _logger = logger;
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        _logger.LogInformation("=============================================");
        _logger.LogInformation($"[EMAIL TO]: {toEmail}");
        _logger.LogInformation($"[SUBJECT]: {subject}");
        _logger.LogInformation("=============================================");

        if (!string.IsNullOrEmpty(_settings.Username) && !string.IsNullOrEmpty(_settings.Password))
        {
            using var client = new SmtpClient(_settings.Host, _settings.Port)
            {
                Credentials = new NetworkCredential(_settings.Username, _settings.Password),
                EnableSsl = _settings.EnableSsl
            };
            var mailMessage = new MailMessage(
                new MailAddress(_settings.FromEmail, _settings.FromName),
                new MailAddress(toEmail)
            )
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = body.TrimStart().StartsWith("<")
            };
            await client.SendMailAsync(mailMessage);
        }
        else
        {
            _logger.LogInformation($"[EMAIL BODY]:\n{body}");
        }
    }
}
