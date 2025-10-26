import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { CalendarIcon, Trash2 } from "lucide-react";

interface Availability {
  id: string;
  available_from: string;
  available_to: string;
  notes: string | null;
}

export default function WorkerAvailability() {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAvailabilities();
  }, []);

  const loadAvailabilities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("worker_availability")
      .select("*")
      .eq("worker_id", user.id)
      .order("available_from", { ascending: true });

    if (error) {
      toast.error("Failed to load availabilities");
      return;
    }

    setAvailabilities(data || []);
  };

  const handleSave = async () => {
    if (!dateFrom || !dateTo) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (dateFrom > dateTo) {
      toast.error("End date must be after start date");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("worker_availability").insert({
      worker_id: user.id,
      available_from: format(dateFrom, "yyyy-MM-dd"),
      available_to: format(dateTo, "yyyy-MM-dd"),
      notes: notes.trim() || null
    });

    if (error) {
      toast.error("Failed to save availability");
    } else {
      toast.success("Availability saved successfully");
      setDateFrom(undefined);
      setDateTo(undefined);
      setNotes("");
      loadAvailabilities();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("worker_availability")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete availability");
    } else {
      toast.success("Availability deleted successfully");
      loadAvailabilities();
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">My Availability</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Add Availability Period</CardTitle>
              <CardDescription>
                Let farmers know when you're available for work
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Available From
                  </Label>
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border"
                  />
                </div>

                <div>
                  <Label className="mb-2 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Available To
                  </Label>
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    disabled={(date) => date < (dateFrom || new Date())}
                    className="rounded-md border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional information about your availability..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={loading} className="w-full">
                {loading ? "Saving..." : "Save Availability"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>My Availability Periods</CardTitle>
              <CardDescription>
                {availabilities.length} period{availabilities.length !== 1 ? "s" : ""} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {availabilities.map((availability) => (
                  <Card key={availability.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold">
                          {format(new Date(availability.available_from), "MMM dd, yyyy")} - {" "}
                          {format(new Date(availability.available_to), "MMM dd, yyyy")}
                        </p>
                        {availability.notes && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {availability.notes}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(availability.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {availabilities.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No availability periods set. Add one above to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
