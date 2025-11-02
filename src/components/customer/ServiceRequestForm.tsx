import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Calendar } from "lucide-react";
import { z } from "zod";

const requestSchema = z.object({
  machineModel: z.string().min(2, "Machine model is required"),
  issueDescription: z.string().min(10, "Please provide more details about the issue"),
  preferredDate: z.string().min(1, "Please select a preferred date"),
  preferredTime: z.string().min(1, "Please select a preferred time"),
});

interface ServiceRequestFormProps {
  userId: string;
}

const ServiceRequestForm = ({ userId }: ServiceRequestFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    machineModel: "",
    issueDescription: "",
    preferredDate: "",
    preferredTime: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Image must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const validated = requestSchema.parse(formData);

      let imageUrl = null;

      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("machine-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("machine-images")
          .getPublicUrl(fileName);

        imageUrl = publicUrl;
      }

      // Create service request
      const { error } = await supabase
        .from("service_requests")
        .insert({
          user_id: userId,
          machine_model: validated.machineModel,
          issue_description: validated.issueDescription,
          image_url: imageUrl,
          preferred_date: validated.preferredDate,
          preferred_time: validated.preferredTime,
          status: "pending",
        });

      if (error) throw error;

      toast({
        title: "Request submitted successfully!",
        description: "Our team will review your request and get back to you soon.",
      });

      // Reset form
      setFormData({
        machineModel: "",
        issueDescription: "",
        preferredDate: "",
        preferredTime: "",
      });
      setImageFile(null);
      setImagePreview(null);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Submission failed",
          description: error.message || "Please try again",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Submit Service Request</CardTitle>
        <CardDescription>
          Provide details about your machine and the issue you're experiencing
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="machineModel">Machine Model</Label>
            <Input
              id="machineModel"
              value={formData.machineModel}
              onChange={(e) => setFormData({ ...formData, machineModel: e.target.value })}
              placeholder="e.g., XYZ-3000"
              required
            />
            {errors.machineModel && <p className="text-sm text-destructive mt-1">{errors.machineModel}</p>}
          </div>

          <div>
            <Label htmlFor="issueDescription">Issue Description</Label>
            <Textarea
              id="issueDescription"
              value={formData.issueDescription}
              onChange={(e) => setFormData({ ...formData, issueDescription: e.target.value })}
              placeholder="Describe the problem in detail..."
              rows={5}
              required
            />
            {errors.issueDescription && <p className="text-sm text-destructive mt-1">{errors.issueDescription}</p>}
          </div>

          <div>
            <Label htmlFor="image">Upload Image (Optional)</Label>
            <div className="mt-2">
              <label
                htmlFor="image"
                className="flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {imageFile ? imageFile.name : "Click to upload image (max 10MB)"}
                </span>
              </label>
              <input
                id="image"
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            {imagePreview && (
              <div className="mt-4">
                <img src={imagePreview} alt="Preview" className="max-w-xs rounded-lg shadow-md" />
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Preferred Date
              </Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
                required
              />
              {errors.preferredDate && <p className="text-sm text-destructive mt-1">{errors.preferredDate}</p>}
            </div>

            <div>
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                required
              />
              {errors.preferredTime && <p className="text-sm text-destructive mt-1">{errors.preferredTime}</p>}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading} variant="accent">
            {loading ? "Submitting..." : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ServiceRequestForm;
