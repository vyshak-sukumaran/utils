using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using WT.Domain.Entities;
using WT.Domain.Enums;
using WT.Infrastructure.Context;
using WT.Infrastructure.Queues.Modals;

namespace WT.Infrastructure.Services
{
    public interface IMailReminderService
    {
        Task<bool> DoWork(CancellationToken cancellationToken = default);
    }
    public class MailReminderService : IMailReminderService
    {
        private readonly MainDbContext _context;
        private readonly MailLoggerService _logger;
        public MailReminderService(MainDbContext context, MailLoggerService logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<bool> DoWork(CancellationToken ct)
        {
            _logger.LogMail("MailReminderService is now working.");

            var workItems = await _context.WorkItems
                .Where(item => !item.IsDeleted)
                .ToListAsync(ct);

            var workItemIDs = await ProcessWorkItems(workItems, ct);

            if (workItemIDs.Any())
            {
                await _context.SaveChangesAsync(ct);
                workItemIDs.Clear();
            }
            return true;
        }

        private async Task<List<string>> ProcessWorkItems(List<WorkItem> workItems, CancellationToken ct)
        {
            var workItemIDs = new List<string>();

            foreach (var workItem in workItems)
            {
                if (await HandleReminder(workItem, ct))
                {
                    workItemIDs.Add(workItem.Id.ToString());
                }
            }

            return workItemIDs;
        }

        private async Task<bool> HandleReminder(WorkItem workItem, CancellationToken ct)
        {
            var resolutionTime = await GetResolutionTime(workItem);
            var reminderFrequency = GetReminderFrequency(resolutionTime);
            var statusUpdatedOn = workItem.StatusUpdatedOn ?? DateTime.MinValue;
            var nextReminderDate = statusUpdatedOn + reminderFrequency;

            var reminder = await _context.WorkItemReminders.FirstOrDefaultAsync(rm => rm.WorkItemId == workItem.Id, ct);

            if (reminder == null)
            {
                statusUpdatedOn = ShouldSendReminder(nextReminderDate) ? DateTime.Now : statusUpdatedOn;
                reminder = CreateNewReminder(workItem, statusUpdatedOn, reminderFrequency);
                _context.Add(reminder);
            } else
            {
                nextReminderDate = reminder.NextReminderDate ?? nextReminderDate;
                if (ShouldSendReminder(nextReminderDate))
                {
                    UpdateExistingReminder(reminder, reminderFrequency);
                }
            }
            
            if (ShouldSendReminder(nextReminderDate))
            {
                AddToQueue(workItem);
                return true;
            }

            return false;
        }
        private static WorkItemReminder CreateNewReminder(WorkItem workItem, DateTime statusUpdatedOn, TimeSpan reminderFrequency)
        {
            return new WorkItemReminder
            {
                WorkItemId = workItem.Id,
                LastReminderSentOn = statusUpdatedOn,
                NextReminderDate = statusUpdatedOn + reminderFrequency
            };
        }
        private void UpdateExistingReminder(WorkItemReminder reminder, TimeSpan reminderFrequency)
        {
            _context.Entry(reminder).Reload();
            reminder.LastReminderSentOn = DateTime.Now;
            reminder.NextReminderDate = DateTime.Now + reminderFrequency;
            _context.Update(reminder);
        }
        private static bool ShouldSendReminder(DateTime? nextReminderDate)
        {
            return nextReminderDate.HasValue && nextReminderDate <= DateTime.Now;
        }

        private void AddToQueue(WorkItem workItem)
        {
            Console.WriteLine(workItem.Id);
            _context.Add(new Queue
            {
                Data = JsonSerializer.Serialize(new WorkItemStatusReminderQueueModal
                {
                    WorkItemId = workItem.Id,
                    StatusId = workItem.StatusId,
                    PriorityId = workItem.PriorityId,
                    AssigneeId = workItem.AssignedToId,
                    AssignerId = workItem.CurrentAssignmentBy,
                    Type = workItem.Type,
                    Title = workItem.Title
                }),
                Type = QueueType.WorkItemStatusReminder
            });
        }

        private async Task<float> GetResolutionTime(WorkItem workItem)
        {
            try
            {
                var resolutionTime = workItem.ResolutionTimeInHours;
                if (resolutionTime == null)
                {
                    var priority = await _context.WorkItemPriorities.FirstOrDefaultAsync(priority => priority.Id == workItem.PriorityId);
                    bool hasPriorityResolution = priority != null && !string.IsNullOrEmpty(priority.Resolution);
                    resolutionTime = hasPriorityResolution ? float.TryParse(priority.Resolution, out var result) ? result : 7 : 7;
                }
                return resolutionTime.Value;
            }
            catch
            {
                _logger.LogMail($@"MailReminderService failed to fetch resolution time for work item {workItem.Id}");
                return 7;
            }
        }

        private static TimeSpan GetReminderFrequency(float? hours)
        {
            if (hours <= 8)
            {
                return TimeSpan.FromDays(1);
            }
            else if (hours > 8 && hours <= 24)
            {
                return TimeSpan.FromDays(3);
            }
            else
            {
                return TimeSpan.FromDays(7);
            }
        }
    }
}
