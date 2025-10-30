import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { RoleToggle } from "@/components/RoleToggle";
import logoImage from "@/assets/farmerchain-logo.png";

const CreateJobPosting = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    work_type_id: "",
    work_crop_type_id: "",
    location_state: "",
    location_district: "",
    location_address: "",
    estimated_budget: "",
    estimated_duration: "",
    start_date: "",
    end_date: "",
    tags: "",
  });

  const { data: workTypes } = useQuery({
    queryKey: ["work-types"],
    queryFn: async () => {
      const { data } = await supabase.from("work_types").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const { data: cropTypes } = useQuery({
    queryKey: ["crop-types"],
    queryFn: async () => {
      const { data } = await supabase.from("work_crop_types").select("*").eq("is_active", true);
      return data || [];
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const tags = formData.tags.split(",").map(t => t.trim()).filter(Boolean);

      const { error } = await supabase.from("job_postings").insert({
        farmer_id: user.id,
        title: formData.title,
        description: formData.description,
        work_type_id: formData.work_type_id || null,
        work_crop_type_id: formData.work_crop_type_id || null,
        location_state: formData.location_state,
        location_district: formData.location_district,
        location_address: formData.location_address || null,
        estimated_budget: formData.estimated_budget ? parseFloat(formData.estimated_budget) : null,
        estimated_duration: formData.estimated_duration || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        tags: tags.length > 0 ? tags : null,
      });

      if (error) throw error;

      toast.success("Job posting created successfully!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Failed to create job posting");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
            <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
          </div>
          <div className="flex gap-2 items-center">
            <RoleToggle />
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>Profile</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Job Posting</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="work_type">Work Type</Label>
                  <Select value={formData.work_type_id} onValueChange={(value) => setFormData({ ...formData, work_type_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select work type" />
                    </SelectTrigger>
                    <SelectContent>
                      {workTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="crop_type">Crop Type</Label>
                  <Select value={formData.work_crop_type_id} onValueChange={(value) => setFormData({ ...formData, work_crop_type_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select crop type" />
                    </SelectTrigger>
                    <SelectContent>
                      {cropTypes?.map((type: any) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.location_state}
                    onChange={(e) => setFormData({ ...formData, location_state: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="district">District *</Label>
                  <Input
                    id="district"
                    value={formData.location_district}
                    onChange={(e) => setFormData({ ...formData, location_district: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Full Address</Label>
                <Input
                  id="address"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="budget">Estimated Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.estimated_budget}
                    onChange={(e) => setFormData({ ...formData, estimated_budget: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="duration">Estimated Duration</Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 2 weeks"
                    value={formData.estimated_duration}
                    onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., urgent, experienced required"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Job Posting"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CreateJobPosting;
