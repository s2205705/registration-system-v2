using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
 
public class AttendeeHub : Hub
{
    // Broadcast the updated attendee list to all connected clients
    public async Task BroadcastAttendeeList(List<Attendee> attendees)
    {
        await Clients.All.SendAsync("ReceiveAttendeeList", attendees);
    }
 
    // Notify clients when a new attendee is added
    public async Task NotifyNewAttendee(Attendee attendee)
    {
        await Clients.All.SendAsync("NewAttendeeAdded", attendee);
    }
 
    // Notify when presence is updated
    public async Task UpdatePresence(int attendeeId, bool isPresent)
    {
        await Clients.All.SendAsync("PresenceUpdated", attendeeId, isPresent);
    }
}
 
// Attendee Model (for serialization)
public class Attendee
{
    public int Id { get; set; }
    public string LastName { get; set; }
    public string FirstName { get; set; }
    public string Company { get; set; }
    public string Email { get; set; }
    public bool Present { get; set; }
}
