import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RoleToggle } from "@/components/RoleToggle";
import { WorkerQuoteForm } from "@/components/quotes/WorkerQuoteForm";
import logoImage from "@/assets/farmerchain-logo.png";

const JobPostings = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const { data: jobPostings, isLoading } = useQuery({
    queryKey: ["job-postings"],
    queryFn: async () => {
      // Use public_job_postings view which excludes precise coordinates for privacy
      const { data, error } = await supabase
        .from("public_job_postings")
        .select(`
          *,
          work_types(name),
          work_crop_types(name),
          farmer:farmer_id(full_name, state, district)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary">
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <img src={logoImage} alt="Logo" className="h-8 w-auto" style={{ imageRendering: 'crisp-edges' }} />
              <h1 className="text-2xl font-bold text-primary">FarmerChain</h1>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <RoleToggle />
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Dashboard</Button>
            <Button variant="outline" onClick={() => navigate("/profile")}>Profile</Button>
            <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Available Job Postings</h2>
            <p className="text-muted-foreground">Browse and apply for jobs</p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading job postings...</div>
        ) : jobPostings && jobPostings.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobPostings.map((job: any) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <span className="flex-1">{job.title}</span>
                    <Badge variant="secondary">
                      ₹{job.estimated_budget}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {job.farmer?.full_name} • {job.location_district}, {job.location_state}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4 line-clamp-3">{job.description}</p>
                  <div className="space-y-2">
                    {job.work_types && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{job.work_types.name}</Badge>
                      </div>
                    )}
                    {job.work_crop_types && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{job.work_crop_types.name}</Badge>
                      </div>
                    )}
                    {job.estimated_duration && (
                      <p className="text-sm text-muted-foreground">
                        Duration: {job.estimated_duration}
                      </p>
                    )}
                    {job.tags && job.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {job.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1" onClick={() => navigate(`/chat`)}>
                      Contact Farmer
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="flex-1"
                      onClick={() => {
                        setSelectedJob(job);
                        setQuoteDialogOpen(true);
                      }}
                    >
                      Submit Quote
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No job postings available at the moment.</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Submit a Quote</DialogTitle>
              <DialogDescription>
                Send your proposal for: {selectedJob?.title}
              </DialogDescription>
            </DialogHeader>
            {selectedJob && (
              <WorkerQuoteForm
                farmerId={selectedJob.farmer_id}
                jobPostingId={selectedJob.id}
                onSuccess={() => {
                  setQuoteDialogOpen(false);
                  setSelectedJob(null);
                }}
                onCancel={() => setQuoteDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default JobPostings;
