import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, User, Image as ImageIcon } from "lucide-react";
import { format } from "date-fns";

interface ServiceRequest {
  id: string;
  user_id: string;
  machine_model: string;
  issue_description: string;
  image_url: string | null;
  status: string;
  preferred_date: string;
  preferred_time: string;
  scheduled_date: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
}

interface AdminRequestsListProps {
  onUpdate: () => void;
}

const AdminRequestsList = ({ onUpdate }: AdminRequestsListProps) => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-requests-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests'
        },
        () => {
          fetchRequests();
          onUpdate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: requestsData, error: requestsError } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestsError) throw requestsError;

      // Fetch profiles separately for each request
      const requestsWithProfiles = await Promise.all(
        (requestsData || []).map(async (request) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone")
            .eq("id", request.user_id)
            .single();

          return {
            ...request,
            profiles: profile || { full_name: "", email: "", phone: "" },
          };
        })
      );

      setRequests(requestsWithProfiles);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === "scheduled") {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          updateData.scheduled_date = new Date(`${request.preferred_date}T${request.preferred_time}`).toISOString();
        }
      }

      const { error } = await supabase
        .from("service_requests")
        .update(updateData)
        .eq("id", requestId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Request marked as ${newStatus}`,
      });

      fetchRequests();
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
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
    return <p className="text-center text-muted-foreground py-8">Loading requests...</p>;
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No service requests yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {requests.map((request) => (
        <div key={request.id} className="border rounded-lg p-6 space-y-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-semibold">{request.machine_model}</h3>
                <Badge className={getStatusColor(request.status)}>
                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{request.profiles.full_name}</span>
                <span>•</span>
                <span>{request.profiles.email}</span>
                <span>•</span>
                <span>{request.profiles.phone}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={request.status}
                onValueChange={(value) => handleStatusUpdate(request.id, value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2">Issue Description</h4>
            <p className="text-muted-foreground text-sm">{request.issue_description}</p>
          </div>

          {request.image_url && (
            <div>
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Machine Image
              </h4>
              <img
                src={request.image_url}
                alt="Machine issue"
                className="max-w-md rounded-lg shadow-md"
              />
            </div>
          )}

          <div className="flex items-center gap-6 pt-4 border-t text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Preferred:</span>
              <span className="font-medium">
                {format(new Date(request.preferred_date), "MMM dd, yyyy")} at {request.preferred_time}
              </span>
            </div>
            {request.scheduled_date && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-muted-foreground">Scheduled:</span>
                <span className="font-medium text-green-600">
                  {format(new Date(request.scheduled_date), "MMM dd, yyyy 'at' HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AdminRequestsList;
