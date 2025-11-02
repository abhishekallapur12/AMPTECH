import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogOut, Users, FileText, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminRequestsList from "@/components/admin/AdminRequestsList";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      // Verify admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (roleError || !roleData) {
        toast({
          title: "Access denied",
          description: "Admin privileges required",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/admin/login");
        return;
      }

      setUser(user);
      fetchStats();
    } catch (error: any) {
      console.error("Auth error:", error);
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: requests, error } = await supabase
        .from("service_requests")
        .select("status");

      if (error) throw error;

      setStats({
        total: requests?.length || 0,
        pending: requests?.filter((r) => r.status === "pending").length || 0,
        completed: requests?.filter((r) => r.status === "completed").length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out successfully",
    });
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">AMP Tech Admin</h1>
              <p className="text-sm text-muted-foreground">Service Management Dashboard</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<FileText className="w-8 h-8 text-primary" />}
            title="Total Requests"
            value={stats.total}
            color="bg-primary/10"
          />
          <StatCard
            icon={<Clock className="w-8 h-8 text-yellow-600" />}
            title="Pending"
            value={stats.pending}
            color="bg-yellow-100 dark:bg-yellow-900/20"
          />
          <StatCard
            icon={<CheckCircle className="w-8 h-8 text-green-600" />}
            title="Completed"
            value={stats.completed}
            color="bg-green-100 dark:bg-green-900/20"
          />
        </div>

        {/* Requests List */}
        <Card>
          <CardHeader>
            <CardTitle>Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminRequestsList onUpdate={fetchStats} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: number; color: string }) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminDashboard;
