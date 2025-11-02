import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface ServiceRequest {
  id: string;
  machine_model: string;
  issue_description: string;
  image_url: string | null;
  status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  created_at: string;
}

interface ServiceRequestsListProps {
  userId: string;
}

const ServiceRequestsList = ({ userId }: ServiceRequestsListProps) => {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('service-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("service_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-500",
      accepted: "bg-blue-500",
      scheduled: "bg-green-500",
      completed: "bg-gray-500",
      rejected: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  if (loading) {
    return <p className="text-center text-muted-foreground">Loading requests...</p>;
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No service requests yet</p>
          <p className="text-sm text-muted-foreground mt-2">Submit your first request to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id} className="hover:shadow-[var(--shadow-elevated)] transition-shadow">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{request.machine_model}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(request.created_at), "MMM dd, yyyy")}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(request.status)}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Issue Description</h4>
              <p className="text-muted-foreground text-sm">{request.issue_description}</p>
            </div>

            {request.image_url && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Attached Image
                </h4>
                <img
                  src={request.image_url}
                  alt="Machine issue"
                  className="max-w-sm rounded-lg shadow-md"
                />
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Preferred Date & Time</p>
                <p className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  {format(new Date(request.preferred_date), "MMM dd, yyyy")} at {request.preferred_time}
                </p>
              </div>
              {request.scheduled_date && (
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled For</p>
                  <p className="font-medium text-green-600">
                    {format(new Date(request.scheduled_date), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ServiceRequestsList;
