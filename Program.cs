```csharp
var builder = WebApplication.CreateBuilder(args);
 
builder.Services.AddSignalR(); // Add SignalR services
 
var app = builder.Build();
 
app.UseRouting();
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<AttendeeHub>("/attendeeHub"); // Map SignalR Hub
});
app.Run();
```
