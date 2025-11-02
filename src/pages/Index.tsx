import { Button } from "@/components/ui/button";
import { Calendar, Shield, Bell, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)] opacity-10"></div>
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
              Professional Machine Service
              <span className="block text-primary mt-2">Appointments Made Easy</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Book your machine maintenance appointments with AMP Tech Company. 
              Upload issue details, choose your preferred time, and get instant confirmation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/customer/signup">
                <Button size="lg" variant="accent" className="text-lg px-8">
                  Book Appointment
                </Button>
              </Link>
              <Link to="/admin/login">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Admin Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            Why Choose AMP Tech?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<Calendar className="w-10 h-10 text-primary" />}
              title="Easy Scheduling"
              description="View available slots and book appointments that fit your schedule"
            />
            <FeatureCard
              icon={<Shield className="w-10 h-10 text-primary" />}
              title="Secure Platform"
              description="Your data and machine details are protected with enterprise-grade security"
            />
            <FeatureCard
              icon={<Bell className="w-10 h-10 text-primary" />}
              title="Email Notifications"
              description="Get instant updates on your appointment status via email"
            />
            <FeatureCard
              icon={<CheckCircle className="w-10 h-10 text-primary" />}
              title="Track Progress"
              description="Monitor your service request from submission to completion"
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            How It Works
          </h2>
          <div className="max-w-4xl mx-auto space-y-8">
            <StepCard
              number={1}
              title="Create Your Account"
              description="Sign up with your details to get started with our service platform"
            />
            <StepCard
              number={2}
              title="Submit Service Request"
              description="Upload machine details, issue description, and photos for our technicians"
            />
            <StepCard
              number={3}
              title="Choose Appointment Time"
              description="Select from available time slots that work best for your schedule"
            />
            <StepCard
              number={4}
              title="Get Confirmation"
              description="Receive email notification once your appointment is confirmed by our team"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--gradient-hero)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Book your machine service appointment today
          </p>
          <Link to="/customer/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Create Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 AMP Tech Company. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="bg-card rounded-xl p-6 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-300">
    <div className="mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-card-foreground">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: number; title: string; description: string }) => (
  <div className="flex gap-6 items-start">
    <div className="flex-shrink-0 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
      {number}
    </div>
    <div>
      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Index;
